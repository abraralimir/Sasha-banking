import type {Metadata} from 'next';
import './globals.css';
import { Toaster } from "@/components/ui/toaster";
import { ThemeProvider } from '@/components/theme-provider';

export const metadata: Metadata = {
  title: 'Sasha AI',
  description: 'Your intelligent AI companion',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet" />
      </head>
      <body className="font-body antialiased">
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <video
            autoPlay
            loop
            muted
            playsInline
            className="background-video"
            key="background-video"
          >
            <source src="https://cdn.pixabay.com/video/2024/05/27/211598-945761358_large.mp4" type="video/mp4" />
          </video>
          <main className="relative z-10">{children}</main>
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  );
}
