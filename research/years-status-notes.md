# Notes for src/engine/content/years-status.ts

59 cards, ids `ys-*`, flags `ys_*`. Written 2026-11-11. Game-design reference, not legal advice.
Rule text below was read on 2026-11-11 from the URL given (Cornell LII unless named), or is marked "existing" when it comes from research/verified-law*.md or rules-verification.md.

## Cards

Year band = years since arrival in which the card can be drawn. "repeat N" = may return N years after it was last shown.

| Card id | Statuses | Year band | Legal source used |
|---|---|---|---|
| ys-address | LPR, H1B, O1, ASYLEE | 1+, repeat 5 | INA 265(a); 8 CFR 265.1 |
| ys-lpr-lost-card | LPR | 1+, once | INA 264(e); I-90 fee is an estimate |
| ys-lpr-jury-form | LPR | 2+, once | 28 U.S.C. 1865(b)(1); INA 237(a)(3)(D) |
| ys-lpr-tax-idea | LPR | 2+, once (Feb to Apr) | 8 CFR 316.5(c)(2); IRS green card test |
| ys-lpr-counting-days | LPR | 2+, repeat 4 | INA 316(a), (b) (existing); 8 CFR 316.5(c)(1)(i); INA 101(a)(13)(C)(ii) (existing) |
| ys-lpr-civics | LPR | 3+ years as LPR, once | INA 312(a) (existing); INA 312(b)(2); 8 CFR 312.5(a) (existing) |
| ys-lpr-decide | LPR | 6+ years as LPR, repeat 5 | 18 U.S.C. 611, 8 CFR 211.1(a)(2), INA 237(a)(2) (all existing) |
| ys-lpr-parent-asks | LPR | 2+, once | INA 201(b)(2)(A)(i), 203(a)(2) (existing); 8 CFR 214.2(b) (existing) |
| ys-cousin-asks | LPR, CITIZEN | 4+, once | INA 201(b)(2)(A)(i), 203(a) (existing) |
| ys-lpr-old-case | LPR | 7+, once | INA 237(a)(2) (existing); INA 292 |
| ys-cit-jury | CITIZEN | any, repeat 6 | 28 U.S.C. 1865(b) |
| ys-cit-first-return | CITIZEN | any, once | INA 215(b) |
| ys-cit-passport-renew | CITIZEN | 9+ years as citizen, once | 22 CFR 51.4(b)(1); INA 215(b); fees are estimates |
| ys-cit-parent-arrives | CITIZEN | after `petitionedFamily`, once | INA 213A(a)(1), 201(b)(2)(A)(i), 8 CFR 211.1(a)(2) (existing) |
| ys-cit-asked-how | CITIZEN | 6+, repeat 4 | 8 CFR 292.1 |
| ys-cit-visit-home | CITIZEN | 4+, repeat 6 | INA 215(b); home-country law (no US rule stated) |
| ys-cit-dual | CITIZEN | any, once | none (says only: ask the home country's consulate) |
| ys-cit-ballot | CITIZEN | after `voted`, repeat 3 (November) | none |
| ys-cit-looking-back | CITIZEN | 10+, repeat 7 | none |
| ys-h1b-pieces | H1B, O1 | 3+, repeat 3 | 8 CFR 214.2(h)(9)(iii)(A)(1), (h)(15)(ii)(B)(1), (o)(12)(ii), 214.1(l)(2) (existing) |
| ys-h1b-stamp | H1B, O1 | 2+, repeat 4 | 8 CFR 212.1 |
| ys-h1b-spouse | H1B, O1 (married, dependent spouse) | 1+, repeat 4 | 8 CFR 214.2(h)(9)(iv) (existing); 8 CFR 214.2(o)(6)(iv); 8 CFR 214.1(e) (existing) |
| ys-h1b-age-out | H1B, O1 | 5+, once | INA 101(b)(1); INA 203(h) |
| ys-h1b-reorg | H1B, O1 | 2+, repeat 4 | 8 CFR 214.1(l)(2), 204.5(e) (existing) |
| ys-h1b-decade | H1B, O1 | 10+, repeat 5 | 8 CFR 204.5(e) (existing) |
| ys-aos-mail | AOS_PENDING | any, once | 8 CFR 103.2(b)(13)(ii); INA 265(a) |
| ys-aos-rescheduled | AOS_PENDING | any, repeat 2 | none |
| ys-aos-ead-renew | AOS_PENDING (with `ead` and a job) | 1+ years pending, repeat 2 | 8 CFR 274a.12(c)(9), I-765 $260 (existing); 8 CFR 245.2(a)(4)(ii) (existing) |
| ys-aos-second-request | AOS_PENDING | after `aosRfe` or 1+ years pending, once | 8 CFR 103.2(b)(8)(iv), (b)(13)(i) |
| ys-aos-job-offer | AOS_PENDING (employment basis) | 1+ years pending, once | INA 204(j) |
| ys-aos-limbo | AOS_PENDING | 2+ years pending, repeat 2 | 8 CFR 245.2(a)(4)(ii) (existing) |
| ys-asy-moved-date | ASY_PENDING | 1+ years pending, repeat 2 | EOIR backlog figure (existing) |
| ys-asy-ead-renew | ASY_PENDING (with `ead`) | 2+ years pending, repeat 2 | 8 CFR 208.7(b)(1) (existing); fee is an estimate |
| ys-asy-stale | ASY_PENDING | 2+ years pending, repeat 3 | INA 208(b)(1)(B) (existing) |
| ys-asy-family-fear | ASY_PENDING | 1+, repeat 3 | none |
| ys-asy-cannot-go | ASY_PENDING | 2+, once | 8 CFR 208.8 |
| ys-asy-new-city | ASY_PENDING (with `ead`) | 1+, once | 8 CFR 1003.15(d)(2); INA 265(a) |
| ys-asy-queue-years | ASY_PENDING | 3+ years pending, repeat 3 | none |
| ys-asylee-meeting | ASYLEE | any, repeat 4 | 8 CFR 223.1(b), 223.2(b)(2), 223.3(a)(2); INA 208(c)(2)(D) |
| ys-asylee-family | ASYLEE | first 2 years as asylee, once | INA 208(b)(3); 8 CFR 208.21; INA 201(b)(2)(A)(i), 203(a)(4) (existing) |
| ys-asylee-first-year | ASYLEE | first year as asylee, once | INA 209(b), I-485 $1,440 (existing) |
| ys-asylee-home-news | ASYLEE | 1+ years as asylee, repeat 3 | INA 208(c)(2)(A); INA 209(b) (existing) |
| ys-none-consult | NONE (no removal order, no asylum filing) | 1 to 9, once | INA 245(a), 245(c)(2), 201(b)(2)(A)(i), 212(a)(9)(B) (existing); 8 CFR 292.1 |
| ys-none-narrow-door | NONE (no removal order) | 9+, once | INA 240A(b)(1), (d)(1), (e) |
| ys-none-attacked | NONE | 2+, once | USCIS U nonimmigrant status page |
| ys-none-rights-night | NONE | 1+, repeat 6 | Fourth and Fifth Amendments; Payton v. New York; Plyler v. Doe; INA 292 |
| ys-none-knock | NONE | 1+, repeat 5 | none (no rule stated) |
| ys-none-traffic-stop | NONE | 1+, repeat 6 until licensed | California DMV AB 60 page; NY DMV Green Light Law page |
| ys-none-school-form | NONE (with `yf_child`) | 4+, once | Plyler v. Doe; California DOJ consumer alert |
| ys-none-emergency | NONE | 1+, repeat 7 | 42 U.S.C. 1395dd(a), (h); 8 U.S.C. 1611(b)(1)(A) |
| ys-none-notario | NONE | 8+, once | INA 240A(b)(1), (d)(1), (e); 8 CFR 292.1; California DOJ scams text |
| ys-none-policy-hope | NONE | 2+, repeat 5 | none (no real bill named) |
| ys-none-friend-detained | NONE | 2+, repeat 7 | INA 292 |
| ys-none-tax-season | NONE (with work) | 1+, repeat 4 (Feb to Apr) | IRS ITIN page |
| ys-none-ten-years | NONE | 10 to 13, once | INA 240A; INA 212(a)(9)(B) (existing) |
| ys-none-twenty-years | NONE | 20 to 26, once | INA 249 |
| ys-none-funeral | NONE | 4+, once | INA 212(a)(9)(B) (existing) |
| ys-none-passport | NONE | 3+, repeat 9 | none (home-country matter) |
| ys-none-order | NONE (with `removalOrder`) | any, repeat 4 | INA 276 (existing) |

## New rules read for this file (primary text, 2026-11-11)

| Rule | What the text says | URL |
|---|---|---|
| INA 265(a), 8 U.S.C. 1305(a) | Each alien required to be registered must notify in writing of each change of address within ten days | https://www.law.cornell.edu/uscode/text/8/1305 |
| 8 CFR 265.1 | Same duty, 10 days, as instructed by USCIS | https://www.law.cornell.edu/cfr/text/8/265.1 |
| INA 264(e), 8 U.S.C. 1304(e) | Every alien 18 or over must at all times carry the registration card issued to them; failure is a misdemeanor | https://www.law.cornell.edu/uscode/text/8/1304 |
| 28 U.S.C. 1865(b) | A person is qualified for federal jury service unless not a citizen aged 18 with one year in the district, or unable to read, write, understand or speak English, among others | https://www.law.cornell.edu/uscode/text/28/1865 |
| INA 237(a)(3)(D), 8 U.S.C. 1227(a)(3)(D) | An alien who falsely represents himself to be a US citizen for any purpose or benefit under federal or state law is deportable | https://www.law.cornell.edu/uscode/text/8/1227 |
| 8 CFR 316.5(c)(1)(i) | Absence of 6 to 12 months disrupts continuity unless the applicant shows otherwise (kept job, family, home; no job abroad) | https://www.law.cornell.edu/cfr/text/8/316.5 |
| 8 CFR 316.5(c)(2) | A permanent resident who claims nonresident alien status for tax raises a rebuttable presumption of relinquishing permanent residence | same |
| INA 312(b)(2), 8 U.S.C. 1423(b)(2) | The English requirement of (a)(1) does not apply to a person over 50 with 20 years as LPR, or over 55 with 15 years | https://www.law.cornell.edu/uscode/text/8/1423 |
| INA 215(b), 8 U.S.C. 1185(b) | Unlawful for a US citizen to depart from or enter the US without a valid US passport, subject to exceptions the President allows | https://www.law.cornell.edu/uscode/text/8/1185 |
| 22 CFR 51.4(b)(1) | A regular passport issued at 16 or older is valid for ten years | https://www.law.cornell.edu/cfr/text/22/51.4 |
| 8 CFR 212.1 | A valid unexpired visa and passport must be presented by each arriving nonimmigrant, with listed exceptions | https://www.law.cornell.edu/cfr/text/8/212.1 |
| 8 CFR 214.2(o)(6)(iv) | O-3 spouse and children may not accept employment unless granted employment authorization | https://www.law.cornell.edu/cfr/text/8/214.2 |
| INA 101(b)(1), 8 U.S.C. 1101(b)(1) | "Child" means an unmarried person under twenty-one | https://www.law.cornell.edu/uscode/text/8/1101 |
| INA 203(h), 8 U.S.C. 1153(h) | Child's age = age when a visa number becomes available, minus days the petition was pending, only if the child seeks residence within one year | https://www.law.cornell.edu/uscode/text/8/1153 |
| 8 CFR 103.2(b)(8)(iv) | A request for evidence states a deadline; the maximum response period is twelve weeks | https://www.law.cornell.edu/cfr/text/8/103.2 |
| 8 CFR 103.2(b)(13)(i), (ii) | No response: may be denied as abandoned or on the record. No appearance at biometrics or interview: considered abandoned and denied unless a change of address or reschedule request was received by the appointment time | same |
| INA 204(j), 8 U.S.C. 1154(j) | A petition stays valid for a new job in the same or a similar occupational classification once the adjustment application has been pending 180 days | https://www.law.cornell.edu/uscode/text/8/1154 |
| 8 CFR 208.8 | Leaving without advance parole: presumed abandonment of the asylum application. Returning to the country of claimed persecution on advance parole: presumed abandonment unless compelling reasons | https://www.law.cornell.edu/cfr/text/8/208.8 |
| 8 CFR 1003.15(d)(2) | Within five days of any change of address, written notice to the immigration court on Form EOIR-33 | https://www.law.cornell.edu/cfr/text/8/1003.15 |
| 8 CFR 223.1(b) | A person with asylum status must have a refugee travel document to return after temporary travel abroad (unless holding advance parole) | https://www.law.cornell.edu/cfr/text/8/223.1 |
| 8 CFR 223.2(b)(2), 223.3(a)(2) | Applied for while in the US in valid asylum status; valid for 1 year | https://www.law.cornell.edu/cfr/text/8/223.2 , https://www.law.cornell.edu/cfr/text/8/223.3 |
| INA 208(b)(3), 8 U.S.C. 1158(b)(3) | Spouse or child of an asylee may be granted the same status if accompanying or following to join | https://www.law.cornell.edu/uscode/text/8/1158 |
| 8 CFR 208.21(a), (b), (c) | Relationship must have existed when asylum was approved; request filed within two years of the grant unless extended for humanitarian reasons | https://www.law.cornell.edu/cfr/text/8/208.21 |
| INA 208(c)(2)(A), (D) | Asylum does not convey a right to remain permanently; may be terminated on a fundamental change in circumstances, or if the person voluntarily avails themselves of the protection of their country | https://www.law.cornell.edu/uscode/text/8/1158 |
| INA 240A(b)(1), (d)(1), (e), 8 U.S.C. 1229b | Cancellation: 10 years continuous physical presence, good moral character, no listed conviction, exceptional and extremely unusual hardship to a USC or LPR spouse, parent or child; the period ends when a notice to appear is served; 4,000 a year | https://www.law.cornell.edu/uscode/text/8/1229b |
| INA 292, 8 U.S.C. 1362 | In removal proceedings the person has the privilege of counsel of their choosing, at no expense to the Government | https://www.law.cornell.edu/uscode/text/8/1362 |
| INA 249, 8 U.S.C. 1259 | Registry: entered before January 1, 1972, continuous residence, good moral character | https://www.law.cornell.edu/uscode/text/8/1259 |
| 8 CFR 292.1(a) | Who may represent a person before DHS: attorneys, supervised law students and graduates, reputable individuals without pay, accredited representatives | https://www.law.cornell.edu/cfr/text/8/292.1 |
| 42 U.S.C. 1395dd(a), (h) | A hospital with an emergency department must screen any individual who comes; no delay to ask about payment or insurance | https://www.law.cornell.edu/uscode/text/42/1395dd |
| 8 U.S.C. 1611(b)(1)(A) | The bar on federal public benefits does not apply to Medicaid treatment of an emergency medical condition, if otherwise eligible | https://www.law.cornell.edu/uscode/text/8/1611 |
| Plyler v. Doe, 457 U.S. 202 (1982) | A state may not deny public education to children not legally admitted; an alien is a "person" under the Fourteenth Amendment whatever their status | https://www.law.cornell.edu/supremecourt/text/457/202 |
| Payton v. New York, 445 U.S. 573 (1980) | The Fourth Amendment prohibits a warrantless, nonconsensual entry into a home for a routine arrest; "a firm line at the entrance to the house" | https://www.law.cornell.edu/supremecourt/text/445/573 |
| Fourth and Fifth Amendments | Text of each | https://www.law.cornell.edu/constitution/fourth_amendment , https://www.law.cornell.edu/constitution/fifth_amendment |
| USCIS, U nonimmigrant status | Eligibility list (victim of qualifying crime, helpful to law enforcement, certification on Form I-918 Supplement B); 10,000 cap for principals | https://www.uscis.gov/humanitarian/victims-of-criminal-activity-u-nonimmigrant-status |
| IRS, ITIN | For federal tax purposes only; does not change immigration status, authorize work or qualify for Social Security benefits; available regardless of immigration status; green card test for tax residence | https://www.irs.gov/tin/itin/individual-taxpayer-identification-number-itin |
| California DMV, AB 60 | Licenses for people unable to show proof of legal presence who can prove identity and California residency | https://www.dmv.ca.gov/portal/driver-licenses-identification-cards/assembly-bill-ab-60-driver-licenses/ |
| NY DMV, Green Light Law | Standard, not-for-federal-purposes license for residents 16 or over regardless of citizenship or lawful status | https://dmv.ny.gov/driver-license/driver-licenses-and-the-green-light-law |
| California DOJ, immigrant resources page and "Know Your Immigration Rights" consumer alert | Status information is never needed for school enrollment; no SSN needed; only lawyers, accredited representatives and recognized organizations may give immigration legal advice | https://oag.ca.gov/immigrant/resources |

## Not verified, so left out or softened

- Whether an expired work permit is extended automatically while a renewal is pending: the cards say this has changed and to check the current rule.
- Fees for I-90, I-131 (travel documents), asylum work permit renewal, passport renewal, consulate services, H-4 work permit: all labelled estimates.
- Driver licensing outside California and New York (Illinois, DC, Texas, Georgia): not read, so the card for those cities only says licensing is state law and to check the state agency.
- Dual nationality: no US rule is stated; cards say only that the home country's law decides.
- The U visa statute (INA 101(a)(15)(U)) was not read directly; only the USCIS page is cited, and the card says an attorney must assess.
- Reopening an old removal order: no rule stated; the card says only an attorney with the court file can answer.
- IRS information sharing with immigration agencies: not stated either way.
- How a traffic stop or a knock at the door should be handled: no advice given; only the general constitutional text and that a lawyer must explain it.
- That a false citizenship claim also blocks naturalization: not read, not stated.

## Design notes

- Recurring cards store a year stamp (`ys_*At` = years since arrival + 1) and return only after a gap, with different text on later visits.
- `ys-none-consult` is hidden from people with a removal order or an asylum filing, because its text about how they entered could be wrong for them; `ys-none-order` covers the first group.
- `ys-h1b-age-out` is told through a colleague's child, because the player's own `yf_child` is born in the US and is a citizen.
- No card sets `status`, `ead`, `informalWork`, `removal`, `arrested`, `outOfStatus` or any flag owned by family.ts or work.ts. `salary` is raised (never created) in `ys-aos-job-offer` and `ys-asy-new-city`.
