# Country data notes: South America (Brazil, Colombia, Venezuela, Peru, Ecuador)

Written 2026-11-11 for `src/data/countries/{brazil,colombia,venezuela,peru,ecuador}.json`. Every URL below was opened this session unless marked otherwise. CONFIRMED = primary or official source opened; LIKELY = reputable secondary; UNVERIFIED = design estimate.

## Shared sources (all five)

- time-difference: Python `zoneinfo` on this machine. America/Sao_Paulo UTC-3, America/Caracas UTC-4, America/Bogota, America/Lima and America/Guayaquil UTC-5; none uses DST. Offsets to New York / Chicago / Los Angeles computed for January and July 2026. CONFIRMED. https://www.iana.org/time-zones
- flight-roundtrip and roundTripFlightUsd: design estimates (Brazil 1,100; Colombia 550; Venezuela 900; Peru 750; Ecuador 650). UNVERIFIED, estimate true. No fare source opened.
- asylum-context, ASY note, asylumGrantPct, asylumNote: EOIR "Asylum Decisions by Nationality", FY2024, data generated 2024-10-10, PDF read page by page. CONFIRMED. https://www.justice.gov/eoir/media/1344846/dl
  - Brazil 548 grants / 2,331 denials / 5,234 not adjudicated = 19.0%
  - Colombia 1,017 / 4,369 / 2,627 = 18.9%
  - Venezuela 2,656 / 1,430 / 20,134 = 65.0%
  - Peru 611 / 2,424 / 1,562 = 20.1%
  - Ecuador 657 / 2,774 / 3,683 = 19.1%
- border-encounters fact and EWI note: CBP public encounters file, downloaded and summed locally (Component = U.S. Border Patrol, Land Border Region = Southwest Land Border, by Citizenship and Fiscal Year). CONFIRMED, derived. https://www.cbp.gov/sites/default/files/2026-10/nationwide-encounters-fy23-fy26-sep-aor.csv
  - FY2023 / FY2024 / FY2025 / FY2026: Brazil 21,632 / 26,192 / 3,019 / 476; Colombia 154,077 / 111,992 / 12,476 / 1,514; Venezuela 200,668 / 134,329 / 9,660 / 1,593; Peru 74,665 / 33,974 / 2,143 / 427; Ecuador 113,813 / 116,144 / 7,757 / 2,446.
  - Nationwide totals including ports of entry, not used in the game files: Venezuela 334,914 / 313,496 / 66,944 / 4,945; Colombia 167,388 / 134,676 / 24,609 / 7,223.
  - The second half of each EWI note ("usually blocks a green card from inside the US later") reuses the Mexico model line (country-mexico.md 2, LIKELY). No methods or routes are described anywhere.
- family-backlog, ebQueue "row", H1B and FAM notes on the queue: November 2026 Visa Bulletin as transcribed by a law firm; separate columns exist only for China, India, Mexico and the Philippines. All Chargeability F1 22JAN21, F3 22OCT15, F4 22OCT12; EB-1 Current, EB-2 01APR25, EB-3 15JUN24. LIKELY (travel.state.gov returned 403). https://www.gozellaw.com/blog/november-2026-visa-bulletin . The 14-year wait is arithmetic on the F4 date.
- visaWaiver false and B2 notes: DHS Visa Waiver Program page lists 42 countries; Chile is the only Latin American one. CONFIRMED. https://www.dhs.gov/visa-waiver-program
- students-in-us-latest and F1 notes: Open Doors 2025 country fact sheets (PDFs read). CONFIRMED. `https://opendoorsdata.org/wp-content/uploads/2026/01/OD_<Country>_Fact-Sheet-2025.pdf`
  - Brazil 17,277 (16,877 prior), rank 10. Colombia 10,213 (10,120), rank 18. Venezuela 3,886 (3,904; 8,371 in 2017/18), rank 36. Peru 5,667 (5,505), rank 25. Ecuador 3,282 (3,256), rank 42.
  - "Record" for Colombia and Peru: highest value in the 2017/18 to 2024/25 table on the sheet, and reported as records in Open Doors 2025 coverage (search summary only, LIKELY).
