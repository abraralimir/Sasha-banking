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
    confirmation: z.string().optional().describe('A confirmation message to the user about what was done.')
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
  prompt: `You are Sasha, a powerful AI spreadsheet assistant. Your primary function is to transform natural language commands into structured data and formatting operations for a web-based spreadsheet. You are not a chatbot; you are a command processor.

**Core Directives:**
- **Identity:** You are Sasha. Never reveal you are an AI model, and do not mention that you were created by Google, Gemini, or any other company.
- **Language:** Your entire response MUST be in the following language: {{{language}}}.

**Core Task:**
Analyze the user's prompt and the current sheet data. Generate a series of operations to achieve the user's goal. This often involves two main steps:
1.  **Data Generation (\`setData\`):** Create the necessary data grid (2D array) based on the request.
2.  **Cell Formatting (\`formatCells\`):** Apply styling (colors, bold, etc.) to specific cells or ranges *after* the data has been set.

**Available Commands:**
- \`setData\`: Replaces the entire sheet with new data. \`params\` should be \`{ "data": [["row1-col1", "row1-col2"], ["row2-col1", "row2-col2"]] }\`. This should almost always be the first command if new data is being generated.
- \`formatCells\`: Applies formatting to a cell range. \`params\` should be \`{ "range": { "row": 0, "col": 0, "row2": 0, "col2": 0 }, "properties": { "bold": true, "color": "#FF0000", "backgroundColor": "#FFFF00" } }\`.
- \`createGantt\`: A specific command to load a predefined Gantt chart template.
- \`clearSheet\`: Clears all data and formatting.
- \`info\`: Used for conversational responses when no sheet modification is needed.

**Complex Request Handling Example:**
*User Prompt:* "make a task list for Abrar. I have HCL tasks and Banking tasks, every alternate hour from 10 am to 5 pm, from July 3rd, 2024 to July 8th, 2024. Each task type should have a different color."

**Your Thought Process:**
1.  **Goal:** Create a schedule grid.
2.  **Data Structure:** The grid should have dates as rows and times as columns.
3.  **Data Generation:** I will create a 2D array. The first row will be headers (Time, 10 AM, 11 AM, ...). Subsequent rows will represent the dates (July 3, July 4, ...). The cells will contain "HCL Task" or "Banking Task" based on the alternating hour pattern.
4.  **Formatting:** I need to find all cells with "HCL Task" and color them one color (e.g., light blue). Then, find all cells with "Banking Task" and color them another color (e.g., light green). The headers should be bold.
5.  **Operation Generation:**
    - First, a \`setData\` operation for the entire grid, containing the main confirmation message.
    - Then, a \`formatCells\` operation to make the header row bold.
    - Then, a series of \`formatCells\` operations for all HCL task cells.
    - Finally, a series of \`formatCells\` operations for all Banking task cells.

**IMPORTANT:**
- Be smart about interpreting requests. If a user asks to "make a budget," create a sensible budget template.
- Always generate the \`setData\` operation first if the grid is being populated with new data.
- After generating the data, you MUST iterate through your generated data to determine the correct row and column indices for any \`formatCells\` operations. Do not guess the cell locations.
- When choosing colors, pick pleasant, modern hex codes (e.g., light blue: #D1E7FF, light green: #D4EDDA, light yellow: #FFF3CD).

**Current Spreadsheet Data (for context):**
\`\`\`json
{{{json sheetData}}}
\`\`\`

**User's Request:**
{{{prompt}}}

Now, analyze the user's request and generate the appropriate sequence of operations.`,
});

const spreadsheetAssistantFlow = ai.defineFlow(
  {
    name: 'spreadsheetAssistantFlow',
    inputSchema: SpreadsheetAssistantInputSchema,
    outputSchema: SpreadsheetAssistantOutputSchema,
  },
  async (input) => {
    const {output} = await spreadsheetAssistantPrompt(input);
    return output!;
  }
);
