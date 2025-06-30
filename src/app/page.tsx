'use client';

import { useState, useRef, useEffect } from 'react';
import { CornerDownLeft, Mic, FileUp, FileText, XCircle } from 'lucide-react';
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

type ReportToDownload = NonNullable<Message['analysisReport'] | Message['financialReport']>;
type ReportType = 'loan' | 'financial';


export default function Home() {
  const { t, language, dir } = useLanguage();

  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [csvData, setCsvData] = useState<string | null>(null);
  const [pdfData, setPdfData] = useState<string | null>(null);
  const [pdfFileName, setPdfFileName] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const pdfInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  
  const [downloadInfo, setDownloadInfo] = useState<{ type: ReportType; report: ReportToDownload } | null>(null);


  useEffect(() => {
    setMessages([{ id: '1', role: 'assistant', content: t('initialMessage') }]);
  }, [t]);

  useEffect(() => {
    try {
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
        const response = await analyzeLoan({ csvData, loanId });
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
        const response = await chat({ history: historyForApi, pdfDataUri: pdfData, language });
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
        const response = await analyzeFinancialStatement({ pdfDataUri: dataUri });
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
  
  const promptDownload = (type: ReportType, report: ReportToDownload | undefined) => {
    if (!report) return;
    setDownloadInfo({ type, report });
  };

  const generateLoanPdf = (report: Message['analysisReport'], lang: 'en' | 'ar') => {
    if (!report) return;

    const doc = new jsPDF();
    const isRtl = lang === 'ar';
    const align = isRtl ? 'right' : 'left';
    
    // For production applications, you would need to embed a font that supports Arabic characters.
    if (isRtl) {
      doc.setRtl(true);
      doc.setFont('Helvetica'); // A standard font, perfect rendering isn't guaranteed.
    }
    
    const titles = {
      en: {
        reportTitle: `Loan Analysis Report: ID ${report.loanId}`,
        summary: "Summary",
        prediction: "Prediction",
        eligibility: "Eligibility",
        generatedBy: "AI generated by Sasha"
      },
      ar: {
        reportTitle: `تقرير تحليل القرض: معرف ${report.loanId}`,
        summary: "ملخص",
        prediction: "توقع",
        eligibility: "الأهلية",
        generatedBy: "تم إنشاؤه بواسطة ساشا"
      }
    };
    const selectedTitles = titles[lang];

    let yPos = 22;
    const xPos = isRtl ? doc.internal.pageSize.width - 14 : 14;

    doc.setFontSize(18);
    doc.text(selectedTitles.reportTitle, xPos, yPos, { align });
    yPos += 18;

    const addSection = (title: string, content: string) => {
      doc.setFontSize(14);
      doc.text(title, xPos, yPos, { align });
      yPos += 8;
      doc.setFontSize(10);
      const splitContent = doc.splitTextToSize(content, 180);
      doc.text(splitContent, xPos, yPos, { align });
      yPos += (splitContent.length * 5) + 10;
    };

    addSection(selectedTitles.summary, report.summary);
    addSection(selectedTitles.prediction, report.prediction);
    addSection(selectedTitles.eligibility, report.eligibility);
    
    const pageHeight = doc.internal.pageSize.height || doc.internal.pageSize.getHeight();
    doc.setFontSize(8);
    doc.text(selectedTitles.generatedBy, xPos, pageHeight - 10, { align });

    doc.save(`loan-report-${report.loanId}-${lang}.pdf`);
  };
  
  const generateFinancialReportPdf = (report: Message['financialReport'], lang: 'en' | 'ar') => {
    if (!report) return;

    const doc = new jsPDF();
    const isRtl = lang === 'ar';
    const align = isRtl ? 'right' : 'left';

    if (isRtl) {
        doc.setRtl(true);
        doc.setFont('Helvetica');
    }

    const titles = {
      en: {
        reportTitle: "Financial Statement Analysis",
        summary: "Summary",
        prediction: "Prediction",
        creditScoreAssessment: "Credit Score Assessment",
        generatedBy: "AI generated by Sasha"
      },
      ar: {
        reportTitle: "تحليل البيان المالي",
        summary: "ملخص",
        prediction: "توقع",
        creditScoreAssessment: "تقييم الجدارة الائتمانية",
        generatedBy: "تم إنشاؤه بواسطة ساشا"
      }
    };
    const selectedTitles = titles[lang];
    
    let yPos = 22;
    const xPos = isRtl ? doc.internal.pageSize.width - 14 : 14;

    doc.setFontSize(18);
    doc.text(selectedTitles.reportTitle, xPos, yPos, { align });
    yPos += 18;

    const addSection = (title: string, content: string) => {
      doc.setFontSize(14);
      doc.text(title, xPos, yPos, { align });
      yPos += 8;
      doc.setFontSize(10);
      const splitContent = doc.splitTextToSize(content, 180);
      doc.text(splitContent, xPos, yPos, { align });
      
      const pageHeight = doc.internal.pageSize.height || doc.internal.pageSize.getHeight();
      if (yPos + (splitContent.length * 5) + 10 > pageHeight - 20) {
        doc.addPage();
        yPos = 20;
      } else {
        yPos += (splitContent.length * 5) + 10;
      }
    };

    addSection(selectedTitles.summary, report.summary);
    addSection(selectedTitles.prediction, report.prediction);
    addSection(selectedTitles.creditScoreAssessment, report.creditScorePrediction);

    const pageHeight = doc.internal.pageSize.height || doc.internal.pageSize.getHeight();
    doc.setFontSize(8);
    doc.text(selectedTitles.generatedBy, xPos, pageHeight - 10, { align });

    doc.save(`financial-report-${lang}.pdf`);
  };

  const handleFinalDownload = (lang: 'en' | 'ar') => {
    if (!downloadInfo) return;
    
    if (downloadInfo.type === 'loan') {
      generateLoanPdf(downloadInfo.report as Message['analysisReport'], lang);
    } else if (downloadInfo.type === 'financial') {
      generateFinancialReportPdf(downloadInfo.report as Message['financialReport'], lang);
    }
    
    setDownloadInfo(null);
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
                    <AlertDialogCancel>{t('cancel')}</AlertDialogCancel>
                    <AlertDialogAction onClick={() => handleFinalDownload('ar')}>{t('arabic')}</AlertDialogAction>
                    <AlertDialogAction onClick={() => handleFinalDownload('en')}>{t('english')}</AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>

      </div>
    </TooltipProvider>
  );
}
