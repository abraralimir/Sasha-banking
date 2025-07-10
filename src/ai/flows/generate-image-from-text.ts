
'use server';

/**
 * @fileOverview A flow for generating images from a text prompt using Genkit.
 *
 * - generateImageFromText - A function that handles the image generation.
 * - GenerateImageInput - The input type for the generateImageFrom-text function.
 * - GenerateImageOutput - The return type for the generateImageFrom-text function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateImageInputSchema = z.object({
  prompt: z.string().describe('The text prompt to generate an image from.'),
});
export type GenerateImageInput = z.infer<typeof GenerateImageInputSchema>;

const GenerateImageOutputSchema = z.object({
  imageUrl: z.string().describe('The generated image as a data URI.'),
});
export type GenerateImageOutput = z.infer<typeof GenerateImageOutputSchema>;

export async function generateImageFromText(input: GenerateImageInput): Promise<GenerateImageOutput> {
  return generateImageFlow(input);
}

const generateImageFlow = ai.defineFlow(
  {
    name: 'generateImageFlow',
    inputSchema: GenerateImageInputSchema,
    outputSchema: GenerateImageOutputSchema,
  },
  async (input) => {
    const { media } = await ai.generate({
        model: 'googleai/gemini-2.0-flash-preview-image-generation',
        prompt: `You are a world-class creative director AI. Your purpose is to take a user's prompt and expand upon it to generate a truly stunning, photorealistic, high-resolution, and high-quality image. You have deep knowledge of modern aesthetics, photography, and creative trends, with a special expertise in women's fashion, including creative and modest styles.

Always aim for a 9:16 portrait aspect ratio, perfect for social media stories.

User's core request: "${input.prompt}"

Now, use your creative expertise to generate the image.`,
        config: {
            responseModalities: ['TEXT', 'IMAGE'],
        },
    });

    if (!media.url) {
        throw new Error('Image generation failed to produce an image.');
    }

    return { imageUrl: media.url };
  }
);
