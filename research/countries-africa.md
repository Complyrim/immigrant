# Country data notes: Africa (Ghana, Ethiopia, Kenya, Egypt)

Written 2026-11-11 for `src/data/countries/{ghana,ethiopia,kenya,egypt}.json`. Nigeria is untouched. Every URL below was opened this session unless marked "not opened". CONFIRMED = primary or official source opened; LIKELY = reputable secondary; UNVERIFIED = design estimate.

## Shared findings (all four countries)

- Proclamation 10949 (June 2025, effective 9 June 2025): none of the four is on the full or partial list. Egypt appears only in Sec. 5(c), which orders a review of Egypt's screening practices; no restriction. CONFIRMED, https://www.whitehouse.gov/presidential-actions/2025/06/restricting-the-entry-of-foreign-nationals-to-protect-the-united-states-from-foreign-terrorists-and-other-national-security-and-public-safety-threats/
- Proclamation 10998 (signed 16 Dec 2025, effective 1 Jan 2026): none of the four appears anywhere in the text. CONFIRMED, https://www.whitehouse.gov/presidential-actions/2025/12/restricting-and-limiting-the-entry-of-foreign-nationals-to-protect-the-security-of-the-united-states/
- Later changes: no proclamation after December 2025 adding countries was found. NAFSA's tracker (dated 2 Feb 2026) and an extended web search to Oct 2026 show the same 39 countries. LIKELY (absence of evidence; travel.state.gov returns 403), https://www.nafsa.org/regulatory-information/proclamation-december-16-2025-travel-ban-effective-january-1-2026
- `arrivalLimits` is therefore an empty array for all four.
- 75-country immigrant visa issuance pause (State Department, from 21 Jan 2026): Ghana, Ethiopia and Egypt are on the list; Kenya is not. LIKELY, https://www.mintz.com/insights-center/viewpoints/2806/2026-01-29-state-department-suspends-immigrant-visa-processing-75 . Vacated by S.D.N.Y. on 21 Aug 2026 in CLINIC v. Rubio (LIKELY, https://www.fredlaw.com/alert-federal-district-court-strikes-down-suspension-of-immigrant-visas-for-nationals-of-75-countries ); State said on 28 Aug 2026 it is no longer in effect and ran a short worldwide interview pause to 31 Aug (LIKELY, https://manifestlaw.com/blog/state-dept-ends-75-country-pause-08-31-2026 ). Government appeal and a 14 Sep 2026 stay request are reported from search snippets only (not opened). NOT put in `arrivalLimits`: it is a department policy, not a proclamation or rule, it was set aside, and the schema has no end year. It is described in the FAM entry notes and `family-backlog` text instead. See Gaps.
- Diversity Visa: Nigeria was the only African country on the DV-2026 ineligible list, so all four were eligible through DV-2026. LIKELY, https://en.wikipedia.org/wiki/Diversity_Immigrant_Visa and https://headmanlaw.com/insights/nigerian-diversity-visa-dv-lottery-2027/ . DV-2027 registration had not opened as of 3 Nov 2026 (Ninth Circuit stayed the order to open it on 29 Oct 2026), so no DV-2027 country list exists (LIKELY, headmanlaw). Wikipedia also reports a December 2025 suspension of DV issuance that a court cancelled in August 2026 (LIKELY). 2024 DV visas issued: Egypt 2,627, Ethiopia 1,373, Ghana 576, Kenya 2,651 (LIKELY, Wikipedia; not used in the JSON).
- ebQueue `row` for all four: none is separately listed in the Visa Bulletin. `family-backlog` dates F1 22JAN21, F3 22OCT15, F4 22OCT12 from https://www.gozellaw.com/blog/november-2026-visa-bulletin (LIKELY, law firm transcription; matches rules-verification.md 14). The value 14 years is arithmetic on the F4 date.
- visaWaiver false for all four: none is a Visa Waiver Program country (background knowledge, DHS list not opened).
- asylum-context and asylumGrantPct: EOIR "Asylum Decisions by Nationality", FY2024, data generated 10 Oct 2024, https://www.justice.gov/eoir/media/1344846/dl , CONFIRMED (PDF downloaded and read with layout extraction). Rate = grants / (grants + denials), my arithmetic.
- time-difference: IANA tz database via Python zoneinfo on this machine, CONFIRMED. Source field https://www.iana.org/time-zones .
- flight-roundtrip: design estimates, UNVERIFIED, estimate true. The source field copies the models' placeholder https://www.bts.gov (not opened; it does not support the number).
- f1-visas-issued-fy2024, h1b-share-latest, O-1 counts: State Department nationality data republished by visagrader.com, LIKELY. H-1B share of all approvals not found for any country; counts used, as in the Nigeria model.
- students-in-us-latest: Open Doors 2025 country fact sheets (PDF opened and text extracted), CONFIRMED.
- EWI notes for Ghana, Kenya, Egypt: neutral sentence from unauthorized-entry.md 5.2 (INA 245(a) needs admission or parole), LIKELY. No nationality border data was looked up.
- Culture (names, skin tones, dishes, festivals, family calls) is design content, not research facts.

