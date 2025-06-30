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
  summary: z.string().describe('A dense, executive summary of the financial statement, weaving in KPIs and ratios into a coherent narrative.'),
  prediction: z.string().describe('A clear, evidence-backed prediction of the company\'s financial trajectory (e.g., "Strong Growth Potential," "Stable but Cautious," "High-Risk").'),
});
export type AnalyzeFinancialStatementOutput = z.infer<typeof AnalyzeFinancialStatementOutputSchema>;

export async function analyzeFinancialStatement(input: AnalyzeFinancialStatementInput): Promise<AnalyzeFinancialStatementOutput> {
  return analyzeFinancialStatementFlow(input);
}

const analyzeFinancialStatementPrompt = ai.definePrompt({
  name: 'analyzeFinancialStatementPrompt',
  input: {schema: AnalyzeFinancialStatementInputSchema},
  output: {schema: AnalyzeFinancialStatementOutputSchema},
  prompt: `You are a top-tier AI financial analyst, equivalent to a senior analyst at a major investment firm. Your task is to perform a deep, critical analysis of a company's yearly financial statement from a provided PDF. Your analysis must be sharp, data-driven, and insightful, cutting through non-essential information to deliver actionable intelligence.

Your goal is to be surgically precise, focusing exclusively on the financial data to produce an institutional-quality report.

1.  **Isolate Financial Core:** Immediately scan the document to locate the primary financial statements (Income Statement, Balance Sheet, Cash Flow Statement). Disregard all marketing material, shareholder letters, and other narrative sections unless they contain specific financial data or footnotes referenced by the core statements.

2.  **Comprehensive Metric & Ratio Analysis:** From the core statements, extract and analyze the following:
    *   **Key Performance Indicators (KPIs):** Revenue, Cost of Goods Sold (COGS), Gross Profit, Operating Expenses, Operating Income (EBIT), Net Income.
    *   **Balance Sheet Items:** Total Assets, Total Liabilities, Shareholders' Equity. Note the composition of assets (current vs. non-current) and liabilities.
    *   **Cash Flow:** Cash Flow from Operations (CFO), Cash Flow from Investing (CFI), Cash Flow from Financing (CFF).
    *   **Key Financial Ratios:**
        *   **Profitability:** Gross Profit Margin, Net Profit Margin, Return on Equity (ROE).
        *   **Liquidity:** Current Ratio.
        *   **Leverage:** Debt-to-Equity Ratio.
    *   **Trend Analysis:** Identify significant year-over-year (YoY) changes in these metrics and ratios if the data is available.

3.  **Generate Executive-Level Report:** Synthesize your findings into a concise report with two sections:
    *   **Summary:** Provide a dense, executive summary of the company's financial performance. Start with a headline statement (e.g., "Robust profitability but rising leverage"). Weave the extracted KPIs and ratios into a coherent narrative.
    *   **Prediction:** Offer a clear, evidence-backed prediction of the company's financial trajectory (e.g., "Strong Growth Potential," "Stable but Cautious," "High-Risk"). Justify this prediction by citing specific ratios, trends, and cash flow dynamics you identified.

Analyze the following PDF document with utmost precision:
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
