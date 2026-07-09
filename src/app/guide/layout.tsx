// Public guide shell (/guide/*) — SERVER component. No auth, no DB reads.
// Sits outside the (staff) route group, so the staff gate never runs here.
import type { Metadata } from 'next';
import Link from 'next/link';
import GuideTabs from './GuideTabs';
import './guide.css';

export const metadata: Metadata = {
  title: 'How CalSAWS Reimagined was built — Guide',
  description:
    'A public walkthrough of CalSAWS Reimagined: the demo script, the county-scoped demo accounts, source references, and the architecture behind an AI-built California eligibility platform.',
};

export default function GuideLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <div className="guide">
      <header className="guide-hero">
        <div className="guide-hero-inner">
          <Link className="guide-brand" href="/">
            <span className="guide-seal" aria-hidden="true">CA</span>
            CalSAWS Reimagined
          </Link>
          <div className="guide-eyebrow">California Statewide Automated Welfare System · rebuilt with AI</div>
          <h1 className="guide-h1">CalSAWS Reimagined</h1>
          <p className="guide-tagline">
            A working, database-backed eligibility platform for California&rsquo;s 58 counties &mdash; and the guide to
            how it was built. Sign in, run a real determination, and see the math on screen.
          </p>
          <div className="guide-live">
            <span className="guide-live-dot" aria-hidden="true" />
            <span>Live at <a href="https://calsaws-reimagined.vercel.app">calsaws-reimagined.vercel.app</a></span>
          </div>
        </div>
      </header>

      <div className="guide-nav">
        <div className="guide-nav-inner">
          <GuideTabs />
        </div>
      </div>

      <main className="guide-main" id="main">
        <div className="guide-inner">{children}</div>
      </main>

      <footer className="guide-footer">
        <div className="guide-footer-inner">
          <Link href="/">&larr; Back to the platform</Link>
          <span className="muted xs">
            Synthetic data only &middot; every account, case, and determination lives in a real Postgres database.
          </span>
        </div>
      </footer>
    </div>
  );
}
