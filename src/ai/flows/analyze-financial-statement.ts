'use server';

/**
 * @fileOverview A flow for analyzing a company's financial statement from a PDF.
 *
 * - analyzeFinancialStatement - A function that handles the financial statement analysis.
 * - AnalyzeFinancialStatementInput - The input type for the analyzeFinancialStatement function.
 * - AnalyzeFinancialStatementOutput - The return type for the analyzeFinancialStatement function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const AnalyzeFinancialStatementInputSchema = z.object({
  pdfDataUri: z
    .string()
    .describe(
      "A company's financial statement in PDF format, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:application/pdf;base64,<encoded_data>'."
    ),
});
export type AnalyzeFinancialStatementInput = z.infer<typeof AnalyzeFinancialStatementInputSchema>;

const AnalyzeFinancialStatementOutputSchema = z.object({
  summary: z.string().describe('A detailed AI-generated summary of the financial statement, including key metrics like revenue, profit, and cash flow.'),
  prediction: z.string().describe('A prediction of the company\'s financial health and future prospects (e.g., "Strong Growth Potential", "Stable but Cautious", "High-Risk").'),
});
export type AnalyzeFinancialStatementOutput = z.infer<typeof AnalyzeFinancialStatementOutputSchema>;

export async function analyzeFinancialStatement(input: AnalyzeFinancialStatementInput): Promise<AnalyzeFinancialStatementOutput> {
  return analyzeFinancialStatementFlow(input);
}

const analyzeFinancialStatementPrompt = ai.definePrompt({
  name: 'analyzeFinancialStatementPrompt',
  input: {schema: AnalyzeFinancialStatementInputSchema},
  output: {schema: AnalyzeFinancialStatementOutputSchema},
  prompt: `You are a sophisticated AI financial analyst. Your primary task is to analyze a company's yearly financial statement from a provided PDF document, which may contain various sections including marketing and other non-essential information.

Your goal is to be precise and focus exclusively on the financial data.

1.  **Locate Financial Data:** First, scan the document to find the core financial statements. These are typically labeled "Consolidated Statements of Operations," "Income Statement," "Consolidated Balance Sheets," "Balance Sheet," "Consolidated Statements of Cash Flows," or "Cash Flow Statement." Ignore all other sections like marketing fluff, company overview, or letters to shareholders unless they are directly cited in the financial analysis sections.

2.  **Extract Key Metrics:** From these financial statements, extract and analyze key metrics. Focus on:
    *   **Revenue / Sales:** Total sales figures.
    *   **Net Income / Profit:** The bottom-line profit.
    *   **Profit Margins:** Gross and net profit margins.
    *   **Cash Flow:** Particularly cash flow from operations.
    *   **Assets, Liabilities, and Equity:** Key figures from the balance sheet.
    *   Identify any significant year-over-year changes if data is available.

3.  **Generate Report:** Based on your focused analysis of the numbers, generate a report with the following two sections:
    *   **Summary:** Provide a detailed summary of the company's financial performance for the year based *only* on the metrics you extracted.
    *   **Prediction:** Provide a prediction of the company's future financial health and prospects (e.g., "Strong Growth Potential," "Stable but Cautious," "High-Risk"). Justify your prediction with specific data points and trends identified from the financial statements.

Analyze the following PDF document:
{{media url=pdfDataUri}}`,
});

const analyzeFinancialStatementFlow = ai.defineFlow(
  {
    name: 'analyzeFinancialStatementFlow',
    inputSchema: AnalyzeFinancialStatementInputSchema,
    outputSchema: AnalyzeFinancialStatementOutputSchema,
  },
  async (input) => {
    const {output} = await analyzeFinancialStatementPrompt(input);
    return output!;
  }
);
