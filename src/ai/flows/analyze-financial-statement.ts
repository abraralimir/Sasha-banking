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
  prompt: `You are an expert financial analyst. Your task is to analyze a company's yearly financial statement provided as a PDF document.

Thoroughly review the entire document.

Generate a report with the following sections:
1.  **Summary:** Provide a detailed summary of the company's financial performance for the year. Highlight key metrics like revenue, net income, profit margins, cash flow from operations, and any significant changes from previous periods mentioned in the document.
2.  **Prediction:** Based on your analysis, provide a prediction of the company's future financial health and prospects. State it clearly (e.g., "Strong Growth Potential", "Stable but Cautious", "High-Risk"). Justify your prediction with specific data points and trends from the financial statement.

Here is the financial statement PDF:
{{media url=pdfDataUri}}
`,
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
