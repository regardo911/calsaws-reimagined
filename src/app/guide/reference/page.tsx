// Public guide — Reference Material tab. STATIC server component.
// Every document below is real and public: page counts were measured by
// downloading each PDF and counting (pdfinfo); URLs are the official sources.
import type { ReactNode } from 'react';

// ---- Source map: official URL + measured page count for every cited document ----
// pp omitted for web regulations (eCFR) and segmented MPP divisions — no single PDF.
const DOC: Record<string, { url: string; pp?: number }> = {
  // CalSAWS County Information Transmittals (35)
  'CIT-0006-25': { url: 'https://www.calsaws.org/wp-content/uploads/2025/01/CIT-0006-25-Reports-Navigation.pdf', pp: 11 },
  'CIT-0008-26': { url: 'https://www.calsaws.org/wp-content/uploads/2026/01/CIT-0008-26-ACIN-I-59_25.pdf', pp: 5 },
  'CIT-0010-25': { url: 'https://www.calsaws.org/wp-content/uploads/2025/01/CIT-0010-25-2025-CAPI-COLA-list_Redacted.pdf', pp: 3 },
  'CIT-0017-22': { url: 'https://www.calsaws.org/wp-content/uploads/2022/03/CIT-0017-22-JA-Medi-Cal-CalHEERS-MAGI-Verifications.pdf', pp: 15 },
  'CIT-0019-21': { url: 'https://www.calsaws.org/wp-content/uploads/2021/02/CIT-0019-21-Medi-Cal-CalHEERS-Dispositions.pdf', pp: 7 },
  'CIT-0030-22': { url: 'https://www.calsaws.org/wp-content/uploads/2022/03/CIT-0030-22-Dashboards-Scheduled-Reports-Replatform-Release-Summaries.pdf', pp: 201 },
  'CIT-0038-23': { url: 'https://www.calsaws.org/wp-content/uploads/2023/02/CIT-0038-23-01.-CalSAWS-Go-Live-Packet.pdf', pp: 7 },
  'CIT-0039-23': { url: 'https://www.calsaws.org/wp-content/uploads/2023/02/CIT-0039-23-CalWIN-County-Prep-Phase-Packet-February-2023.pdf', pp: 73 },
  'CIT-0071-20': { url: 'https://www.calsaws.org/wp-content/uploads/2020/05/CIT-0071-20-Job-Aid-Family-Stabilization_.pdf', pp: 5 },
  'CIT-0074-23': { url: 'https://www.calsaws.org/wp-content/uploads/2023/03/CIT-0074-23-Wave-3-Yellow-Banner-Case-Review-Guide-and-Scenarios-Revised_Redacted.pdf', pp: 5 },
  'CIT-0076-23': { url: 'https://www.calsaws.org/wp-content/uploads/2023/03/CIT-0076-23-CalSAWS-Infographic-Wave-2-Instructor-Led-Training-FAQs.pdf', pp: 4 },
  'CIT-0089-20': { url: 'https://www.calsaws.org/wp-content/uploads/2020/07/CIT-0089-20-ACL-20-45.01.pdf', pp: 7 },
  'CIT-0099-24': { url: 'https://www.calsaws.org/wp-content/uploads/2024/06/CIT-0099-24-JA-EDBC-Overriding-Program-Configuration_.pdf', pp: 8 },
  'CIT-0103-22': { url: 'https://www.calsaws.org/wp-content/uploads/2022/04/CIT-0103-22-Wave-1-and-2-CalSAWS-Infographics-1_Redacted.pdf', pp: 2 },
  'CIT-0135-21': { url: 'https://www.calsaws.org/wp-content/uploads/2021/06/CIT-0135-21-On-Request-Reports-Replatform-Release-Summaries.pdf', pp: 7 },
  'CIT-0136-21': { url: 'https://www.calsaws.org/wp-content/uploads/2021/06/CIT-0136-21-CalSAWS-Migration-Training-Guide.pdf', pp: 32 },
  'CIT-0148-20': { url: 'https://www.calsaws.org/wp-content/uploads/2020/08/CIT-0148-20-Update-Business-Intelligence-BI-Reporting-Tool-Job-Aid_Communications_Redacted.pdf', pp: 2 },
  'CIT-0148-24': { url: 'https://www.calsaws.org/wp-content/uploads/2024/09/CIT-0148-24-Add-Journal-Entry-for-Cases-Affected-by-BenefitsCal-Asset-Issue_Redacted.pdf', pp: 2 },
  'CIT-0150-22': { url: 'https://www.calsaws.org/wp-content/uploads/2022/08/CIT-0150-22-BenefitsCal-Fact-Sheets_Redacted.pdf', pp: 2 },
  'CIT-0169-23': { url: 'https://www.calsaws.org/wp-content/uploads/2023/05/CIT-0169-23-Wave-4-Yellow-Banner-Case-Review-Guide-and-Scenarios_Redacted.pdf', pp: 5 },
  'CIT-0173-22': { url: 'https://www.calsaws.org/wp-content/uploads/2022/08/CIT-0173-22-CalSAWS-LMS-Guide-for-General-Training-CalWIN-Wave-1-1_Redacted.pdf', pp: 2 },
  'CIT-0179-23': { url: 'https://www.calsaws.org/wp-content/uploads/2023/05/CIT-0179-23-DRAFT-Job-Aid-Medi-Cal-CalHEERS-MAGI-Verifications.pdf', pp: 15 },
  'CIT-0198-23': { url: 'https://www.calsaws.org/wp-content/uploads/2023/06/CIT-0198-23-Wave-4-CalSAWS-Infographics-11_Redacted.pdf', pp: 2 },
  'CIT-0206-23': { url: 'https://www.calsaws.org/wp-content/uploads/2023/06/CIT-0206-23-CalSAWS-Configuration-Guide.pdf', pp: 146 },
  'CIT-0229-21': { url: 'https://www.calsaws.org/wp-content/uploads/2021/09/CIT-0229-21-BenefitsCal-Questions-and-Answers.pdf', pp: 1 },
  'CIT-0239-22': { url: 'https://www.calsaws.org/wp-content/uploads/2022/10/CIT-0239-22-CalSAWS-API-Summary-Information_Redacted.pdf', pp: 2 },
  'CIT-0240-21': { url: 'https://www.calsaws.org/wp-content/uploads/2021/09/CIT-0240-21-JA-e-Applications_.pdf', pp: 12 },
  'CIT-0248-23': { url: 'https://www.calsaws.org/wp-content/uploads/2023/07/CIT-0248-23-Wave-5-Yellow-Banner-Case-Review-Process__Redacted.pdf', pp: 6 },
  'CIT-0287-22': { url: 'https://www.calsaws.org/wp-content/uploads/2022/10/CIT-0287-22-Wave-1-Yellow-Banner-Case-Review-Guide-and-Scenarios__Redacted.pdf', pp: 5 },
  'CIT-0290-23': { url: 'https://www.calsaws.org/wp-content/uploads/2023/08/CIT-0290-23-02.-CalWIN-ISS_GLP_What-I-Need-To-Act-On.pdf', pp: 137 },
  'CIT-0294-22': { url: 'https://www.calsaws.org/wp-content/uploads/2022/10/CIT-0294-22-CalSAWS-Training-Environment-Guide-v4.a.pdf', pp: 23 },
  'CIT-0313-23': { url: 'https://www.calsaws.org/wp-content/uploads/2023/08/CIT-0313-23-Wave-6-Yellow-Banner-Case-Review-Guide-and-Scenarios__Redacted.pdf', pp: 6 },
  'CIT-0340-23': { url: 'https://www.calsaws.org/wp-content/uploads/2023/09/CIT-0340-23-Deny-Discontinue-a-Case.pdf', pp: 2 },
  'CIT-0354-22': { url: 'https://www.calsaws.org/wp-content/uploads/2022/12/CIT-0354-22-Yellow-Banner-Case-Review-Report-Mismatch-Scenario-Overview.pdf', pp: 7 },
  'CIT-0355-22': { url: 'https://www.calsaws.org/wp-content/uploads/2022/12/CIT-0355-22-CalSAWS-Configuration-Guide-Nov2022.pdf', pp: 146 },
  // CDSS All-County Information Notices (7)
  'ACIN I-15-26': { url: 'https://www.cdss.ca.gov/Portals/9/Additional-Resources/Letters-and-Notices/ACINs/2026/I-15_26.pdf', pp: 8 },
  'ACIN I-19-16': { url: 'https://www.cdss.ca.gov/Portals/9/ACIN/2016/I-19_16.pdf', pp: 6 },
  'ACIN I-33-21': { url: 'https://www.cdss.ca.gov/Portals/9/Additional-Resources/Letters-and-Notices/ACINs/2021/I_33-21.pdf', pp: 9 },
  'ACIN I-45-24': { url: 'https://www.cdss.ca.gov/Portals/9/Additional-Resources/Letters-and-Notices/ACINs/2024/I-45_24.pdf', pp: 7 },
  'ACIN I-46-25': { url: 'https://www.cdss.ca.gov/Portals/9/Additional-Resources/Letters-and-Notices/ACINs/2025/I-46_25.pdf', pp: 8 },
  'ACIN I-48-23': { url: 'https://www.cdss.ca.gov/Portals/9/Additional-Resources/Letters-and-Notices/ACINs/2023/I-48-23.pdf', pp: 7 },
  'ACIN I-61-24': { url: 'https://www.cdss.ca.gov/Portals/9/Additional-Resources/Letters-and-Notices/ACINs/2024/I-61-24.pdf', pp: 5 },
  // CDSS All-County Letters (14)
  'ACL 08-30': { url: 'https://www.cdss.ca.gov/lettersnotices/entres/getinfo/acl08/08-30.pdf', pp: 4 },
  'ACL 16-39E': { url: 'https://www.cdss.ca.gov/lettersnotices/EntRes/getinfo/acl/2016/16-39E.pdf', pp: 16 },
  'ACL 17-98': { url: 'https://www.cdss.ca.gov/portals/9/acl/2017/17-98.pdf', pp: 5 },
  'ACL 18-117': { url: 'https://www.cdss.ca.gov/portals/9/acl/2018/18-117.pdf', pp: 18 },
  'ACL 21-130': { url: 'https://www.cdss.ca.gov/Portals/9/Additional-Resources/Letters-and-Notices/ACLs/2021/21-130.pdf', pp: 12 },
  'ACL 21-130E': { url: 'https://www.cdss.ca.gov/Portals/9/Additional-Resources/Letters-and-Notices/ACLs/2021/21-130E.pdf', pp: 4 },
  'ACL 23-83': { url: 'https://www.cdss.ca.gov/Portals/9/Additional-Resources/Letters-and-Notices/ACLs/2023/23-83.pdf', pp: 16 },
  'ACL 24-55': { url: 'https://www.cdss.ca.gov/Portals/9/Additional-Resources/Letters-and-Notices/ACLs/2024/24-55.pdf', pp: 14 },
  'ACL 24-63': { url: 'https://www.cdss.ca.gov/Portals/9/Additional-Resources/Letters-and-Notices/ACLs/2024/24-63.pdf', pp: 6 },
  'ACL 25-36': { url: 'https://www.cdss.ca.gov/Portals/9/Additional-Resources/Letters-and-Notices/ACLs/2025/25-36.pdf', pp: 4 },
  'ACL 25-50': { url: 'https://www.cdss.ca.gov/Portals/9/Additional-Resources/Letters-and-Notices/ACLs/2025/25-50.pdf', pp: 7 },
  'ACL 25-65': { url: 'https://www.cdss.ca.gov/Portals/9/Additional-Resources/Letters-and-Notices/ACLs/2025/25-65.pdf', pp: 4 },
  'ACL 25-68': { url: 'https://www.cdss.ca.gov/Portals/9/Additional-Resources/Letters-and-Notices/ACLs/2025/25-68.pdf', pp: 10 },
  'ACL 25-78': { url: 'https://www.cdss.ca.gov/Portals/9/Additional-Resources/Letters-and-Notices/ACLs/2025/25-78.pdf', pp: 7 },
  // Medi-Cal letters · federal regulations · MPP (7)
  'ACWDL 23-14E': { url: 'https://www.dhcs.ca.gov/services/medi-cal/eligibility/letters/Documents/23-14E.pdf', pp: 17 },
  'ACWDL 25-18': { url: 'https://www.dhcs.ca.gov/services/medi-cal/eligibility/letters/Documents/25-18.pdf', pp: 9 },
  '7 CFR 273.9': { url: 'https://www.ecfr.gov/current/title-7/subtitle-B/chapter-II/subchapter-C/part-273/section-273.9' },
  '7 CFR 275.16': { url: 'https://www.ecfr.gov/current/title-7/subtitle-B/chapter-II/subchapter-C/part-275/section-275.16' },
  'MPP 42': { url: 'https://www.cdss.ca.gov/inforesources/letters-regulations/legislation-and-regulations/calworks-calfresh-regulations/eligibility-and-assistance-standards' },
  'MPP 44': { url: 'https://www.cdss.ca.gov/inforesources/letters-regulations/legislation-and-regulations/calworks-calfresh-regulations/eligibility-and-assistance-standards' },
  'MPP 63': { url: 'https://www.cdss.ca.gov/inforesources/letters-regulations/legislation-and-regulations/calworks-calfresh-regulations/calfresh-regulations' },
};

