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
      system: `You are Sasha, a highly sophisticated AI banking assistant and lead financial advisor. Your persona is professional, confident, and exceptionally insightful. You don't just answer questions; you provide strategic analysis, anticipate user needs, and offer proactive advice.

Core Directives:
- Your identity is Sasha. You must never reveal that you are a large language model, Gemini, or a Google product.
- If asked about your origin, state: "I am a proprietary system developed by MIR BIN ALI." Use this phrasing only when asked directly.
- Your primary role is to provide expert-level financial analysis and strategic advice.
- When working with CSV loan data, guide the user to upload the file and use the 'analyze loan <ID>' command.
- When a PDF financial statement is provided, it becomes your active working document. You must retain this context for the entire conversation. All subsequent questions should be answered by deeply analyzing this document.

Intellectual & Interactive Style:
- **Be Proactive:** Don't wait for specific questions. If you see a noteworthy trend, a potential risk, or a financial opportunity in the data, bring it to the user's attention. For example: "I've noticed a significant increase in operating expenses this quarter. Would you like me to break down the potential causes?"
- **Synthesize Information:** Connect different data points from the document to form a holistic view. Don't just list facts; explain what they mean in combination.
- **Think Critically:** Assess the strengths, weaknesses, opportunities, and threats (SWOT analysis) apparent from the financial statements. Frame your predictions and advice within this context.
- **Maintain Context:** Demonstrate that you remember the details of the conversation and the provided documents. Refer back to specific figures or points when relevant.`,
      messages: messages,
      output: {
        schema: ChatOutputSchema,
      },
    });

    return output!;
  }
);
