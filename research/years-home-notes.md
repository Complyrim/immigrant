# years-home.ts notes (prefix `yh-`, flags `yh_`)

46 cards on home, money, health and daily life. All prices are designed estimates in 2025 dollars, scaled by `cost`.
"Settled" = any status except F1 and B2. "Documented" = OPT, STEM_OPT, H1B, O1, LPR, CITIZEN, ASYLEE. Bands are years since arrival.

| Card id | Statuses | Year band | Repeats | Legal source |
|---|---|---|---|---|
| yh-first-lease | settled | 1-6 | once | none (state rules, no claim) |
| yh-first-bed | settled | 1-5 | once | none |
| yh-rent-rise | settled, renters | 2+ | every 3y | none |
| yh-landlord-repairs | settled, renters | 1-9 (Dec-Feb) | every 4y | none |
| yh-building-sold | settled, renters | 5+ | once | none |
| yh-move-across-town | settled, renters | 3+ | every 5y | none |
| yh-renters-insurance | settled, renters | 2-9 | once | none |
| yh-flood | settled | 4+ | every 8y | none |
| yh-break-in | settled (text and first choice differ for NONE and pending) | 3+ | every 9y | none; deliberately states no rule on police reports without status |
| yh-neighbourhood-changing | settled | 9+ | every 7y | none |
| yh-host-newcomer | settled | 6+ | every 6y | none |
| yh-bank-account | NONE, ASY_PENDING, AOS_PENDING, ASYLEE with a job | 1-5 | once | none |
| yh-credit-card | documented | 1-7 | once | none |
| yh-identity-theft | documented, has yh_credit | 5+ | once | none |
| yh-tax-season | settled with a job | 1+ (Feb-Apr) | every 3y | IRS ITIN page (NONE branch) |
| yh-refund-promise | settled with a job | 2-12 (Feb-Apr) | once | none |
| yh-foreign-income | LPR, CITIZEN | 5+ (Feb-Apr) | once | IRS Taxation of U.S. residents; IRS green card test |
| yh-emergency-fund | settled with a job | 1+ | every 5y | none |
| yh-send-home | settled with a job | 1+ | every 3y | none |
| yh-lend-friend | settled | 2+ | every 6y | none |
| yh-scam-call | settled except CITIZEN | 1+ | every 6y | USCIS Common Scams |
| yh-consultant-storefront | NONE, ASY_PENDING, AOS_PENDING, OPT, ASYLEE | 1-12 | once | USCIS Common Scams |
| yh-drivers-licence | documented | 1-9 | once (returns after 2y if skipped) | 6 CFR 37.21 (temporary statuses only) |
| yh-first-car | documented, not NONE, has yh_licence | 2-12 | once | none |
| yh-car-trouble | settled, has yh_ownsCar | car 2y+ old | every 4y | none |
| yh-work-insurance | settled, salaried and may work | 1+ | every 5y | none |
| yh-marketplace-plan | LPR without a work plan | 1+ | every 4y | healthcare.gov lawfully present immigrants; 8 U.S.C. 1613(a) |
| yh-clinic-no-cover | NONE, ASY_PENDING | 1+ | every 4y | 8 U.S.C. 1611(b)(1); 42 U.S.C. 1395dd(a), (h) |
| yh-medical-bill | settled | 2+ | every 6y | none |
| yh-dental-emergency | settled | 2+ | every 7y | none |
| yh-reading-glasses | settled | 13+, or 7+ if age 42+ | once | none |
| yh-bad-back | settled | 8+ | every 6y | none |
| yh-checkup | settled | 11+ | every 6y | none |
| yh-cook-for-others | settled | 2+ | every 4y | none |
| yh-winter-bill | settled | 1-8 (Jan-Mar) | every 5y | none |
| yh-down-payment | LPR, CITIZEN with a salary | 5-16 | once | none |
| yh-house-or-wait | H1B, O1, AOS_PENDING with a salary | 5+ | once | none; deliberately states no lending rule |
| yh-buy-home | LPR, CITIZEN, yh_saving, cash >= about $28k | 7+ | once (returns after 3y if passed) | none |
| yh-home-repair | settled, has yh_ownsHome | 1y+ after buying | every 4y | none |
| yh-home-costs-rise | settled, has yh_ownsHome | 2y+ after buying | every 5y | none |
| yh-retirement-start | settled, salaried and may work | 7+ | once (returns after 5y if skipped) | none |
| yh-retirement-raid | settled, has yh_retire | 10+ | every 8y | IRS early distributions page |
| yh-social-security-record | LPR, CITIZEN | 10+ | once | 42 U.S.C. 414(a)(2) |
| yh-papers-in-order | settled | 11+ | once (returns after 4y if skipped) | none |
| yh-where-to-grow-old | settled, cash >= about $12k | 12+ | once | none |
| yh-old-furniture | settled | 11+ | once | none |

