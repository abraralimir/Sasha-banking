
import type { Metadata } from 'next';
import KnowledgeBaseClient from './knowledge-base-client';

export const metadata: Metadata = {
    title: 'Sasha\'s Knowledge Base',
    description: 'Customize Sasha\'s knowledge. Add your own instructions, rules, and data for her to remember across all conversations.',
    keywords: ['sasha knowledge base', 'custom instructions', 'ai personalization', 'financial rules', 'sasha settings'],
};

export default function KnowledgeBasePage() {
    return <KnowledgeBaseClient />;
}
