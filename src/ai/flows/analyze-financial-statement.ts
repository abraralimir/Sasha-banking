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
  language: z.enum(['en', 'ar']).default('en').describe('The language for the response, either English (en) or Arabic (ar).'),
});
export type AnalyzeFinancialStatementInput = z.infer<typeof AnalyzeFinancialStatementInputSchema>;

const AnalyzeFinancialStatementOutputSchema = z.object({
  summary: z.string().describe("An expansive, multi-paragraph summary of the entity's financial health, weaving in KPIs, ratios, and trend analysis into a rich, coherent narrative."),
  prediction: z.string().describe('A clear, evidence-backed prediction of the company\'s financial trajectory (e.g., "Strong Growth Potential," "Stable but Cautious," "High-Risk").'),
  creditScorePrediction: z.string().describe('A predicted credit score (as a specific number or a tight range, e.g., 680-720) and a brief justification, framed within the context of Omani and general Middle Eastern credit bureau standards.')
});
export type AnalyzeFinancialStatementOutput = z.infer<typeof AnalyzeFinancialStatementOutputSchema>;

export async function analyzeFinancialStatement(input: AnalyzeFinancialStatementInput): Promise<AnalyzeFinancialStatementOutput> {
  return analyzeFinancialStatementFlow(input);
}

const analyzeFinancialStatementPrompt = ai.definePrompt({
  name: 'analyzeFinancialStatementPrompt',
  input: {schema: AnalyzeFinancialStatementInputSchema},
  output: {schema: AnalyzeFinancialStatementOutputSchema},
  prompt: `You are a top-tier AI financial analyst, equivalent to a senior analyst at a major investment firm, with deep expertise in Middle Eastern financial markets, particularly **Omani credit bureau standards**. Your task is to perform a deep, critical analysis of a company's or individual's financial statement from a provided PDF.

Your goal is to be surgically precise, focusing exclusively on the financial data to produce an institutional-quality report. Your entire report MUST be written in the following language: {{{language}}}.

1.  **Isolate Financial Core:** Scan the document to locate primary financial statements (Income Statement, Balance Sheet, Cash Flow Statement). Disregard all non-essential narrative sections.

2.  **Comprehensive Metric & Ratio Analysis:** From the core statements, extract and analyze:
    *   **Key Performance Indicators (KPIs):** Revenue, Cost of Goods Sold (COGS), Gross Profit, Operating Expenses, Operating Income (EBIT), Net Income.
    *   **Balance Sheet Items:** Total Assets, Total Liabilities, Shareholders' Equity. Note the composition of assets and liabilities.
    *   **Cash Flow:** Cash Flow from Operations (CFO), Cash Flow from Investing (CFI), Cash Flow from Financing (CFF).
    *   **Key Financial Ratios:**
        *   **Profitability:** Gross Profit Margin, Net Profit Margin, Return on Equity (ROE).
        *   **Liquidity:** Current Ratio.
        *   **Leverage:** Debt-to-Equity Ratio.
    *   **Trend Analysis:** Identify significant year-over-year (YoY) changes.

3.  **Generate In-Depth Report:** Synthesize your findings into a detailed report with three sections:
    *   **In-Depth Summary and Trend Analysis:** Provide an expansive, multi-paragraph summary of the entity's financial health. This should be a rich, coherent narrative that explains the story behind the numbers. Critically analyze year-over-year trends, discussing their implications. Weave in the KPIs and ratios to support your analysis of strengths, weaknesses, and opportunities.
    *   **Evidence-Based Prediction:** Offer a clear, evidence-backed prediction of the company's future financial trajectory (e.g., "Strong Growth Potential," "Stable but Cautious," "High-Risk"). Justify this by citing specific ratios, trends, and cash flow dynamics. Be definitive in your reasoning.
    *   **Credit Score Assessment:** Based on your analysis, provide a predicted credit score (as a specific number or a tight range, e.g., 680-720). Your assessment must be framed within the context of **Omani and general Middle Eastern credit bureau standards**. Briefly justify the score, explaining which financial factors (e.g., debt levels, profitability, cash flow stability) led to your prediction according to these regional standards.

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
