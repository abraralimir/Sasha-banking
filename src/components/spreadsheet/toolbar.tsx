'use client';

import React from 'react';
import type Handsontable from 'handsontable';
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
}

export function SpreadsheetToolbar({ hotInstance }: SpreadsheetToolbarProps) {

  const applyCellMeta = (prop: string, value: any) => {
    if (!hotInstance) return;
    const selected = hotInstance.getSelectedRange();
    if (!selected) return;

    for (const range of selected) {
      const fromRow = Math.min(range.from.row, range.to.row);
      const toRow = Math.max(range.from.row, range.to.row);
      const fromCol = Math.min(range.from.col, range.to.col);
      const toCol = Math.max(range.from.col, range.to.col);

      for (let row = fromRow; row <= toRow; row++) {
        for (let col = fromCol; col <= toCol; col++) {
          const currentMeta = hotInstance.getCellMeta(row, col) || {};
          let className = currentMeta.className || '';

          if (prop === 'className') {
            const alignments = ['htLeft', 'htCenter', 'htRight', 'htJustify'];
            if (alignments.includes(value)) {
              className = className.split(' ').filter(c => !alignments.includes(c)).join(' ');
              className += ` ${value}`;
            }
          }
          
          hotInstance.setCellMeta(row, col, 'className', className.trim());
        }
      }
    }
    hotInstance.render();
  };

  const toggleCellClass = (classNameToToggle: string) => {
    if (!hotInstance) return;
    const selected = hotInstance.getSelectedRange();
    if (!selected || selected.length === 0) return;
    
    // Use the first selected range to determine the initial state
    const firstRange = selected[0];
    const fromRow = Math.min(firstRange.from.row, firstRange.to.row);
    const fromCol = Math.min(firstRange.from.col, firstRange.to.col);
    
    const firstCellMeta = hotInstance.getCellMeta(fromRow, fromCol);
    const isApplied = firstCellMeta.className && firstCellMeta.className.includes(classNameToToggle);

    for (const range of selected) {
        const r1 = Math.min(range.from.row, range.to.row);
        const r2 = Math.max(range.from.row, range.to.row);
        const c1 = Math.min(range.from.col, range.to.col);
        const c2 = Math.max(range.from.col, range.to.col);

        for (let row = r1; row <= r2; row++) {
            for (let col = c1; col <= c2; col++) {
                const currentMeta = hotInstance.getCellMeta(row, col) || {};
                let classNames = (currentMeta.className || '').split(' ').filter(Boolean);
                
                if (isApplied) {
                    classNames = classNames.filter(cn => cn !== classNameToToggle);
                } else {
                    if (!classNames.includes(classNameToToggle)) {
                        classNames.push(classNameToToggle);
                    }
                }
                
                hotInstance.setCellMeta(row, col, 'className', classNames.join(' '));
            }
        }
    }
    hotInstance.render();
  };

  const handleBold = () => toggleCellClass('ht-cell-bold');
  const handleItalic = () => toggleCellClass('ht-cell-italic');
  const handleUnderline = () => toggleCellClass('ht-cell-underline');
  const handleAlignLeft = () => applyCellMeta('className', 'htLeft');
  const handleAlignCenter = () => applyCellMeta('className', 'htCenter');
  const handleAlignRight = () => applyCellMeta('className', 'htRight');

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
          </div>
        </Menubar>

        <div className="flex items-center space-x-2 mt-2">
          {/* Clipboard */}
          <div className="flex items-center space-x-1">
            <Tooltip>
              <TooltipTrigger asChild><Button variant="ghost" size="icon" className="h-8 w-8"><ClipboardPaste /></Button></TooltipTrigger>
              <TooltipContent><p>Paste</p></TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild><Button variant="ghost" size="icon" className="h-8 w-8"><Scissors /></Button></TooltipTrigger>
              <TooltipContent><p>Cut</p></TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild><Button variant="ghost" size="icon" className="h-8 w-8"><Copy /></Button></TooltipTrigger>
              <TooltipContent><p>Copy</p></TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild><Button variant="ghost" size="icon" className="h-8 w-8"><Paintbrush /></Button></TooltipTrigger>
              <TooltipContent><p>Format Painter</p></TooltipContent>
            </Tooltip>
          </div>
          <Separator orientation="vertical" className="h-6" />

          {/* Font */}
          <div className="flex items-center space-x-1">
            <Tooltip>
              <TooltipTrigger asChild><Button variant="ghost" size="icon" className="h-8 w-8" onClick={handleBold}><Bold /></Button></TooltipTrigger>
              <TooltipContent><p>Bold</p></TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild><Button variant="ghost" size="icon" className="h-8 w-8" onClick={handleItalic}><Italic /></Button></TooltipTrigger>
              <TooltipContent><p>Italic</p></TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild><Button variant="ghost" size="icon" className="h-8 w-8" onClick={handleUnderline}><Underline /></Button></TooltipTrigger>
              <TooltipContent><p>Underline</p></TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild><Button variant="ghost" size="icon" className="h-8 w-8"><Palette /></Button></TooltipTrigger>
              <TooltipContent><p>Font Color</p></TooltipContent>
            </Tooltip>
          </div>
          <Separator orientation="vertical" className="h-6" />

          {/* Alignment */}
          <div className="flex items-center space-x-1">
            <Tooltip>
              <TooltipTrigger asChild><Button variant="ghost" size="icon" className="h-8 w-8" onClick={handleAlignLeft}><AlignLeft /></Button></TooltipTrigger>
              <TooltipContent><p>Align Left</p></TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild><Button variant="ghost" size="icon" className="h-8 w-8" onClick={handleAlignCenter}><AlignCenter /></Button></TooltipTrigger>
              <TooltipContent><p>Center</p></TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild><Button variant="ghost" size="icon" className="h-8 w-8" onClick={handleAlignRight}><AlignRight /></Button></TooltipTrigger>
              <TooltipContent><p>Align Right</p></TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild><Button variant="ghost" size="icon" className="h-8 w-8"><WrapText /></Button></TooltipTrigger>
              <TooltipContent><p>Wrap Text</p></TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild><Button variant="ghost" size="icon" className="h-8 w-8"><Merge /></Button></TooltipTrigger>
              <TooltipContent><p>Merge & Center</p></TooltipContent>
            </Tooltip>
          </div>
          <Separator orientation="vertical" className="h-6" />
          
          {/* Editing */}
          <div className="flex items-center space-x-1">
             <Tooltip>
              <TooltipTrigger asChild><Button variant="ghost" size="icon" className="h-8 w-8"><Sigma /></Button></TooltipTrigger>
              <TooltipContent><p>AutoSum</p></TooltipContent>
            </Tooltip>
             <Tooltip>
              <TooltipTrigger asChild><Button variant="ghost" size="icon" className="h-8 w-8"><Filter /></Button></TooltipTrigger>
              <TooltipContent><p>Sort & Filter</p></TooltipContent>
            </Tooltip>
             <Tooltip>
              <TooltipTrigger asChild><Button variant="ghost" size="icon" className="h-8 w-8"><Search /></Button></TooltipTrigger>
              <TooltipContent><p>Find & Select</p></TooltipContent>
            </Tooltip>
          </div>
        </div>
      </div>
    </TooltipProvider>
  );
}
