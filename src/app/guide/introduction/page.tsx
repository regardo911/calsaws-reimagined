// Public guide — INTRODUCTION tab. Static server component (no 'use client', no DB).
// Two phases, each with its own diagram:
//   Phase 1 · THE BUILD  — Fable 5 orchestrator (architect + 5 engineering hats)
//                          fed by a 7-agent Opus research fleet.
//   Phase 2 · HARDENING  — a separate workflow, drawn as its PATTERN:
//                          fan-out (72) → dedupe → verify → fix (21) → test gate → loop.
// Every number is an exact, current count. Agents: 1 + 7 + 72 + 21 = 101.

const GH = 'https://github.com/regardo911/calsaws-reimagined';

// Phase-1 · research fleet — 7 Opus 4.8 specialists (exact tokens/calls from the workflow meter).
const researchFleet = [
  { emoji: '📜', name: 'Archivist', l1: '146-pp Config', l2: 'Guide extracted', m: '96,433 tok · 16', c: 'var(--gold)' },
  { emoji: '🕵️', name: 'Field', l1: 'live BenefitsCal', l2: 'walkthrough', m: '186,049 tok · 94', c: 'var(--ok)' },
  { emoji: '⚖️', name: 'Policy I', l1: 'CalFresh·CalWORKs', l2: 'FFY2026 verified', m: '104,014 tok · 32', c: 'var(--warn)' },
  { emoji: '⚖️', name: 'Policy II', l1: 'Medi-Cal · GR', l2: 'CAPI · RCA', m: '76,740 tok · 33', c: 'var(--warn)' },
  { emoji: '🗂️', name: 'Workflow', l1: 'EDBC path, screens', l2: 'verbatim UI text', m: '220,429 tok · 34', c: 'var(--primary)' },
  { emoji: '🏛️', name: 'Historian', l1: 'legacy costs,', l2: 'IEVS / MEDS', m: '79,660 tok · 34', c: 'var(--primary)' },
  { emoji: '📊', name: 'Compliance', l1: 'CF 296 · CA 237', l2: 'QC / APT standards', m: '88,181 tok · 34', c: 'var(--gold)' },
];

// Phase-1 · build crew — ONE Fable 5 model, five engineering hats (current, measured LOC).
const buildCrew = [
  { emoji: '🧮', name: 'Rules Engineer', fns: ['EDBC engine · 6 programs', 'traced determinations', 'FFY2026 param registry'], loc: '474 LOC · TypeScript', c: 'var(--primary)' },
  { emoji: '🗄️', name: 'Database Engineer', fns: ['15-table schema · county RLS', 'atomic workflow functions', 'seed pipeline'], loc: '1,652 LOC · SQL + TS', c: 'var(--ok)' },
  { emoji: '🖥️', name: 'Full-stack Engineer', fns: ['portal · worker · supervisor', 'admin · reports · Copilot', 'server actions · role proxy'], loc: '2,541 LOC · TSX/TS', c: 'var(--gold)' },
  { emoji: '🧪', name: 'QA Engineer', fns: ['golden-dollar unit tests', 'e2e + county isolation', 'red/green migration verify'], loc: '814 LOC · Vitest/Playwright', c: 'var(--warn)' },
  { emoji: '🚀', name: 'Platform Engineer', fns: ['Supabase + migrations runner', 'secrets · private repo · deploy', 'health endpoint'], loc: '133 LOC + infra', c: 'var(--primary)' },
];

