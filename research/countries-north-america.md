# Country data notes: North America (Canada, Guatemala, El Salvador, Dominican Republic)

Written 2026-11-11 for `src/data/countries/{canada,guatemala,el-salvador,dominican-republic}.json`. Mexico was not touched. Every URL below was opened this session unless marked "reused" (taken from research/rules-verification.md or research/unauthorized-entry.md). Confidence: CONFIRMED = primary or official source opened; LIKELY = reputable secondary; UNVERIFIED = design estimate.

## Shared sources
- S1 EOIR Asylum Decisions by Nationality, FY2024 (data of 10 Oct 2024): https://www.justice.gov/eoir/media/1344846/dl . CONFIRMED. Rate = grants / (grants + denials), my arithmetic.
- S2 CBP Nationwide Encounters CSV, FY23 to FY26 (through Sep): https://www.cbp.gov/sites/default/files/2026-10/nationwide-encounters-fy23-fy26-sep-aor.csv . CONFIRMED (derived sums; USBP, Title 8). Data and consequences only.
- S3 November 2026 Visa Bulletin as transcribed by a law firm: https://www.gozellaw.com/blog/november-2026-visa-bulletin . LIKELY (travel.state.gov returns 403). All four countries fall under All Chargeability Areas: F1 22JAN21, F3 22OCT15, F4 22OCT12, EB-1 Current, EB-2 01APR25, EB-3 15JUN24. No separate column for any of them.
- S4 Proclamation effective 1 Jan 2026 (10998): https://www.whitehouse.gov/presidential-actions/2025/12/restricting-and-limiting-the-entry-of-foreign-nationals-to-protect-the-security-of-the-united-states/ . CONFIRMED: Canada, Guatemala, El Salvador and the Dominican Republic do not appear. Dominica (a different country) is in Sec. 5(e).
- S5 Later proclamations: Federal Register API search of 2026 presidential proclamations (https://www.federalregister.gov/api/v1/documents.json, term "entry nationals") returned only "Restriction on Entry of Certain Nonimmigrant Workers" (23 Sep 2026), which by title is the H-1B worker restriction and not nationality based. LIKELY (title only; the document page redirected to an unblock page and was not read).
- S6 75-country immigrant visa pause (State Department, from 21 Jan 2026): list at https://www.mintz.com/insights-center/viewpoints/2806/2026-01-29-state-department-suspends-immigrant-visa-processing-75 (Guatemala yes; El Salvador, Dominican Republic, Canada no; Dominica yes). Vacated by S.D.N.Y. in CLINIC v. Rubio, No. 1:26-cv-00858, on 21 Aug 2026: https://www.fragomen.com/insights/united-states-federal-district-court-vacates-state-departments-75-country-immigrant-visa-ban.html ; State filing of 28 Aug 2026 says the pause "is no longer in effect": https://manifestlaw.com/news/state-dept-ends-75-country-pause-08-31-2026 ; a short worldwide immigrant visa interview pause followed: https://www.pryorcashman.com/publications/federal-court-strikes-down-immigrant-visa-suspension-for-75-countries-as-department-of-state-imposes-worldwide-pause-on-immigrant-visa-processing . All LIKELY (secondary; travel.state.gov 403).
- S7 DV-2026 ineligible list, Federal Register 1 Oct 2024: https://www.govinfo.gov/content/pkg/FR-2024-10-01/html/2024-22482.htm . CONFIRMED for DV-2026: Canada, Dominican Republic, El Salvador not eligible; Guatemala eligible.
- S8 Visa Waiver Program country list: https://www.dhs.gov/visa-waiver-program . CONFIRMED: none of the four is a VWP country.
- S9 TN: https://www.uscis.gov/working-in-the-united-states/temporary-workers/tn-usmca-professionals . CONFIRMED.
- S10 8 CFR 212.1(a)(1): https://www.law.cornell.edu/cfr/text/8/212.1 . CONFIRMED (regulation text via Cornell LII): a visa is generally not required for Canadian citizens except categories E, K, S, V.
- S11 Open Doors 2025 country fact sheets: https://opendoorsdata.org/wp-content/uploads/2026/01/OD_<Country>_Fact-Sheet-2025.pdf (Canada, Guatemala, El-Salvador, Dominican-Republic). CONFIRMED.
- S12 Time zones: IANA tz database read with Python zoneinfo (America/Toronto, America/Guatemala, America/El_Salvador, America/Santo_Domingo). CONFIRMED.
- Flights: design estimates, UNVERIFIED, estimate true (Canada $350, Guatemala $550, El Salvador $550, Dominican Republic $500).

## Canada
Facts
- time-difference: same as US Eastern all year, 3 h ahead of Pacific. S12, CONFIRMED.
- flight-roundtrip: $350, UNVERIFIED design estimate.
- students-in-us-latest: 29,903 in 2024/25 (28,998 prior), rank 4. S11, CONFIRMED.
- h1b-share-latest: H-1B share not found; used TN: 42 of 15,672 TN visas FY2024 went to Canadians (https://usafacts.org/explainers/what-is-a-visa/visa-category/tn/, CONFIRMED) because Canadians apply at the port of entry without a visa (S9).
- asylum-context: grants and denials both suppressed (fewer than four); 13 not adjudicated. S1, CONFIRMED.
- family-backlog: Rest of World dates. S3, LIKELY.
Entry notes
- F1: visa generally not required (S10, CONFIRMED); 29,903 students, rank 4 (S11).
- H1B: TN at port of entry, no consular visa, up to 3 years (S9, CONFIRMED).
- B2: visa generally not required; passport generally required (S10, CONFIRMED).
- O1: no visa needed (S10); petition requirement is general O-1 law, not re-read this session (LIKELY).
- FAM: K category needs a visa (S10); Rest of World (S3); not DV eligible (S7).
- EWI: 245 USBP northern border Title 8 apprehensions of Canadian citizens FY2024 (189 in FY2025, 141 in FY2026) (S2, CONFIRMED). Consequence line reused from country-mexico.md 2 (LIKELY).
- ASY: S1.
Mechanics
- ebQueue row (S3). asylumGrantPct null (S1 suppression). arrivalLimits empty (S4, S5, S6).
- visaWaiver true: Canada is NOT a Visa Waiver Program country (S8). The flag is set true because Canadian citizens are visa exempt under 8 CFR 212.1(a)(1) (S10), which is the substance the flag stands for. No ESTA applies. If the game shows ESTA text when this flag is true, Canada needs its own wording.
Culture
- familySupportFactor 1.0: no sourced reason to move it. Festivals (Thanksgiving second Monday of October, Christmas and Boxing Day, Canada Day 1 July), names (English, French, South Asian, Chinese, Arab and African Canadian), dish and call are design content.

## Guatemala
Facts
- time-difference: UTC-6 all year. S12, CONFIRMED.
- flight-roundtrip: $550, UNVERIFIED design estimate.
- f1-visas-issued-fy2024: 941 (686 FY22, 795 FY23, 915 FY25). https://visagrader.com/visa-approvals-and-refusals/F1/guatemala-gtm , LIKELY.
- students-in-us-latest: 1,344 in 2024/25 (1,352 prior), rank 75. S11, CONFIRMED.
- remittances-latest: $25,530.2M in 2025, +18.7%. IOM via EFE/Infobae: https://www.infobae.com/el-salvador/2026/02/19/las-remesas-familiares-crecen-en-centroamerica-y-alcanzan-usd-47730-millones-en-2025/ , LIKELY. Banguat primary not opened.
- asylum-context: 1,592 grants, 2,736 denials = 36.8%; 1,715 abandoned; 23,822 not adjudicated; 1,826 withdrawn. S1, CONFIRMED.
- family-backlog: Rest of World. S3, LIKELY.
Entry notes
- F1: S11 and visagrader. H1B: TN limited to Canadian and Mexican citizens (S9); Rest of World (S3). B2: not VWP (S8). O1: general rule, no numbers. FAM: pause and vacatur (S6, LIKELY); DV eligible (S7, DV-2026 only).
- EWI: USBP southwest Title 8 apprehensions of Guatemalans 195,294 of 1,530,523 in FY2024 (12.8%), 30,035 of 237,538 in FY2025 (12.6%), 11,388 of 98,705 in FY2026 (11.5%); FY2023 150,453 plus 62,813 Title 42. S2, CONFIRMED derived.
- ASY: S1.
Mechanics
- ebQueue row. asylumGrantPct 37. visaWaiver false.
- arrivalLimits: one entry, from 2026, routes FAM, source Fragomen (S6). LIKELY. This is a State Department policy, not a proclamation; it ran 21 Jan to 21 Aug 2026 (about seven months) and was then vacated. It is included because it blocked family immigrant visas for most of 2026. It should not be read as blocking 2027 onward unless a stay or new policy reinstates it.
Culture
- familySupportFactor 1.0. Festivals: Independence 15 Sep, Día de Todos los Santos 1 Nov (fiambre, giant kites of Sumpango and Santiago Sacatepéquez), Semana Santa (month 8, written as "this year" because the date moves; in some years it falls in March). Dish pepián. Names are mostly Spanish given names with two Maya names (Ixchel, Itzel). Design content for community review.

## El Salvador
Facts
- time-difference: UTC-6 all year. S12, CONFIRMED.
- flight-roundtrip: $550, UNVERIFIED design estimate.
- f1-visas-issued-fy2024: 338 (360 FY22, 307 FY23, 231 FY25). https://visagrader.com/visa-approvals-and-refusals/F1/el-salvador-slv , LIKELY.
- students-in-us-latest: 1,384 in 2024/25 (1,451 prior), rank 72. S11, CONFIRMED.
- remittances-latest: $9,987.9M in 2025, +17.8%. IOM via EFE/Infobae (same URL as Guatemala), LIKELY. BCR primary not opened.
- asylum-context: 1,684 grants, 2,880 denials = 36.9%; 941 abandoned; 20,572 not adjudicated; 1,195 withdrawn. S1, CONFIRMED.
- tps-status (extra id, not looked up by name): designated 9 Mar 2001; continuous residence since 13 Feb 2001; extension ran to 9 Sep 2026; alert says an announcement "will be made at the appropriate time" and holders keep protection and work authorization; page last updated 7 Oct 2026. https://www.uscis.gov/humanitarian/temporary-protected-status/temporary-protected-status-designated-country-el-salvador , CONFIRMED. 224,070 beneficiaries as of 25 Jun 2026 and "no Federal Register notice published" as of 22 Oct 2026: CRS R49346, https://www.everycrsreport.com/files/2026-10-22_R49346_ce64a076292626bd9098d23e3ec4b616febeba22.html , CONFIRMED. Federal Register API search (TPS + El Salvador, since 1 Jun 2026) on 11 Nov 2026 returned no TPS notice.
- family-backlog: Rest of World. S3, LIKELY.
Entry notes
- F1: S11 and visagrader. H1B: S9, S3. B2: S8. O1: general rule. FAM: S3; not on the 75-country list (S6); not DV eligible (S7).
- EWI: USBP southwest Title 8 apprehensions of Salvadorans 45,686 in FY2024 (3.0%), 7,805 in FY2025 (3.3%), 2,244 in FY2026 (2.3%); FY2023 32,307 plus 21,041 Title 42 (S2, CONFIRMED derived). TPS residence date from the USCIS page.
- ASY: S1.
Mechanics
- ebQueue row. asylumGrantPct 37. visaWaiver false. arrivalLimits empty (S4, S5, S6).
Culture
- familySupportFactor 1.0. homeMoneyNote says El Salvador uses the US dollar (dollarised since 2001): general knowledge, not fetched this session. Festivals: Fiestas Agostinas (first week of August, month 0), Independence 15 Sep, Nochebuena (panes con pavo). Dish pupusas. Design content.

## Dominican Republic
Facts
- time-difference: UTC-4 all year. S12, CONFIRMED.
- flight-roundtrip: $500, UNVERIFIED design estimate.
- f1-visas-issued-fy2024: 1,255 (1,513 FY22, 1,394 FY23, 1,240 FY25). https://visagrader.com/visa-approvals-and-refusals/F1/dominican-republic-dom , LIKELY.
- students-in-us-latest: 1,582 in 2024/25 (1,542 prior), rank 64. S11, CONFIRMED.
- remittances-latest: US$11,866.3M in 2025, +10.3%; US share 80.0% in December 2025. BCRD via https://acento.com.do/economia/bcrd-en-2025-llegaron-us-11866-millones-en-remesas-9602410.html , LIKELY. The article's 2024 base figure has a typo; the growth rate is as the article states it.
- asylum-context: 25 grants, 216 denials = 10.4%; 114 abandoned; 213 not adjudicated; 52 withdrawn. S1, CONFIRMED. Small numbers.
- family-backlog: Rest of World. S3, LIKELY.
Entry notes
- F1: S11 and visagrader. H1B: S9, S3. B2: S8. O1: general rule. FAM: not DV eligible (S7); Dominica, not the Dominican Republic, is in the proclamation (S4) and on the 75-country list (S6).
- EWI: the CBP file has no DOMINICAN REPUBLIC row; Dominicans are inside OTHER (S2, CONFIRMED gap). Consequence line reused (LIKELY).
- ASY: S1.
Mechanics
- ebQueue row. asylumGrantPct 10. visaWaiver false. arrivalLimits empty.
Culture
- familySupportFactor 1.0. Festivals: Nochebuena, Independence Day 27 February (end of carnival season), Día de las Madres (last Sunday of May). Dish sancocho. Design content.

## Gaps
- h1b-share-latest: no H-1B share or count found for Guatemala, El Salvador or the Dominican Republic (left out); Canada's H-1B share not found (TN figure used instead).
- TN admissions (I-94 counts) for Canadians were not retrieved; only the visa count of 42 was.
- f1-visas-issued-fy2024 for Canada: left out, because most Canadian students never receive a visa.
- remittances-latest for Canada: left out (not a meaningful figure for this game).
- O-1 counts by nationality: not retrieved for any of the four.
- Family green card counts by category (for example spouses of citizens): not retrieved.
- Dominican border encounters: not itemised by CBP.
- Visa Bulletin dates are a law-firm transcription; travel.state.gov returned 403 all session. The State Department pages for Canadian visa exemption and the 75-country pause also returned 403.
- 75-country pause after October 2026: the government appealed to the Second Circuit (10 Sep 2026) and asked for a stay; the district court denied a stay on 25 Sep 2026 (search summary only, not opened). Whether the Second Circuit has ruled is UNVERIFIED.
- El Salvador TPS: no decision found as of 11 Nov 2026; a notice could be published at any time.
- The 23 Sep 2026 proclamation text was not read (site redirect); its scope is taken from its title.
- DV-2027 eligibility list not confirmed for any of the four (DV-2026 used).
- That Canadian students still need a Form I-20 and SEVIS fee, and that TN has no annual cap, are general knowledge and were not confirmed on a page opened this session, so they are not stated in the game files.
- Remittance primaries (Banguat, BCR, BCRD) were not opened; figures are as reported by press.
