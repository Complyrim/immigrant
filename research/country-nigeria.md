# Nigeria to US Migration: Game Reference ("Immigrant")

Compiled 2026-11-08. Game-design reference only, not legal advice.

**Label key:** CONFIRMED = stated consistently by an authoritative or multiple independent sources I could see. LIKELY = consistent secondary reporting, or matches well-known official data I could not open. UNVERIFIED = single weak source, my background knowledge, or sources conflict.

**Research limits (read first):** travel.state.gov, census.gov, migrationpolicy.org and the DV site returned HTTP 403 to my fetch tool, and the Open Doors PDF was unreadable. Most figures below therefore come through search summaries or secondary news. Every "official source" URL listed as "verify at" is where a human should confirm the number before it is hard-coded into game balance. Nothing here is invented; where I could not find a number I say so.

**Neutrality note:** Nigeria has 250+ ethnic groups (largest: Hausa-Fulani, Yoruba, Igbo; also Ijaw, Edo, Efik/Ibibio, Tiv, Kanuri and many others), roughly equal Muslim and Christian populations, and regions from Lagos megacity to northern farming towns. Migrants are not one type. The "most educated immigrant group" statistic describes a selected migrant pool, not Nigerians at home, and many Nigerian immigrants work in low-wage jobs or are undocumented. Treat the high-education stat as an average, never as a rule for a character.

---

## 1. MIGRATION PROFILE

### 1.1 Size of the Nigeria-born US population

| Year / source | Figure | Label | Source |
|---|---|---|---|
| 1980 | ~25,000 Nigerian immigrants (MPI via secondary summary) | LIKELY | https://www.migrationpolicy.org/article/nigerian-diaspora-united-states (page not opened; 403) |
| 2012-2016 ACS | ~277,000 | UNVERIFIED (secondary) | https://www.remitly.com/blog/immigration/nigerian-immigration/ |
| 2015 (MPI) | Half of Nigerian immigrants arrived before 2000 | LIKELY | MPI URL above |
| 2019 ACS | ~392,811 | LIKELY (matches known ACS 1-yr scale) | https://en.wikipedia.org/wiki/Nigerian_Americans |
| ~2019-2021 | ~372,710 (IIR analysis, 7% in DC area = 27,570) | LIKELY | https://d101vc9winf8ln.cloudfront.net/documents/47014/original/Nigerian_Immigrants_in_the_DC_Metro_Area.pdf?1689340040 |
| 2024 ACS | ~532,602 born in Nigeria; ~858,236 Nigerian ancestry (incl. US-born descendants) | UNVERIFIED (Wikipedia citing ACS; verify at data.census.gov table B05006) | https://en.wikipedia.org/wiki/Nigerian_Americans |
| 2022 ACS ancestry | ~712,000 of Nigerian ancestry (counts descendants) | UNVERIFIED | MPI search summary |

