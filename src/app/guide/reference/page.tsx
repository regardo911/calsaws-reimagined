// Public guide — Reference Material tab. STATIC server component.
// No DB, no auth, no getStaffContext, no 'use client'. Content is static text/tables.
import type { ReactNode } from 'react';

const CODE = (s: string) => <span className="g-code">{s}</span>;

// ---- Primary-source citations, grouped by domain (cornerstone shown separately above) ----
type Row = { source: ReactNode; id: ReactNode; proves: ReactNode };
const CITATION_GROUPS: { domain: string; rows: Row[] }[] = [
  {
    domain: 'Rules engine & EDBC',
    rows: [
      {
        source: 'CDSS ACIN I-46-25 + Attachment I',
        id: 'Eff. 10/2025 · FFY2026',
        proves:
          'FFY2026 CalFresh COLA: max allotments $298 / 546 / 785 / 994, standard deductions $209–299, $744 shelter cap, $663 SUA, $24 minimum benefit — the CalFresh math in the rules table.',
      },
      {
        source: 'CDSS MBSAC tables · MAP Region 1',
        id: 'MBSAC eff. 7/2025 · MAP eff. 10/2024',
        proves:
          'CalWORKs need + payment standards: applicant test vs. MBSAC; grant = MAP − countable income ($600 + 50% earned-income disregards).',
      },
      {
        source: 'DHCS MAGI & ABD-FPL standards',
        id: '2025',
        proves:
          'Medi-Cal income thresholds: 138% adult / 266% children / 213% pregnant; $1,801 aged & disabled standard.',
      },
      {
        source: 'CAPI / SSI-SSP payment standards',
        id: 'CDSS 2025 → 2026',
        proves:
          'SSI-linked cash aid: $1,233.94 individual standard, $20 / $65-plus-half disregards, $2,000 resource limit.',
      },
      {
        source: 'RCA policy change',
        id: 'Arrivals on/after 2025-05-05',
        proves:
          'Refugee Cash Assistance eligibility window cut 12 → 4 months — caught by research, encoded and unit-tested.',
      },
      {
        source: 'LA County DPSS ePolicy / GR handbook',
        id: 'Current',
        proves:
          'General Relief: $221 monthly standard, $100 applicant cash limit — the GA/GR (General Relief) calculator.',
      },
    ],
  },
  {
    domain: 'Platform, workflow & configuration',
    rows: [
      {
        source: (
          <>
            CalSAWS Configuration Guide{' '}
            <span className="g-chip gold" style={{ marginLeft: 4 }}>
              Cornerstone
            </span>
          </>
        ),
        id: CODE('CIT-0355-22'),
        proves:
          'Nov 2022, 146 pp. Org hierarchy, Worker-ID format, Global/Local/Task navigation, the task & automated-action model, 29 roles / 1,498 security groups, and county-configurable authorization + issuance thresholds.',
      },
      {
        source: 'CalSAWS Yellow Banner job aids',
        id: (
          <>
            {CODE('CIT-0169-23')} · {CODE('CIT-0074-23')}
          </>
        ),
        proves:
          'EDBC data-mismatch procedure and the verbatim banner “Full Case Review is required before EDBC is run and authorized,” with block-until-resolved behavior.',
      },
      {
        source: 'CalSAWS e-Application · Migration Training Guide',
        id: (
          <>
            {CODE('CIT-0128-22')} · {CODE('CIT-0136-21')}
          </>
        ),
        proves:
          'Intake and worker training: Regular Intake vs. Add-a-Program, person clearance, application registration — and the 28-week training anchor.',
      },
      {
        source: 'benefitscal.com',
        id: 'Live production walkthrough · 94 recorded actions',
        proves:
          'The applicant journey: a 9-section application, document rules, the 21-language reality, “Ask Robin,” and the “Things To Do” model — the portal UX.',
      },
    ],
  },
  {
    domain: 'Reporting & compliance',
    rows: [
      {
        source: 'CalSAWS Reports Overview · Reports Navigation',
        id: (
          <>
            {CODE('CIT-0038-23')} · {CODE('CIT-0006-25')}
          </>
        ),
        proves:
          'The real report catalog: CF 296 / CA 237 CW / CA 255 structures, business-day cadences, and Scheduled vs. On-Request delivery.',
      },
      {
        source: 'DHCS county performance standards',
        id: 'Article 25 · ACWDL 23-14E',
        proves:
          'Medi-Cal timeliness: the 90%-within-45/90-day standards behind the Timeliness dashboard.',
      },
      {
        source: 'USDA FNS SNAP standards',
        id: '7 CFR 275.16 · APT guidance',
        proves:
          'Federal CalFresh accountability: 30-day / 3-day expedited SLAs and the 90% timeliness target.',
      },
    ],
  },
  {
    domain: 'Context & history',
    rows: [
      {
        source: 'LAO / OSI / CWDA records · CalSAWS JPA materials',
        id: 'Aggregated — no single document ID',
        proves:
          'SAWS consortium history and budgets: the $1.025B build / ~$178M-per-year run legacy-cost story and the LRS / C-IV / CalWIN consolidation. Softest sourcing in the set — aggregated and secondary.',
      },
    ],
  },
];

