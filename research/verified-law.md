# Verified statute and regulation text (read directly, 2026-11-08)

Source pages: Cornell LII copies of 8 U.S.C. 1255 and 1182 and 8 CFR 214.1. For the two statutes only the first 100,000 characters were read; the sections below all fell inside that range. This is game-design reference, not legal advice. Confidence: CONFIRMED means the statutory or regulatory text was read this session.

## Adjustment of status: INA 245 (8 U.S.C. 1255) CONFIRMED
https://www.law.cornell.edu/uscode/text/8/1255
- **245(a):** adjustment requires that the person was inspected and admitted or paroled (or has an approved VAWA self-petition), applies, is eligible for an immigrant visa and admissible, and has an immigrant visa immediately available when filing.
- **245(c) bars:** adjustment is barred for someone who accepts unauthorized employment before filing, is in unlawful immigration status on the filing date, or has not maintained lawful status since entry.
- **Immediate-relative exemption:** clause (2) (the unauthorized-employment and status bars) carves out "an immediate relative as defined in section 1151(b)". So the spouse, parent or unmarried child under 21 of a US citizen is not blocked by those bars. Clauses (7) and (8) contain no such exemption.
- **245(k):** employment-based applicants (EB-1, 2, 3, 5, and some special immigrants) may adjust despite (c)(2), (c)(7) and (c)(8) if they were in a lawful admission and, since that admission, did not exceed an aggregate of 180 days of failure to maintain status, unauthorized work or other violation.
- **245(i):** only for people who were beneficiaries of a petition or labor certification filed on or before April 30, 2001 (and present on December 21, 2000 if filed after January 14, 1998), with a $1,000 payment. So it is **not available to anyone arriving 2015 or later** (apart from rare qualifying family derivatives).

**Game modeling consequences**
- A student, visitor or worker who **marries a US citizen** can adjust even after a status lapse or unauthorized work, as long as they were inspected and admitted or paroled. Someone who entered without inspection cannot, and 245(i) is closed to recent arrivals.
- **Marrying a permanent resident** (a family-preference category, not an immediate relative) does not get this exemption.
- **Employment-based** adjustment survives up to 180 days of violations in aggregate.

## Unlawful presence bars: INA 212(a)(9)(B) (8 U.S.C. 1182) CONFIRMED
https://www.law.cornell.edu/uscode/text/8/1182
- **3-year bar:** more than 180 days but less than 1 year of unlawful presence, voluntary departure before removal proceedings began, then seeking admission within 3 years of departure.
- **10-year bar:** unlawful presence of 1 year or more, then seeking admission within 10 years of departure or removal.
- **Timing:** both bars run from the date of departure or removal.
- **Exceptions:** time under age 18 does not count; time while a bona fide asylum application is pending generally does not count (unless working without authorization).
- **Tolling:** for someone lawfully admitted or paroled who filed a nonfrivolous change or extension request before the stay expired and did not work without authorization, the clock is tolled while it is pending, up to 120 days.
- **Waiver (B)(v):** for the spouse, son or daughter of a US citizen or permanent resident, on a showing of extreme hardship to the citizen or resident **spouse or parent**. Hardship to the applicant, or to children, does not count. Discretionary and not subject to court review.
- **212(a)(9)(C):** more than 1 year of aggregate unlawful presence, or a removal order, followed by entering or attempting to enter without admission, makes a person inadmissible; the only exception is seeking admission more than 10 years after the last departure with DHS consent. The text does not use the label "permanent bar" and it is a different rule from (B).

**Game modeling consequences:** the bars matter only after leaving the US, so out-of-status characters who stay do not trigger them. The trap is leaving to "fix" things, for example to attend a consular interview or a family funeral. The waiver depends on a US-citizen or resident spouse or parent.

## Grace period after job loss: 8 CFR 214.1(l)(2) CONFIRMED
https://www.law.cornell.edu/cfr/text/8/214.1
- Applies to E-1, E-2, E-3, H-1B, H-1B1, L-1, O-1 and TN workers (and dependents).
- Up to **60 consecutive days or the end of the authorized validity period, whichever is shorter**, usable **once per authorized validity period**. DHS may shorten or eliminate it.
- The person is not considered to have failed to maintain status solely because employment ended, but may not work unless otherwise authorized.
- During the grace period they can apply for an extension (214.1(c)(4)) or a change of status (8 CFR 248.1).
- Unauthorized employment is itself a failure to maintain status (214.1(e)(2)).
- An extension cannot be approved for someone whose status lapsed before filing, except where USCIS excuses a late filing; denials of extension requests cannot be appealed (214.1(c)(7)).

