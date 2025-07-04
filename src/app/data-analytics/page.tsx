'use client';

import React, { useState, useRef, useEffect } from 'react';
import * as XLSX from 'xlsx';

import { LanguageToggle } from '@/components/language-toggle';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { Button } from '@/components/ui/button';
import { Loader2, Send, MessageSquare, X, FileUp, Bot, RefreshCw, Maximize, Minimize } from 'lucide-react';
import { useLanguage } from '@/context/language-context';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { ScrollArea } from '@/components/ui/scroll-area';
import { SashaAvatar } from '@/components/sasha-avatar';
import { cn } from '@/lib/utils';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { User } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { dataAnalytics } from '@/ai/flows/data-analytics';
import { generateDashboard, type DashboardLayout } from '@/ai/flows/generate-dashboard';
import type { DataAnalyticsOutput } from '@/ai/flows/data-analytics';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { KpiCard } from '@/components/analytics/kpi-card';
import { AnalyticsBarChart } from '@/components/analytics/analytics-bar-chart';
import { AnalyticsPieChart } from '@/components/analytics/analytics-pie-chart';
import { AnalyticsTable } from '@/components/analytics/analytics-table';

type ChatMessage = {
  role: 'user' | 'assistant';
  content: string;
  chart?: DataAnalyticsOutput['chart'];
}

