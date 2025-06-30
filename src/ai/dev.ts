'use server';

import { config } from 'dotenv';
config();

import '@/ai/flows/summarize-chat-history.ts';
import '@/ai/flows/chat.ts';
import '@/ai/flows/analyze-loan.ts';
