import React from 'react';
import '../src/styles/globals.css';
import '../../../packages/ui/src/styles/global.css';
import '../src/styles/emergent-landing.css';

export const metadata = {
  title: 'MyFinanceOS',
  description: 'Mission Control for your Finances',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=0" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Anton&family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;600&display=swap" rel="stylesheet" />
      </head>
      <body suppressHydrationWarning>
        <div id="root">{children}</div>
      </body>
    </html>
  );
}
