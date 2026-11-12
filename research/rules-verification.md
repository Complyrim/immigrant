# Rules Verification (Round 2) - "Immigrant" game

Researched 2026-11-08. Not legal advice. Game-design research only.

Labels: **VERIFIED** (primary source read this session), **CORRECTED** (primary source says something different from the round-1 parameter), **STILL UNVERIFIED** (no primary source reached). "Secondary" means a law-firm, news or aggregator page, which is never enough for VERIFIED.

Access notes: travel.state.gov (403), dvprogram.state.gov (403), web.archive.org (blocked by tool) and federalregister.gov (CAPTCHA wall, only the API listing worked) could not be read. uscis.gov, ecfr.gov, law.cornell.edu, whitehouse.gov and the Federal Register API listing were readable. The USCIS fee schedule PDF (G-1055, edition 10/26/26) was downloaded and parsed locally.

---

## 1. F-1 duration of status (D/S)
**CORRECTED / important change.** Round-1 "duration of status" no longer describes the rule for new admissions.
- DHS published a final rule "Establishing a Fixed Time Period of Admission and an Extension of Stay Procedure for Nonimmigrant Academic Students, Exchange Visitors, and Representatives of Foreign Information Media", published 2026-07-17, FR doc 2026-14439. Listing confirmed via the Federal Register API: https://www.federalregister.gov/documents/2026/07/17/2026-14439/establishing-a-fixed-time-period-of-admission-and-an-extension-of-stay-procedure-for-nonimmigrant (the page itself was CAPTCHA-walled; only the listing metadata was read). The proposed rule was 2025-08-28 (doc 2025-16554).
- The current eCFR text (version dated 2026-10-01) of 8 CFR 214.2(f)(5)(i) reads: an F-1 student "is admitted for a fixed period of time, which is the period necessary to complete the course of study ... not to exceed a period of 4 years", with admission up to 30 days before the report date, and a 30-day post-completion period (f)(5)(v) running from the program end date, the 4-year maximum, or the end of OPT/STEM OPT; those 30-day windows do not count toward the 4-year maximum. https://www.ecfr.gov/api/versioner/v1/full/2026-10-01/title-8.xml?part=214&section=214.2 - **VERIFIED** (read in this session).
- Effective date and transition for people already admitted under D/S: **STILL UNVERIFIED** from a primary source. Secondary summaries say effective Sept 15, 2026, with existing D/S holders transitioned and any international trip converting D/S admission to fixed; overstay beyond the fixed period accrues unlawful presence; J limited to program length up to 4 years; I-visa media up to 240 days. Secondary: https://www.mintz.com/insights-center/viewpoints/2806/2026-07-23-dhs-issues-final-rule-creating-fixed-period-admission-f , https://natlawreview.com/article/dhs-publishes-final-rule-replacing-duration-status-fixed-admission-periods-f-j-and
- Game rule: before 2026 (earlier years), F-1 = duration of status (no end date on I-94, "D/S"; unlawful presence only after a formal finding). From the effective date in 2026, admission carries a fixed end date, max 4 years, extension of stay must be filed (Form I-539 or the new procedure), and overstay accrues unlawful presence automatically. Treat 2015-2025 playthroughs as D/S and 2026 as the switch year.

