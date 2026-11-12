# Country data notes: Europe (United Kingdom, Germany, Italy, Poland, Ukraine)

Written 2026-11-11 for `src/data/countries/{united-kingdom,germany,italy,poland,ukraine}.json`. One line per fact, entry note and mechanics value: source and confidence. All URLs were fetched on 2026-11-11 unless marked otherwise.

## Shared sources
- EOIR "Asylum Decisions by Nationality", FY2024, data of 10 Oct 2024: https://www.justice.gov/eoir/media/1344846/dl (PDF read; column order Withdrawn, Other, Not Adjudicated, Abandonment, Denials, Grants; checked against the Nigeria row already in the research). EOIR hides counts below four with an asterisk. CONFIRMED.
- DHS Visa Waiver Program country table with "VWP travel began" dates: https://www.dhs.gov/visa-waiver-program . CONFIRMED.
- Open Doors 2025 fact sheets (2024/25 census): https://opendoorsdata.org/wp-content/uploads/2026/01/OD_<Country>_Fact-Sheet-2025.pdf (PDFs read). CONFIRMED.
- F-1, H-1B, O-1 visas by nationality FY2018 to FY2025: https://visagrader.com/visa-approvals-and-refusals/<F1|H1B|O1>/<slug> (State Department data republished; nationality table, not the consulate table). LIKELY.
- Remittances received (BX.TRF.PWKR.CD.DT) and share of GDP (BX.TRF.PWKR.DT.GD.ZS): https://api.worldbank.org/v2/country/<ISO3>/indicator/BX.TRF.PWKR.CD.DT?format=json&date=2022:2025 , last updated 2026-11-11. CONFIRMED.
- November 2026 visa bulletin, Rest of World final action dates (F1 22JAN21, F3 22OCT15, F4 22OCT12, EB-1 current, EB-2 01APR25, EB-3 15JUN24); separately listed countries are China, India, Mexico, Philippines: https://www.gozellaw.com/blog/november-2026-visa-bulletin (law firm transcription; travel.state.gov returns 403). LIKELY.
- Proclamation of December 2025 (effective 1 Jan 2026), full and partial lists: https://www.whitehouse.gov/presidential-actions/2025/12/restricting-and-limiting-the-entry-of-foreign-nationals-to-protect-the-security-of-the-united-states/ . No European country appears. CONFIRMED. Hence `arrivalLimits: []` for all five.
- 75-country immigrant visa pause of 21 Jan 2026, full list: https://www.mintz.com/insights-center/viewpoints/2806/2026-01-29-state-department-suspends-immigrant-visa-processing-75 . None of the five is listed (Russia, Belarus, Moldova are; Ukraine is not). LIKELY.
- Diversity Visa history: https://en.wikipedia.org/wiki/Diversity_Immigrant_Visa . LIKELY.
- time-difference: Python zoneinfo on this machine (Europe/London, Europe/Berlin, Europe/Rome, Europe/Warsaw, Europe/Kyiv against America/New_York and America/Los_Angeles, checked for January, 20 March, July and 28 October 2026); https://www.iana.org/time-zones . CONFIRMED.
- flight-roundtrip: design estimates, UNVERIFIED, estimate true. No fare source was retrieved. The `source` field copies the models' https://www.bts.gov placeholder, which returned 403 here.
- ebQueue "row" for all five: none is listed separately in the bulletin (gozellaw above). LIKELY.
- "CBP does not report X separately": research/unauthorized-entry.md 1.5 (CBP itemises only 21 citizenships; Ukraine is one of them, the UK, Germany, Italy and Poland are not). CONFIRMED there, not re-fetched.
- "Has few ways to fix status" after a Visa Waiver overstay: research/visa-catalog.md VWP section (no extension, no change of status), marked UNVERIFIED there. LIKELY at best; worded without numbers.

## United Kingdom
- time-difference 5 h Eastern / 8 h Pacific (4 / 7 in the mismatch weeks): CONFIRMED.
- flight-roundtrip $750: UNVERIFIED design estimate.
- students-in-us-latest 11,136 (2023/24: 10,473; rank 17; UG 5,596; grad 2,694): Open Doors fact sheet. CONFIRMED.
- remittances-latest $4.83B 2024, $5.36B 2025: World Bank API (GBR). CONFIRMED.
- asylum-context: grants *, denials *, not adjudicated 9: EOIR. CONFIRMED. asylumGrantPct null.
- family-backlog: Rest of World dates. LIKELY.
- visa-waiver: travel began 1 July 1988; British citizens with unrestricted right of abode only: DHS. CONFIRMED. visaWaiver true.
- diversity-visa and FAM note: UK (except Northern Ireland) ineligible from the first lottery; wrongly left out of DV-2025 and DV-2026 and selected after a lawsuit (Wikipedia, LIKELY). State notice of 8 Aug 2025 asking UK entrants to recheck DV-2025 results, Northern Ireland a separate chargeability area: https://assets.aila.org/files/b995e3ca-d4e1-4a6e-9367-261457adcbbf/25080806.pdf (PDF read, CONFIRMED for that notice).
- Entry notes: F1 Open Doors; H1B bulletin (LIKELY); B2 DHS; O1 neutral (no count); FAM as above; EWI and ASY as shared.