## Ghana

- time-difference: Africa/Accra UTC+0, no DST; ET +5 winter / +4 summer, PT +8 / +7. CONFIRMED.
- flight-roundtrip $1,500: UNVERIFIED design estimate.
- f1-visas-issued-fy2024: 5,203 (FY22 3,343; FY25 2,692). https://visagrader.com/visa-approvals-and-refusals/F1/ghana-gha LIKELY.
- students-in-us-latest: 12,825 in 2024/25 (9,394 in 2023/24), rank 14, graduate 66.4%. https://opendoorsdata.org/wp-content/uploads/2026/01/OD_Ghana_Fact-Sheet-2025.pdf CONFIRMED.
- remittances-latest: about $7.8B by end of 2025, $4.6B in 2024, statement by the Bank of Ghana governor. https://www.myjoyonline.com/ghana-records-7-8bn-remittances-as-bog-pushes-diaspora-funds-into-investment-drive/ LIKELY, low end: the World Bank series is far lower (about $2.9B for 2024, search snippet only).
- h1b-share-latest: 499 FY24, 539 FY25, 100 FY18. https://visagrader.com/visa-approvals-and-refusals/H1B/ghana-gha LIKELY.
- asylum-context / asylumGrantPct 66: 238 grants, 125 denials (abandonment 28, not adjudicated 152). CONFIRMED.
- Entry F1: Open Doors + proclamations above. H1B: visagrader + ROW. B2: reciprocity cut to 3 months single entry on 8 July 2025 (LIKELY, https://natlawreview.com/article/major-changes-us-visa-reciprocity-nationals-four-african-countries ), restored to five-year multiple entry, announced 26 to 27 Sept 2025 (LIKELY, https://www.isd.gov.gh/us-lifts-visa-restrictions-on-ghana-restores-5-year-multiple-entry-visas/ ). O1: 20 FY24, 6 FY18, https://visagrader.com/visa-approvals-and-refusals/O1/ghana-gha LIKELY. FAM: DV + pause above. ASY: EOIR.
- Not on the B-1/B-2 visa bond list of 50 countries as of 2 April 2026 (LIKELY, https://natlawreview.com/article/state-departments-visa-bond-program-12-new-countries-added-list ).
- familySupportFactor 1.0: no sourced reason to move it.
- Festivals: Independence Day 6 March (month 7), Christmas and New Year (month 4), Easter (month 8, written "this year" because it moves).

## Ethiopia

- time-difference: Africa/Addis_Ababa UTC+3, no DST; ET +8 / +7, PT +11 / +10. CONFIRMED.
- flight-roundtrip $1,500: UNVERIFIED design estimate.
- f1-visas-issued-fy2024: 1,804 (FY22 1,958; FY25 1,239). https://visagrader.com/visa-approvals-and-refusals/F1/ethiopia-eth LIKELY.
- students-in-us-latest: 3,395 in 2024/25 (3,078 prior), rank 40, undergraduate 60.8%. https://opendoorsdata.org/wp-content/uploads/2026/01/OD_Ethiopia_Fact-Sheet-2025.pdf CONFIRMED.
- remittances-latest: $7.1B in 2025, IFAD Sending Money Home 2026 via https://capitalethiopia.com/2026/09/20/remittances-to-africa-reach-124-billion-as-digital-channels-lower-transfer-costs/ LIKELY, low end: a search snippet notes the World Bank series jumped from $0.54B (2023) to $7.14B (2024), probably a revision.
- h1b-share-latest: 120 FY24, 98 FY25, 34 FY18. https://visagrader.com/visa-approvals-and-refusals/H1B/ethiopia-eth LIKELY.
- asylum-context / asylumGrantPct 83: 291 grants, 58 denials (abandonment 11, not adjudicated 120). CONFIRMED.
- Entry F1: Open Doors; reciprocity cut on 8 July 2025 to 3 months single entry for "most nonimmigrant" visas (LIKELY, natlawreview above; the article does not list classes, and no restoration for Ethiopia was found). H1B: visagrader + ROW. B2: visa bond, Ethiopia added effective 2 April 2026, $5,000 / $10,000 / $15,000 (LIKELY, natlawreview bond article above). O1: 3 FY24, 11 FY25, https://visagrader.com/visa-approvals-and-refusals/O1/ethiopia-eth LIKELY. FAM: DV + pause above. EWI: TPS termination announced December 2025, stayed January 2026, stay lifted 18 Aug 2026 (LIKELY, https://www.envoyglobal.com/news-alert/federal-judge-clears-way-for-ethiopia-tps-termination/ ). ASY: EOIR.
- familySupportFactor 0.85: birr floated end of July 2024 and fell about 30% at once (LIKELY, https://www.tutor2u.net/economics/blog/economic-jigsaw-ethiopia-floats-the-birr ). Rates of 57.48 to 83.94 per dollar and later 154 appeared in search snippets only (source pages returned 403), so they are not in the JSON.
- Festivals: Enkutatash (September, month 1), Genna 7 January (month 5), Eid (month 7, "this year").

## Kenya

- time-difference: Africa/Nairobi UTC+3, no DST; ET +8 / +7, PT +11 / +10. CONFIRMED.
- flight-roundtrip $1,500: UNVERIFIED design estimate.
- f1-visas-issued-fy2024: 1,905 (FY22 1,105; FY25 1,571). https://visagrader.com/visa-approvals-and-refusals/F1/kenya-ken LIKELY.
- students-in-us-latest: 5,337 in 2024/25 (4,507 prior, +18.4%), rank 27. https://opendoorsdata.org/wp-content/uploads/2026/01/OD_Kenya_Fact-Sheet-2025.pdf CONFIRMED.
- remittances-latest: $5.04B in 2025, $4.95B in 2024, about half from the US; CBK data via https://itweb.africa/article/kenya-remittances-hit-5bn-in-2025-as-growth-slows/dgp45qaBm2GvX9l8 LIKELY.
- h1b-share-latest: 320 FY24, 375 FY25, 103 FY18. https://visagrader.com/visa-approvals-and-refusals/H1B/kenya-ken LIKELY.
- asylum-context / asylumGrantPct 52: 28 grants, 26 denials (abandonment 12, not adjudicated 95). CONFIRMED, very small numbers.
- Entry F1: Open Doors + proclamations. H1B: visagrader + ROW. B2: not a VWP country (background, not opened); not on the bond list as of 2 April 2026 (LIKELY). O1: 19 FY24, 6 FY18, https://visagrader.com/visa-approvals-and-refusals/O1/kenya-ken LIKELY. FAM: DV eligible; not on the 75-country list (LIKELY, Mintz). ASY: EOIR.
- familySupportFactor 1.0: no sourced reason to move it.
- Festivals: Christmas (month 4), Eid (month 7, "this year"), Madaraka Day 1 June (month 10).

## Egypt

- time-difference: Africa/Cairo UTC+2, DST to UTC+3 late April to end of October; ET +7 and PT +10 most of the year, +6 / +9 in the weeks when US and Egyptian clock changes do not line up. CONFIRMED.
- flight-roundtrip $1,200: UNVERIFIED design estimate.
- f1-visas-issued-fy2024: 1,237 (FY22 1,348; FY25 856). https://visagrader.com/visa-approvals-and-refusals/F1/egypt-egy LIKELY.
- students-in-us-latest: 4,518 in 2024/25 (4,280 prior), rank 33, graduate 46.8%. https://opendoorsdata.org/wp-content/uploads/2026/01/OD_Egypt_Fact-Sheet-2025.pdf CONFIRMED.
- remittances-latest: $41.5B in 2025, a record; IFAD via the Capital Ethiopia article above, and https://intelpoint.co/insights/egypt-received-a-record-41-5bn-in-remittances-in-2025-31-7-above-the-previous-record-set-in-2021/ . LIKELY.
- h1b-share-latest: 364 FY24, 390 FY25, 184 FY18. https://visagrader.com/visa-approvals-and-refusals/H1B/egypt-egy LIKELY.
- asylum-context / asylumGrantPct 72: 203 grants, 78 denials (abandonment 21, not adjudicated 144). CONFIRMED.
- Entry F1: Open Doors + proclamations. H1B: visagrader + ROW. B2: Proclamation 10949 Sec. 5(c) review of Egypt, no restriction; 10998 does not name Egypt (CONFIRMED, whitehouse.gov). O1: 70 FY24, 42 FY18, https://visagrader.com/visa-approvals-and-refusals/O1/egypt-egy LIKELY. FAM: DV + pause above. ASY: EOIR.
- familySupportFactor 0.9: pound floated 6 March 2024, about 31 to more than 50 per dollar in a day (LIKELY, AP via https://www.ksat.com/business/2024/03/06/egypt-floats-its-currency-and-agrees-with-the-imf-to-increase-a-bailout-loan-to-8-billion/ ). Set milder than Ethiopia because remittances hit a record.
- Festivals: Coptic Christmas 7 January (month 5), Ramadan and Eid al-Fitr (month 7, "this year"), Sham el-Nessim (month 8, "this year").

## Gaps

- travel.state.gov and dvprogram.state.gov returned 403, so the travel-ban status after February 2026, the 75-country list, the visa bond list and DV eligibility rest on whitehouse.gov text plus law firm and press reports. No official DV-2027 country list exists yet.
- The 75-country immigrant visa pause (Ghana, Ethiopia, Egypt; 21 Jan to 21 Aug 2026) is not in `arrivalLimits`. If the game should block the FAM route for 2026 arrivals, add `{ "from": 2026, "routes": ["FAM"] }` for those three by hand, bearing in mind the pause was vacated and the appeal outcome is unknown. Whether a stay was granted after September 2026 was not established.
- Whether Ethiopia's July 2025 three-month single-entry visa terms are still in force, and exactly which classes they cover, was not confirmed on the State Department reciprocity page.
- The final effective date of Ethiopia's TPS termination after the stay was lifted was not found. The 2022 designation date is from memory and is not in the JSON.
- A reported 2 Oct 2026 update to the visa bond list and an August 2026 final rule making the program permanent were seen in search snippets only; not checked for Ghana, Kenya or Egypt.
- Flight fares: no sourced fare for any of the four.
- H-1B share of approvals by nationality: not found; counts used instead.
- Ghana and Ethiopia remittance totals differ sharply between sources (central bank or IFAD against the World Bank series).
- CBP border encounter counts by these nationalities were not looked up; EWI notes carry no numbers.
- Visa Waiver Program non-membership was not checked against the DHS list this session (well established).
- Community review is still needed for names, dishes and festival scenes, especially Enkutatash, Genna, Sham el-Nessim and the Coptic Christmas scene.
