# US Visa and Status Catalog - "Immigrant" game legal-status engine

Compiled 2026-11-08. Game research, not legal advice.

## How to read this file
- **CONFIRMED** = a primary source was read in this session (URL given).
- **LIKELY** = secondary source (law firm, news) seen this session (URL given).
- **UNVERIFIED** = from background knowledge; no source read this session. The URL is where to verify it. Do not treat UNVERIFIED lines as settled.
- Many category entries below have only a few CONFIRMED facts. That is deliberate. Rules-level checks (fees, bars, caps) are in `rules-verification.md`.
- Country tags: **[IN]** India, **[MX]** Mexico, **[NG]** Nigeria.
- Entry fields: Who / Stay / Work / Family / Intent and GC path / Loss and grace / Fees / Cap / **Model**.

## Global context for 2015-2026 (affects many categories)
- Travel-ban proclamation effective 2026-01-01 puts **Nigeria** under partial suspension: immigrant visas and nonimmigrant B-1, B-2, F, M, J; other nonimmigrant visas get reduced validity; exceptions for LPRs, A/G/NATO etc., case-by-case waivers; India and Mexico not listed. CONFIRMED https://www.whitehouse.gov/presidential-actions/2025/12/restricting-and-limiting-the-entry-of-foreign-nationals-to-protect-the-security-of-the-united-states/
- State Dept pause on immigrant-visa issuance for 75 countries incl. Nigeria from 2026-01-21 (public charge review). LIKELY https://www.mintz.com/insights-center/viewpoints/2806/2026-01-29-state-department-suspends-immigrant-visa-processing-75
- F/J/I "duration of status" replaced by fixed admission periods (final rule published 2026-07-17). CONFIRMED listing https://www.federalregister.gov/documents/2026/07/17/2026-14439/establishing-a-fixed-time-period-of-admission-and-an-extension-of-stay-procedure-for-nonimmigrant ; eCFR text CONFIRMED https://www.ecfr.gov/api/versioner/v1/full/2026-10-01/title-8.xml?part=214&section=214.2
- $100,000 H-1B payment (from 2025-09-21): vacated 2026-06-08, stay denied 2026-07-24, DHS "plans to collect if lifted". CONFIRMED https://www.uscis.gov/working-in-the-united-states/h-1b-specialty-occupations
- H-1B selection wage-weighted from FY2027 (rule effective 2026-02-27). LIKELY https://natlawreview.com/article/uscis-finalizes-wage-weighted-h-1b-cap-selection-rule-effective-feb-27-2026
- Fees: current schedule edition 10/26/26. CONFIRMED https://www.uscis.gov/g-1055 . Fee-rule step changes: Dec 2016 (UNVERIFIED) and Apr 1 2024 (UNVERIFIED date; values match current schedule).
- 9-11 Response and Biometric Entry-Exit Fee on H-1B/L-1 for covered employers from 2026-09-09. CONFIRMED https://www.uscis.gov/i-129
- Governing statute: INA at https://www.law.cornell.edu/uscode/text/8/1101 (8 USC 1101(a)(15) defines the nonimmigrant letters). UNVERIFIED for each letter's text, not read.

---

# PART 1: NONIMMIGRANT CATEGORIES

### A-1 / A-2 / A-3 (diplomats and officials)
- Who: ambassadors, diplomats, career officials of recognized governments and immediate family; A-3 personal employees. UNVERIFIED (8 USC 1101(a)(15)(A)). Exempt from the 2026 travel ban (A-1/A-2). CONFIRMED (whitehouse URL above).
- Stay: duration of mission, no fixed term. Work: only official duties; dependents via separate rules. Intent: no GC path unless leaving the post. Fees: I-539 $0 for A, G, NATO. CONFIRMED https://www.uscis.gov/g-1055
- **Model:** NPC-style special case; status ends with posting; almost never a player start.

### B-1 / B-2 (visitor for business / pleasure)
- Who: short stays; B-1 business meetings, no local work; B-2 tourism/medical/visit family. UNVERIFIED https://www.uscis.gov/visit-the-united-states
- Stay: up to 6 months typical, I-539 extension (fee $470/$420 CONFIRMED). No work. No dependents. Presumed immigrant intent (must show ties). **[NG]** B visas under the 2026 partial suspension. CONFIRMED (whitehouse).
- Loss: overstay -> unlawful presence after the I-94 date. 8 USC 1182(a)(9)(B) CONFIRMED https://www.law.cornell.edu/uscode/text/8/1182
- Change of status to F-1 possible if no preconceived intent (UNVERIFIED).
- **Model:** default "entry" status for family visits; timer = I-94 date; high denial risk for single young applicants with weak ties; Nigeria 2026 block.

### C-1 (transit) / C-2 / C-3
- Who: continuous transit through the U.S. to a third country; C-2 UN HQ district; C-3 foreign officials in transit. UNVERIFIED. C-2, C-3 exempt from the 2026 ban (CONFIRMED whitehouse).
- **Model:** only appears as a visa-denial/transit event; no gameplay timer.