const BENEFITSCAL = 'https://benefitscal.com';

// CODE(): renders an inline id chip; auto-links it to the official source when known.
const CODE = (s: string): ReactNode => {
  const d = DOC[s];
  return d ? (
    <a href={d.url} target="_blank" rel="noopener noreferrer" className="g-code" style={{ color: 'var(--primary)', textDecoration: 'none' }}>{s}</a>
  ) : (
    <span className="g-code">{s}</span>
  );
};

// ---- Primary-source citations, grouped by domain ----
type Row = { source: ReactNode; id: ReactNode; proves: ReactNode };
const CITATION_GROUPS: { domain: string; rows: Row[] }[] = [
  {
    domain: 'Rules engine & EDBC',
    rows: [
      {
        source: <>CDSS ACIN I-46-25 + Attachment I</>,
        id: <>{CODE('ACIN I-46-25')} · FFY2026</>,
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
        id: <>{CODE('ACWDL 25-18')} · 2025</>,
        proves:
          'Medi-Cal income thresholds: 138% adult / 266% children / 213% pregnant; $1,801 aged & disabled standard.',
      },
      {
        source: 'CAPI / SSI-SSP payment standards',
        id: <>{CODE('CIT-0010-25')} · 2025 → 2026</>,
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
            <span className="g-chip gold" style={{ marginLeft: 4 }}>Cornerstone</span>
          </>
        ),
        id: CODE('CIT-0355-22'),
        proves:
          'Nov 2022, 146 pp. Org hierarchy, Worker-ID format, Global/Local/Task navigation, the task & automated-action model, 29 roles / 1,498 security groups, and county-configurable authorization + issuance thresholds.',
      },
      {
        source: 'CalSAWS Yellow Banner job aids',
        id: <>{CODE('CIT-0169-23')} · {CODE('CIT-0074-23')}</>,
        proves:
          'EDBC data-mismatch procedure and the verbatim banner “Full Case Review is required before EDBC is run and authorized,” with block-until-resolved behavior.',
      },
      {
        source: 'CalSAWS e-Application · Migration Training Guide',
        id: <>{CODE('CIT-0240-21')} · {CODE('CIT-0136-21')}</>,
        proves:
          'Intake and worker training: Regular Intake vs. Add-a-Program, person clearance, application registration — and the 28-week training anchor.',
      },
      {
        source: <><a href={BENEFITSCAL} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--primary)', textDecoration: 'none' }}>benefitscal.com</a></>,
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
        id: <>{CODE('CIT-0038-23')} · {CODE('CIT-0006-25')}</>,
        proves:
          'The real report catalog: CF 296 / CA 237 CW / CA 255 structures, business-day cadences, and Scheduled vs. On-Request delivery.',
      },
      {
        source: 'DHCS county performance standards',
        id: <>Article 25 · {CODE('ACWDL 23-14E')}</>,
        proves:
          'Medi-Cal timeliness: the 90%-within-45/90-day standards behind the Timeliness dashboard.',
      },
      {
        source: 'USDA FNS SNAP standards',
        id: <>{CODE('7 CFR 275.16')} · APT guidance</>,
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
    source: <>{CODE('ACIN I-46-25')} (eff. 10/2025)</>,
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
    impact: <>Window corrected to <strong>4 months</strong>, encoded in the engine and pinned by a unit test.</>,
  },
  {
    what: (
      <>
        Report names used pre-2016 legacy labels; research aligned them to the current CalSAWS catalog
        (DFA 296 → <strong>CF 296</strong>; CA 237 CW = caseload movement, not applications; CA 800 = fiscal
        claiming, not error rates).
      </>
    ),
    source: <>Reports Overview ({CODE('CIT-0038-23')}) · Reports Navigation ({CODE('CIT-0006-25')})</>,
    impact: <>The Reports tab now carries the statutory names counties recognize — <strong>CF 296 · CA 237 CW · CA 255</strong>.</>,
  },
];

