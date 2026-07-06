// Shared staff shell: topbar + sidebar + copilot around every staff page.
import Link from 'next/link';
import { getStaffContext } from '@/lib/auth-helpers';
import { signOut } from '@/app/actions/auth';
import SideNav from '@/components/SideNav';
import Copilot from '@/components/Copilot';

export default async function StaffLayout({ children }: { children: React.ReactNode }) {
  const { profile } = await getStaffContext();
  return (
    <>
      <header className="topbar">
        <Link className="brand" href="/"><span className="seal">CA</span> CalSAWS <span style={{ fontWeight: 400, opacity: .75 }}>Reimagined</span></Link>
        <span className="env-chip">AI-built platform</span>
        <span className="spacer" />
        <div className="who"><strong data-testid="whoami">{profile.full_name}</strong><br />{profile.title} · {profile.county}</div>
        <form action={signOut}><button type="submit" data-testid="signout">Sign out</button></form>
      </header>
      <div className="shell">
        <SideNav role={profile.role} />
        <main className="main" id="main"><div className="inner">{children}</div></main>
      </div>
      <Copilot />
    </>
  );
}
