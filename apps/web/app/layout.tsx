import React from 'react';
import '../../../packages/ui/src/styles/global.css';

export const metadata = {
  title: 'MyFinanceOS',
  description: 'Mission Control for your Finances',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=0" />
      </head>
      <body suppressHydrationWarning>
        <div id="root">{children}</div>
      </body>
    </html>
  );
}
