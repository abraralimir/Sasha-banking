
'use client';

import React, { useState, useRef } from 'react';
import { Bar, Pie } from 'react-chartjs-2';
import { 
  Chart as ChartJS, 
  CategoryScale, 
  LinearScale, 
  BarElement, 
  Title, 
  Tooltip, 
  Legend,
  ArcElement
} from 'chart.js';
import * as XLSX from 'xlsx';
import * as pdfjsLib from 'pdfjs-dist';
import * as dfd from 'danfojs';

import { LanguageToggle } from '@/components/language-toggle';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { Button } from '@/components/ui/button';
import { Loader2, FileUp, Bot, RefreshCw, Lightbulb, FileText, BarChart3, PieChart } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useLanguage } from '@/context/language-context';
import { useToast } from '@/hooks/use-toast';

ChartJS.register(CategoryScale, LinearScale, BarElement, ArcElement, Title, Tooltip, Legend);

export default function DataAnalyticsPage() {
  const { t, dir } = useLanguage();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const summarizerPipelineRef = useRef<any>(null);

  const [isLoading, setIsLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState('');
  const [fileName, setFileName] = useState('');
  
  const [summary, setSummary] = useState('');
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [barChartData, setBarChartData] = useState<any>(null);
  const [pieChartData, setPieChartData] = useState<any>(null);
  
  // This line must be inside the component to run only on the client
  pdfjsLib.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`;

  const getSummarizer = async (progress_callback?: (progress: any) => void) => {
    if (summarizerPipelineRef.current === null) {
      const { pipeline } = await import('@xenova/transformers');
      summarizerPipelineRef.current = await pipeline('summarization', 'Xenova/t5-small', { progress_callback });
    }
    return summarizerPipelineRef.current;
  };

  const handleClear = () => {
    setFileName('');
    setSummary('');
    setSuggestions([]);
    setBarChartData(null);
    setPieChartData(null);
    if (fileInputRef.current) {
        fileInputRef.current.value = '';
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    handleClear();
    setIsLoading(true);
    setFileName(file.name);

    try {
      if (file.name.endsWith('.pdf')) {
        setLoadingMessage(t('daParsingFile'));
        const data = await file.arrayBuffer();
        const pdf = await pdfjsLib.getDocument({ data }).promise;
        const pages = [];
        for (let i = 1; i <= pdf.numPages; i++) {
          const page = await pdf.getPage(i);
          const textContent = await page.getTextContent();
          pages.push(textContent.items.map((item: any) => item.str).join(' '));
        }
        const fullText = pages.join('\n').substring(0, 20000); // Truncate for performance

        setLoadingMessage(t('daGeneratingSummary'));
        const summarizer = await getSummarizer((p: any) => {
          if (p.status === 'progress') {
            const progress = (p.progress || 0).toFixed(2);
            setLoadingMessage(`${t('daGeneratingSummary')} (${progress}%)`);
          }
        });
        
        const summaryOutput = await summarizer(fullText, { max_length: 200, min_length: 30 });
        setSummary(summaryOutput[0].summary_text);
        
        const suggestionOutput = await summarizer(`summarize these key points into three actionable suggestions: ${summaryOutput[0].summary_text}`, { max_length: 150 });
        setSuggestions(suggestionOutput[0].summary_text.split('. ').filter((s:string) => s.length > 10).map((s:string) => s.trim()+'.'));

      } else if (file.name.endsWith('.xlsx') || file.name.endsWith('.csv')) {
        setLoadingMessage(t('daParsingFile'));
        const data = await file.arrayBuffer();
        const workbook = XLSX.read(data, { type: 'array' });
        const sheet = workbook.Sheets[workbook.SheetNames[0]];
        const jsonData = XLSX.utils.sheet_to_json(sheet);
        
        if (jsonData.length === 0) {
            throw new Error("Spreadsheet is empty or could not be parsed.");
        }

        setLoadingMessage(t('daAnalyzingData'));
        const df = new dfd.DataFrame(jsonData);
        
        const stringCols = df.columns.filter(col => df[col].dtype === 'string');
        
        if (stringCols.length > 0) {
            const barCol = stringCols[0];
            const barCounts = df[barCol].valueCounts();
            setBarChartData({
                labels: barCounts.index.slice(0, 15),
                datasets: [{
                    label: t('daChartLabel', { column: barCol }),
                    data: barCounts.values.slice(0, 15),
                    backgroundColor: 'hsl(var(--primary) / 0.6)',
                    borderColor: 'hsl(var(--primary))',
                    borderWidth: 1,
                }],
            });
        }
        
        if (stringCols.length > 1) {
            const pieCol = stringCols[1];
            const pieCounts = df[pieCol].valueCounts();
            setPieChartData({
                labels: pieCounts.index.slice(0, 10),
                datasets: [{
                    label: pieCol,
                    data: pieCounts.values.slice(0, 10),
                    backgroundColor: [
                        'hsl(var(--chart-1))', 'hsl(var(--chart-2))', 'hsl(var(--chart-3))',
                        'hsl(var(--chart-4))', 'hsl(var(--chart-5))', 'hsl(222.2, 47.4%, 11.2%)',
                        'hsl(210, 40%, 96.1%)', 'hsl(0, 84.2%, 60.2%)'
                    ],
                }],
            });
        }

        setLoadingMessage(t('daGeneratingSummary'));
        const summarizer = await getSummarizer();
        const analysisText = `Analyze the following data summary and provide insights. The dataset has ${df.shape[0]} rows and ${df.shape[1]} columns. Columns are: ${df.columns.join(', ')}. Key statistics are available for numerical columns.`;
        const summaryOutput = await summarizer(analysisText, { max_length: 150, min_length: 25 });
        setSummary(summaryOutput[0].summary_text);
        
        const suggestionOutput = await summarizer(`Provide three actionable business suggestions based on this dataset with columns: ${df.columns.join(', ')}`, { max_length: 150 });
        setSuggestions(suggestionOutput[0].summary_text.split('. ').filter((s:string) => s.length > 10).map((s:string) => s.trim()+'.'));

      } else {
        throw new Error("Unsupported file type. Please upload a PDF, XLSX, or CSV file.");
      }
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
      setLoadingMessage('');
      if(e.target) e.target.value = '';
    }
  };

  return (
    <div className="flex flex-col h-screen bg-muted/40 text-foreground" dir={dir}>
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileUpload}
        className="hidden"
        accept=".xlsx,.xls,.csv,.pdf"
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
             <Button variant="outline" size="sm" onClick={handleClear}>
                <RefreshCw className="mr-2 h-4 w-4" />
                {t('daResetButton')}
            </Button>
          )}
          <LanguageToggle />
        </div>
      </header>

      <main className="flex-1 overflow-auto p-4 md:p-6">
        <div className="max-w-7xl mx-auto space-y-6">
            {!fileName ? (
                 <div className="w-full pt-16 flex justify-center animate-in fade-in-50 duration-500">
                    <Card className="w-full max-w-lg text-center shadow-lg">
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
                 </div>
            ) : isLoading ? (
                <div className="flex flex-col items-center justify-center h-full text-center pt-24">
                    <Loader2 className="w-12 h-12 animate-spin text-primary mb-4" />
                    <h2 className="text-xl font-semibold">{loadingMessage || t('daGeneratingDashboardTitle')}</h2>
                    <p className="text-muted-foreground">{t('daGeneratingDashboardDesc')}</p>
                </div>
            ) : (
                <div className="animate-in fade-in-50 duration-500 space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>{t('analysisResultTitle')}</CardTitle>
                            <CardDescription>{fileName}</CardDescription>
                        </CardHeader>
                    </Card>
                    <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                        <Card className="xl:col-span-3">
                            <CardHeader className="flex flex-row items-center gap-3 space-y-0">
                                <FileText className="w-6 h-6 text-primary"/>
                                <CardTitle>{t('daSummaryTitle')}</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="text-muted-foreground">{summary || "No summary could be generated."}</p>
                            </CardContent>
                        </Card>
                        {barChartData && (
                            <Card className="xl:col-span-2">
                                <CardHeader className="flex flex-row items-center gap-3 space-y-0">
                                    <BarChart3 className="w-6 h-6 text-primary"/>
                                    <CardTitle>Data Distribution</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="h-[400px]">
                                        <Bar data={barChartData} options={{ responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'top' } } }} />
                                    </div>
                                </CardContent>
                            </Card>
                        )}
                        {pieChartData && (
                            <Card>
                                <CardHeader className="flex flex-row items-center gap-3 space-y-0">
                                    <PieChart className="w-6 h-6 text-primary"/>
                                    <CardTitle>Category Breakdown</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="h-[400px] w-full flex items-center justify-center">
                                        <Pie data={pieChartData} options={{ responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'right' } } }} />
                                    </div>
                                </CardContent>
                            </Card>
                        )}
                         <Card className="xl:col-span-3">
                            <CardHeader className="flex flex-row items-center gap-3 space-y-0">
                                <Lightbulb className="w-6 h-6 text-primary"/>
                                <CardTitle>AI-Powered Suggestions</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <ul className="space-y-2 text-muted-foreground">
                                {suggestions.length > 0 ? suggestions.map((s, i) => (
                                    <li key={i} className="flex items-start gap-3">
                                        <span className="mt-1.5 h-2 w-2 rounded-full bg-primary/70 shrink-0"/>
                                        <span>{s}</span>
                                    </li>
                                )) : <li>No specific suggestions could be generated from this document.</li>}
                                </ul>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            )}
        </div>
      </main>
    </div>
  );
}
