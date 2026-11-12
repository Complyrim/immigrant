# Verified rules for the work-based roads (read 2026-11-09)

Source text: eCFR title 8, point-in-time version 2026-10-01, fetched as XML from
`https://www.ecfr.gov/api/versioner/v1/full/2026-10-01/title-8.xml?part=<part>&section=<section>` for 8 CFR 214.1, 214.2, 204.5, 245.2 and 274a.12, and searched in full (214.2 is about 715,000 characters). Human-readable copies: https://www.ecfr.gov/current/title-8 and https://www.law.cornell.edu/cfr/text/8. Game-design reference only, not legal advice. CONFIRMED means the regulation text was read this session. Anything else is labelled.

Used by `src/engine/content/work.ts`.

## OPT

1. **Applying for post-completion OPT** (CONFIRMED). 8 CFR 214.2(f)(11)(i), (f)(11)(i)(B)(2). The student starts by asking the DSO for a recommendation; the DSO signs the I-20. Form I-765 may be filed up to 90 days before the program end date and no later than 30 days after it, and within 30 days of the DSO entering the recommendation. Note: older versions of the rule said 60 days after; the 2026-10-01 text says 30. https://www.ecfr.gov/current/title-8/chapter-I/subchapter-B/part-214/section-214.2
2. **Twelve months, and again at a higher level** (CONFIRMED). 8 CFR 214.2(f)(10): "A student may be authorized 12 months of practical training, and becomes eligible for another 12 months of practical training when they change to a higher educational level." Post-completion training must be completed within 14 months after study ends, except a STEM extension (f)(10)(ii)(A); OPT ends automatically on a school transfer or a move to another educational level (f)(10)(ii)(B).
3. **Unemployment limit** (CONFIRMED). 8 CFR 214.2(f)(10)(ii)(E): "During post-completion OPT, F-1 status is dependent upon employment." No more than 90 days of aggregate unemployment during post-completion OPT; with a 24-month STEM extension, no more than 150 days over the whole OPT period.
4. **Reporting on OPT** (CONFIRMED). 8 CFR 214.2(f)(12)(i): report changes of name, address and any interruption of employment to the DSO. (f)(12)(ii)(A): STEM OPT students report changes of name, address, employer name or address, or loss of employment within 10 days; (f)(12)(ii)(B) six-month validation reports.
5. **STEM extension** (CONFIRMED). 8 CFR 214.2(f)(10)(ii)(C): 24 months for a qualifying STEM degree; (C)(5) the employer must be enrolled in E-Verify and have an EIN; (C)(6) the employer signs the Form I-983 training plan and agrees to report termination. (f)(11)(i)(C): file up to 90 days before current OPT expires and within 60 days of the DSO recommendation.
   - **Not read:** the 180-day continuation of work permission while a timely STEM extension is pending. The game cites the USCIS OPT page as summarised in research/visa-catalog.md (CONFIRMED there).
6. **Grace after OPT or study** (CONFIRMED). 8 CFR 214.2(f)(5)(v): "within 30 days from the end date of the study or training, depart the United States or otherwise seek to maintain lawful status." (Research fact `f1-grace-period` notes the rule is under court challenge.)
7. **Cap-gap** (CONFIRMED). 8 CFR 214.2(f)(5)(vii)(A): F-1 status and employment authorization of a student who is the beneficiary of a timely filed, nonfrivolous cap H-1B petition requesting change of status are extended until April 1 of the fiscal year requested or the petition validity start date, whichever is earlier. (B): the extension ends on rejection, denial, revocation or withdrawal of the petition, or denial or withdrawal of the change of status. (C): the student must not have violated status.
   - **Not verified:** how international travel during a pending change of status affects cap-gap. The game tells the player to ask an attorney and states that it was not verified.

## H-1B

