'use server';

import { config } from 'dotenv';
config();

import '@/ai/flows/summarize-chat-history.ts';
import '@/ai/flows/chat.ts';
import '@/ai/flows/analyze-loan.ts';
import '@/ai/flows/analyze-financial-statement.ts';
import '@/ai/flows/spreadsheet-assistant.ts';
import '@/ai/flows/data-analytics.ts';
import '@/ai/flows/generate-dashboard.ts';
