# Country data notes: Mexico and Nigeria

Written 2026-11-09 for `src/data/countries/mexico.json` and `src/data/countries/nigeria.json`. Each line names the research line a fact or entry note came from. Labels match the source files.

## Mexico

Facts
- time-difference: Mexico City UTC-6 all year, no DST. Read from the IANA tz database on this machine (Python zoneinfo, America/Mexico_City), CONFIRMED. Not in the country research files; added because the game otherwise falls back to India's 10.5-hour fact.
- flight-roundtrip: $450 DESIGN ESTIMATE, UNVERIFIED, estimate true. The research has no sourced Mexico fare.
- remittances-latest: $61.79B in 2025, down 4.6%. country-mexico.md 1.4 (Banxico via Mexico News Daily), LIKELY.
- h1b-share-latest: Mexico H-1B share not found. Used the TN figure instead, 15,630 of 15,672 TN visas, FY2024. country-mexico-addons.md 1.0 / 1.6 (USAFacts), CONFIRMED.
- asylum-context: 751 grants / 3,910 denials, about 16%, FY2024. unauthorized-entry.md 2.5 (EOIR by nationality), CONFIRMED.
- family-backlog: Nov 2026 bulletin F1 22SEP08, F3 15JUL01, F4 22APR01. rules-verification.md 14 and visa-catalog.md (gozellaw transcription), LIKELY. The 25-year wait is arithmetic on the F4 date.

Entry notes
- F1: not top 5 F-1 source; F-1 to TN ladder. country-mexico-addons.md 1.0, 1.2.
- H1B: TN 15,630 of 15,672 FY2024. country-mexico-addons.md 1.6.
- B2: BCC 1,871,765 FY2024. country-mexico-addons.md 1.0, 1.1 (CRS), CONFIRMED.
- O1: 880 FY2024. country-mexico-addons.md 1.0, CONFIRMED.
- FAM: F4 22APR01. rules-verification.md 14, LIKELY.
- EWI: Mexicans 47% of USBP SW apprehensions FY2025 (unauthorized-entry.md 1.3, CONFIRMED derived); EWI normally blocks 245(a) adjustment (country-mexico.md 2, LIKELY).
- ASY: 16% FY2024. unauthorized-entry.md 2.5.

Culture
- familySupportFactor 1.0: no sourced reason to move it from the India baseline.
- Festivals (Independence, Día de Muertos, Nochebuena), names, skin tones, dish and family call are design content, not research facts.

Gaps (left out)
- f1-visas-issued-fy2024: Mexico F-1 count not retrieved (country-mexico-addons.md 1.2, UNVERIFIED).
- students-in-us-latest: Mexico Open Doors count not retrieved; opendoorsdata.org/fact_sheets/mexico returned 404 this session.

## Nigeria

Facts
- time-difference: Lagos UTC+1, no DST. IANA tz database (Africa/Lagos), CONFIRMED. Not in the country research files.
- flight-roundtrip: $1,600 DESIGN ESTIMATE, estimate true. country-nigeria.md 3 gives an unsourced $1,200 to $2,500 background range (UNVERIFIED).
- f1-visas-issued-fy2024: 6,177 F-1 to nationals FY2024 (peak 7,556 FY22; 3,939 FY25). country-nigeria-addons.md 1.1 (visagrader), LIKELY.
- students-in-us-latest: 21,847 in 2024/25, +9.1%, rank 8. country-nigeria.md 1.2 and addons 1.2 (Open Doors via press), LIKELY.
- remittances-latest: about $21.8B in 2024 and 2025; $19.27B in 2023. country-nigeria.md 1.5 (CBN via Vanguard / Brand Spur), LIKELY.
- h1b-share-latest: share not found; used counts 880 (FY24), 884 (FY25), 391 (FY18). country-nigeria-addons.md 1.1, 1.3, LIKELY.
- asylum-context: 383 grants / 265 denials, about 59%, FY2024. unauthorized-entry.md 2.5, CONFIRMED. Small numbers.
- family-backlog: Nigeria charged to Rest of World; F1 22JAN21, F3 22OCT15, F4 22OCT12. rules-verification.md 14, LIKELY. Proclamation 10998 suspension (rules-verification.md 16, CONFIRMED) and 75-country issuance pause (LIKELY) mentioned in text.

Entry notes
- F1: 21,847 students; F-1 suspended for applicants outside the US from 2026-01-01. country-nigeria.md 1.2; rules-verification.md 16 (whitehouse.gov), CONFIRMED.
- H1B: 880 FY2024; Rest of World queue. addons 1.1; rules-verification.md 14.
- B2: single-entry 3-month from 2025-07-08 (country-nigeria.md 1.3, CONFIRMED); B suspended under 10998.
- O1: 35 (FY18) to 154 (FY24). addons 1.2, LIKELY.
- FAM: spouses of USC 8,670 FY2024 (addons 1.2, OHSS, CONFIRMED); DV ineligible (addons 1.2 DV correction; rules-verification.md 15, LIKELY).
- EWI: Nigeria not itemised in CBP's file (unauthorized-entry.md 1.5, CONFIRMED); overstay is the main form (LIKELY).
- ASY: unauthorized-entry.md 2.5.

Culture
- familySupportFactor 0.85: country-nigeria.md 3 "FX" line (naira devaluation after 2023 reforms, LIKELY). Kept modest because remittances stayed about $21.8B (1.5).
- Names mix Yoruba, Igbo and Hausa. Festivals: Independence (1 Oct, month 2), Christmas and New Year (month 4), Eid (month 7, March, written as "this year" because the date moves).

Gaps
- The research does not specifically document the 2023 to 2024 foreign-exchange shortage; it only mentions the devaluation. The World Bank Nigeria overview page (fetched 2026-11-09) gave no 2023 to 2024 FX figures. familySupportNote cites only the devaluation.
- Diversity Visa eligibility for each year is still not confirmed on the official list; treated as ineligible.
- Whether family-based immigrant visas are exempt from Proclamation 10998 is unresolved in the research.
