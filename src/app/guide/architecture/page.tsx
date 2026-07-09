// Public guide — ARCHITECTURE tab. Static server component: no DB, no auth,
// no getStaffContext. All content is static text / tables / inline SVG.
// The three diagrams + the EDBC engine carry the weight; prose is kept tight.

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
        <p style={{ marginTop: 12, fontSize: 14, color: 'var(--ink-2)' }}>
          Source is public:{' '}
          <a href="https://github.com/regardo911/calsaws-reimagined" style={{ fontWeight: 600 }}>
            github.com/regardo911/calsaws-reimagined
          </a>
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

          <div className="g-diag" style={{ marginTop: 18 }}>
            <svg viewBox="0 0 960 430" role="img" aria-label="System topology: browsers hold only the anon key over HTTPS; Vercel Next.js runs the proxy, server components, server actions with the EDBC engine, and route handlers; Supabase runs Auth, PostgREST with RLS, Postgres with SECURITY DEFINER functions, and rule_params.">
              <defs>
                <marker id="topo-arr" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0 0 L10 5 L0 10 z" fill="var(--ink-3)" /></marker>
                <marker id="topo-arr-gold" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0 0 L10 5 L0 10 z" fill="var(--gold)" /></marker>
                <marker id="topo-arr-ok" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0 0 L10 5 L0 10 z" fill="var(--ok)" /></marker>
              </defs>

              {/* zones */}
              <rect x="10" y="20" width="200" height="390" rx="14" fill="var(--sunken)" stroke="var(--line)" strokeWidth="1" strokeDasharray="5 4" />
              <text x="30" y="48" fontSize="13.5" fontWeight="700" fill="var(--ink)">Browsers</text>
              <text x="30" y="64" fontSize="10.5" fontWeight="500" fill="var(--ink-3)">any device · real sessions</text>
              <rect x="250" y="20" width="330" height="390" rx="14" fill="var(--sunken)" stroke="var(--line)" strokeWidth="1" strokeDasharray="5 4" />
              <text x="270" y="48" fontSize="13.5" fontWeight="700" fill="var(--ink)">Vercel · Next.js 16</text>
              <text x="270" y="64" fontSize="10.5" fontWeight="500" fill="var(--ink-3)">serverless, auto-deploy from main</text>
              <rect x="620" y="20" width="330" height="390" rx="14" fill="var(--sunken)" stroke="var(--line)" strokeWidth="1" strokeDasharray="5 4" />
              <text x="640" y="48" fontSize="13.5" fontWeight="700" fill="var(--ink)">Supabase · us-east-1</text>
              <text x="640" y="64" fontSize="10.5" fontWeight="500" fill="var(--ink-3)">project calsaws (dedicated)</text>

              {/* browser roles */}
              <rect x="28" y="86" width="164" height="46" rx="10" fill="var(--surface)" stroke="var(--line-strong)" strokeWidth="1.4" />
              <text x="44" y="106" fontSize="13.5" fontWeight="700" fill="var(--ink)">🙋 Applicant</text>
              <text x="44" y="122" fontSize="10.5" fontWeight="500" fill="var(--ink-3)">self-signup works</text>
              <rect x="28" y="146" width="164" height="46" rx="10" fill="var(--surface)" stroke="var(--line-strong)" strokeWidth="1.4" />
              <text x="44" y="166" fontSize="13.5" fontWeight="700" fill="var(--ink)">🗂️ Worker</text>
              <text x="44" y="182" fontSize="10.5" fontWeight="500" fill="var(--ink-3)">Dana · 19LS01220A</text>
              <rect x="28" y="206" width="164" height="46" rx="10" fill="var(--surface)" stroke="var(--line-strong)" strokeWidth="1.4" />
              <text x="44" y="226" fontSize="13.5" fontWeight="700" fill="var(--ink)">✅ Supervisor</text>
              <text x="44" y="242" fontSize="10.5" fontWeight="500" fill="var(--ink-3)">authorizes grants</text>
              <rect x="28" y="266" width="164" height="46" rx="10" fill="var(--surface)" stroke="var(--line-strong)" strokeWidth="1.4" />
              <text x="44" y="286" fontSize="13.5" fontWeight="700" fill="var(--ink)">⚙️ Admin</text>
              <text x="44" y="302" fontSize="10.5" fontWeight="500" fill="var(--ink-3)">edits live rules</text>

              {/* vercel internals */}
              <rect x="268" y="86" width="294" height="52" rx="10" fill="var(--surface)" stroke="var(--line-strong)" strokeWidth="1.4" />
              <text x="284" y="108" fontSize="13.5" fontWeight="700" fill="var(--ink)">proxy.ts</text>
              <text x="284" y="124" fontSize="10.5" fontWeight="500" fill="var(--ink-3)">session refresh · role gates (/worker, /admin…)</text>
              <rect x="268" y="152" width="294" height="52" rx="10" fill="var(--surface)" stroke="var(--line-strong)" strokeWidth="1.4" />
              <text x="284" y="174" fontSize="13.5" fontWeight="700" fill="var(--ink)">Server Components</text>
              <text x="284" y="190" fontSize="10.5" fontWeight="500" fill="var(--ink-3)">RLS-scoped reads as the signed-in user</text>
              <rect x="268" y="218" width="294" height="64" rx="10" fill="#17456e" stroke="var(--primary)" strokeWidth="1.5" />
              <text x="284" y="242" fontSize="13.5" fontWeight="700" fill="#fff">Server Actions + EDBC Engine</text>
              <text x="284" y="258" fontSize="10.5" fontWeight="500" fill="rgba(255,255,255,.94)">runEDBC() · pure TS · full traces</text>
              <text x="284" y="272" fontSize="10.5" fontWeight="500" fill="rgba(255,255,255,.94)">client never computes a determination</text>
              <rect x="268" y="296" width="294" height="46" rx="10" fill="var(--surface)" stroke="var(--line-strong)" strokeWidth="1.4" />
              <text x="284" y="316" fontSize="13.5" fontWeight="700" fill="var(--ink)">/api/health · /reports/csv</text>
              <text x="284" y="332" fontSize="10.5" fontWeight="500" fill="var(--ink-3)">route handlers</text>

              {/* supabase internals */}
              <rect x="638" y="86" width="294" height="52" rx="10" fill="var(--surface)" stroke="var(--line-strong)" strokeWidth="1.4" />
              <text x="654" y="108" fontSize="13.5" fontWeight="700" fill="var(--ink)">Auth</text>
              <text x="654" y="124" fontSize="10.5" fontWeight="500" fill="var(--ink-3)">email+password · role in app_metadata (server-set)</text>
              <rect x="638" y="152" width="294" height="52" rx="10" fill="var(--surface)" stroke="var(--line-strong)" strokeWidth="1.4" />
              <text x="654" y="174" fontSize="13.5" fontWeight="700" fill="var(--ink)">PostgREST + RLS</text>
              <text x="654" y="190" fontSize="10.5" fontWeight="500" fill="var(--ink-3)">every anon-key query row-filtered by policy</text>
              <rect x="638" y="218" width="294" height="64" rx="10" fill="#17456e" stroke="var(--primary)" strokeWidth="1.5" />
              <text x="654" y="242" fontSize="13.5" fontWeight="700" fill="#fff">Postgres 17 · 15 tables</text>
              <text x="654" y="258" fontSize="10.5" fontWeight="500" fill="rgba(255,255,255,.94)">SECURITY DEFINER functions: accept_edbc_run,</text>
              <text x="654" y="272" fontSize="10.5" fontWeight="500" fill="rgba(255,255,255,.94)">authorize_case, submit_application (atomic)</text>
              <rect x="638" y="296" width="294" height="46" rx="10" fill="var(--surface)" stroke="var(--line-strong)" strokeWidth="1.4" />
              <text x="654" y="316" fontSize="13.5" fontWeight="700" fill="var(--ink)">rule_params</text>
              <text x="654" y="332" fontSize="10.5" fontWeight="500" fill="var(--ink-3)">live policy — admin edits hit every user, no deploy</text>

              {/* arrows */}
              <path d="M192 155 H 260" fill="none" stroke="var(--ink-3)" strokeWidth="1.8" markerEnd="url(#topo-arr)" />
              <path d="M562 112 H 630" fill="none" stroke="var(--gold)" strokeWidth="1.8" markerEnd="url(#topo-arr-gold)" />
              <path d="M562 178 H 630" fill="none" stroke="var(--ink-3)" strokeWidth="1.8" markerEnd="url(#topo-arr)" />
              <path d="M562 250 H 630" fill="none" stroke="var(--ok)" strokeWidth="1.8" markerEnd="url(#topo-arr-ok)" />
              <text x="574" y="100" fontSize="10" fontWeight="500" fill="var(--ink-3)">anon key</text>
              <text x="572" y="166" fontSize="10.5" fontWeight="500" fill="var(--ink-3)">RLS reads</text>
              <text x="566" y="238" fontSize="10" fontWeight="500" fill="var(--ink-3)">service key</text>
              <text x="196" y="148" fontSize="10.5" fontWeight="500" fill="var(--ink-3)">HTTPS</text>
            </svg>
          </div>
          <p className="g-figcap g-diag-cap">
            <span style={{ display: 'inline-block', width: 14, height: 4, borderRadius: 2, background: 'var(--gold)', verticalAlign: 'middle', marginRight: 5 }} />
            auth (anon key) ·{' '}
            <span style={{ display: 'inline-block', width: 14, height: 4, borderRadius: 2, background: 'var(--ink-3)', verticalAlign: 'middle', marginRight: 5 }} />
            RLS reads (user JWT) ·{' '}
            <span style={{ display: 'inline-block', width: 14, height: 4, borderRadius: 2, background: 'var(--ok)', verticalAlign: 'middle', marginRight: 5 }} />
            engine writes (server-only). The browser holds only the anon key, so every direct query is row-filtered;
            the service-role key exists only inside server actions.
          </p>
        </div>
      </section>

      {/* ---------- The case lifecycle ---------- */}
      <section className="g-card">
        <div className="g-card-hd">
          <h2 className="g-card-title">The case lifecycle</h2>
          <span className="g-card-meta">state machine · what each transition emits</span>
        </div>
        <div className="g-card-bd">
          <div className="g-prose">
            <p>
              A case moves through a small, explicit state machine. Running EDBC persists the engine trace; a
              worker accepts it; CalWORKs grants pause for supervisor authorization, and everything else finalizes
              in one atomic step.
            </p>
          </div>

          <div className="g-diag" style={{ marginTop: 14 }}>
            <svg viewBox="0 0 960 300" role="img" aria-label="Case lifecycle state machine: pending, yellow_banner when EDBC is blocked, EDBC run, accepted, pending_authorization for CalWORKs grants, ending in approved or denied.">
              <defs>
                <marker id="life-arr" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0 0 L10 5 L0 10 z" fill="var(--ink-3)" /></marker>
                <marker id="life-arr-gold" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0 0 L10 5 L0 10 z" fill="var(--gold)" /></marker>
                <marker id="life-arr-ok" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0 0 L10 5 L0 10 z" fill="var(--ok)" /></marker>
                <marker id="life-arr-crit" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0 0 L10 5 L0 10 z" fill="var(--crit)" /></marker>
              </defs>

              {/* states */}
              <rect x="20" y="110" width="130" height="52" rx="26" fill="var(--surface)" stroke="var(--primary)" strokeWidth="1.4" />
              <text x="46" y="141" fontSize="13.5" fontWeight="700" fill="var(--ink)">pending</text>
              <rect x="205" y="20" width="170" height="52" rx="26" fill="var(--surface)" stroke="var(--warn)" strokeWidth="1.4" />
              <text x="228" y="45" fontSize="13.5" fontWeight="700" fill="var(--ink)">yellow_banner</text>
              <text x="228" y="60" fontSize="10.5" fontWeight="500" fill="var(--ink-3)">EDBC blocked</text>
              <rect x="205" y="200" width="170" height="52" rx="10" fill="var(--surface)" stroke="var(--line-strong)" strokeWidth="1.4" />
              <text x="228" y="225" fontSize="13.5" fontWeight="700" fill="var(--ink)">EDBC run</text>
              <text x="228" y="240" fontSize="10.5" fontWeight="500" fill="var(--ink-3)">engine + trace persisted</text>
              <rect x="440" y="200" width="150" height="52" rx="10" fill="var(--surface)" stroke="var(--line-strong)" strokeWidth="1.4" />
              <text x="462" y="225" fontSize="13.5" fontWeight="700" fill="var(--ink)">accepted</text>
              <text x="462" y="240" fontSize="10.5" fontWeight="500" fill="var(--ink-3)">by worker</text>
              <rect x="640" y="110" width="190" height="52" rx="26" fill="var(--surface)" stroke="var(--gold)" strokeWidth="1.4" />
              <text x="660" y="135" fontSize="13.5" fontWeight="700" fill="var(--ink)">pending_authorization</text>
              <text x="660" y="150" fontSize="10.5" fontWeight="500" fill="var(--ink-3)">CalWORKs grants only</text>
              <rect x="660" y="220" width="130" height="48" rx="24" fill="var(--surface)" stroke="var(--ok)" strokeWidth="1.4" />
              <text x="690" y="248" fontSize="13.5" fontWeight="700" fill="var(--ok)">approved</text>
              <rect x="820" y="220" width="120" height="48" rx="24" fill="var(--surface)" stroke="var(--crit)" strokeWidth="1.4" />
              <text x="848" y="248" fontSize="13.5" fontWeight="700" fill="var(--crit)">denied</text>

              {/* arrows */}
              <path d="M100 110 C 130 60, 160 46, 197 46" fill="none" stroke="var(--ink-3)" strokeWidth="1.8" markerEnd="url(#life-arr)" />
              <text x="96" y="70" fontSize="10.5" fontWeight="500" fill="var(--ink-3)">IEVS mismatch ≥ $100/mo</text>
              <path d="M290 80 C 290 130, 290 160, 290 192" fill="none" stroke="var(--ink-3)" strokeWidth="1.8" markerEnd="url(#life-arr)" />
              <text x="298" y="150" fontSize="10.5" fontWeight="500" fill="var(--ink-3)">worker resolves (journaled)</text>
              <path d="M150 152 C 180 190, 190 210, 197 220" fill="none" stroke="var(--ink-3)" strokeWidth="1.8" markerEnd="url(#life-arr)" />
              <text x="118" y="185" fontSize="10.5" fontWeight="500" fill="var(--ink-3)">Run EDBC</text>
              <path d="M375 226 H 432" fill="none" stroke="var(--ink-3)" strokeWidth="1.8" markerEnd="url(#life-arr)" />
              <path d="M590 210 C 620 180, 630 160, 632 150" fill="none" stroke="var(--gold)" strokeWidth="1.8" markerEnd="url(#life-arr-gold)" />
              <text x="560" y="176" fontSize="10.5" fontWeight="500" fill="var(--ink-3)">CW eligible</text>
              <path d="M735 162 V 212" fill="none" stroke="var(--ok)" strokeWidth="1.8" markerEnd="url(#life-arr-ok)" />
              <text x="744" y="190" fontSize="10.5" fontWeight="500" fill="var(--ok)">supervisor authorizes</text>
              <path d="M590 236 C 620 240, 635 242, 652 242" fill="none" stroke="var(--ok)" strokeWidth="1.8" markerEnd="url(#life-arr-ok)" />
              <text x="596" y="262" fontSize="10.5" fontWeight="500" fill="var(--ink-3)">no CW → finalize</text>
              <path d="M590 218 C 700 130, 800 170, 872 212" fill="none" stroke="var(--crit)" strokeWidth="1.8" markerEnd="url(#life-arr-crit)" />
              <text x="826" y="286" fontSize="10.5" fontWeight="500" fill="var(--crit)">all ineligible</text>
            </svg>
          </div>

          <div className="g-callout info" style={{ marginTop: 12 }}>
            <span className="g-callout-title">The atomic step</span>
            <span className="g-code">_finalize_run()</span> is one SQL transaction that writes the{' '}
            <strong>NOAs</strong> (per program, plain-language reasons), the <strong>EBT issuances</strong>{' '}
            (eligible + amount &gt; 0), flips the <strong>case status</strong>, <strong>closes open tasks</strong>,
            and appends the <strong>journal entry</strong>. A half-issued benefit is impossible — either everything
            commits or nothing does.
          </div>
        </div>
      </section>

      {/* ---------- Data model ---------- */}
      <section className="g-card">
        <div className="g-card-hd">
          <h2 className="g-card-title">Data model</h2>
          <span className="g-card-meta">15 tables · cases as the hub</span>
        </div>
        <div className="g-card-bd">
          <div className="g-prose">
            <p>
              Fifteen tables, <strong>cases</strong> as the hub. The left side is the input snapshot the engine
              consumes; the right side is everything a determination emits.
            </p>
          </div>

          <div className="g-diag" style={{ marginTop: 14 }}>
            <svg viewBox="0 0 960 330" role="img" aria-label="Data model: the cases table as hub, fed by persons, income, resource, expense, and data_match records on the left, emitting edbc_runs/results, notices, issuances, tasks, and journal_entries on the right, with profiles, rule_params, and app_meta around it.">
              <defs>
                <marker id="dm-arr" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0 0 L10 5 L0 10 z" fill="var(--ink-3)" /></marker>
                <marker id="dm-arr-gold" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0 0 L10 5 L0 10 z" fill="var(--gold)" /></marker>
                <marker id="dm-arr-ok" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0 0 L10 5 L0 10 z" fill="var(--ok)" /></marker>
              </defs>

              {/* hub */}
              <rect x="390" y="120" width="180" height="86" rx="12" fill="#17456e" stroke="var(--primary)" strokeWidth="1.5" />
              <text x="412" y="148" fontSize="13.5" fontWeight="700" fill="#fff">cases</text>
              <text x="412" y="166" fontSize="10.5" fontWeight="500" fill="rgba(255,255,255,.94)">case_number · status</text>
              <text x="412" y="180" fontSize="10.5" fontWeight="500" fill="rgba(255,255,255,.94)">programs[] · expedited</text>
              <text x="412" y="194" fontSize="10.5" fontWeight="500" fill="rgba(255,255,255,.94)">applicant_profile_id → RLS</text>

              {/* left: snapshot */}
              <rect x="30" y="30" width="180" height="40" rx="9" fill="var(--surface)" stroke="var(--line-strong)" strokeWidth="1.4" />
              <text x="46" y="55" fontSize="13.5" fontWeight="700" fill="var(--ink)">persons</text>
              <rect x="30" y="80" width="180" height="40" rx="9" fill="var(--surface)" stroke="var(--line-strong)" strokeWidth="1.4" />
              <text x="46" y="105" fontSize="13.5" fontWeight="700" fill="var(--ink)">income_records</text>
              <rect x="30" y="130" width="180" height="40" rx="9" fill="var(--surface)" stroke="var(--line-strong)" strokeWidth="1.4" />
              <text x="46" y="155" fontSize="13.5" fontWeight="700" fill="var(--ink)">resource_records</text>
              <rect x="30" y="180" width="180" height="40" rx="9" fill="var(--surface)" stroke="var(--line-strong)" strokeWidth="1.4" />
              <text x="46" y="205" fontSize="13.5" fontWeight="700" fill="var(--ink)">expense_records</text>
              <rect x="30" y="230" width="180" height="40" rx="9" fill="var(--surface)" stroke="var(--warn)" strokeWidth="1.4" />
              <text x="46" y="249" fontSize="13.5" fontWeight="700" fill="var(--ink)">data_matches</text>
              <text x="46" y="263" fontSize="10.5" fontWeight="500" fill="var(--ink-3)">IEVS/MEDS/SSA/SAVE (sim)</text>
              <text x="52" y="300" fontSize="10.5" fontWeight="500" fill="var(--ink-3)">— the “case snapshot” the engine reads —</text>

              {/* right: outcomes */}
              <rect x="740" y="24" width="190" height="46" rx="9" fill="var(--surface)" stroke="var(--primary)" strokeWidth="1.4" />
              <text x="756" y="44" fontSize="13.5" fontWeight="700" fill="var(--ink)">edbc_runs → edbc_results</text>
              <text x="756" y="60" fontSize="10.5" fontWeight="500" fill="var(--ink-3)">reasons·trace·members = jsonb</text>
              <rect x="740" y="82" width="190" height="40" rx="9" fill="var(--surface)" stroke="var(--line-strong)" strokeWidth="1.4" />
              <text x="756" y="107" fontSize="13.5" fontWeight="700" fill="var(--ink)">notices (NOAs)</text>
              <rect x="740" y="132" width="190" height="40" rx="9" fill="var(--surface)" stroke="var(--ok)" strokeWidth="1.4" />
              <text x="756" y="157" fontSize="13.5" fontWeight="700" fill="var(--ink)">issuances (EBT)</text>
              <rect x="740" y="182" width="190" height="40" rx="9" fill="var(--surface)" stroke="var(--line-strong)" strokeWidth="1.4" />
              <text x="756" y="207" fontSize="13.5" fontWeight="700" fill="var(--ink)">tasks (queue · SLA)</text>
              <rect x="740" y="232" width="190" height="40" rx="9" fill="var(--surface)" stroke="var(--line-strong)" strokeWidth="1.4" />
              <text x="756" y="257" fontSize="13.5" fontWeight="700" fill="var(--ink)">journal_entries</text>

              {/* top / bottom */}
              <rect x="400" y="24" width="160" height="44" rx="9" fill="var(--surface)" stroke="var(--line-strong)" strokeWidth="1.4" />
              <text x="416" y="43" fontSize="13.5" fontWeight="700" fill="var(--ink)">profiles</text>
              <text x="416" y="59" fontSize="10.5" fontWeight="500" fill="var(--ink-3)">role · county · worker_id</text>
              <rect x="330" y="252" width="140" height="44" rx="9" fill="var(--surface)" stroke="var(--gold)" strokeWidth="1.4" />
              <text x="346" y="271" fontSize="13.5" fontWeight="700" fill="var(--ink)">rule_params</text>
              <text x="346" y="287" fontSize="10.5" fontWeight="500" fill="var(--ink-3)">live policy values</text>
              <rect x="490" y="252" width="140" height="44" rx="9" fill="var(--surface)" stroke="var(--line-strong)" strokeWidth="1.4" />
              <text x="506" y="271" fontSize="13.5" fontWeight="700" fill="var(--ink)">app_meta</text>
              <text x="506" y="287" fontSize="10.5" fontWeight="500" fill="var(--ink-3)">schema_version</text>

              {/* arrows */}
              <path d="M210 50 C 300 60, 340 100, 384 130" fill="none" stroke="var(--ink-3)" strokeWidth="1.8" markerEnd="url(#dm-arr)" />
              <path d="M210 100 C 300 105, 340 120, 384 140" fill="none" stroke="var(--ink-3)" strokeWidth="1.8" markerEnd="url(#dm-arr)" />
              <path d="M210 150 C 300 152, 330 155, 384 158" fill="none" stroke="var(--ink-3)" strokeWidth="1.8" markerEnd="url(#dm-arr)" />
              <path d="M210 200 C 300 195, 340 180, 384 168" fill="none" stroke="var(--ink-3)" strokeWidth="1.8" markerEnd="url(#dm-arr)" />
              <path d="M210 250 C 300 240, 340 205, 384 182" fill="none" stroke="var(--ink-3)" strokeWidth="1.8" markerEnd="url(#dm-arr)" />
              <path d="M570 140 C 640 100, 680 60, 732 48" fill="none" stroke="var(--ink-3)" strokeWidth="1.8" markerEnd="url(#dm-arr)" />
              <path d="M570 152 C 640 130, 680 110, 732 102" fill="none" stroke="var(--ink-3)" strokeWidth="1.8" markerEnd="url(#dm-arr)" />
              <path d="M570 164 C 640 158, 680 152, 732 152" fill="none" stroke="var(--ok)" strokeWidth="1.8" markerEnd="url(#dm-arr-ok)" />
              <path d="M570 176 C 640 185, 680 195, 732 200" fill="none" stroke="var(--ink-3)" strokeWidth="1.8" markerEnd="url(#dm-arr)" />
              <path d="M570 188 C 640 215, 680 240, 732 250" fill="none" stroke="var(--ink-3)" strokeWidth="1.8" markerEnd="url(#dm-arr)" />
              <path d="M480 68 V 112" fill="none" stroke="var(--ink-3)" strokeWidth="1.8" markerEnd="url(#dm-arr)" />
              <path d="M420 252 C 430 230, 440 220, 450 208" fill="none" stroke="var(--gold)" strokeWidth="1.8" markerEnd="url(#dm-arr-gold)" />
            </svg>
          </div>
          <p className="g-figcap g-diag-cap">
            Traces are stored as <span className="g-code">jsonb</span> on{' '}
            <span className="g-code">edbc_results</span>, so any past determination can be re-explained, audited,
            or re-rendered verbatim.
          </p>
        </div>
      </section>

      {/* ---------- The EDBC engine — core IP ---------- */}
      <section className="g-card">
        <div className="g-card-hd">
          <h2 className="g-card-title">The EDBC engine</h2>
          <span className="g-card-meta">6 programs · FFY2026-verified · fully traced</span>
        </div>
        <div className="g-card-bd">
          <div className="g-prose">
            <p>
              This is the core of the platform. The eligibility, determination, benefit calculation (EDBC) engine
              is <strong>pure TypeScript</strong> (<span className="g-code">src/lib/engine.ts</span>): the same
              snapshot plus the same parameters always produce the same result, byte for byte. It carries all six
              programs — <strong>CalFresh, CalWORKs, Medi-Cal, General Relief, CAPI,</strong> and{' '}
              <strong>RCA</strong> — each with FFY2026-verified parameters read from{' '}
              <span className="g-code">rule_params</span> at run time, and each emitting a step-by-step trace. The
              test suite pins the exact dollar amounts.
            </p>
          </div>

          <div className="g-tblwrap" style={{ marginTop: 16 }}>
            <table className="g-table">
              <thead>
                <tr>
                  <th>Program</th>
                  <th>Structure</th>
                  <th>Golden check</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td><span style={{ color: 'var(--primary)' }}>●</span> CalFresh</td>
                  <td>200% / 100% FPL tests · 20% earned + standard + shelter deductions · allotment − 30% net</td>
                  <td>Maria → <strong>$686</strong></td>
                </tr>
                <tr>
                  <td><span style={{ color: 'var(--ok)' }}>●</span> CalWORKs</td>
                  <td>MBSAC applicant test · $600 + 50% disregards · MAP − countable</td>
                  <td>Maria → <strong>$675</strong></td>
                </tr>
                <tr>
                  <td><span style={{ color: 'var(--gold)' }}>●</span> Medi-Cal</td>
                  <td>per-person MAGI tiers: 138 / 266 / 213% FPL</td>
                  <td>Maria&apos;s household eligible</td>
                </tr>
                <tr>
                  <td><span style={{ color: 'var(--ok)' }}>●</span> General Relief</td>
                  <td>LA GR standard · $100 cash limit</td>
                  <td>James → <strong>$221</strong></td>
                </tr>
                <tr>
                  <td><span style={{ color: 'var(--primary)' }}>●</span> CAPI</td>
                  <td>SSI methodology · 2026 standard $1,233.94</td>
                  <td>Robert → <strong>$453</strong></td>
                </tr>
                <tr>
                  <td><span style={{ color: 'var(--crit)' }}>●</span> RCA</td>
                  <td>4-month window (2025-05-05 policy change)</td>
                  <td>window flip tested</td>
                </tr>
              </tbody>
            </table>
          </div>

          <h3 className="g-h2" style={{ fontSize: 16, marginTop: 22, marginBottom: 4 }}>
            Worked example — the Maria Reyes household
          </h3>
          <div className="g-callout" style={{ marginTop: 8 }}>
            <span className="g-callout-title">The snapshot</span>
            Household of 3 (Maria + two children, ages 6 and 3) · earned income <strong>$1,600/mo</strong> ·
            savings $250 · rent <strong>$1,400</strong> · standard utility allowance $663. Applying for CalFresh,
            CalWORKs, and Medi-Cal. Every figure below is what the engine actually computes and traces.
          </div>

          <div className="g-grid g-grid-2" style={{ marginTop: 14 }}>
            <div>
              <p className="g-eyebrow" style={{ marginBottom: 6 }}>CalFresh — net-income method</p>
              <div className="g-tblwrap">
                <table className="g-table">
                  <tbody>
                    <tr><td>Gross earned income</td><td className="r">$1,600</td></tr>
                    <tr><td>− 20% earned-income deduction</td><td className="r">−$320</td></tr>
                    <tr><td>− Standard deduction (HH 3)</td><td className="r">−$209</td></tr>
                    <tr><td>= Adjusted income</td><td className="r">$1,071</td></tr>
                    <tr><td>− Excess shelter ($2,063 − ½ adj., cap $744)</td><td className="r">−$744</td></tr>
                    <tr><td>= Net monthly income</td><td className="r">$327</td></tr>
                    <tr><td>Max allotment $785 − 30% net ($99)</td><td className="r"><strong>$686</strong></td></tr>
                  </tbody>
                </table>
              </div>
            </div>
            <div>
              <p className="g-eyebrow" style={{ marginBottom: 6 }}>CalWORKs — MAP method</p>
              <div className="g-tblwrap">
                <table className="g-table">
                  <tbody>
                    <tr><td>Gross earned income</td><td className="r">$1,600</td></tr>
                    <tr><td>Passes MBSAC applicant test (&lt; $1,712)</td><td className="r">✓</td></tr>
                    <tr><td>− Disregard ($600 + 50% of the rest)</td><td className="r">−$1,100</td></tr>
                    <tr><td>= Countable income</td><td className="r">$500</td></tr>
                    <tr><td>MAP (Region 1, AU 3, non-exempt)</td><td className="r">$1,175</td></tr>
                    <tr><td>Grant = MAP − countable</td><td className="r"><strong>$675</strong></td></tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          <div className="g-callout ok" style={{ marginTop: 14 }}>
            <span className="g-callout-title">Medi-Cal — eligible</span>
            Household income of $1,600/mo for three is roughly 74% of the federal poverty level. Maria qualifies
            on the adult MAGI tier (≤ 138% FPL) and both children on the child tier (≤ 266% FPL) — all three
            members <strong>Medi-Cal eligible</strong>, $0 premium.
          </div>

          <div className="g-grid g-grid-2" style={{ marginTop: 16, alignItems: 'start' }}>
            <div>
              <p className="g-eyebrow" style={{ marginBottom: 6 }}>A real trace row — as stored and rendered</p>
              <pre style={{ margin: 0, padding: '12px 14px', background: 'var(--sunken)', border: '1px solid var(--line)', borderRadius: 'var(--r)', fontSize: 12, lineHeight: 1.55, overflowX: 'auto', fontFamily: 'ui-monospace, "SF Mono", Menlo, monospace', color: 'var(--ink)' }}>{`{ "step": "D5",
  "label": "Excess shelter deduction",
  "detail": "Shelter $1400 rent + $663 SUA = $2063;
             minus half of adjusted income $535.5;
             capped at $744",
  "value": "−$744",
  "pass": null }`}</pre>
            </div>
            <div className="g-callout info" style={{ marginTop: 24 }}>
              <span className="g-callout-title">Parameters, verified in research</span>
              CalFresh FFY2026 (CDSS ACIN I-46-25) · MBSAC eff. 7/2025 · MAP Region 1 eff. 10/2024 · CAPI 2026
              standards · RCA 4-month window. Only the external interfaces (IEVS / MEDS / SSA / SAVE) are
              simulated — everything else is live computation.
            </div>
          </div>
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

      {/* ---------- Repository layout ---------- */}
      <section className="g-card">
        <div className="g-card-hd">
          <h2 className="g-card-title">Repository layout</h2>
          <span className="g-card-meta">source is public</span>
        </div>
        <div className="g-card-bd">
          <pre style={{ margin: 0, padding: '14px 16px', background: 'var(--sunken)', border: '1px solid var(--line)', borderRadius: 'var(--r)', fontSize: 12.5, lineHeight: 1.7, overflowX: 'auto', fontFamily: 'ui-monospace, "SF Mono", Menlo, monospace', color: 'var(--ink)' }}>{`calsaws-reimagined/
├─ supabase/migrations/     0001_schema.sql · 0002_rls.sql (schema, RLS, atomic fns)
├─ src/lib/
│   ├─ engine.ts            EDBC engine — pure, traced, node-testable
│   ├─ params.ts            rule defaults + admin registry (seeds rule_params)
│   ├─ seed-core.ts         deterministic caseload: 5 golden households + 45 generated
│   └─ supabase/server.ts   cookie client (RLS) + admin client (service role)
├─ src/proxy.ts             Next 16 proxy — session refresh + role gates
├─ src/app/
│   ├─ portal/              applicant: apply wizard · prescreener · my benefits · NOAs
│   └─ (staff)/             worker queue · case tabs + EDBC · supervisor · admin · reports
├─ tests/engine.test.ts     25 golden assertions (Vitest)
├─ e2e/scenarios.spec.ts    8 end-to-end scenarios (Playwright)
└─ DEPLOY.md · README.md`}</pre>
          <p style={{ marginTop: 14, fontSize: 14, color: 'var(--ink-2)' }}>
            Source is public:{' '}
            <a href="https://github.com/regardo911/calsaws-reimagined" style={{ fontWeight: 600 }}>
              github.com/regardo911/calsaws-reimagined
            </a>
          </p>
        </div>
      </section>
    </div>
  );
}
