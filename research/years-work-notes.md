# years-work.ts notes (cards `yw-`, flags `yw_`, track 'work')

Written 2026-11-11. 42 cards. Game-design reference only, not legal advice. Every rule below was either already in `research/verified-law.md` / `research/verified-law-work.md` or read from the primary page on 2026-11-11.

Gates used in the table:
- **job** = `settled && mayWork && salary > 0` (OPT, STEM_OPT, H1B, O1, LPR, CITIZEN, ASYLEE, or any status with `ead`)
- **free** = job, not sponsored (H1B, O1, STEM_OPT) and not OPT
- **shadow** = `settled && (NONE, or ASY_PENDING / AOS_PENDING with no ead) && informalWork`
- "gap N" = may return N years after it was last answered (flag `yw_<key>Y` stores the year)

## Half one: lawful work

| Card id | Statuses | Year band | Legal source used |
|---|---|---|---|
| yw-review | job | 1+, gap 3 | none |
| yw-raise | job (text branches for sponsored) | 2+, gap 3 | none |
| yw-pay-gap | job (sponsored get a "what would a move mean" choice) | 3+, gap 6 | H1B only: 8 CFR 214.2(h)(2)(i)(D), (H) (verified-law-work items 10, 11) |
| yw-new-manager | job (branches for sponsored) | 2+, gap 5 | none |
| yw-passed-over | job | 4+, gap 7 | 29 CFR 1606.1; 42 U.S.C. 2000e-5(e)(1) |
| yw-first-reports | job, career 45+ (H1B/O1 branch) | 5+, once | 8 CFR 214.2(h)(2)(i)(E); 8 CFR 214.2(o)(2)(iv)(D) |
| yw-accent | job | 1+, gap 7 | 29 CFR 1606.1; 42 U.S.C. 2000e-5(e)(1) |
| yw-mentor | job | 4+, gap 5 | none |
| yw-reorg | job (sponsored branch; no job loss) | 2+, gap 4 | 8 CFR 214.1(l)(2) (verified-law); STEM OPT: 8 CFR 214.2(f)(10)(ii)(E), (f)(12)(ii)(A) (verified-law-work items 3, 4) |
| yw-offer | job except H1B and OPT (H1B is owned by `work-h1b-portability`); O1 and STEM_OPT do not move | 3+, gap 4 | O1: 8 CFR 214.2(o)(2)(iv)(C) (item 22); STEM OPT: 8 CFR 214.2(f)(10)(ii)(C)(5), (6), (f)(12)(ii)(A) (items 4, 5) |
| yw-licence | free, age 27+ | 1 to 8, once | none (says only that licences are issued state by state) |
| yw-licence-exam | free, after yw-licence "start" | until passed or stopped | none |
| yw-evening-class | free (gated away from sponsored and OPT: study rules for them not verified) | 2+, gap 6 | none |
| yw-burnout | job, wellbeing 55 or less | 3+, gap 4 | 29 U.S.C. 2611(2), 2611(4), 2612(a)(1)(D) |
| yw-injury | job | 3+, gap 8 | 29 U.S.C. 660(c); dol.gov workers' compensation page |
| yw-own-idea | LPR, CITIZEN start a business; H1B, O1 may only plan | 4+, gap 5, until a business exists | 8 CFR 214.1(e); 8 CFR 214.2(h)(2)(i)(C); 214.2(o)(2)(iv)(B) (items 11, 12, 22) |
| yw-first-hire | LPR, CITIZEN with `yw_ownBusiness` | 2+ years after the business starts | 8 CFR 274a.2(b)(1)(ii); USCIS I-9 Central employee rights |
| yw-business-taxes | LPR, CITIZEN with `yw_ownBusiness` | February to April, gap 3 | irs.gov Self-employment tax; irs.gov Estimated taxes |
| yw-business-slow | LPR, CITIZEN with `yw_ownBusiness` | 3+ years after start, gap 5 | none |
| yw-retirement-plan | job | 5+, once | none (no plan rule stated) |
| yw-forty-credits | LPR, CITIZEN, ASYLEE with a job | 10+, once | 20 CFR 404.110(b); 20 CFR 404.143 |
| yw-senior | job | 12+, gap 6 | none |
| yw-i9-documents | LPR, ASYLEE, pending with ead | 2+, gap 9 | 8 U.S.C. 1324b(a)(6); USCIS I-9 Central employee rights |
| yw-name | job | 1 to 6, once | none |
| yw-day-that-matters | job | 1+, gap 6 | none |
| yw-always-yes | H1B, O1, STEM_OPT | 1+, gap 4 | none |
| yw-empty-desks | job (others are cut; the player keeps the job) | 5+, gap 7 | none |
| yw-asked-to-speak | job | 6+, gap 7 | none |
| yw-new-tools | job | 11+, gap 6 | 29 U.S.C. 631(a) |
| yw-who-comes-after | job (business-owner variant) | 15+, gap 8 | none |

