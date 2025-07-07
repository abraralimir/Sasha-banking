
'use client';

import React, { useState, useRef, useEffect } from 'react';
import type { HotTable } from '@handsontable/react';
import Handsontable from 'handsontable';
import * as XLSX from 'xlsx';
import { Bar, Pie } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
} from 'chart.js';

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
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
);

const initialData = Array.from({ length: 50 }, () => Array(26).fill(''));

const ganttTemplate = [
  ['Task', 'Start Date', 'End Date', 'Duration', 'Completion'],
  ['Project Kick-off', '2024-01-01', '2024-01-02', 2, '100%'],
  [
    'Requirement Gathering',
    '2024-01-03',
    '2024-01-10',
    8,
    '100%',
  ],
  ['Design Phase', '2024-01-11', '2024-01-20', 10, '80%'],
  ['Development', '2024-01-21', '2024-03-10', 50, '30%'],
  ['Testing', '2024-03-11', '2024-03-25', 15, '0%'],
  ['Deployment', '2024-03-26', '2024-03-31', 6, '0%'],
  [],
];

type ChatMessage = {
  role: 'user' | 'assistant';
  content: string;
};

type ChartData = {
  type: 'bar' | 'pie';
  title: string;
  data: {
    labels: string[];
    datasets: {
      label: string;
      data: number[];
      backgroundColor: string[];
    }[];
  };
};

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
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [charts, setCharts] = useState<ChartData[]>([]);

  useEffect(() => {
    if (hotRef.current) {
      const instance = hotRef.current.hotInstance;
      setHotInstance(instance);
    }
  }, []);

  useEffect(() => {
    if (hotInstance) {
      hotInstance.loadData(sheetData);
    }
  }, [sheetData, hotInstance]);

  useEffect(() => {
    setChatMessages([
      { role: 'assistant', content: t('sashaSpreadsheetHello') },
    ]);
  }, [t]);

  const handleFullscreenChange = () => {
    const isCurrentlyFullscreen = !!document.fullscreenElement;
    setIsFullscreen(isCurrentlyFullscreen);
    if (hotInstance) {
      setTimeout(() => {
        hotInstance.render();
      }, 100);
    }
  };

  const toggleFullscreen = () => {
    if (!fullscreenRef.current) return;
    if (!document.fullscreenElement) {
      fullscreenRef.current.requestFullscreen().catch((err) => {
        alert(
          `Error attempting to enable full-screen mode: ${err.message} (${err.name})`
        );
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
  }, [hotInstance]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages, isLoading]);

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const getChartColors = (numColors: number) => {
    const colors = [
      'hsl(var(--chart-1))',
      'hsl(var(--chart-2))',
      'hsl(var(--chart-3))',
      'hsl(var(--chart-4))',
      'hsl(var(--chart-5))',
      'hsl(222.2, 47.4%, 11.2%)',
    ];
    let result = [];
    for (let i = 0; i < numColors; i++) {
      result.push(colors[i % colors.length]);
    }
    return result;
  };

  const convertA1RangeToChartData = (
    dataRange: { labels: string; data: string | string[] },
    currentSheetData: any[][]
  ) => {
    const { labels: labelsRange, data: dataRanges } = dataRange;

    const labelsCoords = XLSX.utils.decode_range(labelsRange);
    const labels = [];
    for (let R = labelsCoords.s.r; R <= labelsCoords.e.r; ++R) {
      labels.push(currentSheetData[R]?.[labelsCoords.s.c] ?? '');
    }

    const datasets = (Array.isArray(dataRanges) ? dataRanges : [dataRanges]).map(
      (range) => {
        const dataCoords = XLSX.utils.decode_range(range);
        const data = [];
        const headerRow = dataCoords.s.r > 0 ? dataCoords.s.r - 1 : 0;
        const label =
          currentSheetData[headerRow]?.[dataCoords.s.c] ?? 'Dataset';

        for (let R = dataCoords.s.r; R <= dataCoords.e.r; ++R) {
          const cellValue = currentSheetData[R]?.[dataCoords.s.c];
          let val = 0;
          if (typeof cellValue === 'string') {
            val = parseFloat(cellValue.replace(/[^0-9.-]+/g, ''));
          } else if (typeof cellValue === 'number') {
            val = cellValue;
          }
          data.push(isNaN(val) ? 0 : val);
        }
        return {
          label: label,
          data: data,
          backgroundColor: getChartColors(data.length),
        };
      }
    );

    return { labels, datasets };
  };

  const handleFileImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setCharts([]);

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = event.target?.result;
        const workbook = XLSX.read(data, { type: 'binary', cellNF: true, cellStyles: true });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const json = XLSX.utils.sheet_to_json(worksheet, {
          header: 1,
          raw: false,
          defval: ''
        });

        setSheetData(json as any[][]);

        toast({
          title: t('importSuccessTitle'),
          description: t('importSuccessDesc', { fileName: file.name }),
        });
        setChatMessages((prev) => [
          ...prev,
          {
            role: 'assistant',
            content: t('sashaSpreadsheetFileLoaded', { fileName: file.name }),
          },
        ]);
      } catch (error) {
        console.error('Error importing file:', error);
        toast({
          variant: 'destructive',
          title: t('importFailedTitle'),
          description: t('importFailedDesc'),
        });
      }
    };
    reader.readAsBinaryString(file);
    if (e.target) e.target.value = '';
  };

  const handleSashaSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!prompt.trim() || !hotInstance) return;

    const newMessages: ChatMessage[] = [
      ...chatMessages,
      { role: 'user', content: prompt },
    ];
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

      const firstConfirmation = response.operations.find(
        (op) => op.confirmation
      )?.confirmation;
      if (firstConfirmation) {
        setChatMessages((prev) => [
          ...prev,
          { role: 'assistant', content: firstConfirmation },
        ]);
      } else {
        setIsLoading(false);
        return;
      }
      
      let newData: any[][] | null = null;
      let finalDataForCharts: any[][] = currentData;
      
      hotInstance.batch(() => {
        for (const op of response.operations) {
          switch (op.command) {
            case 'createGantt':
              newData = ganttTemplate;
              setCharts([]);
              break;
            case 'clearSheet':
              const clearedData = Array.from({ length: 50 }, () =>
                Array(26).fill('')
              );
              hotInstance.updateSettings({ cell: [], comments: false });
              if (hotInstance.getPlugin('comments')?.clearComments) {
                hotInstance.getPlugin('comments').clearComments();
              }
              newData = clearedData;
              setCharts([]);
              break;
            case 'setData':
              if (op.params.data) {
                newData = op.params.data;
                setCharts([]);
              }
              break;
            case 'formatCells':
              const { range, properties } = op.params;
              if (range && properties) {
                for (let row = range.row; row <= range.row2; row++) {
                  for (let col = range.col; col <= range.col2; col++) {
                    let classNames = (hotInstance.getCellMeta(row, col).className || '').split(' ').filter(Boolean);
                    
                    const alignments = ['htLeft', 'htCenter', 'htRight', 'htJustify'];
                    classNames = classNames.filter(c => !alignments.includes(c));
                    if (properties.alignment) classNames.push(properties.alignment);

                    if (properties.bold) classNames.push('ht-cell-bold');
                    else classNames = classNames.filter(c => c !== 'ht-cell-bold');
                    
                    if (properties.italic) classNames.push('ht-cell-italic');
                    else classNames = classNames.filter(c => c !== 'ht-cell-italic');
                    
                    if (properties.underline) classNames.push('ht-cell-underline');
                    else classNames = classNames.filter(c => c !== 'ht-cell-underline');

                    hotInstance.setCellMeta(row, col, 'className', classNames.join(' '));

                    const currentBg = hotInstance.getCellMeta(row, col).backgroundColor;
                    if (properties.backgroundColor) {
                      hotInstance.setCellMeta(row, col, 'backgroundColor', properties.backgroundColor);
                    }
                    if (properties.color) {
                      hotInstance.setCellMeta(row, col, 'renderer', function(instance, td, ...args) {
                        (Handsontable.renderers.getRenderer('text') as any).apply(this, [instance, td, ...args]);
                        td.style.color = properties.color;
                        if (properties.backgroundColor || currentBg) {
                          td.style.backgroundColor = properties.backgroundColor || currentBg;
                        }
                      });
                    } else if (properties.backgroundColor) {
                       hotInstance.setCellMeta(row, col, 'renderer', function(instance, td, ...args) {
                        (Handsontable.renderers.getRenderer('text') as any).apply(this, [instance, td, ...args]);
                        td.style.backgroundColor = properties.backgroundColor;
                      });
                    }

                    if (properties.numericFormat) {
                      hotInstance.setCellMeta(row, col, 'type', 'numeric');
                      hotInstance.setCellMeta(row, col, 'numericFormat', properties.numericFormat);
                    }
                  }
                }
              }
              break;
            case 'createChart':
              // This command does not modify data, but we need to create a chart
              break;
            case 'info':
              break;
          }
        }
      });
      
      if (newData) {
          setSheetData(newData);
          finalDataForCharts = newData;
      }
      
      // Handle chart creation outside the batch update
      const chartOps = response.operations.filter(op => op.command === 'createChart');
      if(chartOps.length > 0) {
        const newCharts: ChartData[] = [];
        for (const op of chartOps) {
          const { type, title, dataRange } = op.params;
          newCharts.push({
            type,
            title,
            data: convertA1RangeToChartData(dataRange, finalDataForCharts),
          });
        }
        setCharts(prev => [...prev, ...newCharts]);
      }

      hotInstance.render();
    } catch (error) {
      console.error(error);
      const errorMessage = t('sashaSpreadsheetError');
      setChatMessages((prev) => [
        ...prev,
        { role: 'assistant', content: errorMessage },
      ]);
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
    <div
      ref={fullscreenRef}
      className="flex flex-col h-screen bg-background text-foreground"
      dir={dir}
    >
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
          {t('spreadsheetTitle')}
        </h1>
        <div className="justify-self-end flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsChatOpen(!isChatOpen)}
          >
            <MessageSquare className="h-5 w-5" />
            <span className="sr-only">
              {isChatOpen ? t('hideChat') : t('showChat')}
            </span>
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
        <main className="flex-1 overflow-auto flex flex-col">
          <div className="flex-grow">
            <Spreadsheet data={sheetData} hotRef={hotRef} />
          </div>
          {charts.length > 0 && (
            <ScrollArea className="flex-shrink-0 border-t bg-muted/40 max-h-96">
              <section className="p-4">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-lg font-semibold text-center flex-grow">
                    {t('chartsTitle', 'Charts')}
                  </h2>
                   <Button variant="ghost" size="icon" onClick={() => setCharts([])} className="h-7 w-7">
                      <X className="h-4 w-4" />
                      <span className="sr-only">Close charts</span>
                   </Button>
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {charts.map((chart, index) => (
                    <Card key={index} className="shadow-lg">
                      <CardHeader>
                        <CardTitle>{chart.title}</CardTitle>
                      </CardHeader>
                      <CardContent className="h-[400px]">
                        {chart.type === 'bar' ? (
                          <Bar
                            data={chart.data}
                            options={{
                              responsive: true,
                              maintainAspectRatio: false,
                              plugins: { legend: { position: 'top' } },
                            }}
                          />
                        ) : (
                          <div className="h-full w-full flex items-center justify-center">
                            <Pie
                              data={chart.data}
                              options={{
                                responsive: true,
                                maintainAspectRatio: false,
                                plugins: { legend: { position: 'right' } },
                              }}
                            />
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </section>
            </ScrollArea>
          )}
        </main>

        {isChatOpen && (
          <aside
            className={cn(
              'w-[350px] border-l bg-background flex flex-col h-full animate-in duration-300',
              dir === 'ltr'
                ? 'slide-in-from-right-sm'
                : 'slide-in-from-left-sm'
            )}
          >
            <div className="p-4 border-b flex items-center justify-between">
              <h2 className="text-lg font-semibold tracking-tight">
                {t('chatWithSasha')}
              </h2>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={() => setIsChatOpen(false)}
              >
                <X className="h-4 w-4" />
                <span className="sr-only">{t('closeChat')}</span>
              </Button>
            </div>
            <ScrollArea className="flex-1 p-4">
              <div className="space-y-4">
                {chatMessages.map((message, index) => (
                  <div
                    key={index}
                    className={cn(
                      'flex items-start gap-3 animate-in fade-in',
                      { 'justify-end flex-row-reverse': message.role === 'user' }
                    )}
                  >
                    {message.role === 'assistant' && (
                      <SashaAvatar className="w-8 h-8 shrink-0" />
                    )}
                    <div
                      className={cn(
                        'rounded-lg p-3 text-sm max-w-xs shadow-sm',
                        {
                          'bg-primary text-primary-foreground':
                            message.role === 'assistant',
                          'bg-card text-card-foreground':
                            message.role === 'user',
                        }
                      )}
                    >
                      <p className="whitespace-pre-wrap">{message.content}</p>
                    </div>
                    {message.role === 'user' && (
                      <Avatar className="w-8 h-8 shrink-0">
                        <AvatarFallback>
                          <User className="w-4 h-4" />
                        </AvatarFallback>
                      </Avatar>
                    )}
                  </div>
                ))}
                {isLoading && (
                  <div
                    className={cn('flex items-start gap-3', {
                      'justify-end flex-row-reverse': dir === 'rtl',
                    })}
                  >
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
                  placeholder={t('spreadsheetPlaceholder')}
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
                <Button
                  type="submit"
                  size="icon"
                  className={cn(
                    'absolute top-1/2 transform -translate-y-1/2 h-8 w-8',
                    dir === 'ltr' ? 'right-2' : 'left-2'
                  )}
                  disabled={isLoading || !prompt.trim()}
                >
                  {isLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Send className="h-4 w-4" />
                  )}
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
