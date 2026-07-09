// Public guide — INTRODUCTION tab. Static server component (no 'use client',
// no DB). Foregrounds the agentic build: an AI Orchestrator (Claude Opus 4.8)
// directing two teams of Fable 5 agents, run in Claude Code. Read like an org chart.

type Chip = { x: number; y: number; label: string; title?: string };

// Research team — 7 AI agents.
const researchChips: Chip[] = [
  { x: 54, y: 218, label: '📚 Archivist' },
  { x: 156, y: 218, label: '🔍 Field agent' },
  { x: 258, y: 218, label: '📋 Policy I', title: 'Policy analyst I' },
  { x: 360, y: 218, label: '📋 Policy II', title: 'Policy analyst II' },
  { x: 105, y: 256, label: '🔀 Workflow' },
  { x: 207, y: 256, label: '🕰 Historian' },
  { x: 309, y: 256, label: '⚖ Compliance' },
];
// Engineering team — 5 AI agents (same "agent" framing as Research).
const engChips: Chip[] = [
  { x: 512, y: 218, label: '⚙ Rules engine' },
  { x: 614, y: 218, label: '🗄 Database' },
  { x: 716, y: 218, label: '🧩 Full-stack' },
  { x: 563, y: 256, label: '🚀 Platform' },
  { x: 665, y: 256, label: '🧪 QA / test' },
];

const GH = 'https://github.com/regardo911/calsaws-reimagined';

