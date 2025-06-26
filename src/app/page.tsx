'use client';

import { useState } from 'react';
import { CornerDownLeft, Image as ImageIcon, Mic } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { ImageGenerationDialog } from '@/components/chat/image-generation-dialog';
import { MessageList, type Message } from '@/components/chat/message-list';
import { SashaAvatar } from '@/components/sasha-avatar';
import { chat } from '@/ai/flows/chat';
import { useToast } from '@/hooks/use-toast';

export default function Home() {
  const [messages, setMessages] = useState<Message[]>([
    { id: '1', role: 'assistant', content: "Hello! I'm Sasha, your AI companion. How can I assist you today?" }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isImageGenerationOpen, setImageGenerationOpen] = useState(false);
  const { toast } = useToast();
  
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const newUserMessage: Message = { id: Date.now().toString(), role: 'user', content: input };
    const newMessages = [...messages, newUserMessage];
    setMessages(newMessages);
    setInput('');
    setIsLoading(true);

    try {
      const historyForApi = newMessages.map(({ id, imageUrl, ...rest }) => rest);

      const response = await chat({ history: historyForApi });
      
      const botResponse: Message = {
        id: Date.now().toString(),
        role: 'assistant',
        content: response.content,
      };
      setMessages(prev => [...prev, botResponse]);

    } catch (error) {
      console.error(error);
      toast({
        variant: 'destructive',
        title: 'Oh no! Something went wrong.',
        description: 'Failed to get a response from Sasha. Please try again.',
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleImageGenerated = (imageUrl: string, prompt: string) => {
    const newImageMessage: Message = {
      id: Date.now().toString(),
      role: 'assistant',
      content: `Here is the image I generated for the prompt: "${prompt}"`,
      imageUrl: imageUrl,
    };
    setMessages(prev => [...prev, newImageMessage]);
  };

  return (
    <TooltipProvider delayDuration={0}>
      <div className="flex flex-col h-screen bg-background text-foreground animate-in fade-in-50 duration-500">
        <header className="flex items-center justify-center p-4 border-b shrink-0">
          <SashaAvatar className="w-8 h-8 mr-3" />
          <h1 className="text-xl font-semibold tracking-tight">Sasha AI</h1>
        </header>
        
        <main className="flex-1 overflow-y-auto">
          <MessageList messages={messages} isLoading={isLoading} />
        </main>
        
        <footer className="p-4 border-t shrink-0 bg-background">
          <div className="max-w-3xl mx-auto">
            <form onSubmit={handleSendMessage} className="relative">
              <Textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Message Sasha..."
                className="pr-32 py-3 text-base resize-none"
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSendMessage(e);
                  }
                }}
                rows={1}
              />
              <div className="absolute top-1/2 right-3 transform -translate-y-1/2 flex items-center space-x-1">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button type="button" variant="ghost" size="icon" onClick={() => setImageGenerationOpen(true)}>
                      <ImageIcon className="w-5 h-5" />
                      <span className="sr-only">Generate Image</span>
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Generate Image</TooltipContent>
                </Tooltip>
                
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button type="button" variant="ghost" size="icon" disabled>
                      <Mic className="w-5 h-5" />
                      <span className="sr-only">Use Microphone</span>
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Use Microphone</TooltipContent>
                </Tooltip>
                
                <Button type="submit" size="sm" disabled={isLoading || !input.trim()}>
                  <CornerDownLeft className="w-5 h-5" />
                  <span className="sr-only">Send</span>
                </Button>
              </div>
            </form>
          </div>
        </footer>
        <ImageGenerationDialog 
          open={isImageGenerationOpen} 
          onOpenChange={setImageGenerationOpen}
          onImageGenerated={handleImageGenerated}
        />
      </div>
    </TooltipProvider>
  );
}