Game takeaway: roughly 25k (1980) to ~530k (2024), growing about 4-5%/yr in recent years (https://intelpoint.co/insights/the-population-of-nigerian-born-immigrants-in-the-us-increases-at-an-average-of-4-8-per-year/, UNVERIFIED). Nigerians are roughly 10% of African-born US immigrants (UNVERIFIED, MPI summary); ~2.5M sub-Saharan African immigrants in 2024 (LIKELY).

### 1.2 Green cards, visas by class 2015-latest

**What I could NOT retrieve:** DHS/OHSS LPR-by-country-by-class table and State Dept annual visa issuance by nationality. Verify at https://ohss.dhs.gov/topics/immigration/lawful-permanent-residents/lprs-country-birth-and-major-classes-admission and https://travel.state.gov (Report of the Visa Office, Tables III/XVIII). No class-by-class numbers are given here because I cannot source them. Do not invent them.

Facts I could source:
- Nigeria led Africa in new green cards in FY2023 (headline claim): LIKELY, https://thecable.ng/nigerians-received-the-most-us-green-cards-in-africa-in-2023 (article text only confirmed ~1.17M total LPRs worldwide).
- Naturalizations of Nigerians: 8,930 (FY2020), 10,921 (FY2021), 14,438 (FY2022), 13,530 (FY2023); total 47,819. LIKELY (DHS data via press), https://www.visaverge.com/news/nigerians-lead-african-u-s-naturalizations-47819-cases-in-2019-2023/ and https://newsexpressngr.com/news/275355/47000-nigerians-naturalised-to-americans-in-four-years
- Nigeria nonimmigrant visa issuances fell 46.1% to 48,669 (from 90,344 in 2024), all NIV classes, year presumably FY2025: UNVERIFIED (single analysis; see Open Doors search result list) https://www.academicjobs.com/higher-education-news/us-international-student-drop-visa-issuances-36-percent-8594
- Students: 21,847 Nigerians in US higher ed in 2024/25, +9.1%, rank 8th (Open Doors 2025): LIKELY, https://opendoorsdata.org/wp-content/uploads/2026/01/OD_Nigeria_Fact-Sheet-2025.pdf (figure from news coverage; PDF unreadable) and https://nigerianbulletin.com/ams/nigerian-student-population-in-us-hits-21-847-ranks-8th-highest-globally-open-doors-report.24518. Earlier: rank 7th with +13.5% rise vs 2023 (https://thecable.ng/nigeria-ranks-7th-for-international-students-in-the-us-13-5-rise-from-2023, LIKELY). Fall 2025 new international enrollment fell broadly; Nigeria-specific F-1 decline not verified (the "17%" claim is UNVERIFIED).
- Diversity Visa: Nigerians won DV in large numbers in the 2010s (UNVERIFIED count; not found). Nigeria is reported ineligible for DV-2025 and DV-2026 (the "only African country" excluded for DV-2026) because total Nigerian immigration exceeded the program threshold; one outlet says excluded since DV-2022. LIKELY: https://nairametrics.com/2023/10/19/us-commences-lottery-program-for-2025-nigeria-others-excluded/ , https://www.visaverge.com/greencard/us-bars-nigeria-as-only-african-nation-from-dv-2026-green-card-lottery/ (that article lists 19 ineligible countries). DV-2027 eligibility: UNVERIFIED, expected ineligible; verify at https://dvlottery.state.gov. Design implication: a DV-win storyline is realistic for arrival years 2015-2021 only, and for later years only via a spouse born in an eligible country (UNVERIFIED, https://headmanlaw.com/insights/nigerian-diversity-visa-dv-lottery-2027/).

### 1.3 Policy timeline affecting Nigerians (precise)

| Date | Event | Label | Source |
|---|---|---|---|
| 2020-01-31 (effective 2020-02-21) | Proclamation 9983 suspended most immigrant visas (not nonimmigrant) for Nigeria, Eritrea, Kyrgyzstan, Myanmar; special immigrant (US-govt-assistance) exempt. DV restriction applied only to Sudan and Tanzania, not Nigeria. | CONFIRMED | https://www.fragomen.com/insights/alerts/president-trump-suspends-immigrant-visa-issuance-foreign-nationals-six-countries-exceptions |
| 2021-01-20 | Proclamation 10141 revoked 9983 and related bans; State to review denials; Nigeria applicants later prioritized. | CONFIRMED | https://www.govinfo.gov/content/pkg/FR-2021-01-25/html/2021-01749.htm ; https://www.icirnigeria.org/?p=116937 |
| 2025-07-08 | Most Nigerian nonimmigrant visas limited to single entry, 3-month validity (reciprocity change); earlier-issued visas keep validity. Nigeria disputed rationale. | CONFIRMED | https://allafrica.com/stories/202507090027.html ; https://nairametrics.com/2025/07/08/us-tightens-visa-policy-for-nigerians-limits-non-migrant-visas-to-single-entry-3-month-validity |
| 2025-09-19 | H-1B $100,000 fee proclamation (applies to beneficiaries outside US without valid H-1B visa; not change-of-status/extension); litigation pending. | LIKELY | https://www.jdsupra.com/legalnews/fy-2027-h-1b-visa-lottery-updates-wage-9178484/ |
| 2025-12-16 (effective 2026-01-01) | Proclamation 10998: partial restrictions on Nigeria (39 countries total). Covers immigrants and B-1, B-2, F, M, J. Exempt: LPRs, dual nationals using unaffected passports, some SIVs. Visas issued before 2026-01-01 stay valid. Sources disagree on whether family/marriage immigrant visas (CR-1, K-1) are covered. Still in force as of Oct 2026 per secondary reporting. | CONFIRMED (existence, date, categories); UNVERIFIED (family-visa detail, current status) | https://nairametrics.com/2025/12/17/what-u-s-travel-restrictions-mean-for-nigerians-with-visas-and-new-applicants/ ; https://allafrica.com/stories/202512170123.html ; https://guardian.ng/nigerian/are-nigerians-allowed-to-travel-to-the-usa/ |
| 2026-01-21 | State Dept paused immigrant visa issuance for 75 countries incl. Nigeria (public charge review); family, employment, DV. Interview allowed, issuance held. Reported voided by court in Aug 2026 (does not undo Proclamation 10998). | CONFIRMED (pause); UNVERIFIED (court detail) | https://nairametrics.com/2026/01/14/u-s-pauses-immigrant-visa-processing-for-nigeria-74-other-countries-starting-jan-21/ ; https://guardian.ng/nigerian/are-nigerians-allowed-to-travel-to-the-usa/ |
| 2026-01-21 | Nigeria added to B-1/B-2 visa bond program; pilot $5k/$10k/$15k; permanent rule published 2026-08-03 reportedly $10k/$15k/$20k. | LIKELY (Nigeria added); UNVERIFIED (permanent amounts, one source) | https://www.bu.edu/isso/2026/01/05/b-1-visa-bond-pilot-program-expanded/ ; https://nairametrics.com/2026/08/02/u-s-visa-bond-nigeria-among-countries-under-permanent-20000-rule/ |
| 2026 (Jan to ~May) | USCIS benefit adjudication holds for nationals of travel-ban countries; physicians exempted/resumed (reported 2026-05-04). | LIKELY | https://www.pulse.ng/story/us-reopens-visa-foreign-doctors-nigeria-2026050408365555902 |
| 2026-02-27 | H-1B wage-weighted selection final rule effective; FY2027 registration Mar 4-19, 2026; $215 fee. | LIKELY | https://www.bal.com/immigration-news/united-states-fy-2027-h-1b-cap-initial-registration-period-opens-march-4 |
| 2026-08-31 (reported) | DV issuance halted for vetting review; dates disputed. | UNVERIFIED | https://www.visaverge.com/greencard/us-bars-nigeria-as-only-african-nation-from-dv-2026-green-card-lottery/ |

Overstay data: DHS FY2023 overall suspected in-country overstay 1.02%; F/M/J 3.67%. Nigeria B-1/B-2 total overstay ~7.14% and F/M/J ~15.6% in secondary coverage; the Dec 2025 proclamation cited 5.56% (B) and 11.90% (F/M/J). LIKELY for ranking, UNVERIFIED for exact. Overstay rates are an upper bound (non-departure not recorded) per https://nfap.com/wp-content/uploads/2025/06/Analysis-of-DHS-Overstay-Report.NFAP-Policy-Brief.2025.pdf . Sources: https://dhs.gov/sites/default/files/2024-09/0805_2024_cbp_entry_exit_overstay_report.pdf ; https://africanews.com/2024/11/19/ghana-overtakes-nigeria-in-us-visa-overstay-rates-new-report-reveals

Design rule: the game's year-of-arrival matters hugely. 2015-2019 arrivals face normal rules; 2020 (Feb-Dec) immigrant-visa ban; 2021-2024 normal with long consular backlogs; 2025 onward: single-entry visas, then bans/pauses/bonds in 2026.

### 1.4 Demographics

- Education: ~64% of Nigerian immigrants 25+ hold a bachelor's or higher (35.7% bachelor's, 28.3% graduate/professional in one analysis of 321,337 adults). LIKELY, https://etd.ohiolink.edu/acprod/odb_etd/ws/send_file/send?accession=bgsu1697131648139848&disposition=inline . MPI (older) cited 59% bachelor's+. LIKELY. Meaning ~36% have less than a bachelor's: include them. Africacheck cautions against "most successful ethnic group" framing: https://africacheck.org/spot-check/yes-nigerian-americans-do-well-but-arent-most-successful-ethnic-group-in-us/ (CONFIRMED that the caution exists).
- Median household income: ~$80,711 (2023) in several secondary sources vs ~$67k US overall in older data; figures vary by ancestry vs birthplace. UNVERIFIED, https://www.legit.ng/business-economy/economy/1634378-nigerian-households-rank-top-10-african-migrant-communities-thriving-financially-us/
- Age and sex mix: NOT RETRIEVED. Background knowledge: working-age heavy, roughly balanced by sex; UNVERIFIED. Verify via ACS B05003/S0201.
- Top states (Nigeria-specific list, birthplace vs ancestry unclear): Texas ~60,173; Maryland ~31,263; New York ~29,619; California ~23,302; Georgia ~19,182. UNVERIFIED (older data). Source: https://www.legit.ng/1264739-10-us-states-highest-population-nigerians.html . African-born by metro: New York 212k, Washington 161k, Atlanta 68k, Dallas-Fort Worth 61k (all Africa, not Nigeria; LIKELY): https://content.govdelivery.com/accounts/USCENSUS/bulletins/d2de61 . Houston Nigeria-born 35k-53k estimates: UNVERIFIED. MPI: 4 of top 10 Nigerian-immigrant counties are in Texas (UNVERIFIED secondary).
- Naturalization: ~13-14k per year recently (see above); typical years to citizenship: statutory 5 years after LPR (3 if married to a US citizen). Actual share naturalized: NOT RETRIEVED.
- Undocumented: Nigerians are a small share of unauthorized population; no reliable estimate found (UNVERIFIED). Many "undocumented" Nigerians are visa overstayers rather than border crossers (LIKELY, from overstay data above).

