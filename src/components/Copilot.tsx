'use client';
// Eligibility Copilot — floating panel; answers come from the server action
// (deterministic explainer over live DB traces + rule params).
import { useState, useRef, useEffect } from 'react';
import { copilotAction } from '@/app/actions/case-actions';

const SUGGESTIONS = [
  'Explain case C-100001',
  'CalFresh income limits for a family of 3',
  'What is expedited service?',
  'What is a Yellow Banner?',
  'How is a CalWORKs grant computed?',
];

export default function Copilot() {
  const [open, setOpen] = useState(false);
  const [msgs, setMsgs] = useState<{ who: 'user' | 'bot'; text: string }[]>([
    { who: 'bot', text: "Hi — I'm the Eligibility Copilot. Ask me to explain any case's determination, quote an income limit, or walk through policy." },
  ]);
  const [q, setQ] = useState('');
  const [busy, setBusy] = useState(false);
  const scroller = useRef<HTMLDivElement>(null);
  useEffect(() => { scroller.current?.scrollTo(0, scroller.current.scrollHeight); }, [msgs, open]);

  async function send(text: string) {
    if (!text.trim() || busy) return;
    setMsgs(m => [...m, { who: 'user', text }]);
    setQ(''); setBusy(true);
    try {
      const { answer } = await copilotAction(text);
      setMsgs(m => [...m, { who: 'bot', text: answer }]);
    } catch {
      setMsgs(m => [...m, { who: 'bot', text: 'Something went wrong — try again.' }]);
    } finally { setBusy(false); }
  }

  return (
    <>
      <button className="btn gold copilot-fab" onClick={() => setOpen(o => !o)} aria-expanded={open} data-testid="copilot-fab">✨ Copilot</button>
      {open && (
        <div className="copilot" role="dialog" aria-label="Eligibility Copilot">
          <div className="hd" style={{ padding: '13px 16px', borderBottom: '1px solid var(--line)', display: 'flex', gap: 8, alignItems: 'center' }}>
            <strong>✨ Eligibility Copilot</strong><span className="xs muted">explains any determination</span>
            <span style={{ flex: 1 }} /><button className="btn ghost sm" onClick={() => setOpen(false)}>✕</button>
          </div>
          <div className="msgs" ref={scroller} data-testid="copilot-msgs">
            {msgs.map((m, i) => <div key={i} className={`msg ${m.who}`}>{m.text}</div>)}
            {busy && <div className="msg bot">…</div>}
          </div>
          <div className="sugg">
            {SUGGESTIONS.map(s => <button key={s} onClick={() => send(s)}>{s}</button>)}
          </div>
          <div className="row" style={{ padding: '10px 14px', borderTop: '1px solid var(--line)' }}>
            <input className="in" placeholder="Ask about a case, a rule, a limit…" value={q}
              onChange={e => setQ(e.target.value)} onKeyDown={e => e.key === 'Enter' && send(q)} aria-label="Ask the copilot" />
            <button className="btn" onClick={() => send(q)} disabled={busy}>Send</button>
          </div>
        </div>
      )}
    </>
  );
}
