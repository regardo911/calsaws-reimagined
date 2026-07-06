// ============================================================================
// Golden-household test suite — ported from v1 (26 assertions, all must pass).
// Run: npm test
// ============================================================================
import { describe, it, expect } from 'vitest';
import { cloneParams } from '../src/lib/params';
import { runEDBC, type CaseSnapshot, type Program } from '../src/lib/engine';

const P = cloneParams();
const get = (out: ReturnType<typeof runEDBC>, prog: Program) =>
  out.results.find(r => r.program === prog)!;

// GH1 — Maria: single mother, 2 kids, earned $1,600/mo, rent $1,400
const maria: CaseSnapshot = {
  persons: [
    { id: 'p1', name: 'Maria Reyes', age: 29, role: 'primary', citizen: true, employed: true },
    { id: 'p2', name: 'Sofia Reyes', age: 7, role: 'member', citizen: true },
    { id: 'p3', name: 'Diego Reyes', age: 4, role: 'member', citizen: true },
  ],
  income: [{ personId: 'p1', kind: 'earned', subtype: 'wages', amount: 1600 }],
  resources: [{ kind: 'liquid', value: 250 }],
  expenses: [{ kind: 'rent', amount: 1400 }, { kind: 'utilities', amount: 180 }],
  flags: {}, dataMatches: [],
};

describe('GH1 Maria — CF $686 / CW $675 / MC children', () => {
  const out = runEDBC(P, maria, ['CF', 'CW', 'MC']);
  it('CF eligible', () => expect(get(out, 'CF').status).toBe('Eligible'));
  // FFY2026: gross 1600 ≤ 4442; net = 1600−320−209 = 1071; shelter 1400+663=2063,
  // half-adj 535.5, excess 1527.5→cap 744; net 327; allot = 785 − ceil(98.1)=99 → 686
  it('CF allotment $686', () => expect(get(out, 'CF').amount).toBe(686));
  it('CF not expedited', () => expect(get(out, 'CF').expedited).toBeFalsy());
  it('CW eligible', () => expect(get(out, 'CW').status).toBe('Eligible'));
  // applicant 1600−450=1150 < MBSAC(3) 1892; grant: 1600−600=1000, 50% → 500; MAP(3) 1175−500=675
  it('CW grant $675', () => expect(get(out, 'CW').amount).toBe(675));
  it('MC eligible', () => expect(get(out, 'MC').status).toBe('Eligible'));
  it('MC both children eligible', () => {
    const kids = get(out, 'MC').members!.filter(m => m.category === 'MAGI Child');
    expect(kids).toHaveLength(2);
    expect(kids.every(k => k.eligible)).toBe(true);
  });
  it('traces present', () => {
    expect(get(out, 'CF').trace.length).toBeGreaterThanOrEqual(5);
    expect(get(out, 'CW').trace.length).toBeGreaterThanOrEqual(3);
    expect(get(out, 'MC').trace.length).toBeGreaterThanOrEqual(3);
  });
});

// GH2 — James: single adult, no income, $40 bank, homeless
const james: CaseSnapshot = {
  persons: [{ id: 'p1', name: 'James Carter', age: 42, role: 'primary', citizen: true }],
  income: [],
  resources: [{ kind: 'liquid', value: 40 }],
  expenses: [],
  flags: { homeless: true }, dataMatches: [],
};

describe('GH2 James — Expedited / CF $298 / GA $221 / MC adult', () => {
  const out = runEDBC(P, james, ['CF', 'GA', 'MC']);
  it('CF expedited flagged', () => expect(get(out, 'CF').expedited).toBe(true));
  it('CF eligible', () => expect(get(out, 'CF').status).toBe('Eligible'));
  it('CF max allotment $298', () => expect(get(out, 'CF').amount).toBe(298));
  it('GA eligible', () => expect(get(out, 'GA').status).toBe('Eligible'));
  it('GA grant $221', () => expect(get(out, 'GA').amount).toBe(221));
  it('MC adult eligible', () => {
    expect(get(out, 'MC').status).toBe('Eligible');
    expect(get(out, 'MC').members![0].eligible).toBe(true);
  });
});

// GH3 — Nguyen household: 4 people, $5,800/mo earned
const nguyen: CaseSnapshot = {
  persons: [
    { id: 'p1', name: 'Linh Nguyen', age: 38, role: 'primary', citizen: true, employed: true },
    { id: 'p2', name: 'Minh Nguyen', age: 40, role: 'member', citizen: true, employed: true },
    { id: 'p3', name: 'An Nguyen', age: 10, role: 'member', citizen: true },
    { id: 'p4', name: 'Bao Nguyen', age: 12, role: 'member', citizen: true },
  ],
  income: [
    { personId: 'p1', kind: 'earned', subtype: 'wages', amount: 3000 },
    { personId: 'p2', kind: 'earned', subtype: 'wages', amount: 2800 },
  ],
  resources: [{ kind: 'liquid', value: 4200 }],
  expenses: [{ kind: 'rent', amount: 2400 }, { kind: 'utilities', amount: 250 }],
  flags: {}, dataMatches: [],
};

