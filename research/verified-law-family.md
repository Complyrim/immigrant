# Verified law for the family, visitor, entry-without-inspection, asylum, adjustment and settlement roads

Read directly on 2026-11-09 unless marked otherwise. Statute and regulation text from Cornell LII (law.cornell.edu); USCIS pages where named. Game-design reference, not legal advice. CONFIRMED means the primary text was read this session; LIKELY means secondary sources only. Rules already confirmed in `verified-law.md` (INA 245(a)/(c)/(i), 212(a)(9)(B)/(C), 8 CFR 214.1, INA 275/276, 235(b)(1), 208, 237(a)(2)) and in `rules-verification.md` (I-601A, 316/319, fees) are cited, not repeated, except where a card relies on a detail.

## Visitors

**B-2 admission period. CONFIRMED.** 8 CFR 214.2(b)(1): a B-1 or B-2 visitor "may be admitted for not more than one year and may be granted extensions of temporary stay in increments of not more than six months each". 214.2(b)(2): a B-2 visitor issued an I-94 "will be admitted for a minimum period of six months" (exceptions only with district director approval). https://www.law.cornell.edu/cfr/text/8/214.2
- Game: B2 route starts with `b2Until: 6`; an approved I-539 adds 6 months.

**Visitors may not study before a change of status. CONFIRMED.** 8 CFR 214.2(b)(7): a person admitted as B-1/B-2 on or after April 12, 2002 violates status by enrolling in a course of study. 8 CFR 248.1(c)(3): such a person "may not pursue a course of study ... unless the Service has approved his or her application for change of status" to F-1 or M-1, and "USCIS will deny the change of status if the B-1 or B-2 nonimmigrant enrolled in a course of study before filing the application for change of status or while the application is pending." https://www.law.cornell.edu/cfr/text/8/248.1

**Unauthorized work by a visitor. CONFIRMED (via verified-law.md).** 8 CFR 214.1(e): unauthorized employment is a failure to maintain status. Extension cannot be approved for someone whose status lapsed before filing except where USCIS excuses the late filing; denials of extensions cannot be appealed (8 CFR 214.1(c)).

**Tolling during a pending extension. CONFIRMED (via verified-law.md).** INA 212(a)(9)(B)(iv): up to 120 days of tolling for a lawfully admitted person with a timely, nonfrivolous extension or change request who did not work without authorization.

**I-539 fee $470 paper / $420 online. CONFIRMED in rules-verification.md (G-1055, edition 10/26/26).**

## Asylum

**Who may apply, one-year deadline, exceptions. CONFIRMED.** INA 208(a)(1): any alien physically present or arriving, "irrespective of such alien's status". 208(a)(2)(B): the applicant must show "by clear and convincing evidence that the application has been filed within 1 year after the date of the alien's arrival". 208(a)(2)(D): may be considered despite the deadline for "changed circumstances which materially affect the applicant's eligibility" or "extraordinary circumstances relating to the delay". https://www.law.cornell.edu/uscode/text/8/1158

**Frivolous applications. CONFIRMED.** INA 208(d)(6): if the Attorney General determines an alien "knowingly made a frivolous application for asylum" after the 208(d)(4) notice, the alien "shall be permanently ineligible for any benefits under this chapter". Same URL.

**Asylee work and travel. CONFIRMED.** INA 208(c)(1)(B): the government "shall authorize the alien to engage in employment"; 208(c)(1)(C): "may allow the alien to travel abroad with the prior consent of the Attorney General". Same URL.

**Work permit clock for applicants. CONFIRMED.** 8 CFR 208.7(a)(1)(i): the EAD application may be submitted "no earlier than 150 days after the date on which a complete asylum application ... has been received"; the clock does not start if the application is rejected as incomplete. (a)(1)(v): USCIS has 30 days to decide, "except that no employment authorization shall be issued to an asylum applicant prior to the expiration of the 180-day period following the filing". (a)(2): delays requested or caused by the applicant, including fingerprint failures, are not counted. (a)(4): no EAD for someone who misses an interview or hearing without exceptional circumstances. (b)(1): EAD ends immediately on a USCIS denial, but not when USCIS refers the case to a judge. (b)(2): after a judge's denial it ends 30 days later unless a BIA appeal is filed. (b)(3): it ends immediately when the BIA dismisses the appeal. Current text cites amendments at 91 FR 22972 (Apr. 29, 2026) and 91 FR 45638 (July 21, 2026); the 150/180-day rule is still in the text read. https://www.law.cornell.edu/cfr/text/8/208.7
- Not adopted: the Feb 23, 2026 proposal to lengthen the wait to 365 days (research/unauthorized-entry.md, UNVERIFIED as final).

**Asylum office outcomes. CONFIRMED.** 8 CFR 208.14(b): an asylum officer may grant. 208.14(c)(1): if not granted and the applicant appears inadmissible or deportable, the officer refers the application to an immigration judge with a charging document. (c)(2): an applicant still in valid status is denied (and keeps that status). 208.14(a): a judge may grant or deny. https://www.law.cornell.edu/cfr/text/8/208.14

