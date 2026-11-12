# Mexico to US: ADD-ONS (universal routes, informal work, cities, challenges, gaps)

Game-design reference, not legal advice. Compiled 2026-11-08. Adds to `country-mexico.md`; does not repeat its MPI profile, remittance, Visa Bulletin or the 10 career paths.

Labels: CONFIRMED = number read on a page I opened this session (URL given). LIKELY = from a search-result snippet of a primary source, a secondary summary, or a well-established rule from background knowledge that I did not re-open. UNVERIFIED = not retrieved; use only as a design placeholder. Nothing here is invented; where a number is missing it says so.

Tone rule used throughout: Mexican immigrants are a large, varied group (11.1M Mexico-born, about 22% of US immigrants, per MPI in the earlier file). Informal work is described from data as a social-science account of sectors, pay, risks and outcomes. Nothing here is a how-to for avoiding law enforcement or obtaining false documents. Working without authorization is unlawful for the worker and the employer; the game should show legal consequences realistically.

Access notes: travel.state.gov, migrationpolicy.org, dol.gov NAWS pages and web.archive.org returned 403 or were blocked for fetch. USAFacts pages (which cite State Department tables) and bls.gov/news.release/cfoi.nr0.htm opened. The DHS FY2023 overstay PDF and the MPI pathways PDF downloaded as compressed binaries that no tool here could read (no pdftotext). Several State Department figures therefore come from USAFacts or search snippets.

---

## 1. UNIVERSAL ROUTES FOR MEXICO

### 1.0 Quick table (latest year with a Mexico number)

