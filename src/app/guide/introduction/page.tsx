// Public guide — INTRODUCTION tab. Static server component (no 'use client',
// no DB). The AI team: a Fable 5 Orchestrator directing Opus 4.8 executor agents.
// Two phases: the BUILD (orchestrator + research), then a separate HARDENING
// workflow (72-agent audit + 21 fix/doc/QA). Every number is an exact count and
// the org chart's boxes sum to it: 1 + 7 + 72 + 21 = 101.

const GH = 'https://github.com/regardo911/calsaws-reimagined';

// Agent swarms rendered as concrete grids (each square = one agent).
const grid = (n: number, cols: number, x0: number, y0: number) =>
  Array.from({ length: n }, (_, i) => ({
    key: i,
    x: x0 + (i % cols) * 18,
    y: y0 + Math.floor(i / cols) * 16,
  }));
const auditSquares = grid(72, 12, 150, 374);
const fixSquares = grid(21, 7, 645, 378);
const researchChips = [
  { x: 278, y: 170, label: '📚 Archivist' },
  { x: 383, y: 170, label: '🔍 Field' },
  { x: 488, y: 170, label: '📋 Policy I' },
  { x: 593, y: 170, label: '📋 Policy II' },
  { x: 330, y: 200, label: '🔀 Workflow' },
  { x: 435, y: 200, label: '🕰 Historian' },
  { x: 540, y: 200, label: '⚖ Compliance' },
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
          <span className="g-card-meta">a build, then a separate hardening workflow</span>
        </div>
        <div className="g-card-bd">
          <p className="g-prose">
            Think of it as a software team, except the team is AI. A single{' '}
            <strong>Fable&nbsp;5</strong> orchestrator — the lead, running in <strong>Claude Code</strong> —
            planned the system and <strong>wrote and integrated the code itself</strong>, directing a{' '}
            <strong>Research team</strong> of <strong>Claude Opus&nbsp;4.8</strong> agents that read the real
            CalSAWS rules from government documents. Once the platform was live, a{' '}
            <strong>separate hardening workflow</strong> — a <strong>72-agent audit</strong> followed by 21
            agents that fixed, documented, and re-verified — was run to prepare it for wide use. Every change,
            in both phases, was re-checked by an automated test suite before it shipped — and when a source
            contradicted the build, the source won.
          </p>

          {/* # boxes — exact counts, no abbreviations */}
          <div className="g-grid g-grid-3">
            <div className="g-stat">
              <div className="g-stat-v">101</div>
              <div className="g-stat-l">AI agents</div>
              <div className="g-stat-d">the build: 1 orchestrator + 7 research · then hardening: a 72-agent audit + 21 fix / doc / QA</div>
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

          {/* The team that was deployed — build, then hardening; boxes sum to 101 */}
          <p className="g-eyebrow" style={{ margin: '22px 0 8px' }}>The team that was deployed — the build, then a separate hardening workflow (101 AI agents)</p>
          <div className="g-diag">
            <svg
              viewBox="0 0 960 580"
              role="img"
              aria-label="Two phases. Phase 1, the build: a Fable 5 orchestrator writes the code and directs a 7-agent Opus 4.8 research team. Phase 2, hardening: a separate later workflow of a 72-agent audit and 21 fix/doc/QA agents. 101 agents total, with an automated test suite re-checking every change in both phases."
            >
              <defs>
                <marker id="i3arr" markerUnits="userSpaceOnUse" markerWidth="10" markerHeight="10" refX="7.5" refY="3.5" orient="auto">
                  <path d="M0,0 L8,3.5 L0,7 Z" fill="var(--ink-3)" />
                </marker>
                <marker id="i3ok" markerUnits="userSpaceOnUse" markerWidth="10" markerHeight="10" refX="7.5" refY="3.5" orient="auto">
                  <path d="M0,0 L8,3.5 L0,7 Z" fill="var(--ok)" />
                </marker>
              </defs>

              {/* ===================== PHASE 1 · THE BUILD ===================== */}
              <rect x="8" y="8" width="944" height="240" rx="12" fill="var(--sunken)" fillOpacity="0.28" stroke="var(--line)" strokeWidth="1" />
              <text x="28" y="33" fontSize="11.5" fontWeight="700" letterSpacing=".04em" fill="var(--ink-3)">PHASE 1 · THE BUILD — one session</text>

              {/* Orchestrator — Fable 5, the lead who also builds */}
              <rect x="300" y="46" width="360" height="66" rx="10" fill="var(--surface)" stroke="var(--primary)" strokeWidth="2" />
              <text x="480" y="72" textAnchor="middle" fontSize="14.5" fontWeight="700" fill="var(--ink)">🧠 Fable 5 Orchestrator · Delivery Lead</text>
              <text x="480" y="90" textAnchor="middle" fontSize="10.5" fill="var(--ink-2)">the premium model · runs in Claude Code</text>
              <text x="480" y="105" textAnchor="middle" fontSize="10" fill="var(--ink-3)">plans · writes &amp; integrates the code</text>

              {/* directs the research team */}
              <line x1="480" y1="112" x2="480" y2="136" stroke="var(--line-strong)" strokeWidth="2" markerEnd="url(#i3arr)" />
              <text x="500" y="129" fontSize="10" fontStyle="italic" fill="var(--ink-3)">directs</text>

              {/* Research team — 7 Opus 4.8 agents */}
              <rect x="230" y="138" width="500" height="98" rx="10" fill="var(--surface)" stroke="var(--line-strong)" strokeWidth="1.2" />
              <text x="480" y="159" textAnchor="middle" fontSize="13" fontWeight="700" fill="var(--ink)">Research team · 7 Opus 4.8 agents · read the real rules</text>
              {researchChips.map((c) => (
                <g key={c.label}>
                  <rect x={c.x} y={c.y} width={90} height={24} rx={6} fill="var(--sunken)" stroke="var(--line-strong)" strokeWidth={1} />
                  <text x={c.x + 45} y={c.y + 16} textAnchor="middle" fontSize="9" fill="var(--ink-2)">{c.label}</text>
                </g>
              ))}

              {/* ===================== connector ===================== */}
              <text x="480" y="263" textAnchor="middle" fontSize="10.5" fontStyle="italic" fill="var(--ink-3)">▼ the platform was live — then hardened for wide use, in a separate run</text>

              {/* ===================== PHASE 2 · HARDENING ===================== */}
              <rect x="8" y="272" width="944" height="212" rx="12" fill="var(--sunken)" fillOpacity="0.28" stroke="var(--line)" strokeWidth="1" />
              <text x="28" y="296" fontSize="11.5" fontWeight="700" letterSpacing=".04em" fill="var(--ink-3)">PHASE 2 · HARDENING — a separate dynamic workflow, run after the build</text>
              <text x="28" y="314" fontSize="10.5" fill="var(--ink-2)">Pattern: parallel fan-out → each agent audits one slice → findings deduped → fix pass → re-tested</text>

              {/* Hardening audit — 72 Opus 4.8 agents (each square = one agent) */}
              <rect x="40" y="322" width="430" height="150" rx="10" fill="var(--surface)" stroke="var(--line-strong)" strokeWidth="1.2" />
              <text x="255" y="345" textAnchor="middle" fontSize="13" fontWeight="700" fill="var(--ink)">Hardening audit · 72 agents</text>
              <text x="255" y="361" textAnchor="middle" fontSize="10" fill="var(--ink-3)">Opus 4.8 · found 51 bugs across the platform</text>
              {auditSquares.map((s) => (
                <rect key={s.key} x={s.x} y={s.y} width={13} height={13} rx={2} fill="var(--primary)" fillOpacity="0.75" />
              ))}

              {/* Fixes · docs · QA — 21 Opus 4.8 agents */}
              <rect x="490" y="322" width="430" height="150" rx="10" fill="var(--surface)" stroke="var(--line-strong)" strokeWidth="1.2" />
              <text x="705" y="345" textAnchor="middle" fontSize="13" fontWeight="700" fill="var(--ink)">Fixes · docs · QA · 21 agents</text>
              <text x="705" y="361" textAnchor="middle" fontSize="10" fill="var(--ink-3)">Opus 4.8 · fixed, verified &amp; documented</text>
              {fixSquares.map((s) => (
                <rect key={s.key} x={s.x} y={s.y} width={13} height={13} rx={2} fill="var(--primary)" fillOpacity="0.75" />
              ))}

              {/* both hardening teams flow down into the test gate */}
              <line x1="255" y1="474" x2="255" y2="498" stroke="var(--ok)" strokeWidth="1.6" strokeDasharray="5 4" markerEnd="url(#i3ok)" />
              <line x1="705" y1="474" x2="705" y2="498" stroke="var(--ok)" strokeWidth="1.6" strokeDasharray="5 4" markerEnd="url(#i3ok)" />

              {/* ===================== the test gate (both phases) ===================== */}
              <rect x="8" y="500" width="944" height="72" rx="10" fill="var(--ok-tint)" stroke="var(--ok)" strokeWidth="2" />
              <text x="480" y="526" textAnchor="middle" fontSize="13" fontWeight="700" fill="var(--ink)">✅ Automated testing — 38 tests re-run after every change, in both phases</text>
              <text x="480" y="547" textAnchor="middle" fontSize="10.5" fill="var(--ink-2)">✔ CalFresh $686 &#160;·&#160; ✔ CalWORKs $675 &#160;·&#160; ✔ applicants can&apos;t see each other&apos;s cases</text>
              <text x="480" y="565" textAnchor="middle" fontSize="10.5" fontWeight="600" fill="var(--crit)">✖ a wrong benefit amount is caught before it can ship</text>
            </svg>
          </div>
          <p className="g-figcap g-diag-cap">
            <strong>The build:</strong> one Fable&nbsp;5 lead + a 7-agent research team. <strong>Hardening</strong>{' '}
            (a separate workflow, run after): a 72-agent audit + 21 fix / doc / QA. <strong>1 + 7 + 72 + 21 = 101 agents</strong> —
            every change re-checked by the test suite, to the dollar, before it ships.
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