## Germany
- time-difference 6 / 9 (5 / 8 in mismatch weeks): CONFIRMED.
- flight-roundtrip $850: UNVERIFIED.
- f1-visas-issued-fy2024 5,879 (FY23 5,874; FY25 5,535): visagrader F1/germany-deu. LIKELY.
- students-in-us-latest 9,123 (9,230 prior; rank 21; non-degree 2,433 = 26.7%): Open Doors. CONFIRMED.
- remittances-latest $22.17B 2024, $23.90B 2025: World Bank (DEU). CONFIRMED.
- h1b-share-latest: counts 771 (FY24), 801 (FY25): visagrader H1B/germany-deu. LIKELY. Share not found.
- O1 note 725 (FY24), 814 (FY25): visagrader O1/germany-deu. LIKELY.
- asylum-context: grants 5, denials *, not adjudicated 6: EOIR. CONFIRMED. asylumGrantPct null because denials are suppressed.
- visa-waiver: 15 July 1989: DHS. CONFIRMED. DV eligible: Wikipedia (not on the DV-2026 ineligible list; visas issued every year). LIKELY.

## Italy
- time-difference 6 / 9: CONFIRMED. flight-roundtrip $900: UNVERIFIED.
- f1-visas-issued-fy2024 6,535 (FY18 3,702; FY25 6,009): visagrader F1/italy-ita. LIKELY.
- students-in-us-latest 6,744 (6,545 prior; rank 24; UG 2,453; grad 2,404): Open Doors. CONFIRMED.
- remittances-latest $12.14B 2024, $12.84B 2025: World Bank (ITA). CONFIRMED.
- h1b-share-latest 799 (FY24), 920 (FY25); O1 694 (FY24), 745 (FY25): visagrader. LIKELY.
- asylum-context: grants *, denials *, not adjudicated 9: EOIR. CONFIRMED. asylumGrantPct null.
- visa-waiver: 29 July 1989: DHS. CONFIRMED. DV eligible: Wikipedia. LIKELY.

## Poland
- time-difference 6 / 9: CONFIRMED. flight-roundtrip $950: UNVERIFIED.
- f1-visas-issued-fy2024 759 (FY23 770; FY25 761): visagrader F1/poland-pol. LIKELY.
- students-in-us-latest 1,809 (1,661 prior; rank 59; UG 936): Open Doors. CONFIRMED.
- remittances-latest $8.69B 2024 (0.95% of GDP), $9.46B 2025: World Bank (POL). CONFIRMED.
- h1b-share-latest 195 (FY24), 201 (FY25); O1 126 (FY24), 153 (FY25): visagrader. LIKELY.
- asylum-context: grants *, denials *, not adjudicated 26, withdrawn 22: EOIR. CONFIRMED. asylumGrantPct null.
- visa-waiver: Poland joined on 11 November 2019: DHS. CONFIRMED. Before that a B visa was required.
- FAM note, "ineligible list for some earlier years": Wikipedia says Poland was added to and later removed from the DV ineligible list; the table reading (FY1998 to 2001 and FY2007 to 2012) is the fetch tool's reading, so years are kept out of the game text. LIKELY.