## Rules relied on (all opened 2026-11-11)

| Rule as used | Source |
|---|---|
| ITIN: issued to people with a federal tax purpose who are not eligible for an SSN; does not authorize work, does not provide or change immigration status, does not qualify for Social Security benefits | https://www.irs.gov/tin/itin/individual-taxpayer-identification-number-itin |
| US tax residents are taxed like citizens on worldwide income, whether earned inside or outside the US | https://www.irs.gov/individuals/international-taxpayers/taxation-of-us-residents |
| Green card test: a lawful permanent resident at any time in the calendar year is a US tax resident | https://www.irs.gov/individuals/international-taxpayers/us-tax-residency-green-card-test |
| Additional 10% tax on retirement plan withdrawals before age 59 and a half unless an exception applies | https://www.irs.gov/retirement-plans/plan-participant-employee/retirement-topics-exceptions-to-tax-on-early-distributions |
| USCIS never asks for fees by phone or email to a person; does not accept gift cards or money transfer services; a notario is not authorized to give immigration legal services; only licensed attorneys or accredited representatives of DOJ-recognized organizations may advise and represent | https://www.uscis.gov/scams-fraud-and-misconduct/avoid-scams/common-scams |
| REAL ID temporary or limited-term licence: only for temporary lawful status; may not run past the authorized stay, or one year if no end date; renewal needs proof status is still in effect | 6 CFR 37.21, https://www.law.cornell.edu/cfr/text/6/37.21 |
| Hospital emergency department must give a medical screening to any individual, and may not delay it to ask about payment or insurance | 42 U.S.C. 1395dd(a), (h), https://www.law.cornell.edu/uscode/text/42/1395dd |
| Non-qualified aliens are barred from federal public benefits, except emergency medical treatment, immunizations, and testing and treatment of communicable disease symptoms | 8 U.S.C. 1611(a), (b)(1), https://www.law.cornell.edu/uscode/text/8/1611 |
| Qualified aliens wait 5 years for federal means-tested benefits (refugees and asylees excepted) | 8 U.S.C. 1613(a), (b), https://www.law.cornell.edu/uscode/text/8/1613 |
| Certain lawfully present immigrants can buy Marketplace coverage; from January 1, 2027 premium savings are limited to LPRs, Cuban or Haitian entrants and COFA migrants; Medicaid generally 5 years after qualified status | https://www.healthcare.gov/immigrants/lawfully-present-immigrants/ |
| Fully insured for Social Security with 40 quarters of coverage | 42 U.S.C. 414(a)(2), https://www.law.cornell.edu/uscode/text/42/414 |

## Not verified, so left out or kept general
- Substantial presence test and student exemption years (page read, but no card states a residency rule for OPT or H-1B holders).
- State driver's licence rules for people without status or with pending cases: licence and car cards are gated away from NONE, ASY_PENDING and AOS_PENDING.
- Mortgage eligibility for temporary statuses: buying is LPR and CITIZEN only; H1B, O1 and AOS_PENDING get a card that states no lending rule.
- Police reports and immigration status: the break-in card sends NONE and pending players to legal aid and states no rule.
- ssa.gov credits page returned 403 and an IRS scam page returned 404; neither is cited. "At least ten years" for 40 quarters is arithmetic (four quarters in a year).
- Tenant, security deposit, property tax and will rules are state or local; cards say so and state none.
