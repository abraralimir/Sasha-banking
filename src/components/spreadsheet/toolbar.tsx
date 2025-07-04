'use client';

import React from 'react';
import type Handsontable from 'handsontable';
import * as XLSX from 'xlsx';
import {
  ClipboardPaste,
  Scissors,
  Copy,
  Paintbrush,
  Bold,
  Italic,
  Underline,
  Palette,
  AlignLeft,
  AlignCenter,
  AlignRight,
  WrapText,
  Merge,
  Sigma,
  Filter,
  Search,
} from 'lucide-react';

import {
  Menubar,
  MenubarMenu,
  MenubarTrigger,
} from '@/components/ui/menubar';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Separator } from '@/components/ui/separator';

interface SpreadsheetToolbarProps {
  hotInstance: Handsontable | null;
  onImport: () => void;
}

export function SpreadsheetToolbar({ hotInstance, onImport }: SpreadsheetToolbarProps) {

  const getSelectedRange = () => {
    if (!hotInstance) return [];
    // Handsontable's getSelectedRange returns an array of ranges.
    return hotInstance.getSelectedRange() || [];
  };

  const applyMetaToSelection = (callback: (row: number, col: number) => void) => {
    if (!hotInstance) return;
    const ranges = getSelectedRange();
    ranges.forEach(range => {
      const fromRow = Math.min(range.from.row, range.to.row);
      const toRow = Math.max(range.from.row, range.to.row);
      const fromCol = Math.min(range.from.col, range.to.col);
      const toCol = Math.max(range.from.col, range.to.col);

      for (let row = fromRow; row <= toRow; row++) {
        for (let col = fromCol; col <= toCol; col++) {
          callback(row, col);
        }
      }
    });
    hotInstance.render();
  };
  
  const toggleCellClass = (classNameToToggle: string) => {
    if (!hotInstance || getSelectedRange().length === 0) return;

    const firstCell = getSelectedRange()[0];
    const fromRow = Math.min(firstCell.from.row, firstCell.to.row);
    const fromCol = Math.min(firstCell.from.col, firstCell.to.col);
    const firstCellMeta = hotInstance.getCellMeta(fromRow, fromCol);
    const isApplied = (firstCellMeta.className || '').includes(classNameToToggle);

    applyMetaToSelection((row, col) => {
      const currentMeta = hotInstance.getCellMeta(row, col) || {};
      let classNames = (currentMeta.className || '').split(' ').filter(Boolean);
      
      if (isApplied) {
          classNames = classNames.filter(cn => cn !== classNameToToggle);
      } else if (!classNames.includes(classNameToToggle)) {
          classNames.push(classNameToToggle);
      }
      hotInstance.setCellMeta(row, col, 'className', classNames.join(' '));
    });
  };

  const setAlignment = (alignment: 'htLeft' | 'htCenter' | 'htRight' | 'htJustify') => {
    applyMetaToSelection((row, col) => {
        const currentMeta = hotInstance.getCellMeta(row, col) || {};
        let classNames = (currentMeta.className || '').split(' ').filter(Boolean);
        const alignments = ['htLeft', 'htCenter', 'htRight', 'htJustify'];
        // Remove existing alignment classes
        classNames = classNames.filter(c => !alignments.includes(c));
        // Add the new alignment class
        classNames.push(alignment);
        hotInstance.setCellMeta(row, col, 'className', classNames.join(' '));
    });
  };

  const handleMergeToggle = () => {
    if (!hotInstance) return;
    const mergePlugin = hotInstance.getPlugin('mergeCells');
    const ranges = getSelectedRange();
    if (ranges.length === 0) return;
    
    const range = ranges[0]; // Handsontable supports multiple selections, but we'll work with the first for simplicity
    const selection = hotInstance.getSelectedRangeLast();
    if (!selection) return;

    // Check if the selection is already merged
    const isMerged = mergePlugin.getMergedCell(selection.from.row, selection.from.col);

    if (isMerged) {
      mergePlugin.unmerge(selection.from.row, selection.from.col);
    } else {
      mergePlugin.merge(selection.from.row, selection.from.col, selection.to.row, selection.to.col);
    }
    hotInstance.render();
  };

  const handleWrapTextToggle = () => {
    if (!hotInstance || getSelectedRange().length === 0) return;
    
    const firstCell = getSelectedRange()[0];
    const fromRow = Math.min(firstCell.from.row, firstCell.to.row);
    const fromCol = Math.min(firstCell.from.col, firstCell.to.col);
    const firstCellMeta = hotInstance.getCellMeta(fromRow, fromCol);
    const isWrapped = firstCellMeta.wordWrap === 'break-word';

    applyMetaToSelection((row, col) => {
        hotInstance.setCellMeta(row, col, 'wordWrap', isWrapped ? 'normal' : 'break-word');
    });
  };

  const handleDownload = () => {
    if (!hotInstance) return;

    const colHeaders = hotInstance.getColHeader() as string[];
    const rowHeaders = hotInstance.getRowHeader() as (string | number)[];
    const data = hotInstance.getData();

    const exportData = [
      ['', ...colHeaders],
      ...data.map((row, i) => [rowHeaders[i] || '', ...row])
    ];

    const ws = XLSX.utils.aoa_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Sheet1');
    XLSX.writeFile(wb, 'Sasha-Spreadsheet.xlsx');
  };

  const isEnabled = !!hotInstance;

  return (
    <TooltipProvider>
      <div className="p-2 border-b bg-background">
        <Menubar className="border-none p-0 h-auto bg-transparent">
          <div className="flex items-center space-x-1">
            <MenubarMenu>
              <MenubarTrigger className="px-3 py-1.5">File</MenubarTrigger>
            </MenubarMenu>
            <MenubarMenu>
              <MenubarTrigger className="px-3 py-1.5 bg-muted">Home</MenubarTrigger>
            </MenubarMenu>
            <MenubarMenu>
              <MenubarTrigger className="px-3 py-1.5">Insert</MenubarTrigger>
            </MenubarMenu>
            <MenubarMenu>
              <MenubarTrigger className="px-3 py-1.5">Formulas</MenubarTrigger>
            </MenubarMenu>
             <MenubarMenu>
              <MenubarTrigger className="px-3 py-1.5">Data</MenubarTrigger>
            </MenubarMenu>
             <MenubarMenu>
              <MenubarTrigger className="px-3 py-1.5">Review</MenubarTrigger>
            </MenubarMenu>
             <MenubarMenu>
              <MenubarTrigger className="px-3 py-1.5">View</MenubarTrigger>
            </MenubarMenu>
            <MenubarMenu>
              <MenubarTrigger className="px-3 py-1.5" onClick={handleDownload} disabled={!isEnabled}>Download</MenubarTrigger>
            </MenubarMenu>
            <MenubarMenu>
              <MenubarTrigger className="px-3 py-1.5" onClick={onImport} disabled={!isEnabled}>Import</MenubarTrigger>
            </MenubarMenu>
          </div>
        </Menubar>

        <div className="flex items-center space-x-2 mt-2">
          {/* Clipboard */}
          <div className="flex items-center space-x-1">
            <Tooltip>
              <TooltipTrigger asChild><Button variant="ghost" size="icon" className="h-8 w-8" disabled={!isEnabled}><ClipboardPaste /></Button></TooltipTrigger>
              <TooltipContent><p>Paste</p></TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild><Button variant="ghost" size="icon" className="h-8 w-8" disabled={!isEnabled}><Scissors /></Button></TooltipTrigger>
              <TooltipContent><p>Cut</p></TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild><Button variant="ghost" size="icon" className="h-8 w-8" disabled={!isEnabled}><Copy /></Button></TooltipTrigger>
              <TooltipContent><p>Copy</p></TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild><Button variant="ghost" size="icon" className="h-8 w-8" disabled={!isEnabled}><Paintbrush /></Button></TooltipTrigger>
              <TooltipContent><p>Format Painter</p></TooltipContent>
            </Tooltip>
          </div>
          <Separator orientation="vertical" className="h-6" />

          {/* Font */}
          <div className="flex items-center space-x-1">
            <Tooltip>
              <TooltipTrigger asChild><Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => toggleCellClass('ht-cell-bold')} disabled={!isEnabled}><Bold /></Button></TooltipTrigger>
              <TooltipContent><p>Bold</p></TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild><Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => toggleCellClass('ht-cell-italic')} disabled={!isEnabled}><Italic /></Button></TooltipTrigger>
              <TooltipContent><p>Italic</p></TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild><Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => toggleCellClass('ht-cell-underline')} disabled={!isEnabled}><Underline /></Button></TooltipTrigger>
              <TooltipContent><p>Underline</p></TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild><Button variant="ghost" size="icon" className="h-8 w-8" disabled={!isEnabled}><Palette /></Button></TooltipTrigger>
              <TooltipContent><p>Font Color</p></TooltipContent>
            </Tooltip>
          </div>
          <Separator orientation="vertical" className="h-6" />

          {/* Alignment */}
          <div className="flex items-center space-x-1">
            <Tooltip>
              <TooltipTrigger asChild><Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setAlignment('htLeft')} disabled={!isEnabled}><AlignLeft /></Button></TooltipTrigger>
              <TooltipContent><p>Align Left</p></TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild><Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setAlignment('htCenter')} disabled={!isEnabled}><AlignCenter /></Button></TooltipTrigger>
              <TooltipContent><p>Center</p></TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild><Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setAlignment('htRight')} disabled={!isEnabled}><AlignRight /></Button></TooltipTrigger>
              <TooltipContent><p>Align Right</p></TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild><Button variant="ghost" size="icon" className="h-8 w-8" onClick={handleWrapTextToggle} disabled={!isEnabled}><WrapText /></Button></TooltipTrigger>
              <TooltipContent><p>Wrap Text</p></TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild><Button variant="ghost" size="icon" className="h-8 w-8" onClick={handleMergeToggle} disabled={!isEnabled}><Merge /></Button></TooltipTrigger>
              <TooltipContent><p>Merge & Center</p></TooltipContent>
            </Tooltip>
          </div>
          <Separator orientation="vertical" className="h-6" />
          
          {/* Editing */}
          <div className="flex items-center space-x-1">
             <Tooltip>
              <TooltipTrigger asChild><Button variant="ghost" size="icon" className="h-8 w-8" disabled={!isEnabled}><Sigma /></Button></TooltipTrigger>
              <TooltipContent><p>AutoSum</p></TooltipContent>
            </Tooltip>
             <Tooltip>
              <TooltipTrigger asChild><Button variant="ghost" size="icon" className="h-8 w-8" disabled={!isEnabled}><Filter /></Button></TooltipTrigger>
              <TooltipContent><p>Sort & Filter</p></TooltipContent>
            </Tooltip>
             <Tooltip>
              <TooltipTrigger asChild><Button variant="ghost" size="icon" className="h-8 w-8" disabled={!isEnabled}><Search /></Button></TooltipTrigger>
              <TooltipContent><p>Find & Select</p></TooltipContent>
            </Tooltip>
          </div>
        </div>
      </div>
    </TooltipProvider>
  );
}