// Phase-2 · the hardening pattern — five stages, looped.
const stages = [
  { n: '①', t: 'Fan-out', lines: ['72 auditor agents', 'parallel · each blind', 'one slice each'], c: 'var(--primary)', fill: 'var(--surface)' },
  { n: '②', t: 'Collect + dedupe', lines: ['51 raw findings', '→ deduplicated'], c: 'var(--line-strong)', fill: 'var(--surface)' },
  { n: '③', t: 'Adversarial verify', lines: ['is it a real bug?', 'skeptic pass'], c: 'var(--warn)', fill: 'var(--surface)' },
  { n: '④', t: 'Fix pass', lines: ['21 fix / doc / QA', '48 fixed · 3 deferred'], c: 'var(--ok)', fill: 'var(--surface)' },
  { n: '⑤', t: 'Test gate', lines: ['38 tests re-run', 'to the dollar'], c: 'var(--ok)', fill: 'var(--ok-tint)' },
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

      <section className="g-card">
        <div className="g-card-hd">
          <h2 className="g-card-title">How it was built — an AI team</h2>
          <span className="g-card-meta">one lead + a research fleet, then a hardening workflow</span>
        </div>
        <div className="g-card-bd">
          <p className="g-prose">
            Think of it as a full software team, except the team is AI. A single{' '}
            <strong>Fable&nbsp;5</strong> orchestrator — the <strong>architect and engineering lead</strong>,
            running in <strong>Claude Code</strong> — decomposed the system and <strong>built it across five
            engineering hats</strong> (rules, database, full-stack, QA, platform), every line typed and reviewed
            in one context. Feeding it was a <strong>research fleet of seven Claude Opus&nbsp;4.8 specialists</strong>{' '}
            that read the real CalSAWS rules from government documents — in parallel, each blind to the others.
            Once the platform was live, a <strong>separate hardening workflow</strong> fanned dozens of agents out
            to audit every slice, verify each finding, fix, and re-test in a loop. When a source contradicted the
            build, the source won.
          </p>

          {/* exact counts */}
          <div className="g-grid g-grid-3">
            <div className="g-stat">
              <div className="g-stat-v">101</div>
              <div className="g-stat-l">AI agents</div>
              <div className="g-stat-d">the build: 1 Fable 5 lead (5 hats) + 7 research · then hardening: a 72-agent audit + 21 fix / doc / QA</div>
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
              <div className="g-stat-v">7,554</div>
              <div className="g-stat-l">lines of code</div>
              <div className="g-stat-d">5,614 platform (474 engine · 1,652 DB · 2,541 app · 814 tests · 133 infra) + 1,940 this guide</div>
            </div>
            <div className="g-stat">
              <div className="g-stat-v">38</div>
              <div className="g-stat-l">automated tests</div>
              <div className="g-stat-d">re-prove every benefit to the dollar — e.g. Maria&apos;s $686 — on every change</div>
            </div>
          </div>

          {/* ============================ PHASE 1 · THE BUILD ============================ */}
          <p className="g-eyebrow" style={{ margin: '24px 0 8px' }}>Phase 1 · The build — the team that wrote the platform</p>
          <div className="g-diag">
            <svg viewBox="0 0 960 378" role="img"
              aria-label="Phase 1, the build: a Fable 5 orchestrator (architect and engineering lead) directs a research fleet of 7 Opus 4.8 specialists, then builds the platform itself across five engineering hats — rules, database, full-stack, QA, and platform.">
              <defs>
                <marker id="b1arr" markerUnits="userSpaceOnUse" markerWidth="10" markerHeight="10" refX="7.5" refY="3.5" orient="auto">
                  <path d="M0,0 L8,3.5 L0,7 Z" fill="var(--ink-3)" />
                </marker>
              </defs>

              {/* Tier 1 — orchestrator */}
              <rect x="250" y="12" width="460" height="70" rx="10" fill="var(--surface)" stroke="var(--primary)" strokeWidth="2" />
              <text x="480" y="37" textAnchor="middle" fontSize="14.5" fontWeight="700" fill="var(--ink)">🧠 Fable 5 Orchestrator — Architect &amp; Eng Lead</text>
              <text x="480" y="55" textAnchor="middle" fontSize="10.5" fill="var(--ink-2)">the premium model · runs in Claude Code</text>
              <text x="480" y="72" textAnchor="middle" fontSize="10" fill="var(--ink-3)">decomposition · system design · integration · code review · release</text>
              <line x1="480" y1="82" x2="480" y2="100" stroke="var(--line-strong)" strokeWidth="2" markerEnd="url(#b1arr)" />

              {/* Tier 2 — research fleet */}
              <rect x="8" y="100" width="944" height="120" rx="10" fill="var(--sunken)" fillOpacity="0.25" stroke="var(--line)" strokeWidth="1" />
              <text x="20" y="119" fontSize="11" fontWeight="700" letterSpacing=".03em" fill="var(--ink-3)">RESEARCH FLEET — 7 specialist agents · in parallel · each blind to the others · Opus 4.8</text>
              {researchFleet.map((a, i) => {
                const x = 15 + i * 134;
                return (
                  <g key={a.name}>
                    <rect x={x} y="126" width="126" height="88" rx="8" fill="var(--surface)" stroke={a.c} strokeWidth="1.4" />
                    <text x={x + 9} y="145" fontSize="10.5" fontWeight="700" fill="var(--ink)">{a.emoji} {a.name}</text>
                    <text x={x + 9} y="163" fontSize="8.5" fill="var(--ink-2)">{a.l1}</text>
                    <text x={x + 9} y="175" fontSize="8.5" fill="var(--ink-2)">{a.l2}</text>
                    <text x={x + 9} y="202" fontSize="9" fontWeight="700" fill={a.c}>{a.m}</text>
                  </g>
                );
              })}
              <line x1="480" y1="220" x2="480" y2="244" stroke="var(--line-strong)" strokeWidth="2" markerEnd="url(#b1arr)" />
              <text x="500" y="237" fontSize="9.5" fontStyle="italic" fill="var(--ink-3)">findings feed the build</text>

              {/* Tier 3 — build crew */}
              <rect x="8" y="246" width="944" height="122" rx="10" fill="var(--sunken)" fillOpacity="0.25" stroke="var(--line)" strokeWidth="1" />
              <text x="20" y="265" fontSize="11" fontWeight="700" letterSpacing=".03em" fill="var(--ink-3)">BUILD CREW — one Fable 5 model, five engineering hats · every line typed &amp; reviewed in one context</text>
              {buildCrew.map((h, i) => {
                const x = 12 + i * 189;
                return (
                  <g key={h.name}>
                    <rect x={x} y="272" width="180" height="90" rx="8" fill="var(--surface)" stroke={h.c} strokeWidth="1.4" />
                    <text x={x + 11} y="292" fontSize="11" fontWeight="700" fill="var(--ink)">{h.emoji} {h.name}</text>
                    {h.fns.map((f, j) => (
                      <text key={j} x={x + 11} y={309 + j * 12} fontSize="9" fill="var(--ink-2)">{f}</text>
                    ))}
                    <text x={x + 11} y="356" fontSize="10.5" fontWeight="700" fill={h.c}>{h.loc}</text>
                  </g>
                );
              })}
            </svg>
          </div>
          <p className="g-figcap g-diag-cap">
            One Fable&nbsp;5 lead — <strong>architect, then five engineering hats</strong> — fed by a{' '}
            <strong>7-agent research fleet</strong> that burned <strong>851,506 tokens</strong> reading the real
            rules. That is <strong>1 + 7 = 8</strong> agents in the build; hardening (below) adds the rest.
          </p>

          {/* ============================ PHASE 2 · HARDENING ============================ */}
          <p className="g-eyebrow" style={{ margin: '26px 0 8px' }}>Phase 2 · Hardening — the workflow pattern (run after the build)</p>
          <div className="g-diag">
            <svg viewBox="0 0 960 252" role="img"
              aria-label="Phase 2, the hardening pattern: 72 auditor agents fan out in parallel, each auditing one slice; 51 findings are collected and deduped; each is adversarially verified; 21 agents fix them (48 fixed, 3 deferred); a 38-test gate re-runs — and the whole loop repeats until no new findings surface.">
              <defs>
                <marker id="b2arr" markerUnits="userSpaceOnUse" markerWidth="9" markerHeight="9" refX="6.5" refY="3" orient="auto">
                  <path d="M0,0 L7,3 L0,6 Z" fill="var(--ink-3)" />
                </marker>
                <marker id="b2loop" markerUnits="userSpaceOnUse" markerWidth="9" markerHeight="9" refX="6.5" refY="3" orient="auto">
                  <path d="M0,0 L7,3 L0,6 Z" fill="var(--primary)" />
                </marker>
              </defs>

              {/* loop-back: gate -> fan-out (over the top) */}
              <path d="M 857 92 L 857 40 L 103 40 L 103 92" fill="none" stroke="var(--primary)" strokeWidth="1.6" strokeDasharray="5 4" markerEnd="url(#b2loop)" />
              <text x="480" y="34" textAnchor="middle" fontSize="10.5" fontWeight="600" fontStyle="italic" fill="var(--primary)">↻ loop until no new findings surface (loop-until-dry)</text>

              {/* five stage boxes + forward arrows */}
              {stages.map((s, i) => {
                const x = 14 + i * 192;
                return (
                  <g key={s.n}>
                    <rect x={x} y="92" width="150" height="94" rx="9" fill={s.fill} stroke={s.c} strokeWidth={s.fill === 'var(--surface)' ? 1.4 : 2} />
                    <text x={x + 75} y="115" textAnchor="middle" fontSize="11.5" fontWeight="700" fill="var(--ink)">{s.n} {s.t}</text>
                    {s.lines.map((l, j) => (
                      <text key={j} x={x + 75} y={134 + j * 14} textAnchor="middle" fontSize="9.5" fill="var(--ink-2)">{l}</text>
                    ))}
                    {i < stages.length - 1 && (
                      <line x1={x + 150} y1="139" x2={x + 192} y2="139" stroke="var(--ink-3)" strokeWidth="1.6" markerEnd="url(#b2arr)" />
                    )}
                  </g>
                );
              })}

              {/* audited slices */}
              <text x="20" y="212" fontSize="10.5" fontWeight="700" fill="var(--ink-3)">Every slice audited in parallel:</text>
              <text x="20" y="228" fontSize="10" fill="var(--ink-2)">RLS policies · SECURITY DEFINER functions · benefit math · cross-county isolation · idempotency / double-issuance</text>
              <text x="20" y="243" fontSize="10" fill="var(--ink-2)">roles &amp; JWT escalation · SLA &amp; tasks · notices / NOAs · data-match / Yellow Banner · EDBC traces</text>
            </svg>
          </div>
          <p className="g-figcap g-diag-cap">
            The pattern — not a headcount. <strong>Fan out → dedupe → verify → fix → test → loop.</strong>{' '}
            <strong>72 auditors</strong> found 51 bugs; <strong>21 agents</strong> fixed 48 (3 deferred, low-impact);
            the 38-test gate re-ran until nothing new surfaced. <strong>72 + 21 = 93</strong> hardening agents —
            with the 8 from the build, <strong>101 in total</strong>.
          </p>
        </div>
      </section>

      <p className="g-prose" style={{ margin: 0 }}>
        Want to watch it run? Walk the full flow — apply, determine, authorize, report — across all four
        roles in the{' '}
        <a href="/guide/demo" style={{ color: 'var(--primary)', fontWeight: 600 }}>Demo Script</a> tab.
      </p>
    </div>
  );
}