- f1-visas-issued-fy2024, h1b-share-latest, O1 notes: State Department issuance data by nationality republished by VisaGrader. LIKELY. `https://visagrader.com/visa-approvals-and-refusals/<F1|H1B|O1>/<slug>` with slugs brazil-bra, colombia-col, peru-per, ecuador-ecu.
  - F-1 FY2022 / FY2023 / FY2024 / FY2025: Brazil 9,823 / 8,328 / 7,434 / 7,201; Colombia 7,047 / 4,353 / 3,958 / 3,483; Peru 2,653 / 2,469 / 2,519 / 2,087; Ecuador 1,900 / 2,009 / 2,014 / 1,633.
  - H-1B FY2018 / FY2024 / FY2025: Brazil 1,119 / 1,802 / 1,899; Colombia 547 / 960 / 1,010; Peru 213 / 336 / 356; Ecuador 130 / 299 / 302. These are counts, not shares; the share of all approvals was not found.
  - O-1 FY2018 / FY2024: Brazil 1,497 / 1,671; Colombia 188 / 374; Peru 27 / 93; Ecuador 24 / 60.
- Diversity Visa (FAM notes): DV-2026 ineligible list includes Brazil, Colombia and Venezuela; Peru and Ecuador are not on it (both were excluded in earlier years, roughly 2008 to 2020 for Peru and 2009 to 2017 for Ecuador, read approximately from the table). LIKELY, secondary; the State Department instructions returned 403. https://en.wikipedia.org/wiki/Diversity_Immigrant_Visa
- familySupportFactor 1.0 for all five: designed; no sourced reason to move it.
- Names, skin tones, dishes, festivals and family calls are design content, not research facts.

## Brazil

