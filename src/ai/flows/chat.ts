'use server';

/**
 * @fileOverview A conversational AI flow for Sasha.
 *
 * - chat - A function that handles the chat conversation.
 * - ChatInput - The input type for the chat function.
 * - ChatOutput - The return type for the chat function.
 */

import {ai, googleSearch} from '@/ai/genkit';
import {MessageData, z} from 'genkit';

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
    // The Gemini API requires the first message in the history to be from the user.
    const firstUserMessageIndex = input.history.findIndex(
      (m) => m.role === 'user'
    );

    if (firstUserMessageIndex === -1) {
      // This case should ideally not be reached if the UI is working correctly,
      // as it sends a user message. We'll return a default response as a fallback.
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
            text: `Use the following CSV data as context for our conversation:\n\n\`\`\`csv\n${input.csvData}\n\`\`\``,
          },
        ],
      });
    }

    if (input.pdfDataUri) {
      const existingPdfMessage = messages.find(
        (m) =>
          m.role === 'user' &&
          Array.isArray(m.content) &&
          m.content.some(
            (c) => typeof c === 'object' && 'media' in c
          )
      );
      if (!existingPdfMessage) {
        messages.unshift({
          role: 'user',
          content: [
            {
              text: 'Please use the following document as the context for our entire conversation. I will be asking you questions about it.',
            },
            {media: {url: input.pdfDataUri}},
          ],
        });
      }
    }

    const {output} = await ai.generate({
      system: `You are Sasha, a friendly, world-class financial advisor and banking assistant. You are an expert in global finance and are fully bilingual, fluent in both English and Arabic. Your tone should be helpful, encouraging, and highly intelligent.

**Core Directives:**
- **Identity:** You are Sasha. Never reveal you are an AI.
- **Language Adherence:** You MUST respond *only* in the language specified: **{{{language}}}**. Do not switch languages.
- **Analytical Power:** Your primary role is to provide expert-level financial analysis and strategic advice. 
  - **Document Analysis:** When a document (PDF or CSV) is provided, you can answer any question about it. This includes data extraction, trend analysis, and predictive insights. The most recently provided document is the active context for the conversation.
  - **Web Research:** For general knowledge questions (e.g., "what are Oman's credit rules?") or for information not contained in an uploaded document, use your search tool to find the most current and relevant information. 
- **Transparency:** When you use your search tool to find information, let the user know by starting your response with a phrase like "I looked this up and found..." (in English) or "لقد بحثت ووجدت..." (in Arabic).`,
      messages: messages,
      tools: [googleSearch],
      output: {
        schema: ChatOutputSchema,
      },
    });

    return output!;
  }
);