## Half two: no work permit (consequences only)

| Card id | Statuses | Year band | Legal source used |
|---|---|---|---|
| yw-u-wages | shadow | 2+, gap 5 | DOL WHD Fact Sheet 48; 29 U.S.C. 255(a) |
| yw-u-unsafe | shadow | 1+, gap 5 | osha.gov/workers; 29 U.S.C. 660(c) |
| yw-u-overtime-threat | shadow | 2+, gap 6 | 29 U.S.C. 215(a)(3); 29 U.S.C. 207(a)(1); DOL Fact Sheet 48 |
| yw-u-same-pay | shadow | 7+, gap 6 | DOL Fact Sheet 48; 29 U.S.C. 207(a)(1) |
| yw-u-body | shadow | 9+, gap 5 | none |
| yw-u-form | shadow | 3+, gap 6 | 8 CFR 274a.2(b)(1)(ii); INA 212(a)(6)(C)(ii) |
| yw-u-tax-number | shadow | 5+, February to April, gap 7 | irs.gov ITIN; irs.gov How to renew an ITIN |
| yw-u-teach | shadow | 6+, gap 5 | none |
| yw-u-keys | shadow | 5+, once | none |
| yw-u-hurt | shadow | 2+, gap 7 | dol.gov workers' compensation page |
| yw-u-old-age | shadow | 11+, gap 6 | irs.gov ITIN; INA 212(a)(9)(B) (verified-law) |
| yw-u-built | shadow | 6+, gap 7 | none |

## New rules read for this file (2026-11-11)

