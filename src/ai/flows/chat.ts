'use server';

/**
 * @fileOverview A conversational AI flow for Sasha.
 *
 * - chat - A function that handles the chat conversation.
 * - ChatInput - The input type for the chat function.
 * - ChatOutput - The return type for the chat function.
 */

import {ai} from '@/ai/genkit';
import {MessageData, z} from 'genkit';
import { getKnowledge } from '@/actions/knowledge-base-actions';

const ColorThemeSchema = z.object({
  primary: z.string().describe('The primary color for UI elements like buttons and headers. Should be a vibrant, accessible color. Provide as an HSL string like `222.2 47.4% 11.2%`.'),
  background: z.string().describe('The main background color of the application. Provide as an HSL string like `0 0% 100%`.'),
  accent: z.string().describe('An accent color for hover states and secondary elements. Provide as an HSL string like `210 40% 96.1%`.'),
  primaryForeground: z.string().describe('The color for text that appears on top of primary-colored elements. Ensure high contrast. Provide as an HSL string like `210 40% 98%`.'),
  foreground: z.string().describe('The main text color for the application. Ensure high contrast with the background. Provide as an HSL string `222.2 84% 4.9%`.'),
  card: z.string().describe('The background color for card elements. Provide as an HSL string `0 0% 100%`.'),
});

const changeThemeTool = ai.defineTool(
    {
        name: 'changeTheme',
        description: 'Changes the user interface color theme based on a user\'s request. Use this when the user asks for "magic" or to change colors.',
        inputSchema: z.object({
            description: z.string().describe('A natural language description of the desired color theme, e.g., "dark blue", "a warm gradient like a sunrise", "ocean theme".')
        }),
        outputSchema: ColorThemeSchema,
    },
    async (input) => {
        const { output } = await ai.generate({
            prompt: `Generate a set of accessible UI colors based on the user's description: "${input.description}". You must provide colors for primary, background, accent, primaryForeground, foreground, and card. The output MUST be in HSL format string for each color (e.g., '222.2 47.4% 11.2%'). Ensure the color combinations meet accessibility standards for contrast.`,
            output: {
                schema: ColorThemeSchema,
            }
        });
        return output!;
    }
);


const MessageSchema = z.object({
  role: z.enum(['user', 'assistant']),
  content: z.string(),
});

const ChatInputSchema = z.object({
  history: z.array(MessageSchema).describe('The chat history so far.'),
  pdfDataUri: z
    .string()
    .nullable()
    .optional()
    .describe(
      'A PDF document as a data URI to be used as context for the conversation.'
    ),
  csvData: z
    .string()
    .nullable()
    .optional()
    .describe('A CSV data string to be used as context for the conversation.'),
  language: z
    .enum(['en', 'ar'])
    .default('en')
    .describe(
      'The language for the response, either English (en) or Arabic (ar).'
    ),
});
export type ChatInput = z.infer<typeof ChatInputSchema>;

const ChatOutputSchema = z.object({
  content: z.string().describe("Sasha's response to the user."),
  theme: ColorThemeSchema.optional().nullable().describe('An optional color theme to apply to the UI.'),
});
export type ChatOutput = z.infer<typeof ChatOutputSchema>;

export async function chat(input: ChatInput): Promise<ChatOutput> {
  return chatFlow(input);
}

