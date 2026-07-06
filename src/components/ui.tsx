// Shared presentational components (server-safe).
import { PROG, STATUS_META, money } from '@/lib/domain';
import type { Program } from '@/lib/engine';

export function ProgPill({ p }: { p: Program }) {
  const meta = PROG[p];
  if (!meta) return null;
  return (
    <span className="pill">
      <span className="dot" style={{ background: `var(${meta.cssVar})` }} />
      {meta.name}
    </span>
  );
}

export function StatusPill({ s }: { s: string }) {
  const x = STATUS_META[s] ?? { label: s, cls: '' };
  return <span className={`pill ${x.cls}`} data-testid="status-pill">{x.label}</span>;
}

export function SlaChip({ left, overdue, atRisk, terminal }: { left: number; overdue: boolean; atRisk: boolean; terminal: boolean }) {
  if (terminal) return null;
  if (overdue) return <span className="pill crit">⚠ {-left}d overdue</span>;
  if (atRisk) return <span className="pill warn">{left}d left</span>;
  return <span className="pill">{left}d left</span>;
}

export function PriorityPill({ p }: { p: string }) {
  if (p === 'Critical') return <span className="pill crit">⚡ Critical</span>;
  if (p === 'High') return <span className="pill warn">High</span>;
  return <span className="pill">Normal</span>;
}

export function Tile({ v, l, tone }: { v: string | number; l: string; tone?: 'warn' | 'crit' }) {
  return (
    <div className="tile">
      <div className="v num" style={tone ? { color: `var(--${tone})` } : undefined}>{v}</div>
      <div className="l">{l}</div>
    </div>
  );
}

export function Money({ n }: { n: number | null | undefined }) {
  return <span className="num">{money(n)}</span>;
}

/** Full calculation trace ("How we got here"). */
export function Trace({ trace }: { trace: { step: string; label: string; detail: string; value: string | number; pass: boolean | null }[] }) {
  return (
    <div className="trace" data-testid="edbc-trace">
      {trace.map((tr, i) => (
        <div className="trow" key={i}>
          <span className={`tico ${tr.pass === true ? 'pass' : tr.pass === false ? 'fail' : 'info'}`}>
            {tr.pass === true ? '✓' : tr.pass === false ? '✕' : 'i'}
          </span>
          <span>
            <strong className="small">{tr.label}</strong><br />
            <span className="xs muted">{tr.detail}</span>
          </span>
          <span className="tval num small">{String(tr.value)}</span>
        </div>
      ))}
    </div>
  );
}
