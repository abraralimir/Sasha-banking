'use server';

/**
 * @fileOverview A flow for generating a data analysis dashboard from CSV data.
 *
 * - generateDashboard - A function that handles the dashboard generation.
 * - GenerateDashboardInput - The input type for the generateDashboard function.
 * - GenerateDashboardOutput - The return type for the generateDashboard function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateDashboardInputSchema = z.object({
  csvData: z.string().describe('The dataset in CSV format.'),
  language: z.enum(['en', 'ar']).default('en').describe('The language for the response, either English (en) or Arabic (ar).'),
});
export type GenerateDashboardInput = z.infer<typeof GenerateDashboardInputSchema>;

const ChartDataSchema = z.object({
    labels: z.array(z.string()).describe('The labels for the chart axes or segments.'),
    datasets: z.array(z.object({
        label: z.string().describe('The label for the dataset.'),
        data: z.array(z.number()).describe('The numerical data for the dataset.'),
    })).describe('The datasets to be plotted.'),
});

const GenerateDashboardOutputSchema = z.object({
  title: z.string().describe("A title for the dashboard, reflecting the content of the data."),
  summary: z.string().describe("A multi-paragraph summary of the data, highlighting key trends, patterns, and anomalies."),
  keyInsights: z.array(z.string()).describe("A list of 3-5 bullet-point insights that are actionable or particularly noteworthy."),
  charts: z.array(z.object({
    type: z.enum(['bar', 'pie']).describe("The type of chart to generate."),
    title: z.string().describe("The title of the chart."),
    data: ChartDataSchema.describe("The data for the chart, formatted for Chart.js."),
  })).describe("An array of up to 2 charts (one bar, one pie if possible) to visualize the data. The data should be directly usable by Chart.js.")
});
export type GenerateDashboardOutput = z.infer<typeof GenerateDashboardOutputSchema>;

export async function generateDashboard(input: GenerateDashboardInput): Promise<GenerateDashboardOutput> {
  return generateDashboardFlow(input);
}

const generateDashboardPrompt = ai.definePrompt({
  name: 'generateDashboardPrompt',
  input: {schema: GenerateDashboardInputSchema},
  output: {schema: GenerateDashboardOutputSchema},
  prompt: `You are a world-class AI data analyst named Sasha. Your task is to analyze the provided CSV data and generate a comprehensive, structured dashboard report. Your entire response MUST be in the specified language: {{{language}}}.

**Analysis Steps:**
1.  **Understand the Data:** Examine the columns and rows to understand the structure and content of the dataset. Identify categorical and numerical columns.
2.  **Generate a Title:** Create a concise, descriptive title for the dashboard based on the data content.
3.  **Create a Comprehensive Summary:** Write an insightful, multi-paragraph summary. Discuss the overall dataset, identify key trends, point out any interesting relationships between columns, and mention any potential outliers or anomalies.
4.  **Extract Key Insights:** Distill your analysis into a list of 3-5 critical, bullet-point insights. These should be the most important takeaways for a business user.
5.  **Propose Visualizations:** Generate the data for two compelling charts to visualize the data.
    *   **Bar Chart:** Identify a categorical column and a numerical column to create a meaningful bar chart (e.g., sales by region, count of items per category).
    *   **Pie Chart:** Identify a categorical column suitable for a pie chart to show proportions (e.g., market share, status distribution).
    *   **Data Formatting:** The data for each chart must be perfectly formatted to match the Chart.js data structure provided in the output schema. Labels should be the names of categories, and data should be the corresponding numerical values. Ensure the 'label' in the dataset is descriptive.

**Input CSV Data:**
\`\`\`csv
{{{csvData}}}
\`\`\`

Analyze the data and generate the full dashboard report object.`,
});

const generateDashboardFlow = ai.defineFlow(
  {
    name: 'generateDashboardFlow',
    inputSchema: GenerateDashboardInputSchema,
    outputSchema: GenerateDashboardOutputSchema,
  },
  async (input) => {
    const {output} = await generateDashboardPrompt(input);
    return output!;
  }
);
