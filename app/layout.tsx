import type { Metadata } from 'next';
import './globals.css';
import { AuthProvider } from '@/context/AuthContext';
import { ToastProvider } from '@/components/ui/Toast';

export const metadata: Metadata = {
  title: 'ResearchMind · Autonomous Multi-Agent Research System',
  description:
    'Modular, production-ready autonomous research pipeline powered by Groq LLM inference, Tavily live web retrieval, and Supabase RBAC.',
  keywords: [
    'AI Agents',
    'Multi-Agent System',
    'Autonomous Research',
    'Groq',
    'Tavily',
    'Supabase',
    'LangChain',
  ],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" href="/favicon.ico" sizes="any" />
      </head>
      <body>
        <AuthProvider>
          <ToastProvider>{children}</ToastProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
