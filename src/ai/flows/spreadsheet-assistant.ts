'use server';

/**
 * @fileOverview An AI flow for assisting with spreadsheet operations.
 *
 * - spreadsheetAssistant - A function that interprets natural language commands for a spreadsheet.
 * - SpreadsheetAssistantInput - The input type for the spreadsheetAssistant function.
 * - SpreadsheetAssistantOutput - The return type for the spreadsheetAssistant function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const SpreadsheetAssistantInputSchema = z.object({
  prompt: z.string().describe('The natural language command from the user.'),
  sheetData: z.any().describe('The current state of the spreadsheet data, likely a 2D array.'),
  language: z.enum(['en', 'ar']).default('en').describe('The language for the response, either English (en) or Arabic (ar).'),
});
export type SpreadsheetAssistantInput = z.infer<typeof SpreadsheetAssistantInputSchema>;

const OperationSchema = z.object({
    command: z.enum(['setData', 'createGantt', 'formatCells', 'clearSheet', 'info'])
      .describe('The command to execute on the spreadsheet.'),
    params: z.any()
      .describe('The parameters for the command. This will vary depending on the command.'),
    confirmation: z.string().describe('A confirmation message to the user about what was done.')
});

const SpreadsheetAssistantOutputSchema = z.object({
  operations: z.array(OperationSchema).describe('A list of operations to be performed on the spreadsheet.'),
});
export type SpreadsheetAssistantOutput = z.infer<typeof SpreadsheetAssistantOutputSchema>;

export async function spreadsheetAssistant(input: SpreadsheetAssistantInput): Promise<SpreadsheetAssistantOutput> {
  return spreadsheetAssistantFlow(input);
}

const spreadsheetAssistantPrompt = ai.definePrompt({
  name: 'spreadsheetAssistantPrompt',
  input: {schema: SpreadsheetAssistantInputSchema},
  output: {schema: SpreadsheetAssistantOutputSchema},
  prompt: `You are Sasha, an AI assistant integrated into a web-based spreadsheet application. Your task is to interpret natural language prompts from the user and translate them into a series of structured operations to manipulate the spreadsheet. Your entire response MUST be in the following language: {{{language}}}.

**Capabilities:**
1.  **Set Data:** You can set the value of one or more cells.
    *   *User Prompt:* "Put 'Total Sales' in A1 and 25000 in B1"
    *   *Operation:* \`{ command: 'setData', params: { data: [['Total Sales', 25000]] }, confirmation: "I've added the data." }\`
2.  **Create Templates (Gantt Chart):** You can generate a full template.
    *   *User Prompt:* "Make a gantt chart for a new project"
    *   *Operation:* \`{ command: 'createGantt', params: {}, confirmation: "Here is a Gantt chart template for your new project." }\`
3.  **Clear Sheet:** You can clear the entire sheet.
    *   *User Prompt:* "clear everything"
    *   *Operation:* \`{ command: 'clearSheet', params: {}, confirmation: "I've cleared the sheet." }\`
4.  **Answer Questions:** If the user asks a question that doesn't require changing the sheet, use the 'info' command.
    *   *User Prompt:* "What is this for?"
    *   *Operation:* \`{ command: 'info', params: {}, confirmation: "This is a spreadsheet where you can ask me to organize data, create templates, and more." }\`

**Current Spreadsheet Data (for context):**
\`\`\`json
{{{json stringify(sheetData)}}}
\`\`\`

**User's Request:**
{{{prompt}}}

Based on the user's request, determine the necessary operations.`,
});

const spreadsheetAssistantFlow = ai.defineFlow(
  {
    name: 'spreadsheetAssistantFlow',
    inputSchema: SpreadsheetAssistantInputSchema,
    outputSchema: SpreadsheetAssistantOutputSchema,
  },
  async (input) => {
    // For now, this is a placeholder. In the future, this flow will
    // interpret the prompt and return a list of operations.
    const {output} = await spreadsheetAssistantPrompt(input);
    return output!;
  }
);
