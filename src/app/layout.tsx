import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'CalSAWS Reimagined — AI-built eligibility platform',
  description: 'Statewide eligibility, benefit calculation, and case management — rebuilt end to end.',
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>
        <a className="skip" href="#main">Skip to content</a>
        {children}
      </body>
    </html>
  );
}
