'use client';

import React, { useState, useRef, useEffect } from 'react';
import type { HotTable } from '@handsontable/react';
import type Handsontable from 'handsontable';
import * as XLSX from 'xlsx';
import { LanguageToggle } from '@/components/language-toggle';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { Spreadsheet } from '@/components/spreadsheet/spreadsheet';
import { Button } from '@/components/ui/button';
import { Wand2, Loader2 } from 'lucide-react';
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

export default function SpreadsheetPage() {
  const { t, language, dir } = useLanguage();
  const [sheetData, setSheetData] = useState<any[][]>(initialData);
  const [isSashaOpen, setIsSashaOpen] = useState(false);
  const [prompt, setPrompt] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const hotRef = useRef<HotTable>(null);
  const [hotInstance, setHotInstance] = useState<Handsontable | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (hotRef.current) {
      const instance = hotRef.current.hotInstance;
      setHotInstance(instance);
      // This is a workaround to ensure the data is loaded correctly
      // when the component mounts or when sheetData changes externally.
      if(instance.getSourceData() !== sheetData) {
        instance.loadData(sheetData);
      }
    }
  }, [sheetData]);

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
            setSheetData(json as any[][]);
            toast({
                title: 'Import Successful',
                description: `Successfully imported "${file.name}".`,
            });
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
            setSheetData(ganttTemplate);
            break;
          case 'clearSheet':
            setSheetData([[]]);
            hotInstance.updateSettings({ cell: [] }); // Clear formatting
            hotInstance.render();
            break;
          case 'setData':
            if (op.params.data) {
              setSheetData(op.params.data);
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
              hotInstance.render();
            }
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
      
      <SpreadsheetToolbar hotInstance={hotInstance} onImport={handleImportClick} />

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
