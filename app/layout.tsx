import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'ikarkhana',
  description: 'Engineering diagram cost estimation frontend',
};

export default function RootLayout({
  children,
}: Readonly<{ 
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="light">
      <body className="bg-slate-50 text-slate-900 min-h-screen flex flex-col font-sans antialiased">
        {children}
      </body>
    </html>
  );
}
