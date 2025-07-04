'use client';

import React, { useState, useRef, useEffect } from 'react';
import * as XLSX from 'xlsx';

import { LanguageToggle } from '@/components/language-toggle';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { Button } from '@/components/ui/button';
import { Loader2, Send, MessageSquare, X, FileUp, Bot } from 'lucide-react';
import { useLanguage } from '@/context/language-context';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { ScrollArea } from '@/components/ui/scroll-area';
import { SashaAvatar } from '@/components/sasha-avatar';
import { cn } from '@/lib/utils';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { User } from 'lucide-react';
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
// This will be the AI flow for data analytics, which you'd create.
// For now, we can use a placeholder function.
// import { analyzeData } from '@/ai/flows/data-analytics';

type ChatMessage = {
  role: 'user' | 'assistant';
  content: string;
}

// Placeholder for the real AI flow
const analyzeData = async (input: { prompt: string, csvData: string | null, language: 'en' | 'ar'}) => {
    await new Promise(res => setTimeout(res, 1500));
    if (input.prompt.toLowerCase().includes('hello')) {
        return { response: input.language === 'en' ? 'Hello! I am ready to analyze your data. What would you like to know?' : 'مرحباً! أنا مستعدة لتحليل بياناتك. ماذا تود أن تعرف؟' }
    }
    return { response: input.language === 'en' ? `I have received your request to analyze the data. I am working on it. This is a placeholder response.` : `لقد تلقيت طلبك لتحليل البيانات. أنا أعمل عليه. هذه إجابة مبدئية.` }
};


export default function DataAnalyticsPage() {
  const { t, language, dir } = useLanguage();
  const [prompt, setPrompt] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const [isChatOpen, setIsChatOpen] = useState(true);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  
  const [fileData, setFileData] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);

  useEffect(() => {
    setChatMessages([
      { role: 'assistant', content: t('sashaDAHello') }
    ]);
  }, [t]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages, isLoading]);

  const handleFileImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    setIsLoading(true);
    toast({
        title: t('daFileProcessingTitle'),
        description: t('daFileProcessingDesc', { fileName: file.name }),
    });

    const reader = new FileReader();
    reader.onload = (event) => {
        try {
            const data = event.target?.result;
            const workbook = XLSX.read(data, { type: 'binary' });
            const sheetName = workbook.SheetNames[0];
            const worksheet = workbook.Sheets[sheetName];
            // Convert to CSV string to pass to the AI model
            const csvString = XLSX.utils.sheet_to_csv(worksheet);
            setFileData(csvString);
            
            toast({
                title: t('importSuccessTitle'),
                description: t('importSuccessDesc', { fileName: file.name }),
            });
            setChatMessages(prev => [...prev, { role: 'assistant', content: t('sashaDAFileLoaded', { fileName: file.name }) }]);
        } catch (error) {
            console.error("Error importing file:", error);
            toast({
                variant: 'destructive',
                title: t('importFailedTitle'),
                description: t('importFailedDesc'),
            });
            setFileName(null);
        } finally {
            setIsLoading(false);
        }
    };
    reader.readAsBinaryString(file);
    if(e.target) e.target.value = '';
  };

  const handleSashaSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!prompt.trim()) return;

    const newMessages: ChatMessage[] = [...chatMessages, { role: 'user', content: prompt }];
    setChatMessages(newMessages);
    const currentPrompt = prompt;
    setPrompt('');
    setIsLoading(true);

    try {
      // Replace with the actual AI call
      const response = await analyzeData({
        prompt: currentPrompt,
        csvData: fileData,
        language,
      });
      
      setChatMessages(prev => [...prev, { role: 'assistant', content: response.response }]);

    } catch (error) {
      console.error(error);
      const errorMessage = t('sashaSpreadsheetError'); // Re-use a generic error message
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

  return (
    <div className="flex flex-col h-screen bg-background text-foreground" dir={dir}>
       <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileImport}
        className="hidden"
        accept=".xlsx, .xls, .csv"
      />
      <header className="grid grid-cols-3 items-center p-4 border-b shrink-0">
        <div className="justify-self-start flex items-center gap-2">
          <SidebarTrigger />
        </div>
        <h1 className="text-xl font-semibold tracking-tight justify-self-center">
          {t('dataAnalyticsTitle')}
        </h1>
        <div className="justify-self-end flex items-center gap-2">
           <Button variant="ghost" size="icon" onClick={() => setIsChatOpen(!isChatOpen)}>
            <MessageSquare className="h-5 w-5" />
            <span className="sr-only">{isChatOpen ? t('hideChat') : t('showChat')}</span>
          </Button>
          <LanguageToggle />
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        <main className="flex-1 overflow-auto p-4 md:p-6 flex items-center justify-center">
            {!fileData ? (
                 <Card className="w-full max-w-lg text-center shadow-lg animate-in fade-in-50 duration-500">
                    <CardHeader>
                        <div className="mx-auto bg-primary/10 text-primary p-3 rounded-full mb-4">
                            <Bot className="w-10 h-10" />
                        </div>
                        <CardTitle>{t('daUploadPromptTitle')}</CardTitle>
                        <CardDescription>{t('daUploadPromptDesc')}</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Button onClick={() => fileInputRef.current?.click()} disabled={isLoading}>
                            {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <FileUp className="mr-2 h-4 w-4" />}
                            {t('daUploadButton')}
                        </Button>
                    </CardContent>
                 </Card>
            ) : (
                <div className="w-full h-full flex flex-col items-center justify-center text-center p-8 bg-muted/50 rounded-lg">
                    <h2 className="text-2xl font-semibold text-foreground">{t('daDashboardTitle')}</h2>
                    <p className="text-muted-foreground mt-2 max-w-md">{t('daDashboardDesc', {fileName: fileName || ''})}</p>
                    <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-4xl">
                        <Card><CardHeader><CardTitle>{t('daKpiCard1')}</CardTitle></CardHeader><CardContent><p className="text-3xl font-bold">1,402</p></CardContent></Card>
                        <Card><CardHeader><CardTitle>{t('daKpiCard2')}</CardTitle></CardHeader><CardContent><p className="text-3xl font-bold">$2.3M</p></CardContent></Card>
                        <Card className="md:col-span-2 h-64 flex items-center justify-center"><p className="text-muted-foreground">{t('daChartPlaceholder')}</p></Card>
                    </div>
                </div>
            )}
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
                                <div className={cn('rounded-lg p-3 text-sm max-w-xs shadow-sm', {
                                    'bg-primary text-primary-foreground': message.role === 'assistant',
                                    'bg-card text-card-foreground': message.role === 'user',
                                })}>
                                    <p className="whitespace-pre-wrap">{message.content}</p>
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
                            disabled={isLoading || !fileData}
                        />
                        <Button type="submit" size="icon" className={cn("absolute top-1/2 transform -translate-y-1/2 h-8 w-8", dir === 'ltr' ? 'right-2' : 'left-2')} disabled={isLoading || !prompt.trim() || !fileData}>
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