## 2. OPT 12 months and STEM OPT 24-month extension
**VERIFIED.** USCIS: 12 months post-completion OPT; a 24-month STEM extension; a later higher-level STEM degree can yield one more 24-month extension; file I-765 up to 90 days before OPT expires and within 60 days of the DSO recommendation; automatic 180-day extension of EAD while a timely STEM extension is pending; employer must be E-Verify enrolled with an EIN and file Form I-983; report changes to the DSO within 10 days, validate info every 6 months. https://www.uscis.gov/working-in-the-united-states/students-and-exchange-visitors/optional-practical-training-extension-for-stem-students-stem-opt
- 8 CFR 274a.12(c)(3) confirms (i) pre-completion training, (ii) up to 12 months post-completion OPT and (iii) a 24-month extension: https://www.ecfr.gov/api/versioner/v1/full/2026-10-01/title-8.xml?part=274a&section=274a.12
- Cap-gap (extension of F-1 status/OPT while an H-1B change-of-status petition is pending): not on the page read. **STILL UNVERIFIED** here (round-1 should not be cited). Pointer: 8 CFR 214.2(f)(5)(vi) in the eCFR.
- Pending: Federal Register proposed rule "Optional Practical Training Fees", published 2026-10-08, doc 2026-20660 (listing only, details unread): https://www.federalregister.gov/documents/2026/10/08/2026-20660/optional-practical-training-fees . Also a rule published 2026-10-14 (doc 2026-20955) "Removal of Automatic Extensions for Certain Employment Authorization Documents": https://www.federalregister.gov/documents/2026/10/14/2026-20955/removal-of-automatic-extensions-for-certain-employment-authorization-documents . Both are titles only (not read). Flag them as live risks to the 180-day OPT auto-extension and to OPT cost.

## 3. OPT unemployment limits (90 and 150 days)
**VERIFIED, with a nuance.**
- USCIS page: initial post-completion OPT: up to 90 days; 24-month extension adds 60 days, for a total of 150 days during the OPT period (not 150 per extension).
- eCFR 8 CFR 214.2(f)(10)(ii)(E): "Students may not accrue an aggregate of more than 90 days of unemployment during any post-completion OPT period"; with the 24-month STEM extension, no more than 150 days during a total OPT period. https://www.ecfr.gov/api/versioner/v1/full/2026-10-01/title-8.xml?part=214&section=214.2
- Model as one running counter: 90 limit before STEM, 150 limit after STEM approved (cumulative).

## 4. H-1B 6-year limit and extension rules
**VERIFIED.**
- USCIS: initial up to 3 years, extendable by 3 for a 6-year maximum; 18-month blocks for owners of >50% of the petitioner; beyond year 6, extensions available if an approved EB-1/2/3 immigrant petition is blocked by per-country or worldwide visa unavailability, or if 365 days have passed since a labor certification or immigrant petition was filed (AC21 sections 104(c) and 106(a)); extension ends if no I-485 or immigrant visa application is filed within 1 year of a visa becoming available. https://www.uscis.gov/working-in-the-united-states/h-1b-specialty-occupations
- eCFR 8 CFR 214.2(h)(13)(iii)(A): after six years in H and/or L, the alien must reside abroad the immediate prior year before a new H/L period (the "recapture" rule). https://www.ecfr.gov/api/versioner/v1/full/2026-10-01/title-8.xml?part=214&section=214.2

## 5. H-1B 60-day grace period
**VERIFIED (with a correction to the name/scope).**
- 8 CFR 214.1(l)(2): grace period of "up to 60 consecutive days or until the end of the authorized validity period, whichever is shorter", usable "once during each authorized validity period"; covers E-1, E-2, E-3, H-1B, H-1B1, L-1, O-1 and TN plus dependents; DHS may shorten or eliminate; no work unless separately authorized. https://www.ecfr.gov/api/versioner/v1/full/2026-10-01/title-8.xml?part=214&section=214.1
- USCIS H-1B page describes a "60 consecutive days" period for finding new work, changing status or leaving. Same URL as item 4.
- Correction to a common mistake: the grace period is once per validity period, not once ever, and it is not only H-1B. H-2A/H-2B have a similar 60-day rule in 214.2(h)(13)(i)(C). F-1 has a different 30-day post-completion period (not 60).

