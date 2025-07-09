'use client';

import React, { useState, useRef, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { CornerDownLeft, Mic, FileUp, FileText, XCircle, Loader2, Wand2, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { MessageList, type Message } from '@/components/chat/message-list';
import { FinancialReportChart } from '@/components/chat/financial-report-chart';
import { SashaAvatar } from '@/components/sasha-avatar';
import { chat } from '@/ai/flows/chat';
import { analyzeLoan } from '@/ai/flows/analyze-loan';
import { analyzeFinancialStatement } from '@/ai/flows/analyze-financial-statement';
import { useToast } from '@/hooks/use-toast';
import { LanguageToggle } from '@/components/language-toggle';
import { useLanguage } from '@/context/language-context';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { useSashaStatus } from '@/hooks/use-sasha-status';
import { SashaStatus } from '@/components/sasha-status';
import { SashaOffline } from '@/components/sasha-offline';

const ImageGenerationDialog = dynamic(
    () => import('@/components/chat/image-generation-dialog').then(mod => mod.ImageGenerationDialog), 
    { ssr: false }
);

const generateAndDownloadPdf = async (element: HTMLElement, fileName: string) => {
    try {
        const { default: jsPDF } = await import('jspdf');
        const { default: html2canvas } = await import('html2canvas');

        const canvas = await html2canvas(element, { useCORS: true, scale: 2 });
        const imgData = canvas.toDataURL('image/png');
        const pdf = new jsPDF('p', 'mm', 'a4');
        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = pdf.internal.pageSize.getHeight();
        const canvasWidth = canvas.width;
        const canvasHeight = canvas.height;
        const ratio = canvasWidth / canvasHeight;
        let imgWidth = pdfWidth;
        let imgHeight = imgWidth / ratio;
        let heightLeft = imgHeight;
        let position = 0;

        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pdfHeight;

        while (heightLeft > 0) {
            position = heightLeft - imgHeight;
            pdf.addPage();
            pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
            heightLeft -= pdfHeight;
        }
        
        pdf.save(fileName);
        return true;
    } catch (err) {
        console.error(err);
        return false;
    }
};

type ReportToDownload = NonNullable<Message['analysisReport'] | Message['financialReport']>;
type ReportType = 'loan' | 'financial';


export default function ChatPageClient() {
  const { t, language, dir } = useLanguage();
  const { isOnline, countdown } = useSashaStatus();
  const [hasMounted, setHasMounted] = useState(false);

  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [csvData, setCsvData] = useState<string | null>(null);
  const [csvFileName, setCsvFileName] = useState<string | null>(null);
  const [pdfData, setPdfData] = useState<string | null>(null);
  const [pdfFileName, setPdfFileName] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const pdfInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  
  const [downloadInfo, setDownloadInfo] = useState<{
    type: ReportType;
    report: ReportToDownload;
    inputs: {
      pdfDataUri?: string | null;
      csvData?: string | null;
      loanId?: string;
    }
  } | null>(null);

  const [pdfRenderContent, setPdfRenderContent] = useState<React.ReactNode | null>(null);
  const pdfContainerRef = useRef<HTMLDivElement>(null);
  const [isImageGenOpen, setIsImageGenOpen] = useState(false);
  const [isNewSessionDialogOpen, setIsNewSessionDialogOpen] = useState(false);

  useEffect(() => {
    setHasMounted(true);
  }, []);

  useEffect(() => {
    try {
      // Load chat history
      const savedMessages = localStorage.getItem('sasha-chat-history');
      if (savedMessages) {
        const parsedMessages = JSON.parse(savedMessages);
        if (Array.isArray(parsedMessages) && parsedMessages.length > 0) {
          setMessages(parsedMessages);
        } else {
          setMessages([{ id: '1', role: 'assistant', content: t('initialMessage') }]);
        }
      } else {
        setMessages([{ id: '1', role: 'assistant', content: t('initialMessage') }]);
      }

      // Removed loading files from localStorage to prevent quota errors
    } catch (error) {
      console.error("Failed to access localStorage:", error);
      setMessages([{ id: '1', role: 'assistant', content: t('initialMessage') }]);
    }
  }, [t]);
  
  useEffect(() => {
    // Save messages if a user has sent a message
    if (messages.some(m => m.role === 'user')) {
        try {
            localStorage.setItem('sasha-chat-history', JSON.stringify(messages));
        } catch (error) {
            console.error("Failed to save messages to localStorage:", error);
            toast({
                variant: 'destructive',
                title: t('sessionSaveErrorTitle'),
                description: t('sessionSaveErrorDesc')
            });
        }
    }
  }, [messages, t, toast]);

  useEffect(() => {
    if (pdfRenderContent && pdfContainerRef.current) {
        const performDownload = async () => {
            const fileName = downloadInfo?.type === 'loan'
              ? `loan-report-${(downloadInfo.report as NonNullable<Message['analysisReport']>)?.loanId}.pdf`
              : `financial-report.pdf`;
            
            const success = await generateAndDownloadPdf(pdfContainerRef.current!, fileName);

            if (!success) {
                toast({
                  variant: 'destructive',
                  title: t('genericErrorTitle'),
                  description: t('pdfGenerationError')
                });
            }

            setPdfRenderContent(null);
            setIsDownloading(false);
            setDownloadInfo(null);
        };
        // A small delay to ensure the chart has rendered before capturing
        setTimeout(performDownload, 500);
    }
  }, [pdfRenderContent, t, toast, downloadInfo]);
  
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const newUserMessage: Message = { id: Date.now().toString(), role: 'user', content: input };
    const newMessages = [...messages, newUserMessage];
    setMessages(newMessages);
    const currentInput = input;
    setInput('');
    setIsLoading(true);

    try {
      const loanAnalysisMatch = currentInput.trim().match(/^analyze loan id (\S+)/i);
      
      if (loanAnalysisMatch) {
        if (!csvData) {
          toast({ variant: 'destructive', title: t('genericErrorTitle'), description: t('uploadCsvFirst') });
          setMessages(prev => prev.slice(0, prev.length - 1)); // Remove user message
          setIsLoading(false);
          return;
        }
        
        const loanId = loanAnalysisMatch[1];
        setMessages(prev => [...prev, { id: Date.now().toString(), role: 'assistant', content: `Analyzing loan ID **${loanId}**...` }]);
        
        const report = await analyzeLoan({ csvData, loanId, language });
        const analysisMessage: Message = {
          id: Date.now().toString(),
          role: 'assistant',
          content: t('loanAnalysisHeader', { loanId }),
          analysisReport: { ...report, loanId },
        };
        setMessages(prev => [...prev, analysisMessage]);

      } else {
        const historyForApi = newMessages.map(({ id, analysisReport, financialReport, imageUrl, ...rest }) => rest);
        const response = await chat({ history: historyForApi, pdfDataUri: pdfData, csvData: csvData, language });
        const botResponse: Message = {
          id: Date.now().toString(),
          role: 'assistant',
          content: response.content,
        };
        setMessages(prev => [...prev, botResponse]);
      }
    } catch (error) {
      console.error(error);
      toast({
        variant: 'destructive',
        title: t('genericErrorTitle'),
        description: t('genericErrorDesc'),
      });
      setMessages(prev => [...prev, {
        id: Date.now().toString(),
        role: 'assistant',
        content: t('unableToAnalyzeMessage'),
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const text = e.target?.result as string;
        setCsvData(text);
        setCsvFileName(file.name);
        toast({
          title: t('csvUploadTitle'),
          description: t('csvUploadDesc', { fileName: file.name }),
        });
      };
      reader.readAsText(file);
    }
  };

  const handlePdfUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || file.type !== 'application/pdf') {
      toast({
        variant: 'destructive',
        title: t('invalidPdfTitle'),
        description: t('invalidPdfDesc'),
      });
      return;
    }
    
    setMessages(prev => [...prev, {
      id: Date.now().toString(),
      role: 'assistant',
      content: t('analyzingPdfMessage', { fileName: file.name }),
    }]);

    setIsLoading(true);
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = async (e) => {
      try {
        const dataUri = e.target?.result as string;
        const fileName = file.name;

        setPdfData(dataUri);
        setPdfFileName(fileName);
        toast({
          title: t('pdfUploadTitle'),
          description: t('pdfUploadDesc', { fileName }),
        });

        const report = await analyzeFinancialStatement({ pdfDataUri: dataUri, language });
        
        const reportMessage: Message = {
          id: Date.now().toString(),
          role: 'assistant',
          content: t('financialAnalysisHeader'),
          financialReport: report,
        };
        setMessages(prev => [...prev, reportMessage]);

      } catch (error) {
        console.error("PDF Analysis failed:", error);
        toast({
          variant: 'destructive',
          title: t('analysisFailedTitle'),
          description: t('analysisFailedDesc'),
        });
        setMessages(prev => [...prev, {
          id: Date.now().toString(),
          role: 'assistant',
          content: t('unableToAnalyzeMessage'),
        }]);
      } finally {
        setIsLoading(false);
        if (event.target) event.target.value = '';
      }
    };
  };

  const handleClearPdf = () => {
    setPdfData(null);
    setPdfFileName(null);
    toast({
      title: t('pdfClearedTitle'),
      description: t('pdfClearedDesc'),
    });
    setMessages(prev => [...prev, {
      id: Date.now().toString(),
      role: 'assistant',
      content: t('clearedPdfMessage')
    }]);
  };

  const handleClearCsv = () => {
    setCsvData(null);
    setCsvFileName(null);
    toast({
      title: t('csvClearedTitle'),
      description: t('csvClearedDesc'),
    });
    setMessages(prev => [...prev, {
      id: Date.now().toString(),
      role: 'assistant',
      content: t('clearedCsvMessage')
    }]);
  };
  
  const promptDownload = (type: ReportType, report: ReportToDownload | undefined) => {
    if (!report) return;

    const inputs = {
        pdfDataUri: type === 'financial' ? pdfData : null,
        csvData: type === 'loan' ? csvData : null,
        loanId: (report as NonNullable<Message['analysisReport']>)?.loanId
    };

    setDownloadInfo({ type, report, inputs });
  };

  const handleFinalDownload = async (lang: 'en' | 'ar') => {
    if (!downloadInfo || isDownloading) return;

    setIsDownloading(true);
    toast({ title: t('generatingTranslatedPdf') });

    try {
      let translatedReport: ReportToDownload;

      if (lang === language && downloadInfo.report) {
        translatedReport = downloadInfo.report;
      } else if (downloadInfo.type === 'financial' && downloadInfo.inputs.pdfDataUri) {
        translatedReport = await analyzeFinancialStatement({
          pdfDataUri: downloadInfo.inputs.pdfDataUri,
          language: lang,
        });
      } else if (downloadInfo.type === 'loan' && downloadInfo.inputs.csvData && downloadInfo.inputs.loanId) {
        const report = await analyzeLoan({
          csvData: downloadInfo.inputs.csvData,
          loanId: downloadInfo.inputs.loanId,
          language: lang,
        });
        translatedReport = { ...report, loanId: downloadInfo.inputs.loanId };
      } else {
        translatedReport = downloadInfo.report;
      }
      
      setPdfRenderContent(
        <PdfReportComponent
          report={translatedReport}
          type={downloadInfo.type}
          lang={lang}
        />
      );

    } catch (error) {
      console.error("Failed to generate translated report:", error);
      toast({
        variant: 'destructive',
        title: t('translationErrorTitle'),
        description: t('translationErrorDesc', { lang: lang === 'en' ? 'English' : 'Arabic' }),
      });
      setIsDownloading(false);
      setDownloadInfo(null);
    }
  };

  const getTranslatedTitles = (lang: 'en' | 'ar', report: ReportToDownload) => {
    const allTranslations = {
      en: {
        loanReportTitle: `Loan Analysis Report: ID ${(report as NonNullable<Message['analysisReport']>)?.loanId}`,
        financialReportTitle: "Financial Statement Analysis",
        summary: "Summary",
        prediction: "Prediction",
        eligibility: "Eligibility",
        creditScoreAssessment: "Credit Score Assessment",
        generatedBy: "AI generated by Sasha",
        trendsAndGraphsTitle: "Trends & Visualizations",
        identifiedFlawsTitle: "Identified Flaws & Risks",
        financialPerformanceTitle: "Financial Performance",
        revenue: "Revenue",
        netIncome: "Net Income",
      },
      ar: {
        loanReportTitle: `تقرير تحليل القرض: معرف ${(report as NonNullable<Message['analysisReport']>)?.loanId}`,
        financialReportTitle: "تحليل البيان المالي",
        summary: "ملخص",
        prediction: "توقع",
        eligibility: "الأهلية",
        creditScoreAssessment: "تقييم الجدارة الائتمانية",
        generatedBy: "تم إنشاؤه بواسطة ساشا",
        trendsAndGraphsTitle: "الاتجاهات والتصورات",
        identifiedFlawsTitle: "العيوب والمخاطر المحددة",
        financialPerformanceTitle: "الأداء المالي",
        revenue: "الإيرادات",
        netIncome: "صافي الدخل",
      }
    };
    return allTranslations[lang];
  };

  const onImageGenerated = (imageUrl: string, prompt: string) => {
    const imageMessage: Message = {
      id: Date.now().toString(),
      role: 'assistant',
      content: t('imageGenSuccess', { prompt }),
      imageUrl,
    };
    setMessages(prev => [...prev, imageMessage]);
  };

  const handleNewSession = () => {
    setMessages([{ id: '1', role: 'assistant', content: t('initialMessage') }]);
    try {
      localStorage.removeItem('sasha-chat-history');
    } catch (error) {
      console.error("Failed to clear localStorage:", error);
    }
    
    setCsvData(null);
    setCsvFileName(null);
    setPdfData(null);
    setPdfFileName(null);

    setInput('');
    setIsLoading(false);

    toast({
        title: t('newSessionTitle'),
        description: t('newSessionDesc'),
    });
    setIsNewSessionDialogOpen(false);
  };

  const PdfReportComponent = ({ report, type, lang }: { report: ReportToDownload; type: ReportType; lang: 'en' | 'ar' }) => {
    const selectedTitles = getTranslatedTitles(lang, report);
    const isRtl = lang === 'ar';
    let reportTitle = '';
    let reportContentHtml;

    if (type === 'loan' && 'eligibility' in report) {
      reportTitle = selectedTitles.loanReportTitle;
      reportContentHtml = (
        <>
          <h2 style={{ fontSize: '14px', fontWeight: 'bold', marginTop: '15px', marginBottom: '5px' }}>{selectedTitles.summary}</h2>
          <p style={{ fontSize: '11px', lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>{report.summary}</p>
          <h2 style={{ fontSize: '14px', fontWeight: 'bold', marginTop: '15px', marginBottom: '5px' }}>{selectedTitles.prediction}</h2>
          <p style={{ fontSize: '11px', lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>{report.prediction}</p>
          <h2 style={{ fontSize: '14px', fontWeight: 'bold', marginTop: '15px', marginBottom: '5px' }}>{selectedTitles.eligibility}</h2>
          <p style={{ fontSize: '11px', lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>{report.eligibility}</p>
        </>
      );
    } else if (type === 'financial' && 'creditScorePrediction' in report) {
      const financialReport = report as NonNullable<Message['financialReport']>;
      reportTitle = selectedTitles.financialReportTitle;
      
      const trendsHtml = financialReport.trendsAndGraphs ? (
        <>
          <h2 style={{ fontSize: '14px', fontWeight: 'bold', marginTop: '15px', marginBottom: '5px' }}>{selectedTitles.trendsAndGraphsTitle}</h2>
          <p style={{ fontSize: '11px', lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>{financialReport.trendsAndGraphs}</p>
        </>
      ) : null;
      
      const flawsHtml = (financialReport.identifiedFlaws && financialReport.identifiedFlaws.length > 0) ? (
        <>
          <h2 style={{ fontSize: '14px', fontWeight: 'bold', marginTop: '15px', marginBottom: '5px' }}>{selectedTitles.identifiedFlawsTitle}</h2>
          <ul style={{ padding: 0, margin: 0, listStyle: 'none' }}>
            {financialReport.identifiedFlaws.map((flaw, i) => (
              <li key={i} style={{ position: 'relative', padding: isRtl ? '0 20px 0 0' : '0 0 0 20px', marginBottom: '12px' }}>
                <span style={{ position: 'absolute', [isRtl ? 'right' : 'left']: 0, top: '5px', height: '8px', width: '8px', borderRadius: '50%', backgroundColor: '#ef4444' }}></span>
                <p style={{ fontSize: '11px', lineHeight: 1.6, whiteSpace: 'pre-wrap', margin: 0 }}>{flaw}</p>
              </li>
            ))}
          </ul>
        </>
      ) : null;

      const chartHtml = (financialReport.keyMetrics && financialReport.keyMetrics.length > 0) ? (
        <>
           <h2 style={{ fontSize: '14px', fontWeight: 'bold', marginTop: '15px', marginBottom: '5px' }}>{selectedTitles.financialPerformanceTitle}</h2>
           <div style={{ width: '680px' , height: '320px'}}>
              <FinancialReportChart 
                data={financialReport.keyMetrics} 
                revenueLabel={selectedTitles.revenue} 
                netIncomeLabel={selectedTitles.netIncome} 
                isAnimationActive={false}
              />
           </div>
        </>
      ) : null;

      reportContentHtml = (
        <>
          <h2 style={{ fontSize: '14px', fontWeight: 'bold', marginTop: '15px', marginBottom: '5px' }}>{selectedTitles.summary}</h2>
          <p style={{ fontSize: '11px', lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>{financialReport.summary}</p>
          {trendsHtml}
          {chartHtml}
          <h2 style={{ fontSize: '14px', fontWeight: 'bold', marginTop: '15px', marginBottom: '5px' }}>{selectedTitles.prediction}</h2>
          <p style={{ fontSize: '11px', lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>{financialReport.prediction}</p>
          <h2 style={{ fontSize: '14px', fontWeight: 'bold', marginTop: '15px', marginBottom: '5px' }}>{selectedTitles.creditScoreAssessment}</h2>
          <p style={{ fontSize: '11px', lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>{financialReport.creditScorePrediction}</p>
          {flawsHtml}
        </>
      );
    }
    
    return (
      <div 
        style={{ 
          width: '210mm', 
          padding: '15mm', 
          boxSizing: 'border-box',
          color: 'black',
          backgroundColor: 'white',
          fontFamily: isRtl ? "'Cairo', sans-serif" : "'Inter', sans-serif", 
          direction: isRtl ? 'rtl' : 'ltr' 
        }}
      >
        <h1 style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '20px', textAlign: isRtl ? 'right' : 'left' }}>{reportTitle}</h1>
        {reportContentHtml}
        <p style={{ fontSize: '9px', color: '#555', marginTop: '40px', textAlign: 'center' }}>{selectedTitles.generatedBy}</p>
      </div>
    );
  };

  if (!hasMounted) {
    return (
      <div className="flex flex-col h-screen" dir={dir}>
        <header className="grid grid-cols-3 items-center p-4 border-b shrink-0 bg-background/80 backdrop-blur-sm relative z-30">
          <div className="justify-self-start">
            <SidebarTrigger />
          </div>
          <h1 className="text-xl font-semibold tracking-tight justify-self-center">{t('pageTitle')}</h1>
          <div className="justify-self-end">
            <LanguageToggle />
          </div>
        </header>
        <main className="flex-1 overflow-y-auto flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </main>
      </div>
    );
  }

  return (
    <TooltipProvider delayDuration={0}>
      <div className="flex flex-col h-screen text-foreground animate-in fade-in-50 duration-500" dir={dir}>
        <header className="grid grid-cols-3 items-center p-4 border-b shrink-0 bg-background/80 backdrop-blur-sm relative z-30">
          <div className="justify-self-start">
            <SidebarTrigger />
          </div>
          <h1 className="text-xl font-semibold tracking-tight justify-self-center">{t('pageTitle')}</h1>
          <div className="justify-self-end flex items-center gap-2">
            <SashaStatus />
            <Tooltip>
                <TooltipTrigger asChild>
                    <Button variant="ghost" size="icon" onClick={() => setIsNewSessionDialogOpen(true)}>
                        <RefreshCw className="h-5 w-5" />
                        <span className="sr-only">{t('newSessionButton')}</span>
                    </Button>
                </TooltipTrigger>
                <TooltipContent>
                    <p>{t('newSessionButton')}</p>
                </TooltipContent>
            </Tooltip>
            <LanguageToggle />
          </div>
        </header>
        
        {isOnline ? (
          <>
            <main className="flex-1 overflow-y-auto">
              <MessageList 
                messages={messages} 
                isLoading={isLoading} 
                onDownloadLoanPdf={(report) => promptDownload('loan', report)}
                onDownloadFinancialReportPdf={(report) => promptDownload('financial', report)}
              />
            </main>
            
            <footer className="p-4 border-t shrink-0 bg-background">
              <div className="max-w-3xl mx-auto">
                {csvFileName && (
                  <div className="flex items-center justify-between p-2 mb-2 text-sm rounded-md bg-muted text-muted-foreground">
                    <div className="flex items-center gap-2 truncate">
                      <FileUp className="w-4 h-4 shrink-0" />
                      <span className="font-medium truncate">{t('analyzingFile', { fileName: csvFileName })}</span>
                    </div>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button type="button" variant="ghost" size="icon" onClick={handleClearCsv} className="w-6 h-6 shrink-0">
                          <XCircle className="w-4 h-4" />
                          <span className="sr-only">{t('clearCsvTooltip')}</span>
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>{t('clearCsvTooltip')}</TooltipContent>
                    </Tooltip>
                  </div>
                )}
                {pdfFileName && (
                  <div className="flex items-center justify-between p-2 mb-2 text-sm rounded-md bg-muted text-muted-foreground">
                    <div className="flex items-center gap-2 truncate">
                      <FileText className="w-4 h-4 shrink-0" />
                      <span className="font-medium truncate">{t('analyzingFile', { fileName: pdfFileName })}</span>
                    </div>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button type="button" variant="ghost" size="icon" onClick={handleClearPdf} className="w-6 h-6 shrink-0">
                          <XCircle className="w-4 h-4" />
                          <span className="sr-only">{t('clearPdfTooltip')}</span>
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>{t('clearPdfTooltip')}</TooltipContent>
                    </Tooltip>
                  </div>
                )}
                <form onSubmit={handleSendMessage} className="relative">
                  <Textarea
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder={t('placeholder')}
                    className="pr-40 sm:pr-48 md:pr-56 py-3 text-base resize-none"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleSendMessage(e);
                      }
                    }}
                    rows={1}
                  />
                  <div className="absolute top-1/2 right-2 sm:right-3 transform -translate-y-1/2 flex items-center space-x-0.5 sm:space-x-1">
                    <input type="file" ref={fileInputRef} onChange={handleFileUpload} accept=".csv" className="hidden" />
                    <input type="file" ref={pdfInputRef} onChange={handlePdfUpload} accept="application/pdf" className="hidden" />
                    
                    <Tooltip>
                        <TooltipTrigger asChild>
                        <Button type="button" variant="ghost" size="icon" className="h-9 w-9" onClick={() => setIsImageGenOpen(true)}>
                            <Wand2 className="w-5 h-5" />
                            <span className="sr-only">{t('imageDialogTitle')}</span>
                        </Button>
                        </TooltipTrigger>
                        <TooltipContent>{t('imageDialogTitle')}</TooltipContent>
                    </Tooltip>
                    
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button type="button" variant="ghost" size="icon" className="h-9 w-9" onClick={() => fileInputRef.current?.click()}>
                          <FileUp className="w-5 h-5" />
                          <span className="sr-only">{t('uploadCsvTooltip')}</span>
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>{t('uploadCsvTooltip')}</TooltipContent>
                    </Tooltip>

                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button type="button" variant="ghost" size="icon" className="h-9 w-9" onClick={() => pdfInputRef.current?.click()}>
                          <FileText className="w-5 h-5" />
                          <span className="sr-only">{t('uploadPdfTooltip')}</span>
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>{t('uploadPdfTooltip')}</TooltipContent>
                    </Tooltip>

                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button type="button" variant="ghost" size="icon" className="h-9 w-9" disabled>
                          <Mic className="w-5 h-5" />
                          <span className="sr-only">{t('micTooltip')}</span>
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>{t('micTooltip')}</TooltipContent>
                    </Tooltip>
                    
                    <Button type="submit" size="sm" className="h-9" disabled={isLoading || !input.trim()}>
                      <CornerDownLeft className="w-5 h-5" />
                      <span className="sr-only">{t('sendSr')}</span>
                    </Button>
                  </div>
                </form>
              </div>
            </footer>
          </>
        ) : (
          <SashaOffline countdown={countdown} />
        )}

        <AlertDialog open={isNewSessionDialogOpen} onOpenChange={setIsNewSessionDialogOpen}>
            <AlertDialogContent dir={dir}>
                <AlertDialogHeader>
                    <AlertDialogTitle>{t('newSessionConfirmTitle')}</AlertDialogTitle>
                    <AlertDialogDescription>{t('newSessionConfirmDescChat')}</AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel>{t('cancel')}</AlertDialogCancel>
                    <AlertDialogAction onClick={handleNewSession}>{t('newSessionConfirmButton')}</AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
        
        <AlertDialog open={!!downloadInfo} onOpenChange={(open) => !open && setDownloadInfo(null)}>
            <AlertDialogContent dir={dir}>
                <AlertDialogHeader>
                    <AlertDialogTitle>{t('choosePdfLanguageTitle')}</AlertDialogTitle>
                    <AlertDialogDescription>{t('choosePdfLanguageDesc')}</AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel disabled={isDownloading}>{t('cancel')}</AlertDialogCancel>
                    <AlertDialogAction onClick={() => handleFinalDownload('ar')} disabled={isDownloading}>
                      {isDownloading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      {t('arabic')}
                    </AlertDialogAction>
                    <AlertDialogAction onClick={() => handleFinalDownload('en')} disabled={isDownloading}>
                      {isDownloading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      {t('english')}
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>

        <ImageGenerationDialog
          open={isImageGenOpen}
          onOpenChange={setIsImageGenOpen}
          onImageGenerated={onImageGenerated}
        />

        {pdfRenderContent && (
          <div ref={pdfContainerRef} className="absolute -left-[9999px] -z-10">
            {pdfRenderContent}
          </div>
        )}
      </div>
    </TooltipProvider>
  );
}