describe('GH3 Nguyen — CF/CW denied, MC children-only', () => {
  const out = runEDBC(P, nguyen, ['CF', 'CW', 'MC']);
  it('CF ineligible on gross test', () => {
    expect(get(out, 'CF').status).toBe('Ineligible');
    expect(get(out, 'CF').reasons.some(r => r.code === 'CF-G01')).toBe(true);
  });
  it('CW ineligible', () => expect(get(out, 'CW').status).toBe('Ineligible'));
  it('MC children-only eligible', () => {
    const mc = get(out, 'MC');
    expect(mc.status).toBe('Eligible');
    expect(mc.members!.filter(m => m.category === 'MAGI Child' && m.eligible)).toHaveLength(2);
    expect(mc.members!.filter(m => m.category === 'MAGI Adult' && m.eligible)).toHaveLength(0);
  });
});

// GH4 — Robert: 68, non-citizen, SSI-ineligible due to immigration, $800/mo unearned
const robert: CaseSnapshot = {
  persons: [{ id: 'p1', name: 'Robert Okafor', age: 68, role: 'primary', citizen: false, aged: true, ssiIneligibleImmigration: true }],
  income: [{ personId: 'p1', kind: 'unearned', subtype: 'pension', amount: 800 }],
  resources: [{ kind: 'liquid', value: 900 }],
  expenses: [{ kind: 'rent', amount: 700 }],
  flags: {}, dataMatches: [],
};

describe('GH4 Robert — CAPI $453 / MC aged', () => {
  const out = runEDBC(P, robert, ['CAPI', 'MC']);
  it('CAPI eligible', () => expect(get(out, 'CAPI').status).toBe('Eligible'));
  // floor(1233.94 − (800−20)) = floor(453.94) = 453
  it('CAPI payment $453', () => expect(get(out, 'CAPI').amount).toBe(453));
  it('MC aged eligible', () => {
    const mc = get(out, 'MC');
    expect(mc.status).toBe('Eligible');
    expect(mc.members![0].category).toBe('Non-MAGI Aged/Disabled');
    expect(mc.members![0].eligible).toBe(true);
  });
});

// GH5 — Yellow banner blocks EDBC; resolving unblocks
describe('GH5 Yellow Banner — block and resolve', () => {
  const banner: CaseSnapshot = {
    ...maria,
    dataMatches: [{ source: 'IEVS (EDD wages)', field: 'earned income', reported: 1600, matched: 2400, resolved: false }],
  };
  it('EDBC blocked by yellow banner', () => {
    const out = runEDBC(P, banner, ['CF', 'CW']);
    expect(out.blocked).toBe(true);
    expect(out.yellowBanner).toHaveLength(1);
  });
  it('resolves and runs', () => {
    const resolved: CaseSnapshot = { ...banner, dataMatches: [{ ...banner.dataMatches[0], resolved: true }] };
    const out = runEDBC(P, resolved, ['CF', 'CW']);
    expect(out.blocked).toBe(false);
    expect(out.results).toHaveLength(2);
  });
});

// Extras — RCA window + admin-param sensitivity
describe('RCA + param sensitivity', () => {
  const amir: CaseSnapshot = {
    persons: [{ id: 'p1', name: 'Amir Haidari', age: 31, role: 'primary', citizen: false, refugee: true, arrivalMonthsAgo: 3 }],
    income: [{ personId: 'p1', kind: 'earned', subtype: 'wages', amount: 300 }],
    resources: [], expenses: [], flags: {}, dataMatches: [],
  };
  it('RCA eligible within 4-month window ($434)', () => {
    const out = runEDBC(P, amir, ['RCA']);
    expect(get(out, 'RCA').status).toBe('Eligible');
    expect(get(out, 'RCA').amount).toBe(434); // MAP(1) 734 − 300
  });
  it('RCA param change flips determination', () => {
    const P2 = cloneParams(); P2.rca.monthsEligible = 2;
    const out = runEDBC(P2, amir, ['RCA']);
    expect(get(out, 'RCA').status).toBe('Ineligible');
  });
  it('GA admin param raises grant to $400', () => {
    const P3 = cloneParams(); P3.ga.grant = 400;
    const out = runEDBC(P3, james, ['GA']);
    expect(get(out, 'GA').amount).toBe(400);
  });
});
