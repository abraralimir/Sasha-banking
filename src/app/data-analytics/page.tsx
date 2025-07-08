'use client';

import React, { useState, useRef } from 'react';
import { Bar, Pie } from 'react-chartjs-2';
import { 
  Chart as ChartJS, 
  CategoryScale, 
  LinearScale, 
  BarElement, 
  Title, 
  Tooltip as ChartTooltip, 
  Legend,
  ArcElement
} from 'chart.js';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

import { LanguageToggle } from '@/components/language-toggle';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { Button } from '@/components/ui/button';
import { Loader2, FileUp, Bot, RefreshCw, Lightbulb, FileText, BarChart3, PieChart, Download } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useLanguage } from '@/context/language-context';
import { useToast } from '@/hooks/use-toast';
import { generateDashboard, type GenerateDashboardOutput } from '@/ai/flows/generate-dashboard';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

ChartJS.register(CategoryScale, LinearScale, BarElement, ArcElement, Title, ChartTooltip, Legend);

// Helper function to get random colors for pie chart
const getPieChartColors = (numColors: number) => {
    const colors = [
      'hsl(12, 76%, 61%)',
      'hsl(173, 58%, 39%)',
      'hsl(197, 37%, 24%)',
      'hsl(43, 74%, 66%)',
      'hsl(27, 87%, 67%)',
      'hsl(222.2, 47.4%, 11.2%)',
      'hsl(210, 40%, 96.1%)',
      'hsl(0, 84.2%, 60.2%)',
    ];
    let result = [];
    for (let i = 0; i < numColors; i++) {
        result.push(colors[i % colors.length]);
    }
    return result;
}

