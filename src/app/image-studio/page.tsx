
import type { Metadata } from 'next';
import ImageStudioClient from './image-studio-client';

export const metadata: Metadata = {
    title: 'Image Studio',
    description: 'A creative space to generate and enhance images using Sasha AI. Features include text-to-image and image upscaling.',
    keywords: ['ai image generator', 'image upscaling', 'sasha image studio', 'text-to-image', 'ai creative tools'],
};

export default function ImageStudioPage() {
    return <ImageStudioClient />;
}
