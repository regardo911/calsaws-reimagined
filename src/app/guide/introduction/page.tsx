export default function Page() {
  return (
    <div className="g-stack">
      <p className="g-lede">
        A working California eligibility platform — <strong>CalFresh, CalWORKs, Medi-Cal,
        General Relief, CAPI, and RCA</strong> — that determines benefits, issues them, and
        reports on them against a live Postgres database.
      </p>

      {/* ------------------------------------------------------------------ */}
      {/* 1 · WHAT THIS IS — the concrete example                            */}
      {/* ------------------------------------------------------------------ */}
      <section className="g-card">
        <div className="g-card-hd">
          <h2 className="g-card-title">What this is</h2>
        </div>
        <div className="g-card-bd">
          <p className="g-prose" style={{ marginBottom: 16 }}>
            Sign in as worker <strong>Dana</strong>, open <strong>Maria Reyes’s</strong> case,
            and click <span className="g-code">Run EDBC</span>. In about a second, three
            determinations come back:
          </p>

          <div className="g-grid g-grid-3">
            <div className="g-stat">
              <div className="g-stat-v">$686<span style={{ fontSize: 15, fontWeight: 600 }}>/mo</span></div>
              <div className="g-stat-l">CalFresh</div>
              <div className="g-stat-d">aid code 09</div>
            </div>
            <div className="g-stat">
              <div className="g-stat-v">$675<span style={{ fontSize: 15, fontWeight: 600 }}>/mo</span></div>
              <div className="g-stat-l">CalWORKs</div>
              <div className="g-stat-d">aid code 30</div>
            </div>
            <div className="g-stat">
              <div className="g-stat-v">Eligible</div>
              <div className="g-stat-l">Medi-Cal</div>
              <div className="g-stat-d">MAGI · M1</div>
            </div>
          </div>

          <div className="g-prose" style={{ marginTop: 16 }}>
            <p>
              Each figure shows its math line by line — gross income tested against{' '}
              <strong>$4,442</strong> (200% of the federal poverty level for a household of
              three), a 20% earned-income deduction, a <strong>$209</strong> standard
              deduction, shelter capped at <strong>$744</strong>, net income tested against{' '}
              <strong>$2,221</strong>, then the monthly allotment. The legacy system runs that
              same determination as an overnight batch you can’t see inside.
            </p>
            <p>
              Everything around that determination is real too. An applicant applies at a
              public portal and gets an account with row-level security; the case lands in a
              worker’s county queue; a CalWORKs grant routes to a supervisor for authorization,
              which writes the notices, issues EBT, and journals the case in one database
              transaction; an administrator changes a grant amount in the rules table with no
              deployment; and the reports tab reads statutory figures — CF 296, CA 237 CW,
              timeliness — straight off the same data.
            </p>
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------------------ */}
      {/* 2 · HOW IT WAS BUILT — teams + meter                               */}
      {/* ------------------------------------------------------------------ */}
      <section className="g-card">
        <div className="g-card-hd">
          <h2 className="g-card-title">How it was built</h2>
          <span className="g-card-meta">Built in an afternoon</span>
        </div>
        <div className="g-card-bd">
          <p className="g-prose" style={{ marginBottom: 16 }}>
            Not one model in one pass. A single <strong>Orchestrator</strong> ran two peer
            teams: a <strong>Research team</strong> of 7 agents that read the actual CalSAWS
            rules and source documents, and an <strong>Engineering team</strong> that wrote the
            platform — with an <strong>automated test harness</strong> that re-checked every
            determination to the dollar on each change. When a source contradicted the build,
            the source won.
          </p>

          <p className="g-prose" style={{ marginBottom: 16 }}>
            The Research team’s work is grounded, not improvised. One agent extracted the
            146-page CalSAWS Configuration Guide (CIT-0355-22) page by page — the source of the
            platform’s Global/Local/Task navigation, its County → Office → Section → Unit →
            Position → Staff org model, and the real Worker-ID format (Dana’s is{' '}
            <span className="g-code">19LS01220A</span>). Another walked benefitscal.com live —
            94 recorded actions — to shape the applicant portal. Every rule traces back to a
            document like these.
          </p>

          <div className="g-tblwrap">
            <table className="g-table">
              <thead>
                <tr>
                  <th>Metric</th>
                  <th className="r">Value</th>
                  <th>Detail</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>AI agents</td>
                  <td className="r num">8</td>
                  <td>1 Orchestrator + 7 research agents (the distinct AI processes)</td>
                </tr>
                <tr>
                  <td>Roles staffed</td>
                  <td className="r num">13</td>
                  <td>orchestrator + 7 research + 5 engineering workstreams (the Orchestrator’s hats, one shared context)</td>
                </tr>
                <tr>
                  <td>Tokens</td>
                  <td className="r num">~1.35M</td>
                  <td>851,506 research (metered exact) + ≥500K orchestrator (labeled estimate)</td>
                </tr>
                <tr>
                  <td>Automated checks</td>
                  <td className="r num">33 green</td>
                  <td>25 unit assertions + 8 end-to-end scenarios, re-run on every build</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------------------ */}
      {/* 3 · THE BUILD CHECKED ITSELF — Maria FFY2026 worked example        */}
      {/* ------------------------------------------------------------------ */}
      <section className="g-card">
        <div className="g-card-hd">
          <h2 className="g-card-title">The build checked itself</h2>
          <span className="g-card-meta">Worked example</span>
        </div>
        <div className="g-card-bd">
          <p className="g-prose" style={{ marginBottom: 16 }}>
            Baseline numbers go in; the Research team re-verifies each rule against its primary
            source, with a citation; on conflict, the source wins; the harness re-proves all 33
            checks. Here is the loop catching a real error — in Maria’s CalFresh determination:
          </p>

          <div className="g-tblwrap">
            <table className="g-table">
              <thead>
                <tr>
                  <th>CalFresh parameter</th>
                  <th className="r">FFY2025 (shipped stale)</th>
                  <th className="r">FFY2026 (corrected)</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>Max allotment, household of 3</td>
                  <td className="r num">$768</td>
                  <td className="r num">$785</td>
                </tr>
                <tr>
                  <td>Standard deduction</td>
                  <td className="r num">$204</td>
                  <td className="r num">$209</td>
                </tr>
                <tr>
                  <td>Shelter cap</td>
                  <td className="r num">$712</td>
                  <td className="r num">$744</td>
                </tr>
                <tr>
                  <td><strong>Maria’s CalFresh determination</strong></td>
                  <td className="r num">$658/mo</td>
                  <td className="r num"><strong>$686/mo</strong></td>
                </tr>
              </tbody>
            </table>
          </div>

          <div className="g-callout ok" style={{ marginTop: 16 }}>
            <span className="g-callout-title">Source: CDSS ACIN I-46-25</span>
            FFY2026 CalFresh cost-of-living adjustment, effective 10/2025. The Policy research
            agent pulled it, the engine parameters were corrected, and the corrected result is
            now pinned by a unit test.
          </div>

          <p className="g-prose" style={{ marginTop: 16 }}>
            Shipped as-is, every CalFresh determination in the platform would have been wrong —
            here, $28/mo low for Maria’s family. It was caught the same session, with the
            citation attached.
          </p>
        </div>
      </section>

      {/* one-line pointer to the Demo tab */}
      <p className="g-prose" style={{ margin: 0 }}>
        Want to watch it run? Walk the full flow — apply, determine, authorize, report — in the{' '}
        <a href="/guide/demo" style={{ color: 'var(--primary)', fontWeight: 600 }}>Demo Script</a> tab.
      </p>
    </div>
  );
}
