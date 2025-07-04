'use client';

import React from 'react';
import type Handsontable from 'handsontable';
import * as XLSX from 'xlsx';
import {
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
import { useLanguage } from '@/context/language-context';

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
  toggleFullscreen: () => void;
  isFullscreen: boolean;
}

export function SpreadsheetToolbar({ hotInstance, onImport, toggleFullscreen, isFullscreen }: SpreadsheetToolbarProps) {
  const { t } = useLanguage();

  const toggleCellClass = (classNameToToggle: string) => {
    if (!hotInstance) return;
    const selectedRange = hotInstance.getSelectedRangeLast();
    if (!selectedRange) return;

    // Use the first cell to determine if the class should be added or removed
    const firstCellMeta = hotInstance.getCellMeta(selectedRange.from.row, selectedRange.from.col);
    const isApplied = (firstCellMeta.className || '').includes(classNameToToggle);

    hotInstance.batch(() => {
        for (const [row, col] of selectedRange.forAll()) {
            const currentMeta = hotInstance.getCellMeta(row, col);
            let classNames = (currentMeta.className || '').split(' ').filter(Boolean);
            
            if (isApplied) {
                // If the class is already applied, remove it
                classNames = classNames.filter(cn => cn !== classNameToToggle);
            } else {
                // If the class is not applied, add it
                if (!classNames.includes(classNameToToggle)) {
                    classNames.push(classNameToToggle);
                }
            }
            hotInstance.setCellMeta(row, col, 'className', classNames.join(' '));
        }
    });
    hotInstance.render();
  };

  const setAlignment = (alignment: 'htLeft' | 'htCenter' | 'htRight' | 'htJustify') => {
    if (!hotInstance) return;
    const selectedRange = hotInstance.getSelectedRangeLast();
     if (!selectedRange) return;

    hotInstance.batch(() => {
        for (const [row, col] of selectedRange.forAll()) {
            const currentMeta = hotInstance.getCellMeta(row, col);
            let classNames = (currentMeta.className || '').split(' ').filter(Boolean);
            const alignments = ['htLeft', 'htCenter', 'htRight', 'htJustify'];
            // Remove any existing alignment classes
            classNames = classNames.filter(c => !alignments.includes(c));
            // Add the new alignment class
            classNames.push(alignment);
            hotInstance.setCellMeta(row, col, 'className', classNames.join(' '));
        }
    });
    hotInstance.render();
  };

  const handleMergeToggle = () => {
    if (!hotInstance) return;
    const mergePlugin = hotInstance.getPlugin('mergeCells');
    const selection = hotInstance.getSelectedRangeLast();
    if (!selection) return;

    // Check if the selection is already part of a merged area
    const isMerged = mergePlugin.getMergedCell(selection.from.row, selection.from.col);

    if (isMerged) {
      // If it's merged, unmerge it. `unmerge` takes the top-left cell of the merge area.
      mergePlugin.unmerge(selection.from.row, selection.from.col);
    } else {
      // If it's not merged, merge the selection.
      mergePlugin.merge(selection.from.row, selection.from.col, selection.to.row, selection.to.col);
    }
    hotInstance.render();
  };

  const handleWrapTextToggle = () => {
    if (!hotInstance) return;
    const selectedRange = hotInstance.getSelectedRangeLast();
    if (!selectedRange) return;

    const firstCellMeta = hotInstance.getCellMeta(selectedRange.from.row, selectedRange.from.col);
    // Check if wordWrap is already set to 'break-word', which we use for wrapping
    const isWrapped = firstCellMeta.wordWrap === 'break-word';

    hotInstance.batch(() => {
        for (const [row, col] of selectedRange.forAll()) {
            hotInstance.setCellMeta(row, col, 'wordWrap', isWrapped ? 'normal' : 'break-word');
        }
    });
    // We need to re-render to apply word wrap changes
    hotInstance.render();
  };

  const handleCopy = () => {
    hotInstance?.getPlugin('copyPaste').copy();
  }

  const handleCut = () => {
    hotInstance?.getPlugin('copyPaste').cut();
  }

  const handleDownload = () => {
    if (!hotInstance) return;
    const data = hotInstance.getData();
    const ws = XLSX.utils.aoa_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Sheet1');
    XLSX.writeFile(wb, 'Sasha-Spreadsheet.xlsx');
  };

  const isEnabled = !!hotInstance;

  return (
    <TooltipProvider>
      <div className="p-2 border-b bg-background">
        <Menubar className="border-none p-0 h-auto bg-transparent">
          <div className="flex items-center space-x-1 flex-wrap">
            <MenubarMenu>
              <MenubarTrigger className="px-3 py-1.5 cursor-not-allowed">{t('toolbarFile')}</MenubarTrigger>
            </MenubarMenu>
            <MenubarMenu>
              <MenubarTrigger className="px-3 py-1.5 bg-muted">{t('toolbarHome')}</MenubarTrigger>
            </MenubarMenu>
            <MenubarMenu>
              <MenubarTrigger className="px-3 py-1.5 cursor-not-allowed">{t('toolbarInsert')}</MenubarTrigger>
            </MenubarMenu>
            <MenubarMenu>
              <MenubarTrigger className="px-3 py-1.5 cursor-not-allowed">{t('toolbarFormulas')}</MenubarTrigger>
            </MenubarMenu>
             <MenubarMenu>
              <MenubarTrigger className="px-3 py-1.5 cursor-not-allowed">{t('toolbarData')}</MenubarTrigger>
            </MenubarMenu>
             <MenubarMenu>
              <MenubarTrigger className="px-3 py-1.5 cursor-not-allowed">{t('toolbarReview')}</MenubarTrigger>
            </MenubarMenu>
             <MenubarMenu>
              <MenubarTrigger className="px-3 py-1.5 cursor-not-allowed">{t('toolbarView')}</MenubarTrigger>
            </MenubarMenu>
            <MenubarMenu>
              <MenubarTrigger className="px-3 py-1.5" onClick={toggleFullscreen}>
                {isFullscreen ? t('toolbarExitFullscreen') : t('toolbarFullscreen')}
              </MenubarTrigger>
            </MenubarMenu>
            <MenubarMenu>
              <MenubarTrigger className="px-3 py-1.5" onClick={handleDownload} disabled={!isEnabled}>{t('toolbarDownload')}</MenubarTrigger>
            </MenubarMenu>
            <MenubarMenu>
              <MenubarTrigger className="px-3 py-1.5" onClick={onImport}>{t('toolbarImport')}</MenubarTrigger>
            </MenubarMenu>
          </div>
        </Menubar>

        <div className="flex items-center space-x-2 mt-2 flex-wrap">
          {/* Clipboard */}
          <div className="flex items-center space-x-1">
            <Tooltip>
              <TooltipTrigger asChild><Button variant="ghost" size="icon" className="h-8 w-8" disabled={true}><div className="flex flex-col items-center"><Copy className="h-4 w-4" /><span className="text-[10px] -mt-1">{t('tooltipPaste').split(' ')[0]}</span></div></Button></TooltipTrigger>
              <TooltipContent><p>{t('tooltipPaste')}</p></TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild><Button variant="ghost" size="icon" className="h-8 w-8" onClick={handleCut} disabled={!isEnabled}><Scissors /></Button></TooltipTrigger>
              <TooltipContent><p>{t('tooltipCut')}</p></TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild><Button variant="ghost" size="icon" className="h-8 w-8" onClick={handleCopy} disabled={!isEnabled}><Copy /></Button></TooltipTrigger>
              <TooltipContent><p>{t('tooltipCopy')}</p></TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild><Button variant="ghost" size="icon" className="h-8 w-8" disabled={true}><Paintbrush /></Button></TooltipTrigger>
              <TooltipContent><p>{t('tooltipFormatPainter')}</p></TooltipContent>
            </Tooltip>
          </div>
          <Separator orientation="vertical" className="h-6" />

          {/* Font */}
          <div className="flex items-center space-x-1">
            <Tooltip>
              <TooltipTrigger asChild><Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => toggleCellClass('ht-cell-bold')} disabled={!isEnabled}><Bold /></Button></TooltipTrigger>
              <TooltipContent><p>{t('tooltipBold')}</p></TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild><Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => toggleCellClass('ht-cell-italic')} disabled={!isEnabled}><Italic /></Button></TooltipTrigger>
              <TooltipContent><p>{t('tooltipItalic')}</p></TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild><Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => toggleCellClass('ht-cell-underline')} disabled={!isEnabled}><Underline /></Button></TooltipTrigger>
              <TooltipContent><p>{t('tooltipUnderline')}</p></TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild><Button variant="ghost" size="icon" className="h-8 w-8" disabled={true}><Palette /></Button></TooltipTrigger>
              <TooltipContent><p>{t('tooltipFontColor')}</p></TooltipContent>
            </Tooltip>
          </div>
          <Separator orientation="vertical" className="h-6" />

          {/* Alignment */}
          <div className="flex items-center space-x-1">
            <Tooltip>
              <TooltipTrigger asChild><Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setAlignment('htLeft')} disabled={!isEnabled}><AlignLeft /></Button></TooltipTrigger>
              <TooltipContent><p>{t('tooltipAlignLeft')}</p></TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild><Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setAlignment('htCenter')} disabled={!isEnabled}><AlignCenter /></Button></TooltipTrigger>
              <TooltipContent><p>{t('tooltipCenter')}</p></TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild><Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setAlignment('htRight')} disabled={!isEnabled}><AlignRight /></Button></TooltipTrigger>
              <TooltipContent><p>{t('tooltipAlignRight')}</p></TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild><Button variant="ghost" size="icon" className="h-8 w-8" onClick={handleWrapTextToggle} disabled={!isEnabled}><WrapText /></Button></TooltipTrigger>
              <TooltipContent><p>{t('tooltipWrapText')}</p></TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild><Button variant="ghost" size="icon" className="h-8 w-8" onClick={handleMergeToggle} disabled={!isEnabled}><Merge /></Button></TooltipTrigger>
              <TooltipContent><p>{t('tooltipMergeCenter')}</p></TooltipContent>
            </Tooltip>
          </div>
          <Separator orientation="vertical" className="h-6" />
          
          {/* Editing */}
          <div className="flex items-center space-x-1">
             <Tooltip>
              <TooltipTrigger asChild><Button variant="ghost" size="icon" className="h-8 w-8" disabled={true}><Sigma /></Button></TooltipTrigger>
              <TooltipContent><p>{t('tooltipAutoSum')}</p></TooltipContent>
            </Tooltip>
             <Tooltip>
              <TooltipTrigger asChild><Button variant="ghost" size="icon" className="h-8 w-8" disabled={true}><Filter /></Button></TooltipTrigger>
              <TooltipContent><p>{t('tooltipSortFilter')}</p></TooltipContent>
            </Tooltip>
             <Tooltip>
              <TooltipTrigger asChild><Button variant="ghost" size="icon" className="h-8 w-8" disabled={true}><Search /></Button></TooltipTrigger>
              <TooltipContent><p>{t('tooltipFindSelect')}</p></TooltipContent>
            </Tooltip>
          </div>
        </div>
      </div>
    </TooltipProvider>
  );
}