export default function Page() {
  return (
    <div className="g-stack">
      <p className="g-lede">
        A working California eligibility platform — <strong>CalFresh, CalWORKs, Medi-Cal,
        General Relief, CAPI, and RCA</strong> — that determines benefits, issues them, and
        reports on them end to end. It was built by an <strong>AI team</strong>, and it runs live.
      </p>

      <div className="g-callout info">
        <span className="g-callout-title">See the source</span>
        The full codebase is on GitHub (public):{' '}
        <a href={GH} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--primary)', fontWeight: 600 }}>
          github.com/regardo911/calsaws-reimagined
        </a>.
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* HOW IT WAS BUILT — the AI team                                     */}
      {/* ------------------------------------------------------------------ */}
      <section className="g-card">
        <div className="g-card-hd">
          <h2 className="g-card-title">How it was built — an AI team</h2>
          <span className="g-card-meta">a lead + two teams of AI agents</span>
        </div>
        <div className="g-card-bd">
          <p className="g-prose">
            Think of it as a software team, except the team is AI. A single{' '}
            <strong>AI Orchestrator</strong> — <strong>Claude Opus 4.8</strong>, running in{' '}
            <strong>Claude Code</strong> — planned the system and directed two teams of{' '}
            <strong>Fable 5</strong> agents: a <strong>Research team</strong> that read the real
            CalSAWS rules and source documents, and an <strong>Engineering team</strong> that wrote
            the code. Every change was re-checked by an automated test suite before it shipped, and
            when a source contradicted the build, the source won. The same setup then ran a large
            audit to harden the platform for wide use.
          </p>

          {/* # boxes — full numbers, no abbreviations */}
          <div className="g-grid g-grid-3">
            <div className="g-stat">
              <div className="g-stat-v">100+</div>
              <div className="g-stat-l">AI agents</div>
              <div className="g-stat-d">built, audited &amp; hardened the platform</div>
            </div>
            <div className="g-stat">
              <div className="g-stat-v" style={{ fontSize: 21 }}>Opus 4.8 + Fable 5</div>
              <div className="g-stat-l">the AI models</div>
              <div className="g-stat-d">orchestrator + agents, run in Claude Code</div>
            </div>
            <div className="g-stat">
              <div className="g-stat-v" style={{ fontSize: 23 }}>6,200,000+</div>
              <div className="g-stat-l">tokens of AI work</div>
              <div className="g-stat-d">building, auditing &amp; documenting the platform</div>
            </div>
          </div>
          <div className="g-grid g-grid-3" style={{ marginTop: 12 }}>
            <div className="g-stat">
              <div className="g-stat-v">146</div>
              <div className="g-stat-l">pages researched</div>
              <div className="g-stat-d">the CalSAWS Configuration Guide (CIT-0355-22), read page by page — plus other primary sources</div>
            </div>
            <div className="g-stat">
              <div className="g-stat-v">6,700</div>
              <div className="g-stat-l">lines of code</div>
              <div className="g-stat-d">the app, the database schema &amp; the tests</div>
            </div>
            <div className="g-stat">
              <div className="g-stat-v">38</div>
              <div className="g-stat-l">automated tests</div>
              <div className="g-stat-d">re-prove every benefit to the dollar — e.g. Maria&apos;s $686 — on every change</div>
            </div>
          </div>

          {/* The team that was deployed — read like an org chart */}
          <p className="g-eyebrow" style={{ margin: '22px 0 8px' }}>The team that was deployed</p>
          <div className="g-diag">
            <svg
              viewBox="0 0 960 520"
              role="img"
              aria-label="AI delivery team org chart: an AI Orchestrator (Claude Opus 4.8) directs a Research team of 7 agents and an Engineering team of 5 agents; an automated test suite re-checks every change before it ships."
            >
              <defs>
                <marker id="i2arr" markerUnits="userSpaceOnUse" markerWidth="10" markerHeight="10" refX="7.5" refY="3.5" orient="auto">
                  <path d="M0,0 L8,3.5 L0,7 Z" fill="var(--ink-3)" />
                </marker>
                <marker id="i2ok" markerUnits="userSpaceOnUse" markerWidth="10" markerHeight="10" refX="7.5" refY="3.5" orient="auto">
                  <path d="M0,0 L8,3.5 L0,7 Z" fill="var(--ok)" />
                </marker>
              </defs>

              {/* Orchestrator (the lead) */}
              <rect x="300" y="20" width="360" height="78" rx="10" fill="var(--surface)" stroke="var(--primary)" strokeWidth="2" />
              <text x="480" y="47" textAnchor="middle" fontSize="15.5" fontWeight="700" fill="var(--ink)">🧠 AI Orchestrator · Delivery Lead</text>
              <text x="480" y="67" textAnchor="middle" fontSize="11.5" fill="var(--ink-2)">Claude Opus 4.8 · runs in Claude Code</text>
              <text x="480" y="85" textAnchor="middle" fontSize="10.5" fill="var(--ink-3)">plans the system · integrates · reviews every line</text>

              {/* Fan-out: the lead DIRECTS two teams (org-chart branches) */}
              <line x1="480" y1="98" x2="480" y2="120" stroke="var(--line-strong)" strokeWidth="2" />
              <line x1="255" y1="120" x2="705" y2="120" stroke="var(--line-strong)" strokeWidth="2" />
              <line x1="255" y1="120" x2="255" y2="150" stroke="var(--line-strong)" strokeWidth="2" markerEnd="url(#i2arr)" />
              <line x1="705" y1="120" x2="705" y2="150" stroke="var(--line-strong)" strokeWidth="2" markerEnd="url(#i2arr)" />
              <text x="230" y="114" textAnchor="middle" fontSize="10.5" fontStyle="italic" fill="var(--ink-3)">directs</text>
              <text x="730" y="114" textAnchor="middle" fontSize="10.5" fontStyle="italic" fill="var(--ink-3)">directs</text>

              {/* Research team */}
              <rect x="40" y="150" width="430" height="214" rx="10" fill="var(--sunken)" fillOpacity="0.45" stroke="var(--line)" strokeWidth="1.5" />
              <text x="255" y="178" textAnchor="middle" fontSize="14.5" fontWeight="700" fill="var(--ink)">Research team</text>
              <text x="255" y="197" textAnchor="middle" fontSize="10.5" fill="var(--ink-3)">7 AI agents · Fable 5 · read the real rules</text>
              {researchChips.map((c) => (
                <g key={c.label}>
                  {c.title ? <title>{c.title}</title> : null}
                  <rect x={c.x} y={c.y} width={96} height={30} rx={6} fill="var(--surface)" stroke="var(--line-strong)" strokeWidth={1} />
                  <text x={c.x + 48} y={c.y + 20} textAnchor="middle" fontSize="9.5" fill="var(--ink-2)">{c.label}</text>
                </g>
              ))}
              <text x="255" y="318" textAnchor="middle" fontSize="10" fill="var(--ink-3)">extracted the 146-page Config Guide · walked BenefitsCal live</text>

              {/* Engineering team */}
              <rect x="490" y="150" width="430" height="214" rx="10" fill="var(--sunken)" fillOpacity="0.45" stroke="var(--line)" strokeWidth="1.5" />
              <text x="705" y="178" textAnchor="middle" fontSize="14.5" fontWeight="700" fill="var(--ink)">Engineering team</text>
              <text x="705" y="197" textAnchor="middle" fontSize="10.5" fill="var(--ink-3)">5 AI agents · Fable 5 · wrote the code</text>
              {engChips.map((c) => (
                <g key={c.label}>
                  <rect x={c.x} y={c.y} width={96} height={30} rx={6} fill="var(--surface)" stroke="var(--line-strong)" strokeWidth={1} />
                  <text x={c.x + 48} y={c.y + 20} textAnchor="middle" fontSize="9.5" fill="var(--ink-2)">{c.label}</text>
                </g>
              ))}
              <text x="705" y="318" textAnchor="middle" fontSize="10" fill="var(--ink-3)">6 programs · Next.js 16 · Postgres + row-level security</text>

              {/* both teams' work flows down into automated testing */}
              <line x1="255" y1="364" x2="255" y2="410" stroke="var(--ok)" strokeWidth="1.6" strokeDasharray="5 4" markerEnd="url(#i2ok)" />
              <line x1="705" y1="364" x2="705" y2="410" stroke="var(--ok)" strokeWidth="1.6" strokeDasharray="5 4" markerEnd="url(#i2ok)" />
              <text x="480" y="392" textAnchor="middle" fontSize="10" fontStyle="italic" fill="var(--ink-3)">every change is checked ↓</text>

              {/* Automated testing — concrete: real tests, real dollar amounts */}
              <rect x="40" y="410" width="880" height="88" rx="10" fill="var(--ok-tint)" stroke="var(--ok)" strokeWidth="2" />
              <text x="480" y="438" textAnchor="middle" fontSize="14" fontWeight="700" fill="var(--ink)">✅ Automated testing — 38 tests re-run after every change</text>
              <text x="480" y="462" textAnchor="middle" fontSize="11.5" fill="var(--ink-2)">✔ CalFresh $686 &#160;·&#160; ✔ CalWORKs $675 &#160;·&#160; ✔ applicants can&apos;t see each other&apos;s cases</text>
              <text x="480" y="482" textAnchor="middle" fontSize="11.5" fontWeight="600" fill="var(--crit)">✖ a wrong benefit amount is caught before it can ship</text>
            </svg>
          </div>
          <p className="g-figcap g-diag-cap">
            Read it like an org chart: one lead directs two teams of AI agents — one researches the real rules,
            one writes the code — and an automated test suite re-checks every change to the dollar before it ships.
          </p>
        </div>
      </section>

      {/* one-line pointer to the Demo tab */}
      <p className="g-prose" style={{ margin: 0 }}>
        Want to watch it run? Walk the full flow — apply, determine, authorize, report — across all four
        roles in the{' '}
        <a href="/guide/demo" style={{ color: 'var(--primary)', fontWeight: 600 }}>Demo Script</a> tab.
      </p>
    </div>
  );
}
