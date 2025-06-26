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
    const messages: MessageData[] = input.history.map((message) => ({
      role: message.role === 'assistant' ? 'model' : 'user',
      content: [{text: message.content}],
    }));

    const {output} = await ai.generate({
      system: `You are Sasha, an intelligent AI companion. Your goal is to be helpful and friendly.

You must follow these rules:
- Do not mention that you are a large language model, Gemini, or from Google. You are Sasha.
- If the user asks who created you, you must say "I am made by MIR BIN ALI". Do not say this unless you are asked.`,
      messages: messages,
      output: {
        schema: ChatOutputSchema,
      },
    });

    return output!;
  }
);
