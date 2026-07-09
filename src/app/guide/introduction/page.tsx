// Public guide — INTRODUCTION tab. Static server component (no 'use client',
// no DB). The AI team: a Fable 5 Orchestrator directing Opus 4.8 executor agents.
// Every number here is an exact count, and the org chart's boxes sum to it.

const GH = 'https://github.com/regardo911/calsaws-reimagined';

// Agent swarms rendered as concrete grids (each square = one agent).
const grid = (n: number, cols: number, x0: number, y0: number) =>
  Array.from({ length: n }, (_, i) => ({
    key: i,
    x: x0 + (i % cols) * 18,
    y: y0 + Math.floor(i / cols) * 16,
  }));
const auditSquares = grid(72, 12, 364, 226);
const fixSquares = grid(21, 7, 690, 226);
const researchChips = [
  { x: 44, y: 226, label: '📚 Archivist' },
  { x: 170, y: 226, label: '🔍 Field' },
  { x: 44, y: 258, label: '📋 Policy I' },
  { x: 170, y: 258, label: '📋 Policy II' },
  { x: 44, y: 290, label: '🔀 Workflow' },
  { x: 170, y: 290, label: '🕰 Historian' },
  { x: 107, y: 322, label: '⚖ Compliance' },
];

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
          <span className="g-card-meta">a lead + teams of AI agents</span>
        </div>
        <div className="g-card-bd">
          <p className="g-prose">
            Think of it as a software team, except the team is AI. A single{' '}
            <strong>Fable&nbsp;5</strong> orchestrator — the lead, running in <strong>Claude Code</strong> —
            planned the system, wrote and integrated the code, and directed teams of{' '}
            <strong>Claude Opus&nbsp;4.8</strong> executor agents that did the work: a{' '}
            <strong>Research team</strong> that read the real CalSAWS rules from government documents, a{' '}
            <strong>72-agent audit</strong> that hardened the platform for wide use, and more agents that
            fixed, documented, and verified it. Every change was re-checked by an automated test suite before
            it shipped — and when a source contradicted the build, the source won.
          </p>

          {/* # boxes — exact counts, no abbreviations */}
          <div className="g-grid g-grid-3">
            <div className="g-stat">
              <div className="g-stat-v">101</div>
              <div className="g-stat-l">AI agents</div>
              <div className="g-stat-d">1 orchestrator + 7 research (build) + a 72-agent audit + 21 fix / doc / QA (this session)</div>
            </div>
            <div className="g-stat">
              <div className="g-stat-v" style={{ fontSize: 19 }}>Fable 5 + Opus 4.8</div>
              <div className="g-stat-l">the AI models</div>
              <div className="g-stat-d">Fable 5 orchestrator · Opus 4.8 executor agents · run in Claude Code</div>
            </div>
            <div className="g-stat">
              <div className="g-stat-v" style={{ fontSize: 20 }}>5,786,307</div>
              <div className="g-stat-l">tokens of AI work</div>
              <div className="g-stat-d">metered across the agents — building, auditing &amp; documenting</div>
            </div>
          </div>
          <div className="g-grid g-grid-3" style={{ marginTop: 12 }}>
            <div className="g-stat">
              <div className="g-stat-v">63</div>
              <div className="g-stat-l">government documents researched</div>
              <div className="g-stat-d">35 CalSAWS CITs · 7 ACINs · 14 ACLs · federal regs + the live BenefitsCal portal — incl. the 146-page Config Guide read end to end. All cited on Reference.</div>
            </div>
            <div className="g-stat">
              <div className="g-stat-v">7,095</div>
              <div className="g-stat-l">lines of code</div>
              <div className="g-stat-d">5,495 app + 925 SQL schema + 675 tests &amp; scripts</div>
            </div>
            <div className="g-stat">
              <div className="g-stat-v">38</div>
              <div className="g-stat-l">automated tests</div>
              <div className="g-stat-d">re-prove every benefit to the dollar — e.g. Maria&apos;s $686 — on every change</div>
            </div>
          </div>

          {/* The team that was deployed — the boxes sum to 101 */}
          <p className="g-eyebrow" style={{ margin: '22px 0 8px' }}>The team that was deployed — 101 AI agents</p>
          <div className="g-diag">
            <svg
              viewBox="0 0 960 470"
              role="img"
              aria-label="AI delivery team: a Fable 5 orchestrator directs three teams of Opus 4.8 agents — 7 research, a 72-agent audit, and 21 fix/doc/QA agents — 101 agents total, with an automated test suite re-checking every change."
            >
              <defs>
                <marker id="i3arr" markerUnits="userSpaceOnUse" markerWidth="10" markerHeight="10" refX="7.5" refY="3.5" orient="auto">
                  <path d="M0,0 L8,3.5 L0,7 Z" fill="var(--ink-3)" />
                </marker>
                <marker id="i3ok" markerUnits="userSpaceOnUse" markerWidth="10" markerHeight="10" refX="7.5" refY="3.5" orient="auto">
                  <path d="M0,0 L8,3.5 L0,7 Z" fill="var(--ok)" />
                </marker>
              </defs>

              {/* Orchestrator — Fable 5, the lead */}
              <rect x="310" y="18" width="360" height="80" rx="10" fill="var(--surface)" stroke="var(--primary)" strokeWidth="2" />
              <text x="490" y="44" textAnchor="middle" fontSize="15" fontWeight="700" fill="var(--ink)">🧠 Fable 5 Orchestrator · Delivery Lead</text>
              <text x="490" y="63" textAnchor="middle" fontSize="11" fill="var(--ink-2)">the premium model · runs in Claude Code</text>
              <text x="490" y="81" textAnchor="middle" fontSize="10" fill="var(--ink-3)">plans · writes &amp; integrates the code · directs the teams</text>

              {/* Fan-out: the lead DIRECTS three teams */}
              <line x1="490" y1="98" x2="490" y2="122" stroke="var(--line-strong)" strokeWidth="2" />
              <line x1="170" y1="122" x2="810" y2="122" stroke="var(--line-strong)" strokeWidth="2" />
              <line x1="170" y1="122" x2="170" y2="156" stroke="var(--line-strong)" strokeWidth="2" markerEnd="url(#i3arr)" />
              <line x1="490" y1="122" x2="490" y2="156" stroke="var(--line-strong)" strokeWidth="2" markerEnd="url(#i3arr)" />
              <line x1="810" y1="122" x2="810" y2="156" stroke="var(--line-strong)" strokeWidth="2" markerEnd="url(#i3arr)" />
              <text x="330" y="116" textAnchor="middle" fontSize="10" fontStyle="italic" fill="var(--ink-3)">directs — all Opus 4.8 agents</text>

              {/* Research team — 7 Opus 4.8 agents */}
              <rect x="35" y="156" width="270" height="186" rx="10" fill="var(--sunken)" fillOpacity="0.45" stroke="var(--line)" strokeWidth="1.5" />
              <text x="170" y="180" textAnchor="middle" fontSize="13.5" fontWeight="700" fill="var(--ink)">Research team · 7</text>
              <text x="170" y="197" textAnchor="middle" fontSize="10" fill="var(--ink-3)">Opus 4.8 · read the real rules · build</text>
              {researchChips.map((c) => (
                <g key={c.label}>
                  <rect x={c.x} y={c.y} width={90} height={24} rx={6} fill="var(--surface)" stroke="var(--line-strong)" strokeWidth={1} />
                  <text x={c.x + 45} y={c.y + 16} textAnchor="middle" fontSize="9" fill="var(--ink-2)">{c.label}</text>
                </g>
              ))}

              {/* Hardening audit — 72 Opus 4.8 agents (each square = one agent) */}
              <rect x="355" y="156" width="270" height="186" rx="10" fill="var(--sunken)" fillOpacity="0.45" stroke="var(--line)" strokeWidth="1.5" />
              <text x="490" y="180" textAnchor="middle" fontSize="13.5" fontWeight="700" fill="var(--ink)">Hardening audit · 72</text>
              <text x="490" y="197" textAnchor="middle" fontSize="10" fill="var(--ink-3)">Opus 4.8 · found 51 bugs · this session</text>
              {auditSquares.map((s) => (
                <rect key={s.key} x={s.x} y={s.y} width={13} height={13} rx={2} fill="var(--primary)" fillOpacity="0.75" />
              ))}

              {/* Fixes · docs · QA — 21 Opus 4.8 agents */}
              <rect x="655" y="156" width="270" height="186" rx="10" fill="var(--sunken)" fillOpacity="0.45" stroke="var(--line)" strokeWidth="1.5" />
              <text x="790" y="180" textAnchor="middle" fontSize="13.5" fontWeight="700" fill="var(--ink)">Fixes · docs · QA · 21</text>
              <text x="790" y="197" textAnchor="middle" fontSize="10" fill="var(--ink-3)">Opus 4.8 · fixed &amp; verified · this session</text>
              {fixSquares.map((s) => (
                <rect key={s.key} x={s.x} y={s.y} width={13} height={13} rx={2} fill="var(--primary)" fillOpacity="0.75" />
              ))}

              {/* every team's work flows down into automated testing */}
              <line x1="170" y1="342" x2="170" y2="360" stroke="var(--ok)" strokeWidth="1.6" strokeDasharray="5 4" markerEnd="url(#i3ok)" />
              <line x1="490" y1="342" x2="490" y2="360" stroke="var(--ok)" strokeWidth="1.6" strokeDasharray="5 4" markerEnd="url(#i3ok)" />
              <line x1="790" y1="342" x2="790" y2="360" stroke="var(--ok)" strokeWidth="1.6" strokeDasharray="5 4" markerEnd="url(#i3ok)" />

              {/* Automated testing — concrete: real tests, real dollars */}
              <rect x="35" y="362" width="890" height="86" rx="10" fill="var(--ok-tint)" stroke="var(--ok)" strokeWidth="2" />
              <text x="480" y="390" textAnchor="middle" fontSize="13.5" fontWeight="700" fill="var(--ink)">✅ Automated testing — 38 tests re-run after every change</text>
              <text x="480" y="413" textAnchor="middle" fontSize="11" fill="var(--ink-2)">✔ CalFresh $686 &#160;·&#160; ✔ CalWORKs $675 &#160;·&#160; ✔ applicants can&apos;t see each other&apos;s cases</text>
              <text x="480" y="433" textAnchor="middle" fontSize="11" fontWeight="600" fill="var(--crit)">✖ a wrong benefit amount is caught before it can ship</text>
            </svg>
          </div>
          <p className="g-figcap g-diag-cap">
            One Fable 5 lead directs three teams of Opus 4.8 agents — <strong>1 + 7 + 72 + 21 = 101 agents</strong> —
            and an automated test suite re-checks every change to the dollar before it ships.
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