export default function DataAnalyticsPage() {
  const { t, language, dir } = useLanguage();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dashboardRef = useRef<HTMLDivElement>(null);

  const [isLoading, setIsLoading] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [dashboardData, setDashboardData] = useState<GenerateDashboardOutput | null>(null);
  const [fileName, setFileName] = useState('');
  
  const handleClear = () => {
    setFileName('');
    setDashboardData(null);
    if (fileInputRef.current) {
        fileInputRef.current.value = '';
    }
    toast({
        title: t('newSessionTitle'),
        description: t('newSessionDescDA'),
    });
  };

  const handleDownloadPdf = () => {
    const input = dashboardRef.current;
    if (!input || !dashboardData) return;

    setIsDownloading(true);
    toast({ title: t('daGeneratingPdfTitle') });

    html2canvas(input, {
        scale: 2,
        useCORS: true,
        windowWidth: input.scrollWidth,
        windowHeight: input.scrollHeight
    }).then((canvas) => {
        const imgData = canvas.toDataURL('image/png');
        const pdf = new jsPDF({
            orientation: 'p',
            unit: 'mm',
            format: 'a4'
        });

        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = pdf.internal.pageSize.getHeight();
        
        const canvasWidth = canvas.width;
        const canvasHeight = canvas.height;

        const ratio = canvasWidth / canvasHeight;
        const imgHeight = pdfWidth / ratio;
        let heightLeft = imgHeight;
        let position = 0;

        pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, imgHeight);
        heightLeft -= pdfHeight;

        while (heightLeft > 0) {
            position -= pdfHeight;
            pdf.addPage();
            pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, imgHeight);
            heightLeft -= pdfHeight;
        }
        
        pdf.save(`${dashboardData.title.replace(/\s/g, '_')}_Report.pdf`);
    }).catch(err => {
        console.error("PDF generation failed:", err);
        toast({
            variant: 'destructive',
            title: t('daPdfGenerationFailedTitle'),
            description: t('daPdfGenerationFailedDesc'),
        });
    }).finally(() => {
        setIsDownloading(false);
    });
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    handleClear();
    setIsLoading(true);
    setFileName(file.name);

    try {
      if (!file.name.endsWith('.xlsx') && !file.name.endsWith('.csv') && !file.name.endsWith('.pdf')) {
        toast({
            variant: 'destructive',
            title: t('daUnsupportedFileType'),
            description: 'Please upload a CSV, XLSX, or PDF file.',
        });
        setIsLoading(false);
        handleClear();
        return;
      }

      const reader = new FileReader();
      reader.onload = async (event) => {
        try {
            const dataUri = event.target?.result as string;
            
            const result = await generateDashboard({ fileDataUri: dataUri, language });
            setDashboardData(result);

        } catch (error: any) {
            console.error("Analysis failed:", error);
            toast({
                variant: 'destructive',
                title: t('analysisFailedTitle'),
                description: error.message || t('daAnalysisFailedDesc'),
            });
            handleClear();
        } finally {
            setIsLoading(false);
            if(e.target) e.target.value = '';
        }
      };
      reader.readAsDataURL(file);

    } catch (error: any) {
      console.error("File upload failed:", error);
      toast({
        variant: 'destructive',
        title: t('analysisFailedTitle'),
        description: error.message,
      });
      handleClear();
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-screen bg-muted/40 text-foreground" dir={dir}>
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileUpload}
        className="hidden"
        accept=".xlsx,.csv,.pdf"
      />
      <header className="grid grid-cols-3 items-center p-4 border-b shrink-0 bg-background">
        <div className="justify-self-start flex items-center gap-2">
          <SidebarTrigger />
        </div>
        <h1 className="text-xl font-semibold tracking-tight justify-self-center">
          {t('dataAnalyticsTitle')}
        </h1>
        <div className="justify-self-end flex items-center gap-2">
          {fileName && !isLoading && (
            <TooltipProvider>
                <Tooltip>
                    <TooltipTrigger asChild>
                        <Button variant="ghost" size="icon" onClick={handleClear}>
                            <RefreshCw className="h-5 w-5" />
                            <span className="sr-only">{t('newSessionButton')}</span>
                        </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                        <p>{t('newSessionButton')}</p>
                    </TooltipContent>
                </Tooltip>
            </TooltipProvider>
          )}
          <LanguageToggle />
        </div>
      </header>

      <main className="flex-1 overflow-auto p-4 md:p-6">
        <div className="max-w-7xl mx-auto space-y-6">
            {!fileName ? (
                 <div className="w-full pt-8 md:pt-16 flex justify-center animate-in fade-in-50 duration-500">
                    <Card className="w-full max-w-lg text-center shadow-lg">
                        <CardHeader>
                            <div className="mx-auto bg-primary/10 text-primary p-3 rounded-full mb-4">
                                <Bot className="w-10 h-10" />
                            </div>
                            <CardTitle>{t('daUploadPromptTitle')}</CardTitle>
                            <CardDescription>{t('daUploadPromptDesc')}</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Button onClick={() => fileInputRef.current?.click()} disabled={isLoading}>
                                <FileUp className="mr-2 h-4 w-4" />
                                {t('daUploadButton')}
                            </Button>
                        </CardContent>
                    </Card>
                 </div>
            ) : isLoading ? (
                <div className="flex flex-col items-center justify-center h-full text-center pt-24">
                    <Loader2 className="w-12 h-12 animate-spin text-primary mb-4" />
                    <h2 className="text-xl font-semibold">{t('daGeneratingDashboardTitle')}</h2>
                    <p className="text-muted-foreground">{t('daGeneratingDashboardDesc')}</p>
                </div>
            ) : dashboardData && (
                <div ref={dashboardRef} className="animate-in fade-in-50 duration-500 space-y-6 bg-muted/40 p-4 md:p-6 rounded-lg">
                    <Card>
                        <CardHeader>
                            <CardTitle>{dashboardData.title}</CardTitle>
                            <CardDescription>{fileName}</CardDescription>
                        </CardHeader>
                    </Card>
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        <Card className="lg:col-span-3">
                            <CardHeader className="flex flex-row items-center gap-3 space-y-0">
                                <FileText className="w-6 h-6 text-primary"/>
                                <CardTitle>{t('daSummaryTitle')}</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="text-muted-foreground whitespace-pre-wrap">{dashboardData.summary}</p>
                            </CardContent>
                        </Card>
                        
                        {dashboardData.charts.map((chart, index) => (
                          <Card key={index} className={dashboardData.charts.length === 1 ? 'lg:col-span-3' : (chart.type === 'bar' ? 'lg:col-span-2' : 'lg:col-span-1') }>
                              <CardHeader className="flex flex-row items-center gap-3 space-y-0">
                                  {chart.type === 'bar' ? <BarChart3 className="w-6 h-6 text-primary"/> : <PieChart className="w-6 h-6 text-primary"/>}
                                  <CardTitle>{chart.title}</CardTitle>
                              </CardHeader>
                              <CardContent>
                                  <div className="h-[300px] md:h-[400px]">
                                      {chart.type === 'bar' ? (
                                          <Bar data={{ ...chart.data, datasets: chart.data.datasets.map(ds => ({...ds, backgroundColor: getPieChartColors(chart.data.labels.length) })) }} options={{ responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'top' } } }} />
                                      ) : (
                                          <div className="h-full w-full flex items-center justify-center">
                                            <Pie data={{ ...chart.data, datasets: chart.data.datasets.map(ds => ({...ds, backgroundColor: getPieChartColors(chart.data.labels.length) })) }} options={{ responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'right' } } }} />
                                          </div>
                                      )}
                                  </div>
                              </CardContent>
                          </Card>
                        ))}
                        
                         <Card className="lg:col-span-3">
                            <CardHeader className="flex flex-row items-center gap-3 space-y-0">
                                <Lightbulb className="w-6 h-6 text-primary"/>
                                <CardTitle>{t('daKeyInsightsTitle')}</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <ul className="space-y-2 text-muted-foreground">
                                {dashboardData.keyInsights.map((insight, i) => (
                                    <li key={i} className="flex items-start gap-3">
                                        <span className="mt-1.5 h-2 w-2 rounded-full bg-primary/70 shrink-0"/>
                                        <span>{insight}</span>
                                    </li>
                                ))}
                                </ul>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            )}
        </div>
      </main>
      <footer className="p-4 border-t shrink-0 bg-background">
        <div className="max-w-7xl mx-auto flex justify-end">
          {dashboardData && !isLoading && (
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={handleDownloadPdf} disabled={isDownloading}>
                {isDownloading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Download className="mr-2 h-4 w-4" />}
                {t('daDownloadPdfButton')}
              </Button>
            </div>
          )}
        </div>
      </footer>
    </div>
  );
}
