'use client';

import React, { useState, useRef, useEffect } from 'react';
import type { HotTable } from '@handsontable/react';
import type Handsontable from 'handsontable';
import * as XLSX from 'xlsx';

import { LanguageToggle } from '@/components/language-toggle';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { Spreadsheet } from '@/components/spreadsheet/spreadsheet';
import { Button } from '@/components/ui/button';
import { Loader2, Send, MessageSquare, X } from 'lucide-react';
import { useLanguage } from '@/context/language-context';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { spreadsheetAssistant } from '@/ai/flows/spreadsheet-assistant';
import { SpreadsheetToolbar } from '@/components/spreadsheet/toolbar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { SashaAvatar } from '@/components/sasha-avatar';
import { cn } from '@/lib/utils';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { User } from 'lucide-react';

const initialData = Array.from({ length: 50 }, () => Array(26).fill(''));

const ganttTemplate = [
    ["Task", "Start Date", "End Date", "Duration", "Completion"],
    ["Project Kick-off", "2024-01-01", "2024-01-02", 2, "100%"],
    ["Requirement Gathering", "2024-01-03", "2024-01-10", 8, "100%"],
    ["Design Phase", "2024-01-11", "2024-01-20", 10, "80%"],
    ["Development", "2024-01-21", "2024-03-10", 50, "30%"],
    ["Testing", "2024-03-11", "2024-03-25", 15, "0%"],
    ["Deployment", "2024-03-26", "2024-03-31", 6, "0%"],
    [],
];

type ChatMessage = {
  role: 'user' | 'assistant';
  content: string;
}

