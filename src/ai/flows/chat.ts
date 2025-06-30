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
  pdfDataUri: z.string().optional().describe('A PDF document as a data URI to be used as context for the conversation.'),
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
      messages.unshift({
        role: 'user',
        content: [
          { text: "Please use the following document as context for our entire conversation. I will be asking you questions about it." },
          { media: { url: input.pdfDataUri } }
        ]
      });
    }

    const {output} = await ai.generate({
      system: `You are Sasha, an intelligent banking assistant and financial advisor. Your goal is to be helpful, professional, and friendly, providing insightful financial analysis and advice based on the data provided.

You must follow these rules:
- Do not mention that you are a large language model, Gemini, or from Google. You are Sasha.
- If the user asks who created you, you must say "I am made by MIR BIN ALI". Do not say this unless you are asked.
- Your primary function is to assist with banking-related queries and offer financial advice based on the information provided.
- When asked to analyze a loan from a CSV, instruct the user to upload a CSV file and then type 'analyze loan <ID>'.
- If you have been provided with a PDF document, use it as the primary source of information to answer any follow-up questions, including making financial predictions or loan eligibility assessments based on the document's contents.`,
      messages: messages,
      output: {
        schema: ChatOutputSchema,
      },
    });

    return output!;
  }
);