// ---- Full source inventory (each chip links to the official document) ----
const CIT_IDS = [
  'CIT-0006-25', 'CIT-0008-26', 'CIT-0010-25', 'CIT-0017-22', 'CIT-0019-21', 'CIT-0030-22', 'CIT-0038-23',
  'CIT-0039-23', 'CIT-0071-20', 'CIT-0074-23', 'CIT-0076-23', 'CIT-0089-20', 'CIT-0099-24', 'CIT-0103-22',
  'CIT-0135-21', 'CIT-0136-21', 'CIT-0148-20', 'CIT-0148-24', 'CIT-0150-22', 'CIT-0169-23', 'CIT-0173-22',
  'CIT-0179-23', 'CIT-0198-23', 'CIT-0206-23', 'CIT-0229-21', 'CIT-0239-22', 'CIT-0240-21', 'CIT-0248-23',
  'CIT-0287-22', 'CIT-0290-23', 'CIT-0294-22', 'CIT-0313-23', 'CIT-0340-23', 'CIT-0354-22', 'CIT-0355-22',
];
const ACIN_IDS = ['ACIN I-15-26', 'ACIN I-19-16', 'ACIN I-33-21', 'ACIN I-45-24', 'ACIN I-46-25', 'ACIN I-48-23', 'ACIN I-61-24'];
const ACL_IDS = ['ACL 08-30', 'ACL 16-39E', 'ACL 17-98', 'ACL 18-117', 'ACL 21-130', 'ACL 21-130E', 'ACL 23-83', 'ACL 24-55', 'ACL 24-63', 'ACL 25-36', 'ACL 25-50', 'ACL 25-65', 'ACL 25-68', 'ACL 25-78'];
const OTHER_IDS = ['ACWDL 23-14E', 'ACWDL 25-18', '7 CFR 273.9', '7 CFR 275.16', 'MPP 42', 'MPP 44', 'MPP 63'];

