// Guide Tab 3 — Accounts by County. STATIC server component: no DB, no auth.
// The 37-account roster below is reproduced verbatim from the single source of
// truth, src/lib/seed-core.ts (LA_ACCOUNTS + COUNTY_PEOPLE + buildRoster):
//   12 counties x { applicant, worker, supervisor } (36) + 1 statewide admin.
// Worker IDs: <2-digit county code>LS01100A (worker) / <code>LS01000S (super);
// LA keeps its original 19LS01220A (Dana) / 19LS01200S (Angela).
import { Fragment } from 'react';

interface Person { name: string; title: string; email: string; wid?: string }
interface CountyRoster { name: string; code: string; applicant: Person; worker: Person; supervisor: Person }

const COUNTIES: CountyRoster[] = [
  {
    name: 'Los Angeles', code: '19',
    applicant:  { name: 'Maria Reyes',     title: 'Applicant',            email: 'applicant.maria@demo.calsaws.test' },
    worker:     { name: 'Dana Whitfield',  title: 'Eligibility Worker II', email: 'worker.dana@demo.calsaws.test',       wid: '19LS01220A' },
    supervisor: { name: 'Angela Ruiz',     title: 'Eligibility Supervisor', email: 'supervisor.angela@demo.calsaws.test', wid: '19LS01200S' },
  },
  {
    name: 'San Diego', code: '37',
    applicant:  { name: 'Sofia Herrera',   title: 'Applicant',             email: 'applicant.sandiego@demo.calsaws.test' },
    worker:     { name: 'Keisha Brown',    title: 'Eligibility Worker I',  email: 'worker.sandiego@demo.calsaws.test',       wid: '37LS01100A' },
    supervisor: { name: 'Marcus Delgado',  title: 'Eligibility Supervisor', email: 'supervisor.sandiego@demo.calsaws.test', wid: '37LS01000S' },
  },
  {
    name: 'Orange', code: '30',
    applicant:  { name: 'Hector Salas',    title: 'Applicant',             email: 'applicant.orange@demo.calsaws.test' },
    worker:     { name: 'Brian Pham',      title: 'Eligibility Worker II', email: 'worker.orange@demo.calsaws.test',       wid: '30LS01100A' },
    supervisor: { name: 'Linda Whitmore',  title: 'Eligibility Supervisor', email: 'supervisor.orange@demo.calsaws.test', wid: '30LS01000S' },
  },
  {
    name: 'Riverside', code: '33',
    applicant:  { name: 'Priya Nair',      title: 'Applicant',             email: 'applicant.riverside@demo.calsaws.test' },
    worker:     { name: 'Tanisha Coleman', title: 'Eligibility Worker II', email: 'worker.riverside@demo.calsaws.test',       wid: '33LS01100A' },
    supervisor: { name: 'Raymond Ortiz',   title: 'Eligibility Supervisor', email: 'supervisor.riverside@demo.calsaws.test', wid: '33LS01000S' },
  },
  {
    name: 'San Bernardino', code: '36',
    applicant:  { name: 'Omar Haddad',     title: 'Applicant',             email: 'applicant.sanbernardino@demo.calsaws.test' },
    worker:     { name: 'Andre Watkins',   title: 'Eligibility Worker I',  email: 'worker.sanbernardino@demo.calsaws.test',       wid: '36LS01100A' },
    supervisor: { name: 'Diana Castillo',  title: 'Eligibility Supervisor', email: 'supervisor.sanbernardino@demo.calsaws.test', wid: '36LS01000S' },
  },
  {
    name: 'Santa Clara', code: '43',
    applicant:  { name: 'Anh Ly',          title: 'Applicant',              email: 'applicant.santaclara@demo.calsaws.test' },
    worker:     { name: 'Wei Chen',        title: 'Eligibility Worker III', email: 'worker.santaclara@demo.calsaws.test',       wid: '43LS01100A' },
    supervisor: { name: 'Rebecca Goldman', title: 'Eligibility Supervisor', email: 'supervisor.santaclara@demo.calsaws.test', wid: '43LS01000S' },
  },
  {
    name: 'Alameda', code: '01',
    applicant:  { name: 'Carlos Mendez',   title: 'Applicant',             email: 'applicant.alameda@demo.calsaws.test' },
    worker:     { name: 'Jamal Robinson',  title: 'Eligibility Worker II', email: 'worker.alameda@demo.calsaws.test',       wid: '01LS01100A' },
    supervisor: { name: 'Grace Okonkwo',   title: 'Eligibility Supervisor', email: 'supervisor.alameda@demo.calsaws.test', wid: '01LS01000S' },
  },
  {
    name: 'Sacramento', code: '34',
    applicant:  { name: 'Rosa Alvarez',    title: 'Applicant',             email: 'applicant.sacramento@demo.calsaws.test' },
    worker:     { name: 'Emily Larsen',    title: 'Eligibility Worker II', email: 'worker.sacramento@demo.calsaws.test',       wid: '34LS01100A' },
    supervisor: { name: 'David Schmidt',   title: 'Eligibility Supervisor', email: 'supervisor.sacramento@demo.calsaws.test', wid: '34LS01000S' },
  },
  {
    name: 'Contra Costa', code: '07',
    applicant:  { name: 'Kevin Park',      title: 'Applicant',            email: 'applicant.contracosta@demo.calsaws.test' },
    worker:     { name: 'Nadia Farouk',    title: 'Eligibility Worker I', email: 'worker.contracosta@demo.calsaws.test',       wid: '07LS01100A' },
    supervisor: { name: 'Thomas Reilly',   title: 'Eligibility Supervisor', email: 'supervisor.contracosta@demo.calsaws.test', wid: '07LS01000S' },
  },
  {
    name: 'Fresno', code: '10',
    applicant:  { name: 'Blanca Torres',   title: 'Applicant',              email: 'applicant.fresno@demo.calsaws.test' },
    worker:     { name: 'Paul Tran',       title: 'Eligibility Worker III', email: 'worker.fresno@demo.calsaws.test',       wid: '10LS01100A' },
    supervisor: { name: 'Gloria Vasquez',  title: 'Eligibility Supervisor', email: 'supervisor.fresno@demo.calsaws.test', wid: '10LS01000S' },
  },
  {
    name: 'Kern', code: '15',
    applicant:  { name: 'Luis Cardenas',   title: 'Applicant',             email: 'applicant.kern@demo.calsaws.test' },
    worker:     { name: 'Cody Bautista',   title: 'Eligibility Worker II', email: 'worker.kern@demo.calsaws.test',       wid: '15LS01100A' },
    supervisor: { name: 'Sandra Mercer',   title: 'Eligibility Supervisor', email: 'supervisor.kern@demo.calsaws.test', wid: '15LS01000S' },
  },
  {
    name: 'San Francisco', code: '38',
    applicant:  { name: 'Yesenia Flores',  title: 'Applicant',             email: 'applicant.sanfrancisco@demo.calsaws.test' },
    worker:     { name: 'Helen Liu',       title: 'Eligibility Worker II', email: 'worker.sanfrancisco@demo.calsaws.test',       wid: '38LS01100A' },
    supervisor: { name: 'Daniel Mensah',   title: 'Eligibility Supervisor', email: 'supervisor.sanfrancisco@demo.calsaws.test', wid: '38LS01000S' },
  },
];