// ---- Corrections the research team made when the build drifted from current policy ----
const CORRECTIONS: { what: ReactNode; source: ReactNode; impact: ReactNode }[] = [
  {
    what: (
      <>
        CalFresh parameters shipped on <strong>FFY2025</strong> values; research pulled the current federal
        COLA and updated them to <strong>FFY2026</strong> (max allotment $768 → $785, standard deduction
        $204 → $209, shelter cap $712 → $744, SUA added at $663).
      </>
    ),
    source: <>CDSS ACIN I-46-25 (eff. 10/2025)</>,
    impact: (
      <>
        Maria&rsquo;s family-of-3 determination moved <strong>$658 → $686/mo</strong>. Every CalFresh
        determination would otherwise have shipped stale — caught the same session, with the citation, and
        re-pinned by a unit test.
      </>
    ),
  },
  {
    what: (
      <>
        The Refugee Cash Assistance window was modeled at <strong>12 months</strong>; policy had already
        changed for arrivals on/after 2025-05-05.
      </>
    ),
    source: <>RCA policy change (2025-05-05)</>,
    impact: (
      <>
        Window corrected to <strong>4 months</strong>, encoded in the engine and pinned by a unit test.
      </>
    ),
  },
  {
    what: (
      <>
        Report names used pre-2016 legacy labels; research aligned them to the current CalSAWS catalog
        (DFA 296 → <strong>CF 296</strong>; CA 237 CW = caseload movement, not applications; CA 800 = fiscal
        claiming, not error rates).
      </>
    ),
    source: (
      <>
        CalSAWS Reports Overview ({CODE('CIT-0038-23')}) · Reports Navigation ({CODE('CIT-0006-25')})
      </>
    ),
    impact: (
      <>
        The Reports tab now carries the statutory names counties recognize — <strong>CF 296 · CA 237 CW · CA 255</strong>.
      </>
    ),
  },
];