| Rule as used | Source |
|---|---|
| National origin discrimination includes denial of equal opportunity because a person "has the physical, cultural or linguistic characteristics of a national origin group" | 29 CFR 1606.1, https://www.law.cornell.edu/cfr/text/29/1606.1 |
| A discrimination charge is filed within 180 days of the act, or 300 days where a state or local agency has authority | 42 U.S.C. 2000e-5(e)(1), https://www.law.cornell.edu/uscode/text/42/2000e-5 ; same on https://www.eeoc.gov/time-limits-filing-charge |
| H-1B: the petitioner must file an amended or new petition "to reflect any material changes in the terms and conditions of employment" | 8 CFR 214.2(h)(2)(i)(E), https://www.law.cornell.edu/cfr/text/8/214.2 |
| O-1: the petitioner files an amended petition to reflect material changes in the terms and conditions of employment | 8 CFR 214.2(o)(2)(iv)(D), same page |
| FMLA: 12 workweeks of leave in 12 months for a serious health condition; eligible after 12 months and 1,250 hours; employer of 50 or more; excluded if fewer than 50 employees within 75 miles | 29 U.S.C. 2611(2), 2611(4), https://www.law.cornell.edu/uscode/text/29/2611 ; 29 U.S.C. 2612(a)(1)(D), https://www.law.cornell.edu/uscode/text/29/2612 |
| No one may fire or discriminate against an employee for a safety complaint; a retaliation complaint is filed within 30 days | 29 U.S.C. 660(c)(1), (2), https://www.law.cornell.edu/uscode/text/29/660 |
| A worker or representative may file a confidential safety complaint; it is illegal to retaliate; whistleblower complaint within 30 days; OSHA covers most private sector employers and workers | https://www.osha.gov/workers ; https://www.osha.gov/workers/file-complaint |
| Private-sector workers hurt on the job contact their state workers' compensation board | https://www.dol.gov/general/topic/workcomp |
| The employer must examine documents and complete Form I-9 section 2 within three business days of the hire | 8 CFR 274a.2(b)(1)(ii), https://www.law.cornell.edu/cfr/text/8/274a.2 |
| Asking for more or different documents than required, or refusing documents that reasonably appear genuine, with intent to discriminate, is an unfair immigration-related employment practice | 8 U.S.C. 1324b(a)(6), https://www.law.cornell.edu/uscode/text/8/1324b |
| The employer must let the worker choose which documents to show and cannot ask for a specific one such as a US passport or green card, including at reverification | https://www.uscis.gov/i-9-central/employee-rights-and-resources/employee-rights |
| A false claim of US citizenship for any purpose or benefit under the Act (including section 274A, employment verification) or other federal or state law makes a person inadmissible | INA 212(a)(6)(C)(ii), 8 U.S.C. 1182(a)(6)(C)(ii), https://www.law.cornell.edu/uscode/text/8/1182 |
| WHD "will continue to enforce the FLSA and MSPA without regard to whether an employee is documented or undocumented"; back pay is for hours actually worked | DOL WHD Fact Sheet 48, https://www.dol.gov/agencies/whd/fact-sheets/48-hoffman-plastics |
| Wage claims: two years, three for a willful violation | 29 U.S.C. 255(a), https://www.law.cornell.edu/uscode/text/29/255 |
| Unlawful to discharge or discriminate against an employee who filed a wage complaint | 29 U.S.C. 215(a)(3), https://www.law.cornell.edu/uscode/text/29/215 |
| Overtime at one and one-half times the regular rate over forty hours in a workweek | 29 U.S.C. 207(a)(1), https://www.law.cornell.edu/uscode/text/29/207 |
| An ITIN is for federal tax purposes only; it does not qualify for Social Security benefits, change immigration status or authorize work | https://www.irs.gov/tin/itin/individual-taxpayer-identification-number-itin |
| An ITIN not used on a federal return for three consecutive tax years expires on 31 December after the third year; it must be renewed if it will be on a return | https://www.irs.gov/tin/itin/how-to-renew-an-itin |
| Self-employment tax is 15.3 percent (12.4 Social Security, 2.9 Medicare) | https://www.irs.gov/businesses/small-businesses-self-employed/self-employment-tax-social-security-and-medicare-taxes |
| Estimated tax: generally required if you expect to owe $1,000 or more; four payment periods; a penalty may apply if too little is paid by each due date even if a refund is due | https://www.irs.gov/businesses/small-businesses-self-employed/estimated-taxes |
| Fully insured for old-age benefits needs up to 40 quarters of coverage; no more than four per calendar year | 20 CFR 404.110(b), https://www.law.cornell.edu/cfr/text/20/404.110 ; 20 CFR 404.143, https://www.law.cornell.edu/cfr/text/20/404.143 |
| Age discrimination law covers people at least 40 | 29 U.S.C. 631(a), https://www.law.cornell.edu/uscode/text/29/631 |

## Not verified, so left out or gated away

- ssa.gov returned 403; the forty-credit rule comes from the regulation, not the SSA page. The dollar amount per credit is not stated.
- Whether OSHA and state workers' compensation cover workers regardless of immigration status: not found in a primary source, so no card says so. The cards say only that a complaint can be confidential, that retaliation is illegal, and that compensation is a state matter to ask a worker centre about.
- Whether a promotion is a "material change" needing an amended petition: the card says it is a question for the company lawyer.
- Part-time study on H-1B or O-1, self-employment on OPT or with a (c)(8)/(c)(9) work permit, and whether an asylee may run a business: not verified. `yw-evening-class`, `yw-licence` and the business cards are gated away from those statuses.
- 401(k) rules (vesting, limits, early withdrawal): none stated.
- All dollar amounts are designed estimates in 2025 dollars passed through `cost()`.

## Flags

Set: `salary` (raised only, from `num(s, 'salary')`), `yw_ownBusiness`, `yw_bizStart`, `yw_bizPlan`, `yw_bizClosed`, `yw_hired`, `yw_manager`, `yw_leadOffer`, `yw_mentor`, `yw_cert`, `yw_relicense`, `yw_licensed`, `yw_licenceSeen`, `yw_retire`, `yw_retireSeen`, `yw_ssChecked`, `yw_nameSeen`, `yw_hoursBook`, `yw_hurt`, `yw_crewLead`, `yw_keysSeen`, `yw_itinKept`, and one `yw_<key>Y` year marker per repeating card.
Read from other files: `status`, `salary`, `ead`, `informalWork`, `yf_child`, `marriedCitizen`.
`jobTitle` is never changed.
