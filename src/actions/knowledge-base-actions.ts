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

async function ensureFileExists() {
    try {
        await fs.access(storagePath);
    } catch {
        // The file or directory doesn't exist. Create it.
        const dir = path.dirname(storagePath);
        await fs.mkdir(dir, { recursive: true });

        // If on Vercel, try to seed the file from the original source file.
        // Otherwise, or if seeding fails, create a default empty file.
        let initialContent = JSON.stringify({ notes: '' }, null, 2);
        if (isVercel) {
            try {
                const sourceContent = await fs.readFile(
                    path.join(process.cwd(), 'src', 'data', 'knowledge-base.json'),
                    'utf-8'
                );
                // Only use source content if it's valid JSON.
                JSON.parse(sourceContent);
                initialContent = sourceContent;
            } catch (readError) {
                console.warn('Could not read seed knowledge base file, starting with empty.');
            }
        }
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
        return '';
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
