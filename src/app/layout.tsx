import type {Metadata} from 'next';
import { Inter, Cairo } from 'next/font/google';
import './globals.css';
import { Toaster } from "@/components/ui/toaster";
import { LanguageProvider } from '@/context/language-context';
import { 
  SidebarProvider, 
  Sidebar, 
  SidebarHeader, 
  SidebarContent, 
  SidebarInset 
} from '@/components/ui/sidebar';
import { SashaAvatar } from '@/components/sasha-avatar';
import { MainNav } from '@/components/main-nav';
import { Analytics } from '@vercel/analytics/react';
import { SpeedInsights } from '@vercel/speed-insights/next';
import { cn } from '@/lib/utils';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

const cairo = Cairo({
  subsets: ['arabic', 'latin'],
  variable: '--font-cairo',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Sasha Banking',
  description: 'Your intelligent banking assistant',
  icons: {
    icon: 'data:,',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" dir="ltr" suppressHydrationWarning>
      <body className={cn(
        "font-body antialiased",
        inter.variable,
        cairo.variable
      )}>
        <LanguageProvider>
          <SidebarProvider defaultOpen={false}>
            <Sidebar>
              <SidebarHeader>
                <div className="flex items-center gap-2">
                  <SashaAvatar className="w-8 h-8" />
                  <span className="text-lg font-semibold">Sasha</span>
                </div>
              </SidebarHeader>
              <SidebarContent>
                <MainNav />
              </SidebarContent>
            </Sidebar>
            <SidebarInset>
              {children}
            </SidebarInset>
          </SidebarProvider>
          <Toaster />
        </LanguageProvider>
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
