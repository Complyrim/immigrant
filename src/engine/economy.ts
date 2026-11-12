import { getCity, srcNum } from './data';
import { cultureOf } from './country';
import type { BudgetLine, CommuteMode, Funding, Profile } from './types';

/**
 * Illustrative monthly economy for a student. City rents, transit passes and car
 * costs come from the research data (with their own estimate flags). Funding
 * amounts, food and phone/insurance are designed values and always flagged
 * "estimate". Costs are scaled back from 2025 for earlier arrival years.
 */
const INFLATION = 0.035;

export function priceFactor(year: number): number {
  return Math.pow(1 + INFLATION, year - 2025);
}

export const START_MONEY: Record<Funding, number> = {
  family: 6000,
  loan: 5000,
  scholarship: 4000,
  assistantship: 3500,
};

const INCOME: Record<Funding, { amount: number; label: string; borrowed: boolean }> = {
  family: { amount: 1900, label: 'Money from family', borrowed: false },
  loan: { amount: 1650, label: 'Education loan disbursement', borrowed: true },
  scholarship: { amount: 1500, label: 'Family top-up and living stipend (scholarship covers tuition)', borrowed: false },
  assistantship: { amount: 2200, label: 'Assistantship stipend', borrowed: false },
};

const FOOD = { frugal: 320, balanced: 450, comfortable: 620 } as const;

export interface CommuteInfo {
  mode: CommuteMode;
  cost: number;
  minutesOneWay: number;
  wellbeingPerMonth: number;
  estimate: boolean;
  summary: string;
}

export function commuteInfo(p: Profile, mode: CommuteMode): CommuteInfo {
  const city = getCity(p.cityId);
  const avg = srcNum(city.avgCommuteMin, 28);
  const f = priceFactor(p.arrivalYear);
  let cost = 0;
  let minutes = avg.value;
  let wb = 0;
  let estimate = avg.estimate;
  let summary = '';
  switch (mode) {
    case 'walk':
      cost = 0;
      minutes = Math.max(12, Math.round(avg.value * 0.7));
      wb = 1.2;
      summary = 'Free and healthy, but only works close to campus.';
      estimate = true;
      break;
    case 'bike':
      cost = 18 * f;
      minutes = Math.round(avg.value * 0.8);
      wb = 0.9;
      summary = 'Cheap and active; weather and traffic safety matter.';
      estimate = true;
      break;
    case 'transit': {
      const pass = srcNum(city.transitPass, 90);
      cost = pass.value * f;
      minutes = Math.round(avg.value * 1.1);
      wb = 0;
      summary = 'Predictable cost and time; crowded at peak.';
      estimate = estimate || pass.estimate;
      break;
    }
    case 'car': {
      const car = srcNum(city.carMonthly, 180);
      cost = (car.value + 190) * f; // insurance data plus fuel and parking allowance
      minutes = Math.round(avg.value * 0.9);
      wb = -0.4;
      summary = 'Most flexible but the costliest; traffic stress adds up.';
      estimate = true;
      break;
    }
    case 'rideshare':
      cost = 22 * 15 * f;
      minutes = Math.round(avg.value * 0.8);
      wb = 0.1;
      summary = 'Comfortable and fast, and hard on a student budget.';
      estimate = true;
      break;
  }
  if (minutes > 40) wb -= (minutes - 40) * 0.04;
  return { mode, cost: Math.round(cost), minutesOneWay: minutes, wellbeingPerMonth: Math.round(wb * 10) / 10, estimate, summary };
}