## Entry without inspection, removal and asylum CONFIRMED (statute text read 2026-11-08)
Sources: https://www.law.cornell.edu/uscode/text/8/1325, https://www.law.cornell.edu/uscode/text/8/1326, https://www.law.cornell.edu/uscode/text/8/1225, https://www.law.cornell.edu/uscode/text/8/1158

- **Improper entry, INA 275 (8 U.S.C. 1325):** it is an offense to enter or try to enter at a time or place other than one designated by immigration officers, to evade inspection, or to enter by willfully false or misleading representation. First offense: fine and up to 6 months. Subsequent offense: up to 2 years. Civil penalty of $50 to $250 per entry (doubled for repeats), in addition to other penalties.
- **Reentry after removal, INA 276 (8 U.S.C. 1326):** a person who was denied admission, excluded, deported or removed (or left while an order was outstanding) and then enters, tries to enter or is found in the US without consent faces up to 2 years. Enhanced to up to 10 years if the earlier removal followed three or more qualifying misdemeanors or a felony, up to 20 years after an aggravated felony. Limits exist on challenging the earlier order in a criminal case.
- **Expedited removal, INA 235(b)(1) (8 U.S.C. 1225):** arriving people found inadmissible for fraud or lacking documents are ordered removed without a hearing, **unless they say they intend to apply for asylum or fear persecution**, in which case they are referred for a credible-fear interview. The statute lets the executive branch extend these procedures to people **inside the US who cannot show 2 years of continuous presence**, at the designating official's discretion and modifiable at any time. Credible fear means a "significant possibility" the person could establish asylum eligibility. A positive finding leads to detention for further consideration of the asylum application; a negative one leads to removal, with a supervisory immigration-judge review requested by the person, generally within 24 hours where practicable and no later than 7 days.
- **Asylum, INA 208 (8 U.S.C. 1158):** anyone physically present in or arriving in the US may apply **regardless of status or manner of arrival, including arriving between ports**. The application is due within **one year** of arrival unless changed or extraordinary circumstances are shown. Bars include safe third country agreements, firm resettlement elsewhere, certain crimes, persecutor and security grounds, and a prior denied application. The applicant carries the burden of showing a protected ground was a central reason for persecution. Work authorization cannot be granted earlier than **180 days after filing**; people granted asylum must be authorized to work.

**Game modeling consequences**
- Crossing without inspection is a **criminal and civil offense**, but it does **not** itself erase the right to **ask for asylum**; what matters is whether the person survives screening and, if so, wins the case.
- Someone removed and later re-entering without consent faces **prison exposure**, so "try again" is a real choice with real cost.
- Anyone who entered without inspection **cannot adjust status** through marriage or an employer (see the adjustment findings above), so the realistic options are asylum or other relief, a long court case, informal life, or returning home.
- Asylum work permits come at least **180 days** after filing, so the first year or more is informal-work territory.
- Expedited-removal reach for people already inside the US (2-year rule) and the executive designations that expanded it in 2019 and 2025 must be checked by the border research agent.

## Still to verify from primary text
OPT unemployment day limits (8 CFR 214.2(f)); I-601A (8 CFR 212.7); 212(e) J-1 home residence rule; cancellation of removal (INA 240A); naturalization (INA 316 and 319); public charge rules by year; Visa Bulletin history.