**Unlawful presence while asylum is pending. CONFIRMED (via verified-law.md).** INA 212(a)(9)(B)(iii)(II): time with a bona fide asylum application pending does not count, unless the person worked without authorization.

**Asylee to green card. CONFIRMED.** INA 209(b): may adjust an asylee who applies, "has been physically present in the United States for at least one year after being granted asylum", still qualifies as a refugee (or spouse/child of one), is not firmly resettled, and is admissible; the record of admission is set "as of the date one year before the date of the approval". 8 CFR 209.2(a)(1)(ii) and (f) repeat this; (f) adds no appeal of a denial, but the request may be renewed in removal proceedings. https://www.law.cornell.edu/uscode/text/8/1159 , https://www.law.cornell.edu/cfr/text/8/209.2

**Asylum fee $100. CONFIRMED in rules-verification.md (G-1055 H.R.1 rows).** The annual pending-asylum fee and the asylum EAD fee ($550 reported) are LIKELY only; the game uses $550 and labels it an estimate.

**Outcome odds (designed).** Card odds are anchored on EOIR court data in research/unauthorized-entry.md 2.5 (CONFIRMED): FY2024 grant ratios India 65%, Mexico 16%, Nigeria 59%; national 46% (FY2024), 24% (FY2025), 7% (FY2026 through Q3). The game uses India 62, Mexico 18, Nigeria 56, multiplied by 0.55 for 2025 and 0.3 for 2026 onward, with modifiers for legal help and evidence. These are designed estimates, not predictions.

## Marriage, adjustment and conditional residence

**Adjustment requires inspection and admission; immediate-relative exemption; 245(i). CONFIRMED in verified-law.md.** INA 245(a), 245(c)(2), 245(i).

**Immediate relatives. CONFIRMED.** INA 201(b)(2)(A)(i): "the children, spouses, and parents of a citizen of the United States, except that, in the case of parents, such citizens shall be at least 21 years of age". https://www.law.cornell.edu/uscode/text/8/1151

**Family preference categories. CONFIRMED.** INA 203(a)(1) unmarried sons and daughters of citizens; (a)(2) spouses and unmarried sons and daughters of permanent residents; (a)(3) married sons and daughters of citizens; (a)(4) "brothers or sisters of citizens of the United States, if such citizens are at least 21 years of age", limited to 65,000 plus unused numbers. https://www.law.cornell.edu/uscode/text/8/1153

**Visa Bulletin waits. LIKELY (secondary).** November 2026 final action dates reported by law firms (travel.state.gov returned 403): F4 Mexico April 22, 2001; India December 15, 2006; rest of world (including Nigeria) October 22, 2012; F3 Mexico July 15, 2001. https://www.gozellaw.com/blog/november-2026-visa-bulletin . Shown in a Fact with confidence LIKELY.

**Marriage fraud. CONFIRMED.** INA 275(c): "Any individual who knowingly enters into a marriage for the purpose of evading any provision of the immigration laws shall be imprisoned for not more than 5 years, or fined not more than $250,000, or both." https://www.law.cornell.edu/uscode/text/8/1325

**Conditional residence. CONFIRMED.** INA 216(a)(1): an "alien spouse" obtains residence on a conditional basis; 216(h)(1): alien spouse means one who obtains residence as a citizen's spouse (or fiance(e) or LPR's spouse) "by virtue of a marriage which was entered into less than 24 months before the date the alien obtains such status". 216(c)(1): both spouses must jointly petition. 216(d)(2)(A): during "the 90-day period before the second anniversary". 216(d)(2)(B): a late petition may be considered only with "good cause and extenuating circumstances". 216(c)(2): if not filed, status terminates "as of the second anniversary". 216(c)(4): hardship waiver for extreme hardship, a good-faith marriage that ended, or battery or extreme cruelty. https://www.law.cornell.edu/uscode/text/8/1186a

**Affidavit of support. CONFIRMED.** INA 213A(a)(1): sponsor agrees to maintain the immigrant at "not less than 125 percent of the Federal poverty line", legally enforceable; (a)(3): not enforceable after 40 qualifying quarters of work (with no federal means-tested benefits), among other endpoints. https://www.law.cornell.edu/uscode/text/8/1183a

**Travel while an I-485 is pending. CONFIRMED.** 8 CFR 245.2(a)(4)(ii)(A): departure of an applicant not in proceedings "shall be deemed an abandonment of the application ... unless the applicant was previously granted advance parole ... and was inspected upon returning". (ii)(B): travel with advance parole is not abandonment; if the application is later denied the person is treated as an applicant for admission. (ii)(C): H-1/L-1 (and H-4/L-2) exception. https://www.law.cornell.edu/cfr/text/8/245.2
- Advance parole and the bars: since August 13, 2026 USCIS treats departure on advance parole as a departure for 212(a)(9)(B) (Matter of Delcarmen-Lara). CONFIRMED in rules-verification.md section 8 (USCIS page).