export default function DataAnalyticsPage() {
  const { t, language, dir } = useLanguage();
  const [prompt, setPrompt] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isDashboardLoading, setIsDashboardLoading] = useState(false);
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fullscreenRef = useRef<HTMLDivElement>(null);

  const [isChatOpen, setIsChatOpen] = useState(true);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  
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
      setChatMessages([{ role: 'assistant', content: t('sashaDAFileLoaded', { fileName: savedName }) }]);
      handleGenerateDashboard(savedContent, savedType);
    } else {
      setChatMessages([{ role: 'assistant', content: t('sashaDAHello') }]);
    }
  }, [t]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages, isLoading]);

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
    setChatMessages([{ role: 'assistant', content: t('sashaDAHello') }]);
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
        ? { pdfDataUri: content } 
        : { csvContent: content };
      
      const layout = await generateDashboard({ ...payload, language });
      setDashboardLayout(layout);
    } catch (error) {
      console.error("Error generating dashboard:", error);
      toast({
        variant: 'destructive',
        title: t('genericErrorTitle'),
        description: t('daDashboardGenError'),
      });
      setFileContent(null);
      localStorage.removeItem('sasha-da-content');
      localStorage.removeItem('sasha-da-type');
      localStorage.removeItem('sasha-da-name');
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
    setChatMessages([{ role: 'assistant', content: t('sashaDAFileLoaded', { fileName: name }) }]);
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

  const handleSashaSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!prompt.trim() || !fileContent || !fileType) return;

    const newMessages: ChatMessage[] = [...chatMessages, { role: 'user', content: prompt }];
    setChatMessages(newMessages);
    const currentPrompt = prompt;
    setPrompt('');
    setIsLoading(true);

    try {
      const payload = fileType === 'pdf' 
        ? { pdfDataUri: fileContent } 
        : { csvContent: fileContent };

      const response = await dataAnalytics({
        prompt: currentPrompt,
        ...payload,
        language,
      });
      
      setChatMessages(prev => [...prev, { role: 'assistant', content: response.response, chart: response.chart }]);

    } catch (error) {
      console.error(error);
      const errorMessage = t('sashaSpreadsheetError');
      setChatMessages(prev => [...prev, { role: 'assistant', content: errorMessage }]);
      toast({
        variant: 'destructive',
        title: t('genericErrorTitle'),
        description: t('genericErrorDesc'),
      });
    } finally {
      setIsLoading(false);
    }
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
  
  const renderChatMessage = (message: ChatMessage, index: number) => {
    if (message.chart?.type === 'bar') {
        return <div className="w-full h-64 p-2"><AnalyticsBarChart data={message.chart.data} /></div>
    }
    if (message.chart?.type === 'pie') {
        return <div className="w-full h-64 p-2"><AnalyticsPieChart data={message.chart.data} /></div>
    }
    return <p className="whitespace-pre-wrap">{message.content}</p>;
  }


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
                    <Button variant="ghost" size="icon" onClick={handleClearSession} disabled={isLoading || isDashboardLoading}>
                        <RefreshCw className="h-5 w-5" />
                        <span className="sr-only">{t('refreshSession')}</span>
                    </Button>
                    </TooltipTrigger>
                    <TooltipContent><p>{t('refreshSession')}</p></TooltipContent>
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
           <Button variant="ghost" size="icon" onClick={() => setIsChatOpen(!isChatOpen)}>
            <MessageSquare className="h-5 w-5" />
            <span className="sr-only">{isChatOpen ? t('hideChat') : t('showChat')}</span>
          </Button>
          <LanguageToggle />
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
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
                <div className="max-w-7xl mx-auto animate-in fade-in-50 duration-500">
                    <div className="mb-6">
                      <h1 className="text-3xl font-bold tracking-tight">{dashboardLayout.title}</h1>
                      <p className="text-muted-foreground">{dashboardLayout.description}</p>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                       {dashboardLayout.items.map(renderDashboardItem)}
                    </div>
                </div>
            ) : null}
        </main>
        
        {isChatOpen && (
            <aside className={cn("w-[350px] border-l bg-background flex flex-col h-full animate-in duration-300", dir === 'ltr' ? 'slide-in-from-right-sm' : 'slide-in-from-left-sm')}>
                <div className="p-4 border-b flex items-center justify-between">
                    <h2 className="text-lg font-semibold tracking-tight">{t('chatWithSasha')}</h2>
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setIsChatOpen(false)}>
                        <X className="h-4 w-4" />
                        <span className="sr-only">{t('closeChat')}</span>
                    </Button>
                </div>
                <ScrollArea className="flex-1 p-4">
                    <div className="space-y-4">
                        {chatMessages.map((message, index) => (
                            <div key={index} className={cn('flex items-start gap-3 animate-in fade-in', { 'justify-end flex-row-reverse': message.role === 'user' })}>
                                {message.role === 'assistant' && <SashaAvatar className="w-8 h-8 shrink-0" />}
                                <div className={cn('rounded-lg p-3 text-sm max-w-[calc(100%-2.5rem)] shadow-sm', {
                                    'bg-primary text-primary-foreground': message.role === 'assistant',
                                    'bg-card text-card-foreground': message.role === 'user',
                                })}>
                                    {renderChatMessage(message, index)}
                                </div>
                                {message.role === 'user' && (
                                    <Avatar className="w-8 h-8 shrink-0">
                                        <AvatarFallback><User className="w-4 h-4" /></AvatarFallback>
                                    </Avatar>
                                )}
                            </div>
                        ))}
                        {isLoading && (
                            <div className={cn("flex items-start gap-3", {'justify-end flex-row-reverse': dir === 'rtl'})}>
                                <SashaAvatar className="w-8 h-8 shrink-0" />
                                <div className="bg-primary text-primary-foreground rounded-lg p-3 shadow-sm flex items-center space-x-1">
                                    <span className="w-2 h-2 bg-primary-foreground/50 rounded-full animate-pulse delay-0 duration-1000"></span>
                                    <span className="w-2 h-2 bg-primary-foreground/50 rounded-full animate-pulse delay-200 duration-1000"></span>
                                    <span className="w-2 h-2 bg-primary-foreground/50 rounded-full animate-pulse delay-400 duration-1000"></span>
                                </div>
                            </div>
                        )}
                        <div ref={messagesEndRef} />
                    </div>
                </ScrollArea>
                <div className="p-4 border-t bg-background">
                    <form onSubmit={handleSashaSubmit} className="relative">
                        <Textarea
                            value={prompt}
                            onChange={(e) => setPrompt(e.target.value)}
                            placeholder={t('daChatPlaceholder')}
                            className="pr-12 text-base resize-none"
                            onKeyDown={(e) => {
                                if (e.key === 'Enter' && !e.shiftKey) {
                                    e.preventDefault();
                                    handleSashaSubmit(e);
                                }
                            }}
                            rows={1}
                            disabled={isLoading || !fileContent}
                        />
                        <Button type="submit" size="icon" className={cn("absolute top-1/2 transform -translate-y-1/2 h-8 w-8", dir === 'ltr' ? 'right-2' : 'left-2')} disabled={isLoading || !prompt.trim() || !fileContent}>
                            {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                            <span className="sr-only">{t('send')}</span>
                        </Button>
                    </form>
                </div>
            </aside>
        )}
      </div>
    </div>
  );
}