### 1.5 Remittances

- Nigeria official CBN data: personal remittances ~$21.8B in 2024 (+13% from $19.27B in 2023) and ~$21.8B in 2025; Q1 2025 $5.12B to Q4 2025 $5.72B. LIKELY, Vanguard analysis of CBN QSB: https://www.vanguardngr.com/?p=2883411 ; https://brandspurng.com/2026/05/19/nigerias-diaspora-remittances-hold-steady-at-21-8bn-in-2025-despite-global-economic-pressures/
- Different measure: BoP personal remittances $20.93B in 2024, IMTO channel $4.73B; IMTO inflows fell 11.78% to $2.07B in H1 2025. LIKELY, https://nairametrics.com/2025/12/26/nigerias-imto-inflows-drop-11-78-to-2-07-billion-in-h1-2025/
- World Bank 2023 ~ $19.5B, ~35% of sub-Saharan Africa total. LIKELY, https://nairametrics.com/2025/06/26/africa-received-95-billion-in-remittances-in-2024-as-nigeria-egypt-led-inflows-afc-report . Nigeria is the largest African recipient and among the top ~6 globally: LIKELY (Africa-largest confirmed; global rank not verified).
- CBN aims for $1B/month in diaspora remittances by end-2026 vs ~$600M/month: https://nairametrics.com/2026/07/16/cbn-targets-1-billion-monthly-diaspora-remittances-by-year-end-as-reserves-climb/ (LIKELY). US and UK dominate source countries: UNVERIFIED (https://arbiterz.com/?p=64845).
- Per-household amounts sent from US: NOT FOUND. Do not hard-code.

