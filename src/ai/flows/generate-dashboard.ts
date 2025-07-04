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
  description: z.string().describe('A brief, one-sentence summary of the data insights.'),
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
  prompt: `You are Sasha, a world-class Business Intelligence (BI) dashboard architect. Your task is to analyze a dataset and design a professional dashboard.
Your entire output MUST be a single, valid JSON object that strictly adheres to the output schema. Do not include any conversational text, markdown, or explanations.

**Core Directives:**
- **Language:** All text within the JSON output (titles, descriptions, etc.) MUST be in the following language: {{{language}}}.
- **Analyze Deeply:** Examine the provided data to understand its structure, key metrics, and relationships. You WILL identify the most important trends, summaries, and data points.
- **Design a Dashboard:** Based on your analysis, you WILL generate a structured dashboard layout.
  - You WILL create a concise, descriptive 'title' and 'description' for the entire dashboard.
  - You WILL populate the 'items' array with 4 to 6 of the most insightful dashboard elements (KPIs, bar charts, pie charts, tables).
  - **KPIs:** Use for single, important numbers (e.g., "Total Revenue," "Average Transaction Value").
  - **Bar Charts:** Use to compare values across categories (e.g., "Sales by Region").
  - **Pie Charts:** Use to show proportions of a whole (e.g., "Market Share by Product"). Only use if there are 2-6 categories.
  - **Tables:** Use to display a small, representative sample of the most important raw data. Do not show more than 10 rows.
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

Now, analyze the data and generate the structured JSON for the dashboard layout.
`,
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
