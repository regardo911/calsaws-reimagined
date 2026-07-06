'use client';
// Staff sidebar with active-route highlight.
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function SideNav({ role }: { role: string }) {
  const path = usePathname();
  const links: [string, string][] = [
    ['/worker', '🗂️ Dashboard'],
    ['/worker/search', '🔎 Person Search'],
    ['/worker/register', '📝 Register Application'],
  ];
  if (role === 'supervisor' || role === 'admin') {
    links.push(['/supervisor', '✅ Authorizations'], ['/supervisor/team', '👥 Team & Tasks']);
  }
  links.push(['/reports', '📊 Reports']);
  if (role === 'admin') links.push(['/admin', '⚙️ Rules & Config'], ['/admin/users', '🪪 Users']);

  return (
    <nav className="sidebar" aria-label="Main">
      {links.map(([href, label]) => (
        <Link key={href} href={href} aria-current={path === href ? 'page' : undefined}>{label}</Link>
      ))}
      <div className="sect eyebrow">Demo</div>
      <Link href="/portal/apply">🌐 Public portal</Link>
    </nav>
  );
}
