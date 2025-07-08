'use server';

import { promises as fs } from 'fs';
import path from 'path';

const knowledgeFilePath = path.join(process.cwd(), 'src', 'data', 'knowledge-base.json');

type KnowledgeBase = {
    notes: string;
};

async function ensureFileExists() {
    try {
        await fs.access(knowledgeFilePath);
    } catch {
        // If the directory doesn't exist, create it.
        await fs.mkdir(path.dirname(knowledgeFilePath), { recursive: true });
        // If the file doesn't exist, create it with a default structure.
        await fs.writeFile(knowledgeFilePath, JSON.stringify({ notes: '' }, null, 2), 'utf-8');
    }
}

export async function getKnowledge(): Promise<string> {
    await ensureFileExists();
    try {
        const fileContent = await fs.readFile(knowledgeFilePath, 'utf-8');
        const data: KnowledgeBase = JSON.parse(fileContent);
        return data.notes;
    } catch (error) {
        console.error('Failed to read knowledge base:', error);
        // Return a default or empty string in case of an error.
        return '';
    }
}

export async function saveKnowledge(notes: string): Promise<{ success: boolean }> {
    await ensureFileExists();
    try {
        const data: KnowledgeBase = { notes };
        await fs.writeFile(knowledgeFilePath, JSON.stringify(data, null, 2), 'utf-8');
        return { success: true };
    } catch (error) {
        console.error('Failed to save knowledge base:', error);
        return { success: false };
    }
}
