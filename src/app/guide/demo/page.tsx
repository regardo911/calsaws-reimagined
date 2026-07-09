// Public guide — Tab 2: Demo Script (single county: Los Angeles).
// STATIC server component. No 'use client', no DB reads, no getStaffContext.
// Content is faithful to spec Part G (the 19-step walkthrough) with the Part E
// rename of the live-signup beat to "Create a real account, live" — no showmanship.
import type { ReactNode } from 'react';

type Win = 'public' | 'applicant' | 'staff';

const WIN: Record<Win, { label: string; cls: string }> = {
  public: { label: 'Public', cls: 'g-chip' },
  applicant: { label: 'Applicant · incognito', cls: 'g-chip info' },
  staff: { label: 'Staff window', cls: 'g-chip gold' },
};

interface Step {
  n: number;
  title: string;
  win: Win;
  route: ReactNode;
  do: ReactNode;
  say?: ReactNode; // omit when the spec's "Say" is "—" (let the screen speak)
  alt: string;
  cap: string;
}

const STEPS: Step[] = [
  {
    n: 1,
    title: 'The live platform, in numbers',
    win: 'public',
    route: <code className="g-code">/</code>,
    do: <>Show the hero, the four live database counters, and the &ldquo;Then vs. now&rdquo; strip.</>,
    say: (
      <>
        &ldquo;California spent <strong>$1.025B</strong> building the four legacy consortium systems and
        ~<strong>$178M/yr</strong> running the surviving three in parallel during migration. Training one
        eligibility worker takes <strong>28 weeks</strong>. This was built by AI in an afternoon — and every
        number on this page comes from a live Postgres database.&rdquo;
      </>
    ),
    alt: 'Screenshot: the landing page hero with four live database counters and a then-vs-now comparison strip.',
    cap: 'Landing page — hero, four live DB counters, and the “Then vs. now” strip.',
  },
  {
    n: 2,
    title: 'Public eligibility check (no login)',
    win: 'applicant',
    route: <code className="g-code">/portal/prescreen</code>,
    do: <>Run the quick eligibility check; show the qualifying-program pills that come back.</>,
    say: (
      <>&ldquo;No login. Anyone can check eligibility in seconds — the limits read live from the rules table.&rdquo;</>
    ),
    alt: 'Screenshot: the public pre-screen result showing qualifying-program pills.',
    cap: 'Public pre-screen — instant eligibility check with qualifying-program pills.',
  },
  {
    n: 3,
    title: 'Start a guided application — Household',
    win: 'applicant',
    route: (
      <>
        <code className="g-code">/portal/apply</code> <span className="muted">· step 1 (Household)</span>
      </>
    ),
    do: <>Enter yourself plus two kids (ages 6 and 3).</>,
    say: <>&ldquo;A guided application, not a 100-screen maze.&rdquo;</>,
    alt: 'Screenshot: step 1 of the guided application, the Household step.',
    cap: 'Guided application — the Household step.',
  },
  {
    n: 4,
    title: 'Choose programs',
    win: 'applicant',
    route: (
      <>
        <code className="g-code">/portal/apply</code> <span className="muted">· step 4 (Programs)</span>
      </>
    ),
    do: (
      <>
        Select <strong>CalFresh + CalWORKs + Medi-Cal</strong>.
      </>
    ),
    alt: 'Screenshot: the program-selection step with CalFresh, CalWORKs, and Medi-Cal checked.',
    cap: 'Program selection — CalFresh, CalWORKs, Medi-Cal.',
  },
  {
    n: 5,
    title: 'Review the application',
    win: 'applicant',
    route: (
      <>
        <code className="g-code">/portal/apply</code> <span className="muted">· step 5 (Review)</span>
      </>
    ),
    do: (
      <>
        Enter income <strong>$1,600/mo</strong> · savings <strong>$250</strong> · rent <strong>$1,400</strong> ·
        utilities <strong>$180</strong>, and set <strong>County = Los Angeles</strong>.
      </>
    ),
    alt: 'Screenshot: the review step with income, resources, expenses, and County set to Los Angeles.',
    cap: 'Review & submit — figures entered, County set to Los Angeles.',
  },
  {
    n: 6,
    title: 'Create a real account, live',
    win: 'applicant',
    route: (
      <>
        <code className="g-code">/signup</code> <span className="muted">· account gate</span>
      </>
    ),
    do: <>Invent an email on the spot — ask the room to give you one.</>,
    say: <>&ldquo;That account did not exist ninety seconds ago — there is no pre-baked demo user here.&rdquo;</>,
    alt: 'Screenshot: the self-signup form that gates submitting an application.',
    cap: 'The account gate — a real self-signup, created live.',
  },
  {
    n: 7,
    title: 'Application received — a real case',
    win: 'applicant',
    route: (
      <>
        <code className="g-code">/portal/apply</code> <span className="muted">· success</span>
      </>
    ),
    do: (
      <>
        Show the new case number <code className="g-code">C-2xxxxx</code> and the ⚡ expedited callout if it appears.
      </>
    ),
    say: <>&ldquo;It&rsquo;s a real row in the auth table, with row-level security around everything it owns.&rdquo;</>,
    alt: 'Screenshot: the application-received screen showing a new case number and an expedited callout.',
    cap: 'Application received — a new case row with an expedited callout.',
  },
  {
    n: 8,
    title: 'Sign in as the worker',
    win: 'staff',
    route: <code className="g-code">/login</code>,
    do: (
      <>
        Show the four demo-fill buttons, then sign in as <code className="g-code">worker.dana@</code> (Los Angeles).
      </>
    ),
    alt: 'Screenshot: the sign-in page with four one-click demo-account fill buttons.',
    cap: 'Sign-in — four one-click demo-fill buttons; the credential flow still runs on submit.',
  },
  {
    n: 9,
    title: 'The worker’s county queue',
    win: 'staff',
    route: <code className="g-code">/worker</code>,
    do: (
      <>
        Point out the SLA tiles and the case you just created (steps 6&ndash;7), already in the queue with a
        countdown chip.
      </>
    ),
    say: <>&ldquo;This is Dana&rsquo;s Los Angeles queue.&rdquo;</>,
    alt: 'Screenshot: the worker dashboard with four SLA tiles and a task queue.',
    cap: 'Worker queue — SLA tiles plus the just-created case with an SLA countdown.',
  },
  {
    n: 10,
    title: 'Open the case — Household to Data Matches',
    win: 'staff',
    route: <code className="g-code">/case/C-100001?tab=household</code>,
    do: (
      <>
        Walk Household → Income → <strong>Data Matches</strong> (the &ldquo;IEVS wage cross-check&rdquo;).
      </>
    ),
    alt: 'Screenshot: Maria Reyes case view, Household tab, with Income and Data Matches tabs alongside.',
    cap: 'Case view (Maria Reyes, C-100001) — Household, Income, and the IEVS Data Matches.',
  },
  {
    n: 11,
    title: 'Run EDBC',
    win: 'staff',
    route: <code className="g-code">/case/C-100001?tab=edbc</code>,
    do: (
      <>
        <strong>Run EDBC</strong> (~1s): <strong>CF $686</strong> · aid 09 / <strong>CW $675</strong> · aid 30 /
        <strong> Medi-Cal M1</strong>.
      </>
    ),
    say: (
      <>&ldquo;The legacy EDBC is an overnight black box. The same determination runs here in one second.&rdquo;</>
    ),
    alt: 'Screenshot: EDBC results panel showing CalFresh, CalWORKs, and Medi-Cal determinations.',
    cap: 'EDBC — CalFresh $686, CalWORKs $675, Medi-Cal eligible, in about a second.',
  },
  {
    n: 12,
    title: 'See the math — “How we got here”',
    win: 'staff',
    route: (
      <>
        <code className="g-code">/case/C-100001?tab=edbc</code>{' '}
        <span className="muted">· &ldquo;How we got here&rdquo; expanded</span>
      </>
    ),
    do: (
      <>
        Expand the trace: gross vs <strong>$4,442</strong> (200% FPL), 20% earned-income deduction,
        <strong> $209</strong> standard deduction, shelter capped at <strong>$744</strong>, net vs{' '}
        <strong>$2,221</strong>. Then <strong>Accept &amp; Save</strong> → &ldquo;routed to supervisor.&rdquo;
      </>
    ),
    say: (
      <>
        &ldquo;Every step of the math is on screen — and CalWORKs still needs supervisor authorization, exactly like
        your county-configurable controls today.&rdquo;
      </>
    ),
    alt: 'Screenshot: the plain-English EDBC calculation trace showing each deduction and threshold.',
    cap: 'The trace — each deduction and threshold shown line by line, then routed to the supervisor.',
  },
  {
    n: 13,
    title: 'Yellow Banner — an integrity block',
    win: 'staff',
    route: (
      <>
        <code className="g-code">/case/C-100005?tab=matches</code> <span className="muted">→ case top</span>
      </>
    ),
    do: (
      <>
        Person Search <strong>&ldquo;Brooks&rdquo;</strong> → <code className="g-code">C-100005</code> → the
        <strong> Yellow Banner</strong>: &ldquo;Full Case Review is required before EDBC is run and authorized.&rdquo;
        IEVS <strong>$2,400</strong> vs case <strong>$1,600</strong> → Run EDBC → <strong>blocked server-side</strong>{' '}
        → Review &amp; resolve → re-run on the corrected income.
      </>
    ),
    say: <>&ldquo;The same integrity control you run today — minus the sticky notes and the phone tag.&rdquo;</>,
    alt: 'Screenshot: a case blocked by the Yellow Banner alert over an unresolved IEVS wage discrepancy.',
    cap: 'Yellow Banner (Tanya Brooks, C-100005) — EDBC blocked in Postgres until the discrepancy is resolved.',
  },
  {
    n: 14,
    title: 'Supervisor authorizes the grant',
    win: 'staff',
    route: (
      <>
        <code className="g-code">/supervisor</code>{' '}
        <span className="muted">· sign in <code className="g-code">supervisor.angela@</code></span>
      </>
    ),
    do: (
      <>
        Authorizations → the case from step 12 → <strong>Authorize</strong> — one SQL transaction writes the NOAs,
        issues EBT, closes the tasks, and journals it all.
      </>
    ),
    alt: 'Screenshot: the supervisor authorizations queue with Approve and Return buttons.',
    cap: 'Supervisor authorizations — one atomic transaction writes notices, issuance, tasks, and journal.',
  },
  {
    n: 15,
    title: 'Change a rule in Admin',
    win: 'staff',
    route: (
      <>
        <code className="g-code">/admin</code>{' '}
        <span className="muted">· sign in <code className="g-code">admin.chris@</code></span>
      </>
    ),
    do: (
      <>
        Rules &amp; Config → change the <strong>GA/GR monthly grant 221 → 400</strong> → Save.
      </>
    ),
    say: <>&ldquo;A statewide policy change with zero deployment.&rdquo;</>,
    alt: 'Screenshot: the Admin Rules & Config editor with the General Relief grant parameter.',
    cap: 'Admin Rules & Config — edit a live rule parameter and save.',
  },
  {
    n: 16,
    title: 'Re-run with the new rule',
    win: 'staff',
    route: (
      <>
        <code className="g-code">/case/C-100002?tab=edbc</code> <span className="muted">· back as Dana</span>
      </>
    ),
    do: (
      <>
        Open James Carter → deselect all but General Relief → Run → <strong>$400</strong>, with the new standard
        showing in the trace. <span className="muted">(Reset to 221 afterward.)</span>
      </>
    ),
    say: <>&ldquo;In the legacy world, that&rsquo;s a change request and a release train.&rdquo;</>,
    alt: 'Screenshot: James Carter General Relief determination recomputed to the new grant amount.',
    cap: 'Re-run (James Carter, C-100002) — General Relief recomputes to $400 immediately.',
  },
  {
    n: 17,
    title: 'What the applicant sees',
    win: 'applicant',
    route: (
      <>
        <code className="g-code">/portal</code> <span className="muted">· refresh</span>
      </>
    ),
    do: (
      <>
        Status <strong>Active</strong>; a plain-language approval NOA per program; EBT issuance rows. Open a notice
        via <code className="g-code">/portal/noa/&lt;id&gt;</code>.
      </>
    ),
    alt: 'Screenshot: the applicant portal after approval — Active status, notices, and EBT issuance rows.',
    cap: 'Applicant portal — Active status, per-program approval notices, and EBT issuances.',
  },
  {
    n: 18,
    title: 'Reports and state forms',
    win: 'staff',
    route: (
      <>
        <code className="g-code">/reports?tab=timeliness</code>{' '}
        <span className="muted">→ <code className="g-code">?tab=cf296</code></span>
      </>
    ),
    do: (
      <>
        The dashboard already includes the approved case → <strong>Timeliness</strong> (% within SLA vs{' '}
        <strong>90%</strong>) → <strong>CF 296 / CA 237 CW / CA 255</strong> → Export CSV.
      </>
    ),
    alt: 'Screenshot: the Reports Timeliness and CF 296 state-form tables with a CSV export link.',
    cap: 'Reports — Timeliness and the CF 296 / CA 237 / CA 255 state forms, with CSV export.',
  },
  {
    n: 19,
    title: 'Ask the Copilot',
    win: 'staff',
    route: (
      <>
        <span className="muted">✨ Copilot panel · any staff page</span>
      </>
    ),
    do: (
      <>
        Open the ✨ Copilot and ask: <strong>&ldquo;Explain case C-100002.&rdquo;</strong>
      </>
    ),
    say: (
      <>
        &ldquo;Real accounts, real Postgres, row-level security, atomic issuance, and an 8-scenario end-to-end suite
        — including one that proves applicants can&rsquo;t see each other&rsquo;s cases. Now imagine this team pointed
        at the real thing.&rdquo;
      </>
    ),
    alt: 'Screenshot: the Copilot panel answering a request to explain a case.',
    cap: 'Copilot — a grounded, case-aware answer on any staff page.',
  },
];

