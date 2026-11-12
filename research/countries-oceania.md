# Country data notes: Oceania (Australia, New Zealand, Fiji, Tonga, Samoa)

Written 2026-11-11 for `src/data/countries/{australia,new-zealand,fiji,tonga,samoa}.json`. Samoa is the independent State of Samoa (WSM), not American Samoa. CONFIRMED = primary source opened this session; LIKELY = secondary; UNVERIFIED = design estimate.

## Shared sources
- TZ: IANA tz database (release 2026f per https://www.iana.org/time-zones), offsets computed with Python zoneinfo on this machine. CONFIRMED.
- EOIR: Asylum Decisions by Nationality, FY2024, https://www.justice.gov/eoir/media/1344846/dl (PDF read page by page). CONFIRMED.
- PROC: Proclamation 10998 text, https://www.whitehouse.gov/presidential-actions/2025/12/restricting-and-limiting-the-entry-of-foreign-nationals-to-protect-the-security-of-the-united-states/ . CONFIRMED.
- VWP: https://www.dhs.gov/visa-waiver-program (42 countries; Australia and New Zealand listed; Fiji, Tonga, Samoa not listed). CONFIRMED.
- OD: Open Doors 2025 country fact sheets, https://opendoorsdata.org/wp-content/uploads/2026/01/OD_<Country>_Fact-Sheet-2025.pdf (Australia, New-Zealand, Fiji, Tonga, Samoa; each PDF read). CONFIRMED.
- VG: State Department visa issuances by nationality republished by VisaGrader, https://visagrader.com/visa-approvals-and-refusals/<class>/<country> . LIKELY.
- WB: World Bank API, BX.TRF.PWKR.CD.DT and BX.TRF.PWKR.DT.GD.ZS, https://api.worldbank.org/v2/country/TON;WSM;FJI/indicator/BX.TRF.PWKR.CD.DT?format=json&mrv=4 . CONFIRMED.
- VB: November 2026 visa bulletin final action dates, reused from rules-verification.md section 14 (https://www.gozellaw.com/blog/november-2026-visa-bulletin , not re-fetched). LIKELY.
- DV: DV-2026 excluded list and DV visas issued by country, https://en.wikipedia.org/wiki/Diversity_Immigrant_Visa . LIKELY.
- CBP: public encounters file itemises 21 citizenships only, none in Oceania; reused from unauthorized-entry.md 1.5 (https://www.cbp.gov/sites/default/files/2026-10/nationwide-encounters-fy23-fy26-sep-aor.csv , not re-fetched). CONFIRMED there.
- flight-roundtrip (all five): design estimates, UNVERIFIED, estimate true. `source` copies the models' placeholder https://www.bts.gov , which returned 403 this session and holds no fare for these countries.
- family-backlog (all five): all charged to Rest of World; F1 22JAN21, F3 22OCT15, F4 22OCT12. VB, LIKELY. `ebQueue` = row for all five.

## Australia
- time-difference: Australia/Sydney UTC+10 / +11 (DST Oct to Apr); +16 ET in US winter, +14 in US summer, +15 for a few weeks between the two changeovers. TZ, CONFIRMED.
- f1-visas-issued-fy2024: 2,075 (FY2025 1,976; FY2018 2,326). VG F1/australia-aus, LIKELY.
- students-in-us-latest: 4,620 in 2024/25 (4,432 prior), rank 31. OD, CONFIRMED.
- h1b-share-latest: E-3 3,931 FY2024 / 3,752 FY2025; H-1B 511 / 489. VG E3 and H1B /australia-aus, LIKELY. H-1B share not found.
- asylum-context: row present, every column suppressed (under four). EOIR, CONFIRMED. asylumGrantPct null.
- Entry notes: F1 OD + VG. H1B: E-3 is for Australian nationals only, up to 2 years, renewable without a maximum (https://www.uscis.gov/working-in-the-united-states/temporary-workers/e-3-specialty-occupation-workers-from-australia , CONFIRMED); counts VG, LIKELY. B2: VWP, CONFIRMED. O1: 665 FY2024, VG O1/australia-aus, LIKELY. FAM: DV eligible, 158 DV visas FY2024, DV, LIKELY. EWI: CBP; "overstaying a waiver visit is the usual way" is LIKELY reasoning, no count. ASY: EOIR.
- mechanics: visaWaiver true (VWP); arrivalLimits empty (Australia absent from PROC, CONFIRMED).
- familySupportFactor 1.0: no sourced reason to move it.

## New Zealand
- time-difference: Pacific/Auckland UTC+12 / +13; +18 ET in US winter, +16 in US summer. TZ, CONFIRMED.
- f1-visas-issued-fy2024: 661 (FY2025 598; FY2018 681). VG F1/new-zealand-nzl, LIKELY.
- students-in-us-latest: 1,781 in 2024/25 (1,696 prior), rank 62. OD, CONFIRMED. (A search summary gave 3,038; that is the US study abroad column for 2023/24, not students in the US.)
- h1b-share-latest: 166 FY2024, 169 FY2025, 183 FY2018. VG H1B/new-zealand-nzl, LIKELY.
- Entry notes: B2 VWP, CONFIRMED. H1B: E-3 limited to Australians (USCIS, CONFIRMED). FAM: DV eligible, 37 DV visas FY2024, DV, LIKELY. O1: neutral sentence, no count fetched. ASY: New Zealand has no row in EOIR, CONFIRMED.
- mechanics: visaWaiver true; asylumGrantPct null (no row); arrivalLimits empty.

## Fiji
- time-difference: Pacific/Fiji UTC+12, no DST in the current rules; +17 ET winter, +16 summer. TZ, CONFIRMED.
- f1-visas-issued-fy2024: 23 (FY2025 19; FY2023 42). VG F1/fiji-fji, LIKELY.
- students-in-us-latest: 165 in 2024/25 (156 prior), rank 158; top states Hawaii, Utah, California. OD, CONFIRMED.
- remittances-latest: $424.2M in 2024, 7.1% of GDP; $479.4M in 2023. No 2025 value yet. WB, CONFIRMED.
- h1b-share-latest: 3 FY2024, 2 FY2025. VG H1B/fiji-fji, LIKELY.
- asylum-context: grants and denials suppressed (under four each), 12 not adjudicated. EOIR, CONFIRMED. asylumGrantPct null.
- Entry notes: B2 visa bond: Fiji added to the B-1/B-2 visa bond pilot effective 21 Jan 2026 (https://www.bu.edu/isso/2026/01/05/b-1-visa-bond-pilot-program-expanded/ , LIKELY); a rule making the bond programme permanent, $10,000 to $20,000, was reported 3 Aug 2026 (https://www.fijitimes.com.fj/fiji-among-countries-facing-new-permanent-us-visa-bond-requirement/ , LIKELY, single source; amounts kept out of the game text). FAM: 869 DV visas FY2024, DV, LIKELY; 75-country immigrant visa issuance pause from 21 Jan 2026 included Fiji (https://www.rnz.co.nz/international/pacific-news/584306/bonds-blockings-and-bans-a-massive-new-year-shakeup-to-pacific-us-travel , LIKELY) and was vacated in CLINIC v. Rubio, with State saying on 28 Aug 2026 it is no longer in effect (https://manifestlaw.com/news/state-dept-ends-75-country-pause-08-31-2026 , LIKELY).
- mechanics: visaWaiver false. arrivalLimits EMPTY on purpose: Fiji is not in PROC (CONFIRMED). The 75-country pause blocked immigrant visas (FAM) for about seven months of 2026 but was not a proclamation or rule, was set aside by a court, and the schema has no end year, so adding it would block FAM forever. If the game wants it: `{from: 2026, routes: ["FAM"]}`, LIKELY, ended Aug 2026.
- familySupportFactor 1.0: remittances are 7.1% of GDP, not judged a strong enough sourced reason to move it.

## Tonga
- time-difference: Pacific/Tongatapu UTC+13, no DST in the current rules; +18 ET winter, +17 summer. TZ, CONFIRMED.
- f1-visas-issued-fy2024: 10 (FY2025 6; FY2022 17). VG F1/tonga-ton, LIKELY.
- students-in-us-latest: 195 in 2024/25 (185 prior), rank 153; 92.3% undergraduate; top states Hawaii, Utah. OD, CONFIRMED.
- remittances-latest: $267.1M in 2025, 39.3% of GDP; $255.2M and 39.4% in 2024. WB, CONFIRMED.
- Entry notes F1, B2, FAM, H1B, O1 and arrivalLimits: PROC Sec. 5(m) suspends entry of Tongan nationals as immigrants and on B-1, B-2, B-1/B-2, F, M and J visas from 12:01 a.m. EST 1 Jan 2026; other nonimmigrant visas get reduced validity; cites B-1/B-2 overstay 6.45% and F/M/J overstay 14.44%. Applies to people outside the US without a valid visa on that date. CONFIRMED. Searches found no later amendment, removal or escalation for Tonga up to 2026-11-11; "still in force today" is therefore LIKELY, not confirmed (travel.state.gov returned 403). Tonga is also on the B visa bond list from 21 Jan 2026 (bu.edu link above, LIKELY), moot while B visas are suspended.
- FAM: 65 DV visas FY2024, DV, LIKELY. EWI: CBP + PROC overstay rates. ASY: no Tonga row in EOIR, CONFIRMED.
- mechanics: visaWaiver false; asylumGrantPct null; arrivalLimits from 2026, routes F1, B2, FAM, source PROC, CONFIRMED.
- familySupportFactor 0.8 (designed): remittances about 39% of GDP (WB, CONFIRMED), so money usually flows toward home.

## Samoa
- time-difference: Pacific/Apia UTC+13, no DST in the current rules; +18 ET winter, +17 summer. TZ, CONFIRMED.
- f1-visas-issued-fy2024: 4 (FY2025 6). VG F1/samoa-wsm (page confirmed as independent Samoa, post Apia), LIKELY.
- students-in-us-latest: 75 in 2024/25 (76 prior), rank 174; top state Hawaii. OD, CONFIRMED.
- remittances-latest: $288.1M in 2025, 22.4% of GDP; $282.3M in 2024. WB, CONFIRMED.
- Entry notes: B2: not in VWP, CONFIRMED. FAM: DV eligible; 0 DV visas FY2024, 4 FY2023, DV, LIKELY. ASY: no Samoa or Western Samoa row in EOIR, CONFIRMED. H1B, O1: neutral sentences, no counts fetched.
- mechanics: visaWaiver false; asylumGrantPct null; arrivalLimits empty. Samoa is absent from PROC (CONFIRMED) and from the visa bond and 75-country lists in the secondary sources read (LIKELY).
- familySupportFactor 0.85 (designed): remittances about 22% of GDP (WB, CONFIRMED).

## Culture (design content, for the community reviewer)
- Names: Australia and New Zealand mix common English names with names from Aboriginal (Kirra, Jarrah), Māori, Pasifika and migrant communities. Fiji lists iTaukei and Indo-Fijian names (including one Muslim Indo-Fijian name each). Tonga and Samoa use common given names; glottal stops are written with a plain apostrophe.
- Festivals: Australia grand final weekend (month 1), Christmas (4), Anzac Day (8); Australia Day left out on purpose. New Zealand Christmas (4), Waitangi Day (6), Matariki (10, moves, "this year"). Fiji: Fiji Day 10 Oct (2), Diwali (3, moves, "this year"), Christmas (4). Tonga: Christmas and Uike Lotu (4), Fakamē first Sunday of May (9), Heilala Festival and the King's birthday holiday on 4 July (11). Samoa: White Sunday second Sunday of October (2), Christmas (4), Independence Day 1 June (10). None of these dates or customs were fetched from a source; please check Tonga's 4 July holiday and Uike Lotu wording in review.
- Airport board flight codes are decorative. Tonga and Samoa have no nonstop US flights (homeTravelNote says so); this was not sourced.

## Gaps
- travel.state.gov returned 403 all session: visa bond country list, the 75-country pause notice and the current proclamation page were not read from the primary source.
- Whether Proclamation 10998 has been amended since 1 January 2026 (any review, Tonga moved or removed): nothing found; not confirmed from a primary page.
- Visa bond programme status after the pilot's 5 Aug 2026 end date: one secondary report of a permanent rule; not confirmed.
- CLINIC v. Rubio: ruling date (21 Aug 2026 in search summaries) and any stay pending appeal not confirmed; cliniclegal.org returned 403.
- asylumGrantPct: null for all five. No TRAC figures fetched.
- remittances-latest for Australia and New Zealand: left out (not fetched; minor for these countries).
- h1b-share-latest for Tonga and Samoa: left out (not fetched). H-1B share of approvals not found for any of the five.
- O-1 counts for New Zealand, Fiji, Tonga, Samoa: not fetched; neutral sentences used.
- E-3 annual cap of 10,500: seen only on Wikipedia (the USCIS page does not state it); kept out of the game text.
- Overstay rates for Fiji and Samoa (DHS Entry/Exit report): not fetched.
- Flight prices: all five are design estimates with no source.
- Diversity Visa eligibility is from Wikipedia's DV-2026 list; DV-2027 not confirmed.
