import type { Metadata } from 'next';
import './globals.css';
import { ThemeProvider } from '@/components/theme-provider';

export const metadata: Metadata = {
  title: 'AI Job Search — Career Strategy & Application Workspace',
  description: 'AI-powered Job Search Web App: Grounded CV Tailoring, Fit Analysis, Cover Letter Generator, and Interview Prep.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="font-sans antialiased">
        <ThemeProvider defaultTheme="dark" storageKey="job-search-theme">
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