- Language written as Portuguese. Departure city São Paulo.
- FAM note and the 75-country immigrant visa pause: Brazil is on the list; issuance paused from 2026-01-21 (LIKELY, https://www.mintz.com/insights-center/viewpoints/2806/2026-01-29-state-department-suspends-immigrant-visa-processing-75 ). Vacated by S.D.N.Y. in CLINIC v. Rubio, ruling of about 2026-08-21 (LIKELY, https://www.fragomen.com/insights/united-states-federal-district-court-vacates-state-departments-75-country-immigrant-visa-ban.html ); State told the court on 2026-08-28 the pause "is no longer in effect" (LIKELY, https://manifestlaw.com/blog/state-dept-ends-75-country-pause-08-31-2026 ).
- arrivalLimits empty: Brazil is in neither proclamation (10998 text checked, CONFIRMED, https://www.whitehouse.gov/presidential-actions/2025/12/restricting-and-limiting-the-entry-of-foreign-nationals-to-protect-the-security-of-the-united-states/ ). The 75-country pause was a State Department policy, not a proclamation, covered about seven months of 2026 and has ended, so it is described in the FAM note only. If the game should block FAM arrivals for 2026 alone, the engine would need a "to" year.
- Festivals: Natal and Réveillon (month 4), Carnaval (month 6, "this year"), Festa Junina (month 10).

## Colombia

- remittances-latest: US$13,098 million in 2025, +10.6% on US$11,848 million in 2024, Banco de la República as reported. LIKELY. https://www.valoraanalitik.com/remesas-a-colombia-lograron-nuevo-record-historico-en-2025-superaron-los-us13-000-millones/
- FAM note and arrivalLimits: same 75-country pause as Brazil (Colombia is on the list, same three sources, LIKELY). arrivalLimits empty for the same reasons.
- Festivals: Amor y Amistad (month 1), Día de las Velitas on 7 December (month 4), Independence Day 20 July (month 11).

## Venezuela

- travel-proclamation fact, F1, H1B, B2, O1 and FAM notes, arrivalLimits:
  - Proclamation 10949, Sec. 3(g): entry suspended for Venezuelans as immigrants and on B-1, B-2, B-1/B-2, F, M and J visas; validity of other nonimmigrant visas to be reduced; effective 12:01 a.m. EDT 9 June 2025; applies to people outside the US without a valid visa on that date; exceptions then included immediate relative immigrant visas (IR-1/CR-1, IR-2/CR-2, IR-5). CONFIRMED. https://www.whitehouse.gov/presidential-actions/2025/06/restricting-the-entry-of-foreign-nationals-to-protect-the-united-states-from-foreign-terrorists-and-other-national-security-and-public-safety-threats/
  - Proclamation of December 2025 (10998), Sec. 3: Venezuela's partial suspension continued; effective 1 January 2026; family immigrant visas are no longer a categorical exception (Sec. 6(b) list has no immediate relative item). CONFIRMED. https://www.whitehouse.gov/presidential-actions/2025/12/restricting-and-limiting-the-entry-of-foreign-nationals-to-protect-the-security-of-the-united-states/
  - arrivalLimits entry 1: from 2025, F1 and B2. The suspension covered 9 June to 31 December 2025 (206 of 365 days, and the whole autumn intake), so 2025 is the first year blocked for most of the year. CONFIRMED.
  - arrivalLimits entry 2: from 2026, FAM. In 2025 spouses, children and parents of citizens were still exempt; from 1 January 2026 they are not. Family preference categories were already blocked from June 2025; the game's FAM route is treated as blocked from 2026. CONFIRMED for the rule, the year choice is a design call.
  - H1B and O1 are not in the suspended classes (same text). CONFIRMED.
  - Later change: searches found no proclamation after December 2025 that altered Venezuela's status. LIKELY (absence of evidence; federalregister.gov and travel.state.gov were not reachable).
- tps-status fact and ASY note: 2023 designation terminated (90 FR 9040), Supreme Court allowed it to take effect 3 October 2025; 2021 designation terminated effective 7 November 2025 (90 FR 43225); court-preserved documents for one subset ended 2 October 2026. CONFIRMED (USCIS page, archived, last updated 2026-10-20). https://www.uscis.gov/humanitarian/temporary-protected-status/temporary-protected-status-designated-country-venezuela
- chnv-parole fact: termination notice dated 25 March 2025 and no new requests processed (CONFIRMED, https://www.uscis.gov/CHNV ); Supreme Court order of 30 May 2025 letting DHS revoke parole for more than 500,000 people (LIKELY, https://www.scotusblog.com/2025/05/supreme-court-allows-dhs-to-end-parole-for-a-half-million-noncitizens/ ).
- Asylum: 65% of decided cases, but 20,134 cases were not adjudicated against 4,086 decided, so the rate describes a minority of FY2024 completions. Noted in asylumNote.
- Venezuela is not on the 75-country immigrant visa pause list (mintz list).
- homeMoneyNote and homeTravelNote are written without numbers; no source was opened on flight links or on how families send money.
- Festivals: Navidad and hallacas (month 4), Carnaval (month 6, "this year"), Independence Day 5 July (month 11).

## Peru

- remittances-latest: US$5.368 billion in 2025, up US$434 million, United States the main source; BCRP as reported by Andina. LIKELY. https://andina.pe/Ingles/noticia-perus-bcr-foreign-remittances-reach-5368-billion-in-2025-up-117-1064733.aspx . The percentage is left out of the game text: Andina says +11.7%, La Cámara says +31.7% ( https://lacamara.pe/bcrp-remesas-del-exterior-crecen-317-a-us-5-368-millones-en-2025/ ), and the US$434 million increase implies about 8.8%.
- arrivalLimits empty: Peru is in neither proclamation and not on the 75-country list.
- Festivals: Señor de los Milagros, the purple month (month 2), Nochebuena (month 4), Fiestas Patrias 28 July (month 11).

## Ecuador

- remittances-latest: US$7,729 million in 2025, +18.2%; 77.8% (US$6,010 million) from the United States; Banco Central del Ecuador via EFE. LIKELY. https://www.portafolio.co/economia/ecuador-registro-en-2025-nuevo-record-en-remesas-recibidas-con-7-729-millones-de-dolares-491288
- homeMoneyNote says Ecuador uses the US dollar. General knowledge (dollarised since 2000); no source opened this session.
- arrivalLimits empty: Ecuador is in neither proclamation and not on the 75-country list.
- Departure city Quito; time zone America/Guayaquil covers mainland Ecuador.
- Festivals: Día de los Difuntos 2 November (month 3), Año Viejo 31 December (month 4), Carnaval (month 6, "this year").

## Gaps

- Venezuela `f1-visas-issued-fy2024` and `h1b-share-latest`: left out. VisaGrader has no nationality data for Venezuela (only consulate figures for FY2018 and FY2019). O-1 count also not found, so the O1 note is rule-based.
- Venezuela `remittances-latest`: left out. No official series; economists' estimates found in search range from about $2.8 billion to $4 billion and were not opened.
- Brazil `remittances-latest`: left out. Only a monthly Banco Central figure was opened (tradingeconomics); an annual 2025 total of about $4.76 billion appeared in a search summary but the page returned 429.
- H-1B share of approvals by nationality: not found for any of the five; counts of visas issued are used instead.
- Peru's 2025 remittance growth rate: sources disagree (see above).
- Diversity Visa lists: secondary only (Wikipedia). DV-2027 list not found; the Peru and Ecuador notes speak only of DV-2026.
- Visa Bulletin dates: law firm transcription only.
- Whether the government appealed the August 2026 vacatur of the 75-country pause, and whether Brazilian and Colombian immigrant visas are flowing normally in November 2026: not verified.
- Whether any proclamation after December 2025 changed Venezuela's status: nothing found, not confirmed on an official list.
- Whether direct flights between the US and Venezuela operate in 2026: not researched; the travel note says only that the trip often involves a connection.
- Flight prices for all five: design estimates.
- Festival, food and name choices have not had a community review.