export function monthlyBudget(p: Profile, flags: Record<string, boolean | number | string> = {}): BudgetLine[] {
  const city = getCity(p.cityId);
  const f = priceFactor(p.arrivalYear);
  const lines: BudgetLine[] = [];
  const inc = INCOME[p.funding];
  const oos = Boolean(flags.outOfStatus);
  const status = String(flags.status ?? 'F1');
  const student = status === 'F1' || (Boolean(flags.formerStudent) && status === 'NONE' && p.status === 'F1');
  // Money from home is harder to send from some countries (see each country file's note).
  const fam = cultureOf(p.country)?.familySupportFactor ?? 1;
  const famScaled = (amount: number, funding: Funding): number => (funding === 'family' || funding === 'scholarship' ? amount * fam : amount);
  // The setup funding choice (family, loan, scholarship, assistantship) belongs to the F-1 route. Someone who arrived
  // another way and later became a student pays from savings and family help instead.
  const ownFunding = p.status === 'F1';
  if (student) {
    if (!oos && !ownFunding) {
      lines.push({ label: 'Savings and family help while you study', amount: Math.round(1300 * fam * f), estimate: true });
    } else if (!oos) {
      lines.push({ label: inc.label, amount: Math.round(famScaled(inc.amount, p.funding) * f), estimate: true });
    } else if (!ownFunding) {
      // Savings carry on as before; nothing new arrives for the program.
    } else if (p.funding === 'family') {
      lines.push({ label: 'Money from family', amount: Math.round(inc.amount * 0.7 * fam * f), estimate: true });
    } else if (p.funding === 'scholarship') {
      lines.push({ label: 'Family top-up (scholarship ended)', amount: Math.round(600 * fam * f), estimate: true });
    }
    // Out of status: loan disbursements and stipends stop with the student record.
    if (flags.campusJob && !oos) lines.push({ label: 'On-campus job (authorized)', amount: Math.round(400 * f), estimate: true });
    if (flags.unauthWork && !oos) lines.push({ label: 'Cash work (unauthorized, risky)', amount: Math.round(650 * f), estimate: true });
  } else {
    const salary = Number(flags.salary ?? 0);
    if (salary > 0) {
      const title = flags.jobTitle ? ` (${String(flags.jobTitle)})` : '';
      lines.push({ label: `Pay after tax${title}`, amount: Math.round(salary * f), estimate: true });
    } else if (status === 'OPT' || status === 'STEM_OPT') {
      lines.push({ label: 'Help from family while you job-hunt', amount: Math.round(1150 * fam * f), estimate: true });
    } else if (status === 'B2') {
      lines.push({ label: 'Savings and help from hosts and family', amount: Math.round((1400 + (p.marital === 'married' ? 300 : 0)) * fam * f), estimate: true });
    } else if (status === 'ASY_PENDING') {
      lines.push({ label: 'Help from community groups and shelters', amount: Math.round(1300 * f), estimate: true });
    }
    if (flags.marriedCitizen) {
      lines.push({ label: "Your spouse's share of household costs", amount: Math.round(1400 * f), estimate: true });
    }
    if (p.status === 'F1' && p.funding === 'loan' && status !== 'NONE') {
      lines.push({ label: 'Education loan repayment', amount: -Math.round(300 * f), estimate: true });
    }
  }
  // Cash work is usually full-time; a former student still trying to return to school usually works part-time.
  if (flags.informalWork) lines.push({ label: 'Cash work (no authorization)', amount: Math.round((flags.formerStudent ? 1050 : 1900) * f), estimate: true });

  const oneBr = srcNum(city.rentOneBedroom, 1800);
  const shared = srcNum(city.rentSharedRoom, oneBr.value * 0.5);
  let rent = 0;
  let rentEstimate = false;
  if (p.housing === 'shared') {
    rent = shared.value;
    rentEstimate = shared.estimate;
  } else if (p.housing === 'studio') {
    rent = oneBr.value * 0.92;
    rentEstimate = oneBr.estimate;
  } else {
    rent = 250 / f; // contribution to relatives, not scaled twice
    rentEstimate = true;
  }
  // Hard times: a shelter bed or a friend's couch instead of rent, and food banks for part of the food.
  const hard = Boolean(flags.hardTimes);
  lines.push(hard ? { label: 'Rent (shelter or a friend\'s couch)', amount: 0, estimate: true } : { label: 'Rent', amount: -Math.round(rent * f), estimate: rentEstimate });

  lines.push({ label: hard ? 'Food (with food banks)' : 'Food', amount: -Math.round(FOOD[p.lifestyle] * (hard ? 0.4 : 1) * f), estimate: true });
  const c = commuteInfo(p, p.commute);
  lines.push({ label: 'Commute', amount: -c.cost, estimate: c.estimate });
  lines.push({ label: 'Phone, insurance and supplies', amount: -Math.round(150 * f), estimate: true });
  if (p.marital === 'married') {
    lines.push({ label: student ? 'Spouse (F-2 dependants may not work)' : 'Spouse and household', amount: -Math.round(300 * f), estimate: true });
  }
  return lines;
}

export function borrowedPerMonth(p: Profile, flags: Record<string, boolean | number | string> = {}): number {
  if (p.status !== 'F1' || flags.outOfStatus || String(flags.status ?? 'F1') !== 'F1') return 0;
  const inc = INCOME[p.funding];
  return inc.borrowed ? Math.round(inc.amount * priceFactor(p.arrivalYear)) : 0;
}

export function netMonthly(lines: BudgetLine[]): number {
  return lines.reduce((s, l) => s + l.amount, 0);
}
