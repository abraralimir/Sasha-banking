'use client';

import { useState, useRef } from 'react';
import { CornerDownLeft, Image as ImageIcon, Mic, FileUp, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { ImageGenerationDialog } from '@/components/chat/image-generation-dialog';
import { MessageList, type Message } from '@/components/chat/message-list';
import { SashaAvatar } from '@/components/sasha-avatar';
import { chat } from '@/ai/flows/chat';
import { analyzeLoan } from '@/ai/flows/analyze-loan';
import { analyzeFinancialStatement } from '@/ai/flows/analyze-financial-statement';
import { useToast } from '@/hooks/use-toast';
import { ThemeToggle } from '@/components/theme-toggle';
import jsPDF from 'jspdf';

export default function Home() {
  const [messages, setMessages] = useState<Message[]>([
    { 
      id: '1', 
      role: 'assistant', 
      content: "Hello! I'm Sasha, your personal banking assistant. You can upload a CSV for loan analysis (e.g., 'analyze loan LP001002') or a PDF for an instant financial statement analysis." 
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isImageGenerationOpen, setImageGenerationOpen] = useState(false);
  const [csvData, setCsvData] = useState<string | null>(null);
  const [pdfData, setPdfData] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const pdfInputRef = useRef<HTMLInputElement>(null);
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
      const loanAnalysisRegex = /analyze loan (\w+)/i;
      const loanMatch = input.match(loanAnalysisRegex);

      if (loanMatch && csvData) {
        const loanId = loanMatch[1];
        const response = await analyzeLoan({ csvData, loanId });
        const botResponse: Message = {
          id: Date.now().toString(),
          role: 'assistant',
          content: `Here is the analysis for Loan ID **${loanId}**:`,
          analysisReport: { ...response, loanId },
        };
        setMessages(prev => [...prev, botResponse]);
      } else if (loanMatch && !csvData) {
        setMessages(prev => [...prev, { id: Date.now().toString(), role: 'assistant', content: 'Please upload a CSV file first.' }]);
      } else {
        const historyForApi = newMessages.map(({ id, imageUrl, analysisReport, financialReport, ...rest }) => rest);
        const response = await chat({ history: historyForApi, pdfDataUri: pdfData });
        const botResponse: Message = {
          id: Date.now().toString(),
          role: 'assistant',
          content: response.content,
        };
        setMessages(prev => [...prev, botResponse]);
      }
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

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const text = e.target?.result as string;
        setCsvData(text);
        toast({
          title: 'CSV File Uploaded',
          description: `${file.name} is ready for loan analysis.`,
        });
      };
      reader.readAsText(file);
    }
  };

  const handlePdfUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || file.type !== 'application/pdf') {
      toast({
        variant: 'destructive',
        title: 'Invalid File Type',
        description: 'Please upload a PDF file.',
      });
      return;
    }
    
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = async (e) => {
      const dataUri = e.target?.result as string;
      setPdfData(dataUri); // Keep PDF data for context in future chats
      toast({
        title: 'PDF File Uploaded',
        description: `${file.name} is ready. Starting analysis...`,
      });

      setIsLoading(true);
      setMessages(prev => [...prev, { id: Date.now().toString(), role: 'assistant', content: `Analyzing the financial statement: ${file.name}...` }]);
      
      try {
        const response = await analyzeFinancialStatement({ pdfDataUri: dataUri });
        const botResponse: Message = {
          id: Date.now().toString(),
          role: 'assistant',
          content: `Here is the analysis of the financial statement:`,
          financialReport: response,
        };
        setMessages(prev => [...prev, botResponse]);
      } catch (error) {
        console.error("Financial statement analysis failed:", error);
        toast({
          variant: 'destructive',
          title: 'Analysis Failed',
          description: 'Sasha could not analyze the financial statement. Please try again.',
        });
        setMessages(prev => [...prev, { id: Date.now().toString(), role: 'assistant', content: 'Sorry, I was unable to analyze that document.' }]);
      } finally {
        setIsLoading(false);
      }
    };
  };

  const handleDownloadLoanPdf = (report: Message['analysisReport']) => {
    if (!report) return;

    const doc = new jsPDF();
    let yPos = 22;

    doc.setFontSize(18);
    doc.text(`Loan Analysis Report: ID ${report.loanId}`, 14, yPos);
    yPos += 18;

    const addSection = (title: string, content: string) => {
      doc.setFontSize(14);
      doc.text(title, 14, yPos);
      yPos += 8;
      doc.setFontSize(10);
      const splitContent = doc.splitTextToSize(content, 180);
      doc.text(splitContent, 14, yPos);
      yPos += (splitContent.length * 5) + 10;
    };

    addSection('Summary', report.summary);
    addSection('Prediction', report.prediction);
    addSection('Eligibility', report.eligibility);
    
    const pageHeight = doc.internal.pageSize.height || doc.internal.pageSize.getHeight();
    doc.setFontSize(8);
    doc.text('AI generated by Sasha', 14, pageHeight - 10);

    doc.save(`loan-report-${report.loanId}.pdf`);
  };
  
  const handleDownloadFinancialReportPdf = (report: Message['financialReport']) => {
    if (!report) return;

    const doc = new jsPDF();
    let yPos = 22;

    doc.setFontSize(18);
    doc.text('Financial Statement Analysis', 14, yPos);
    yPos += 18;

    const addSection = (title: string, content: string) => {
      doc.setFontSize(14);
      doc.text(title, 14, yPos);
      yPos += 8;
      doc.setFontSize(10);
      const splitContent = doc.splitTextToSize(content, 180);
      doc.text(splitContent, 14, yPos);
      yPos += (splitContent.length * 5) + 10;
    };

    addSection('Summary', report.summary);
    addSection('Prediction', report.prediction);

    const pageHeight = doc.internal.pageSize.height || doc.internal.pageSize.getHeight();
    doc.setFontSize(8);
    doc.text('AI generated by Sasha', 14, pageHeight - 10);

    doc.save('financial-statement-analysis.pdf');
  };

  return (
    <TooltipProvider delayDuration={0}>
      <div className="flex flex-col h-screen text-foreground animate-in fade-in-50 duration-500">
        <header className="flex items-center justify-between p-4 border-b shrink-0 bg-background/80 backdrop-blur-sm">
          <div className="flex items-center">
            <SashaAvatar className="w-8 h-8 mr-3" />
            <h1 className="text-xl font-semibold tracking-tight">Sasha Banking</h1>
          </div>
          <ThemeToggle />
        </header>
        
        <main className="flex-1 overflow-y-auto">
          <MessageList 
            messages={messages} 
            isLoading={isLoading} 
            onDownloadLoanPdf={handleDownloadLoanPdf}
            onDownloadFinancialReportPdf={handleDownloadFinancialReportPdf}
          />
        </main>
        
        <footer className="p-4 border-t shrink-0 bg-background">
          <div className="max-w-3xl mx-auto">
            <form onSubmit={handleSendMessage} className="relative">
              <Textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Message Sasha..."
                className="pr-48 py-3 text-base resize-none"
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSendMessage(e);
                  }
                }}
                rows={1}
              />
              <div className="absolute top-1/2 right-3 transform -translate-y-1/2 flex items-center space-x-1">
                <input type="file" ref={fileInputRef} onChange={handleFileUpload} accept=".csv" className="hidden" />
                <input type="file" ref={pdfInputRef} onChange={handlePdfUpload} accept="application/pdf" className="hidden" />
                
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button type="button" variant="ghost" size="icon" onClick={() => fileInputRef.current?.click()}>
                      <FileUp className="w-5 h-5" />
                      <span className="sr-only">Upload CSV</span>
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Upload Loan CSV</TooltipContent>
                </Tooltip>

                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button type="button" variant="ghost" size="icon" onClick={() => pdfInputRef.current?.click()}>
                      <FileText className="w-5 h-5" />
                      <span className="sr-only">Upload PDF</span>
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Upload Financial PDF</TooltipContent>
                </Tooltip>

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
