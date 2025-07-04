'use client';

import React, { useState, useRef, useEffect } from 'react';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

import { LanguageToggle } from '@/components/language-toggle';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { Button } from '@/components/ui/button';
import { Loader2, Bot, RefreshCw, Maximize, Minimize, FileUp, Download } from 'lucide-react';
import { useLanguage } from '@/context/language-context';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { generateDashboard, type DashboardLayout } from '@/ai/flows/generate-dashboard';
import { Tooltip, TooltipContent, TooltipProvider } from '@/components/ui/tooltip';
import { KpiCard } from '@/components/analytics/kpi-card';
import { AnalyticsBarChart } from '@/components/analytics/analytics-bar-chart';
import { AnalyticsPieChart } from '@/components/analytics/analytics-pie-chart';
import { AnalyticsTable } from '@/components/analytics/analytics-table';

export default function DataAnalyticsPage() {
  const { t, language, dir } = useLanguage();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const fullscreenRef = useRef<HTMLDivElement>(null);
  const dashboardRef = useRef<HTMLDivElement>(null);

  const [isDashboardLoading, setIsDashboardLoading] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  
  const [fileContent, setFileContent] = useState<string | null>(null);
  const [fileType, setFileType] = useState<'csv' | 'pdf' | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [dashboardLayout, setDashboardLayout] = useState<DashboardLayout | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    const savedContent = localStorage.getItem('sasha-da-content');
    const savedType = localStorage.getItem('sasha-da-type') as 'csv' | 'pdf' | null;
    const savedName = localStorage.getItem('sasha-da-name');
    if (savedContent && savedType && savedName) {
      setFileContent(savedContent);
      setFileType(savedType);
      setFileName(savedName);
      handleGenerateDashboard(savedContent, savedType);
    }
  }, [t]);

  useEffect(() => {
    const handleFullscreenChange = () => {
        setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => {
        document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, []);

  const toggleFullscreen = () => {
    if (!fullscreenRef.current) return;
    if (!document.fullscreenElement) {
        fullscreenRef.current.requestFullscreen().catch(err => {
            alert(`Error attempting to enable full-screen mode: ${err.message} (${err.name})`);
        });
    } else {
        document.exitFullscreen();
    }
  };

  const handleClearSession = () => {
    setFileContent(null);
    setFileType(null);
    setFileName(null);
    setDashboardLayout(null);
    localStorage.removeItem('sasha-da-content');
    localStorage.removeItem('sasha-da-type');
    localStorage.removeItem('sasha-da-name');
    toast({
        title: t('sessionClearedTitle'),
        description: t('sessionClearedDesc'),
    });
  };
  
  const handleGenerateDashboard = async (content: string, type: 'csv' | 'pdf') => {
    setIsDashboardLoading(true);
    setDashboardLayout(null);
    try {
      const payload = type === 'pdf' 
        ? { pdfDataUri: content, language } 
        : { csvContent: content, language };
      
      const layout = await generateDashboard(payload);
      setDashboardLayout(layout);
    } catch (error) {
      console.error("Error generating dashboard:", error);
      toast({
        variant: 'destructive',
        title: t('genericErrorTitle'),
        description: t('daDashboardGenError'),
      });
      handleClearSession();
    } finally {
      setIsDashboardLoading(false);
    }
  };
  
  const setFile = (content: string, type: 'csv' | 'pdf', name: string) => {
    setFileContent(content);
    setFileType(type);
    setFileName(name);
    localStorage.setItem('sasha-da-content', content);
    localStorage.setItem('sasha-da-type', type);
    localStorage.setItem('sasha-da-name', name);
    handleGenerateDashboard(content, type);
  }

  const handleFileImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    handleClearSession();
    toast({
        title: t('daFileProcessingTitle'),
        description: t('daFileProcessingDesc', { fileName: file.name }),
    });

    const reader = new FileReader();
    
    if (file.type === 'application/pdf') {
        reader.readAsDataURL(file);
        reader.onload = (event) => {
            const dataUri = event.target?.result as string;
            setFile(dataUri, 'pdf', file.name);
        };
    } else {
        reader.readAsBinaryString(file);
        reader.onload = (event) => {
            try {
                const data = event.target?.result;
                const workbook = XLSX.read(data, { type: 'binary' });
                const sheetName = workbook.SheetNames[0];
                const worksheet = workbook.Sheets[sheetName];
                const csvString = XLSX.utils.sheet_to_csv(worksheet);
                setFile(csvString, 'csv', file.name);
            } catch (error) {
                console.error("Error importing file:", error);
                toast({ variant: 'destructive', title: t('importFailedTitle'), description: t('importFailedDesc') });
                handleClearSession();
            }
        };
    }

    reader.onerror = () => {
        toast({ variant: 'destructive', title: t('importFailedTitle'), description: t('importFailedDesc') });
        handleClearSession();
    }

    if(e.target) e.target.value = '';
  };
  
  const handleDownloadPdf = () => {
    if (!dashboardRef.current || isDownloading) return;

    setIsDownloading(true);
    toast({
        title: t('generatingPdf'),
    });

    html2canvas(dashboardRef.current, {
        useCORS: true,
        scale: 2,
        backgroundColor: null, // Use transparent background, so parent page background is used
    }).then((canvas) => {
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
        
        pdf.save(`${dashboardLayout?.title.replace(/ /g, '_') || 'dashboard'}.pdf`);
    }).catch(err => {
        console.error("PDF Generation Error:", err);
        toast({
            variant: 'destructive',
            title: t('genericErrorTitle'),
            description: t('pdfGenError'),
        });
    }).finally(() => {
        setIsDownloading(false);
    });
  };

  const renderDashboardItem = (item: DashboardLayout['items'][0], index: number) => {
    switch (item.type) {
      case 'kpi':
        return <KpiCard key={index} title={item.title} value={item.value} description={item.description} />;
      case 'bar':
        return (
          <Card key={index} className="col-span-1 md:col-span-2">
            <CardHeader><CardTitle>{item.title}</CardTitle></CardHeader>
            <CardContent><AnalyticsBarChart data={item.data} /></CardContent>
          </Card>
        );
      case 'pie':
        return (
          <Card key={index} className="col-span-1">
            <CardHeader><CardTitle>{item.title}</CardTitle></CardHeader>
            <CardContent><AnalyticsPieChart data={item.data} /></CardContent>
          </Card>
        );
      case 'table':
        return (
          <Card key={index} className="col-span-1 md:col-span-3">
            <CardHeader><CardTitle>{item.title}</CardTitle></CardHeader>
            <CardContent><AnalyticsTable headers={item.headers} rows={item.rows} /></CardContent>
          </Card>
        );
      default:
        return null;
    }
  };
  
  return (
    <div ref={fullscreenRef} className="flex flex-col h-screen bg-background text-foreground" dir={dir}>
       <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileImport}
        className="hidden"
        accept=".xlsx, .xls, .csv, .pdf"
      />
      <header className="grid grid-cols-3 items-center p-4 border-b shrink-0">
        <div className="justify-self-start flex items-center gap-2">
          <SidebarTrigger />
        </div>
        <h1 className="text-xl font-semibold tracking-tight justify-self-center">
          {t('dataAnalyticsTitle')}
        </h1>
        <div className="justify-self-end flex items-center gap-2">
            <TooltipProvider>
                <Tooltip>
                    <TooltipTrigger asChild>
                    <Button variant="ghost" size="icon" onClick={handleClearSession} disabled={isDashboardLoading || isDownloading}>
                        <RefreshCw className="h-5 w-5" />
                        <span className="sr-only">{t('refreshSession')}</span>
                    </Button>
                    </TooltipTrigger>
                    <TooltipContent><p>{t('refreshSession')}</p></TooltipContent>
                </Tooltip>
                 <Tooltip>
                    <TooltipTrigger asChild>
                      <Button variant="ghost" size="icon" onClick={handleDownloadPdf} disabled={isDownloading || !dashboardLayout}>
                          {isDownloading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Download className="h-5 w-5" />}
                          <span className="sr-only">{t('downloadDashboard')}</span>
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent><p>{t('downloadDashboard')}</p></TooltipContent>
                </Tooltip>
                <Tooltip>
                    <TooltipTrigger asChild>
                    <Button variant="ghost" size="icon" onClick={toggleFullscreen}>
                        {isFullscreen ? <Minimize className="h-5 w-5" /> : <Maximize className="h-5 w-5" />}
                        <span className="sr-only">{isFullscreen ? t('exitFullscreen') : t('fullscreen')}</span>
                    </Button>
                    </TooltipTrigger>
                    <TooltipContent><p>{isFullscreen ? t('exitFullscreen') : t('fullscreen')}</p></TooltipContent>
                </Tooltip>
            </TooltipProvider>
          <LanguageToggle />
        </div>
      </header>

      <main className="flex-1 overflow-auto p-4 md:p-6">
          {!fileContent ? (
               <Card className="w-full max-w-lg mx-auto text-center shadow-lg animate-in fade-in-50 duration-500">
                  <CardHeader>
                      <div className="mx-auto bg-primary/10 text-primary p-3 rounded-full mb-4">
                          <Bot className="w-10 h-10" />
                      </div>
                      <CardTitle>{t('daUploadPromptTitle')}</CardTitle>
                      <CardDescription>{t('daUploadPromptDesc')}</CardDescription>
                  </CardHeader>
                  <CardContent>
                      <Button onClick={() => fileInputRef.current?.click()}>
                          <FileUp className="mr-2 h-4 w-4" />
                          {t('daUploadButton')}
                      </Button>
                  </CardContent>
               </Card>
          ) : isDashboardLoading ? (
              <div className="flex flex-col items-center justify-center h-full text-center">
                  <Loader2 className="w-12 h-12 animate-spin text-primary mb-4" />
                  <h2 className="text-xl font-semibold">{t('daGeneratingDashboardTitle')}</h2>
                  <p className="text-muted-foreground">{t('daGeneratingDashboardDesc')}</p>
              </div>
          ) : dashboardLayout ? (
              <div ref={dashboardRef} className="max-w-4xl mx-auto animate-in fade-in-50 duration-500 space-y-6 bg-background p-4 sm:p-6">
                  <div className="text-center">
                    <h1 className="text-3xl font-bold tracking-tight">{dashboardLayout.title}</h1>
                    <p className="mt-2 text-lg text-muted-foreground">{dashboardLayout.executiveSummary}</p>
                  </div>
                   <Card>
                      <CardHeader>
                          <CardTitle>{t('detailedAnalysisTitle')}</CardTitle>
                      </CardHeader>
                      <CardContent>
                          <p className="whitespace-pre-wrap text-muted-foreground">{dashboardLayout.detailedAnalysis}</p>
                      </CardContent>
                    </Card>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                     {dashboardLayout.items.map(renderDashboardItem)}
                  </div>
              </div>
          ) : null}
      </main>
    </div>
  );
}
