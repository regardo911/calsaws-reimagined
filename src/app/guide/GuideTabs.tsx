'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const TABS = [
  { href: '/', label: 'Login here', icon: '🔑' },
  { href: '/guide/introduction', label: 'Introduction', icon: '✨' },
  { href: '/guide/demo', label: 'Demo Script', icon: '🎬' },
  { href: '/guide/accounts', label: 'Accounts by County', icon: '🗂️' },
  { href: '/guide/reference', label: 'Reference Material', icon: '📚' },
  { href: '/guide/architecture', label: 'Architecture', icon: '🏛️' },
] as const;

export default function GuideTabs() {
  const pathname = usePathname();
  return (
    <nav className="guide-tabs" aria-label="Site sections">
      {TABS.map((t) => {
        const active = t.href === '/' ? pathname === '/' : (pathname === t.href || pathname.startsWith(t.href + '/'));
        return (
          <Link
            key={t.href}
            href={t.href}
            className={active ? 'guide-tab active' : 'guide-tab'}
            aria-current={active ? 'page' : undefined}
          >
            <span className="guide-tab-ic" aria-hidden="true">{t.icon}</span>
            <span>{t.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
