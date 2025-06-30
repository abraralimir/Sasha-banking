'use server';

/**
 * @fileOverview A flow for analyzing loan data from a CSV file.
 *
 * - analyzeLoan - A function that handles the loan analysis.
 * - AnalyzeLoanInput - The input type for the analyzeLoan function.
 * - AnalyzeLoanOutput - The return type for the analyzeLoan function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

export const AnalyzeLoanInputSchema = z.object({
  csvData: z.string().describe('The loan data in CSV format.'),
  loanId: z.string().describe('The specific Loan ID to analyze from the CSV data.'),
});
export type AnalyzeLoanInput = z.infer<typeof AnalyzeLoanInputSchema>;

export const AnalyzeLoanOutputSchema = z.object({
  summary: z.string().describe('A detailed AI-generated summary of the loan profile.'),
  prediction: z.string().describe('The prediction of loan approval (e.g., "Approved", "Rejected", "High-Risk").'),
  eligibility: z.string().describe('A statement on the eligibility of the applicant with reasons.'),
});
export type AnalyzeLoanOutput = z.infer<typeof AnalyzeLoanOutputSchema>;

export async function analyzeLoan(input: AnalyzeLoanInput): Promise<AnalyzeLoanOutput> {
  return analyzeLoanFlow(input);
}

const analyzeLoanPrompt = ai.definePrompt({
  name: 'analyzeLoanPrompt',
  input: {schema: AnalyzeLoanInputSchema},
  output: {schema: AnalyzeLoanOutputSchema},
  prompt: `You are an expert loan analyst for a bank. Your task is to analyze a specific loan application from a provided CSV dataset.

Find the row in the following CSV data that corresponds to the Loan ID: {{{loanId}}}.

Once you have located the correct loan application, perform a comprehensive analysis based on all available columns for that row.

Generate a report with the following sections:
1.  **Summary:** Provide a detailed summary of the applicant's profile, highlighting key financial indicators, credit history, and loan purpose.
2.  **Prediction:** Based on your analysis, predict the likelihood of loan approval. State it clearly (e.g., "Approved", "Rejected", "High-Risk"). Justify your prediction with specific data points from the applicant's profile.
3.  **Eligibility:** State whether the applicant is eligible for the loan and provide a clear, concise explanation for your decision.

Here is the CSV data:
\`\`\`csv
{{{csvData}}}
\`\`\`

Analyze the loan with ID: {{{loanId}}}.
`,
});

const analyzeLoanFlow = ai.defineFlow(
  {
    name: 'analyzeLoanFlow',
    inputSchema: AnalyzeLoanInputSchema,
    outputSchema: AnalyzeLoanOutputSchema,
  },
  async (input) => {
    const {output} = await analyzeLoanPrompt(input);
    return output!;
  }
);
