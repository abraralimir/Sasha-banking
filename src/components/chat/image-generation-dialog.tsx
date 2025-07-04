'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Wand2, Loader2, Download } from 'lucide-react';
import NextImage from 'next/image';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { useLanguage } from '@/context/language-context';
import { generateImageFromText } from '@/ai/flows/generate-image-from-text';

const formSchema = z.object({
  prompt: z.string().min(3, 'Prompt must be at least 3 characters.'),
});

interface ImageGenerationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onImageGenerated: (imageUrl: string, prompt: string) => void;
}

export function ImageGenerationDialog({ open, onOpenChange, onImageGenerated }: ImageGenerationDialogProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const { toast } = useToast();
  const { t, dir } = useLanguage();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      prompt: '',
    },
  });

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    setIsLoading(true);
    setGeneratedImage(null);

    try {
      const result = await generateImageFromText({ prompt: values.prompt });
      setGeneratedImage(result.imageUrl);
    } catch (error) {
      console.error('Failed to generate image from Genkit flow', error);
      toast({
        variant: 'destructive',
        title: t('imageGenFailedTitle'),
        description: t('imageGenFailedDesc'),
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleOpenChange = (isOpen: boolean) => {
    if (!isOpen) {
      form.reset();
      setGeneratedImage(null);
      setIsLoading(false);
    }
    onOpenChange(isOpen);
  };
  
  const handleAddToChat = () => {
    if(generatedImage) {
      onImageGenerated(generatedImage, form.getValues('prompt'));
      handleOpenChange(false);
    }
  }

  const handleDownloadImage = () => {
    if (generatedImage) {
      const link = document.createElement('a');
      link.href = generatedImage;
      link.download = 'sasha-magic.png';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[525px]" dir={dir}>
        <DialogHeader>
          <DialogTitle className="flex items-center">
            <Wand2 className="mr-2 h-5 w-5" /> {t('imageDialogTitle')}
          </DialogTitle>
          <DialogDescription>
            {t('imageDialogDesc')}
          </DialogDescription>
          <p className="text-xs text-muted-foreground !mt-3">
            {t('imageGenDisclaimer')}
          </p>
        </DialogHeader>
        <div className="py-4 min-h-[192px]">
          {generatedImage ? (
            <div className="relative aspect-square w-full">
              <NextImage
                src={generatedImage}
                alt={form.getValues('prompt') || "Sasha's magic"}
                fill
                className="rounded-md object-cover"
                data-ai-hint="generative art"
              />
            </div>
          ) : isLoading ? (
            <div className="flex justify-center items-center h-48 bg-muted rounded-md">
              <div className="flex flex-col items-center space-y-2">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <p className="text-muted-foreground">{t('generatingMessage')}</p>
              </div>
            </div>
          ) : (
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="prompt"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('promptLabel')}</FormLabel>
                      <FormControl>
                        <Input placeholder={t('promptPlaceholder')} {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <DialogFooter>
                  <Button type="submit" disabled={isLoading}>
                    {isLoading ? <Loader2 className="animate-spin mr-2" /> : null}
                    {t('generateButton')}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          )}
        </div>
        {generatedImage && !isLoading && (
          <DialogFooter>
            <Button variant="outline" onClick={() => { setGeneratedImage(null); form.reset(); }}>
              {t('generateAnotherButton')}
            </Button>
            <div className="flex-grow" />
            <Button variant="secondary" onClick={handleDownloadImage}>
              <Download className="mr-2 h-4 w-4" />
              {t('downloadButton')}
            </Button>
            <Button onClick={handleAddToChat}>{t('addToChatButton')}</Button>
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
}
