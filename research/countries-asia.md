# Country data notes: Asia (China, South Korea, Vietnam, Philippines)

Written 2026-11-11 for `src/data/countries/china.json`, `south-korea.json`, `vietnam.json`, `philippines.json`. India was not touched. Confidence: CONFIRMED = primary or official source opened this session; LIKELY = reputable secondary; UNVERIFIED = design estimate.

## Shared sources (all four)
- time-difference: Python `zoneinfo` on this machine (IANA tz database, https://www.iana.org/time-zones), CONFIRMED. Asia/Shanghai UTC+8, Asia/Seoul UTC+9, Asia/Ho_Chi_Minh UTC+7, Asia/Manila UTC+8; none has daylight saving. Hours ahead of Eastern (winter/summer) and Pacific: Shanghai and Manila 13/12 and 16/15; Seoul 14/13 and 17/16; Ho Chi Minh City 12/11 and 15/14.
- flight-roundtrip: DESIGN ESTIMATES, UNVERIFIED, estimate true (China 1,400; South Korea 1,500; Vietnam 1,500; Philippines 1,400). No fare source was found. The `source` field copies https://www.bts.gov from the Mexico and Nigeria files; that page was NOT fetched and holds no fare for these routes.
- students-in-us-latest: Open Doors 2025 country fact sheets, opened as PDFs, CONFIRMED. https://opendoorsdata.org/wp-content/uploads/2026/01/OD_China_Fact-Sheet-2025.pdf (265,919, rank 2; 277,398 the year before), .../OD_South-Korea_Fact-Sheet-2025.pdf (42,293, rank 3; 43,149), .../OD_Vietnam_Fact-Sheet-2025.pdf (25,584, rank 5; 22,066), .../OD_Philippines_Fact-Sheet-2025.pdf (4,573, rank 32; 4,100). Percent changes are my arithmetic.
- asylum-context and mechanics.asylumGrantPct: EOIR "Asylum Decisions by Nationality", FY2024, data generated 10 Oct 2024, PDF opened, CONFIRMED. https://www.justice.gov/eoir/media/1344846/dl . Rows (grants / denials / abandonment / not adjudicated / other / withdrawn): China 2,998 / 903 / 363 / 1,605 / 6 / 121 = 76.9%, stored 77. Vietnam 85 / 76 / 15 / 114 / * / 7 = 52.8%, stored 53 (small numbers). South Korea * / * / * / 11 / * / * = null. Philippines * / 11 / 8 / 151 / * / 20 = null (grant count suppressed, fewer than four). Rate = grants / (grants + denials), my arithmetic.
- family-backlog, mechanics.ebQueue and ebDates: November 2026 Visa Bulletin, final action dates, law firm transcription https://www.gozellaw.com/blog/november-2026-visa-bulletin , cross-checked for China and the Philippines against https://www.visaverge.com/visa-bulletin/november-2026-visa-bulletin-complete-analysis-and-forecast/ (all values agree). LIKELY, because travel.state.gov was not reachable (rules-verification.md 14).
  - China (mainland): EB-1 01AUG23, EB-2 01OCT21, EB-3 22JAN22, EB-3 Other Workers 01OCT19, EB-5 unreserved 01DEC16. Family dates equal the all-chargeability column: F1 22JAN21, F2A 22OCT26, F2B 22AUG20, F3 22OCT15, F4 22OCT12.
  - Philippines: EB-1 Current, EB-2 01APR25 (same as Rest of World), EB-3 15AUG23 (Rest of World 15JUN24), Other Workers 01JAN22. Family: F1 01NOV13, F2A 22OCT26, F2B 01OCT13, F3 22JUL06, F4 15MAY08.
  - South Korea and Vietnam: Rest of World. EB-1 Current, EB-2 01APR25, EB-3 15JUN24; F1 22JAN21, F3 22OCT15, F4 22OCT12.
  - The `value` years (14, 14, 14, 18) are arithmetic on the F4 date.
- visaWaiver: DHS list of 42 Visa Waiver Program countries, https://www.dhs.gov/visa-waiver-program , CONFIRMED. "Korea, Republic of" is on it, VWP travel began 17 Nov 2008. China, Vietnam and the Philippines are not on the current or former lists.
- arrivalLimits (empty for all four): the December 2025 proclamation effective 1 Jan 2026 (Proclamation 10998, building on 10949) names none of the four, checked on https://www.whitehouse.gov/presidential-actions/2025/12/restricting-and-limiting-the-entry-of-foreign-nationals-to-protect-the-security-of-the-united-states/ , CONFIRMED. Neighbours Laos and Burma are under full suspension. A web search on 2026-11-11 found no later proclamation adding any of the four (absence of evidence, LIKELY). The reported 75-country immigrant visa issuance pause from 21 Jan 2026 does not list any of the four in the Boundless compilation (it does list Thailand, Cambodia, Laos, Burma, Mongolia): https://www.boundless.com/blog/us-immigrant-visa-processing-pause-75-countries , LIKELY (secondary; no official list opened).
- FAM entry notes, Diversity Visa: all four appear on the DV-2026 excluded list in rules-verification.md 15 (secondary, Wikipedia). LIKELY, not re-fetched.
- EWI entry notes: CBP's public encounters file itemises China and the Philippines but not South Korea or Vietnam (unauthorized-entry.md 1.5, CONFIRMED there). "Entering without inspection usually blocks a green card from inside the US" is from country-mexico.md 2 and unauthorized-entry.md 5.2, LIKELY. No counts used.
- O1 entry notes: no country-level O-1 count was retrieved. The notes state only the EB-1 final action date from the bulletin (LIKELY) and that the O-1 has no lottery or per-country limit (statutory background, not re-read).
- familySupportFactor: 1.0 for all four. No sourced reason was found to move any of them. Designed.

## China
- f1-visas-issued-fy2024: 73,724 F-1 visas issued at US posts in China in FY2024 (100,476 FY2019; 52,278 FY2025). This is a consulate count, not a nationality count; the page says no nationality data. https://visagrader.com/visa-approvals-and-refusals/F1/china-chn , LIKELY.
- h1b-share-latest: 46,680 of 399,395 approvals, about 11.7%, FY2024, by country of birth. https://www.visaverge.com/news/india-leads-h-1b-approvals-in-fy-2024-capturing-71-share/ (cites the USCIS characteristics report), LIKELY. The USCIS FY2024 PDF URL I tried returned 404. Pew gives about 12% for FY2023.
- F1 entry note: Proclamation 10043 (signed 29 May 2020, effective 1 June 2020, no end date) suspends F and J entry for PRC nationals tied to entities supporting "military-civil fusion"; undergraduates are not covered. Federal Register text opened at https://www.govinfo.gov/content/pkg/FR-2020-06-04/html/2020-12217.htm , CONFIRMED. Whether it is still in force in November 2026 was not confirmed from a primary source (LIKELY; no revocation found).
- Chinese student visa policy, not encoded as an arrivalLimit because it is not a suspension of a visa category for the nationality:
  - 28 May 2025: Secretary Rubio said State would "aggressively revoke" visas of Chinese students with Communist Party connections or in critical fields and tighten criteria for all future applications from the PRC and Hong Kong. https://www.hppr.org/2025-05-28/rubio-says-u-s-will-aggressively-revoke-visas-for-many-chinese-students (NPR), LIKELY. The state.gov release returned 403. No criteria or revocation counts were published in what I read.
  - 2026: the duration-of-status rule (final 17 July 2026, reported effective 15 Sept 2026) applies to all nationalities; the only China-specific item reported is a 90-day limit for Chinese journalists on I visas. https://www.caixinglobal.com/2026-07-17/us-slashes-visa-time-limits-for-foreign-students-chinese-journalists-102465048.html (paywalled digest), LIKELY.
  - A search summary said bills barring Chinese nationals from F, J and M visas had not advanced as of August 2026. Not opened, UNVERIFIED; not used in the game data.
- Culture: Mandarin-style given names; festivals Mid-Autumn (month 1), Spring Festival (month 6), Dragon Boat (month 10), all written as "this year" because the dates move. Design content.

## South Korea
- f1-visas-issued-fy2024: 14,489 F-1 visas issued at the US embassy in Seoul in FY2024 (20,455 FY2018; 11,654 FY2025). Consulate count, not nationality. https://visagrader.com/visa-approvals-and-refusals/F1/south-korea-kor , LIKELY.
- h1b-share-latest: 2,314 H-1B visas issued in Seoul FY2024, 2,360 FY2025. Consulate count. https://visagrader.com/visa-approvals-and-refusals/H1B/south-korea-kor , LIKELY. VisaVerge gives only "about 1 to 1.3 percent" of approvals for South Korea, and a search snippet gave 3,983; neither was used.
- H1B entry note: Partner with Korea Act (15,000 E-4 visas) reintroduced by Reps. Young Kim and Sydney Kamlager-Dove, reported 25 July 2025, no vote. https://www.koreatimes.co.kr/foreignaffairs/20250725/us-lawmakers-table-bill-again-to-provide-work-visas-for-highly-skilled-korean-nationals , LIKELY. "Has not passed" as of late 2026 rests on a search summary of October 2026 Korea Times reporting (not opened), LIKELY.
- B2 entry note: DHS VWP page above, CONFIRMED.
- Context not used in the files: after the 4 Sept 2025 Georgia battery plant raid (more than 300 Korean nationals detained and flown home), the US agreed on 30 Sept 2025 that Korean firms may send workers on B-1 visas or ESTA to install, service and repair equipment. https://www.pbs.org/newshour/nation/u-s-will-allow-south-koreans-with-short-term-visas-and-waivers-to-work-at-industrial-sites-seoul-says , LIKELY. E-2 visas issued in Seoul: 9,459 in FY2024 (visagrader, consulate count, LIKELY).
- Culture: festivals Chuseok (month 1) and Seollal (month 6) as "this year"; Parents' Day 8 May (month 9). Design content.

## Vietnam
- f1-visas-issued-fy2024: 20,478 F-1 visas issued at US posts in Vietnam FY2024 (16,256 FY2023; 16,641 FY2025). Consulate count. https://visagrader.com/visa-approvals-and-refusals/F1/vietnam-vnm , LIKELY.
- h1b-share-latest and H1B entry note: 857 H-1B visas issued in Vietnam FY2024, 879 FY2025. Consulate count. https://visagrader.com/visa-approvals-and-refusals/H1B/vietnam-vnm , LIKELY.
- remittances-latest: about $16 billion in 2024, government figure. https://e.vnexpress.net/news/business/companies/vietnam-receives-16b-in-remittances-in-2024-4832768.html , LIKELY. Sources disagree on whether 2023 was 14 or 16 billion, so the text says "roughly level" as the article does.
- Culture: given names are written without tone marks in case the game font lacks Vietnamese glyphs; a reviewer may prefer full diacritics. Festivals Mid-Autumn (month 1), Teachers' Day 20 November (month 3), Tet (month 6). National Day and 30 April were avoided on purpose because they divide the diaspora. Design content.

## Philippines
- f1-visas-issued-fy2024: 1,020 F-1 visas to Filipino nationals FY2024 (1,237 FY2022; 777 FY2025). Nationality count. https://visagrader.com/visa-approvals-and-refusals/F1/philippines-phl , LIKELY.
- h1b-share-latest and H1B entry note: 3,565 H-1B visas to Filipino nationals FY2024 (3,350 FY2025; 1,217 FY2018). Nationality count. https://visagrader.com/visa-approvals-and-refusals/H1B/philippines-phl , LIKELY.
- remittances-latest: BSP cash remittances $35.63B in 2025, up 3.3% from $34.49B; US share 39.7%; personal remittances $39.62B. https://www.philstar.com/business/2026/02/17/2508451/remittances-reach-record-high-356-billion , LIKELY.
- Culture: names are mostly Christian given names with two Muslim names per list for Mindanao communities. Festivals Christmas (month 4), Holy Week (month 7, "this year"), Independence Day 12 June (month 10). Design content.

## Gaps
- travel.state.gov visa bulletin not opened; all bulletin dates are law firm transcriptions (two firms agree).
- F-1 and H-1B counts by nationality for China, South Korea and Vietnam: not available on VisaGrader; consulate counts used and labelled. H-1B share by country of birth for South Korea, Vietnam and the Philippines: not found in an official table.
- remittances-latest left out for China (search snippets conflict: 48, 31.4 and 25 billion, none opened) and South Korea (not retrieved).
- No O-1 counts for any of the four.
- No sourced round-trip fares.
- No EWI or CBP encounter counts were retrieved for Chinese or Filipino nationals.
- Diversity Visa ineligibility rests on the secondary list already in rules-verification.md 15.
- Current force of Proclamation 10043 and of the May 2025 Chinese student visa revocation policy in November 2026: not confirmed from a primary source. Current force of the 75-country immigrant visa pause: not confirmed (none of the four is listed anyway).
- EB-3 as the usual route for Filipino nurses was not sourced this session, so the files do not say it.
- No TPS designation applies to any of the four as far as I know; not checked against uscis.gov.