const ADMIN: Person = { name: 'Chris Yamamoto', title: 'System Administrator', email: 'admin.chris@demo.calsaws.test' };

export default function Page() {
  return (
    <div className="g-stack">
      <div>
        <div className="g-eyebrow">Tab 3 — Accounts by County</div>
        <h2 className="g-h2">Accounts by County</h2>
      </div>

      <p className="g-lede">
        All 37 accounts below are <strong>live in the database right now</strong> &mdash; pick any row and sign in.
        The scope each account gets is real and <strong>enforced in Postgres</strong>, not faked in the UI:
        an applicant sees only their own case, a worker or supervisor sees only their own county
        (<strong>county-scoped row-level security</strong>), and the single statewide administrator sees every county.
        It is the clearest way to watch RLS work.
      </p>

      <div className="g-grid g-grid-3">
        <div className="g-stat">
          <div className="g-stat-v">37</div>
          <div className="g-stat-l">Live demo accounts</div>
          <div className="g-stat-d">All seeded this session &mdash; real auth users, real profiles.</div>
        </div>
        <div className="g-stat">
          <div className="g-stat-v">12</div>
          <div className="g-stat-l">Counties</div>
          <div className="g-stat-d">Real California county codes; each county&rsquo;s caseload is isolated.</div>
        </div>
        <div className="g-stat">
          <div className="g-stat-v">3</div>
          <div className="g-stat-l">Personas per county</div>
          <div className="g-stat-d">Applicant &middot; worker &middot; supervisor &mdash; plus one statewide admin.</div>
        </div>
      </div>

      <div className="g-callout gold">
        <span className="g-callout-title">One password for every account</span>
        Sign in at <a href="https://calsaws-reimagined.vercel.app">calsaws-reimagined.vercel.app</a> with any email in
        the table and the shared password <span className="g-code">CalSAWS-demo-2026!</span>. Row-level security in
        Postgres compares the signed-in profile&rsquo;s county to each case&rsquo;s county, so a county worker
        literally cannot query another county&rsquo;s cases &mdash; the administrator (county <span className="g-code">Statewide</span>) bypasses that check.
      </div>

      <div className="g-card">
        <div className="g-card-hd">
          <h3 className="g-card-title">The roster</h3>
          <span className="g-card-meta">37 accounts &middot; 12 counties + statewide</span>
        </div>
        <div className="g-card-bd">
          <p className="small muted" style={{ marginBottom: 14 }}>
            RLS scope:&nbsp;
            <span className="g-chip">Own case</span> the applicant&rsquo;s single case &middot;&nbsp;
            <span className="g-chip info">Own county</span> every case in that county, nobody else&rsquo;s &middot;&nbsp;
            <span className="g-chip gold">All counties</span> full statewide access.
          </p>

          <div className="g-tblwrap">
            <table className="g-table">
              <thead>
                <tr>
                  <th>County</th>
                  <th>Code</th>
                  <th>Persona</th>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Worker ID</th>
                  <th>RLS scope</th>
                </tr>
              </thead>
              <tbody>
                {COUNTIES.map((c) => (
                  <Fragment key={c.code}>
                    <tr>
                      <td rowSpan={3}><strong>{c.name}</strong></td>
                      <td rowSpan={3}><span className="mono">{c.code}</span></td>
                      <td>Applicant</td>
                      <td>{c.applicant.name}<div className="muted xs">{c.applicant.title}</div></td>
                      <td><span className="g-code">{c.applicant.email}</span></td>
                      <td className="muted">&mdash;</td>
                      <td><span className="g-chip">Own case</span></td>
                    </tr>
                    <tr>
                      <td>Worker</td>
                      <td>{c.worker.name}<div className="muted xs">{c.worker.title}</div></td>
                      <td><span className="g-code">{c.worker.email}</span></td>
                      <td><span className="g-code">{c.worker.wid}</span></td>
                      <td><span className="g-chip info">Own county</span></td>
                    </tr>
                    <tr>
                      <td>Supervisor</td>
                      <td>{c.supervisor.name}<div className="muted xs">{c.supervisor.title}</div></td>
                      <td><span className="g-code">{c.supervisor.email}</span></td>
                      <td><span className="g-code">{c.supervisor.wid}</span></td>
                      <td><span className="g-chip info">Own county</span></td>
                    </tr>
                  </Fragment>
                ))}
                <tr>
                  <td><strong>Statewide</strong></td>
                  <td className="muted">&mdash;</td>
                  <td>Administrator</td>
                  <td>{ADMIN.name}<div className="muted xs">{ADMIN.title}</div></td>
                  <td><span className="g-code">{ADMIN.email}</span></td>
                  <td className="muted">&mdash;</td>
                  <td><span className="g-chip gold">All counties</span></td>
                </tr>
              </tbody>
            </table>
          </div>

          <p className="small muted" style={{ marginTop: 14 }}>
            Worker IDs follow the CalSAWS convention: a two-digit county code (19 = Los Angeles, 37 = San Diego, &hellip;)
            plus a section/position suffix. Workers end in <span className="g-code">LS01100A</span>, supervisors in{' '}
            <span className="g-code">LS01000S</span>; Los Angeles keeps its original <span className="g-code">19LS01220A</span>{' '}
            (Dana) and <span className="g-code">19LS01200S</span> (Angela). Applicants and the administrator have no worker ID.
          </p>
        </div>
      </div>
    </div>
  );
}
