'use client';

import React, { useState, useRef, useEffect } from 'react';
import type { HotTable } from '@handsontable/react';
import type Handsontable from 'handsontable';
import { LanguageToggle } from '@/components/language-toggle';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { Spreadsheet } from '@/components/spreadsheet/spreadsheet';
import { Button } from '@/components/ui/button';
import { Wand2, Loader2, X } from 'lucide-react';
import { useLanguage } from '@/context/language-context';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { spreadsheetAssistant } from '@/ai/flows/spreadsheet-assistant';
import { SpreadsheetToolbar } from '@/components/spreadsheet/toolbar';

const initialData = [
  ['', 'Ford', 'Volvo', 'Toyota', 'Honda'],
  ['2021', 10, 11, 12, 13],
  ['2022', 20, 11, 14, 13],
  ['2023', 30, 15, 12, 13],
];

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

export default function SpreadsheetPage() {
  const { t, language, dir } = useLanguage();
  const [sheetData, setSheetData] = useState<any[][]>(initialData);
  const [isSashaOpen, setIsSashaOpen] = useState(false);
  const [prompt, setPrompt] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const hotRef = useRef<HotTable>(null);
  const [hotInstance, setHotInstance] = useState<Handsontable | null>(null);

  useEffect(() => {
    if (hotRef.current) {
      setHotInstance(hotRef.current.hotInstance);
    }
  }, []);

  const handleSashaSubmit = async () => {
    if (!prompt.trim() || !hotInstance) return;
    setIsLoading(true);

    try {
      const currentData = hotInstance.getData();
      const response = await spreadsheetAssistant({
        prompt,
        sheetData: currentData,
        language,
      });
      
      const firstConfirmation = response.operations.find(op => op.confirmation)?.confirmation;
      const confirmationMessage = firstConfirmation || "I've processed your request.";

      for (const op of response.operations) {
        switch (op.command) {
          case 'createGantt':
            hotInstance.loadData(ganttTemplate);
            break;
          case 'clearSheet':
            hotInstance.loadData(Array(10).fill(Array(5).fill('')));
            break;
          case 'setData':
            if (op.params.data) {
              hotInstance.loadData(op.params.data);
            }
            break;
          case 'formatCells':
            const { range, properties } = op.params;
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
            hotInstance.render();
            break;
          case 'info':
            // No data change, just show the message.
            break;
        }
      }
      
      toast({
        title: "Sasha's Update",
        description: confirmationMessage,
      });

    } catch (error) {
      console.error(error);
      toast({
        variant: 'destructive',
        title: t('genericErrorTitle'),
        description: t('genericErrorDesc'),
      });
    } finally {
      setIsLoading(false);
      setIsSashaOpen(false);
      setPrompt('');
    }
  };

  return (
    <div className="flex flex-col h-screen bg-background" dir={dir}>
      <header className="grid grid-cols-3 items-center p-4 border-b shrink-0">
        <div className="justify-self-start flex items-center gap-2">
          <SidebarTrigger />
        </div>
        <h1 className="text-xl font-semibold tracking-tight justify-self-center">
          Spreadsheet
        </h1>
        <div className="justify-self-end flex items-center gap-2">
            <Button
                variant="outline"
                onClick={() => setIsSashaOpen(true)}
            >
                <Wand2 className="mr-2 h-4 w-4" />
                Ask Sasha
            </Button>
            <LanguageToggle />
        </div>
      </header>
      
      <SpreadsheetToolbar hotInstance={hotInstance} />

      <main className="flex-1 overflow-auto">
        <Spreadsheet data={sheetData} hotRef={hotRef} />
      </main>

      <Dialog open={isSashaOpen} onOpenChange={setIsSashaOpen}>
        <DialogContent className="sm:max-w-[425px]" dir={dir}>
          <DialogHeader>
            <DialogTitle>Ask Sasha</DialogTitle>
            <DialogDescription>
              Tell Sasha what you want to do with the spreadsheet. For example: "Create a gantt chart" or "Make cell A1 bold and red".
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <Textarea
              id="sasha-prompt"
              placeholder="e.g., Make a gantt chart for a new project"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              className="col-span-3"
            />
          </div>
          <DialogFooter>
            <Button
              type="submit"
              onClick={handleSashaSubmit}
              disabled={isLoading || !hotInstance}
            >
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isLoading ? 'Thinking...' : 'Submit'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