## F-1 student rules used by the Immigrant slice CONFIRMED (regulation text read 2026-11-08)
Sources: https://www.law.cornell.edu/cfr/text/8/214.2 (8 CFR 214.2(f), read from the first 200,000 of about 513,000 characters) and https://www.law.cornell.edu/cfr/text/8/214.3 (8 CFR 214.3(g)).
- **Reduced course load, 214.2(f)(6):** a DSO may authorize it for academic difficulty (English, US teaching methods, course placement), a documented medical condition, or the final term. Minimum reduced load generally six semester or quarter hours. Academic-difficulty reductions: once per program level; medical: up to 12 months in aggregate. **Dropping below full-time without prior DSO approval is considered out of status.**
- **On-campus work, 214.2(f)(9)(i):** up to 20 hours a week while school is in session, full-time during breaks and annual vacation; on school premises or an educationally affiliated site; may not start more than 30 days before classes.
- **Off-campus work, 214.2(f)(9)(ii):** generally after one full academic year in F-1 status with good standing, a DSO recommendation and USCIS work permit (I-765); capped at 20 hours in session; hardship route exists.
- **CPT, 214.2(f)(10)(i):** may begin only after the DSO endorses the I-20; requires one full academic year of full-time enrollment, except for graduate programs that require immediate CPT.
- **F-2 dependants, 214.2(f)(15):** spouse and children may not accept employment; recreational study allowed; other study limited.
- **School reporting, 214.3(g)(2):** schools update SEVIS within 21 days of a change of student or dependant name or U.S. address, must report a student who fails to maintain status, and each term report whether students enrolled, dropped below full-time without DSO authorization, or failed to enroll (within 30 days after the registration deadline). The DSO sets a report date no more than 30 days before classes start. Text read does **not** create a general student-to-DSO address-reporting duty (STEM OPT students have their own 10-day duty).
- **Not verified:** travel-signature validity on the I-20 (SEVP guidance, not read), IRS Form 8843 filing duty.

## Reinstatement to F-1 status: 8 CFR 214.2(f)(16) CONFIRMED (regulation text read 2026-11-08)
Source: https://www.law.cornell.edu/cfr/text/8/214.2 (characters about 128,000 to 228,000 of 513,526).
- USCIS **may consider** reinstating a student who files Form I-539 with an I-20 carrying the DSO's recommendation for reinstatement.
- Conditions: the student has **not been out of status more than 5 months** when filing (exception if exceptional circumstances and filed "as promptly as possible"); **no record of repeated or willful violations**; is currently pursuing, or intends to pursue, a full course of study at the school that issued the I-20; **has not engaged in unauthorized employment**; is not deportable on any ground other than INA 237(a)(1)(B) or (C)(i).
- The student must show either (1) the violation resulted from circumstances **beyond the student's control** (examples: serious injury or illness, school closure, natural disaster, DSO error; not a pattern of violations or willful failure), or (2) the violation relates to a **reduced course load a DSO could have authorized** and denial would cause **extreme hardship**.
- If denied, SEVIS is updated and **the student may not appeal**.
- Not covered in the text read: unlawful presence and whether the student must leave.

**Game modeling consequences:** reinstatement is only open to out-of-status students who did **not** work without authorization and who file within about 5 months. A quiet course drop is the most reinstatable cause; unauthorized work rules reinstatement out; dismissal from school conflicts with the "pursue a full course at the same school" test. Denial cannot be appealed, so the game shows it as final.

## Criminal grounds of deportability: INA 237(a)(2) (8 U.S.C. 1227(a)(2)) CONFIRMED (statute text read 2026-11-08)
Source: https://www.law.cornell.edu/uscode/text/8/1227 (first 100,000 of 109,642 characters; the (a)(2) text was fully present).
- Applies to any noncitizen "in and admitted to the United States" who falls in a listed class; the Attorney General may order removal.
- **(a)(2)(A)(i) crime involving moral turpitude:** committed within 5 years after admission (10 years for some permanent residents) and punishable by a sentence of one year or longer.
- **(a)(2)(A)(ii):** two or more crimes involving moral turpitude at any time after admission, unless from a single scheme of misconduct.
- **(a)(2)(A)(iii):** an aggravated felony at any time after admission.
- **(a)(2)(B)(i):** any controlled-substance offense, except a single offense of simple possession of 30 grams or less of marijuana for personal use.
- **(a)(2)(C):** firearm offenses. **(a)(2)(E)(i):** domestic violence, stalking, child abuse.
- **(a)(1)(C)(i):** failing to maintain nonimmigrant status is itself a ground of deportability.

**Game modeling consequences:** a "desperation crime" (courier errands, theft, borrowed identity, unlicensed driving) carries monthly arrest risk; arrest leads to jail, a transfer to immigration custody and removal. Presented as consequences only, never as instructions. Not verified: how a given offence is classified, which depends on state law and the exact charge.