## 6. H-1B cap (65,000 plus 20,000 master's)
**VERIFIED.** USCIS: 65,000 annual cap (subject to deductions and additions) plus 20,000 for beneficiaries with a U.S. master's or higher; cap-exempt = higher-ed institutions and affiliated or related nonprofits, nonprofit research orgs, government research orgs. https://www.uscis.gov/working-in-the-united-states/h-1b-specialty-occupations
- Selection method changed: weighted wage-level selection final rule, effective 2026-02-27, first used for FY2027 registration (opened March 4, 2026): **LIKELY** (secondary: https://natlawreview.com/article/uscis-finalizes-wage-weighted-h-1b-cap-selection-rule-effective-feb-27-2026 , https://www.bipc.com/fy-2027-h-1b-cap-registration-opens-march-4,-2026-key-changes-and-action-items). Primary text unread. In FY2021-FY2026 selection was random lottery on a beneficiary-centric registration basis (the registration system began for FY2021; **STILL UNVERIFIED** here).
- Unaffected: the 6,800 H-1B1 (Chile/Singapore) reservation and the E-3 10,500 limit were not re-checked this round (**STILL UNVERIFIED**).

## 7. H-4 EAD eligibility
**VERIFIED (partly).**
- 8 CFR 274a.12(c)(26) lists "An H-4 nonimmigrant spouse of an H-1B nonimmigrant described as eligible for employment authorization in 8 CFR 214.2(h)(9)(iv)", i.e. employment authorization is by separate application (Form I-765), not incident to status. eCFR 214.2(h)(9)(iv) states H-4 status "does not confer eligibility for employment authorization incident to status" for the general H-4. https://www.ecfr.gov/api/versioner/v1/full/2026-10-01/title-8.xml?part=274a&section=274a.12
- USCIS H-1B page: "Certain H-4 spouses may apply for employment authorization (Form I-765) once the H-1B worker has started the employment-based green card process." Spouses and unmarried children under 21 may be H-4.
- The exact eligibility triggers (approved I-140, or H-1B extended beyond 6 years under AC21 sections 106/104(c)) are **STILL UNVERIFIED** from regulation text in this session. Rule effective 2015-05-26 (round-1 date also unverified here). Children of H-4 do not get an EAD.

## 8. Unlawful presence 3-year and 10-year bars
**VERIFIED.**
- USCIS: >180 days but <1 year in one stay, leave voluntarily before removal proceedings begin, seek re-admission within 3 years -> 3-year bar (clock starts when you leave). 1 year or more -> 10-year bar (starts when you leave or are removed; applies whether you leave before, during or after proceedings). Stays on or after April 1, 1997. Not counted: asylum applicants (bona fide), under 18, Family Unity, VAWA, certain trafficking victims. https://www.uscis.gov/laws-and-policy/other-resources/unlawful-presence-and-inadmissibility
- INA 212(a)(9)(B): waiver under clause (v) for spouse/child of a citizen or LPR on "extreme hardship to the citizen or lawfully resident spouse or parent"; up to 120 days of tolling while a nonfrivolous change/extension is pending; (C) permanent bar for unlawful presence >1 year aggregate (or an order of removal) followed by entry or attempted entry without admission, with consent to reapply only after 10 years outside. https://www.law.cornell.edu/uscode/text/8/1182
- New in 2026 per USCIS page: as of 2026-08-13, departing after obtaining advance parole counts as a departure for the bars (Matter of Delcarmen-Lara overruled Matter of Arrabally and Yerrabelly). https://www.uscis.gov/laws-and-policy/other-resources/unlawful-presence-and-inadmissibility . **CORRECTED** for any round-1 note that said advance-parole travel is safe for the bars.

## 9. I-601A eligibility
**VERIFIED, with a correction.**
- USCIS: age 17 or older, physically in the U.S.; a pending immigrant visa case with State (principal of an approved I-130/I-140/I-360 with fee paid, DV selectee, or their spouse/child); the only inadmissibility ground must be unlawful presence; **extreme hardship to a U.S. citizen or LPR spouse or parent** (the page wording is slightly ambiguous but includes LPR). Ineligible: in non-closed removal proceedings, final removal order (unless I-212 already approved). https://www.uscis.gov/family/family-of-us-citizens/provisional-unlawful-presence-waivers
- **CORRECTED** if round-1 said "US citizen spouse or parent only": the qualifying relative can be a spouse or parent who is a citizen **or LPR**. Qualifying children are never qualifying relatives for the unlawful-presence waiver. Fee on G-1055 not located in the parsed table (**STILL UNVERIFIED** amount).

## 10. Naturalization (5 years, 3 years married to a citizen, continuous residence, physical presence)
**VERIFIED.**
- INA 316(a), 8 USC 1427: LPR; continuous residence in the U.S. 5 years immediately before filing; physically present at least half that time (30 months); at least 3 months in the state or USCIS district; good moral character; attachment to the Constitution. 1427(b): absence of 6 months to under 1 year breaks continuity unless shown otherwise; absence of 1 year or more breaks continuity (limited exceptions). https://www.law.cornell.edu/uscode/text/8/1427
- INA 319(a), 8 USC 1430: spouse of a U.S. citizen: 3 years continuous residence as LPR, married and in marital union for those 3 years, citizen spouse a citizen the whole period, physically present at least 18 months, 3 months in state/district. https://www.law.cornell.edu/uscode/text/8/1430
- Age 18 and English/civics tests: **STILL UNVERIFIED** from the pages read this session (well known; read INA 312/8 CFR 312 to cite). Filing may be made 90 days before the 5-year or 3-year anniversary (8 CFR 334.2): **STILL UNVERIFIED**.
- N-400 fee: $760 paper / $710 online / $380 reduced fee (paper only). https://www.uscis.gov/n-400

## 11. The $100,000 H-1B payment in 2026
**VERIFIED as to USCIS's stated status; the later litigation details are LIKELY.**
- USCIS H-1B page: Presidential Proclamation of Sept. 19, 2025, applies to certain petitions filed on or after 12:01 a.m. ET Sept. 21, 2025 for beneficiaries outside the U.S. without a valid H-1B visa (and some consular/port-of-entry/pre-flight requests); payment via pay.gov; **on June 8, 2026 a federal district court vacated the agency guidance implementing the payment; on July 24, 2026 the First Circuit denied the government's stay request; DHS says it will comply while it considers next steps and still plans to collect if the order is lifted.** https://www.uscis.gov/working-in-the-united-states/h-1b-specialty-occupations ; same statement at https://www.uscis.gov/forms/filing-fees/fee-schedule and https://www.uscis.gov/i-129
- LIKELY (secondary only): a separate California federal court also blocked enforcement; a Sept 2026 proclamation extended the fee, with firms disagreeing on whether it is also blocked (Fragomen: blocked; Mintz: USCIS may implement). https://www.mintz.com/insights-center/viewpoints/2806/2026-09-23-presidential-proclamation-extends-100k-h-1b-fee , https://www.fragomen.com/insights/united-states-president-trump-extends-dollar100000-h-1b-fee-but-policy-currently-vacated-by-court-order.html . Primary text of the September 2026 proclamation was not read. State as "contested/blocked as of Nov 2026".
- Also new: a "9-11 Response and Biometric Entry-Exit Fee" for covered employers (50+ US employees with >50% in H-1B/L) on H-1B and L-1 petitions postmarked on or after 2026-09-09 (final rule Aug 10, 2026). **VERIFIED** on https://www.uscis.gov/i-129 and https://www.uscis.gov/working-in-the-united-states/temporary-workers/l-1a-intracompany-transferee-executive-or-manager (amount not stated there).
- Game rule: 2015-2024 no payment; Sept 21, 2025 payment starts for new petitions from abroad; June 8, 2026 vacated; treat the payment as "legally blocked, may return" in the 2026 level.

## 12. Status of the "duration of status" rule
See item 1. **CORRECTED**: the rule is final (published 2026-07-17, FR doc 2026-14439). Exact effective date and the treatment of existing D/S holders = **STILL UNVERIFIED** (secondary: Sept 15, 2026). Whether litigation has stayed it = **STILL UNVERIFIED**.

## 13. Current USCIS fee levels and history 2015 to 2026
**Current fees: VERIFIED** from the USCIS fee schedule, Form G-1055, edition 10/26/26: https://www.uscis.gov/g-1055 (PDF https://www.uscis.gov/sites/default/files/document/forms/g-1055.pdf), linked from https://www.uscis.gov/forms/filing-fees/fee-schedule . Online filing typically $50 cheaper where available.

| Form | Current (paper / online) |
|---|---|
| I-129 H-1B / H-1B1 | $780 / $730 (small employer or nonprofit $460), plus Asylum Program Fee $600 regular / $0 nonprofit / $300 small employer, plus H-1B Fraud Prevention $500 (initial or change of employer), plus ACWIA, plus Pub. L. 114-113 fee where 50+ employees and >50% H/L |
| I-129 E-1/E-2/E-3/TN and H-3 and P, Q | $1,015 / $965 (small employer $510) + $600 Asylum Program Fee |
| I-129 O | $1,055 / $1,005 (small $530) + Asylum Program Fee |
| I-129 R | $510 + Asylum Program Fee |
| I-129 L-1 and H-2 | Appendix A rows for L and H-2 were not extracted from the PDF text; **STILL UNVERIFIED** (round-1 value must be rechecked) |
| I-485 (over 14) | $1,440 paper / $1,390 online; under 14 with a parent $950 / $900; refugees $0 |
| I-765 general | $520 paper / $470 online; $260 for those with a pending I-485 filed on or after 2024-04-01 who paid the I-485 fee; $0 for certain I-485 pending cases pre-2024; HR-1 initial parolee/TPS-related $570 extra fee; page says inflation-adjusted H.R.1 fees took effect 2026-10-16 (https://www.uscis.gov/i-765) |
| N-400 | $760 paper / $710 online / $380 reduced |
| I-140 | $715 paper / $665 online + $600 Asylum Program Fee ($300 small employer or self-petitioner, $0 nonprofit) |
| I-130 | $675 paper / $625 online |
| I-539 | $470 / $420 |
| I-526 / I-526E | $3,675 (+ $1,000 EB-5 integrity fee on initial I-526E) |
| I-956 / I-956F (regional centers) | $17,795 |
| I-912 fee waiver | $0 |
| I-821 TPS | $630 paper / $580 online |
| Premium processing (I-907) | $2,965 for H-1B, E, L, O, P, Q, TN and I-140; $1,780 for H-2B and R; a row of $2,075 / $1,780 for F/J/M-linked I-539 or I-765 categories (column mapping ambiguous in extracted text) |
| H.R.1 (Pub. L. 119-21) fees | Asylum application fee ($100 shown), annual asylum fee, parole fee ($1,200 on I-941 shown), parolee EAD fees ($570 shown); see G-1055 |

**History 2015 to 2026: STILL UNVERIFIED from primary sources** (the FR 2016 and 2024 fee rules were CAPTCHA-walled; USCIS fee-history page 404). From memory, to be checked against the Federal Register (2016 rule published 2016-10-24, effective 2016-12-23; 2024 rule published 2024-01-31, effective 2024-04-01):
- 2015 (pre-Dec 2016): I-129 $325, I-485 $985 + $85 biometrics, I-765 $380, N-400 $595 + $85, I-140 $580, I-130 $420.
- Dec 2016: I-129 $460, I-485 $1,140 + $85 bio, I-765 $410, N-400 $640 + $85, I-140 $700, I-130 $535.
- 2020 rule (I-485 to $1,130 etc.) was enjoined/vacated in 2020; never took effect.
- Apr 1, 2024: current values above (biometrics folded in), new Asylum Program Fee added Apr 2024.
- 2025-2026: H.R.1 (Pub. L. 119-21) new fees; $100,000 H-1B payment (blocked); 9-11 biometric fee (Sept 2026).
- Game rule: use the 2016 and 2024 fee-rule dates as step changes; level the fee by the year the form is filed.

## 14. Visa Bulletin, November 2026, final action dates
**LIKELY, not VERIFIED.** travel.state.gov returned 403 and the USCIS filing-charts page only says to use the Dates for Filing chart for November 2026 (https://www.uscis.gov/green-card/green-card-processes-and-procedures/visa-availability-priority-dates/adjustment-of-status-filing-charts-from-the-visa-bulletin ). Values transcribed by a law firm (secondary): https://www.gozellaw.com/blog/november-2026-visa-bulletin . Cross-checks from other firms on EB-2 India 01NOV13, EB-3 India 22JAN14 (now ahead of EB-2 India), F2A 22OCT26 and F2A Mexico 22APR26 agree: https://www.visaverge.com/visa-bulletin/november-2026-visa-bulletin-complete-analysis-and-forecast/ .

| Category | Rest of World | India | Mexico |
|---|---|---|---|
| F1 | 22JAN21 | 22JAN21 | 22SEP08 |
| F2A | 22OCT26 | 22OCT26 | 22APR26 |
| F2B | 22AUG20 | 22AUG20 | 15MAY10 |
| F3 | 22OCT15 | 22OCT15 | 15JUL01 |
| F4 | 22OCT12 | 15DEC06 | 22APR01 |
| EB-1 | Current | 01FEB23 | Current |
| EB-2 | 01APR25 | 01NOV13 | 01APR25 |
| EB-3 | 15JUN24 | 22JAN14 | 15JUN24 |
| EB-3 Other Workers | 01JUN22 | 22JAN14 | 01JUN22 |
| EB-4 | 15DEC22 | 15DEC22 | 15DEC22 |
| EB-5 unreserved | Current | 01DEC23 | Current |

(China: EB-1 01AUG23, EB-2 01OCT21, EB-3 22JAN22. Nigeria is charged to Rest of World.) Game rule: store a monthly (or yearly) priority-date table per country-category; wait = today minus the cutoff date. Historical bulletins 2015-2025 were not retrieved: **STILL UNVERIFIED**.

## 15. Diversity Visa excluded countries, DV-2022 to DV-2027
**STILL UNVERIFIED from primary.** dvprogram.state.gov and travel.state.gov returned 403.
- Rule (State/INA 203(c)): a country is excluded when it sent more than 50,000 immigrants (family and employment categories) in the previous five years. Eligibility needs high school or two years of qualifying work; chargeability by birth country, or spouse's or parent's; the program's base figure is 55,000 reduced by NACARA up to 5,000 and, from FY2025, by the FY2024 NDAA offset (about 54,800 in 2020-2024, about 51,600 in 2025 and 2026): LIKELY, secondary: https://en.wikipedia.org/wiki/Diversity_Immigrant_Visa
- DV-2026 list (secondary, Wikipedia): Bangladesh, Brazil, Canada, China (mainland and Hong Kong), Colombia, Cuba (erroneously treated as eligible in the draw, then selectees told ineligible), Dominican Republic, El Salvador, Haiti, Honduras, India, Jamaica, Mexico, Nigeria, Pakistan, Philippines, South Korea, Venezuela, Vietnam. Also: the UK (except Northern Ireland) was wrongly excluded in the DV-2025/2026 processes and selections were made after a lawsuit. A mid-2026 secondary item lists Cuba and Honduras among 2026 exclusions: https://www.legit.ng/people/1729296-us-green-card-lottery-1-african-country-barred-participating-2026/ . Hong Kong counted as part of China from DV-2022.
- India, Mexico: ineligible every year DV-2022 to DV-2027 (LIKELY, secondary). Nigeria: reported ineligible for DV-2022 (https://www.thecable.ng/?p=488352), DV-2025 (https://nairametrics.com/2023/10/19/us-commences-lottery-program-for-2025-nigeria-others-excluded/ ) and DV-2026; DV-2023 and DV-2024 not separately read: **STILL UNVERIFIED**; treat as ineligible. Nigerians can still enter through a spouse or parent born in an eligible country (rule above).
- DV-2027 status: the registration window was not opened as of the most recent reports; a December 2025 pause on DV and a reported Oct 14, 2026 court order (S.D. Cal.) to restart with a Nov 1, 2026 registration window are single-source: **STILL UNVERIFIED** (https://adoptions.state.gov/content/travel/en/News/visas-news/changes-to-2027-dv-program-entry-period.html , https://dlgvisa.com/blog/diversity-visa-lottery-2027-delay). DV-2026 selectees' deadline was Sept 30, 2026 (visa pause).
- Game rule: India/Mexico/Nigeria players can only get DV through a chargeability switch; model DV as unavailable for them by default.

## 16. Travel-ban proclamations affecting India, Mexico, or Nigeria
**VERIFIED for the Dec 2025 proclamation; earlier ones are STILL UNVERIFIED (memory).**
- Proclamation of December 2025 "Restricting and Limiting the Entry of Foreign Nationals to Protect the Security of the United States": effective **12:01 a.m. EST January 1, 2026** (Sec. 10). Full suspension (12 carried over + 7 new: Burkina Faso, Laos, Mali, Niger, Sierra Leone, South Sudan, Syria; plus Palestinian Authority documents). **Partial suspension** carried over: Burundi, Cuba, Togo, Venezuela; newly added in Sec. 5: Angola, Antigua and Barbuda, Benin, Cote d'Ivoire, Dominica, Gabon, The Gambia, Malawi, Mauritania, **Nigeria (Sec. 5(j))**, Senegal, Tanzania, Tonga, Zambia, Zimbabwe. Section 5 partial suspension covers **immigrant visas and nonimmigrant B-1, B-2, B-1/B-2, F, M and J**; other nonimmigrant visas get reduced validity. **India and Mexico do not appear.** Exceptions: LPRs, dual nationals using a non-designated passport, A-1/A-2/C-2/C-3/G/NATO visas, certain sports events, SIVs for US Government employees, Iranian persecuted minorities; case-by-case national-interest waivers; applies only to people outside the U.S. without a valid visa on the effective date; already-issued visas not revoked; asylum/refugee/CAT not limited. https://www.whitehouse.gov/presidential-actions/2025/12/restricting-and-limiting-the-entry-of-foreign-nationals-to-protect-the-security-of-the-united-states/
- It builds on Proclamation 10949 of June 4, 2025 (cited in the text above); the June 2025 country list as I recall it did not include India, Mexico or Nigeria (**STILL UNVERIFIED**).
- Earlier (memory, **STILL UNVERIFIED**): EO 13769 (Jan 27, 2017) and Proclamation 9645 (Sept 24, 2017) did not cover India, Mexico or Nigeria; Proclamation 9983 (Jan 31, 2020, effective Feb 21, 2020) added Nigeria and five others to an **immigrant-visa-only** suspension; Proclamation 10141 (Jan 20, 2021) revoked those. Nigeria is therefore restricted only for 2020 (immigrant visas) and from Jan 1, 2026 (immigrant + B/F/M/J).
- Separate from the proclamation: State Dept paused **immigrant visa issuance** for nationals of 75 countries (public charge review) from **Jan 21, 2026**; Nigeria is on the reported list; interviews continue, issuance stops; reported from internal memos with no Federal Register notice: **LIKELY (secondary)** https://www.mintz.com/insights-center/viewpoints/2806/2026-01-29-state-department-suspends-immigrant-visa-processing-75 , https://nairametrics.com/2026/01/14/u-s-pauses-immigrant-visa-processing-for-nigeria-74-other-countries-starting-jan-21/ . Whether India or Mexico are on that list was not established (**STILL UNVERIFIED**; neither was named in the snippets read). Whether the pause is still in force in Nov 2026: **STILL UNVERIFIED**.

---

## Summary table

| Parameter | Result |
|---|---|
| F-1 D/S | CORRECTED (fixed period, max 4 yrs; effective date unverified) |
| OPT 12 / STEM 24 | VERIFIED |
| Unemployment 90 / 150 | VERIFIED (cumulative) |
| H-1B 6-year + AC21 | VERIFIED |
| H-1B 60-day grace | VERIFIED (once per validity period, many classes) |
| H-1B cap 65k + 20k | VERIFIED (selection now wage-weighted, LIKELY) |
| H-4 EAD | VERIFIED in part (triggers unverified) |
| 3 / 10-year bars | VERIFIED; advance parole point CORRECTED 2026 |
| I-601A | VERIFIED; LPR relative CORRECTED |
| Naturalization | VERIFIED |
| $100k H-1B payment | VERIFIED as vacated 2026-06-08; later events LIKELY |
| Current fees | VERIFIED; 2015-2023 history STILL UNVERIFIED |
| Visa Bulletin Nov 2026 | LIKELY (secondary) |
| DV excluded lists | STILL UNVERIFIED |
| Travel bans | Dec 2025 proclamation VERIFIED; others unverified |