8. **Registration and weighted selection** (CONFIRMED). 8 CFR 214.2(h)(8)(iii)(A)(4): selection is by unique beneficiary, counted once however many registrations are filed; only a selected registrant may file the petition. (4)(i): the registrant selects the highest OEWS wage level the offered wage meets (level I if below level I). (4)(ii) "Weighted selection": level IV entered four times, III three times, II twice, I once. The season in which this first applied (March 2026, FY2027) comes from research/us-rules-and-timeline.md (LIKELY rule date, USCIS alert CONFIRMED).
   - **Odds are designed estimates.** Reported overall selection rates FY2024 to FY2026 were about 25 to 35 percent (law-firm summaries, LIKELY, research/us-rules-and-timeline.md). No per-wage-level rate is published. The game uses 30 percent before the 2026 season, and 15 / 28 / 40 / 52 percent for wage levels I to IV from 2026, plus 6 points for a US master's holder. These are labelled estimates in the card lookback.
   - Registration fee $215 (CONFIRMED in research); paid by the employer in the game.
9. **False registration statements** (CONFIRMED). 8 CFR 214.2(h)(10)(ii): petition denied for false statements on the petition, H-1B registration, or labor condition application. Used for the "consultant" scam choice.
10. **Portability** (CONFIRMED). 8 CFR 214.2(h)(2)(i)(H): an eligible H-1B worker may start concurrent or new employment on the filing of a nonfrivolous H-1B petition, or the requested start date if later. Eligible means lawfully admitted in H-1B status, petition filed before the authorized stay expires, and not employed without authorization.
11. **One petition per employer** (CONFIRMED). 8 CFR 214.2(h)(2)(i)(C): services for more than one employer need a separate petition from each. (h)(2)(i)(D): a new employer must file a petition and request an extension of stay.
12. **Unauthorized work** (CONFIRMED). 8 CFR 214.1(e): nonimmigrants may only work as their class allows; unauthorized employment is a failure to maintain status. https://www.ecfr.gov/current/title-8/chapter-I/subchapter-B/part-214/section-214.1
13. **60-day grace period** (CONFIRMED in research/verified-law.md; re-read). 8 CFR 214.1(l)(2): for E, H-1B, L-1, O-1 and TN workers, up to 60 consecutive days or until the end of the validity period, whichever is shorter, once per validity period; no work; may file for extension or change of status (8 CFR 248.1).
14. **Initial validity and six-year limit** (CONFIRMED). 8 CFR 214.2(h)(9)(iii)(A)(1): H-1B petition valid up to 3 years. (h)(15)(ii)(B)(1): extensions up to 3 years; total stay may not exceed six years. (h)(13)(iii)(A): after six years in H or L status, the person must reside and be physically present outside the US for the immediate prior year before H or L again.
15. **Beyond six years (AC21)** (CONFIRMED). 8 CFR 214.2(h)(13)(iii)(D): eligible if at least 365 days have passed since a labor certification or an I-140 was filed; approvals in up to 1-year increments. (h)(13)(iii)(E): beneficiary of an approved EB-1, EB-2 or EB-3 petition who would be eligible but for the per-country limit; increments of up to 3 years; only the principal beneficiary.
16. **H-4 work permit** (CONFIRMED). 8 CFR 214.2(h)(9)(iv): an H-4 spouse may apply for employment authorization if the H-1B principal is the beneficiary of an approved I-140 or has AC21 (sections 106(a) and (b)) status.
17. **Cap-exempt employers** (CONFIRMED in research via the USCIS H-1B page, not re-read here): higher-education institutions, affiliated nonprofits, nonprofit or government research organizations.

## O-1

18. **Evidence** (CONFIRMED). 8 CFR 214.2(o)(3)(iii): sustained national or international acclaim, shown by a major internationally recognized award or at least three of eight kinds of evidence (prizes, selective memberships, published material about the person, judging, original contributions of major significance, scholarly articles, critical role at distinguished organizations, high salary).
19. **Consultation** (CONFIRMED). 8 CFR 214.2(o)(5)(i)(A): consultation with a peer group, labor or management organization is mandatory before approval.
20. **Validity** (CONFIRMED). 8 CFR 214.2(o)(6)(iii)(A): valid for the time needed for the event or activity, up to 3 years.
21. **Extensions** (CONFIRMED). 8 CFR 214.2(o)(12)(ii): extensions in increments of up to 1 year to continue or complete the same activity, plus 10 days. (o)(12)(iii): a denied extension may not be appealed.
22. **Agents and multiple employers** (CONFIRMED). 8 CFR 214.2(o)(2)(iv)(B): working for more than one employer at the same time needs separate petitions unless an established agent files. (C): a new employer files a petition and extension request; agent-filed petitions need an amendment. (F): a US agent may petition for traditionally self-employed workers or those who use agents with numerous employers.