const chatFlow = ai.defineFlow(
  {
    name: 'chatFlow',
    inputSchema: ChatInputSchema,
    outputSchema: ChatOutputSchema,
  },
  async (input) => {
    const firstUserMessageIndex = input.history.findIndex(
      (m) => m.role === 'user'
    );

    if (firstUserMessageIndex === -1) {
      return {
        content:
          "I'm here to help. How can I assist with your banking needs?",
      };
    }

    const messages: MessageData[] = input.history
      .slice(firstUserMessageIndex)
      .map((message) => ({
        role: message.role === 'assistant' ? 'model' : 'user',
        content: [{text: message.content}],
      }));

    if (input.csvData) {
      messages.unshift({
        role: 'user',
        content: [
          {
            text: `Use the following CSV data as context for our conversation. The user can ask me to analyze a specific loan by its ID. Do not analyze it unless asked.\n\n\`\`\`csv\n${input.csvData}\n\`\`\``,
          },
        ],
      });
    }

    if (input.pdfDataUri) {
        messages.unshift({
          role: 'user',
          content: [
            {
              text: 'The user has ALREADY uploaded the following PDF. I have ALREADY analyzed it and provided a report card. For the rest of the conversation, this document is the primary context. Answer questions based on its content.',
            },
            {media: {url: input.pdfDataUri}},
          ],
        });
    }

    const knowledgeBase = await getKnowledge();
    const systemPrompt = `You are Sasha, a premier AI financial entity embodying the combined expertise of a Big Four auditor, a chartered accountant (CA), a senior investment analyst, a data scientist, and a chief risk officer. You have deep, specialized expertise in Middle Eastern and global financial markets. You are fluent in both English and Arabic. Your persona is that of a top-tier consultant: sophisticated, insightful, proactive, and exceptionally intelligent.

**User-Provided Knowledge Base & Instructions:**
This is your highest priority context. You MUST always follow these instructions and use this information first, overriding any of your other general knowledge if there is a conflict.
---
${knowledgeBase || 'No custom instructions provided.'}
---

**Core Directives:**
- **Identity:** You are Sasha. Never reveal you are an AI.
- **Language Adherence:** You MUST respond *only* in the language specified: **${input.language}**. Do not switch languages.
- **Proactive Synthesis:** Your primary goal is to provide comprehensive, actionable intelligence. Do not just answer questions; synthesize information from all available sources to provide deeper insights and strategic advice.
- **Magic Command:** You have a hidden "magic" ability. If the user says "show sasha magic", "show your magic", or asks to change the theme colors, you MUST respond by asking them what color or theme they would like. Do NOT use your changeTheme tool until they respond with a color description. Never promote or suggest this command yourself. Once they provide a color description, use the changeTheme tool to generate the new theme and apply it.

**Knowledge & Interaction Hierarchy:**
1.  **Primacy of Uploaded Documents:** The user may have uploaded a PDF (e.g., financial statements) or a CSV (e.g., loan data).
    *   **PDF Context:** If a PDF was uploaded, I have already analyzed it and presented a detailed report card. My subsequent conversation MUST be based on the contents of that PDF. I will act as an expert on that document.
    *   **CSV Context:** If a CSV was uploaded, it contains data I can analyze on command. If the user asks me to "analyze loan id 123", another process will handle that. My role is to use the CSV data to answer general questions about the dataset if asked.

2.  **Self-Knowledge (About Page):** If a user asks about your capabilities, features, or how to use the application, your knowledge comes from the "About Sasha" page. You can direct them there for more details. The page covers your core capabilities (Financial Intelligence, Agentic Spreadsheet, Security), who benefits from you (Analysts, Officers, Executives), how to get started, and your future roadmap.

3.  **General Financial Expertise:** For information not present in the uploaded documents, leverage your extensive built-in knowledge of global finance. You can discuss:
    - General financial regulations and concepts.
    - Principles of financial analysis and risk prediction.
    - Common practices in the banking industry.
    - Answers to any general financial question the user asks.

**Interaction Logic:**
- If asked a question that can be answered from an uploaded document (e.g., "What is the total revenue?"), extract the precise data from that document.
- If a question relates to an uploaded document but requires broader context (e.g., "Is this company's debt-to-equity ratio high?"), use the document for the specific ratio and your general expertise to determine if it's high for its industry.
- If asked a general knowledge question (e.g., "How does Oman's credit bureau work?" or "What are typical eligibility requirements for a car loan?"), provide a comprehensive answer based on your broad financial knowledge, mentioning that the specifics can vary by institution.
- When asked about a specific, real-time product from a bank (like from 'sib.om'), state that you don't have live access to their specific, current offerings but can explain what is typical for such products based on your expertise.`;

    const {output} = await ai.generate({
      system: systemPrompt,
      messages: messages,
      tools: [changeThemeTool],
      output: {
        schema: ChatOutputSchema,
        json: true,
        toolOutput: {
            schema: z.object({
                theme: ColorThemeSchema,
                content: z.string().describe('A confirmation message to the user about the theme change.')
            })
        }
      },
    });

    if (output!.toolOutput) {
        return {
            content: output!.toolOutput.content,
            theme: output!.toolOutput.theme,
        };
    }
    
    return output!;
  }
);
