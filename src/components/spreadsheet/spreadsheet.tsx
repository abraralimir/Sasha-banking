'use client';

import React from 'react';
import { HotTable } from '@handsontable/react';
import { registerAllModules } from 'handsontable/registry';
import Handsontable from 'handsontable';
import { HyperFormula } from 'hyperformula';

// register Handsontable's modules
registerAllModules();

// Custom renderer for cell styling (colors)
const customStyleRenderer: Handsontable.renderers.Base = function (
  instance,
  td,
  row,
  col,
  prop,
  value,
  cellProperties
) {
  // Use the 'text' renderer as a base
  (Handsontable.renderers.get('text') as any).apply(this, arguments);

  const customStyle = cellProperties.customStyle;
  if (customStyle) {
    if (customStyle.color) {
      td.style.color = customStyle.color;
    }
    if (customStyle.backgroundColor) {
      td.style.backgroundColor = customStyle.backgroundColor;
    }
  }
};

// Register it before component render, only if it doesn't exist.
if (typeof window !== 'undefined' && !Handsontable.renderers.getNames().includes('customStyleRenderer')) {
  Handsontable.renderers.registerRenderer('customStyleRenderer', customStyleRenderer);
}


interface SpreadsheetProps {
  data: any[][];
  hotRef?: React.RefObject<HotTable>;
}

export function Spreadsheet({ data, hotRef }: SpreadsheetProps) {
  return (
    <div className="w-full h-full handsontable-container">
      <HotTable
        ref={hotRef}
        data={data}
        rowHeaders={true}
        colHeaders={true}
        height="100%"
        width="100%"
        licenseKey="non-commercial-and-evaluation"
        stretchH="all"
        autoWrapRow={true}
        autoWrapCol={true}
        contextMenu={true}
        manualColumnResize={true}
        manualRowResize={true}
        filters={true}
        dropdownMenu={true}
        comments={true}
        mergeCells={true}
        wordWrap={true}
        formulas={{
          engine: HyperFormula,
        }}
        cell={[]}
      />
    </div>
  );
}
