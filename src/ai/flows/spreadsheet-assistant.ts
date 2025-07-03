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

const CellRangeSchema = z.object({
  row: z.number(),
  col: z.number(),
  row2: z.number(),
  col2: z.number(),
});

const CellFormattingSchema = z.object({
    bold: z.boolean().optional(),
    italic: z.boolean().optional(),
    underline: z.boolean().optional(),
    color: z.string().optional().describe('A hex color code for the text, e.g., #FF0000'),
    backgroundColor: z.string().optional().describe('A hex color code for the cell background, e.g., #FFFF00'),
});

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

**Spreadsheet Structure:**
- The spreadsheet is a 0-indexed 2D array.
- Cell ranges are specified with 'row', 'col', 'row2', 'col2'. For a single cell (e.g., A1), row=0, col=0, row2=0, col2=0. For a range (e.g., A1:B2), row=0, col=0, row2=1, col2=1.

**Capabilities:**
1.  **Set Data:** You can set the value of one or more cells.
    *   *User Prompt:* "Put 'Total Sales' in A1 and 25000 in B1"
    *   *Operation:* \`{ command: 'setData', params: { data: [['Total Sales', 25000]] }, confirmation: "I've added the data." }\`
2.  **Format Cells:** You can apply formatting to a range of cells.
    *   *User Prompt:* "Make cell B2 bold and red"
    *   *Operation:* \`{ command: 'formatCells', params: { range: { row: 1, col: 1, row2: 1, col2: 1 }, properties: { bold: true, color: '#FF0000' } }, confirmation: "I've formatted cell B2." }\`
    *   *User Prompt:* "Highlight the first row in yellow"
    *   *Operation:* \`{ command: 'formatCells', params: { range: { row: 0, col: 0, row2: 0, col2: 4 }, properties: { backgroundColor: '#FFFF00' } }, confirmation: "I've highlighted the first row." }\`
3.  **Create Templates (Gantt Chart):** You can generate a full template.
    *   *User Prompt:* "Make a gantt chart for a new project"
    *   *Operation:* \`{ command: 'createGantt', params: {}, confirmation: "Here is a Gantt chart template for your new project." }\`
4.  **Clear Sheet:** You can clear the entire sheet.
    *   *User Prompt:* "clear everything"
    *   *Operation:* \`{ command: 'clearSheet', params: {}, confirmation: "I've cleared the sheet." }\`
5.  **Answer Questions:** If the user asks a question that doesn't require changing the sheet, use the 'info' command.
    *   *User Prompt:* "What is this for?"
    *   *Operation:* \`{ command: 'info', params: {}, confirmation: "This is a spreadsheet where you can ask me to organize data, create templates, and more." }\`

**Current Spreadsheet Data (for context):**
\`\`\`json
{{{json sheetData}}}
\`\`\`

**User's Request:**
{{{prompt}}}

Based on the user's request, determine the necessary operations. Be precise with cell ranges. Assume the current sheet has about 10 columns unless the data shows otherwise.`,
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
