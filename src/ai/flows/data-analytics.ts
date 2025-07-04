'use server';

/**
 * @fileOverview An AI flow for data analytics, inspired by Power BI.
 *
 * - dataAnalytics - A function that interprets natural language commands for data analysis.
 * - DataAnalyticsInput - The input type for the dataAnalytics function.
 * - DataAnalyticsOutput - The return type for the dataAnalytics function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const ChartSchema = z.union([
  z.object({
    type: z.literal('bar'),
    title: z.string().describe('The title of the bar chart.'),
    data: z.array(z.object({
        name: z.string().describe("The label for the x-axis category."),
        value: z.number().describe("The value for the y-axis."),
    })).describe('Data for the bar chart.'),
  }),
  z.object({
    type: z.literal('pie'),
    title: z.string().describe('The title of the pie chart.'),
    data: z.array(z.object({
        name: z.string().describe("The label for the slice."),
        value: z.number().describe("The value for the slice."),
    })).describe('Data for the pie chart.'),
  }),
]).describe("A chart object if the user requested a visualization.");

const DataAnalyticsInputSchema = z.object({
  prompt: z.string().describe('The natural language command from the user.'),
  fileContent: z.string().describe('The content of the data file, either as a CSV string or a PDF data URI.'),
  fileType: z.enum(['csv', 'pdf']).describe('The type of the uploaded file.'),
  language: z.enum(['en', 'ar']).default('en').describe('The language for the response, either English (en) or Arabic (ar).'),
});
export type DataAnalyticsInput = z.infer<typeof DataAnalyticsInputSchema>;

const DataAnalyticsOutputSchema = z.object({
  response: z.string().describe('A conversational response that includes analysis, insights, or suggestions for visualizations.'),
  chart: ChartSchema.optional(),
});
export type DataAnalyticsOutput = z.infer<typeof DataAnalyticsOutputSchema>;

export async function dataAnalytics(input: DataAnalyticsInput): Promise<DataAnalyticsOutput> {
  return dataAnalyticsFlow(input);
}

const dataAnalyticsPrompt = ai.definePrompt({
  name: 'dataAnalyticsPrompt',
  input: {schema: DataAnalyticsInputSchema},
  output: {schema: DataAnalyticsOutputSchema},
  prompt: `You are Sasha, an expert data analyst with capabilities rivaling Power BI. Your task is to assist users by analyzing their uploaded data and performing complex data tasks based on natural language commands.

**Core Directives:**
- **Identity:** You are Sasha. Never reveal you are an AI model, and do not mention that you were created by Google, Gemini, or any other company.
- **Language:** Your entire response MUST be in the following language: {{{language}}}.

**Your Core Capabilities:**
- **Power Query-like Transformations:** Describe how to clean, shape, and combine data.
- **DAX-like Calculations:** Create and explain custom calculations.
- **Visualization Generation:** If the user asks for a chart (e.g., "show sales by region as a pie chart"), you MUST generate the data for it and return it in the 'chart' field of the output. Your text 'response' should then confirm that you have created the chart. If the data is not available to create the chart, explain why in the text 'response' and do not generate a chart object.

**Interaction Flow:**
1.  **Acknowledge and Analyze:** Briefly acknowledge the user's request.
2.  **Provide Insight:** Perform the requested analysis. Extract key numbers, identify trends, or describe patterns.
3.  **Generate Visuals (If Requested):** If the user asks for a chart or graph, create the chart object.
4.  **Suggest Next Steps:** Proactively suggest a follow-up action.

**Current Dataset Context:**
{{#if (eq fileType "csv")}}
The user has uploaded the following dataset in CSV format. Use this as the primary source for your analysis.
\`\`\`csv
{{{fileContent}}}
\`\`\`
{{else}}
The user has uploaded a PDF document. Use this as the primary source for your analysis.
{{media url=fileContent}}
{{/if}}

**User's Request:**
{{{prompt}}}

Now, analyze the user's request and the provided data to generate an insightful and actionable response. If a chart is requested, generate the structured chart data.`,
});

const dataAnalyticsFlow = ai.defineFlow(
  {
    name: 'dataAnalyticsFlow',
    inputSchema: DataAnalyticsInputSchema,
    outputSchema: DataAnalyticsOutputSchema,
  },
  async (input) => {
    const {output} = await dataAnalyticsPrompt(input);
    return output!;
  }
);
