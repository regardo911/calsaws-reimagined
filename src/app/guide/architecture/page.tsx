// Public guide — ARCHITECTURE tab. Static server component: no DB, no auth,
// no getStaffContext. All content is static text / tables / inline SVG.
// Diagram + matrix carry the weight; prose is kept tight (~620 words).

type Chip = { x: number; y: number; label: string; title?: string };

// Research team — 7 specialist agents (single-word role tokens; counts live in
// the meter table on the Reference tab, not on the chips).
const researchChips: Chip[] = [
  { x: 78, y: 256, label: '📚 Archivist' },
  { x: 172, y: 256, label: '🔍 Field agent' },
  { x: 266, y: 256, label: '📋 Policy I', title: 'Policy analyst I' },
  { x: 360, y: 256, label: '📋 Policy II', title: 'Policy analyst II' },
  { x: 126, y: 292, label: '🔀 Workflow' },
  { x: 220, y: 292, label: '🕰 Historian' },
  { x: 314, y: 292, label: '⚖ Compliance' },
];

// Engineering team — 5 workstreams (the Orchestrator's "hats").
const engChips: Chip[] = [
  { x: 538, y: 256, label: '⚙ Rules engine' },
  { x: 646, y: 256, label: '🗄 Database' },
  { x: 754, y: 256, label: '🧩 Full-stack' },
  { x: 592, y: 292, label: '🧪 QA / tests' },
  { x: 700, y: 292, label: '🏗 Platform' },
];