export default function Page() {
  return (
    <div className="g-stack">
      {/* ---- intro ---- */}
      <div>
        <div className="g-eyebrow">Tab 2 · Demo Script</div>
        <h2 className="g-h2">A 12-minute, hands-on walkthrough</h2>
        <p className="g-lede">
          One natural sequence through the live platform, all in <strong>Los Angeles County</strong>: an applicant
          self-serves, a worker processes the case, a supervisor authorizes it, an admin changes a rule, and the
          reports and Copilot tie it together. Every screen is real — <strong>a real account, a real Postgres row,
          and the math shown on screen.</strong>
        </p>
      </div>

      <div className="g-grid g-grid-3">
        <div className="g-stat">
          <div className="g-stat-v">~12 min</div>
          <div className="g-stat-l">Hands-on, one sitting</div>
          <div className="g-stat-d">No slides — drive the real app.</div>
        </div>
        <div className="g-stat">
          <div className="g-stat-v">19 steps</div>
          <div className="g-stat-l">Applicant → worker → supervisor → admin → reports → Copilot</div>
          <div className="g-stat-d">One screenshot per step.</div>
        </div>
        <div className="g-stat">
          <div className="g-stat-v">Los Angeles</div>
          <div className="g-stat-l">A single county, start to finish</div>
          <div className="g-stat-d">County-scoped throughout.</div>
        </div>
      </div>

      {/* ---- two-window note ---- */}
      <div className="g-callout info">
        <span className="g-callout-title">Run two browser windows</span>
        Keep two windows open the whole time: a <strong>normal staff window</strong> and an{' '}
        <strong>incognito applicant window</strong>. The incognito window is the public / applicant side (steps
        2&ndash;7 and 17); the normal window is staff (worker Dana → supervisor Angela → admin Chris). Never sign a
        staff account into the incognito window — keeping them separate is what proves an applicant only ever sees
        their own case.
      </div>

      {/* ---- cheat sheet ---- */}
      <div className="g-card">
        <div className="g-card-hd">
          <h3 className="g-card-title">Demo cheat sheet</h3>
          <span className="g-card-meta">Los Angeles logins · shared password · golden values</span>
        </div>
        <div className="g-card-bd g-stack">
          <div className="g-callout gold">
            <span className="g-callout-title">One shared password</span>
            All four accounts sign in with <code className="g-code">CalSAWS-demo-2026!</code> — one-click fillable
            from the demo buttons on <code className="g-code">/login</code>.
          </div>

          <div className="g-tblwrap">
            <table className="g-table">
              <thead>
                <tr>
                  <th>Role</th>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Worker ID</th>
                  <th>Scope</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>Applicant</td>
                  <td>Maria Reyes</td>
                  <td><code className="g-code">applicant.maria@demo.calsaws.test</code></td>
                  <td className="muted">—</td>
                  <td>Own case only</td>
                </tr>
                <tr>
                  <td>Worker</td>
                  <td>Dana Whitfield</td>
                  <td><code className="g-code">worker.dana@demo.calsaws.test</code></td>
                  <td><code className="g-code">19LS01220A</code></td>
                  <td>Los Angeles County</td>
                </tr>
                <tr>
                  <td>Supervisor</td>
                  <td>Angela Ruiz</td>
                  <td><code className="g-code">supervisor.angela@demo.calsaws.test</code></td>
                  <td><code className="g-code">19LS01200S</code></td>
                  <td>Los Angeles County</td>
                </tr>
                <tr>
                  <td>Admin</td>
                  <td>Chris Yamamoto</td>
                  <td><code className="g-code">admin.chris@demo.calsaws.test</code></td>
                  <td className="muted">—</td>
                  <td>Statewide (all counties)</td>
                </tr>
              </tbody>
            </table>
          </div>

          <div>
            <div className="g-eyebrow" style={{ marginBottom: 8 }}>Golden expected values</div>
            <div className="g-tblwrap">
              <table className="g-table">
                <thead>
                  <tr>
                    <th>Household</th>
                    <th>Case</th>
                    <th>Expected determination</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>Maria Reyes</td>
                    <td><code className="g-code">C-100001</code></td>
                    <td>
                      CalFresh <strong>$686</strong> · CalWORKs <strong>$675</strong> · Medi-Cal eligible
                    </td>
                  </tr>
                  <tr>
                    <td>James Carter <span className="g-chip crit"><span className="dot" style={{ background: 'currentColor' }} />expedited</span></td>
                    <td><code className="g-code">C-100002</code></td>
                    <td>
                      CalFresh <strong>$298</strong> · General Relief <strong>$221</strong> · Medi-Cal adult
                    </td>
                  </tr>
                  <tr>
                    <td>Robert Okafor</td>
                    <td><code className="g-code">C-100004</code></td>
                    <td>CAPI <strong>$453</strong> · Medi-Cal aged</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <div className="g-callout warn">
            <span className="g-callout-title">Don&rsquo;t conflate two case numbers</span>
            The case you create live in step 7 is <code className="g-code">C-2xxxxx</code>. Seeded Maria is{' '}
            <code className="g-code">C-100001</code> — keep them straight on stage.
          </div>

          <div className="g-callout info">
            <span className="g-callout-title">Reset between runs</span>
            To start clean: Admin → Rules &amp; Config → <strong>♻️ Reset demo data</strong>. It reseeds cases,
            tasks, notices, and rules and keeps every account. (Also use it if you changed the GA/GR grant in step
            15.)
          </div>
        </div>
      </div>

      {/* ---- the walkthrough ---- */}
      <div>
        <h2 className="g-h2">The walkthrough</h2>
        <p className="muted small" style={{ marginTop: 4 }}>
          Each step lists the screen, the action to take (<strong>Do</strong>), and the plain line to say
          (<strong>Say</strong>). Screenshots are placeholders until captured.
        </p>
      </div>

      <div className="g-stack">
        {STEPS.map((s) => {
          const win = WIN[s.win];
          const nn = String(s.n).padStart(2, '0');
          return (
            <div className="g-card" key={s.n}>
              <div className="g-card-hd">
                <span className="g-stepnum">{s.n}</span>
                <h3 className="g-card-title">{s.title}</h3>
                <span className={`g-card-meta ${win.cls}`}>{win.label}</span>
              </div>
              <div className="g-card-bd g-stack">
                <dl className="g-kv" style={{ margin: 0 }}>
                  <dt>Screen</dt>
                  <dd>{s.route}</dd>
                  <dt>Do</dt>
                  <dd>{s.do}</dd>
                </dl>

                {s.say ? (
                  <div className="g-callout ok">
                    <span className="g-callout-title">Say</span>
                    {s.say}
                  </div>
                ) : (
                  <p className="muted small" style={{ margin: 0 }}>
                    No line needed — let the screen do the work.
                  </p>
                )}

                <figure className="g-figure">
                  <img src={`/guide/shots/step-${nn}.png`} alt={s.alt} loading="lazy" decoding="async" />
                  <figcaption className="g-figcap">
                    <strong>Step {s.n}.</strong> {s.cap}
                  </figcaption>
                </figure>
              </div>
            </div>
          );
        })}
      </div>

      {/* ---- close ---- */}
      <div className="g-callout gold">
        <span className="g-callout-title">After the demo</span>
        The <strong>Accounts by County</strong> tab lists every login (worker Dana&rsquo;s LA queue vs the San Diego
        worker&rsquo;s — county-scoped row-level security), and the <strong>Architecture</strong> tab shows how the
        whole thing is wired. Reset the demo data before the next run.
      </div>
    </div>
  );
}
