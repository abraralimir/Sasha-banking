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
  ChevronDown,
} from 'lucide-react';

import {
  Menubar,
  MenubarContent,
  MenubarItem,
  MenubarMenu,
  MenubarSeparator,
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
  // Most buttons would have functions like this:
  const handleBold = () => {
    if (!hotInstance) return;
    // This is a placeholder for the actual logic to apply bold formatting
    console.log('Toggling bold');
  };

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
              <TooltipTrigger asChild><Button variant="ghost" size="icon" className="h-8 w-8"><Italic /></Button></TooltipTrigger>
              <TooltipContent><p>Italic</p></TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild><Button variant="ghost" size="icon" className="h-8 w-8"><Underline /></Button></TooltipTrigger>
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
              <TooltipTrigger asChild><Button variant="ghost" size="icon" className="h-8 w-8"><AlignLeft /></Button></TooltipTrigger>
              <TooltipContent><p>Align Left</p></TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild><Button variant="ghost" size="icon" className="h-8 w-8"><AlignCenter /></Button></TooltipTrigger>
              <TooltipContent><p>Center</p></TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild><Button variant="ghost" size="icon" className="h-8 w-8"><AlignRight /></Button></TooltipTrigger>
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
