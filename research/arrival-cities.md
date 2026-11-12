# Arrival City Research: "Immigrant" (first build: India, Mexico, Nigeria)

Compiled 2026-11-08. Research agent output; neutral and factual. Nothing here is legal or immigration advice.

## How to read this file

Labels used next to every fact:
- CONFIRMED: number or statement pulled directly from the cited source in this session.
- LIKELY: from a secondary source, a dated page, or well-known general knowledge that agrees with what was found, but not checked against a primary page in this session.
- UNVERIFIED: could not be checked; do not ship as fact in the game without a second source.

Core data pipelines (all retrieved 2026-11-08):
- Census ACS 2024 1-year and 2020-2024 5-year, read through the Census Reporter public API (https://api.censusreporter.org), which serves the official ACS tables. The Census Bureau's own API (api.census.gov) and MPI's data pages (migrationpolicy.org) were blocked or required a key, so MPI figures were NOT used.
- Zillow Observed Rent Index (ZORI): https://files.zillowstatic.com/research/public_csvs/zori/Metro_zori_uc_sfrcondomfr_sm_month.csv (all home types, all bedroom counts, smoothed, metro level). CONFIRMED. ZORI has no 1BR/2BR split.
- BLS OEWS via the BLS public API (https://api.bls.gov/publicAPI/v2/timeseries/data/, series pattern OEUM + 00 + CBSA + 000000 + SOC6 + 04 for annual mean wage or 13 for annual median wage). The API returned only the latest vintage, labelled 2025; BLS's own pages (https://www.bls.gov/oes/) show the latest reference period as May 2025. CONFIRMED for May 2025. Earlier OEWS years returned "no data" through the API.
- BEA Regional Price Parities (cost-of-living proxy, US = 100, 2024) via FRED series pages, e.g. https://fred.stlouisfed.org/series/RPPALL35620. CONFIRMED.

Important rent caveat: ACS "median gross rent" covers all renter households (including long-tenure tenants and utilities), so it runs below current asking rents. ZORI tracks market-rate rents for new-ish listings and is higher. They measure different things; the game should pick one and label it.

Rent history gap: 1BR and 2BR medians for 2015, 2018 and 2021 could NOT be retrieved (Census Reporter serves only the latest ACS release; HUD Fair Market Rent files returned a bot challenge). Only the all-size ZORI series covers those years. For game use, scale 1BR/2BR for earlier years by the ZORI ratio (ZORI year / ZORI 2024) applied to the ACS 2024 values. That is a modelling shortcut, not data. UNVERIFIED as an exact value.

---

## Summary comparison (all ACS 2024 / BEA 2024 / OEWS May 2025)

| City (metro) | Foreign-born share (metro, 2020-24) | India-born | Mexico-born | Nigeria-born | Drive alone | Transit | WFH | Mean commute min | RPP 2024 |
|---|---|---|---|---|---|---|---|---|---|
| New York | 30.1% | 365,069 | 274,689 | 53,466 | 44.5% | 27.2% | 12.9% | 36.5 | 112.6 |
| Los Angeles | 32.7% | 93,805 | 1,433,668 | 13,742 | 67.0% | 3.5% | 14.9% | 30.7 | 113.6 |
| Houston | 24.3% | 99,142 | 588,518 | 59,746 | 71.8% | 1.7% | 12.1% | 31.1 | 98.6 |
| San Jose (Bay Area) | 40.8% (SJ), 31.9% (SF-Oakland) | 142,644 (SJ), 159,031 (SF-Oak) | 128,572 (SJ), 229,023 (SF-Oak) | 852 (SJ), 7,634 (SF-Oak) | 65.5% (SJ), 53.4% (SF-Oak) | 2.8% (SJ), 10.9% (SF-Oak) | 14.6% (SJ), 18.9% (SF-Oak) | 27.5 (SJ), 32.7 (SF-Oak) | 110.4 (SJ), 115.6 (SF-Oak) |
| Dallas-Fort Worth | 19.4% | 181,474 | 575,042 | 37,689 | 70.5% | 0.6% | 15.6% | 28.8 | 103.1 |
| Chicago | 18.6% | 153,413 | 615,888 | 21,638 | 62.5% | 9.0% | 14.9% | 30.9 | 103.6 |
| Seattle | 21.0% | 106,441 | 94,963 | 3,067 | 60.3% | 6.3% | 18.5% | 30.0 | 111.1 |
| Atlanta | 15.2% | 99,092 | 142,305 | 29,243 | 67.8% | 1.6% | 18.8% | 32.4 | 100.1 |

Sources: ACS via Census Reporter (links under each city), BEA RPP via FRED (https://fred.stlouisfed.org/series/RPPALL35620 and sibling series RPPALL31080, 26420, 41940, 41860, 19100, 16980, 42660, 12060). Label: CONFIRMED.

### Replacement check: Miami or Washington DC

Pulled the same ACS 2020-24 5-year tables (Census Reporter, https://api.censusreporter.org/1.0/data/show/acs2024_5yr?table_ids=B05006,B05002&geo_ids=31000US33100,31000US47900), CONFIRMED:
- Washington-Arlington-Alexandria metro: 24.3% foreign-born; India-born 110,777; Mexico-born 51,146; Nigeria-born 31,495. ACS 2024 1-yr: drive alone 57.1%, transit 9.0%, WFH 19.9%, median rent 1BR $1,830 / 2BR $2,105.
- Miami-Fort Lauderdale-West Palm Beach metro: 42.4% foreign-born but India 25,856, Mexico 71,112, Nigeria 4,378. Poor fit for these three origins. ACS 2024 1-yr: drive alone 67.5%, transit 2.6%, rent 1BR $1,763 / 2BR $2,149.

Observation: DC has the third-largest Nigeria-born community of the group (behind Houston 59,746 and NYC 53,466 in this data; above DFW 37,689 and Atlanta 29,243) and a larger India-born community than Houston or Atlanta. Seattle has the weakest fit for two of three origins (Nigeria-born 3,067; Mexico-born 94,963, the smallest Mexico community here). If one slot is swapped, DC for Seattle is the data-supported swap. Miami is NOT supported for India, Mexico or Nigeria characters. Seattle still has strong India-born presence (106,441) and a distinct tech-immigrant story, so keeping it is defensible. This is a recommendation for the designer, not a data finding.

---

## 1. NEW YORK (New York-Newark-Jersey City metro, with the five boroughs as the core)

Metro definition: NY-NJ metro (CBSA 35620). Label: CONFIRMED.

### 1. Immigrants and origin concentrations
| Area | Population (ACS 2020-24) | Foreign-born | Share | India-born | Mexico-born | Nigeria-born |
|---|---|---|---|---|---|---|
| New York metro | 19,798,536 | 5,952,555 | 30.1% | 365,069 | 274,689 | 53,466 |
| New York city | 8,483,844 | 3,106,219 | 36.6% | 73,526 | 156,623 | 25,252 |

Source (CONFIRMED, ACS 2020-2024 5-year, tables B05002 and B05006, via Census Reporter API): https://api.censusreporter.org/1.0/data/show/acs2024_5yr?table_ids=B05006,B05002&geo_ids=31000US35620  (geo IDs: metro `31000US35620`).

County-level concentrations (ACS 2020-24 5-year, CONFIRMED, same API with 05000US geo IDs):
- India-born: Middlesex County NJ 100,396 (Edison/Iselin area is the well-known hub, UNVERIFIED by this data); Queens 41,727; Hudson NJ 39,756 (Jersey City alone 27,693, a place-level figure); Nassau 26,946; Somerset NJ 25,311; Bergen NJ 20,698.
- Mexico-born: Queens 51,435; Kings (Brooklyn) 42,955; Bronx 36,498; New York County 16,587; Richmond 9,148. Neighborhood names (Sunset Park, Corona, Bushwick, Mott Haven) are LIKELY from general knowledge, not from this pull.
- Nigeria-born: Essex County NJ 12,611 (Newark area); Kings 8,842; Bronx 6,559; Queens 6,402; Nassau 2,801.

### 2. Rent and cost of living
| Index / year | Value |
|---|---|
| Zillow ZORI, all home types, all sizes, smoothed, Dec 2015 | $2,314 |
| Zillow ZORI, all home types, all sizes, smoothed, Dec 2018 | $2,454 |
| Zillow ZORI, all home types, all sizes, smoothed, Dec 2021 | $2,713 |
| Zillow ZORI, all home types, all sizes, smoothed, Dec 2024 | $3,218 |
| Zillow ZORI, all home types, all sizes, smoothed, Sep 2026 (latest) | $3,546 |
| ACS 2024 1-year median gross rent, 1 bedroom | $1,708 |
| ACS 2024 1-year median gross rent, 2 bedrooms | $1,887 |
| ACS 2020-24 5-year median gross rent, 1 bedroom | $1,686 |
| ACS 2020-24 5-year median gross rent, 2 bedrooms | $1,869 |
| BEA Regional Price Parity, all items, 2024 (US = 100) | 112.6 |

Index sources: ZORI csv URL above; ACS via https://api.censusreporter.org/1.0/data/show/acs2024_1yr?table_ids=B25031&geo_ids=31000US35620; BEA RPP https://fred.stlouisfed.org/series/RPPALL35620. CONFIRMED. Note: NYC rent-stabilised units pull ACS medians well below ZORI.

### 3. Pay (BLS OEWS, May 2025, New York-Newark-Jersey City metro)
| Occupation | Annual mean | Annual median | US mean (ref) |
|---|---|---|---|
| Software developers (15-1252) | $165,870 | $166,830 | $148,100 |
| Registered nurses (29-1141) | $119,600 | $119,720 | $101,420 |
| Construction laborers (47-2061) | $67,440 | $61,270 | $52,030 |
| Cooks, restaurant (35-2014) | $43,200 | $43,740 | $38,730 |
| Heavy and tractor-trailer truck drivers (53-3032) | $69,020 | $65,040 | $59,710 |
| Home health and personal care aides (31-1120) | $41,120 | $39,680 | $36,120 |
| Accountants and auditors (13-2011) | $119,280 | $105,650 | $94,750 |

Source: BLS API series described above. CONFIRMED (verify metro title vintage if exact quoting is needed).

### 4. Commute
| Area (ACS 2024 1-yr) | Drive alone | Carpool | Transit | Walk | Bike | Work from home | Mean one-way min (derived) |
|---|---|---|---|---|---|---|---|
| New York metro | 44.5% | 6.6% | 27.2% | 5.4% | 0.9% | 12.9% | 36.5 |
| New York city | 20.6% | 4.4% | 48.7% | 9.6% | 1.7% | 12.5% | 40.6 |

Source (CONFIRMED, ACS 2024 1-year, B08301 modes; mean minutes derived as B08013 aggregate travel time divided by workers not working from home, so it is an approximation; Census Reporter API): https://api.censusreporter.org/1.0/data/show/acs2024_1yr?table_ids=B08301,B08013,B25031,B05002&geo_ids=31000US35620

Transit pricing: base subway/local bus fare rose from $2.90 to $3.00 on 4 January 2026; the 30-day unlimited pass was eliminated and replaced by a 7-day OMNY fare cap, reported as $35 (some outlets said $36; the $36 was the proposal). LIKELY. Sources: https://abc7ny.com/post/mta-fare-increases-3-commuters-buses-subway-trains-nyc/18350815/ and https://railpace.com/mta-board-adopts-fare-and-toll-increases-to-take-effect-january-2026/. A rough monthly equivalent is about 4.3 weeks x $35 = about $150 (derived, not an official price).
Gas (AAA, 8 Nov 2026, state average regular): New York $4.26 (national $4.02). CONFIRMED: https://gasprices.aaa.com/todays-state-averages/
Car insurance (full coverage, annual, aggregator estimates, wide spread): New York about $2,840 to $2,898. LIKELY: https://insurify.com/car-insurance/news/average-car-insurance-rates-september-2026/ and https://www.motorbiscuit.com/heres-how-much-car-insurance-costs-in-every-us-state-for-2026-and-why-yours-is-so-high/
Ride-share cost ranges: no authoritative public source found. UNVERIFIED. Use a game-side placeholder and label it fictional.

### 5. Employment hubs and where these groups work (general knowledge, no source pulled)
LIKELY/UNVERIFIED: Midtown and Lower Manhattan (finance, law, media), Jersey City waterfront (back-office finance), hospital systems across the boroughs (nursing, home health), restaurants and construction citywide, trucking and logistics in NJ (Port Newark, Elizabeth). Indian professionals are heavily in tech, finance and healthcare; Mexican workers are commonly in restaurants, construction and building services; Nigerian workers are commonly in nursing and home health. These patterns are widely reported but were not verified here. A sourced occupational-by-birthplace pull (ACS B05012/C24010 style tables or the American Immigration Council profiles at https://www.americanimmigrationcouncil.org) is a recommended follow-up.

### 6. Rules affecting immigrants
- Driver's licences: New York is among the 19 states plus DC that issue licences regardless of status (Green Light Law). LIKELY (aggregated reports, NILC-derived): https://wlos.com/news/nation-world/19-states-and-dc-allow-undocumented-immigrants-to-obtain-drivers-licenses-illegal-immigration-migrants-president-donald-trump . The federal government has sued New York over the law (same report). Status of the suit not checked.
- In-state tuition for undocumented students: New York allows it by statute/SUNY-CUNY policy. UNVERIFIED this session (not searched).
- Health coverage: not verified this session. UNVERIFIED.
- Enforcement cooperation: New York City and New York State appear on the Justice Department's 5 Aug 2025 sanctuary jurisdiction list under Executive Order 14287. CONFIRMED that they are listed (a federal designation, which the jurisdictions may contest): https://www.justice.gov/opa/pr/justice-department-publishes-list-sanctuary-jurisdictions . Note the list says it is "not exhaustive".

### 7. 3D scene design notes (general knowledge; LIKELY, no source pulled)
- Skyline: dense Manhattan grid, Empire State Building (setback Art Deco spire), One World Trade (tapering square tower with a spire), Chrysler Building (stainless crown), slab supertall towers on Billionaires' Row; water on three sides.
- Districts: Midtown glass canyons; Brooklyn brownstones (4-5 storey brick rows with stoops); Queens low-rise mixed brick with elevated 7 train; Bronx 6-storey pre-war apartments; Jersey City towers across the Hudson.
- Transit: subway (steel R-type cars, elevated sections in Queens/Brooklyn/Bronx), MTA buses (blue-white), commuter rail (LIRR, Metro-North, NJ Transit), PATH trains, Staten Island ferry, yellow taxis.
- Weather: four seasons, humid hot summers, snowy winters.
- Procedural signatures: yellow-cab boxes, steam stacks, water towers on rooftops, fire-escape zigzag on brick facades, elevated track over streets, street grid with avenues and cross streets.

### 8. Known gaps
- No occupational-by-birthplace data. No 2015/2018/2021 1BR/2BR splits. Neighborhood names are not from the ACS pull. Ride-share prices unverified. NYC fare cap conflict ($35 vs $36). Tuition and health coverage rules not checked.

---

## 2. LOS ANGELES (Los Angeles-Long Beach-Anaheim metro)

### 1. Immigrants and origin concentrations
| Area | Population (ACS 2020-24) | Foreign-born | Share | India-born | Mexico-born | Nigeria-born |
|---|---|---|---|---|---|---|
| Los Angeles metro | 12,974,487 | 4,241,527 | 32.7% | 93,805 | 1,433,668 | 13,742 |
| Los Angeles city | 3,857,263 | 1,377,410 | 35.7% | 23,290 | 424,738 | 3,254 |

Source (CONFIRMED, ACS 2020-2024 5-year, tables B05002 and B05006, via Census Reporter API): https://api.censusreporter.org/1.0/data/show/acs2024_5yr?table_ids=B05006,B05002&geo_ids=31000US31080  (geo IDs: metro `31000US31080`).

County-level (ACS 2020-24, CONFIRMED): Mexico-born: LA County 1,141,433; Riverside 309,953; Orange 292,235; San Bernardino 253,518. India-born: LA County 57,115; Orange 36,690 (Artesia/Cerritos/Irvine are commonly named, UNVERIFIED). Nigeria-born: LA County 12,719; Riverside 3,527; San Bernardino 3,260. Neighborhood names for Mexican communities (Boyle Heights, East LA, Pacoima, Santa Ana) are LIKELY general knowledge.

### 2. Rent and cost of living
| Index / year | Value |
|---|---|
| Zillow ZORI, all home types, all sizes, smoothed, Dec 2015 | $1,858 |
| Zillow ZORI, all home types, all sizes, smoothed, Dec 2018 | $2,171 |
| Zillow ZORI, all home types, all sizes, smoothed, Dec 2021 | $2,523 |
| Zillow ZORI, all home types, all sizes, smoothed, Dec 2024 | $2,805 |
| Zillow ZORI, all home types, all sizes, smoothed, Sep 2026 (latest) | $2,929 |
| ACS 2024 1-year median gross rent, 1 bedroom | $1,822 |
| ACS 2024 1-year median gross rent, 2 bedrooms | $2,263 |
| ACS 2020-24 5-year median gross rent, 1 bedroom | $1,784 |
| ACS 2020-24 5-year median gross rent, 2 bedrooms | $2,210 |
| BEA Regional Price Parity, all items, 2024 (US = 100) | 113.6 |

Sources as for NYC with geo ID 31000US31080; RPP https://fred.stlouisfed.org/series/RPPALL31080. CONFIRMED.

### 3. Pay (BLS OEWS, May 2025)
| Occupation | Annual mean | Annual median | US mean (ref) |
|---|---|---|---|
| Software developers (15-1252) | $161,900 | $160,920 | $148,100 |
| Registered nurses (29-1141) | $140,370 | $135,560 | $101,420 |
| Construction laborers (47-2061) | $63,220 | $58,810 | $52,030 |
| Cooks, restaurant (35-2014) | $44,750 | $44,460 | $38,730 |
| Heavy and tractor-trailer truck drivers (53-3032) | $61,230 | $60,340 | $59,710 |
| Home health and personal care aides (31-1120) | $35,890 | $34,320 | $36,120 |
| Accountants and auditors (13-2011) | $99,740 | $94,360 | $94,750 |

Source: BLS API. CONFIRMED.

### 4. Commute
| Area (ACS 2024 1-yr) | Drive alone | Carpool | Transit | Walk | Bike | Work from home | Mean one-way min (derived) |
|---|---|---|---|---|---|---|---|
| Los Angeles metro | 67.0% | 9.7% | 3.5% | 2.3% | 0.6% | 14.9% | 30.7 |
| Los Angeles city | 62.2% | 9.0% | 6.2% | 3.6% | 0.6% | 16.0% | 31.7 |

Source (CONFIRMED, ACS 2024 1-year, B08301 modes; mean minutes derived as B08013 aggregate travel time divided by workers not working from home, so it is an approximation; Census Reporter API): https://api.censusreporter.org/1.0/data/show/acs2024_1yr?table_ids=B08301,B08013,B25031,B05002&geo_ids=31000US31080

Transit: LA Metro base fare $1.75; weekly fare cap $18 when paying with TAP; LIFE program gives qualifying low-income LA County residents 20 free rides a month. No 30-day pass price was shown on the fetched page. CONFIRMED for those items: https://www.metro.net/riding/fares/
Gas (AAA, 8 Nov 2026): California $5.75. CONFIRMED: https://gasprices.aaa.com/todays-state-averages/
Insurance (full coverage, annual): California about $2,848 to $2,886 (aggregators). LIKELY: https://www.motorbiscuit.com/heres-how-much-car-insurance-costs-in-every-us-state-for-2026-and-why-yours-is-so-high/
Ride-share: UNVERIFIED.

### 5. Employment hubs
LIKELY/UNVERIFIED: entertainment and media (Hollywood, Burbank, Culver City), ports of LA/Long Beach and the Inland Empire warehouse belt (truck driving, logistics), healthcare (Kaiser, Cedars, UCLA), hospitality and restaurants, garment and light manufacturing, construction, Silicon Beach tech (Santa Monica, Playa Vista). Mexican workers are commonly in construction, food service, landscaping, hotels and warehouse work; Indian-born workers in healthcare and tech; Nigerian-born in healthcare and home care. Not verified here.

### 6. Rules
- Driver's licences: California AB 60 licences for undocumented residents (state is among the 19 + DC). LIKELY: https://wlos.com/news/nation-world/19-states-and-dc-allow-undocumented-immigrants-to-obtain-drivers-licenses-illegal-immigration-migrants-president-donald-trump
- In-state tuition: California AB 540 / Dream Act. UNVERIFIED this session.
- Health: Medi-Cal enrolment for undocumented adults 19+ was frozen to new full-scope enrolment from 1 Jan 2026 (they qualify only for emergency Medi-Cal); existing enrollees keep coverage; a $30 monthly premium and six-month renewals were scheduled for later; children are unaffected. LIKELY (county notices and news, sources mixed in date): https://spectrumnews1.com/ca/southern-california/health/2025/12/02/changes-coming-for-medicaid-and-medi-cal-recipients-tied-to-immigration and https://healthconsumer.org/medi-cal-changes-and-what-you-need-to-know/
- Enforcement: City of Los Angeles and State of California listed on the DOJ's 5 Aug 2025 list. CONFIRMED listing: https://www.justice.gov/opa/pr/justice-department-publishes-list-sanctuary-jurisdictions

### 7. 3D scene design notes (LIKELY)
- Skyline: small clustered downtown (Wilshire Grand with its spire, US Bank Tower circular crown), otherwise low-rise sprawl, San Gabriel Mountains backdrop, Hollywood sign on a hill.
- Districts: palm-lined boulevards, taco trucks, stucco bungalows, Venice/Santa Monica beach and pier, freeways stacked at interchanges.
- Transit: Metro Rail (A, B, C, D, E, K lines, light rail and heavy rail), Metro buses (orange/red livery), Metrolink commuter rail; car dominant.
- Weather: mostly sunny, mild; dry summers, brief winter rain; smog haze.
- Signatures: tall thin palm trunks with tuft tops, wide multi-lane freeway ribbons, flat horizon, low sun-bleached colours, hazy mountain silhouette.

### 8. Known gaps
- Metro 30-day pass price not retrieved; occupation-by-origin and historical 1BR/2BR missing; tuition not checked; ride-share unverified.

---

## 3. HOUSTON (Houston-Pasadena-The Woodlands metro)

### 1. Immigrants and origin concentrations
| Area | Population (ACS 2020-24) | Foreign-born | Share | India-born | Mexico-born | Nigeria-born |
|---|---|---|---|---|---|---|
| Houston metro | 7,442,788 | 1,805,510 | 24.3% | 99,142 | 588,518 | 59,746 |
| Houston city | 2,328,253 | 683,104 | 29.3% | 23,048 | 227,911 | 22,061 |

Source (CONFIRMED, ACS 2020-2024 5-year, tables B05002 and B05006, via Census Reporter API): https://api.censusreporter.org/1.0/data/show/acs2024_5yr?table_ids=B05006,B05002&geo_ids=31000US26420  (geo IDs: metro `31000US26420`).

County-level (ACS 2020-24, CONFIRMED): Mexico-born: Harris 462,169; Montgomery 38,510; Fort Bend 29,267. India-born: Harris 46,320; Fort Bend 42,035 (Sugar Land city 8,680). Nigeria-born: Harris 35,186; Fort Bend 20,252; Brazoria 2,014. Houston has the largest Nigeria-born population of the eight metros. Neighborhoods commonly cited (Alief, Gulfton, Hillcroft, Missouri City): LIKELY general knowledge, not in this pull.

### 2. Rent and cost of living
| Index / year | Value |
|---|---|
| Zillow ZORI, all home types, all sizes, smoothed, Dec 2015 | $1,229 |
| Zillow ZORI, all home types, all sizes, smoothed, Dec 2018 | $1,305 |
| Zillow ZORI, all home types, all sizes, smoothed, Dec 2021 | $1,497 |
| Zillow ZORI, all home types, all sizes, smoothed, Dec 2024 | $1,623 |
| Zillow ZORI, all home types, all sizes, smoothed, Sep 2026 (latest) | $1,638 |
| ACS 2024 1-year median gross rent, 1 bedroom | $1,273 |
| ACS 2024 1-year median gross rent, 2 bedrooms | $1,476 |
| ACS 2020-24 5-year median gross rent, 1 bedroom | $1,214 |
| ACS 2020-24 5-year median gross rent, 2 bedrooms | $1,438 |
| BEA Regional Price Parity, all items, 2024 (US = 100) | 98.6 |

Sources: ZORI csv; ACS geo 31000US26420; RPP https://fred.stlouisfed.org/series/RPPALL26420 (below 100, the cheapest of the eight). CONFIRMED.

### 3. Pay (BLS OEWS May 2025)
| Occupation | Annual mean | Annual median | US mean (ref) |
|---|---|---|---|
| Software developers (15-1252) | $133,130 | $129,440 | $148,100 |
| Registered nurses (29-1141) | $100,290 | $99,830 | $101,420 |
| Construction laborers (47-2061) | $43,850 | $41,350 | $52,030 |
| Cooks, restaurant (35-2014) | $32,970 | $35,050 | $38,730 |
| Heavy and tractor-trailer truck drivers (53-3032) | $58,160 | $56,840 | $59,710 |
| Home health and personal care aides (31-1120) | $25,830 | $23,440 | $36,120 |
| Accountants and auditors (13-2011) | $95,640 | $85,090 | $94,750 |

CONFIRMED (BLS API).

### 4. Commute
| Area (ACS 2024 1-yr) | Drive alone | Carpool | Transit | Walk | Bike | Work from home | Mean one-way min (derived) |
|---|---|---|---|---|---|---|---|
| Houston metro | 71.8% | 11.0% | 1.7% | 1.3% | 0.3% | 12.1% | 31.1 |
| Houston city | 68.7% | 12.0% | 3.4% | 2.3% | 0.6% | 10.9% | 28.2 |

Source (CONFIRMED, ACS 2024 1-year, B08301 modes; mean minutes derived as B08013 aggregate travel time divided by workers not working from home, so it is an approximation; Census Reporter API): https://api.censusreporter.org/1.0/data/show/acs2024_1yr?table_ids=B08301,B08013,B25031,B05002&geo_ids=31000US26420

Transit: METRO local bus fare $1.25 and Day Pass $3. Monthly pass price not on the fetched page; one 2026 guide said $95 and another gave a range $45-$110. Houston moved to the RideMETRO fare system on 5 April 2026. Day pass and bus fare CONFIRMED (https://www.ridemetro.org/fares); monthly pass UNVERIFIED.
Gas (AAA 8 Nov 2026): Texas $3.49. CONFIRMED: https://gasprices.aaa.com/todays-state-averages/
Insurance: Texas about $2,611 to $2,821 per year full coverage (aggregators, conflicting). LIKELY: https://www.autoinsurance.com/pricing.html
Ride-share: UNVERIFIED.

### 5. Employment hubs
LIKELY/UNVERIFIED: energy (Energy Corridor, refineries, Ship Channel), Texas Medical Center (largest medical complex, large nursing and home-health workforce), construction (heavy Gulf Coast build), logistics (Port Houston, trucking), restaurants, NASA/Clear Lake aerospace, engineering firms. Nigeria-born workers are widely reported in healthcare and engineering; Mexican workers in construction and food service. Not verified here.

### 6. Rules
- Driver's licences: Texas does not issue licences to undocumented residents (not among the 19 + DC list). LIKELY: https://wlos.com/news/nation-world/19-states-and-dc-allow-undocumented-immigrants-to-obtain-drivers-licenses-illegal-immigration-migrants-president-donald-trump (Texas absent from the list; absence is inference, not an explicit statement).
- In-state tuition: Texas's 2001 Dream Act in-state tuition for undocumented students ended on 4 June 2025 via a consent judgment after a DOJ suit; a federal appeals court later refused to let students and Austin Community College defend it (Texas Tribune report dated 9 July 2026). TPS, parole and similar statuses may still qualify. LIKELY: https://www.tpr.org/government-politics/2026-06-04/texas-dream-act-goes-to-court-over-fight-to-restore-in-state-tuition-for-undocumented-students and https://texassignal.com/after-lawsuit-in-state-tuition-for-texas-dreamers-ends/ . Sources differ on appeal timing.
- Health: Texas has no state-funded programme for undocumented adults (UNVERIFIED this session).
- Enforcement: Texas SB 8 (effective 1 Jan 2026) requires sheriffs who run jails to enter 287(g) agreements, with compliance due by 1 Dec 2026; the Attorney General can sue refusers. Harris County sheriff is reported finalizing or negotiating an agreement (sources conflict; one tracker lists it pending). Houston and Harris County are NOT on the DOJ sanctuary list. LIKELY/CONFIRMED mix: https://www.keranews.org/immigration/2026-05-13/texas-attorney-general-ken-paxton-dallas-county-ice-agreement-june , https://www.texaspolicyresearch.com/senate-bill-8-and-287g-agreements-where-texas-stands-today/ , DOJ list https://www.justice.gov/opa/pr/justice-department-publishes-list-sanctuary-jurisdictions

### 7. 3D scene design notes (LIKELY)
- Skyline: downtown cluster of glass towers (JPMorgan Chase Tower, Wells Fargo Plaza, Bank of America Center with its stepped gables), flat coastal plain, sprawling freeway loops (I-10, 610 Loop, Beltway 8).
- Districts: Texas Medical Center towers, Galleria high-rises, Montrose, Bayou greenways, Ship Channel refineries with flare stacks and storage tanks.
- Transit: METRORail light rail (limited lines), buses, park-and-ride coaches; car dominant.
- Weather: hot and very humid; storms, flooding risk, hurricane season.
- Signatures: refinery tanks and pipes, stacked freeway ramps, low flat skyline, Astrodome-style round stadium, bayou drainage channels, pickup trucks.

### 8. Known gaps
- Monthly METRO pass; Harris County sheriff 287(g) status; Texas health coverage; employer-by-origin data.

---

## 4. SAN FRANCISCO BAY AREA (San Jose focus)

### 1. Immigrants and origin concentrations
| Area | Population (ACS 2020-24) | Foreign-born | Share | India-born | Mexico-born | Nigeria-born |
|---|---|---|---|---|---|---|
| San Jose metro | 1,969,337 | 803,244 | 40.8% | 142,644 | 128,572 | 852 |
| SF-Oakland metro | 4,645,029 | 1,481,065 | 31.9% | 159,031 | 229,023 | 7,634 |
| San Jose city | 990,138 | 415,456 | 42.0% | 56,433 | 82,946 | 418 |

Source (CONFIRMED, ACS 2020-2024 5-year, tables B05002 and B05006, via Census Reporter API): https://api.censusreporter.org/1.0/data/show/acs2024_5yr?table_ids=B05006,B05002&geo_ids=31000US41940  (geo IDs: metro `31000US41940`).

County and city detail (ACS 2020-24, CONFIRMED): India-born: Santa Clara County 142,505; Alameda 102,500 (Fremont city 47,391); Sunnyvale 20,753; Santa Clara city 18,347; Cupertino 11,763. Mexico-born: Santa Clara 118,350; Alameda 90,998; Contra Costa 71,472; San Jose city 82,946; Hayward 19,426. Nigeria-born: very small (Santa Clara 852; Alameda 4,301; Contra Costa 2,249; Oakland 1,775). Santa Clara County is 42% foreign-born, the highest share in this set. Commonly named neighborhoods (East San Jose, Alum Rock, Evergreen) are LIKELY general knowledge.

### 2. Rent and cost of living
| Index / year | Value |
|---|---|
| Zillow ZORI, all home types, all sizes, smoothed, Dec 2015 | $2,727 |
| Zillow ZORI, all home types, all sizes, smoothed, Dec 2018 | $2,952 |
| Zillow ZORI, all home types, all sizes, smoothed, Dec 2021 | $3,013 |
| Zillow ZORI, all home types, all sizes, smoothed, Dec 2024 | $3,350 |
| Zillow ZORI, all home types, all sizes, smoothed, Sep 2026 (latest) | $3,812 |
| ACS 2024 1-year median gross rent, 1 bedroom | $2,465 |
| ACS 2024 1-year median gross rent, 2 bedrooms | $2,890 |
| ACS 2020-24 5-year median gross rent, 1 bedroom | $2,478 |
| ACS 2020-24 5-year median gross rent, 2 bedrooms | $2,926 |
| (SF-Oakland metro) ACS 2024 1-yr 1BR / 2BR | $2,180 / $2,676 |
| (SF-Oakland metro) ZORI Dec 2015 / 2018 / 2021 / 2024 / Sep 2026 | $2,413 / $2,675 / $2,732 / $2,915 / $3,445 |
| BEA Regional Price Parity, all items, 2024 (US = 100) | 110.4  (SF-Oakland: 115.6) |

Sources: ZORI csv (San Jose and San Francisco metro rows); ACS geo 31000US41940 and 31000US41860; RPP https://fred.stlouisfed.org/series/RPPALL41940 and https://fred.stlouisfed.org/series/RPPALL41860. CONFIRMED. ZORI for San Francisco metro rose about 18% between Dec 2024 and Sep 2026 in the file; plausible but notable, so spot-check before using.

### 3. Pay (BLS OEWS May 2025, San Jose-Sunnyvale-Santa Clara metro)
| Occupation | Annual mean | Annual median | US mean (ref) |
|---|---|---|---|
| Software developers (15-1252) | $221,710 | $213,110 | $148,100 |
| Registered nurses (29-1141) | $194,950 | $216,740 | $101,420 |
| Construction laborers (47-2061) | $69,780 | $68,470 | $52,030 |
| Cooks, restaurant (35-2014) | $49,390 | $47,170 | $38,730 |
| Heavy and tractor-trailer truck drivers (53-3032) | $70,730 | $70,730 | $59,710 |
| Home health and personal care aides (31-1120) | $39,360 | $37,640 | $36,120 |
| Accountants and auditors (13-2011) | $128,520 | $121,700 | $94,750 |

San Francisco-Oakland metro (CBSA 41860) pulled too, May 2025 mean/median: software developers $193,430/$186,640; RNs $176,900/$186,610; construction laborers $73,640/$72,610; restaurant cooks $48,630/$46,030; truck drivers $69,260/$66,450; home health aides $38,810/$35,950; accountants $120,780/$110,730. CONFIRMED (BLS API).

### 4. Commute
| Area (ACS 2024 1-yr) | Drive alone | Carpool | Transit | Walk | Bike | Work from home | Mean one-way min (derived) |
|---|---|---|---|---|---|---|---|
| San Jose metro | 65.5% | 10.9% | 2.8% | 2.4% | 1.8% | 14.6% | 27.5 |
| SF-Oakland metro | 53.4% | 9.4% | 10.9% | 4.0% | 1.6% | 18.9% | 32.7 |
| San Jose city | 66.5% | 13.2% | 2.9% | 2.0% | 0.7% | 12.8% | 28.7 |

Source (CONFIRMED, ACS 2024 1-year, B08301 modes; mean minutes derived as B08013 aggregate travel time divided by workers not working from home, so it is an approximation; Census Reporter API): https://api.censusreporter.org/1.0/data/show/acs2024_1yr?table_ids=B08301,B08013,B25031,B05002&geo_ids=31000US41940

Transit: VTA local single ride $2.50, day pass $7.50, monthly pass $90 (Clipper); effective date not shown on page. CONFIRMED price on page, date UNVERIFIED: https://www.vta.org/fares . BART and Caltrain fares are distance-based and were not pulled. UNVERIFIED.
Gas (AAA 8 Nov 2026): California $5.75. CONFIRMED: https://gasprices.aaa.com/todays-state-averages/
Insurance: as California, about $2,850-$2,890 per year. LIKELY.
Ride-share: UNVERIFIED.

### 5. Employment hubs
LIKELY/UNVERIFIED: Silicon Valley tech campuses (Apple, Google, Nvidia, Cisco, Adobe, Meta, Intel and hundreds of startups), semiconductors and hardware, biotech, hospital systems (Stanford, Kaiser), construction, restaurants, warehouse/logistics, home care. Indian-born workers are heavily in software and hardware engineering; Mexican-born in construction, landscaping, food service and agriculture-adjacent work; very small Nigerian community.

### 6. Rules
- Driver's licences: California AB 60 (see LA). LIKELY.
- In-state tuition: AB 540. UNVERIFIED this session.
- Health: Medi-Cal full-scope freeze for new undocumented adults 19+ from 1 Jan 2026 (see LA). LIKELY. Santa Clara County runs its own county health programmes; not checked. UNVERIFIED.
- Enforcement: California and San Francisco city/county are on the DOJ 5 Aug 2025 list; San Jose and Santa Clara County are NOT listed there. CONFIRMED: https://www.justice.gov/opa/pr/justice-department-publishes-list-sanctuary-jurisdictions . The list is "not exhaustive", so absence is not a statement about local policy. California statewide law (SB 54) limits state/local cooperation with ICE; that statute was not re-checked this session (LIKELY).

### 7. 3D scene design notes (LIKELY)
- Skyline: San Jose downtown is a small cluster of mid-rise glass towers; Bay Area icons are the Golden Gate Bridge (International Orange suspension towers), Transamerica Pyramid, Salesforce Tower, Bay Bridge. Santa Cruz and Diablo mountain ridges frame the valley.
- Districts: low-rise tech campuses with big parking lots and ring-shaped or glass-box headquarters (Apple Park ring, Googleplex), stucco apartment complexes, strip malls, cable cars and Victorian row houses in SF.
- Transit: VTA light rail (blue/orange/green lines), VTA buses, Caltrain (diesel/electric commuter rail), BART (heavy rail), SF Muni (streetcars, trolleybuses, cable cars), Clipper card.
- Weather: Mediterranean, dry summers, mild wet winters; SF fog, San Jose warmer and sunnier.
- Signatures: orange suspension tower pair with cables, ring-shaped campus, Victorian bay-window rows, fog layer, brown hills, tall palm and eucalyptus lines.

### 8. Known gaps
- BART/Caltrain monthly cost, health programme details, employer-by-origin; Nigeria community too small to model realistically.

---

## 5. DALLAS-FORT WORTH (Dallas-Fort Worth-Arlington metro)

### 1. Immigrants and origin concentrations
| Area | Population (ACS 2020-24) | Foreign-born | Share | India-born | Mexico-born | Nigeria-born |
|---|---|---|---|---|---|---|
| Dallas-Fort Worth metro | 7,985,590 | 1,550,131 | 19.4% | 181,474 | 575,042 | 37,689 |
| Dallas city | 1,307,930 | 306,512 | 23.4% | 8,375 | 158,634 | 6,711 |
| Fort Worth city | 963,194 | 169,946 | 17.6% | 6,674 | 84,957 | 2,689 |

Source (CONFIRMED, ACS 2020-2024 5-year, tables B05002 and B05006, via Census Reporter API): https://api.censusreporter.org/1.0/data/show/acs2024_5yr?table_ids=B05006,B05002&geo_ids=31000US19100  (geo IDs: metro `31000US19100`).

County and city (ACS 2020-24, CONFIRMED): India-born: Collin 79,154; Dallas County 50,682; Denton 32,095; Tarrant 17,310; Irving city 28,930; Plano 26,416; Frisco 26,533. Mexico-born: Dallas County 301,781; Tarrant 152,469; Denton 39,028; Collin 32,655. Nigeria-born: Dallas County 14,360; Tarrant 10,765; Collin 6,199; Denton 3,710. Neighborhoods commonly named (Oak Cliff, Garland, Irving, Arlington, Carrollton) are LIKELY general knowledge.

### 2. Rent and cost of living
| Index / year | Value |
|---|---|
| Zillow ZORI, all home types, all sizes, smoothed, Dec 2015 | $1,105 |
| Zillow ZORI, all home types, all sizes, smoothed, Dec 2018 | $1,256 |
| Zillow ZORI, all home types, all sizes, smoothed, Dec 2021 | $1,546 |
| Zillow ZORI, all home types, all sizes, smoothed, Dec 2024 | $1,632 |
| Zillow ZORI, all home types, all sizes, smoothed, Sep 2026 (latest) | $1,659 |
| ACS 2024 1-year median gross rent, 1 bedroom | $1,473 |
| ACS 2024 1-year median gross rent, 2 bedrooms | $1,771 |
| ACS 2020-24 5-year median gross rent, 1 bedroom | $1,393 |
| ACS 2020-24 5-year median gross rent, 2 bedrooms | $1,660 |
| BEA Regional Price Parity, all items, 2024 (US = 100) | 103.1 |

Sources: ZORI csv (Dallas, TX row); ACS geo 31000US19100; RPP https://fred.stlouisfed.org/series/RPPALL19100. CONFIRMED.

### 3. Pay (BLS OEWS May 2025)
| Occupation | Annual mean | Annual median | US mean (ref) |
|---|---|---|---|
| Software developers (15-1252) | $138,810 | $133,290 | $148,100 |
| Registered nurses (29-1141) | $100,820 | $101,420 | $101,420 |
| Construction laborers (47-2061) | $43,780 | $43,960 | $52,030 |
| Cooks, restaurant (35-2014) | $35,860 | $36,490 | $38,730 |
| Heavy and tractor-trailer truck drivers (53-3032) | $62,720 | $59,530 | $59,710 |
| Home health and personal care aides (31-1120) | $28,460 | $26,900 | $36,120 |
| Accountants and auditors (13-2011) | $92,520 | $82,620 | $94,750 |

CONFIRMED (BLS API).

### 4. Commute
| Area (ACS 2024 1-yr) | Drive alone | Carpool | Transit | Walk | Bike | Work from home | Mean one-way min (derived) |
|---|---|---|---|---|---|---|---|
| Dallas-Fort Worth metro | 70.5% | 10.1% | 0.6% | 1.3% | 0.1% | 15.6% | 28.8 |
| Dallas city | 68.6% | 12.3% | 2.0% | 2.4% | 0.1% | 13.5% | 26.8 |
| Fort Worth city | 74.9% | 9.5% | 0.7% | 1.0% | 0.1% | 10.5% | 28.0 |

Source (CONFIRMED, ACS 2024 1-year, B08301 modes; mean minutes derived as B08013 aggregate travel time divided by workers not working from home, so it is an approximation; Census Reporter API): https://api.censusreporter.org/1.0/data/show/acs2024_1yr?table_ids=B08301,B08013,B25031,B05002&geo_ids=31000US19100

Transit: DART local monthly pass reported at $126 after a March 2025 restructure (up from $96), $6 day pass, 3-hour pass $3.00. LIKELY (DART's own restructure page 404'd; reported by DART news and local outlets): https://dart.org/fareupdates and https://communityimpact.com/dallas-fort-worth/plano-north/transportation/2025/02/11/dart-to-implement-fare-changes-in-march
Gas (AAA 8 Nov 2026): Texas $3.49. CONFIRMED: https://gasprices.aaa.com/todays-state-averages/
Insurance: Texas about $2,611 to $2,821 per year. LIKELY.
Ride-share: UNVERIFIED.

### 5. Employment hubs
LIKELY/UNVERIFIED: corporate HQs and finance in Dallas/Las Colinas/Plano/Frisco (the "Telecom Corridor" and Legacy business district), AT&T, American Airlines, Texas Instruments, healthcare (Baylor, Texas Health, UT Southwestern), logistics and trucking (inland ports, AllianceTexas), construction, aerospace (Lockheed Martin in Fort Worth). Indian-born workers cluster in Collin and Denton counties (tech, IT services, healthcare); Mexican-born in construction, food service and logistics; Nigerian-born in healthcare. Not verified here.

### 6. Rules
- Driver's licences: Texas does not issue to undocumented residents (inference from absence on the 19 + DC list). LIKELY.
- In-state tuition: ended 4 June 2025 (see Houston). LIKELY.
- Health: UNVERIFIED.
- Enforcement: Texas SB 8 (see Houston). Tarrant and Rockwall county sheriffs already participate in 287(g); the Texas AG demanded that the Dallas County sheriff enter an agreement, and the sheriff says the legal deadline is 1 Dec 2026 and that an existing working relationship with ICE exists. Dallas is not on the DOJ list. LIKELY: https://www.keranews.org/immigration/2026-05-13/texas-attorney-general-ken-paxton-dallas-county-ice-agreement-june and https://www.texasattorneygeneral.gov/news/releases/attorney-general-paxton-investigates-dallas-county-sheriff-sanctuary-policies-and-demands-sheriff

### 7. 3D scene design notes (LIKELY)
- Skyline: Reunion Tower (geodesic ball on a tall shaft), Bank of America Plaza with its outline lights, Fountain Place glass prism, Fort Worth's smaller downtown with Stockyards; broad prairie horizon.
- Districts: suburban sprawl with strip malls, massive stadiums (AT&T Stadium, Globe Life Field), Deep Ellum murals, Stockyards western storefronts, corporate glass campuses in Plano/Frisco.
- Transit: DART light rail (colour lines), DART buses, TRE and TEXRail commuter rail, Trinity Metro buses; car dominant.
- Weather: hot summers, mild winters with occasional ice storms and tornado-season storms.
- Signatures: geodesic ball tower, giant freeway interchange "High Five," flat horizon, longhorn/cowboy motifs, big-box retail.

### 8. Known gaps
- Current DART pass price from primary page; Dallas County 287(g) outcome after Dec 2026 deadline; employers-by-origin.

---

## 6. CHICAGO (Chicago-Naperville-Elgin metro)

### 1. Immigrants and origin concentrations
| Area | Population (ACS 2020-24) | Foreign-born | Share | India-born | Mexico-born | Nigeria-born |
|---|---|---|---|---|---|---|
| Chicago metro | 9,371,595 | 1,744,561 | 18.6% | 153,413 | 615,888 | 21,638 |
| Chicago city | 2,711,226 | 566,883 | 20.9% | 28,235 | 222,978 | 9,223 |

Source (CONFIRMED, ACS 2020-2024 5-year, tables B05002 and B05006, via Census Reporter API): https://api.censusreporter.org/1.0/data/show/acs2024_5yr?table_ids=B05006,B05002&geo_ids=31000US16980  (geo IDs: metro `31000US16980`).

County and city (ACS 2020-24, CONFIRMED): Mexico-born: Cook 391,769 (city of Chicago 222,978); Kane 55,788; Lake IL 50,113; Will 35,786; DuPage 38,401. India-born: Cook 78,586 (city 28,235); DuPage 36,064; Lake IL 17,305; Naperville 12,986; Schaumburg 7,665. Nigeria-born: Cook 16,583 (city 9,223); Will 2,130. Neighborhood names (Pilsen, Little Village, Devon Avenue, Rogers Park, Schaumburg) are LIKELY general knowledge, not from this pull.

### 2. Rent and cost of living
| Index / year | Value |
|---|---|
| Zillow ZORI, all home types, all sizes, smoothed, Dec 2015 | $1,363 |
| Zillow ZORI, all home types, all sizes, smoothed, Dec 2018 | $1,467 |
| Zillow ZORI, all home types, all sizes, smoothed, Dec 2021 | $1,630 |
| Zillow ZORI, all home types, all sizes, smoothed, Dec 2024 | $1,954 |
| Zillow ZORI, all home types, all sizes, smoothed, Sep 2026 (latest) | $2,163 |
| ACS 2024 1-year median gross rent, 1 bedroom | $1,310 |
| ACS 2024 1-year median gross rent, 2 bedrooms | $1,485 |
| ACS 2020-24 5-year median gross rent, 1 bedroom | $1,246 |
| ACS 2020-24 5-year median gross rent, 2 bedrooms | $1,444 |
| BEA Regional Price Parity, all items, 2024 (US = 100) | 103.6 |

Sources: ZORI csv (Chicago, IL row); ACS geo 31000US16980; RPP https://fred.stlouisfed.org/series/RPPALL16980. CONFIRMED.

### 3. Pay (BLS OEWS May 2025)
| Occupation | Annual mean | Annual median | US mean (ref) |
|---|---|---|---|
| Software developers (15-1252) | $141,640 | $134,380 | $148,100 |
| Registered nurses (29-1141) | $97,930 | $100,490 | $101,420 |
| Construction laborers (47-2061) | $69,180 | $60,890 | $52,030 |
| Cooks, restaurant (35-2014) | $40,450 | $38,930 | $38,730 |
| Heavy and tractor-trailer truck drivers (53-3032) | $65,170 | $62,300 | $59,710 |
| Home health and personal care aides (31-1120) | $38,490 | $38,180 | $36,120 |
| Accountants and auditors (13-2011) | $91,990 | $82,360 | $94,750 |

CONFIRMED (BLS API).

### 4. Commute
| Area (ACS 2024 1-yr) | Drive alone | Carpool | Transit | Walk | Bike | Work from home | Mean one-way min (derived) |
|---|---|---|---|---|---|---|---|
| Chicago metro | 62.5% | 8.0% | 9.0% | 3.3% | 0.7% | 14.9% | 30.9 |
| Chicago city | 43.5% | 7.5% | 20.5% | 7.1% | 1.8% | 17.6% | 33.5 |

Source (CONFIRMED, ACS 2024 1-year, B08301 modes; mean minutes derived as B08013 aggregate travel time divided by workers not working from home, so it is an approximation; Census Reporter API): https://api.censusreporter.org/1.0/data/show/acs2024_1yr?table_ids=B08301,B08013,B25031,B05002&geo_ids=31000US16980

Transit: CTA 'L' single ride $2.50, bus $2.25, 7-day pass $20, 30-day pass $75 (page showed a fare chart dated Feb 2023, so verify). LIKELY: https://www.transitchicago.com/fares/ . Metra (commuter rail) uses a zone-based monthly pass; not pulled. UNVERIFIED.
Gas (AAA 8 Nov 2026): Illinois $4.49. CONFIRMED: https://gasprices.aaa.com/todays-state-averages/
Insurance: Illinois about $2,215 per year (one aggregator). LIKELY/UNVERIFIED: https://wealthvieu.com/average-car-insurance-by-state
Ride-share: UNVERIFIED.

### 5. Employment hubs
LIKELY/UNVERIFIED: the Loop (finance, law, consulting, trading), O'Hare and Midway airports, healthcare (Northwestern, Rush, UChicago), manufacturing and food processing, large rail and trucking hub (intermodal yards, I-55/I-80 corridors), suburban tech/pharma (Schaumburg, Naperville, Lake County: Abbott, AbbVie). Indian-born cluster in the suburbs (DuPage, Cook) in IT and healthcare; Mexican-born in manufacturing, food service, construction and warehousing; Nigerian-born in healthcare and transport.

### 6. Rules
- Driver's licences: Illinois issues Temporary Visitor Driver's Licences to undocumented residents (since 2013 law); Illinois is in the 19 + DC list. LIKELY: https://wlos.com/news/nation-world/19-states-and-dc-allow-undocumented-immigrants-to-obtain-drivers-licenses-illegal-immigration-migrants-president-donald-trump
- In-state tuition: Illinois offers in-state tuition to qualifying students regardless of status (2003 law). UNVERIFIED this session.
- Health: Illinois's adult immigrant health programme (HBIA) status not verified; the search returned nothing. UNVERIFIED.
- Enforcement: Chicago, Cook County and the State of Illinois are all on the DOJ 5 Aug 2025 list. CONFIRMED: https://www.justice.gov/opa/pr/justice-department-publishes-list-sanctuary-jurisdictions

### 7. 3D scene design notes (LIKELY)
- Skyline: Willis Tower (stacked black tube bundle with twin antennas), John Hancock Center (tapered X-braced), Trump Tower, Aon Center, Marina City corn-cob towers; lakefront and Navy Pier with Ferris wheel.
- Districts: Loop with elevated 'L' tracks over narrow streets, brick two-flats and greystones, Pilsen murals, bungalow belt, the Bean in Millennium Park.
- Transit: CTA 'L' (colour lines, elevated loop, 8-car sets), CTA buses, Metra commuter rail (bilevel cars), Pace buses.
- Weather: cold windy winters with heavy snow, hot humid summers, lake-effect wind.
- Signatures: elevated steel track structures with right-angle corners, stacked-tube supertall, bridges over the river that open, grid street plan with water to the east.

### 8. Known gaps
- CTA fares may have changed since the Feb 2023 chart; Metra pass cost missing; health programme status; tuition not re-verified.

---

## 7. SEATTLE (Seattle-Tacoma-Bellevue metro)

### 1. Immigrants and origin concentrations
| Area | Population (ACS 2020-24) | Foreign-born | Share | India-born | Mexico-born | Nigeria-born |
|---|---|---|---|---|---|---|
| Seattle metro | 4,061,920 | 853,800 | 21.0% | 106,441 | 94,963 | 3,067 |
| Seattle city | 754,195 | 151,989 | 20.2% | 18,060 | 9,746 | 470 |

Source (CONFIRMED, ACS 2020-2024 5-year, tables B05002 and B05006, via Census Reporter API): https://api.censusreporter.org/1.0/data/show/acs2024_5yr?table_ids=B05006,B05002&geo_ids=31000US42660  (geo IDs: metro `31000US42660`).

County and city (ACS 2020-24, CONFIRMED): India-born: King County 83,494; Snohomish 20,373; Bellevue 16,465; Redmond 12,900; Seattle city 18,060. Mexico-born: King 55,854; Snohomish 21,156; Pierce 17,953 (plus Skagit/Yakima farm valleys outside the metro, LIKELY). Nigeria-born: King 1,642 (city 470) is too small to support a realistic Nigerian enclave; consider flagging Seattle as a low-density option for Nigerian characters.

### 2. Rent and cost of living
| Index / year | Value |
|---|---|
| Zillow ZORI, all home types, all sizes, smoothed, Dec 2015 | $1,407 |
| Zillow ZORI, all home types, all sizes, smoothed, Dec 2018 | $1,664 |
| Zillow ZORI, all home types, all sizes, smoothed, Dec 2021 | $1,933 |
| Zillow ZORI, all home types, all sizes, smoothed, Dec 2024 | $2,128 |
| Zillow ZORI, all home types, all sizes, smoothed, Sep 2026 (latest) | $2,250 |
| ACS 2024 1-year median gross rent, 1 bedroom | $1,814 |
| ACS 2024 1-year median gross rent, 2 bedrooms | $2,162 |
| ACS 2020-24 5-year median gross rent, 1 bedroom | $1,771 |
| ACS 2020-24 5-year median gross rent, 2 bedrooms | $2,080 |
| BEA Regional Price Parity, all items, 2024 (US = 100) | 111.1 |

Sources: ZORI csv (Seattle, WA row); ACS geo 31000US42660; RPP https://fred.stlouisfed.org/series/RPPALL42660. CONFIRMED.

### 3. Pay (BLS OEWS May 2025)
| Occupation | Annual mean | Annual median | US mean (ref) |
|---|---|---|---|
| Software developers (15-1252) | $174,920 | $167,280 | $148,100 |
| Registered nurses (29-1141) | $126,390 | $128,260 | $101,420 |
| Construction laborers (47-2061) | $64,990 | $59,740 | $52,030 |
| Cooks, restaurant (35-2014) | $49,000 | $47,730 | $38,730 |
| Heavy and tractor-trailer truck drivers (53-3032) | $71,980 | $71,240 | $59,710 |
| Home health and personal care aides (31-1120) | $49,500 | $48,210 | $36,120 |
| Accountants and auditors (13-2011) | $106,970 | $99,370 | $94,750 |

CONFIRMED (BLS API). Home health aide pay is the highest of the eight metros, consistent with a high state minimum wage (not verified here).

### 4. Commute
| Area (ACS 2024 1-yr) | Drive alone | Carpool | Transit | Walk | Bike | Work from home | Mean one-way min (derived) |
|---|---|---|---|---|---|---|---|
| Seattle metro | 60.3% | 9.0% | 6.3% | 4.0% | 1.0% | 18.5% | 30.0 |
| Seattle city | 40.6% | 4.6% | 15.0% | 10.7% | 3.5% | 24.4% | 25.9 |

Source (CONFIRMED, ACS 2024 1-year, B08301 modes; mean minutes derived as B08013 aggregate travel time divided by workers not working from home, so it is an approximation; Census Reporter API): https://api.censusreporter.org/1.0/data/show/acs2024_1yr?table_ids=B08301,B08013,B25031,B05002&geo_ids=31000US42660

Transit: King County Metro adult bus fare rose from $2.75 to $3.00 on 1 Sept 2025 (reported in an ORCA notice); no monthly adult pass price confirmed (the $108 figure found applies to a vanpool/transit pass product). LIKELY/UNVERIFIED: https://content.govdelivery.com/accounts/WAKING/bulletins/3ecf9c4 . Sound Transit Link light rail and Sounder commuter rail fares are distance-based; not pulled.
Gas (AAA 8 Nov 2026): Washington $5.03. CONFIRMED: https://gasprices.aaa.com/todays-state-averages/
Insurance: Washington about $2,433 per year (one aggregator). LIKELY/UNVERIFIED: https://www.autoinsurance.com/pricing.html
Ride-share: UNVERIFIED.

### 5. Employment hubs
LIKELY/UNVERIFIED: Amazon (South Lake Union), Microsoft (Redmond), Boeing (Everett, Renton), Costco, Starbucks, Expedia, University of Washington and hospital systems, Port of Seattle/Tacoma, biotech, plus Eastside tech campuses (Bellevue, Redmond, Kirkland). Indian-born workers are strongly concentrated in software and engineering on the Eastside; Mexican-born commonly in construction, food service, agriculture and food processing; Nigerian-born presence is small.

### 6. Rules
- Driver's licences: Washington is on the 19 + DC list (law effective 2019). LIKELY (law date from general knowledge): https://wlos.com/news/nation-world/19-states-and-dc-allow-undocumented-immigrants-to-obtain-drivers-licenses-illegal-immigration-migrants-president-donald-trump
- In-state tuition: Washington allows in-state tuition for qualifying undocumented students (since 2003, expanded later). UNVERIFIED this session.
- Health: Washington Apple Health for immigrant adults (state-funded programmes). UNVERIFIED; search returned nothing.
- Enforcement: Seattle and the State of Washington are on the DOJ 5 Aug 2025 list; King County is not. CONFIRMED: https://www.justice.gov/opa/pr/justice-department-publishes-list-sanctuary-jurisdictions

### 7. 3D scene design notes (LIKELY)
- Skyline: Space Needle (saucer atop a tripod stem), Columbia Center (tall dark rectangular tower), Smith Tower; Mount Rainier as a snow cone backdrop; Puget Sound ferries and water on both sides; cranes at the container port.
- Districts: South Lake Union glass campuses, Capitol Hill, floating-home houseboats on Lake Union, Pike Place Market sign, hills with steep streets.
- Transit: Link light rail (1 and 2 lines), King County Metro buses (many electric trolleybuses with overhead wires), Sounder commuter rail, Washington State Ferries, Seattle monorail, streetcars.
- Weather: mild, grey, drizzly October to May; dry, pleasant summers; little snow.
- Signatures: saucer-on-stem tower, snow-capped volcano cone, evergreen conifer forests, overcast sky, ferry boats, tall cranes.

### 8. Known gaps
- Nigerian and Mexican communities are small; monthly transit pass not confirmed; health and tuition not verified.

---

## 8. ATLANTA (Atlanta-Sandy Springs-Roswell metro)

### 1. Immigrants and origin concentrations
| Area | Population (ACS 2020-24) | Foreign-born | Share | India-born | Mexico-born | Nigeria-born |
|---|---|---|---|---|---|---|
| Atlanta metro | 6,256,377 | 950,509 | 15.2% | 99,092 | 142,305 | 29,243 |
| Atlanta city | 505,268 | 45,507 | 9.0% | 4,822 | 3,479 | 1,120 |

Source (CONFIRMED, ACS 2020-2024 5-year, tables B05002 and B05006, via Census Reporter API): https://api.censusreporter.org/1.0/data/show/acs2024_5yr?table_ids=B05006,B05002&geo_ids=31000US12060  (geo IDs: metro `31000US12060`).

County (ACS 2020-24, CONFIRMED): Mexico-born: Gwinnett 42,754; Cobb 23,580; Fulton 13,278; DeKalb 13,260; Clayton 10,918. India-born: Fulton 27,330; Forsyth 25,792; Gwinnett 16,228; Cobb 12,652; Alpharetta city 6,620. Nigeria-born: Gwinnett 8,619; Cobb 4,368; DeKalb 3,853; Clayton 3,664; Fulton 3,595. The city of Atlanta itself is only 9.0% foreign-born (ACS 2020-24 5-year); immigrant life is largely in the suburbs (Gwinnett, Cobb, DeKalb, north Fulton), including Buford Highway (Doraville/Chamblee) which is commonly cited but not in this pull (LIKELY).

### 2. Rent and cost of living
| Index / year | Value |
|---|---|
| Zillow ZORI, all home types, all sizes, smoothed, Dec 2015 | $1,038 |
| Zillow ZORI, all home types, all sizes, smoothed, Dec 2018 | $1,245 |
| Zillow ZORI, all home types, all sizes, smoothed, Dec 2021 | $1,662 |
| Zillow ZORI, all home types, all sizes, smoothed, Dec 2024 | $1,751 |
| Zillow ZORI, all home types, all sizes, smoothed, Sep 2026 (latest) | $1,843 |
| ACS 2024 1-year median gross rent, 1 bedroom | $1,605 |
| ACS 2024 1-year median gross rent, 2 bedrooms | $1,737 |
| ACS 2020-24 5-year median gross rent, 1 bedroom | $1,524 |
| ACS 2020-24 5-year median gross rent, 2 bedrooms | $1,632 |
| BEA Regional Price Parity, all items, 2024 (US = 100) | 100.1 |

Sources: ZORI csv (Atlanta, GA row); ACS geo 31000US12060; RPP https://fred.stlouisfed.org/series/RPPALL12060. CONFIRMED. Atlanta ZORI rose about 60% from Dec 2015 to Dec 2021 in the file, one of the steepest climbs in the set.

### 3. Pay (BLS OEWS May 2025)
| Occupation | Annual mean | Annual median | US mean (ref) |
|---|---|---|---|
| Software developers (15-1252) | $135,870 | $132,960 | $148,100 |
| Registered nurses (29-1141) | $99,760 | $100,490 | $101,420 |
| Construction laborers (47-2061) | $43,150 | $42,010 | $52,030 |
| Cooks, restaurant (35-2014) | $35,780 | $37,230 | $38,730 |
| Heavy and tractor-trailer truck drivers (53-3032) | $59,400 | $59,100 | $59,710 |
| Home health and personal care aides (31-1120) | $31,880 | $29,920 | $36,120 |
| Accountants and auditors (13-2011) | $97,920 | $85,820 | $94,750 |

CONFIRMED (BLS API).

### 4. Commute
| Area (ACS 2024 1-yr) | Drive alone | Carpool | Transit | Walk | Bike | Work from home | Mean one-way min (derived) |
|---|---|---|---|---|---|---|---|
| Atlanta metro | 67.8% | 8.5% | 1.6% | 1.1% | 0.1% | 18.8% | 32.4 |
| Atlanta city | 56.1% | 4.7% | 5.7% | 4.8% | 0.9% | 25.6% | 26.5 |

Source (CONFIRMED, ACS 2024 1-year, B08301 modes; mean minutes derived as B08013 aggregate travel time divided by workers not working from home, so it is an approximation; Census Reporter API): https://api.censusreporter.org/1.0/data/show/acs2024_1yr?table_ids=B08301,B08013,B25031,B05002&geo_ids=31000US12060

Transit: MARTA single ride $2.50 (up to 4 free transfers within 3 hours), 7-day pass $23.75, 30-day pass $95. CONFIRMED on page: https://www.itsmarta.com/fare-programs.aspx
Gas (AAA 8 Nov 2026): Georgia $3.48. CONFIRMED: https://gasprices.aaa.com/todays-state-averages/
Insurance: Georgia about $2,587 to $3,109 per year (wide spread; among the highest of the group). LIKELY: https://insurify.com/car-insurance/news/average-car-insurance-rates-september-2026/
Ride-share: UNVERIFIED.

### 5. Employment hubs
LIKELY/UNVERIFIED: Hartsfield-Jackson airport and Delta (largest employer), logistics and distribution (I-85/I-75 corridors, UPS), film and TV production, Midtown/Buckhead finance and fintech (payments), Emory/Grady/Northside healthcare, CDC and Georgia Tech/Atlanta Tech Square, Home Depot, Coca-Cola, construction, restaurants and hospitality. Mexican-born workers are commonly in construction, landscaping, food processing and poultry-adjacent work; Indian-born in IT and healthcare (north Fulton, Gwinnett); Nigerian-born in healthcare and transport. Not verified here.

### 6. Rules
- Driver's licences: Georgia does not issue licences to undocumented residents (absent from the 19 + DC list; inference). LIKELY.
- In-state tuition: Georgia's university system policy bars undocumented students from in-state tuition and from the most selective campuses. LIKELY from general knowledge, UNVERIFIED this session (the search returned nothing on it).
- Health: no state-funded coverage for undocumented adults (UNVERIFIED).
- Enforcement: Georgia HB 1105 (2024) requires jails to check status and notify ICE and penalizes non-cooperation; reports say at least three counties, including Gwinnett and Cobb, dropped jail-based 287(g) agreements while still complying with the state law. Atlanta and Georgia are NOT on the DOJ list. LIKELY (2024 coverage, may have changed): https://gpb.org/node/1263771 , https://www.fox5atlanta.com/news/gwinnett-sheriff-discuss-immigration-law-ice-cooperation , DOJ list https://www.justice.gov/opa/pr/justice-department-publishes-list-sanctuary-jurisdictions

### 7. 3D scene design notes (LIKELY)
- Skyline: Bank of America Plaza (tall spire with gold-leaf tip), Westin Peachtree Plaza (cylindrical glass), Truist Plaza, Mercedes-Benz Stadium (retractable petal roof), Midtown towers; heavily tree-covered, so the skyline rises out of a green canopy.
- Districts: Peachtree Street corridor, BeltLine trail loop, Buckhead high-rises, Buford Highway international strip malls, Sweet Auburn, suburban cul-de-sacs.
- Transit: MARTA heavy rail (red/gold/blue/green lines), MARTA buses, Atlanta Streetcar (short loop), Georgia Xpress commuter buses; I-285 "Perimeter" and the Downtown Connector (I-75/85) dominate.
- Weather: hot humid summers with thunderstorms, mild winters, occasional ice; pollen season in spring.
- Signatures: dense tree canopy around towers, peach/Peachtree motifs, wide multi-lane connector highway, airport with very large footprint, kudzu-covered slopes.

### 8. Known gaps
- Current status of Gwinnett/Cobb 287(g) and HB 1105 enforcement not re-verified; Georgia tuition rule not retrieved; MARTA prices may change.

---

## Cross-city notes for game design

- Commute-mode bands: NYC is the only metro where transit exceeds 20% (27.2%); Chicago (9.0%) and SF-Oakland (10.9%) sit in the middle; DFW (0.6%), Houston (1.7%), Atlanta (1.6%) and LA (3.5%) are car-dominated. These are ACS 2024; 2015-2019 shares were not retrieved, and 2020-2022 work-from-home spikes were not captured. Do not back-cast WFH to 2015.
- Wage ranking (software developers, mean): San Jose $221,710 > SF $193,430 > Seattle $174,920 > NYC $165,870 > LA $161,900 > Chicago $141,640 > DFW $138,810 > Atlanta $135,870 > Houston $133,130. RNs: San Jose $194,950 > SF $176,900 > LA $140,370 > Seattle $126,390 > NYC $119,600. CONFIRMED (BLS API, May 2025 vintage).
- Hard-to-source items flagged for a second research pass: ride-share fares; historical 1BR/2BR rents; occupation by birthplace; neighbourhood-level enclaves; 2015 to 2026 policy timeline (licences, tuition, 287(g)) for year-sensitive play, since the game lets players arrive in any year from 2015 to 2026.

## Known gaps and uncertainties (global)

1. Time dimension: ACS and OEWS pulls are the latest vintage only (ACS 2024, OEWS May 2025). Values for 2015, 2018 and 2021 exist only for the ZORI all-size rent series. Wages, commute shares and immigrant counts for earlier arrival years need either a rescale or a later pull.
2. MPI, HUD FMR files, Census API (key required) and BLS HTML pages were blocked; no MPI or HUD numbers are used.
3. Immigrant counts are ACS estimates with margins of error (not shown); small-population cells (Nigeria-born in San Jose, Seattle) are especially noisy.
4. Policy rules shifted fast in 2025 and 2026 (Texas SB 8, Texas tuition consent judgment, Medi-Cal freeze, DOJ sanctuary list, federal suits). Several items (tuition and health coverage in CA/IL/NY/WA, Georgia tuition, state licence law years) are LIKELY or UNVERIFIED and should be re-checked on official state pages before release.
5. Neighbourhood-level enclave names and employer lists are general knowledge, not from a cited dataset.
6. Gas prices are a single day (8 Nov 2026) with national average $4.02 (an elevated period); insurance numbers are aggregator estimates that disagree with one another by several hundred dollars.
7. Ride-share cost ranges: no authoritative source found anywhere; leave as fictional game constants.
8. Cost of living is expressed with BEA RPP (a price-level index relative to US = 100), not a consumer-facing "cost of living index" like C2ER; they differ.