export default function Page() {
  return (
    <div className="g-stack">
      {/* ---------- Intro ---------- */}
      <div>
        <div className="g-eyebrow">Reference material</div>
        <h2 className="g-h2">The rules are grounded in primary sources</h2>
        <p className="g-lede">
          Every threshold, standard, banner, and report name in this platform traces to a real government
          source — a CDSS all-county letter, a CalSAWS configuration or job-aid document ({CODE('CIT-…')}), a
          federal regulation, or the live BenefitsCal application — <strong>not invented from thin air.</strong>{' '}
          Below is the one cornerstone document, the fourteen sources behind the engine, and the corrections
          the research team made when the build drifted from current policy.
        </p>
      </div>

      {/* ---------- Cornerstone ---------- */}
      <section className="g-card">
        <div className="g-card-hd">
          <h3 className="g-card-title">📜 The cornerstone document</h3>
          <span className="g-card-meta">provided at kickoff · text-extracted page by page</span>
        </div>
        <div className="g-card-bd">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div className="g-callout gold">
              <span className="g-callout-title">
                CalSAWS Configuration Guide — CIT-0355-22 (Nov 2022, 146 pages)
              </span>
              The structural DNA of the platform. The research team extracted it end to end and built the org
              model, navigation, and authorization design directly from it.
            </div>
            <dl className="g-kv">
              <dt>Org hierarchy</dt>
              <dd>County → Office → Section → Unit → Position → Staff</dd>
              <dt>Worker-ID format</dt>
              <dd>
                2-digit county code + section / unit / position — e.g. Dana Whitfield&rsquo;s{' '}
                {CODE('19LS01220A')} (Los Angeles), supervisor Angela Ruiz {CODE('19LS01200S')}.
              </dd>
              <dt>Navigation model</dt>
              <dd>Global / Local / Task task-based navigation</dd>
              <dt>Security model</dt>
              <dd>29 roles · 1,498 security groups</dd>
              <dt>Authorization</dt>
              <dd>
                County-configurable 1st / 2nd-level authorization and benefit-issuance thresholds — the
                supervisor-authorization flow.
              </dd>
            </dl>
          </div>
        </div>
      </section>

      {/* ---------- Primary-source citation table ---------- */}
      <section className="g-card">
        <div className="g-card-hd">
          <h3 className="g-card-title">Primary-source citations</h3>
          <span className="g-card-meta">1 cornerstone + 14 sources</span>
        </div>
        <div className="g-card-bd">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            {CITATION_GROUPS.map((group) => (
              <div key={group.domain} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <div className="g-eyebrow">{group.domain}</div>
                <div className="g-tblwrap">
                  <table className="g-table">
                    <thead>
                      <tr>
                        <th style={{ minWidth: 190 }}>Source</th>
                        <th style={{ minWidth: 150 }}>ID / date</th>
                        <th style={{ minWidth: 320 }}>What it establishes</th>
                      </tr>
                    </thead>
                    <tbody>
                      {group.rows.map((r, i) => (
                        <tr key={i}>
                          <td>{r.source}</td>
                          <td>{r.id}</td>
                          <td>{r.proves}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ---------- Corrections table ---------- */}
      <section className="g-card">
        <div className="g-card-hd">
          <h3 className="g-card-title">Corrections the research team made</h3>
          <span className="g-card-meta">when a source contradicted the build, the source won</span>
        </div>
        <div className="g-card-bd">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div className="g-callout info">
              The build checked itself. Research verified the engineering team&rsquo;s output against these
              same sources; where the code had drifted from current policy, it was corrected in the same
              session and pinned by a test. (The worked Maria example lives on the Introduction tab.)
            </div>
            <div className="g-tblwrap">
              <table className="g-table">
                <thead>
                  <tr>
                    <th style={{ minWidth: 300 }}>What was corrected</th>
                    <th style={{ minWidth: 180 }}>Source</th>
                    <th style={{ minWidth: 300 }}>Impact</th>
                  </tr>
                </thead>
                <tbody>
                  {CORRECTIONS.map((c, i) => (
                    <tr key={i}>
                      <td>{c.what}</td>
                      <td>{c.source}</td>
                      <td>{c.impact}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </section>

      {/* ---------- Coverage note ---------- */}
      <div className="g-callout ok">
        <span className="g-callout-title">What&rsquo;s real vs. simulated</span>
        Eligibility, determinations, persistence, authorization, benefit issuance, and reporting are all real
        computation against a live Postgres database. Only the external data-match interfaces (IEVS / MEDS /
        SSA / SAVE) are seeded synthetic rows — with one deliberate discrepancy injected to drive the Yellow
        Banner.
      </div>
    </div>
  );
}