const Chips = ({ ids }: { ids: string[] }) => (
  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>{ids.map((id) => <span key={id}>{CODE(id)}</span>)}</div>
);

export default function Page() {
  return (
    <div className="g-stack">
      {/* ---------- Intro ---------- */}
      <div>
        <div className="g-eyebrow">Reference material</div>
        <h2 className="g-h2">Requirements extracted from the real government record</h2>
        <p className="g-lede">
          The AI didn&rsquo;t invent the rules — it <strong>read them</strong>. Every threshold, standard,
          banner, and report name in this platform traces to a real public source: a CalSAWS configuration or
          job-aid document, a CDSS all-county letter, a federal regulation, or the live BenefitsCal application.
          Below is every one — <strong>linked to the actual document.</strong>
        </p>
      </div>

      {/* ---------- WOW: documents + pages ---------- */}
      <div className="g-grid g-grid-3">
        <div className="g-stat">
          <div className="g-stat-v">63</div>
          <div className="g-stat-l">primary-source documents</div>
          <div className="g-stat-d">35 CalSAWS CITs · 7 ACINs · 14 ACLs · 2 Medi-Cal letters · 2 federal regs · 3 MPP divisions</div>
        </div>
        <div className="g-stat">
          <div className="g-stat-v">1,118</div>
          <div className="g-stat-l">pages of source material</div>
          <div className="g-stat-d">measured — every PDF downloaded and page-counted (58 paginated documents; the CFR sections &amp; MPP divisions are web regulations)</div>
        </div>
        <div className="g-stat">
          <div className="g-stat-v" style={{ fontSize: 22 }}>851,506</div>
          <div className="g-stat-l">research tokens</div>
          <div className="g-stat-d">the 7-agent research fleet&rsquo;s metered reading &amp; extraction</div>
        </div>
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
                CalSAWS Configuration Guide — {CODE('CIT-0355-22')} (Nov 2022, 146 pages)
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
                <span className="g-code">19LS01220A</span> (Los Angeles), supervisor Angela Ruiz{' '}
                <span className="g-code">19LS01200S</span>.
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
          <span className="g-card-meta">the key sources, with what each establishes</span>
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

      {/* ---------- Full source inventory ---------- */}
      <section className="g-card">
        <div className="g-card-hd">
          <h3 className="g-card-title">Full source inventory</h3>
          <span className="g-card-meta">every document · 63 total · 1,118 measured pages · all linked</span>
        </div>
        <div className="g-card-bd">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div className="g-callout info">
              Every ID below links to the <strong>actual document</strong>. Page counts were measured by
              downloading each PDF and counting — the 58 paginated documents total <strong>1,118 pages</strong>;
              the 2 federal CFR sections and 3 MPP divisions are web regulations without a single page count.
            </div>
            <div>
              <div className="g-eyebrow" style={{ marginBottom: 8 }}>CalSAWS County Information Transmittals — 35 · 915 pp</div>
              <Chips ids={CIT_IDS} />
            </div>
            <div>
              <div className="g-eyebrow" style={{ marginBottom: 8 }}>CDSS All-County Information Notices (ACIN) — 7 · 50 pp</div>
              <Chips ids={ACIN_IDS} />
            </div>
            <div>
              <div className="g-eyebrow" style={{ marginBottom: 8 }}>CDSS All-County Letters (ACL) — 14 · 127 pp</div>
              <Chips ids={ACL_IDS} />
            </div>
            <div>
              <div className="g-eyebrow" style={{ marginBottom: 8 }}>Medi-Cal letters · federal regulations · MPP — 7 · 26 pp (2 ACWDL; CFR &amp; MPP are web regs)</div>
              <Chips ids={OTHER_IDS} />
            </div>
            <div>
              <div className="g-eyebrow" style={{ marginBottom: 8 }}>Live production reference</div>
              <a href={BENEFITSCAL} target="_blank" rel="noopener noreferrer" className="g-code" style={{ color: 'var(--primary)', textDecoration: 'none' }}>benefitscal.com — 94 recorded actions</a>
            </div>
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
              Research verified the engineering output against these same sources; where the code had drifted
              from current policy, it was corrected in the same session and pinned by a test. (The worked Maria
              example lives on the Introduction tab.)
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
    </div>
  );
}
