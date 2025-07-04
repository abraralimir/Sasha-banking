'use server';

/**
 * @fileOverview An AI flow for generating a dynamic dashboard from data.
 *
 * - generateDashboard - A function that analyzes data and creates a dashboard layout.
 * - GenerateDashboardInput - The input type for the generateDashboard function.
 * - GenerateDashboardOutput - The return type for the generateDashboard function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateDashboardInputSchema = z.object({
  csvContent: z.string().optional().describe('The content of the data file as a CSV string.'),
  pdfDataUri: z.string().optional().describe('The content of the data file as a PDF data URI.'),
  language: z.enum(['en', 'ar']).default('en').describe('The language for the response, either English (en) or Arabic (ar).'),
});
export type GenerateDashboardInput = z.infer<typeof GenerateDashboardInputSchema>;

const DashboardItemSchema = z.union([
    z.object({
        type: z.enum(['kpi']),
        title: z.string().describe('The title of the Key Performance Indicator.'),
        value: z.string().describe('The calculated value of the KPI.'),
        description: z.string().optional().describe('A small description or context for the KPI.'),
    }),
    z.object({
        type: z.enum(['bar']),
        title: z.string().describe('The title of the bar chart.'),
        data: z.array(z.object({
            name: z.string().describe("The label for the x-axis category."),
            value: z.number().describe("The numeric value for the y-axis."),
        })).describe('The dataset for the bar chart.'),
    }),
    z.object({
        type: z.enum(['pie']),
        title: z.string().describe('The title of the pie chart.'),
        data: z.array(z.object({
            name: z.string().describe("The label for the slice."),
            value: z.number().describe("The numeric value for the slice."),
        })).describe('The dataset for the pie chart.'),
    }),
    z.object({
        type: z.enum(['table']),
        title: z.string().describe('The title of the table.'),
        headers: z.array(z.string()).describe('The column headers for the table.'),
        rows: z.array(z.array(z.union([z.string(), z.number()]))).describe('The data for the rows, as a 2D array.'),
    })
]);

const GenerateDashboardOutputSchema = z.object({
  title: z.string().describe('The main title for the dashboard, summarizing the file content.'),
  executiveSummary: z.string().describe('A brief, one or two-sentence summary of the key data insights.'),
  detailedAnalysis: z.string().describe('A detailed, multi-paragraph analysis of the data, highlighting key trends, anomalies, and important findings discovered in the document.'),
  items: z.array(DashboardItemSchema).describe('An array of dashboard items (KPIs, charts, tables) to display. Generate between 4 to 6 items that best represent the data.'),
});
export type GenerateDashboardOutput = z.infer<typeof GenerateDashboardOutputSchema>;
export type DashboardLayout = GenerateDashboardOutput;

export async function generateDashboard(input: GenerateDashboardInput): Promise<GenerateDashboardOutput> {
  return generateDashboardFlow(input);
}

const generateDashboardPrompt = ai.definePrompt({
  name: 'generateDashboardPrompt',
  input: {schema: GenerateDashboardInputSchema},
  output: {schema: GenerateDashboardOutputSchema},
  model: 'googleai/gemini-2.0-flash',
  prompt: `You are Sasha, a world-class Business Intelligence (BI) dashboard architect. Your primary and most critical task is to analyze a dataset and design a visually rich, professional, and insightful dashboard. Your success is measured by the quality of the analysis and the clarity of the visualizations you produce.

Your entire output MUST be a single, valid JSON object that strictly adheres to the output schema. Do not include any conversational text, markdown, or explanations.

**Core Directives:**
- **Language:** All text within the JSON output (titles, descriptions, etc.) MUST be in the following language: {{{language}}}.
- **Analyze Deeply:** Examine the provided data to understand its structure, key metrics, and relationships. Your goal is to find data that can be summarized and visualized.
- **Design an Insightful Dashboard:** Based on your analysis, you WILL generate a structured dashboard layout with the following components:
  - **title:** Create a concise, descriptive 'title' for the entire dashboard.
  - **executiveSummary:** Write a brief, one or two-sentence summary of the most critical data insights. This is for a high-level overview.
  - **detailedAnalysis:** Provide a more detailed, multi-paragraph analysis of the data. Highlight key trends, significant patterns, anomalies, and important findings you discovered in the document. This should provide deeper context for the visuals.
  - **items:** Populate the 'items' array with 4 to 6 of the most insightful dashboard elements.
- **MANDATORY VISUALIZATIONS:** You MUST include at least two different visual charts (e.g., one bar chart and one pie chart) if the data contains any possibility for visualization. Prioritize charts over tables and KPIs. If the data is very simple, you must still attempt to create a chart, even if it's basic.
  - **KPIs:** Use for single, important numbers (e.g., "Total Revenue," "Average Transaction Value"). These are secondary to charts.
  - **Bar Charts:** Use to compare values across categories (e.g., "Sales by Region").
  - **Pie Charts:** Use to show proportions of a whole (e.g., "Market Share by Product"). Only use if there are 2-6 categories.
  - **Tables:** Use only as a last resort if no other visualization is possible, or to show a small, representative sample of raw data. Do not show more than 10 rows.
- **Be Smart:** You WILL choose the right visualization for the data. You must aggregate, calculate, and find meaningful insights, not just list columns.

**Input Data:**
{{#if csvContent}}
The user has uploaded a CSV file. Use the following CSV content for your analysis.
\`\`\`csv
{{{csvContent}}}
\`\`\`
{{/if}}
{{#if pdfDataUri}}
The user has uploaded a PDF document. Use it as the context for your analysis.
{{media url=pdfDataUri}}
{{/if}}

Now, analyze the data and generate the structured JSON for the dashboard layout.`,
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
