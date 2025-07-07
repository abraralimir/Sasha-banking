'use client';

import React, { useState, useRef } from 'react';
import { Bar } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from 'chart.js';
import * as XLSX from 'xlsx';
import * as pdfjsLib from 'pdfjs-dist';
import * as dfd from 'danfojs';

import { LanguageToggle } from '@/components/language-toggle';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { Button } from '@/components/ui/button';
import { Loader2, FileUp, Bot, RefreshCw } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useLanguage } from '@/context/language-context';
import { useToast } from '@/hooks/use-toast';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);
pdfjsLib.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`;

export default function DataAnalyticsPage() {
  const { t, dir } = useLanguage();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const summarizerPipelineRef = useRef<any>(null);

  const [isLoading, setIsLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState('');
  const [summary, setSummary] = useState('');
  const [chartData, setChartData] = useState<any>(null);
  const [fileName, setFileName] = useState('');

  const getSummarizer = async (progress_callback?: (progress: any) => void) => {
    if (!summarizerPipelineRef.current) {
      const { pipeline } = await import('@xenova/transformers');
      summarizerPipelineRef.current = await pipeline('summarization', 'Xenova/t5-small', { progress_callback });
    }
    return summarizerPipelineRef.current;
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsLoading(true);
    setSummary('');
    setChartData(null);
    setFileName(file.name);

    try {
      let jsonData: any[] = [];

      if (file.name.endsWith('.xlsx') || file.name.endsWith('.csv')) {
        setLoadingMessage(t('daParsingFile'));
        const data = await file.arrayBuffer();
        const workbook = XLSX.read(data, { type: 'array' });
        const sheet = workbook.Sheets[workbook.SheetNames[0]];
        jsonData = XLSX.utils.sheet_to_json(sheet);
      
      } else if (file.name.endsWith('.pdf')) {
        setLoadingMessage(t('daParsingFile'));
        const data = await file.arrayBuffer();
        const pdf = await pdfjsLib.getDocument({ data }).promise;
        const pages = [];
        for (let i = 1; i <= pdf.numPages; i++) {
          const page = await pdf.getPage(i);
          const textContent = await page.getTextContent();
          pages.push(textContent.items.map((item: any) => item.str).join(' '));
        }
        const fullText = pages.join('\n');
        
        setLoadingMessage(t('daSummarizingPdf'));
        const summarizer = await getSummarizer((p: any) => {
            if (p.status === 'progress') {
                const progress = (p.progress || 0).toFixed(2);
                setLoadingMessage(`${t('daSummarizingPdf')} (${progress}%)`);
            }
        });
        const output = await summarizer(fullText, {
            max_length: 200,
            min_length: 30,
        });
        setSummary(output[0].summary_text);
        setIsLoading(false);
        return;
      }

      if (jsonData.length > 0) {
        setLoadingMessage(t('daAnalyzingData'));
        const df = new dfd.DataFrame(jsonData);
        
        let categoricalColumn = df.columns.find(col => df[col].dtype === 'string');
        if (!categoricalColumn) {
            categoricalColumn = df.columns[1] || df.columns[0];
        }

        const valueCounts = df[categoricalColumn].valueCounts();
        
        setChartData({
          labels: valueCounts.index.slice(0, 15),
          datasets: [
            {
              label: t('daChartLabel', { column: categoricalColumn }),
              data: valueCounts.values.slice(0, 15),
              backgroundColor: 'hsl(var(--primary) / 0.6)',
              borderColor: 'hsl(var(--primary))',
              borderWidth: 1,
            },
          ],
        });

        setLoadingMessage(t('daGeneratingSummary'));
        const summarizer = await getSummarizer();
        const analysisText = `Analysis of ${fileName}: The dataset has ${df.shape[0]} rows and ${df.shape[1]} columns. Columns are: ${df.columns.join(', ')}. The analysis of column "${categoricalColumn}" shows various categories.`;
        const output = await summarizer(analysisText, {
            max_length: 150,
            min_length: 25,
        });
        setSummary(output[0].summary_text);
      }
    } catch (error) {
      console.error("Analysis failed:", error);
      toast({
        variant: 'destructive',
        title: t('analysisFailedTitle'),
        description: t('daAnalysisFailedDesc'),
      });
    } finally {
      setIsLoading(false);
      setLoadingMessage('');
      if(e.target) e.target.value = '';
    }
  };

  const handleClear = () => {
    setSummary('');
    setChartData(null);
    setFileName('');
    if (fileInputRef.current) {
        fileInputRef.current.value = '';
    }
  };

  return (
    <div className="flex flex-col h-screen bg-background text-foreground" dir={dir}>
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileUpload}
        className="hidden"
        accept=".xlsx,.xls,.csv,.pdf"
      />
      <header className="grid grid-cols-3 items-center p-4 border-b shrink-0">
        <div className="justify-self-start flex items-center gap-2">
          <SidebarTrigger />
        </div>
        <h1 className="text-xl font-semibold tracking-tight justify-self-center">
          {t('dataAnalyticsTitle')}
        </h1>
        <div className="justify-self-end flex items-center gap-2">
          <LanguageToggle />
        </div>
      </header>

      <main className="flex-1 overflow-auto p-4 md:p-6">
          <div className="max-w-4xl mx-auto space-y-6">
            {!fileName ? (
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
            ) : isLoading ? (
                <div className="flex flex-col items-center justify-center h-full text-center">
                    <Loader2 className="w-12 h-12 animate-spin text-primary mb-4" />
                    <h2 className="text-xl font-semibold">{loadingMessage || t('daGeneratingDashboardTitle')}</h2>
                    <p className="text-muted-foreground">{t('daGeneratingDashboardDesc')}</p>
                </div>
            ) : (
                <div className="animate-in fade-in-50 duration-500 space-y-6">
                    <Card>
                        <CardHeader className="flex-row items-center justify-between">
                            <div>
                                <CardTitle>{t('analysisResultTitle')}</CardTitle>
                                <CardDescription>{fileName}</CardDescription>
                            </div>
                            <Button variant="outline" onClick={handleClear}>
                                <RefreshCw className="mr-2 h-4 w-4" />
                                {t('daResetButton')}
                            </Button>
                        </CardHeader>
                    </Card>

                    {summary && (
                        <Card>
                            <CardHeader>
                                <CardTitle>{t('daSummaryTitle')}</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="text-muted-foreground">{summary}</p>
                            </CardContent>
                        </Card>
                    )}
                    {chartData && (
                        <Card>
                            <CardHeader>
                                <CardTitle>{t('daChartTitle')}</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="h-[400px]">
                                    <Bar data={chartData} options={{ responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'top' } } }} />
                                </div>
                            </CardContent>
                        </Card>
                    )}
                </div>
            )}
          </div>
      </main>
    </div>
  );
}