### D (crewmember)
- Who: ship/airline crew. UNVERIFIED. Stay: shore leave, generally 29 days. No GC path (INA 245(c) bars crewmen CONFIRMED https://www.law.cornell.edu/uscode/text/8/1255).
- **Model:** skip or use as a "jumped ship" backstory only.

### E-1 treaty trader / E-2 treaty investor / E-3 (Australia)
- Who: nationals of treaty countries (list on State's site, not retrievable: travel.state.gov 403). E-2: substantial capital at risk, 50%+ ownership or control, enterprise not marginal. CONFIRMED https://www.uscis.gov/working-in-the-united-states/temporary-workers/e-2-treaty-investors
- Stay: initial 2 years, unlimited 2-year extensions, automatic 2-year readmission on return. CONFIRMED (same URL). Work: employer/enterprise-specific; **E-2 spouse employment authorized incident to status** CONFIRMED (same URL; spouse of E-2). I-129 fee $1,015/$965 plus Asylum Program Fee $600 for E-1/E-2/E-3 CONFIRMED https://www.uscis.gov/g-1055 . Grace 60 days once per validity. CONFIRMED https://www.ecfr.gov/api/versioner/v1/full/2026-10-01/title-8.xml?part=214&section=214.1
- Intent: nonimmigrant intent; no GC path but not formally barred from filing.
- Country relevance: **[IN]** India has no E-1/E-2 treaty (UNVERIFIED); **[MX]** Mexico is a treaty country for E-1/E-2 via USMCA/NAFTA chapters (UNVERIFIED); **[NG]** Nigeria not on the E list as far as I recall (UNVERIFIED). E-3 = Australian citizens only, 10,500 per year (UNVERIFIED) https://www.uscis.gov/working-in-the-united-states/temporary-workers/e-3-certain-specialty-occupation-professionals-from-australia
- **Model:** unlock only if the character's passport country is on a treaty list; renewable status with no clock, good "stuck" archetype; spouse can work.

### F-1 (academic student) and F-2
- Who: full-time students at SEVP-certified schools; I-20 from school. UNVERIFIED for entry mechanics; the CFR text of fixed admission is CONFIRMED.
- Stay: **fixed period to complete the program, max 4 years, +30 days before report date and +30 days after program end** (from the 2026 rule; before that duration of status). CONFIRMED https://www.ecfr.gov/api/versioner/v1/full/2026-10-01/title-8.xml?part=214&section=214.2 . Pre-rule D/S: see rules-verification.md item 1.
- Work: on-campus restricted; off-campus not in first academic year, then CPT, OPT, STEM OPT, severe economic hardship. CONFIRMED https://www.uscis.gov/working-in-the-united-states/students-and-exchange-visitors/students-and-employment . Full-time CPT of 12 months or more eliminates OPT eligibility (UNVERIFIED, 8 CFR 214.2(f)(10)(i)).
- OPT 12 months post-completion; STEM OPT 24-month extension; later higher-level STEM degree allows one more 24-month extension; unemployment 90 days then 150 total; employer must be E-Verify with I-983 training plan; auto-extension 180 days on timely filing. CONFIRMED https://www.uscis.gov/working-in-the-united-states/students-and-exchange-visitors/optional-practical-training-extension-for-stem-students-stem-opt and eCFR 214.2(f)(10) (CONFIRMED). Cap-gap: UNVERIFIED (pointer 8 CFR 214.2(f)(5)(vi)).
- F-2: spouse and unmarried children under 21; may study part-time; no work. UNVERIFIED (8 CFR 214.2(f)(15)).
- Intent: nonimmigrant intent required at visa issuance; dual intent is not formal for F-1 (UNVERIFIED). Change of status to H-1B is routine. GC path via employer or marriage.
- Loss and grace: 60-day period after OPT/program is not the rule; the **30-day** post-completion grace is CONFIRMED (eCFR above). Violations: dropping below full course load, unauthorized work, SEVIS termination (UNVERIFIED). OPT fees: I-765 category (c)(3) fee is on G-1055 App. C; premium processing for OPT $2,075 or $1,780 (mapping ambiguous). CONFIRMED partially https://www.uscis.gov/g-1055 . OPT fee proposed rule 2026-10-08: title only https://www.federalregister.gov/documents/2026/10/08/2026-20660/optional-practical-training-fees
- Cap: none. **[IN]** largest source of H-1B/OPT; **[NG]** F visas under 2026 partial suspension (CONFIRMED whitehouse); **[MX]** F-1 allowed, many dependent on funding.
- **Model:** the main "build credits" path: school -> OPT (12) -> STEM OPT (24) -> H-1B lottery -> EB green card; track unemployment-day counter (90/150), a 4-year fixed admission clock, and a 30-day grace.

### G-1 to G-5 (international organizations)
- Who: representatives and employees of international organizations and family. UNVERIFIED. G-1 through G-4 exempt from the 2026 ban (CONFIRMED whitehouse). I-539 fee $0 for A, G, NATO (CONFIRMED G-1055).
- **Model:** NPC/special-case, status tied to employment; rare player start.

### H-1B (specialty occupation) and H-1B1 (Chile, Singapore), H-1B2/B3
- Who: bachelor's-level specialty occupation job. Cap 65,000 plus 20,000 U.S. master's; cap-exempt higher-ed, affiliated nonprofits, nonprofit/government research. CONFIRMED https://www.uscis.gov/working-in-the-united-states/h-1b-specialty-occupations
- Stay: 3 years +3 = 6 years max; owners >50%: 18-month blocks; beyond 6 years with pending/approved immigrant petition (365 days after PERM/I-140, or approved I-140 stuck on backlog). CONFIRMED (same URL). Employer-specific (portability on filing a non-frivolous I-129). CONFIRMED. After 6 years in H/L, need 1 year abroad. CONFIRMED eCFR 214.2(h)(13)(iii)(A).
- Family: H-4 spouse and unmarried children under 21; H-4 EAD only for spouses after the principal starts the green card process (approved I-140 or AC21 extension; trigger text UNVERIFIED). CONFIRMED partially https://www.ecfr.gov/api/versioner/v1/full/2026-10-01/title-8.xml?part=274a&section=274a.12
- Intent: **dual intent allowed** for H-1B/L (UNVERIFIED in this session; INA 214(b) carve-out; the USCIS page did not state it).
- Loss and grace: up to 60 consecutive days (once per validity period) to find a new sponsor, change status or leave. CONFIRMED https://www.ecfr.gov/api/versioner/v1/full/2026-10-01/title-8.xml?part=214&section=214.1
- Fees (filing day): I-129 $780/$730 + $600 Asylum Program Fee ($0 nonprofit, $300 small) + $500 Fraud fee + ACWIA + possible Pub. L. 114-113 fee; premium $2,965. CONFIRMED https://www.uscis.gov/g-1055 . Registration fee, historical changes ($10 -> $215 in 2025): UNVERIFIED. $100,000 payment: vacated June 2026 (CONFIRMED). Selection: random through FY2026 registration, weighted from FY2027 (LIKELY).
- H-1B1: Chile and Singapore only; cap reservation 1,400 and 5,400 (UNVERIFIED), annual renewals. Not for IN/MX/NG.
- **[IN]** biggest H-1B nationality and the most backlogged green card queue (EB-2 India 01NOV13, EB-3 India 22JAN14 CONFIRMED-secondary: https://www.gozellaw.com/blog/november-2026-visa-bulletin ); **[MX]** TN is the usual route instead; **[NG]** works but B/F/J affected by 2026 ban; H-1B itself is not listed in Sec. 5 (CONFIRMED whitehouse).
- **Model:** the key mid-game state; lottery roll (probability depends on year and wage level), 6-year clock, 60-day grace timer, H-4 spouse gating, cap-exempt branch for university jobs, and a cost flag for the contested $100k.

### H-2A (agricultural) / H-2B (non-agricultural seasonal)
- H-2A: temporary agricultural workers; no cap; certification by DOL. UNVERIFIED (USCIS H-2A page not read).
- H-2B: 66,000 per fiscal year, 33,000 for each half-year; max 3 years then 60 days outside; H-4 dependents may not work; the old eligible-country list is not considered after 2025-01-17. CONFIRMED https://www.uscis.gov/working-in-the-united-states/temporary-workers/h-2b-temporary-non-agricultural-workers
- Employer-specific; 60-day grace for cessation of employment (H-2A/B) CONFIRMED eCFR 214.2(h)(13)(i)(C). Nonimmigrant intent only; no GC path unless other basis. I-129 H-2B premium $1,780; fee rows for H-2 petitions not extracted (UNVERIFIED).
- **[MX]** the main source nationality for H-2A/B (UNVERIFIED); **[IN]/[NG]** negligible.
- **Model:** seasonal/rural entry; no dual intent; return-home resets; high risk of overstays.

### H-3 (trainee / special education exchange)
- Who: non-employment trainees, up to 24 months (trainee) / 18 months (special ed). UNVERIFIED. I-129 fee $1,015/$965 CONFIRMED G-1055. No work except training. No GC path.
- **Model:** rare; optional.

### H-4 and H-4 EAD
- See H-1B above. H-4 dependents: no work incident to status; EAD under 8 CFR 274a.12(c)(26) after the principal's green card process starts. CONFIRMED (eCFR). Age-out at 21 is the big hazard (UNVERIFIED).
- **Model:** spouse subplot: EAD unlock event; child "age out" counter.

### I (foreign media)
- Who: representatives of foreign media. Under the 2026 rule I-visa admission is up to 240 days with limited exceptions (LIKELY: https://natlawreview.com/article/dhs-publishes-final-rule-replacing-duration-status-fixed-admission-periods-f-j-and ). Work: employer (media) specific. No GC path (nonimmigrant intent).
- **Model:** rare.

### J-1 (exchange visitor) and J-2
- Who: students, research scholars, professors, interns, au pairs, physicians, camp counselors, etc., via designated sponsors (DS-2019). UNVERIFIED (state.gov blocked; use https://j1visa.state.gov/ ).
- Stay: program length; fixed period under the 2026 rule (max 4 years per LIKELY secondary). Work: sponsor-authorized only. J-2: spouse and children; may apply for EAD (UNVERIFIED).
- **Two-year home residence requirement (INA 212(e))**: applies if funded by the US or home government, if the skill is on the exchange visitor skills list, or for graduate medical education. Waivers: no-objection statement, request by an interested US government agency, fear of persecution, exceptional hardship to a USC/LPR spouse or child, and the Conrad 30 program for physicians. I could not read INA 212(e); this is UNVERIFIED (Cornell page truncated: https://www.law.cornell.edu/uscode/text/8/1182 ). Bar blocks H, L, and immigrant status until satisfied or waived.
- **[IN]/[NG]/[MX]**: skills list historically included India and Nigeria; Mexico also in some years. UNVERIFIED and not suitable to cite; check the current list. **[NG]** J visas under 2026 partial suspension (CONFIRMED whitehouse).
- **Model:** a flag `home_residency_212e` that blocks H/L/GC until a waiver event; useful for scholar/physician characters.

### K-1 / K-2 (fiance(e)) and K-3/K-4
- Who: fiance(e) of a U.S. citizen; must marry within 90 days; then file I-485. UNVERIFIED (the USCIS page returned 404 this session: https://www.uscis.gov/family/family-of-us-citizens/bringing-fiance-e-to-live-in-the-united-states ). K-2 = unmarried child under 21. No extension beyond 90 days; if not married, must leave. Work: EAD can be applied for after arrival (UNVERIFIED).
- Fees: I-129F fee on G-1055 not extracted (UNVERIFIED); I-485 $1,440/$1,390 CONFIRMED.
- Related: K-3/K-4 (spouse of USC who filed I-130) is obsolete in practice (UNVERIFIED).
- **Model:** a hard 90-day marriage clock; failure converts to out-of-status.

### L-1A / L-1B / L-2
- L-1A: intracompany executive/manager; 1 continuous year in the last 3 with a qualifying foreign affiliate; initial 3 years (1 year for new office), 2-year extensions up to **7 years**. CONFIRMED https://www.uscis.gov/working-in-the-united-states/temporary-workers/l-1a-intracompany-transferee-executive-or-manager
- L-1B specialized knowledge: 5 years max (UNVERIFIED, page not read). L-2: spouse and children; **spouse (L-2S) employment authorized incident to status** CONFIRMED (same URL). Blanket L petitions. Dual intent allowed (UNVERIFIED in this session). Fee I-129 L: not extracted from G-1055 (UNVERIFIED); 9-11 fee for covered employers. CONFIRMED https://www.uscis.gov/i-129 . Grace 60 days. CONFIRMED eCFR 214.1(l)(2).
- GC path: EB-1C multinational manager (no PERM). UNVERIFIED.
- **[IN]** large via IT firms; **[MX]/[NG]** possible via a foreign affiliate.
- **Model:** corporate transfer path; 7-year clock; EB-1C shortcut.

### M-1 / M-2 (vocational students)
- Who: vocational/nonacademic school students. UNVERIFIED. Fixed period, max 1 year, practical training only after completing studies (CONFIRMED partially https://www.uscis.gov/working-in-the-united-states/students-and-exchange-visitors/students-and-employment ). Change of school restricted. Under the 2026 ban, M visas for **[NG]** suspended (CONFIRMED whitehouse).
- **Model:** minor branch; low GC viability.

### N (parent/child of SK-3 special immigrant), NATO-1 to NATO-7
- N: dependents of certain special immigrants, rare (UNVERIFIED). NATO: NATO staff and family (UNVERIFIED). NATO-1 to NATO-6 exempt from ban (CONFIRMED whitehouse); I-539 fee $0 (CONFIRMED).
- **Model:** NPC-only.

### O-1A / O-1B / O-2 / O-3
- O-1A: extraordinary ability in sciences, education, business, athletics (very top of the field); O-1B arts or motion picture/TV extraordinary achievement. Three types of evidence, peer consultation required. Initial up to 3 years; extensions up to 1 year each. O-2 support staff; O-3 spouse/children (no work, can study). CONFIRMED https://www.uscis.gov/working-in-the-united-states/temporary-workers/o-1-visa-individuals-with-extraordinary-ability-or-achievement
- Employer/agent files I-129 ($1,055/$1,005 + $600 Asylum Program Fee; premium $2,965). CONFIRMED G-1055. No numerical cap (UNVERIFIED; page silent). Dual intent allowed (UNVERIFIED). Grace 60 days. CONFIRMED eCFR 214.1(l)(2).
- GC path: EB-1A (self-petition) or NIW. UNVERIFIED.
- **[IN]/[NG]/[MX]**: no restrictions on nationality.
- **Model:** high-skill alternative to the H-1B lottery; evidence score gate (3 of 8 criteria).

### P-1 / P-2 / P-3
- Who: P-1 athletes and entertainment groups; P-2 reciprocal exchange artists; P-3 culturally unique artists. UNVERIFIED (page not read). Employer-specific; I-129 fee $1,015/$965 CONFIRMED G-1055. P-4 family no work.
- **Model:** optional.

### Q-1 (cultural exchange) / Q-2
- Short-term (15 months max) cultural exchange program (UNVERIFIED). I-129 $1,015/$965 (CONFIRMED G-1055). Skip for gameplay.

### R-1 / R-2 (religious workers)
- R-1: member of a religious denomination for 2 years, working as a minister or in a religious occupation; 30 months initial, extensions total 5 years max; then 1 year abroad (UNVERIFIED). I-129 R fee $510 + Asylum Program Fee (CONFIRMED G-1055). R-2 no work.
- GC path: EB-4 religious workers (non-minister program sunset date UNVERIFIED; the USCIS page returned 404).
- **Model:** niche; 5-year clock; EB-4 sunset risk.

### S (informants)
- Rare; S-5/S-6, 200 and 50 annual caps (UNVERIFIED). INA 245(c) bars some S entrants (CONFIRMED summary https://www.law.cornell.edu/uscode/text/8/1255). **Model:** skip.

### T-1 to T-6 (trafficking victims)
- Who: victims of severe trafficking, cooperating with law enforcement; cap 5,000 per year for principals (UNVERIFIED); 4 years; adjust after 3 years or case completion (UNVERIFIED). I-914 fee $0 CONFIRMED G-1055. Work: EAD upon approval (UNVERIFIED). Unlawful presence exception for trafficking victims. CONFIRMED https://www.uscis.gov/laws-and-policy/other-resources/unlawful-presence-and-inadmissibility
- **Model:** humanitarian branch; event-driven, not selectable by choice.

### TN / TD (USMCA professionals)
- Who: **only citizens of Canada and Mexico** in a prearranged job in a USMCA-listed profession. Canadians apply at the border or via I-129; Mexicans need a TN visa at a U.S. consulate first. Initial up to 3 years; extensions by I-129; TD spouse/children study but do not work. CONFIRMED https://www.uscis.gov/working-in-the-united-states/temporary-workers/tn-nafta-professionals . No numerical cap (UNVERIFIED). Nonimmigrant intent (page silent; UNVERIFIED). Fee I-129 $1,015/$965 + $600 Asylum Program Fee CONFIRMED G-1055.
- **[MX]** yes; **[IN]/[NG]** not eligible.
- **Model:** Mexican-only alternative to the H-1B lottery; no GC path built in; spouses cannot work.

### U-1 to U-5 (crime victims)
- Cap 10,000 per year for principals; waiting list with deferred action and EAD; bona fide determination; 4 years; adjustment after 3 years of continuous presence; derivatives (spouse, children, and for principals under 21 parents and siblings under 18); fee-exempt; Vermont Service Center. CONFIRMED https://www.uscis.gov/humanitarian/victims-of-human-trafficking-and-other-crimes/victims-of-criminal-activity-u-nonimmigrant-status . I-918 fee $0 CONFIRMED G-1055.
- **Model:** years-long queue with EAD; adjustment event at year 3 of U status.

### V (spouse/child of an LPR waiting)
- V-1/V-2/V-3 under the LIFE Act, only for F2A beneficiaries whose I-130 was filed on or before 2000-12-21 and waited more than 3 years (UNVERIFIED). Effectively closed. **Model:** omit except as history.

### Visa Waiver Program (VWP) / ESTA
- 90-day maximum, no extension, no change of status, no work; 42 countries (UNVERIFIED; check https://www.cbp.gov/travel/international-visitors/esta and https://travel.state.gov/content/travel/en/us-visas/tourism-visitor/visa-waiver-program.html). **India, Mexico and Nigeria are not VWP countries** (UNVERIFIED; I could not read the list). Overstay = automatic removal without a hearing; waiver of rights. Use for characters from non-IN/MX/NG origins only.
- **Model:** include to show contrast; not selectable for the three countries.

### Parole and humanitarian categories (not nonimmigrant)
- Humanitarian/public-benefit parole (INA 212(d)(5)), CHNV, U4U, Afghan parole, Ms. L class members: G-1055 lists parole-related fees (Immigration Parole Fee $1,200 in the EB-style row of I-941; parolee initial EAD fee $570) from H.R.1 (Pub. L. 119-21). CONFIRMED https://www.uscis.gov/g-1055 . Parole is not an admission; parolees can adjust if admitted-or-paroled (245(a)). CONFIRMED https://www.law.cornell.edu/uscode/text/8/1255 . Parole EAD category (c)(11). CONFIRMED https://www.ecfr.gov/api/versioner/v1/full/2026-10-01/title-8.xml?part=274a&section=274a.12 (G-1055 references (c)(11)).
- TPS: designations as of Nov 2026 include El Salvador, Sudan, Ukraine (listed designated), Lebanon (extended to 2026-11-27) and others terminated or in litigation (Honduras, Nepal, Nicaragua, Venezuela, Haiti, Syria, Ethiopia). **No TPS for India, Mexico or Nigeria on that page.** TPS gives no LPR status but does not block adjustment on another basis. CONFIRMED https://www.uscis.gov/humanitarian/temporary-protected-status . I-821 fee $630/$580 CONFIRMED G-1055.
- **Model:** parole = "in limbo with EAD"; TPS = renewable until terminated; both can be killed by policy events.

---

# PART 2: IMMIGRANT CATEGORIES (permanent residence)

General mechanics (all UNVERIFIED from primary unless tagged):
- Annual worldwide limits: family preference 226,000 floor; employment 140,000 plus unused family numbers; 7% per-country cap; family F2A numbers 75% exempt from per-country cap. Visa Bulletin: Final Action Dates vs Dates for Filing; USCIS says which chart to use each month (Nov 2026: Dates for Filing). CONFIRMED https://www.uscis.gov/green-card/green-card-processes-and-procedures/visa-availability-priority-dates/adjustment-of-status-filing-charts-from-the-visa-bulletin
- Nov 2026 final action dates (secondary, LIKELY) are in `rules-verification.md` item 14: https://www.gozellaw.com/blog/november-2026-visa-bulletin
- Fees: I-485 $1,440/$1,390; I-130 $675/$625; I-140 $715/$665 + $600 Asylum Program Fee; I-526 $3,675; N-400 $760/$710. CONFIRMED https://www.uscis.gov/g-1055

### Immediate relatives (no cap, no wait)
- IR1/CR1 spouse of USC (CR1 if married under 2 years -> 2-year conditional residence, I-751 to remove; I-751 fee row not extracted, UNVERIFIED), IR2 child under 21 unmarried, IR5 parent of a USC aged 21+, IR3/IR4 orphans/adoptees. UNVERIFIED (INA 201(b)). Filing I-130 fee $675/$625 CONFIRMED G-1055.
- Adjustment inside the U.S. is allowed for immediate relatives even after unauthorized work or a status violation, if they were inspected and admitted or paroled (INA 245(a),(c)). CONFIRMED https://www.law.cornell.edu/uscode/text/8/1255
- Consular route: IV interview abroad; **[NG]** immigrant visas suspended under Sec. 5 of the 2026 proclamation (CONFIRMED whitehouse) and in the 75-country pause (LIKELY).
- **Model:** the fastest, most reliable path; marriage fraud flag; the CR1 conditional-residence timer.

### K-1 to adjustment
- See K-1 above; I-485 within 90 days of marriage; CONFIRMED I-485 fee only.
- **Model:** a time-limited funnel into IR1.

### Family preference
- F1: unmarried sons/daughters (21+) of USCs. F2A: spouses and children (under 21) of LPRs. F2B: unmarried sons/daughters (21+) of LPRs. F3: married sons/daughters of USCs. F4: siblings of adult USCs. UNVERIFIED (INA 203(a)).
- Nov 2026 final action dates (LIKELY): Rest of World F1 22JAN21, F2A 22OCT26, F2B 22AUG20, F3 22OCT15, F4 22OCT12; **Mexico** F1 22SEP08, F2A 22APR26, F2B 15MAY10, F3 15JUL01, F4 22APR01; **India** matches RoW except F4 15DEC06. https://www.gozellaw.com/blog/november-2026-visa-bulletin
- Age-out: CSPA (UNVERIFIED). Affidavit of support I-864 (UNVERIFIED).
- **[MX]** longest family backlogs; **[IN]** F4 ~ +6 years; **[NG]** charged to Rest of World, but 2026 ban and pause apply.
- **Model:** queue length by priority date and country; CSPA age-out events.

### Employment-based (EB)
- **EB-1A** extraordinary ability (self-petition, no PERM), **EB-1B** outstanding professors/researchers, **EB-1C** multinational executive/manager. UNVERIFIED (INA 203(b)(1)). Nov 2026 final action: RoW and Mexico Current, India 01FEB23, China 01AUG23. LIKELY (gozel URL above).
- **EB-2** advanced degree or exceptional ability (PERM unless NIW). **NIW** = national interest waiver (Matter of Dhanasar 3-prong, UNVERIFIED), self-petition. Nov 2026: RoW and Mexico 01APR25, **India 01NOV13**, China 01OCT21. LIKELY.
- **EB-3** skilled worker/professional/other workers (PERM). Nov 2026: RoW and Mexico 15JUN24, India 22JAN14 (now ahead of EB-2), Other Workers RoW 01JUN22. LIKELY. Other workers 10,000 limit (UNVERIFIED).
- PERM labor certification via DOL (https://www.dol.gov/agencies/eta/foreign-labor/programs/permanent). UNVERIFIED; I did not read the DOL pages this session.
- Adjustment may bypass 245(c) bars for EB applicants lawfully present at filing and who have not exceeded 180 days of status violations/unauthorized work (INA 245(k)). CONFIRMED https://www.law.cornell.edu/uscode/text/8/1255
- Gold Card (new, 2025-2026): applicants file Form I-140G under EB-1 or EB-2; $1 million individual gift, $2 million corporate per employee, $15,000 processing fee; launch status unclear in 2026; ~338 applications by May 2026. LIKELY (secondary): https://www.gozellaw.com/blog/trump-gold-card-a-1-million-donation-for-a-fast-track-green-card . Treat as unverified.
- **[IN]** EB-2 and EB-3 waits of 13+ years (CONFIRMED-secondary dates); AC21 H-1B extensions beyond 6 years apply (CONFIRMED USCIS H-1B page); **[MX]/[NG]** follow RoW dates for EB; ban/pause apply to **[NG]** consular cases.
- **Model:** PERM + I-140 + wait; the cap-gap of visa dates; porting to other categories (priority date retention, UNVERIFIED).

### EB-4 special immigrants
- Includes religious workers, Special Immigrant Juveniles (SIJ), certain Afghan and Iraqi translators, international organization employees, and others (INA 101(a)(27)). UNVERIFIED (the USCIS SIJ and religious-worker pages returned 404). EB-4 final action Nov 2026 is 15DEC22 for all countries. LIKELY (gozel URL). SIJ: I-360, under 21, no fee for SIJ I-485 (CONFIRMED G-1055 shows $0 for SIJ I-485 filers).
- **Model:** child-welfare path with its own queue; SIJ is how an unaccompanied minor can move to LPR.

### EB-5 (investors)
- Amounts: $1,050,000 standard, $800,000 in targeted employment areas (since March 2019) and 10 jobs; 10,000 visas with set-asides (rural 20%, high unemployment 10%, infrastructure 2%) after the 2022 EB-5 Reform and Integrity Act. UNVERIFIED (the USCIS EB-5 page returned 404). Conditional residence for 2 years, I-829. Fees: I-526/I-526E $3,675 plus $1,000 integrity fee on initial I-526E; regional center designation $17,795. CONFIRMED https://www.uscis.gov/g-1055 . Nov 2026: RoW and Mexico Current, India 01DEC23, China 01DEC16 (unreserved). LIKELY.
- **Model:** wealth-gated path; very expensive; sourcing-of-funds risk.

### Diversity Visa (DV lottery)
- Eligibility: born in an eligible country (or via spouse/parent chargeability); high school or 2 years of qualifying work; ~55,000 (reduced). Entry fee $1 since 2025. LIKELY (secondary) https://en.wikipedia.org/wiki/Diversity_Immigrant_Visa . Excluded countries (50,000+ rule) include **India, Mexico, Nigeria** in recent years (LIKELY; per-year lists STILL UNVERIFIED, see rules-verification.md item 15).
- DV-2026 processing was paused after Dec 2025 (UNVERIFIED) and DV-2027 registration status is contested/unclear (LIKELY: https://nepyork.com/2025/10/16/dv-2027-registration-dates-will-be-widely-publicized-in-the-coming-months-says-state-department/ ).
- Selectee must be issued by Sept 30 of the program year; USCIS adjustment must finish by then (UNVERIFIED).
- **Model:** a yearly lottery event for eligible countries only; not available for IN/MX/NG characters by default; deadline cliff Sept 30.

### Refugee and asylee adjustment
- Refugee (INA 207) and asylee (INA 208) can adjust after 1 year (INA 209). UNVERIFIED (not read). Fee: I-485 $0 for refugees (CONFIRMED G-1055). Asylum Program Fee $100 for I-589 plus annual asylum fee under H.R.1 (CONFIRMED G-1055); asylum EAD after 150 days (CONFIRMED category (c)(8) in https://www.ecfr.gov/api/versioner/v1/full/2026-10-01/title-8.xml?part=274a&section=274a.12 ). Asylum applicants do not accrue unlawful presence while a bona fide application is pending (CONFIRMED USCIS unlawful-presence page). One-year filing deadline for asylum (UNVERIFIED).
- Travel-ban text does not limit asylum, refugee, withholding or CAT claims (CONFIRMED whitehouse Sec. 8(d)).
- **Model:** humanitarian branch; case merits and interview roll.

### VAWA, U/T adjustment
- VAWA self-petition (I-360), exempt from unlawful presence accrual if substantial connection shown (CONFIRMED USCIS unlawful-presence page); can adjust notwithstanding some 245(c) bars (UNVERIFIED); fees $0 for VAWA. CONFIRMED G-1055. U adjustment after 3 years (CONFIRMED USCIS U page); T similar (UNVERIFIED).
- **Model:** protective status with independent clocks.

### Cancellation of removal, registry, 245(i), NACARA, HRIFA, Cuban Adjustment, etc.
- **Cancellation of removal:** LPR cancellation (INA 240A(a)): 5 years LPR, 7 years continuous residence after admission in any status, no aggravated felony; non-LPR (240A(b)): 10 years continuous presence, good moral character, exceptional and extremely unusual hardship to a USC/LPR spouse, parent or child; 4,000 per fiscal year cap. UNVERIFIED (not read).
- **Registry (INA 249):** entry before January 1, 1972 (UNVERIFIED). Legislative proposals to move the date are not law (UNVERIFIED).
- **245(i):** a person physically present who entered without inspection can adjust if the beneficiary of a petition or labor certification filed on or before April 30, 2001 (and physically present on Dec 21, 2000 if filed after Jan 14, 1998), paying a $1,000 supplement. CONFIRMED https://www.law.cornell.edu/uscode/text/8/1255
- **245(a):** requires inspection and admission or parole, a visa immediately available, and admissibility; 245(c) bars unauthorized work or status violations (immediate relatives exempt; EB uses 245(k)). CONFIRMED same URL.
- **Parole in place / Keeping Families Together:** parole in place for military families exists (UNVERIFIED); the 2024 spousal parole program was vacated by a court in 2024 (UNVERIFIED; do not cite). **Model:** do not simulate as available.
- **Legalization legacy programs** (NACARA, HRIFA, Cuban Adjustment Act, Amerasian, Lautenberg) are narrow; NACARA reduces the DV number by up to 5,000 (LIKELY via Wikipedia). I-485 NACARA/HRIFA fee rows exist on G-1055 (CONFIRMED).
- **Model:** the "deportation defense" branch; ten-year clock that begins with the arrival of an undocumented player.

---

# PART 3: STATUS TRANSITIONS

### Change of status vs adjustment vs consular processing
- **Change of status (COS):** within the U.S. from one nonimmigrant status to another via I-129 (employer) or I-539 (self); must maintain status; pending extension gives 120-day tolling for unlawful presence under INA 212(a)(9)(B)(iv)? The 120-day tolling is CONFIRMED in the 212(a)(9)(B) summary https://www.law.cornell.edu/uscode/text/8/1182 . I-539 $470/$420 CONFIRMED G-1055.
- **Adjustment of status (AOS):** filing I-485 inside the U.S. when a visa is immediately available. Requires inspection and admission or parole. CONFIRMED https://www.law.cornell.edu/uscode/text/8/1255 . Pending I-485 gives a work permit (c)(9) CONFIRMED https://www.ecfr.gov/api/versioner/v1/full/2026-10-01/title-8.xml?part=274a&section=274a.12 . Advance parole travel now counts as a departure for unlawful presence bars after 2026-08-13 (CONFIRMED USCIS unlawful-presence page).
- **Consular processing:** immigrant visa interview abroad via State Dept (travel.state.gov blocked; UNVERIFIED). Triggers the 3/10-year bars on departure for those with unlawful presence. Subject to the proclamation and the 75-country pause for **[NG]** (CONFIRMED/LIKELY above).
- **Model:** pick a branch at each green-card step; the "leave to consular process" action is the dangerous one.

### Unlawful presence bars and waivers
- 3-year bar (more than 180 days, under 1 year), 10-year bar (1 year or more), effective April 1, 1997 stays; clocks start when you leave. CONFIRMED https://www.uscis.gov/laws-and-policy/other-resources/unlawful-presence-and-inadmissibility
- Exceptions: under 18, bona fide asylum applicants, Family Unity, VAWA, trafficking victims (CONFIRMED same).
- Permanent bar (INA 212(a)(9)(C)): unlawful presence over 1 year in aggregate (or removal) followed by entry or attempted entry without admission; consent to reapply only after 10 years outside. CONFIRMED https://www.law.cornell.edu/uscode/text/8/1182
- Waivers: **I-601** (inadmissibility waiver abroad or in the U.S.; extreme hardship to a USC/LPR spouse or parent for 212(a)(9)(B)(v)) CONFIRMED statutory; **I-601A** provisional waiver filed in the U.S. before consular interview; age 17+, pending immigrant visa case, hardship to a USC or LPR spouse or parent, no pending non-closed removal proceedings or final order without I-212. CONFIRMED https://www.uscis.gov/family/family-of-us-citizens/provisional-unlawful-presence-waivers . I-212 permission to reapply (UNVERIFIED details).
- Fraud/misrepresentation: permanent bar under 212(a)(6)(C)(i), waivable under 212(i) with extreme hardship to a USC/LPR spouse or parent (CONFIRMED statutory summary, waiver text not read). False claim to citizenship (212(a)(6)(C)(ii)) is a bar with a narrow exception. CONFIRMED.
- **Model:** player-visible `unlawful_presence_days` counter per stay; triggers at 181 and 365; waiver event requires a qualifying relative with hardship score.

### Public charge
- INA 212(a)(4): likelihood of becoming a public charge; factors: age, health, family status, assets/resources/financial status, education and skills, affidavit of support. CONFIRMED https://www.law.cornell.edu/uscode/text/8/1182 . Exempt: VAWA self-petitioners, U applicants and some others (CONFIRMED same).
- Regulation: 8 CFR 212.20 to 212.23 (CONFIRMED as the legal authority cited on https://www.uscis.gov/policy-manual/volume-8-part-b ); no 2025-2026 rule text read. State Dept's Jan 2026 pause cites public charge (LIKELY). New-rule status: UNVERIFIED.
- **Model:** a visa-interview risk modifier (income, age, health, sponsor I-864) that was weak in some years and strong in others; do not hard-code a single rule.

### Naturalization
- 5 years as an LPR with continuous residence, physically present at least half the time, 3 months in the state or district, good moral character: CONFIRMED https://www.law.cornell.edu/uscode/text/8/1427 . Absence of 6 to under 12 months creates a presumption of break; 1 year or more breaks continuity. CONFIRMED same.
- 3 years if married to and living with a USC for 3 years, with the spouse a citizen for the whole period and 18 months of physical presence: CONFIRMED https://www.law.cornell.edu/uscode/text/8/1430 .
- N-400 $760 paper, $710 online, $380 reduced. CONFIRMED https://www.uscis.gov/n-400 . Age 18, English and civics tests: UNVERIFIED. Early filing 90 days before eligibility: UNVERIFIED.
- **Model:** citizenship is the game's "win" condition; continuous-residence counter resets on 1-year absence.

---

# Quick relevance matrix (India, Mexico, Nigeria)
| Category | India | Mexico | Nigeria |
|---|---|---|---|
| B-1/B-2 | yes | yes | yes, but 2026 partial suspension (CONFIRMED) |
| F-1/M/J | yes | yes | suspended in 2026 (CONFIRMED) |
| H-1B | yes, big, long EB wait | yes | yes (not in Sec. 5 list, CONFIRMED) |
| TN/TD | no (CONFIRMED) | yes (CONFIRMED) | no |
| E-1/E-2 | no treaty (UNVERIFIED) | yes (UNVERIFIED) | no (UNVERIFIED) |
| H-2A/H-2B | rare | main source (UNVERIFIED) | rare |
| E-3 | no | no | no (Australia only, UNVERIFIED) |
| H-1B1 | no | no | no (Chile/Singapore) |
| VWP | no | no | no (UNVERIFIED) |
| DV lottery | ineligible | ineligible | ineligible (recent years, LIKELY) |
| EB queue | India dates (LIKELY) | RoW dates | RoW dates; consular issuance affected by 2026 ban/pause |
| TPS | not designated (CONFIRMED) | not designated | not designated |

# Items I could not verify (for the next round)
travel.state.gov and dvprogram.state.gov blocked: visa-bulletin history 2015-2025, DV lists per year, E-1/E-2 treaty lists, VWP list, J-1 skills list. Federal Register body pages blocked. Not read: DOL PERM, USCIS pages for H-2A, J-1, P, Q, R, EB-5, EB-4, SIJ, K-1 (several 404), INA 212(e), 8 CFR 245.1(g), cancellation, registry, CSPA, I-751, I-129F fee, L fee row, 2016/2024 fee rule numbers.