| Route | Mexico number | Year | Common or rare for Mexico | Label / source |
|---|---|---|---|---|
| Border Crossing Card (BCC, B-1/B-2) | 1,871,765 BCCs issued (all Mexican; no cap) | FY2024 | Very common (largest by far) | CONFIRMED, https://www.everycrsreport.com/reports/R45938.html |
| BCV (Mexican "Lincoln" border crossing visa) | 39,987 | FY2024 | Common among those who need a border visa | CONFIRMED, same URL |
| B-1 (business only) | Mexico 4,846 of 31,544 worldwide (15.4%) | FY2024 | Rare vs BCC; B-1 is a small class | CONFIRMED, https://usafacts.org/explainers/what-is-a-visa/visa-category/b-1/ |
| B-1/B-2 combined, all nationalities | 6,498,006 worldwide FY2024; 5,902,426 FY2023; Mexico-only split not retrieved | FY2023-24 | Common | FY2024 CONFIRMED (CRS URL above); FY2023 LIKELY (search snippet of CRS data brief) |
| F-1 student | Mexico not in the top 5 (India, China, Vietnam, South Korea, Nepal); worldwide 400,737 | FY2024 | Rare-to-modest | CONFIRMED that Mexico is not top 5, https://usafacts.org/explainers/what-is-a-visa/visa-category/f-1/ ; Mexico count UNVERIFIED |
| J-1 exchange | 17,707 (5.5% of 322,820) | FY2024 | Modest | CONFIRMED, https://usafacts.org/explainers/what-is-a-visa/visa-category/j-1/ |
| M-1 vocational | worldwide 6.32K; Mexico not given | FY2024 | Rare | CONFIRMED worldwide only, https://usafacts.org/explainers/what-is-a-visa/visa-category/m-1/ |
| O-1 | 880 (about 4.5% of 19,457; Mexico 5th) | FY2024 | Rare | CONFIRMED count, share is my arithmetic, https://usafacts.org/explainers/what-is-a-visa/visa-category/o-1/ |
| P (athletes, entertainers) | no Mexico number retrieved | n/a | Rare-to-modest (soccer, music, circus/performing) | UNVERIFIED |
| R-1 religious | worldwide 5.19K; Mexico not given | FY2024 | Rare | CONFIRMED worldwide only, https://usafacts.org/explainers/what-is-a-visa/visa-category/r-1/ |
| L-1 intracompany | 3,495 (about 4.9% of 71,799; 5th highest country) | FY2024 | Rare-to-modest (maquila/automotive/finance managers) | CONFIRMED count, https://usafacts.org/explainers/what-is-a-visa/visa-category/l-1/ |
| TN professional | 15,630 of 15,672 (99.7%) | FY2024 | Common among professionals | CONFIRMED, https://usafacts.org/explainers/what-is-a-visa/visa-category/tn/ |
| TD (TN dependents) | worldwide 12,199; Mexico share not given | FY2024 | Common alongside TN | CONFIRMED worldwide, CRS URL above |
| E-1/E-2 treaty | Mexico has no E treaty: see 1.8 | n/a | Not available | LIKELY |
| H-2A | Mexico 285,781 of 315,328 (90.6%); FY2023 about 92% | FY2024 / FY2023 | Very common | FY2024 CONFIRMED, https://usafacts.org/explainers/what-is-a-visa/visa-category/h-2a/ ; FY2023 92% LIKELY (MPI via search summary, https://www.migrationpolicy.org/research/us-legal-pathways-mexicans-central-americans) |
| H-2B | Mexico 90,500 (64.8%) FY2023; 90,457 FY2024 | FY2023-24 | Very common | CONFIRMED, https://usafacts.org/explainers/what-is-a-visa/visa-category/h-2b/ |
| K-1 fiance(e) | 4,180 (8.8% of 47,579; second to the Philippines) | FY2024 | Modest but notable | CONFIRMED, https://usafacts.org/explainers/what-is-a-visa/visa-category/k-1/ |
| Family-based LPR | Family-based totals for Mexicans and northern Central Americans combined ran roughly 80,000 to 120,000 a year; Mexico is the top birth country for new LPRs | various | Very common | LIKELY (MPI press release snippet, https://www.migrationpolicy.org/press-release/us-legal-pathways-expand-new-analysis-examines-channels-and-current-numbers-mexico) |

Series note: the user asked for 2015 to latest by year. I could only open single-year pages (FY2024, some FY2023). The State Department "NIV Issuances by Nationality and Visa Class" workbooks (https://travel.state.gov/content/travel/en/legal/visa-law0/visa-statistics/nonimmigrant-visa-statistics.html) and the DHS LPR tables (https://ohss.dhs.gov/topics/immigration/yearbook/2023) hold the full 2015 to 2024 series and should be pulled before final tuning. Trend facts that I did retrieve are in 1.9.

### 1.1 B-1/B-2 visitor and the Border Crossing Card
- BCC is a Mexico-only 10-year laser visa/card combined with B-1/B-2 status; no annual cap; 1,871,765 issued FY2024 (CONFIRMED, CRS URL above). Holders can enter by land for up to 30 days within the border zone (25 miles in most areas; 55 miles in parts of Arizona; 75 miles in Nogales/Tucson area) unless they get a longer I-94. LIKELY (background; https://travel.state.gov/content/travel/en/us-visas/tourism-visit/border-crossing-card.html, not opened).
- Refusals: State Department adjusted refusal rate for B visas, Mexico, FY2024 = 13.87% (LIKELY: search snippet of https://travel.state.gov/content/dam/visas/Statistics/Non-Immigrant-Statistics/RefusalRates/FY24.pdf; not opened). Worldwide acceptance rate for B-1 visas FY2024 = 78.8% (CONFIRMED, B-1 URL above). FY2023 Mexico rate: not found (a third-party site claims 23.8% for Mexico City but is a mirror site of unclear provenance: UNVERIFIED, do not use). Most common refusal reason: INA 214(b), failing to show strong ties abroad (LIKELY, same search).
- Typical applicant: shoppers and family visitors in border cities (Tijuana, Monterrey, Ciudad Juarez, Nuevo Laredo, Hermosillo, Mexico City), small business people, tourists. Profile detail beyond that: UNVERIFIED.
- Overstay evidence: DHS/CBP Entry/Exit Overstay Reports measure only air and sea arrivals; Mexico and Canada are reported separately because most arrive by land (FY2023 report, https://www.dhs.gov/sites/default/files/2024-09/0805_2024_cbp_entry_exit_overstay_report.pdf; CONFIRMED that the separate section exists, Mexico figure not readable). FY2023 overall suspected in-country overstay rate was 1.02% (399,708 people); the FY2022 overall rate was 3.04% with an unusually small expected-departure base (LIKELY, search summaries of the same reports). FY2019 Mexico air/sea suspected in-country overstay rate: 1.37% of 3,184,546 expected departures (LIKELY, snippet of https://dhs.gov/sites/default/files/publications/cbp_-_fiscal_year_2019_entry_exit_overstay_report.pdf). One Center for Immigration Studies email cites "about 124,000 overstays, 3.5%" for Mexico with no year or mode: UNVERIFIED, do not use. The reports exclude Mexican students/exchange visitors from the Mexico row (LIKELY). Land-border BCC overstays are not measured by these reports at all; that is a major data hole.
- Pathways out of B overstay: marriage to a US citizen as an "inspected and admitted" immediate relative lets someone adjust under INA 245(a) even after overstay (the earlier file covers this); the 3-year or 10-year unlawful-presence bar applies only on departure. Overstay is a very common way Mexicans (and many other nationalities) become out-of-status, but the share of Mexico's undocumented who entered legally is UNVERIFIED (Pew/CMS estimates for all nationalities say visa overstays are a large share of new unauthorized arrivals since the 2000s; Mexico-specific: UNVERIFIED).

### 1.2 F-1 student
- Mexico is not a top-5 F-1 source (CONFIRMED). F-1 issuance worldwide fell 25% from 534,320 (2013) to 400,737 (FY2024); worldwide F-1 acceptance 59% FY2024, down from a peak of 80.2% in 2021 (CONFIRMED, F-1 URL above). Mexico-specific F-1 issuances and refusal rate: UNVERIFIED (Open Doors, https://opendoorsdata.org, and the State "Table XVII" refusal tables).
- Typical applicant: middle-class and upper-middle-class families, border-region universities (Texas, Arizona, California), graduate STEM students on Conacyt-style scholarships (scholarship detail: UNVERIFIED).
- Moves: F-1 to OPT/STEM OPT to TN (only if the job is on the TN list), to H-1B lottery, to O-1, or to employer green card. F-1 holders must show non-immigrant intent (INA 214(b)); a USC marriage or a family petition can also change status. The "F-1 then TN then green card" ladder is common in practice but share is UNVERIFIED.

### 1.3 J-1
- 17,707 J-1 visas to Mexican nationals FY2024 (5.5% of 322,820); worldwide acceptance 89% (CONFIRMED, J-1 URL above). Categories include summer work travel, au pair, intern/trainee, student, researcher, physician. Category split for Mexico: UNVERIFIED. Two-year home residency requirement (INA 212(e)) applies to some J-1s (e.g., government-funded or skills-list fields): LIKELY, https://travel.state.gov/content/travel/en/us-visas/study/exchange.html.
- Typical profile: university students and graduates, au pairs, camp counselors, physicians in training.

### 1.4 M-1, R-1, P
- Rare for Mexico. M-1 (6.32K worldwide) and R-1 (5.19K worldwide) in FY2024 are tiny (CONFIRMED); no Mexico count retrieved (UNVERIFIED). R-1 fits clergy of Catholic or evangelical churches; P covers professional athletes (Liga MX players moving to MLS), musicians and performing groups; no data.

### 1.5 O-1, L-1
- O-1: 880 to Mexicans FY2024; worldwide acceptance 94.1% (CONFIRMED). Typical applicants: artists, chefs, scientists, athletes, founders with press or award records.
- L-1: 3,495 to Mexicans FY2024; worldwide acceptance 96.1% (CONFIRMED). Needs a qualifying company relationship, and one year of foreign employment for L-1 in the previous three years (LIKELY, https://www.uscis.gov/working-in-the-united-states/temporary-workers/l-1a-intracompany-transferee-executive-or-manager). L-1A to EB-1C green card is a documented route (LIKELY).

### 1.6 TN/TD (the dominant professional route for Mexico)
- Mexico took 15,630 of 15,672 TN visas in FY2024; worldwide TN issuance rose 64.1% from 9,548 in 2013 (CONFIRMED). Acceptance rate fell from a 90.5% peak (2020) to 57.4% in 2024 (CONFIRMED on the USAFacts page; Tryalma claims different rates: UNVERIFIED). TD for spouses and children: 12,199 FY2024 (CONFIRMED worldwide).
- Validity: Mexican TN visas were one-year-only from 2010 until 2022, then State began issuing up to 4-year visas for a higher fee ($382 vs $104) (LIKELY, search of Mintz/NatLawReview snippets: https://www.mintz.com/insights-center/viewpoints/2806/2023-01-04-department-state-provides-option-four-year-tn-visa). Admission itself is typically up to 3 years (earlier file).
- Typical applicants: engineers, accountants, systems analysts, nurses, management consultants, scientists with a bachelor's degree. Tryalma says Mexicans are now about 58% of all TN workers (counting admissions) versus Canadians 86% in 2006: UNVERIFIED (low-quality source).
- Moves: TN to PERM employer sponsorship to EB-2/EB-3 (Mexico is not oversubscribed in EB the way India/China are: LIKELY); TN renewals at the consulate; TN holder with a visible green card plan can be questioned (no dual intent) (earlier file).

### 1.7 H-2A and H-2B (circular migration)
- H-2A: Mexico 285,781 visas FY2024 (90.6%); 28th straight year Mexico led (CONFIRMED). DOL certified about 385,000 H-2A positions in FY2024 and about 378,000 in FY2023; about 398,258 in FY2025 (LIKELY via https://migration.ucdavis.edu/rmn/more.php?id=3007 ; CONFIRMED FY2025 in earlier file). Visa counts can exceed positions because each worker can get multiple visas a year. USAFacts FY2024 acceptance 96.1%.
- H-2B: Mexico 90,500 FY2023 (64.8%) and 90,457 FY2024 (CONFIRMED). Statutory cap 66,000 per year; extra supplemental visas in recent years (earlier file).
- Typical profile: rural men (and some women) from Veracruz, Michoacan, Guanajuato, Oaxaca, San Luis Potosi, Zacatecas and similar; many are return workers, recruited by US farm labor contractors via Mexican recruiters; H-2B jobs include landscaping, hospitality, seafood processing, forestry. Home-state data: UNVERIFIED (CIERTO or Mexican Labor Ministry data would help).
- Enforcement/outcomes: DOL WHD ordered H-2A back wages for 7,650 workers ($4.9M) in FY2024 vs 5,200 workers ($3.8M) FY2023; H-2A violations were half of WHD agricultural compliance actions and 75% of agricultural civil money penalties in FY2024 (LIKELY, Rural Migration News summary: https://migration.ucdavis.edu/rmn/more.php?id=3027). GAO (FY2018 to FY2023): 2,857 H-2A investigations, 2,392 (84%) found violations affecting 66,819 workers (LIKELY, https://files.gao.gov/reports/GAO-25-106389/index.html). Georgia 2023: 50 of 57 agricultural investigations found violations; 424 workers recovered about $250,000 (LIKELY, AJC snippet).
- Circularity: leave after the season and return next year (no green card from H-2A; earlier file). Some workers abscond or overstay and become undocumented; scale: UNVERIFIED (DHS overstay reports show H-2A rates by class, not retrieved).

### 1.8 E visas: Mexico is not an E-1/E-2 treaty country
- My understanding from background: Mexico has no E-1/E-2 treaty with the US, so Mexican citizens cannot qualify through nationality alone. The official list is https://travel.state.gov/content/travel/en/us-visas/visa-information-resources/fees/treaty.html. I could not open it. One law-firm page in my search listed Mexico among examples, so the premise is LIKELY not CONFIRMED; re-check the State list. If true, a Mexican investor would need a different route (O-1, L-1, EB-5, or E-2 through a second nationality or an eligible company).
- FY2024 E totals worldwide for scale: E-1 5,639; E-2 55,324 (CONFIRMED, CRS URL above).

### 1.9 Family-based routes and K-1
- K-1: 4,180 Mexicans FY2024 (CONFIRMED). K-1 requires marriage within 90 days of entry; adjustment to LPR follows. Fraud scrutiny and long consular waits at Ciudad Juarez: LIKELY, background.
- Immediate relatives (spouse, minor child, parent of a USC 21+): no cap. Mexico is the top birth country for new LPRs. Past levels: about 174,000 in 2016 peak (earlier file), 100,325 in FY2020 and 107,230 in FY2021 (inferred: USAFacts snippet reports 107,230 in 2021, up 6,905 or 6.88% from 2020, implying 100,325 in 2020 which matches the earlier file; LIKELY, https://usafacts.org/metrics/persons-obtaining-lawful-permanent-resident-status-by-country-of-birth-mexico/). An EPI chart shows 123,280 for FY2023: UNVERIFIED. OHSS 2019 Yearbook Table 3 shows Mexico 170,581 / 161,858 / 156,052 for three consecutive years but the snippet omitted the headers (probably FY2016, FY2017, FY2018 or FY2017 to FY2019): UNVERIFIED.
- Preference categories (F1, F2B, F3, F4) wait 18 to 25 years for Mexico per the earlier file (UNVERIFIED secondary).
- Marriage-based sequence: Mexican spouse who entered with inspection (B-2, K-1, TN, H-2A): adjust in the US. Spouse who entered without inspection: consular processing at Ciudad Juarez after I-601A (earlier file).
- MPI finding: non-immigrant visa issuance for Mexicans and northern Central Americans more than doubled between FY2012 and FY2019, lifting their share of all NIVs from 9% to 16% (LIKELY, MPI press release snippet above). Pandemic cut all visas about 68% (8.7M in 2019 to 2.8M in 2021) and volumes were back above pre-pandemic by 2023 (CONFIRMED, USAFacts pages).

### 1.10 How people move between routes (design graph)
- B-2/BCC visit -> overstay -> out of status -> (a) USC marriage with admitted entry: adjust; (b) stay unauthorized; (c) depart and trigger 3/10-year bar. Source: statute (earlier file).
- F-1 -> OPT -> TN -> PERM -> green card -> naturalization (5 years). LIKELY.
- J-1 -> two-year home residency (if applicable) or waiver -> H-1B or return. LIKELY.
- H-2A/H-2B year after year -> USC spouse petition -> adjust only if admitted; abscond -> unlawful presence. LIKELY.
- K-1 -> marriage -> LPR -> citizen. CONFIRMED rule (https://www.uscis.gov/family/family-of-us-citizens/visa-for-fiance-e).
- L-1A -> EB-1C. LIKELY.
- Work without authorization -> U or T visa if victim of qualifying crime or trafficking (see 2.8). LIKELY.

---

## 2. INFORMAL ("UNDER THE TABLE") WORK

Scope: people who are undocumented, out of status, or status-limited (for example H-2A workers tied to one employer, TN holders whose status is employer-specific, F-1 students with work limits). "Informal" covers cash/off-books pay, subcontracting, own-account work and employer practices that skirt wage law. Numbers below are mostly all-immigrant or all-Latino; Mexico-specific data is thin, and that is stated each time.

### 2.1 Size and sector shares
- Unauthorized immigrants in the labor force: about 8.3M in 2022, 4.8% of the workforce (LIKELY, Pew Feb 2025 analysis relayed by a summary PDF: https://files.constantcontact.com/668faa28001/de44367f-73d8-44b3-834e-3db386f23e2a.pdf). Pew 2016 figure was 4.8% too, peak 5.4% in 2007 (CONFIRMED, https://www.pewresearch.org/short-reads/2024/unauthorized-immigrant-workforce/). Pew's 2022 state shares: Nevada 8.6%, Texas 8.1%, Florida 7.5%, New Jersey 7.5%, California 7.2% (LIKELY, snippet).
- Share of each industry that is unauthorized (Pew, 2022, as relayed by CBS): nearly 1 in 5 household workers and landscapers; 16% of crop workers and meat processors; 14% of apparel manufacturing; 13% of construction (LIKELY, https://www.cbsnews.com/news/trumps-deportation-efforts-could-impact-these-industries-and-states-that-rely-on-undocumented-workers/). Older Pew: agriculture 15% and construction 13% (2016, CONFIRMED); 2012 agriculture 16%, construction 12%, leisure/hospitality 9% (LIKELY).
- Where undocumented workers are employed (Center for Migration Studies, relayed): construction about 20%, accommodation and food services about 12%, manufacturing 11%, administrative and support services 10%, retail 8% (LIKELY, secondary: https://www.washingtonexaminer.com/?p=3895435).
- Mexican-only sector shares: not retrieved (UNVERIFIED). Mexicans are 37% of unauthorized immigrants (Pew 2022, per earlier file), so sector figures for "unauthorized" are a rough proxy only.
- Crop agriculture: NAWS found about half of non-H-2A crop workers unauthorized through 2015-16 (49%), falling to about a third in 2017-18 (LIKELY, https://migration.ucdavis.edu/rmn/blog/post/?id=2643 and snippet). In 2019-2020, 63% of crop workers were born in Mexico, average wage $13.59/hour (LIKELY, same sources). NAWS 2021-2022 (2,598 interviews, Sept 2020 to Oct 2022) exists but I could not open it (https://www.dol.gov/agencies/eta/research/publications/findings-national-agricultural-workers-survey-naws-2021-2022): UNVERIFIED. Rural Migration News: field worker average wage $16.50 and livestock $15.82 in April 2022 (LIKELY, USDA FLS via snippet).

### 2.2 Pay vs. minimum wage, wage theft, exploitation
- Federal minimum wage is $7.25 (unchanged since 2009; CONFIRMED rule, https://www.dol.gov/agencies/whd/minimum-wage); many states and cities set far higher minimums. Hourly mean data for construction laborers and roofer helpers are in the earlier file.
- NELP "Broken Laws, Unprotected Workers" (2009; Bernhardt et al., surveys of 4,387 low-wage workers in New York City, Chicago and Los Angeles): 37% of undocumented immigrant workers had a minimum wage violation in the prior week vs 24% of work-authorized immigrants; 47% of unauthorized women were paid below minimum (LIKELY, snippets; the report is NELP not EPI). The 4,387 sample size and three cities are from background: LIKELY. Dated (2008 survey).
- SPLC "Under Siege" (2009): about 500 low-income Latinos at five Southern sites, 41% reported wage theft; New Orleans 80% (LIKELY, https://www.splcenter.org/20090401/under-siege-life-low-income-latinos-south). Dated; sample not Mexico-only.
- EPI estimates wage theft costs workers billions each year (figures $15B/yr for minimum wage violations and over $50B/yr overall are cited in secondary pages): LIKELY, https://www.epi.org/ ; verify the exact EPI reports before use. EPI also says over $3B in stolen wages were recovered 2017 to 2020 (LIKELY, https://www.epi.org/press/new-report-finds-that-more-than-3-billion-in-stolen-wages-was-recovered-for-workers-between-2017-and-2020/).
- Domestic work: 23% of 2,086 surveyed nannies, caregivers and housecleaners in 14 metros were paid below their state minimum wage (NDWA "Home Economics," 2012; LIKELY, snippet). Dated.
- Farm wage gap: authorized and unauthorized wage differences have narrowed but remain, per NAWS-based research (LIKELY: https://repository.lsu.edu/socialwork_pubs/301).
- Retaliation: reports of employers threatening to call ICE when workers complain are common in advocacy reports (SPLC, NELP). Frequency: UNVERIFIED. Remedy: FLSA protections apply regardless of immigration status for work performed (LIKELY, https://www.dol.gov/agencies/whd/immigration); NLRB back pay for unauthorized workers is limited by Hoffman Plastic Compounds (2002) (LIKELY, https://supreme.justia.com/cases/federal/us/535/137/).

### 2.3 Injury and fatality
- BLS CFOI total fatal work injuries: 5,283 (2023), 5,070 (2024); rate 3.5 then 3.3 per 100,000 FTE (CONFIRMED, https://www.bls.gov/news.release/cfoi.nr0.htm).
- Hispanic or Latino workers: 1,229 deaths in 2024, rate 4.3 per 100,000 (4.4 in 2023); foreign-born Hispanic or Latino deaths were 842 in 2024 (68.5% of Hispanic deaths), 839 of 1,250 in 2023, 792 in 2022 (CONFIRMED, CFOI URL and https://www.bls.gov/charts/census-of-fatal-occupational-injuries/fatal-work-injuries-to-hispanic-or-latino-workers.htm via snippet). Mexico-born counts: BLS publishes birthplace on request; not retrieved (UNVERIFIED). Many foreign-born Hispanic workers are Mexican-born, but the share is UNVERIFIED.
- 2021 detail: record 727 foreign-born Hispanic deaths; 14.0% of all work deaths vs 8.2% of employment; construction 274, administrative/support and waste management 109, transportation/warehousing 84, agriculture 70, manufacturing 65; California 135, Texas 134, Florida 72 (CONFIRMED, https://www.bls.gov/opub/ted/2023/work-related-fatal-injuries-among-foreign-born-hispanic-or-latino-workers-rose-to-727-in-2021.htm). In 2023 construction was 315 of 839 (37.5%) foreign-born Hispanic deaths (LIKELY, BLS snippet).
- Causes (2020 shares of all fatalities): falls/slips/trips 26.3%; contact with objects 18.4%; harmful substances/environments 14.7%; transportation 10.6% (CONFIRMED, same BLS page).
- Heat: CDC analysis of 1992-2006 BLS data found a heat death rate of 0.39 per 100,000 crop workers vs 0.02 for all civilian workers (LIKELY, https://stacks.cdc.gov/view/cdc/188356/cdc_188356_DS1.pdf). BLS recorded 56 environmental-heat deaths in 2020 and 36 in 2021; advocates argue undercount (LIKELY, NPR via snippet). No federal heat standard is in force as of my sources (UNVERIFIED for late 2026).
- Meatpacking and poultry: injury rates cited as about 3 times other manufacturing by UFCW; HRW (2005) documented underreporting and pressure on immigrant workers not to report (LIKELY, https://www.hrw.org/reports/2005/usa0105/1.htm). Dated, advocacy source; current BLS rate not retrieved.

### 2.4 Labor trafficking and coercion
- Federal data: Human Trafficking Institute's 2023 report counts 670 victims in federal trafficking cases filed that year; forced labor is only about 5% of cases since 2000, and the Southern District of Texas charged the most defendants (20) (LIKELY, https://traffickinginstitute.org/wp-content/uploads/2024/06/2023-Federal-Human-Trafficking-Report-WEB-Spreads-LR.pdf, via snippet). Industry and nationality split for Mexico: not retrieved (UNVERIFIED). Labor trafficking is widely seen as under-identified (LIKELY).
- Protections: T visa for trafficking victims, U visa for victims of listed crimes who help law enforcement. U visa principal cap is 10,000 a year; 266,293 principal petitions FY2017 to Q2 FY2025; USCIS estimates over 20 years to clear the backlog even if filings stop; bona fide determination (BFD) interim relief since June 2021 (LIKELY, https://nepyork.com/?p=5912 and snippets). Mexico-specific counts: UNVERIFIED.

### 2.5 Employer sanctions, E-Verify, raids
- Employer sanctions (INA 274A) make knowingly hiring unauthorized workers unlawful; employers must complete Form I-9 (CONFIRMED rule, https://www.uscis.gov/i-9). Worker-side use of false documents is separately unlawful. Do not present this as a solved problem: the game should show I-9 audits and terminations.
- E-Verify mandates: Florida private employers with 25+ employees; Georgia roughly 10+ (sources say 10 or 11); Texas only for public employers and contractors; also Louisiana, North Carolina, Tennessee, Utah above thresholds (LIKELY, https://www.paylocity.com/resources/learn/articles/e-verify-states/ and snippets; verify statutes Fla. Stat. 448.095, Ga. Code 13-10-91).
- ICE worksite enforcement FY2018: investigations 6,848 vs 1,691 in FY2017; 5,981 I-9 audits; 779 criminal and 1,525 administrative worksite arrests (CONFIRMED via ICE release, https://ice.gov/news/releases/ice-worksite-enforcement-investigations-fy18-surge).
- Large raids: 7 Mississippi poultry plants, Aug 7, 2019: 680 arrested, about 300 released within a day (CONFIRMED by several news pages incl. https://www.npr.org/2019/08/07/749243985/mississippi-immigration-raids-net-hundreds-of-workers). Hyundai/HL-GA battery site, Georgia, Sept 4, 2025: "hundreds" arrested (CONFIRMED headline; the 475 figure sometimes cited: UNVERIFIED; most detainees were reported to be Korean nationals, not Mexican: UNVERIFIED). 2025 overall: at least 40 worksite actions with over 1,100 arrests in the first seven months, called a record year by the ABA (LIKELY, https://www.americanbar.org/groups/labor_law/resources/magazine/2026-winter/worksite-enforcement-keystone-interior-immigration-enforcement). Year-by-year raid table 2015-2024: UNVERIFIED. Omaha (Glenn Valley, 2025): not verified.
- Aftermath data: a Tennessee meat plant settled for over $600,000 in unpaid wages and damages after a 2018 ICE raid (LIKELY, SPLC: https://splcenter.org/presscenter/splc-settlement-confirms-exploitation-workers-targeted-ice).

### 2.6 Taxes, ITIN, banking
- Households led by undocumented immigrants paid $75.6B in taxes in 2022 ($46.6B federal, $29.0B state/local) per AIC; ITEP's ITIN-based estimate is $96.7B ($59.4B federal, $37.4B state/local), including $25.7B Social Security, $6.4B Medicare and $1.8B unemployment insurance (LIKELY, https://www.americanimmigrationcouncil.org/blog/how-undocumented-immigrants-pay-taxes-itin/ and https://itep.org/). Different methods; no Mexico split (UNVERIFIED).
- ITIN risk: an April 2025 IRS-ICE agreement shared taxpayer addresses; 47,289 addresses were provided before a court block; Judge Kollar-Kotelly found about 42,695 unlawful disclosures; a second judge (Talwani) also enjoined; the D.C. Circuit upheld the block on Sept 9, 2026, but status remains contested (LIKELY, https://www.cpapracticeadvisor.com/2026/09/09/appeals-court-upholds-block-on-irs-ice-taxpayer-data-sharing-deal/189889/ and https://www.kqed.org/news/12073445/tax-day-filing-2026-ice-irs-trump-itin-number-no-social-security-number). Measured drop in ITIN filing: UNVERIFIED.
- Banking: ITIN holders can open accounts at some banks and credit unions; consular ID (matricula consular) is accepted at many, not all: LIKELY (background; no retrieved source). Unbanked rate for undocumented Mexicans: UNVERIFIED.

### 2.7 Driver's licence, health, school (summary; details in earlier file)
- 19 states plus DC issue licences regardless of status (earlier file; LIKELY). Texas, Georgia, Florida, North Carolina: no. Unlicensed driving can bring arrest and ICE referral (LIKELY).
- Health: emergency Medicaid only in most states; state-funded coverage for some groups in CA, IL, OR, MN, NY, WA, DC is shrinking (earlier file). Plyler v. Doe guarantees K-12 (earlier file).

### 2.8 Exits (how people leave informal status or the US)
- Adjustment through a USC spouse or parent/child 21+ if admitted (245(a)); consular route with I-601A if not; cancellation of removal (10 years, capped at 4,000 a year); U or T visa; asylum rarely for Mexicans; voluntary departure or removal; return migration (earlier file for rules and sources).
- DACA is not available to any arrival year 2015-2026 (earlier file). Return flows: Mexico-born count fell about 5% in 2025 (UNVERIFIED headline in earlier file). Exact exit counts by route for Mexicans: UNVERIFIED.

### 2.9 Informal job options (12 distinct, with data and main risks)
Each entry: what it is, data, main risks, data quality. Status-limited options noted.

1. Farm labor, undocumented or H-2A-adjacent (seasonal picking, packing). Data: about half of non-H-2A crop workers unauthorized in 2015-16, about a third 2017-18; 63% Mexico-born (2019-20); average wage $13.59 (2019-20); $16.50 field workers (April 2022). Risks: heat illness (0.39/100,000 crop workers vs 0.02), piece-rate pressure, housing, wage theft, H-2A recruiter debt/retaliation (84% of WHD H-2A cases found violations, FY2018-23). Quality: good for crop workers, thin for Mexico-only.
2. Construction and day-labor (framing, drywall, roofing, demolition). Data: 13% of construction workforce unauthorized; about 20% of unauthorized workers are in construction (CMS via secondary); construction was 315 of 839 foreign-born Hispanic deaths in 2023. Risks: falls (leading cause), no workers' comp coverage by subcontractors, misclassification, wage theft at day-labor corners, E-Verify states. Quality: good on fatalities, thin on informal pay.
3. Landscaping and groundskeeping (crew member or own mower-and-truck business). Data: nearly 1 in 5 landscapers unauthorized (Pew 2022 via CBS). H-2B landscaping crews exist. Risks: truck/trailer traffic stops where licences are unavailable, injuries, seasonality, non-payment by clients. Quality: moderate; no Mexico split.
4. Domestic work: house cleaning (cash, per-house). Data: nearly 1 in 5 household workers unauthorized (Pew via CBS); 23% below state minimum wage in NDWA 2012 sample. Risks: isolation, no overtime, no coverage, abuse, safety from chemicals. State domestic workers' bills of rights (CA, IL, NY, OR, NV and others; LIKELY). Quality: moderate, dated.
5. Nanny and live-in caregiver. Same sources as 4; additional risks: 24-hour availability without overtime (LIKELY), employer control of housing, trafficking cases in live-in settings (LIKELY; no Mexico count). Quality: thin.
6. Restaurant kitchen (dishwasher, prep, line cook, often cash). Data: older Pew estimate ~10% of restaurant workers unauthorized in 2014 (UNVERIFIED, earlier snippet only); CMS places about 12% of unauthorized workers in accommodation and food services. Risks: off-the-clock work, tip and overtime theft, burns, I-9 audits for owners. Quality: thin.
7. Street vending (food carts, fruit, merchandise, tamales, elote). Data: Los Angeles has about 50,000 street vendors (10,000 selling food), a $504 million industry per a city estimate cited in press; LA decriminalized sidewalk vending in 2018 (state law SB 946) (LIKELY, https://www.wiego.org/los-angeles-usa-decriminalizes-street-vendors and snippet). Most NYC vendors are immigrants (LIKELY, https://thefilam.net/archives/41850). Mexico split and incomes: UNVERIFIED. Risks: permit fines, equipment seizure, heat, violence/robbery, health-code actions, ICE visibility during sweeps.
8. Car wash work. Data: Chicago survey of 204 workers found over three-quarters had minimum wage violations (LIKELY, WBEZ 2012: https://www.wbez.org/stories/study-wage-theft-rampant-in-chicago-car-washes/f83910c3-5fa5-41b0-a7d3-da78860a2e48); California Labor Commissioner fined 35 LA-area car washes about $1.3M for about 400 workers (LIKELY, KCRW); 770 registered car washes in California in 2020 (LIKELY). Risks: tips-only pay, chemical exposure, wage claims taking years (LAist: some owed wages still unpaid 3 years later). Mexico split: UNVERIFIED.
9. Meat and poultry processing. Data: 16% of meat processors unauthorized (Pew 2022 via CBS); injury rates about 3 times other manufacturing (UFCW, advocacy); Mississippi 2019 raid arrested 680. Risks: repetitive strain, cuts, chemical exposure, I-9 audits, raids, plant closure, child labor in sanitation crews (documented but not retrieved: UNVERIFIED). Many workers in these plants are lawfully authorized; do not stereotype.
10. Gig delivery and rideshare. Data: NYC app delivery workers (about 65,000) earned on average $7.87/hour before tips in one survey (LIKELY, snippet of Los Deliveristas-era study via https://nordot.app/689917565600613473; DoorDash disputed it); 85% said it was their only job. Press reports describe account-renting arrangements among some newly arrived migrants (LIKELY, https://sanangelolive.com/news/crime/2024-08-29/report-driver-accounts-food-delivery-apps-being-illegally-rented-migrants; mostly non-Mexican examples such as Venezuelans in Dallas). Risks: no minimum wage floor in some cities, deactivation, theft/assault, rent paid to account holders, and account-sharing violations of platform rules. NYC has since set a delivery worker minimum pay rate (LIKELY, not verified: UNVERIFIED). Mexico split: UNVERIFIED.
11. Subcontracted janitorial and night cleaning (office buildings, retail). Data: 'administrative and support services' hold about 10% of unauthorized workers (CMS via secondary) and 109 foreign-born Hispanic deaths in 2021 (CONFIRMED BLS, includes waste management); building and grounds cleaning had 92 deaths in 2021 (CONFIRMED). Risks: contractor chains, wage-and-hour theft, night-shift assault, chemical exposure. Pay: UNVERIFIED.
12. Auto repair, body-shop and small trades (own-account mechanic, tire shop, welding, tamale/catering from home). Data: none retrieved on informal share. Risks: unlicensed-business fines, no insurance, customer disputes. Quality: UNVERIFIED; included because small-business formation with ITINs is a documented path (LIKELY; see AIC blog above).
13. Day-labor corners and home-improvement hiring (moving, painting, yard clean-up). Data: NDLON surveyed day laborers nationally (2006: about 117,600 on a typical day; 49% undocumented-status rate was reported); I did not retrieve it this session. UNVERIFIED. Risks: non-payment (a major documented problem), injuries, police/immigration sweeps at corners.

Where data is thin: Mexico-only shares for every sector; real pay for off-books work; incidence of retaliation threats; labor trafficking counts by nationality and industry; current meat/poultry injury rates; car wash and restaurant industry-level unauthorized shares.

---

## 3. THE 8 ARRIVAL CITIES (what is documented vs inferred)

Metro-level data on Mexican informal work is very thin. Anchors: MPI says about 35% of Mexican immigrants live in Los Angeles, Chicago, Houston, Dallas or Riverside metros; LA about 14%, Chicago about 6%, Houston/Dallas/Riverside about 5% each (LIKELY, https://www.migrationpolicy.org/article/mexican-immigrants-united-states-2024 via snippet). 2017-era counts (stale): LA 1.735M, Chicago 669,000, Houston 606,000, Dallas 601,000 (UNVERIFIED, press list from older census data). New York, Atlanta, Washington and San Francisco shares were not retrieved. Below, "inferred" means I reasoned from the sector and state data above, not from a city-level source.

| City | Mexican presence | Informal sectors likely common | Universal routes likely common | Notes / label |
|---|---|---|---|---|
| Los Angeles | Largest hub (about 14% of US Mexican immigrants) | Street vending (about 50,000 vendors citywide), car washes, garment, domestic work, restaurant kitchens, construction | Family-based LPR, BCC visits from Tijuana/Mexicali, TN, J-1/F-1 | Sector facts LIKELY (above); share of Mexicans in each: UNVERIFIED. California issues driver's licences regardless of status and has wage-claim machinery (Labor Commissioner) |
| Houston | ~5% of US Mexicans | Construction, landscaping, restaurants, domestic cleaning, logistics | Family-based, TN (energy/engineering), H-2B nearby, BCC via Laredo/Brownsville | Texas has no mandatory private E-Verify; no licences for undocumented. Inferred; construction share in Texas supported by Pew state data (TX 8.1% unauthorized in workforce) |
| Dallas-Fort Worth | ~5% | Construction, roofing, landscaping, restaurants, delivery | TN (corporate/aerospace/finance), family, F-1 | Account-renting delivery reports in Dallas involve Venezuelans (LIKELY); Mexico split UNVERIFIED |
| Chicago | ~6% | Restaurants, car washes (Chicago survey: over three-quarters minimum-wage violations), food processing, landscaping, janitorial | Family-based, F-1/TN, cancellation of removal cases in immigration court | Illinois allows licences for undocumented (earlier file) and has a Domestic Workers' Bill of Rights (LIKELY). Metro-specific shares UNVERIFIED |
| San Francisco Bay Area | not retrieved | Domestic work, restaurant kitchens, landscaping, construction, janitorial | TN/L-1/H-1B tech spillover, F-1, family | Bay Area tech draws TN (Mexican engineers) but Mexican share vs other groups UNVERIFIED; high minimum wages make off-books pay gaps larger in dollars |
| New York | not retrieved (Mexican communities exist: Puebla, Guerrero, Oaxaca origins) | App delivery (65,000 couriers, $7.87/hour before tips in a survey), restaurants, street vending, construction, domestic work | Family-based, B-2 overstay, J-1/F-1 | Mexico share of couriers and vendors: UNVERIFIED; much delivery workforce is Latin American and Asian |
| Washington DC | not retrieved | Domestic work, construction, restaurants, cleaning | TN/J-1 (policy and international organizations), family | DC licenses undocumented drivers (earlier file); Mexico share UNVERIFIED |
| Atlanta | not retrieved | Construction, landscaping, poultry processing (north Georgia), restaurants; H-2A/H-2B employers statewide | Family, H-2A/H-2B nearby, TN (corporate) | Georgia: E-Verify for employers of roughly 10+; FY2025 second-largest H-2A state (10.7% of positions) (CONFIRMED in earlier file); Georgia agriculture investigations 50 of 57 found violations (LIKELY); no licences for undocumented |

Rule of thumb for the game (inferred, not sourced): Los Angeles and Chicago have the deepest Mexican social networks; Houston and Dallas lean to construction and trades; Atlanta ties to Southern agriculture/poultry; New York, DC and the Bay Area are more mixed and more skewed to professional routes and non-Mexican informal workforces.

---

## 4. TWENTY MORE CHALLENGE IDEAS (route-specific)

Format: Challenge | Tied to | Pass | Fail. These add to the 20 in the earlier file.

1. BCC border-zone limit | BCC allows stay in the border zone for up to 30 days; 1,871,765 BCCs issued FY2024 (CONFIRMED/LIKELY) | Visit family in San Diego, stay in zone, home on time | Travel beyond the zone or work, BCC cancelled, status violation.
2. 214(b) strong ties | Mexico adjusted B refusal rate 13.87% FY2024 (LIKELY) | Show job, property, family ties at the interview | Refused, wait and reapply with new evidence.
3. B-2 overstay decision | DHS overstay reports; 3/10-year bars (statute) | Leave on time and keep a clean record | Overstay, accrue unlawful presence, lose the 245(a)/consular option later.
4. TN approval odds | TN acceptance 57.4% in 2024 vs 90.5% in 2020 (CONFIRMED) | Prepare a job letter and degree match for a USMCA profession | Refused, lose the job offer window.
5. TN to green card trap | TN has no dual intent (LIKELY) | Plan PERM carefully and time renewals | Border officer questions immigrant intent, entry denied.
6. TD spouse dilemma | TD 12,199 worldwide FY2024; TD cannot work (LIKELY) | Spouse finds study, volunteer or a separate status | Spouse works off the books, status violation.
7. J-1 two-year rule | INA 212(e) home residency for some J-1s (LIKELY) | Return home two years, or win a waiver | Stay and lose the H-1B/LPR path.
8. H-2A season cycle | 285,781 Mexican H-2A visas FY2024 (CONFIRMED) | Finish seasons, get recalled, save for home | Employer retaliation or blacklisting, no recall.
9. H-2A wage claim | WHD found violations in 84% of 2,857 H-2A investigations FY2018-23 (LIKELY) | Document hours, contact WHD or legal aid, recover back wages | Fear of blacklisting stops the claim; wages lost.
10. Heat shift | Crop worker heat death rate 0.39 vs 0.02 per 100,000 (LIKELY) | Take shaded breaks, water, report symptoms, employer follows rule | Heat illness, lost workdays, medical bills.
11. Construction fall | 315 of 839 foreign-born Hispanic deaths in 2023 were in construction; falls 26.3% of deaths (CONFIRMED/LIKELY) | Fall-protection gear and training; report hazards | Injury with no workers' comp, income gap.
12. Wage theft at the day-labor corner | Wage theft widely documented (SPLC 41%; NELP 37%) (LIKELY) | Keep a notebook, photo of job site, file a claim | Unpaid week, worker has no proof.
13. Car wash tips-only trap | Chicago over three-quarters minimum-wage violations; LA fines $1.3M (LIKELY) | Join a worker centre, win a back-wage settlement | Employer closes and reopens under a new name, wages unpaid.
14. Street vendor permit | LA about 50,000 vendors; vending decriminalized 2018 (LIKELY) | Obtain city permit and health card, steady pitch | Citation, equipment seized, lost inventory.
15. Delivery app pay | NYC delivery average $7.87/hour pre-tips in a survey (LIKELY, disputed) | Track real hourly pay, choose better shifts, join a delivery workers' group | Account deactivated, worker owes the account holder rent.
16. I-9 audit | ICE FY2018: 5,981 I-9 audits (CONFIRMED) | Employer-side: complete verified documents; worker-side: lawful status | Audit finds problems, mass layoff.
17. Worksite raid aftermath | Mississippi 2019: 680 arrested, about 300 released next day (CONFIRMED) | Family has an emergency plan, lawyer contact, childcare | Detention, children left without a caregiver.
18. Telling the boss no | Hoffman Plastic limits back pay; FLSA still applies (LIKELY) | Win unpaid wages for hours worked | Fired, retaliation, no reinstatement.
19. U visa wait | 10,000 principal cap; backlog over 20 years; BFD gives interim work permit (LIKELY) | Cooperate with police, get certification, receive BFD | Years in limbo; certifying agency refuses.
20. ITIN and the data-sharing scare | IRS-ICE address sharing 47,289 addresses; courts blocked it (LIKELY) | File taxes with ITIN, keep records for a future mortgage or legalization | Skip filing from fear; lose refund and paper trail; or filing leads to harassment risk.

Additional ideas: (a) E-Verify state: moving jobs between Georgia (checked employer) and Texas (unchecked private employer); (b) "inspected and admitted" quiz at marriage: how the first entry type changes everything; (c) K-1 90-day wedding deadline; (d) L-1A to EB-1C from a Monterrey company transfer.

---

## 5. KNOWN GAPS AND UNCERTAINTIES

1. No year-by-year 2015 to 2024 series for any Mexico visa class; only FY2023/FY2024 single points (plus some 2012 to 2019 trend). Pull State "NIV Issuances by Nationality and Visa Class" and OHSS LPR Table 6/10 for all years.
2. Mexico B-1/B-2 (non-BCC) counts, F-1 counts, P, M-1, R-1: not retrieved. Mexico FY2023 refusal rate: not found; FY2024 13.87% is from a snippet.
3. DHS overstay reports: the FY2023 Mexico section was in an unreadable PDF; Mexico B-1/B-2 and land-border overstay rates are unknown. CIS "3.5%, 124,000" is undated: do not use.
4. E visa: Mexico's treaty status is from background knowledge plus conflicting law-firm pages; confirm on the State Department list.
5. Informal-work data is mostly all-immigrant, all-Latino or "unauthorized" (all nationalities). Mexico-specific shares by sector, pay, injury and wage theft are missing. NAWS 2021-2022 and Pew 2022 sector tables could not be opened; figures come from secondary summaries.
6. Several wage-theft sources are old (NELP 2009, SPLC 2009, NDWA 2012, Chicago car wash 2012, HRW 2005). Treat as illustrative, not current.
7. Labor trafficking: no Mexico or industry split. U/T visa Mexico counts missing.
8. Raid history by year 2015 to 2024 is incomplete; 2025 numbers are press-reported. Hyundai raid arrest count (475) and nationality mix are not verified. Omaha 2025 raid not verified.
9. The IRS-ICE data-sharing legal status is contested; check current rulings before writing event text.
10. Metro-level data for NYC, Washington, Atlanta and Bay Area Mexicans was not retrieved; the city table is partly inference and labelled so.
11. Policy volatility (H-2A wage rule, DACA litigation, TN/USMCA review in 2026, expedited removal, CDL rules) can invalidate event text; reverify against official sources.
12. Day-labor (NDLON) and domestic worker numbers are from background memory or snippets; no current survey was opened.
13. The "100,325 = FY2020" LPR inference comes from arithmetic on a snippet; confirm in OHSS Table 3.

Nothing in this file is legal advice; it should not be used to plan how to enter, work or remain in the US.