**Provisional waiver I-601A. CONFIRMED in rules-verification.md section 9** (USCIS page https://www.uscis.gov/family/family-of-us-citizens/provisional-unlawful-presence-waivers): age 17+, in the US, approved I-130 with a pending immigrant visa case, only unlawful presence as a ground, extreme hardship to a USC or LPR spouse or parent; not available in non-closed removal proceedings or with a final order. Hardship standard also in INA 212(a)(9)(B)(v). Fee not verified (game uses an estimate and says so).

**Fees used. CONFIRMED in rules-verification.md (G-1055):** I-130 $675, I-485 $1,440, I-765 $260 with a pending I-485, N-400 $760 / $710 online / $380 reduced, I-539 $470. **Estimates (labelled in game):** I-131 advance parole and reentry permit ($630), I-751 ($750), I-90 ($465), I-601A ($1,500 including preparation), asylum EAD ($550). USCIS form pages load fees by script and could not be read.

## Permanent residents and naturalization

**Long absences. CONFIRMED.** INA 101(a)(13)(C)(ii): a permanent resident is regarded as seeking admission if "absent from the United States for a continuous period in excess of 180 days". https://www.law.cornell.edu/uscode/text/8/1101 . 8 CFR 211.1(a)(2): the green card is an entry document only "after a temporary absence of less than 1 year". https://www.law.cornell.edu/cfr/text/8/211.1 . 8 CFR 223.1(a): a reentry permit lets a resident apply for admission during its validity without a returning resident visa. https://www.law.cornell.edu/cfr/text/8/223.1 . Not read: reentry permit validity length and fee.

**Naturalization timing. CONFIRMED** (INA 316(a), 316(b), 319(a) in rules-verification.md section 10). **Early filing CONFIRMED:** 8 CFR 334.2(b): "may be filed up to 90 days prior to the completion of the required period of residence". https://www.law.cornell.edu/cfr/text/8/334.2

**English and civics. CONFIRMED.** INA 312(a)(1): "an understanding of the English language, including an ability to read, write, and speak words in ordinary usage"; (a)(2): "knowledge and understanding of the fundamentals of the history, and of the principles and form of government". https://www.law.cornell.edu/uscode/text/8/1423 . **Retest CONFIRMED:** 8 CFR 312.5(a): an applicant who does not pass "will be afforded a second opportunity to pass the test(s) within 90 days after the first examination". https://www.law.cornell.edu/cfr/text/8/312.5 . The 2025 civics test format (128 questions, 20 asked, 12 correct) is LIKELY only and is not stated in the game.

**When citizenship begins. CONFIRMED.** 8 CFR 337.9(a): an applicant "shall be deemed a citizen of the United States as of the date on which the applicant takes the prescribed oath of allegiance". https://www.law.cornell.edu/cfr/text/8/337.9

**Noncitizen voting. CONFIRMED.** 18 U.S.C. 611(a): unlawful for any alien to vote in an election for President, Vice President, presidential elector, Senate, House, Delegate or Resident Commissioner (limited exceptions in (c)); penalty: fine, up to one year, or both. https://www.law.cornell.edu/uscode/text/18/611 . INA 237(a)(6)(A): "Any alien who has voted in violation of any Federal, State, or local constitutional provision, statute, ordinance, or regulation is deportable." https://www.law.cornell.edu/uscode/text/8/1227

## Entered without inspection (data and consequences only)

All CONFIRMED in verified-law.md or research/unauthorized-entry.md: no adjustment without inspection and admission (245(a)); 245(i) closed to recent arrivals; bars on departure (212(a)(9)(B)); 212(a)(9)(C) after reentry without admission; asylum available regardless of manner of arrival with a one-year deadline; EOIR backlog about 3.3 million at end of FY2026 and about 311,000 in absentia orders in FY2025. Cancellation of removal (10 years, exceptional hardship to a USC or LPR relative, 4,000 cap) is LIKELY only and is shown as reported, with a pointer to counsel.

## Left out or softened because not verified
- That the physical green card arrives by mail after an immigrant visa admission (not stated as a rule).
- Overstay voiding a visa (INA 222(g)): not read, removed.
- Consequences of a missed biometrics appointment or unanswered RFE (8 CFR 103.2(b)(13)): not read; cards say only that the case can stall or be decided on the record.
- Renewing a denied I-485 in court for non-asylees: not read; the card says to ask an attorney.
- Separate spouse interviews: not stated as a rule.
- Whether a permanent resident's status survives an expired card: not stated; the card only says renewal uses Form I-90.
- I-130 processing used as about 11 months before the I-601A card (USCIS historical median, CONFIRMED in us-rules-and-timeline.md 3.3, FY2023-2024).
