// Public guide — INTRODUCTION tab. Static server component (no 'use client',
// no DB). Foregrounds the agentic build: Claude Opus 4.8 orchestrator + Fable 5
// agents, run in Claude Code. The delivery-team org chart lives here.

type Chip = { x: number; y: number; label: string; title?: string };

const researchChips: Chip[] = [
  { x: 78, y: 256, label: '📚 Archivist' },
  { x: 172, y: 256, label: '🔍 Field agent' },
  { x: 266, y: 256, label: '📋 Policy I', title: 'Policy analyst I' },
  { x: 360, y: 256, label: '📋 Policy II', title: 'Policy analyst II' },
  { x: 126, y: 292, label: '🔀 Workflow' },
  { x: 220, y: 292, label: '🕰 Historian' },
  { x: 314, y: 292, label: '⚖ Compliance' },
];

const engChips: Chip[] = [
  { x: 538, y: 256, label: '⚙ Rules engine' },
  { x: 646, y: 256, label: '🗄 Database' },
  { x: 754, y: 256, label: '🧩 Full-stack' },
  { x: 592, y: 292, label: '🧪 QA / tests' },
  { x: 700, y: 292, label: '🏗 Platform' },
];

const GH = 'https://github.com/regardo911/calsaws-reimagined';

export default function Page() {
  return (
    <div className="g-stack">
      <p className="g-lede">
        A working California eligibility platform — <strong>CalFresh, CalWORKs, Medi-Cal,
        General Relief, CAPI, and RCA</strong> — that determines benefits, issues them, and
        reports on them end to end. It was built by an <strong>autonomous AI delivery team</strong>,
        and it runs live.
      </p>

      <div className="g-callout info">
        <span className="g-callout-title">See the source</span>
        The full codebase is on GitHub (public):{' '}
        <a href={GH} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--primary)', fontWeight: 600 }}>
          github.com/regardo911/calsaws-reimagined
        </a>.
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* HOW IT WAS BUILT — the agentic delivery team                       */}
      {/* ------------------------------------------------------------------ */}
      <section className="g-card">
        <div className="g-card-hd">
          <h2 className="g-card-title">How it was built — an autonomous AI delivery team</h2>
          <span className="g-card-meta">Built in an afternoon</span>
        </div>
        <div className="g-card-bd">
          <p className="g-prose">
            Not one model in one pass. A single <strong>Claude Opus 4.8</strong> orchestrator —
            running in <strong>Claude Code</strong>, holding the whole system in a 1M-token
            context — briefed and ran two peer teams of <strong>Fable 5</strong> agents: a{' '}
            <strong>Research team</strong> that read the real CalSAWS rules and source documents,
            and an <strong>Engineering team</strong> that wrote the platform. An automated test
            harness re-checked every determination to the dollar on each change — and when a
            source contradicted the build, the source won. Every rule traces to a document: one
            agent extracted the 146-page CalSAWS Configuration Guide (CIT-0355-22) page by page;
            another walked benefitscal.com live across 94 recorded actions.
          </p>

          {/* # boxes — the numbers, updated */}
          <div className="g-grid g-grid-3">
            <div className="g-stat">
              <div className="g-stat-v">8</div>
              <div className="g-stat-l">AI agents · 13 roles</div>
              <div className="g-stat-d">1 orchestrator + 7 research + 5 engineering workstreams</div>
            </div>
            <div className="g-stat">
              <div className="g-stat-v" style={{ fontSize: 24 }}>Opus 4.8</div>
              <div className="g-stat-l">orchestrator model</div>
              <div className="g-stat-d">+ Fable 5 agents · run in Claude Code</div>
            </div>
            <div className="g-stat">
              <div className="g-stat-v">~1.35M</div>
              <div className="g-stat-l">tokens · one-shot build</div>
              <div className="g-stat-d">851K metered research + est. build/QA</div>
            </div>
          </div>
          <div className="g-grid g-grid-3" style={{ marginTop: 12 }}>
            <div className="g-stat">
              <div className="g-stat-v">38</div>
              <div className="g-stat-l">automated checks green</div>
              <div className="g-stat-d">25 unit + 13 end-to-end · re-run every build</div>
            </div>
            <div className="g-stat">
              <div className="g-stat-v">~5.3K</div>
              <div className="g-stat-l">lines of code</div>
              <div className="g-stat-d">app + 15-table schema + tests</div>
            </div>
            <div className="g-stat">
              <div className="g-stat-v">1 day</div>
              <div className="g-stat-l">afternoon build</div>
              <div className="g-stat-d">live on Vercel; extended since</div>
            </div>
          </div>

          {/* The team that was deployed */}
          <p className="g-eyebrow" style={{ margin: '22px 0 8px' }}>The team that was deployed</p>
          <div className="g-diag">
            <svg
              viewBox="0 0 960 500"
              role="img"
              aria-label="Agentic delivery team — a Claude Opus 4.8 orchestrator over peer Research and Engineering teams of Fable 5 agents, with a cross-cutting automated test harness beneath both."
            >
              <defs>
                <marker id="iarr" markerUnits="userSpaceOnUse" markerWidth="10" markerHeight="10" refX="7.5" refY="3.5" orient="auto">
                  <path d="M0,0 L8,3.5 L0,7 Z" fill="var(--ink-3)" />
                </marker>
                <marker id="iarrb" markerUnits="userSpaceOnUse" markerWidth="10" markerHeight="10" refX="0.5" refY="3.5" orient="auto">
                  <path d="M8,0 L0,3.5 L8,7 Z" fill="var(--ink-3)" />
                </marker>
              </defs>

              {/* Orchestrator */}
              <rect x="320" y="20" width="320" height="76" rx="10" fill="var(--surface)" stroke="var(--primary)" strokeWidth="2" />
              <text x="480" y="46" textAnchor="middle" fontSize="15" fontWeight="600" fill="var(--ink)">Orchestrator · Delivery Lead</text>
              <text x="480" y="64" textAnchor="middle" fontSize="11" fill="var(--ink-2)">Claude Opus 4.8 · 1M-token context · in Claude Code</text>
              <text x="480" y="82" textAnchor="middle" fontSize="10" fill="var(--ink-3)">architecture · integration · code review · release</text>

              {/* Fan-out rail — siblings, not a chain */}
              <line x1="480" y1="96" x2="480" y2="120" stroke="var(--line-strong)" strokeWidth="1.5" />
              <line x1="250" y1="120" x2="710" y2="120" stroke="var(--line-strong)" strokeWidth="1.5" />
              <line x1="250" y1="120" x2="250" y2="150" stroke="var(--line-strong)" strokeWidth="1.5" markerEnd="url(#iarr)" />
              <line x1="710" y1="120" x2="710" y2="150" stroke="var(--line-strong)" strokeWidth="1.5" markerEnd="url(#iarr)" />

              {/* Research team header */}
              <rect x="70" y="150" width="360" height="60" rx="10" fill="var(--surface)" stroke="var(--line)" strokeWidth="1.5" />
              <text x="250" y="176" textAnchor="middle" fontSize="14" fontWeight="600" fill="var(--ink)">Research team</text>
              <text x="250" y="196" textAnchor="middle" fontSize="10.5" fill="var(--ink-3)">7 Fable 5 agents · parallel · each independent</text>

              {/* Engineering team header */}
              <rect x="530" y="150" width="360" height="60" rx="10" fill="var(--surface)" stroke="var(--line)" strokeWidth="1.5" />
              <text x="710" y="176" textAnchor="middle" fontSize="14" fontWeight="600" fill="var(--ink)">Engineering team</text>
              <text x="710" y="196" textAnchor="middle" fontSize="10.5" fill="var(--ink-3)">5 workstreams · one shared context</text>

              {/* Peer link — double-headed, NOT a reporting line */}
              <line x1="430" y1="182" x2="530" y2="182" stroke="var(--ink-3)" strokeWidth="1.3" strokeDasharray="4 3" markerStart="url(#iarrb)" markerEnd="url(#iarr)" />
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
              <line x1="250" y1="374" x2="250" y2="418" stroke="var(--ok)" strokeWidth="1.4" strokeDasharray="5 4" markerStart="url(#iarrb)" markerEnd="url(#iarr)" />
              <line x1="710" y1="374" x2="710" y2="418" stroke="var(--ok)" strokeWidth="1.4" strokeDasharray="5 4" markerStart="url(#iarrb)" markerEnd="url(#iarr)" />
              <text x="262" y="399" textAnchor="start" fontSize="9" fill="var(--ink-3)">re-proves</text>
              <text x="722" y="399" textAnchor="start" fontSize="9" fill="var(--ink-3)">re-proves</text>

              {/* Automated test harness — cross-cutting band beneath both teams */}
              <rect x="64" y="418" width="832" height="64" rx="10" fill="var(--ok-tint)" stroke="var(--ok)" strokeWidth="2" />
              <text x="480" y="444" textAnchor="middle" fontSize="13" fontWeight="600" fill="var(--ink)">🔁 Automated test harness — cross-checks every change</text>
              <text x="480" y="464" textAnchor="middle" fontSize="10.5" fill="var(--ink-3)">25 unit assertions + 13 end-to-end scenarios · green on every build</text>
            </svg>
          </div>
          <p className="g-figcap g-diag-cap">
            Orchestrator on top; Research and Engineering as peers under a shared fan-out; the automated test
            harness spans both and loops back to each. A control loop, not a reporting chain.
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