---

## 2. TEN CAREER PATHS

Status ladders show generic rules (CONFIRMED from standard US law unless flagged; verify at https://www.uscis.gov). Time ranges are design estimates (UNVERIFIED) because retrogression and 2026 restrictions change them. Pay figures are **design ranges, not retrieved data**: BLS OEWS (https://www.bls.gov/oes/) pages were not fetched. Treat all pay as UNVERIFIED, 2024-25 dollars, and refresh from OEWS before shipping. Metros used: Houston, Washington DC, Atlanta.

**Universal 2026 constraints:** Proclamation 10998 limits new F/J/B and immigrant visas for Nigeria-outside-US applicants from 2026-01-01; USCIS holds hit travel-ban nationals (physicians exempted). Players already in the US in valid status are far less affected than new arrivals. Public charge screening tightened for immigrant visas (Nov 2025 cable; LIKELY, https://nairametrics.com/2026/01/14/u-s-pauses-immigrant-visa-processing-for-nigeria-74-other-countries-starting-jan-21/).

### Path 1: Nurse via EB-3
- **Ladder:** NCLEX + visa screen (CGFNS) to employer sponsorship (PERM labor cert, I-140 EB-3) to consular immigrant visa (or adjust if in US) to green card on arrival to naturalization 5 yrs later. Time: 2-5 yrs from job offer to green card (retrogression); +5 to citizenship. Arrival 2015-2019: 1.5-4 yrs; 2021-2025: 3-6 yrs; 2026+: immigrant visa pause/ban risk, UNVERIFIED.
- **Limits:** EB-3 Rest of World final action date was reported at 2024-05-15 in Oct 2026 after a retrogression (LIKELY); November 2026 value conflicting (UNVERIFIED): https://www.beyondborderglobal.com/resources/november-2026-visa-bulletin . Nurses must pass NCLEX; Nigeria's 2024 guideline asking nurses to serve 2.5 yrs before leaving (contested): https://www.pri.org/media/2024-02-15/nigerias-attempts-stem-brain-drain-nurses-gets-blowback (LIKELY).
- **Employers/cities:** hospital systems, nursing homes, staffing agencies; Houston, DC/Maryland, Atlanta, Dallas, NYC.
- **Pay (UNVERIFIED design ranges):** new RN $65-85k; 5 yrs $80-105k; 10+ yrs/NP $100-140k+ (Houston lower end, DC higher end).
- **Risks:** recruiter/fee scams, contracts with penalty clauses, credential and licensing delays by state, retrogression, immigrant visa pause.
- **Milestones:** NCLEX pass, I-140 approval, visa interview, first licensed US shift, green card, bachelor's completion/NP path, citizenship, sponsoring family.

### Path 2: Physician via residency and J-1 waiver
- **Ladder:** ECFMG certification + USMLE to residency match (J-1 sponsored by ECFMG, or H-1B) to Conrad 30 waiver (3 yrs in underserved area) to H-1B to EB-2 NIW/EB-2 to green card to citizenship. Time: 7-12 yrs from arrival to green card; 12-17 to citizenship.
- **Limits:** J-1 two-year home requirement unless waived; Conrad 30 caps at 30 waivers per state/yr (CONFIRMED rule). Nigerians were reported the 6th-largest group of J-1 foreign doctors in a 2024 database (LIKELY, Pulse). Physicians were exempted from USCIS holds in 2026 (LIKELY). The $100k H-1B fee applicability for residents is litigated/UNVERIFIED.
- **Employers:** rural/underserved hospitals, academic centers, community clinics; Texas, Maryland, Georgia, Midwest.
- **Pay (UNVERIFIED):** resident $65-80k; hospitalist/primary care $230-300k; specialist $350k+.
- **Risks:** match failure, Step exam retakes, student debt in Nigeria-to-US credential gap, visa processing holds, rural isolation.
- **Milestones:** passing Step 1/2, matching, waiver job, green card, board certification, practice ownership.
- **Count caution:** estimates of Nigerian doctors in US range 8,000 to 20,000+ (UNVERIFIED, conflicting): https://advancestudy.org/?p=426195

### Path 3: Software engineer: F-1 to OPT to STEM OPT to H-1B
- **Ladder:** F-1 (master's) to OPT 12 mo to STEM OPT +24 mo to H-1B (registration) to PERM/EB-2 or EB-3 to green card to citizenship. Time: 8-14 yrs to green card for Nigerians (Rest of World, but H-1B and PERM delays); citizenship +5.
- **Limits:** H-1B now wage-weighted (effective 2026-02-27); lower-wage registrations get fewer entries. Odds data for FY2027 not found (UNVERIFIED). $100k fee for those outside US without a valid H-1B. F-1 visas for Nigerians are now restricted under Proclamation 10998 (for those outside US). Student visa issuances for Nigeria dropped sharply 2025 (UNVERIFIED magnitude).
- **Employers/cities:** tech companies, banks, consultancies, startups; Dallas, Houston, Atlanta, DC, Bay Area, Seattle.
- **Pay (UNVERIFIED):** entry $80-125k; mid $120-180k; senior $160-250k+ (DC/Atlanta/Houston all below Bay Area).
- **Risks:** tuition debt ($40-80k, UNVERIFIED), lottery loss, layoffs triggering 60-day grace period (CONFIRMED rule), OPT unemployment limit of 90 days (CONFIRMED rule).
- **Milestones:** admission, CPT/OPT job, H-1B selection, I-140, green card, citizenship.

### Path 4: Pharmacist
- **Ladder:** FPGEC certification + NAPLEX + state licensure (+ intern hours) to H-1B or EB-3 employer sponsorship to green card. 4-9 yrs.
- **Limits:** FPGEC cost/time; limited sponsoring employers; PharmD saturation in some markets (UNVERIFIED).
- **Employers:** retail chains, hospitals, long-term care, compounding; Houston, Atlanta, DC suburbs.
- **Pay (UNVERIFIED):** $110-140k typical staff; hospital/lead $130-160k.
- **Risks:** foreign credential recognition, retail layoffs/closures, sponsorship scarcity.
- **Milestones:** FPGEC pass, NAPLEX pass, license, green card, pharmacy management.

### Path 5: Diversity-visa winner in varied jobs (arrival 2015-2021 realistically)
- **Ladder:** DV selected (lottery) to interview within the fiscal year deadline to green card on entry (DV selectees must be issued by Sept 30 of the FY) to naturalization at 5 yrs. 1-3 yrs from win to entry; 5 more to citizenship.
- **Limits:** one-year window, selection no guarantee, public charge, mandatory proof of high-school education or 2 yrs of qualifying work (CONFIRMED rule). Nigeria currently ineligible (LIKELY) so this path is closed for new 2025+ entrants unless married to an eligible-country spouse.
- **Typical jobs:** security guard, home health, trucking, warehouse, retail, sales, restaurant, small business, later nursing school. Highly varied: many DV winners also hold degrees.
- **Pay (UNVERIFIED):** $32-50k early; $50-85k with CDL/licensure/small business after 5 yrs.
- **Risks:** scam sites charging for "guaranteed" entries (common; CONFIRMED that the official DV entry is free, travel.state.gov), arrival with little savings, no recognized credentials, wage theft.
- **Milestones:** arrival, first job, driver's license, apartment lease, credit history, citizenship, sponsoring spouse/children.

### Path 6: Graduate student to academia
- **Ladder:** F-1 (PhD with stipend) to OPT/STEM OPT to postdoc (J-1/H-1B) to faculty/research H-1B (cap-exempt) to EB-1B/EB-2 NIW to green card to citizenship. 8-15 yrs.
- **Limits:** cap-exempt H-1B for universities (CONFIRMED rule); J-1 home residency requirement for some; grant cuts and federal research funding changes (UNVERIFIED impact).
- **Employers:** universities and labs; Texas (Houston, College Station), Georgia, Maryland, Midwest.
- **Pay (UNVERIFIED):** PhD stipend $30-45k; postdoc $60-75k; assistant professor $80-130k.
- **Risks:** stipend poverty, advisor conflicts, job market, limited work authorization for dependents.
- **Milestones:** admission with funding, qualifying exam, defense, postdoc, tenure-track, NIW/EB-1 approval.

### Path 7: Rideshare / logistics entrepreneur
- **Ladder:** various entry (F-1 to green card via marriage, DV, family; or asylum, or overstay) to independent driver/CDL to owner-operator trucking or delivery fleet to LLC/business. Status ladder depends on entry (see other paths).
- **Limits:** drivers need work authorization; rideshare platforms require valid SSN/work authorization; CDL requirements for non-domiciled CDL tightened in 2025 (LIKELY, FMCSA rule; verify).
- **Employers/cities:** Uber/Lyft/Amazon DSP, freight brokers; Houston, Dallas, Atlanta, DC.
- **Pay (UNVERIFIED):** rideshare net $35-60k; owner-operator trucker net $60-130k; fleet owner variable.
- **Risks:** vehicle debt, insurance, deactivation, fuel costs, income volatility, tax mistakes.
- **Milestones:** first vehicle paid off, LLC, second truck, drivers hired, business credit.

### Path 8: Accountant / finance
- **Ladder:** F-1 (MBA/MAcc) or family/DV status to CPA (150 credit hours; state-specific) or CFA to Big 4/bank/corporate to H-1B or green card to citizenship. 6-12 yrs.
- **Limits:** state CPA boards evaluate foreign degrees (credential recognition); H-1B weighted lottery.
- **Employers:** audit firms, banks, government contractors, health systems; Houston (energy), DC, Atlanta, NYC.
- **Pay (UNVERIFIED):** entry $60-80k; senior/manager $95-140k; CFO track $150k+.
- **Risks:** exam costs and pass rates, sponsorship, foreign-experience discount.
- **Milestones:** CPA license, manager promotion, green card, controller/director role.

### Path 9: Home health aide / direct care worker
- **Ladder:** family-sponsored green card (spouse/parent/sibling of citizen) or DV or asylum to CNA/HHA certificate to LPN/RN bridge program to naturalization. Family-based timelines: immediate relatives of citizens 1-3 yrs (currently subject to immigrant visa pause/ban for those abroad); F-categories can take many years (UNVERIFIED).
- **Limits:** public charge; Medicaid-funded wage floors; wage-and-hour issues.
- **Employers:** home care agencies, nursing homes, assisted living; Maryland, Texas, Georgia, New York.
- **Pay (UNVERIFIED):** $28-42k; LPN $50-65k; RN $70-100k after bridge.
- **Risks:** low wages, injury, unpaid hours, agency exploitation, burnout.
- **Milestones:** CNA license, stable agency, LPN/RN completion, supervisor role.

### Path 10: Import/trading business owner
- **Ladder:** green card (family/DV) or E-2 not available for Nigeria? (E-2 treaty status for Nigeria: UNVERIFIED, I could not confirm; Nigeria is not generally listed as a treaty country; verify at travel.state.gov) to LLC to import (Nigerian foods, textiles, auto parts, electronics) / wholesale / logistics to growth.
- **Limits:** customs compliance (CBP, FDA for food), shipping costs, tariffs (2025 tariff changes, UNVERIFIED specifics), Nigerian FX policy, banking access.
- **Employers:** self-employed; Houston, Atlanta, DC/Maryland, Dallas, NYC.
- **Pay (UNVERIFIED):** wide: $20k to $150k+; many start part-time.
- **Risks:** FX volatility, container delays, fraud, supplier scams, lack of credit.
- **Milestones:** first container sold, storefront or warehouse, wholesale accounts, second location.

**Replacements and honesty notes:** All ten paths are plausible, but only paths 1, 2, 3, 5, 6 have well-documented visa mechanics. DV path should be labeled "closed for new entrants" for Nigeria in 2025+ games (LIKELY). The asylum/refugee route is also realistic for some (Boko Haram/ISWAP-affected regions, religious and gender-based persecution) but I found no sourced Nigeria asylum data; consider a path or event if desired. I could not verify pay for any path with BLS OEWS; all pay is a design range.

---

## 3. HOME-COUNTRY TIES

- **Remittances:** see 1.5. Roughly $21.8B inflow in 2024-25 is large relative to Nigeria's economy (LIKELY). Official-channel capture is a CBN policy issue; IMTO channel is only ~$4.7B of ~$21B (LIKELY), so a large share arrives via other/informal/bank routes (UNVERIFIED mix). Source: https://nairametrics.com/2025/12/26/nigerias-imto-inflows-drop-11-78-to-2-07-billion-in-h1-2025/
- **FX:** The naira's big devaluation after 2023 reforms changed what a dollar buys; reserves ~$49B in Feb 2026 attributed partly to remittances (LIKELY): https://nairametrics.com/2026/02/16/49bn-reserves-how-remittances-are-quietly-replacing-oil-as-nigerias-fx-driver
- **Family obligations (cultural, general):** extended-family support (school fees, rent, medical bills, weddings/funerals) is common but varies by family, ethnic group and generation. I found no survey figure for the share of Nigerian immigrants sending money regularly (UNVERIFIED). Avoid stereotyping; some characters send little or none.
- **Travel frequency/cost:** NOT SOURCED. Background: round-trip fares roughly $1,200-2,500 depending on season (UNVERIFIED). US-Nigeria travel dipped after visa restrictions (https://allafrica.com/stories/202602090115.html, LIKELY).
- **Relatives visiting US:** B-1/B-2 now single-entry 3-month (from 2025-07-08), bond of $10k-20k in 2026, and B visas restricted under Proclamation 10998 for those without a pre-2026 valid visa. CONFIRMED/LIKELY as in section 1.3. Wait times for visitor visa interviews in Lagos/Abuja: NOT RETRIEVED. Consulate General Lagos reportedly became a regional visa hub 2026-08-01 (UNVERIFIED, sources conflict).
- **Aging parents, weddings, funerals:** no quantitative source found. Design as high-impact narrative events with travel/cost trade-offs; a player with no valid status or pending immigration benefit cannot safely leave (advance parole/travel risks are CONFIRMED rule for pending applications).
- **Return migration and brain drain:** Nigeria's "japa" emigration wave from ~2021 is well documented in the press, especially health workers (LIKELY). Over 75,000 Nigerian nurses and midwives reportedly migrated in five years across several destinations (UNVERIFIED, nurses association via paper): https://link.springer.com/article/10.1186/s12909-025-07283-8 . Nursing emigration intention higher than doctors (LIKELY): https://doaj.org/article/e2f8a9f4ae724a8383d4187687a4a58c . Nigerian healthcare workers say many may never return (anecdotal): https://nairametrics.com/2025/02/08/i-had-to-leave-nigerian-healthcare-workers-on-life-abroad-and-why-they-may-never-return/ . Return-migration rates: NOT FOUND. NIDCOM (diaspora commission) data on professional registrations exists but not verified.

---

## 4. TWENTY CHALLENGE IDEAS

Format: Challenge | Based on | Pass | Fail.

1. **Single-entry visa trap (2025+)** | B-1/B-2 limited to 3-month single entry from 2025-07-08 (https://allafrica.com/stories/202507090027.html) | Pass: plan the one trip carefully, bundle funeral and paperwork | Fail: trip burns the only entry, relative cannot return for the next family event.
2. **Visa bond** | $10k-$20k bond for B visas from 2026-01-21 (LIKELY) | Pass: family pools funds, bond refunded after return | Fail: cannot post bond, parent's visit cancelled.
3. **Travel-ban timing** | Proclamation 10998 effective 2026-01-01; earlier visas valid | Pass: travels before cutoff or on valid pre-2026 visa | Fail: visa not valid, stuck abroad/at home.
4. **Immigrant visa pause** | 75-country pause from 2026-01-21 (CONFIRMED); court voided Aug 2026 (UNVERIFIED) | Pass: keep documents current and wait | Fail: interview done but issuance held for months; job offer expires.
5. **EB-3 nurse retrogression** | Date regressed to 2024-05-15 (Oct 2026; LIKELY) | Pass: file early, keep employer engaged | Fail: priority date not current; employer withdraws.
6. **NCLEX attempt** | Standard exam requirement; pass rates not sourced (UNVERIFIED) | Pass: study + prep funds, first-try pass | Fail: fail twice, pay fees, delay start.
7. **Recruiter scam** | Fee scams in nurse/visa migration (anecdotal; LIKELY) | Pass: verify the employer with the state board and refuse upfront fees | Fail: lose savings to a fake contract.
8. **H-1B weighted lottery** | Wage-weighted selection effective 2026-02-27 (LIKELY) | Pass: higher wage level or advanced-degree role is selected | Fail: entry-level registration not selected; OPT ends.
9. **H-1B $100k fee** | Applies to beneficiaries outside US without valid visa (LIKELY) | Pass: change status inside US, no fee | Fail: employer drops offer for candidate abroad.
10. **OPT unemployment clock** | 90-day limit (CONFIRMED rule) | Pass: job found in time | Fail: status lost, forced to leave or switch school.
11. **60-day grace after layoff** | H-1B rule (CONFIRMED) | Pass: new sponsor files transfer | Fail: 60 days pass; departure or change of status.
12. **Conrad 30 waiver** | 30 waivers/state/yr (CONFIRMED rule) | Pass: rural hospital job accepted, waiver filed | Fail: state slots filled; J-1 doctor must leave for 2 years.
13. **Foreign credential recognition** | State boards re-evaluate foreign degrees (CPA, pharmacy, nursing) | Pass: pays evaluator, finishes bridge courses | Fail: licensed job unavailable; works below skill level (underemployment).
14. **Student debt vs stipend** | Typical master's tuition and loan load (UNVERIFIED) | Pass: scholarship or assistantship | Fail: debt pressure forces dropping out.
15. **Remittance squeeze** | ~$21.8B inflows (LIKELY) and naira depreciation | Pass: sends fixed monthly amount, keeps emergency fund | Fail: over-sends, misses rent in the US.
16. **Wire-fee/informal channel risk** | IMTO share ~$4.7B of inflows; fees and informal routes (LIKELY) | Pass: uses licensed low-fee channel | Fail: informal agent loses the money.
17. **Public charge interview** | Tightened screening Nov 2025 (LIKELY) | Pass: documents income, assets, sponsor | Fail: refusal or administrative delay.
18. **Naturalization test and 5-year clock** | 5 yrs (3 w/ citizen spouse); NATZ volumes ~13-14k/yr for Nigerians (LIKELY) | Pass: continuous residence, English/civics pass | Fail: long trips abroad break continuous residence; denial.
19. **Scam targeting the community** | DV fee scams and "guaranteed visa" offers (CONFIRMED DV entry is free) | Pass: enters only via official site | Fail: pays fraudster, ineligible entry.
20. **Funeral abroad** | Family event vs travel restrictions and pending benefits | Pass: travels with valid status/advance parole and returns | Fail: can't return in time; misses funeral or loses status.

---

## 5. KNOWN GAPS AND UNCERTAINTIES

1. **No class-by-class numbers.** DHS/OHSS LPR by class, State Dept NIV issuance by class and year (2015-2025), DV selectee counts for Nigeria, and F-1 numbers were not retrievable (government sites returned 403). Fill from OHSS LPR tables, Report of the Visa Office, Open Doors, and SEVIS by the Numbers.
2. **Population series.** Only a few secondary data points (277k, 393k, ~373k, ~533k); confirm all in ACS B05006 for each year. Age/sex mix and naturalization share NOT retrieved.
3. **Pay.** All pay ranges are design estimates; BLS OEWS metro figures (Houston, DC, Atlanta) were not pulled.
4. **Current policy status (Nov 2026).** Proclamation 10998 and the immigrant visa pause were reported in force/voided respectively via secondary news; visa bond permanent amounts come from one source; DV-2027 eligibility and DV pause dates conflict. Check travel.state.gov and the Federal Register.
5. **Family-based visas under 10998.** Sources disagree whether CR-1/IR-1/K-1 are covered.
6. **Overstay estimates.** Nigeria-specific rates vary by data year (7.14%/15.6% vs 5.56%/11.90%) and are upper bounds; undocumented population estimate NOT found.
7. **Visa interview wait times, Lagos vs Abuja processing roles** conflict.
8. **E-2 / treaty status for Nigeria** unverified.
9. **Asylum/refugee pathway data** not researched.
10. **Remittance mix** (formal vs informal) and US share of inflows unverified; per-household amounts NOT found.
11. **Travel costs, wait times, return-migration rates** not sourced.
12. **Search tool limitation:** several answers came through search summaries; direct quotes were not verified. Treat all URLs as pointers to confirm, not as proofs.
