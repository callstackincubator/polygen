import './globals.css';
import { RootProvider } from 'fumadocs-ui/provider';
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import type { ReactNode } from 'react';

export const metadata: Metadata = {
  title: {
    template: '%s | Polygen',
    default: 'Polygen',
  },
};

const inter = Inter({
  subsets: ['latin'],
});

export default function Layout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className={inter.className} suppressHydrationWarning>
      <head>
        <link
          rel="icon"
          href={`${process.env.DOCS_BASE_PATH ?? ''}/polygen-logo.png`}
        />
      </head>
      <body
        style={{
          display: 'flex',
          flexDirection: 'column',
          minHeight: '100vh',
        }}
      >
        <RootProvider
          search={{
            links: [
              ['Polygen Docs', '/docs/polygen'],
              ['Config reference', '/docs/config'],
            ],
          }}
        >
          {children}
        </RootProvider>
      </body>
    </html>
  );
}
