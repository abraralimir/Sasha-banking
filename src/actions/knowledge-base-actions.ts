
'use server';

import { promises as fs } from 'fs';
import path from 'path';

// On Vercel, use the /tmp directory which is writable.
// Otherwise, use the local project structure.
const isVercel = !!process.env.VERCEL;
const storagePath = isVercel
  ? path.join('/tmp', 'knowledge-base.json')
  : path.join(process.cwd(), 'src', 'data', 'knowledge-base.json');

type KnowledgeBase = {
    notes: string;
};

const defaultNotes = `Your custom notes, rules, and commands for Sasha will be stored here. Sasha will always read this file before responding to you in the main chat. 

For example:
- Never suggest investing in cryptocurrency.
- When I ask for a market summary, always include the VIX index.
- My company's fiscal year ends in June.`;

async function ensureFileExists() {
    try {
        await fs.access(storagePath);
    } catch {
        // The file or directory doesn't exist. Create it.
        const dir = path.dirname(storagePath);
        await fs.mkdir(dir, { recursive: true });

        // Seed the file with default content. This is more reliable than trying to read
        // the source file, which can fail in some serverless environments.
        const initialContent = JSON.stringify({ notes: defaultNotes }, null, 2);
        
        await fs.writeFile(storagePath, initialContent, 'utf-8');
    }
}

export async function getKnowledge(): Promise<string> {
    await ensureFileExists();
    try {
        const fileContent = await fs.readFile(storagePath, 'utf-8');
        const data: KnowledgeBase = JSON.parse(fileContent);
        return data.notes;
    } catch (error) {
        console.error('Failed to read knowledge base:', error);
        // Return a default or empty string in case of an error.
        return defaultNotes;
    }
}

export async function saveKnowledge(notes: string): Promise<{ success: boolean }> {
    await ensureFileExists();
    try {
        const data: KnowledgeBase = { notes };
        await fs.writeFile(storagePath, JSON.stringify(data, null, 2), 'utf-8');
        return { success: true };
    } catch (error) {
        console.error('Failed to save knowledge base:', error);
        return { success: false };
    }
}
