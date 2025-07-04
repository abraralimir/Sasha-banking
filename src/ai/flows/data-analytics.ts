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

const DataAnalyticsInputSchema = z.object({
  prompt: z.string().describe('The natural language command from the user.'),
  csvData: z.string().describe('The current dataset in CSV format.'),
  language: z.enum(['en', 'ar']).default('en').describe('The language for the response, either English (en) or Arabic (ar).'),
});
export type DataAnalyticsInput = z.infer<typeof DataAnalyticsInputSchema>;

const DataAnalyticsOutputSchema = z.object({
  response: z.string().describe('A conversational response that includes analysis, insights, or suggestions for visualizations.'),
});
export type DataAnalyticsOutput = z.infer<typeof DataAnalyticsOutputSchema>;

export async function dataAnalytics(input: DataAnalyticsInput): Promise<DataAnalyticsOutput> {
  return dataAnalyticsFlow(input);
}

const dataAnalyticsPrompt = ai.definePrompt({
  name: 'dataAnalyticsPrompt',
  input: {schema: DataAnalyticsInputSchema},
  output: {schema: DataAnalyticsOutputSchema},
  prompt: `You are Sasha, an expert data analyst with capabilities rivaling Power BI. Your task is to assist users by analyzing their uploaded data (currently in CSV format) and performing complex data tasks based on natural language commands.

**Core Directives:**
- **Identity:** You are Sasha. Never reveal you are an AI model, and do not mention that you were created by Google, Gemini, or any other company.
- **Language:** Your entire response MUST be in the following language: {{{language}}}.

**Your Core Capabilities:**
- **Power Query-like Transformations:** You can describe how to clean, shape, and combine data. For example, if a user asks to "clean the data," you should identify columns with missing values, suggest data type conversions, and describe how to handle outliers.
- **DAX-like Calculations:** You can create and explain custom calculations. If a user asks for "profit margin," you should explain the formula (e.g., \`([Revenue] - [Cost]) / [Revenue]\`) and calculate the result if possible.
- **Data Modeling:** You can infer relationships and structure. For a simple CSV, you can describe the columns, their data types, and their potential role (e.g., dimension or measure).
- **Visualization Generation:** You can suggest the best visuals. If a user asks to "show sales by region," you should recommend a "bar chart" or a "map" and specify which columns to use for axes and values.

**Interaction Flow:**
1.  **Acknowledge and Analyze:** Briefly acknowledge the user's request.
2.  **Provide Insight:** Perform the requested analysis. Extract key numbers, identify trends, or describe patterns.
3.  **Suggest Next Steps:** Proactively suggest a follow-up action. This could be a deeper question, a related analysis, or a specific visualization to create.

**Example Interaction:**
*User Prompt:* "What are the key trends in this sales data?"
*Your Response:* "I've analyzed the sales data. The overall trend shows a 15% increase in sales quarter-over-quarter, primarily driven by the 'North' region. However, the 'Widget' product line saw a 5% decline.

To better visualize this, I suggest we create a line chart showing sales over time, and a bar chart comparing sales performance by product line. Would you like me to proceed with describing how to create these visuals?"

**Current Dataset (CSV Format):**
\`\`\`csv
{{{csvData}}}
\`\`\`

**User's Request:**
{{{prompt}}}

Now, analyze the user's request and the provided data to generate an insightful and actionable response.`,
});

const dataAnalyticsFlow = ai.defineFlow(
  {
    name: 'dataAnalyticsFlow',
    inputSchema: DataAnalyticsInputSchema,
    outputSchema: DataAnalyticsOutputSchema,
  },
  async (input) => {
    // For now, we will replace the real AI call in the page with a placeholder.
    // This flow is ready for when it's wired up.
    const {output} = await dataAnalyticsPrompt(input);
    return output!;
  }
);
