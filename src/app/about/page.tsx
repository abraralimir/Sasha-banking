
import type { Metadata } from 'next';
import AboutPageClient from './about-client';

export const metadata: Metadata = {
  title: 'About Sasha',
  description: 'Learn about Sasha, the AI-powered financial strategist. Discover her core capabilities, who benefits, and how to get started.',
  keywords: ['ai banking', 'financial strategist', 'sasha', 'agentic ai', 'financial services', 'fintech', 'about sasha'],
};

export default function AboutPage() {
  return <AboutPageClient />;
}