export default function SpreadsheetPage() {
  const { t, language, dir } = useLanguage();
  const [sheetData, setSheetData] = useState<any[][]>(initialData);
  const [prompt, setPrompt] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const hotRef = useRef<HotTable>(null);
  const [hotInstance, setHotInstance] = useState<Handsontable | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fullscreenRef = useRef<HTMLDivElement>(null);

  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(true);

  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    { role: 'assistant', content: "Hello! I'm Sasha. I can help you create, format, and analyze this spreadsheet. Just tell me what you need." }
  ]);

  const handleFullscreenChange = () => {
    setIsFullscreen(!!document.fullscreenElement);
  };

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

  useEffect(() => {
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => {
        document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, []);

  useEffect(() => {
    if (hotRef.current) {
      const instance = hotRef.current.hotInstance;
      setHotInstance(instance);
      // This ensures that when sheetData is updated (e.g., on import),
      // the Handsontable instance is reloaded with the new data.
      if (instance.getSourceData() !== sheetData) {
        instance.loadData(sheetData);
      }
    }
  }, [sheetData]);
  
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages, isLoading]);

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
        try {
            const data = event.target?.result;
            const workbook = XLSX.read(data, { type: 'binary' });
            const sheetName = workbook.SheetNames[0];
            const worksheet = workbook.Sheets[sheetName];
            const json = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
            setSheetData(json as any[][]); // This now correctly triggers a re-render
            toast({
                title: 'Import Successful',
                description: `Successfully imported "${file.name}".`,
            });
            setChatMessages(prev => [...prev, { role: 'assistant', content: `I've loaded "${file.name}" into the spreadsheet. How can I help you with it?` }]);
        } catch (error) {
            console.error("Error importing file:", error);
            toast({
                variant: 'destructive',
                title: 'Import Failed',
                description: 'There was an error processing your Excel file.',
            });
        }
    };
    reader.readAsBinaryString(file);
    if(e.target) e.target.value = '';
  };

  const handleSashaSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!prompt.trim() || !hotInstance) return;

    const newMessages: ChatMessage[] = [...chatMessages, { role: 'user', content: prompt }];
    setChatMessages(newMessages);
    const currentPrompt = prompt;
    setPrompt('');
    setIsLoading(true);

    try {
      const currentData = hotInstance.getData();
      const response = await spreadsheetAssistant({
        prompt: currentPrompt,
        sheetData: currentData,
        language,
      });
      
      const firstConfirmation = response.operations.find(op => op.confirmation)?.confirmation;
      const confirmationMessage = firstConfirmation || "I've processed your request.";

      setChatMessages(prev => [...prev, { role: 'assistant', content: confirmationMessage }]);
      
      hotInstance.batch(() => {
        for (const op of response.operations) {
          switch (op.command) {
            case 'createGantt':
              setSheetData(ganttTemplate);
              break;
            case 'clearSheet':
              const clearedData = Array.from({ length: 50 }, () => Array(26).fill(''));
              hotInstance.updateSettings({ cell: [], comments: false });
              hotInstance.getPlugin('comments').clearComments();
              setSheetData(clearedData); // Correctly update state
              break;
            case 'setData':
              if (op.params.data) {
                setSheetData(op.params.data); // Correctly update state
              }
              break;
            case 'formatCells':
              const { range, properties } = op.params;
              if (range && properties) {
                for (let row = range.row; row <= range.row2; row++) {
                    for (let col = range.col; col <= range.col2; col++) {
                        const cell = hotInstance.getCell(row, col);
                        if (cell) {
                            let className = cell.className || '';
                            const style = cell.style || {};

                            if (properties.bold) className += ' ht-cell-bold';
                            if (properties.italic) className += ' ht-cell-italic';
                            if (properties.underline) className += ' ht-cell-underline';
                            if (properties.color) style.color = properties.color;
                            if (properties.backgroundColor) style.backgroundColor = properties.backgroundColor;

                            hotInstance.setCellMeta(row, col, 'className', className.trim());
                            hotInstance.setCellMeta(row, col, 'style', style);
                        }
                    }
                }
              }
              break;
            case 'info':
              // No data change, the message is already in the chat.
              break;
          }
        }
      });
      hotInstance.render();

    } catch (error) {
      console.error(error);
      const errorMessage = "Sorry, I ran into an issue. Please try that again.";
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
    <div ref={fullscreenRef} className="flex flex-col h-screen bg-background text-foreground" dir={dir}>
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
          Spreadsheet
        </h1>
        <div className="justify-self-end flex items-center gap-2">
           <Button variant="ghost" size="icon" onClick={() => setIsChatOpen(!isChatOpen)}>
            <MessageSquare className="h-5 w-5" />
            <span className="sr-only">{isChatOpen ? "Hide Chat" : "Show Chat"}</span>
          </Button>
          <LanguageToggle />
        </div>
      </header>
      
      <SpreadsheetToolbar 
        hotInstance={hotInstance} 
        onImport={handleImportClick}
        toggleFullscreen={toggleFullscreen}
        isFullscreen={isFullscreen}
      />

      <div className="flex flex-1 overflow-hidden">
        <main className="flex-1 overflow-auto">
          <Spreadsheet data={sheetData} hotRef={hotRef} />
        </main>
        
        {isChatOpen && (
            <aside className="w-[350px] border-l bg-background flex flex-col h-full animate-in slide-in-from-right-sm duration-300">
                <div className="p-4 border-b flex items-center justify-between">
                    <h2 className="text-lg font-semibold tracking-tight">Chat with Sasha</h2>
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setIsChatOpen(false)}>
                        <X className="h-4 w-4" />
                        <span className="sr-only">Close chat</span>
                    </Button>
                </div>
                <ScrollArea className="flex-1 p-4">
                    <div className="space-y-4">
                        {chatMessages.map((message, index) => (
                            <div key={index} className={cn('flex items-start gap-3 animate-in fade-in', { 'justify-end': message.role === 'user' })}>
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
                            <div className="flex items-start gap-3">
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
                            placeholder="e.g., Make row 1 bold and blue"
                            className="pr-12 text-base resize-none"
                            onKeyDown={(e) => {
                                if (e.key === 'Enter' && !e.shiftKey) {
                                    e.preventDefault();
                                    handleSashaSubmit(e);
                                }
                            }}
                            rows={1}
                            disabled={isLoading}
                        />
                        <Button type="submit" size="icon" className="absolute top-1/2 right-2 transform -translate-y-1/2 h-8 w-8" disabled={isLoading || !prompt.trim()}>
                            {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                            <span className="sr-only">Send</span>
                        </Button>
                    </form>
                </div>
            </aside>
        )}
      </div>
    </div>
  );
}
