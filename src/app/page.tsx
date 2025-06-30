'use client';

import { useState, useRef, useEffect } from 'react';
import { CornerDownLeft, Mic, FileUp, FileText, XCircle, Loader2 } from 'lucide-react';
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
import { SashaAvatar } from '@/components/sasha-avatar';
import { chat } from '@/ai/flows/chat';
import { analyzeLoan } from '@/ai/flows/analyze-loan';
import { analyzeFinancialStatement } from '@/ai/flows/analyze-financial-statement';
import { useToast } from '@/hooks/use-toast';
import { LanguageToggle } from '@/components/language-toggle';
import { useLanguage } from '@/context/language-context';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

type ReportToDownload = NonNullable<Message['analysisReport'] | Message['financialReport']>;
type ReportType = 'loan' | 'financial';

export default function Home() {
  const { t, language, dir } = useLanguage();

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

  useEffect(() => {
    setMessages([{ id: '1', role: 'assistant', content: t('initialMessage') }]);
  }, [t]);

  useEffect(() => {
    try {
      const savedCsvData = localStorage.getItem('sasha-csv-data');
      const savedCsvFileName = localStorage.getItem('sasha-csv-filename');
      if (savedCsvData && savedCsvFileName) {
        setCsvData(savedCsvData);
        setCsvFileName(savedCsvFileName);
        toast({
          title: t('documentLoadedTitle'),
          description: t('documentLoadedDesc', { fileName: savedCsvFileName }),
        });
      }

      const savedPdfData = localStorage.getItem('sasha-pdf-data');
      const savedPdfFileName = localStorage.getItem('sasha-pdf-filename');
      if (savedPdfData && savedPdfFileName) {
        setPdfData(savedPdfData);
        setPdfFileName(savedPdfFileName);
        toast({
          title: t('documentLoadedTitle'),
          description: t('documentLoadedDesc', { fileName: savedPdfFileName }),
        });
      }
    } catch (error) {
      console.error("Failed to access localStorage:", error);
    }
  }, [t, toast]);
  
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const newUserMessage: Message = { id: Date.now().toString(), role: 'user', content: input };
    const newMessages = [...messages, newUserMessage];
    setMessages(newMessages);
    setInput('');
    setIsLoading(true);

    try {
      const loanAnalysisRegex = /analyze loan (\w+)/i;
      const loanMatch = input.match(loanAnalysisRegex);

      if (loanMatch && csvData) {
        const loanId = loanMatch[1];
        const response = await analyzeLoan({ csvData, loanId, language });
        const botResponse: Message = {
          id: Date.now().toString(),
          role: 'assistant',
          content: t('loanAnalysisHeader', { loanId }),
          analysisReport: { ...response, loanId },
        };
        setMessages(prev => [...prev, botResponse]);
      } else if (loanMatch && !csvData) {
        setMessages(prev => [...prev, { id: Date.now().toString(), role: 'assistant', content: t('uploadCsvFirst') }]);
      } else {
        const historyForApi = newMessages.map(({ id, analysisReport, financialReport, ...rest }) => rest);
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
        try {
          localStorage.setItem('sasha-csv-data', text);
          localStorage.setItem('sasha-csv-filename', file.name);
        } catch (error) {
          console.error("Failed to save CSV to localStorage:", error);
          toast({
            variant: 'destructive',
            title: t('sessionSaveErrorTitle'),
            description: t('sessionSaveErrorDesc')
          });
        }
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
    
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = async (e) => {
      const dataUri = e.target?.result as string;
      const fileName = file.name;

      setPdfData(dataUri);
      setPdfFileName(fileName);
      try {
        localStorage.setItem('sasha-pdf-data', dataUri);
        localStorage.setItem('sasha-pdf-filename', fileName);
      } catch (error) {
        console.error("Failed to save PDF to localStorage:", error);
        toast({
          variant: 'destructive',
          title: t('sessionSaveErrorTitle'),
          description: t('sessionSaveErrorDesc')
        });
      }

      toast({
        title: t('pdfUploadTitle'),
        description: t('pdfUploadDesc', { fileName }),
      });

      setIsLoading(true);
      setMessages(prev => [...prev, { id: Date.now().toString(), role: 'assistant', content: t('analyzingPdfMessage', { fileName }) }]);
      
      try {
        const response = await analyzeFinancialStatement({ pdfDataUri: dataUri, language });
        const botResponse: Message = {
          id: Date.now().toString(),
          role: 'assistant',
          content: t('financialAnalysisHeader'),
          financialReport: response,
        };
        setMessages(prev => [...prev, botResponse]);
      } catch (error) {
        console.error("Financial statement analysis failed:", error);
        toast({
          variant: 'destructive',
          title: t('analysisFailedTitle'),
          description: t('analysisFailedDesc'),
        });
        setMessages(prev => [...prev, { id: Date.now().toString(), role: 'assistant', content: t('unableToAnalyzeMessage') }]);
      } finally {
        setIsLoading(false);
      }
    };
  };

  const handleClearPdf = () => {
    setPdfData(null);
    setPdfFileName(null);
    try {
      localStorage.removeItem('sasha-pdf-data');
      localStorage.removeItem('sasha-pdf-filename');
    } catch (error) {
      console.error("Failed to clear localStorage:", error);
    }
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
    try {
      localStorage.removeItem('sasha-csv-data');
      localStorage.removeItem('sasha-csv-filename');
    } catch (error) {
      console.error("Failed to clear localStorage:", error);
    }
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
        loanId: (report as Message['analysisReport'])?.loanId
    };

    setDownloadInfo({ type, report, inputs });
  };

  const generatePdfFromHtml = (
    report: ReportToDownload,
    type: ReportType,
    lang: 'en' | 'ar'
  ) => {
    const reportElement = document.createElement('div');
    const isRtl = lang === 'ar';

    reportElement.style.fontFamily = isRtl ? "'Cairo', sans-serif" : "'Inter', sans-serif";
    reportElement.style.direction = isRtl ? 'rtl' : 'ltr';
    reportElement.style.position = 'absolute';
    reportElement.style.left = '-9999px';
    reportElement.style.width = '210mm';
    reportElement.style.padding = '15mm';
    reportElement.style.boxSizing = 'border-box';
    reportElement.style.color = '#000';
    reportElement.style.backgroundColor = '#fff';

    const selectedTitles = {
      en: {
        loanReportTitle: `Loan Analysis Report: ID ${(report as Message['analysisReport'])?.loanId}`,
        financialReportTitle: "Financial Statement Analysis",
        summary: "Summary",
        prediction: "Prediction",
        eligibility: "Eligibility",
        creditScoreAssessment: "Credit Score Assessment",
        generatedBy: "AI generated by Sasha"
      },
      ar: {
        loanReportTitle: `تقرير تحليل القرض: معرف ${(report as Message['analysisReport'])?.loanId}`,
        financialReportTitle: "تحليل البيان المالي",
        summary: "ملخص",
        prediction: "توقع",
        eligibility: "الأهلية",
        creditScoreAssessment: "تقييم الجدارة الائتمانية",
        generatedBy: "تم إنشاؤه بواسطة ساشا"
      }
    }[lang];

    let reportTitle = '';
    let reportContentHtml = '';

    if (type === 'loan' && 'eligibility' in report) {
      reportTitle = selectedTitles.loanReportTitle;
      reportContentHtml = `
        <h2 style="font-size: 14px; font-weight: bold; margin-top: 15px; margin-bottom: 5px;">${selectedTitles.summary}</h2>
        <p style="font-size: 11px; line-height: 1.6; white-space: pre-wrap;">${report.summary}</p>
        <h2 style="font-size: 14px; font-weight: bold; margin-top: 15px; margin-bottom: 5px;">${selectedTitles.prediction}</h2>
        <p style="font-size: 11px; line-height: 1.6; white-space: pre-wrap;">${report.prediction}</p>
        <h2 style="font-size: 14px; font-weight: bold; margin-top: 15px; margin-bottom: 5px;">${selectedTitles.eligibility}</h2>
        <p style="font-size: 11px; line-height: 1.6; white-space: pre-wrap;">${report.eligibility}</p>
      `;
    } else if (type === 'financial' && 'creditScorePrediction' in report) {
      reportTitle = selectedTitles.financialReportTitle;
      reportContentHtml = `
        <h2 style="font-size: 14px; font-weight: bold; margin-top: 15px; margin-bottom: 5px;">${selectedTitles.summary}</h2>
        <p style="font-size: 11px; line-height: 1.6; white-space: pre-wrap;">${report.summary}</p>
        <h2 style="font-size: 14px; font-weight: bold; margin-top: 15px; margin-bottom: 5px;">${selectedTitles.prediction}</h2>
        <p style="font-size: 11px; line-height: 1.6; white-space: pre-wrap;">${report.prediction}</p>
        <h2 style="font-size: 14px; font-weight: bold; margin-top: 15px; margin-bottom: 5px;">${selectedTitles.creditScoreAssessment}</h2>
        <p style="font-size: 11px; line-height: 1.6; white-space: pre-wrap;">${report.creditScorePrediction}</p>
      `;
    }

    reportElement.innerHTML = `
      <h1 style="font-size: 18px; font-weight: bold; margin-bottom: 20px; text-align: ${isRtl ? 'right' : 'left'};">${reportTitle}</h1>
      ${reportContentHtml}
      <p style="font-size: 9px; color: #555; margin-top: 40px; text-align: center;">${selectedTitles.generatedBy}</p>
    `;

    document.body.appendChild(reportElement);

    html2canvas(reportElement, {
      useCORS: true,
      scale: 2,
    }).then(canvas => {
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      const canvasWidth = canvas.width;
      const canvasHeight = canvas.height;
      const ratio = canvasWidth / canvasHeight;
      const imgWidth = pdfWidth;
      const imgHeight = imgWidth / ratio;
      
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
      
      const fileName = type === 'loan'
        ? `loan-report-${(report as Message['analysisReport'])?.loanId}-${lang}.pdf`
        : `financial-report-${lang}.pdf`;
      
      pdf.save(fileName);
      document.body.removeChild(reportElement);
    });
  };

  const handleFinalDownload = async (lang: 'en' | 'ar') => {
    if (!downloadInfo || isDownloading) return;

    setIsDownloading(true);
    toast({ title: t('generatingTranslatedPdf') });

    try {
      let translatedReport: ReportToDownload;

      if (downloadInfo.type === 'financial' && downloadInfo.inputs.pdfDataUri) {
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
        // Fallback to original report if inputs are missing for any reason
        translatedReport = downloadInfo.report;
      }
      
      generatePdfFromHtml(translatedReport, downloadInfo.type, lang);

    } catch (error) {
      console.error("Failed to generate translated report:", error);
      toast({
        variant: 'destructive',
        title: t('translationErrorTitle'),
        description: t('translationErrorDesc', { lang: lang === 'en' ? 'English' : 'Arabic' }),
      });
    } finally {
      setIsDownloading(false);
      setDownloadInfo(null);
    }
  };

  return (
    <TooltipProvider delayDuration={0}>
      <div className="flex flex-col h-screen text-foreground animate-in fade-in-50 duration-500" dir={dir}>
        <header className="flex items-center justify-between p-4 border-b shrink-0 bg-background/80 backdrop-blur-sm">
          <div className="flex items-center">
            <SashaAvatar className="w-8 h-8 mr-3" />
            <h1 className="text-xl font-semibold tracking-tight">{t('pageTitle')}</h1>
          </div>
          <LanguageToggle />
        </header>
        
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
                className="pr-48 py-3 text-base resize-none"
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSendMessage(e);
                  }
                }}
                rows={1}
              />
              <div className="absolute top-1/2 right-3 transform -translate-y-1/2 flex items-center space-x-1">
                <input type="file" ref={fileInputRef} onChange={handleFileUpload} accept=".csv" className="hidden" />
                <input type="file" ref={pdfInputRef} onChange={handlePdfUpload} accept="application/pdf" className="hidden" />
                
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button type="button" variant="ghost" size="icon" onClick={() => fileInputRef.current?.click()}>
                      <FileUp className="w-5 h-5" />
                      <span className="sr-only">{t('uploadCsvTooltip')}</span>
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>{t('uploadCsvTooltip')}</TooltipContent>
                </Tooltip>

                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button type="button" variant="ghost" size="icon" onClick={() => pdfInputRef.current?.click()}>
                      <FileText className="w-5 h-5" />
                      <span className="sr-only">{t('uploadPdfTooltip')}</span>
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>{t('uploadPdfTooltip')}</TooltipContent>
                </Tooltip>

                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button type="button" variant="ghost" size="icon" disabled>
                      <Mic className="w-5 h-5" />
                      <span className="sr-only">{t('micTooltip')}</span>
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>{t('micTooltip')}</TooltipContent>
                </Tooltip>
                
                <Button type="submit" size="sm" disabled={isLoading || !input.trim()}>
                  <CornerDownLeft className="w-5 h-5" />
                  <span className="sr-only">{t('sendSr')}</span>
                </Button>
              </div>
            </form>
          </div>
        </footer>
        
        <AlertDialog open={!!downloadInfo} onOpenChange={(open) => !open && setDownloadInfo(null)}>
            <AlertDialogContent dir={dir}>
                <AlertDialogHeader>
                    <AlertDialogTitle>{t('choosePdfLanguageTitle')}</AlertDialogTitle>
                    <AlertDialogDescription>{t('choosePdfLanguageDesc')}</AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel disabled={isDownloading}>{t('cancel')}</AlertDialogCancel>
                    <AlertDialogAction onClick={() => handleFinalDownload('ar')} disabled={isDownloading}>
                      {isDownloading && <Loader2 className="animate-spin" />}
                      {t('arabic')}
                    </AlertDialogAction>
                    <AlertDialogAction onClick={() => handleFinalDownload('en')} disabled={isDownloading}>
                      {isDownloading && <Loader2 className="animate-spin" />}
                      {t('english')}
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>

      </div>
    </TooltipProvider>
  );
}