export default function Page() {
  return (
    <div className="g-stack">
      <div>
        <p className="g-eyebrow">Architecture</p>
        <p className="g-lede">
          CalSAWS Reimagined runs one determination path end to end: a request enters the{' '}
          <strong>Next.js App Router</strong>, a server action calls the ported eligibility engine, and every
          read and write lands in <strong>Postgres</strong> — where row-level security, not application code,
          decides who sees what.
        </p>
      </div>

      {/* ---------- System topology ---------- */}
      <section className="g-card">
        <div className="g-card-hd">
          <h2 className="g-card-title">System topology</h2>
          <span className="g-card-meta">request → determination → Postgres</span>
        </div>
        <div className="g-card-bd">
          <div className="g-prose">
            <p>
              The stack is deliberately thin. Pages and forms are React server components under the{' '}
              <strong>Next.js 16 App Router</strong>. User actions — run EDBC, accept a run, authorize a case,
              submit an application — are <strong>server actions</strong>, so the browser never talks to the
              database directly. Each action calls the <strong>ported EDBC engine</strong> (a faithful
              TypeScript port of the CalFresh, CalWORKs, Medi-Cal, General Relief, CAPI, and RCA rules) and then
              reads or writes Postgres over the signed-in user&apos;s session.
            </p>
            <p>
              Two things make that safe. First, <strong>identity</strong>: a user&apos;s role is trusted only
              from the server-set JWT <span className="g-code">app_metadata</span>{' '}
              (<span className="g-code">calsaws_role</span>, <span className="g-code">calsaws_county</span>) —
              never from anything the browser can edit — and is mirrored into a{' '}
              <span className="g-code">profiles</span> row the database reads. Second, money-moving steps never
              run as loose statements: accepting a determination or authorizing a case is one atomic{' '}
              <span className="g-code">SECURITY DEFINER</span> function that writes notices, issues benefits,
              updates status, closes tasks, and journals in a single transaction. Program rules live as data in{' '}
              <span className="g-code">rule_params</span>, so a policy change is a row update, not a deployment.
            </p>
          </div>

          <dl className="g-kv" style={{ marginTop: 16 }}>
            <dt>Presentation</dt>
            <dd>Next.js 16 App Router · React server components · one shared URL</dd>
            <dt>Actions</dt>
            <dd>Server actions — run EDBC, accept, authorize, resolve, submit</dd>
            <dt>Engine</dt>
            <dd>Ported EDBC rules · 6 programs · math shown line by line</dd>
            <dt>Data</dt>
            <dd>Postgres · row-level security enabled on every table</dd>
            <dt>Atomicity</dt>
            <dd><span className="g-code">SECURITY DEFINER</span> functions for accept / authorize / resolve / submit</dd>
            <dt>Identity</dt>
            <dd>Role + county from server-set JWT <span className="g-code">app_metadata</span> → <span className="g-code">profiles</span></dd>
            <dt>Rules</dt>
            <dd><span className="g-code">rule_params</span> — data, not code · change without a release</dd>
          </dl>
        </div>
      </section>

      {/* ---------- How it was built — delivery team org chart ---------- */}
      <section className="g-card">
        <div className="g-card-hd">
          <h2 className="g-card-title">How it was built — the delivery team</h2>
          <span className="g-card-meta">8 agents · 13 roles</span>
        </div>
        <div className="g-card-bd">
          <div className="g-prose">
            <p>
              The platform was not produced by one model in one pass. A single{' '}
              <strong>Orchestrator</strong> (Claude Opus, 1M-token context) held the whole system in one context
              and ran two <strong>peer</strong> teams. A <strong>Research team</strong> of 7 specialist agents
              read the actual CalSAWS rules and source documents; an <strong>Engineering team</strong> built the
              platform across five workstreams. Neither reports to the other — and when a source contradicted the
              build, the source won. An <strong>automated test harness</strong> re-checked every determination to
              the dollar on each change.
            </p>
          </div>

          <div className="g-diag">
            <svg
              viewBox="0 0 960 500"
              role="img"
              aria-label="Agentic delivery team — Orchestrator over peer Research and Engineering teams, with a cross-cutting automated test harness beneath both."
            >
              <defs>
                <marker id="arr2" markerUnits="userSpaceOnUse" markerWidth="10" markerHeight="10" refX="7.5" refY="3.5" orient="auto">
                  <path d="M0,0 L8,3.5 L0,7 Z" fill="var(--ink-3)" />
                </marker>
                <marker id="arr2b" markerUnits="userSpaceOnUse" markerWidth="10" markerHeight="10" refX="0.5" refY="3.5" orient="auto">
                  <path d="M8,0 L0,3.5 L8,7 Z" fill="var(--ink-3)" />
                </marker>
              </defs>

              {/* Orchestrator */}
              <rect x="320" y="20" width="320" height="76" rx="10" fill="var(--surface)" stroke="var(--primary)" strokeWidth="2" />
              <text x="480" y="48" textAnchor="middle" fontSize="15" fontWeight="600" fill="var(--ink)">Orchestrator · Delivery Lead</text>
              <text x="480" y="66" textAnchor="middle" fontSize="11" fill="var(--ink-2)">Claude Opus · 1M-token context</text>
              <text x="480" y="82" textAnchor="middle" fontSize="10" fill="var(--ink-3)">architecture · integration · code review · release</text>

              {/* Fan-out rail — siblings, not a chain */}
              <line x1="480" y1="96" x2="480" y2="120" stroke="var(--line-strong)" strokeWidth="1.5" />
              <line x1="250" y1="120" x2="710" y2="120" stroke="var(--line-strong)" strokeWidth="1.5" />
              <line x1="250" y1="120" x2="250" y2="150" stroke="var(--line-strong)" strokeWidth="1.5" markerEnd="url(#arr2)" />
              <line x1="710" y1="120" x2="710" y2="150" stroke="var(--line-strong)" strokeWidth="1.5" markerEnd="url(#arr2)" />

              {/* Research team header */}
              <rect x="70" y="150" width="360" height="60" rx="10" fill="var(--surface)" stroke="var(--line)" strokeWidth="1.5" />
              <text x="250" y="176" textAnchor="middle" fontSize="14" fontWeight="600" fill="var(--ink)">Research team</text>
              <text x="250" y="196" textAnchor="middle" fontSize="10.5" fill="var(--ink-3)">7 specialist agents · parallel · each independent</text>

              {/* Engineering team header */}
              <rect x="530" y="150" width="360" height="60" rx="10" fill="var(--surface)" stroke="var(--line)" strokeWidth="1.5" />
              <text x="710" y="176" textAnchor="middle" fontSize="14" fontWeight="600" fill="var(--ink)">Engineering team</text>
              <text x="710" y="196" textAnchor="middle" fontSize="10.5" fill="var(--ink-3)">5 workstreams · Orchestrator in one context</text>

              {/* Peer link — double-headed, NOT a reporting line */}
              <line x1="430" y1="182" x2="530" y2="182" stroke="var(--ink-3)" strokeWidth="1.3" strokeDasharray="4 3" markerStart="url(#arr2b)" markerEnd="url(#arr2)" />
              <text x="480" y="176" textAnchor="middle" fontSize="9.5" fontStyle="italic" fill="var(--ink-3)">verify ⇄ build</text>
              <text x="480" y="202" textAnchor="middle" fontSize="9" fill="var(--ink-3)">sources win</text>

              {/* Research zone */}
              <rect x="64" y="224" width="372" height="150" rx="10" fill="var(--sunken)" fillOpacity="0.5" stroke="var(--line)" strokeWidth="1" strokeDasharray="5 4" />
              <text x="78" y="244" textAnchor="start" fontSize="10" fontWeight="600" fill="var(--ink-3)">· 7 research agents ·</text>
              {researchChips.map((c) => (
                <g key={c.label}>
                  {c.title ? <title>{c.title}</title> : null}
                  <rect x={c.x} y={c.y} width={86} height={30} rx={6} fill="var(--surface)" stroke="var(--line)" strokeWidth={1} />
                  <text x={c.x + 43} y={c.y + 20} textAnchor="middle" fontSize="9.5" fill="var(--ink-2)">{c.label}</text>
                </g>
              ))}

              {/* Engineering zone */}
              <rect x="524" y="224" width="372" height="150" rx="10" fill="var(--sunken)" fillOpacity="0.5" stroke="var(--line)" strokeWidth="1" strokeDasharray="5 4" />
              <text x="538" y="244" textAnchor="start" fontSize="10" fontWeight="600" fill="var(--ink-3)">5 engineering workstreams (Orchestrator&apos;s hats)</text>
              {engChips.map((c) => (
                <g key={c.label}>
                  <rect x={c.x} y={c.y} width={100} height={30} rx={6} fill="var(--surface)" stroke="var(--line)" strokeWidth={1} />
                  <text x={c.x + 50} y={c.y + 20} textAnchor="middle" fontSize="9.5" fill="var(--ink-2)">{c.label}</text>
                </g>
              ))}

              {/* QA loop connectors — dashed double-headed, one to each team */}
              <line x1="250" y1="374" x2="250" y2="418" stroke="var(--ok)" strokeWidth="1.4" strokeDasharray="5 4" markerStart="url(#arr2b)" markerEnd="url(#arr2)" />
              <line x1="710" y1="374" x2="710" y2="418" stroke="var(--ok)" strokeWidth="1.4" strokeDasharray="5 4" markerStart="url(#arr2b)" markerEnd="url(#arr2)" />
              <text x="262" y="399" textAnchor="start" fontSize="9" fill="var(--ink-3)">re-proves</text>
              <text x="722" y="399" textAnchor="start" fontSize="9" fill="var(--ink-3)">re-proves</text>

              {/* Automated test harness — cross-cutting band beneath both teams */}
              <rect x="64" y="418" width="832" height="64" rx="10" fill="var(--ok-tint)" stroke="var(--ok)" strokeWidth="2" />
              <text x="480" y="444" textAnchor="middle" fontSize="13" fontWeight="600" fill="var(--ink)">🔁 Automated test harness — cross-checks every change</text>
              <text x="480" y="464" textAnchor="middle" fontSize="10.5" fill="var(--ink-3)">25 unit assertions + 8 end-to-end scenarios · green on every build</text>
            </svg>
          </div>
          <p className="g-figcap g-diag-cap">
            Orchestrator on top; Research and Engineering as peers under a shared fan-out; the automated test
            harness spans both and loops back to each. A control loop, not a reporting chain.
          </p>
        </div>
      </section>

      {/* ---------- Row-level security — county-scoped ---------- */}
      <section className="g-card">
        <div className="g-card-hd">
          <h2 className="g-card-title">Row-level security — county-scoped</h2>
          <span className="g-card-meta">enforced in Postgres</span>
        </div>
        <div className="g-card-bd">
          <div className="g-prose">
            <p>
              Access is decided in the database, not the UI. Applicants see only their own case graph.{' '}
              <strong>Workers and supervisors see only their own county.</strong> The Administrator (Statewide)
              sees every county. Sign in as the Los Angeles worker and you get Los Angeles cases; the San Diego
              worker gets San Diego only — even though both hit the same tables with the same queries. The same
              scope flows into <span className="g-code">/reports</span>: county filters and CSV exports narrow to
              the staff member&apos;s county automatically, while the admin&apos;s exports stay statewide.
            </p>
          </div>

          <div className="g-tblwrap" style={{ marginTop: 16 }}>
            <table className="g-table">
              <thead>
                <tr>
                  <th>Subject</th>
                  <th>Applicant</th>
                  <th>Worker</th>
                  <th>Supervisor</th>
                  <th>Admin</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>Own case graph<br /><span className="muted xs">persons · income · notices · issuances</span></td>
                  <td><span className="g-chip ok">own case</span></td>
                  <td className="muted">—</td>
                  <td className="muted">—</td>
                  <td className="muted">—</td>
                </tr>
                <tr>
                  <td>All other people&apos;s cases</td>
                  <td><span className="g-chip crit">no access</span></td>
                  <td><span className="g-chip ok">own county</span></td>
                  <td><span className="g-chip ok">own county</span></td>
                  <td><span className="g-chip info">all counties</span></td>
                </tr>
                <tr>
                  <td>Tasks &amp; worker queue</td>
                  <td><span className="g-chip crit">no access</span></td>
                  <td><span className="g-chip ok">own county</span></td>
                  <td><span className="g-chip ok">own county</span></td>
                  <td><span className="g-chip info">all counties</span></td>
                </tr>
                <tr>
                  <td>Authorize CalWORKs grant</td>
                  <td className="muted">—</td>
                  <td><span className="g-chip crit">no</span></td>
                  <td><span className="g-chip ok">own county</span></td>
                  <td><span className="g-chip info">all counties</span></td>
                </tr>
                <tr>
                  <td>Rules config <span className="g-code">rule_params</span></td>
                  <td className="muted">—</td>
                  <td><span className="g-chip">read</span></td>
                  <td><span className="g-chip">read</span></td>
                  <td><span className="g-chip gold">read + write</span></td>
                </tr>
              </tbody>
            </table>
          </div>

          <div className="g-callout info" style={{ marginTop: 16 }}>
            <span className="g-callout-title">How the scope is enforced</span>
            Every child table gates reads through <span className="g-code">can_see_case()</span>, which returns
            true when <span className="g-code">is_admin()</span>, when the applicant owns the case, or when a
            staff member&apos;s <span className="g-code">my_county()</span> equals the case&apos;s{' '}
            <span className="g-code">county</span>. The admin&apos;s county is <span className="g-code">Statewide</span> —
            it matches no case, so the admin passes by the role check and bypasses the county predicate entirely.
            SECURITY DEFINER workflow functions run RLS-bypassed, so each re-asserts the same rule internally via{' '}
            <span className="g-code">assert_case_county()</span> before it writes.
          </div>
        </div>
      </section>
    </div>
  );
}