## Employment green cards

23. **Priority date** (CONFIRMED). 8 CFR 204.5(d): with a labor certification, the date DOL accepted it; otherwise the date the complete I-140 is properly filed. https://www.ecfr.gov/current/title-8/chapter-I/subchapter-B/part-204/subpart-A/section-204.5
24. **Keeping a priority date** (CONFIRMED). 8 CFR 204.5(e): an approved EB-1, 2 or 3 petition gives its priority date to later EB-1, 2 or 3 petitions; earliest date wins; lost only on revocation for fraud, DOL revocation or invalidation of the labor certification, or material error. Used for job changes and for "porting" an Indian EB-2 date into EB-1.
25. **Labor certification for EB-2** (CONFIRMED). 8 CFR 204.5(k)(4): EB-2 petitions need an individual labor certification unless the job offer is waived.
26. **National interest waiver** (CONFIRMED). 8 CFR 204.5(k)(1): if the job-offer requirement is waived in the national interest, the person may petition for themselves. (k)(2): advanced degree means a US degree above a bachelor's or a foreign equivalent, or a bachelor's plus five years of progressive experience.
   - **Not read:** the case-law test for "national interest" (Matter of Dhanasar). The game says officers apply case law not read for this game.
27. **EB-1A** (CONFIRMED). 8 CFR 204.5(h)(1): "An alien, or any person on behalf of the alien" may file. (h)(2): "one of that small percentage who have risen to the very top of the field." (h)(3): a one-time major international award or at least three of ten listed kinds of evidence. (h)(5): no job offer or labor certification needed, but evidence of continuing work in the field.
28. **When adjustment can be filed** (CONFIRMED). 8 CFR 245.2(a)(2)(i)(A): an immigrant visa must be immediately available. (B): for EB-1, EB-2 and EB-3 the I-485 may be filed concurrently with or after the I-140 if approval would make a visa immediately available. https://www.ecfr.gov/current/title-8/chapter-I/subchapter-B/part-245/section-245.2
29. **Work permit while adjustment is pending** (CONFIRMED). 8 CFR 274a.12(c)(9).
30. **180-day forgiveness** (CONFIRMED in research/verified-law.md): INA 245(k).
31. **Fees** (CONFIRMED in research/visa-catalog.md from USCIS G-1055): I-485 $1,440; I-140 $715 plus $600 Asylum Program Fee. OPT and STEM I-765 fees were not sourced; the game shows "about $500 (a designed estimate)". Lawyer fees are designed estimates.

## Backlogs (LIKELY, secondary)

32. November 2026 Visa Bulletin final action dates as reported by secondary sources in research/us-rules-and-timeline.md and research/visa-catalog.md (travel.state.gov returned 403 again on 2026-11-09): EB-1 India 01FEB23, Rest of World and Mexico current; EB-2 India 01NOV13, Rest of World and Mexico 01APR25; EB-3 India 22JAN14, Rest of World and Mexico 15JUN24. Nigeria is charged to Rest of World.
   - **Designed waits used by the game** (years from priority date to current): India EB-1 4, EB-2 13, EB-3 13; Mexico and Nigeria EB-1 0, EB-2 2, EB-3 2. Derived by subtraction from the dates above and rounded. Every card that uses them says they are estimates that move monthly and can retrogress.

## Not verified and left out or flagged as uncertain

- PERM processing time and recruitment steps (DOL, 20 CFR 656 not read). The game shows about 15 months from filing to certification as a designed estimate and does not describe recruitment rules.
- Whether the $100,000 H-1B payment applies to change-of-status petitions from inside the US (contested in court; research/us-rules-and-timeline.md). Left out of the cards.
- Dual intent for H-1B and O-1. Not used.
- The effect of travel on a pending change of status (cap-gap card says so).
- Matter of Dhanasar's three-part NIW test.
