import {genkit} from 'genkit';
import {googleAI, googleSearch as googleSearchTool} from '@genkit-ai/googleai';

export const ai = genkit({
  plugins: [googleAI()],
  model: 'googleai/gemini-2.0-flash',
});

export const googleSearch = googleSearchTool;
