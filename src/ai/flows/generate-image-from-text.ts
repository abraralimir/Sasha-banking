
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
        prompt: `Generate a photorealistic, high-resolution, high-quality image of: ${input.prompt}`,
        config: {
            responseModalities: ['TEXT', 'IMAGE'],
            aspectRatio: 'PORTRAIT',
        },
    });

    if (!media.url) {
        throw new Error('Image generation failed to produce an image.');
    }

    return { imageUrl: media.url };
  }
);
