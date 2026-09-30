/** Spreadsheet data model. Plain JSON, so it lives in a challenge's starter data and in the player's saved draft. */
export type CellValue = string | number | boolean;
/** Cells by A1 address. A string starting with "=" is a formula; everything else is a typed constant. */
export type Cells = Record<string, CellValue>;

export interface PivotValue { field: string; agg: 'sum' | 'count' | 'average' | 'min' | 'max' }
export interface PivotSpec {
  /** Source range INCLUDING the header row, e.g. `Sales!A1:E40`. */
  source: string;
  /** Fields (header names) that form the row groups, outermost first. */
  rows: string[];
  values: PivotValue[];
  /** Keep only rows where `field` equals `equals`. */
  filters?: { field: string; equals: CellValue }[];
}

export interface ChartSpec {
  type: 'column' | 'bar' | 'line' | 'pie' | 'scatter';
  /** Range holding the category labels (or x values), e.g. `Sheet1!A2:A7`. */
  categories: string;
  /** One range per data series. */
  series: string[];
  title?: string;
}

export interface WorkbookData {
  sheets: Record<string, Cells>;
  /** Which sheet a bare address refers to (default: the first). */
  active?: string;
  pivots?: PivotSpec[];
  charts?: ChartSpec[];
}

export class SheetError {
  constructor(public code: '#DIV/0!' | '#N/A' | '#VALUE!' | '#REF!' | '#NAME?' | '#NUM!' | '#CIRCULAR!') {}
  toString(): string { return this.code; }
}

/** What a cell evaluates to. `null` is an empty cell. */
export type Value = number | string | boolean | null | SheetError;
export type Matrix = Value[][];
