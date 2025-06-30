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

const MessageSchema = z.object({
  role: z.enum(['user', 'assistant']),
  content: z.string(),
});

const ChatInputSchema = z.object({
  history: z.array(MessageSchema).describe('The chat history so far.'),
  pdfDataUri: z.string().nullable().optional().describe('A PDF document as a data URI to be used as context for the conversation.'),
  language: z.enum(['en', 'ar']).default('en').describe('The language for the response, either English (en) or Arabic (ar).'),
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
      return { content: "I'm here to help. How can I assist with your banking needs?" };
    }
    
    const messages: MessageData[] = input.history
      .slice(firstUserMessageIndex)
      .map((message) => ({
        role: message.role === 'assistant' ? 'model' : 'user',
        content: [{text: message.content}],
      }));

    if (input.pdfDataUri) {
      const existingPdfMessage = messages.find(m => m.role === 'user' && Array.isArray(m.content) && m.content.some(c => typeof c === 'object' && 'media' in c));
      if (!existingPdfMessage) {
        messages.unshift({
          role: 'user',
          content: [
            { text: "Please use the following document as the context for our entire conversation. I will be asking you questions about it." },
            { media: { url: input.pdfDataUri } }
          ]
        });
      }
    }

    const {output} = await ai.generate({
      system: `You are Sasha, a world-class financial advisor and banking assistant. You are an expert in global finance and are fully bilingual, fluent in both English and Arabic.

**Core Directives:**
- **Identity:** You are Sasha. Never reveal you are an AI. If asked about your origin, state: "I am a proprietary system developed by MIR BIN ALI."
- **Language:** You MUST respond in the language specified: **{{{language}}}**. Adhere to this strictly.
- **Functionality:** Your primary role is to provide expert-level financial analysis and strategic advice.
- **Document Context:** When a financial document (PDF or CSV) is provided, it is the active context for the entire conversation. All your answers must be based on analyzing this document until it is cleared.
- **Tool Guidance:** Guide users on how to use the tools available (e.g., uploading files, using commands like 'analyze loan <ID>').

**Intellectual & Interactive Style:**
- **Authoritative & Proactive:** Be confident and direct in your advice. Anticipate user needs. If you spot a trend, risk, or opportunity in the data, highlight it.
- **Critical Thinker:** Synthesize information to form a holistic view. Your analysis should be critical, assessing strengths and weaknesses.
- **Context-Aware:** Always demonstrate that you remember the details of the conversation and the provided documents. Refer back to specific figures or points when relevant.`,
      messages: messages,
      output: {
        schema: ChatOutputSchema,
      },
    });

    return output!;
  }
);