## Ukraine
- time-difference 7 / 10 (6 / 9 in mismatch weeks), zone Europe/Kyiv: CONFIRMED.
- flight-roundtrip $1,300: UNVERIFIED design estimate. Airspace closed to civil flights since February 2022 and still closed: https://www.airlineratings.com/articles/after-four-years-ukraine-is-preparing-to-reopen-its-airspace (27 Mar 2026) plus search results to July 2026. LIKELY. Board line shows a Warsaw connection for that reason (design).
- f1-visas-issued-fy2024 810 (FY22 1,327; FY25 826): visagrader F1/ukraine-ukr. LIKELY.
- students-in-us-latest 2,346 (2,183 prior; rank 53; UG 1,379): Open Doors. CONFIRMED.
- remittances-latest $12.0B 2024 (6.29% of GDP), $16.78B 2022, $9.88B 2025: World Bank (UKR). CONFIRMED.
- h1b-share-latest 132 (FY24), 150 (FY25), 242 (FY18); O1 95 (FY24), 118 (FY25): visagrader. LIKELY.
- asylum-context and asylumGrantPct 82: grants 179, denials 38, abandonment 18, not adjudicated 382, withdrawn 19; 179 / 217 = 82.5%, stored as 82: EOIR. CONFIRMED (ratio is my arithmetic).
- tps-status: designated 19 Apr 2022, current designation 20 Oct 2023, continuous residence since 16 Aug 2023, designated through 19 Oct 2026; page (updated 19 Oct 2026) says "An announcement on Ukraine's TPS will be made at the appropriate time" and protection continues until then: https://www.uscis.gov/humanitarian/temporary-protected-status/temporary-protected-status-designated-country-ukraine . CONFIRMED. Automatic six-month extension to 19 Apr 2027 under 8 USC 1254a(b)(3)(C) is the advocates' reading, with no Federal Register notice as of 26 Oct 2026: https://ukrainetaskforce.org/ukraine-s-tps-is-theoretically-extended-for-6-months-but-dhs-has-yet-to-publish-updates-or-implement-extension/ . LIKELY.
- u4u-parole: opened April 2022, almost 240,000 paroled 2022 to 2024, suspended January 2025: https://ukrainetaskforce.org/wp-content/uploads/2026/05/U4U-Four-Year-Retrospective.pdf (PDF read). LIKELY. I-134A intake paused 28 Jan 2025: https://www.uscis.gov/ukraine (CONFIRMED). Re-parole processing resumed August 2025 with a fee: https://welcome.us/explainers/uniting-for-ukraine-paused (updated 9 Apr 2026). LIKELY.
- visaWaiver false: Ukraine is not in the DHS table. CONFIRMED.
- FAM note: Rest of World (LIKELY), DV eligible (Wikipedia, LIKELY), absent from the proclamation (CONFIRMED) and the 75-country list (LIKELY).
- EWI note: Ukraine is itemised by CBP (research/unauthorized-entry.md 1.5, CONFIRMED there); "usually blocks a green card from inside the US" reuses research/country-mexico.md 2 (LIKELY). No count is given.
- familySupportFactor 0.8 (designed): World Bank remittance inflow share of GDP (CONFIRMED) and "over 10 million displaced in the first few months" from the U4U retrospective (LIKELY). The other four countries stay at 1.0 for lack of a sourced reason.

## Culture (all five)
Names, skin tones, dishes, festivals, family calls and flight codes are design content, not research facts. Festival months: Bonfire Night 3, Christmas 4, Pancake Day 6; Unity Day 2, Advent 4, Easter 8; Ferragosto 0, Christmas 4, Easter 8; All Saints 3, Wigilia 4, Easter 8; Independence Day 0, Christmas 4, Easter 8. Moving dates are written as "this year". Ukraine's Christmas scene is written around Holy Evening without a date, because families keep 24 December or 6 January. Culture scenes avoid the war so they hold for any arrival year; only the travel note and flight fact mention the post-2022 overland start.

## Gaps
- UK: no F-1, H-1B or O-1 count by nationality (visagrader has no UK nationality table; travel.state.gov returns 403). `f1-visas-issued-fy2024` and `h1b-share-latest` left out.
- H-1B share of approvals by country: not found for any of the five; counts of visas issued used instead.
- Asylum grant rate: not computable for the UK, Germany, Italy and Poland (EOIR suppression). Other fiscal years not retrieved.
- DV-2027: whether the UK is on the ineligible list, and whether registration opened in November 2026, not confirmed (secondary sources conflict; dvprogram.state.gov and travel.state.gov return 403). Official per-year DV lists not read for any of the five.
- Ukraine TPS after 19 October 2026: no Federal Register notice found; outcome open. Recheck before release.
- Uniting for Ukraine: current re-parole procedure and fee amount conflict across sources ($1,000 and $1,020 both reported); the game text gives no amount.
- Visa bulletin dates are a law firm transcription, not the State Department page.
- Visa Waiver overstay consequences and the ESTA fee were not read on a primary page; ESTA fee is not stated in the game text.
- Proclamation 10949 (June 2025) was not re-read; the December 2025 proclamation carries its list forward and names no European country.
- No sourced air fares; no sourced figure on family support levels.
- Whether any US consulate in Ukraine issues visas today was not checked; the B2 note says only that a visa is required.
