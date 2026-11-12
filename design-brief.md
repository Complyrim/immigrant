# Immigrant: design brief (draft v1, awaiting confirmation)

## Premise
You play one person's journey from a home country to the US, one year per level, starting in the year the player chooses to arrive (2015 or later). The game ends in a **successful life** or a **failed life** (including deportation or return). Everything is grounded in sourced public data about immigration policy, countries of origin, arrival cities and workplaces.

## Decisions already made (from your answers)
| Topic | Decision |
|---|---|
| Gameplay | Narrative life-sim with decisions, shown in a **3D city** with **commute options**; **deportation** when out of status. |
| Challenges | **At least 12 per year**, each passed or failed, each shaping the final outcome. |
| Look and tech | **2D UI over live 3D city backdrops** (Three.js), Android first via Capacitor. |
| First build | **Slice with 3 countries**, 10 career paths each. |
| Tone | **All three** as a player-selectable *Reality setting*: Hopeful, Honest (default), Hard realism. |
| Setup | Name, age, marital status, country, sex, immigration status, arrival city, lifestyle, **arrival year (2015 or later)**. The first level is the arrival year. |
| Length | 5 to 20 years, set by arrival age. The calendar runs from the arrival year, so the start year changes which visas, fees, wait times and policies apply. |

## Proposed slice: 3 countries x 10 careers
Chosen for very different pathways. Career lists are **drafts, to be confirmed by research**.

- **India** (employment route): software engineer, data/ML engineer, product manager, IT consulting firm, MS student to OPT to H-1B, physician (IMG), nurse or pharmacist, accountant/finance, motel or small-business owner, SaaS founder later in the journey. Spouse path via H-4 and H-4 EAD.
- **Mexico** (family and labor routes): construction, agricultural worker, restaurant worker to owner, landscaping business, trucking and logistics, healthcare aide or nurse, TN professional, student, caregiver or domestic worker, family-sponsored factory worker. Includes the out-of-status path.
- **Nigeria** (student, health and lottery routes): nurse (EB-3), physician, software engineer via student visa, pharmacist, graduate student to academia, visitor (B) route, extraordinary-ability (O-1) route (the diversity-visa path is dropped for every arrival year: Nigeria is excluded from recent DV years, and DHS data parsed by the research agent shows Nigerian DV green cards falling from about 2,700 a year to near zero after FY2015), rideshare/logistics entrepreneur, accountant, home health aide, import/trading business.

The full vision (top 5 countries per continent, 10+ careers each) is built into the data format, so more country packs can be added later.

## The yearly loop (one level = one year)
1. **Year opens:** starting from the arrival year, with the real policy climate of that calendar year (e.g. travel restrictions, public-charge rules, COVID closures, H-1B changes).
2. **12 or more challenges**, drawn from a pool by category: work, legal/visa, money, housing, family abroad, marriage and children, health, community and discrimination, commute and lifestyle, education. Each has choices, stakes and a pass/fail result.
3. **Commute:** choose how you get to work (walk, bike, bus, subway, car, ride-share) in the 3D city. It trades cost, time, stress and risk.
4. **Year closes:** stats update, legal status is checked, a short summary is shown.

**Pass or fail** is decided by your choice, your stats and data-informed odds, not a pure dice roll, so players can see why they succeeded or failed.

## Status and deportation system
A legal-status state machine: visitor, student (F-1/OPT/STEM OPT), work visa (H-1B/L-1/TN/H-2A), spouse dependents, immigrant visa, green card holder, citizen, **out of status**. Grace periods, unemployment limits, filing windows and unlawful-presence consequences are modeled from official sources. Out of status can end in **removal**, which routes to the failed-life ending (or a return-home ending).

## Life stats
Money, career, legal security, family, wellbeing, community. The ending is a named outcome based on all six, not just wealth.

## Systems the build needs
Profile setup, city/lifestyle picker, year engine, challenge pool, career trees, status machine, era event timeline, 3D city backdrops per arrival city, commute scene, results/ending screens, save, settings, audio.

## Content strategy
Hand-writing every year of every path is not feasible. The plan is roughly 150 reusable challenge templates plus career-specific, country-specific and era-specific ones, filled in with real numbers (salaries, rents, fees, wait times) per city and year.

## Audio
Procedural music and effects (already built in the earlier prototype). ElevenLabs narration for key moments. The key is valid for voices; speech, sound and music permissions are untested.

## Assumptions I made (please confirm or change)
1. **Years after 2026:** today is November 2026, so any calendar year after 2026 is *projected*. An arrival in 2015 has up to nine projected years; a late arrival (2022 or later) has mostly projected years. Projected years would use plausible, clearly labelled scenario policy, not real history.
2. **No mini-game in the first slice.** The 3D commute scene stands in for it; a mini-game per year can come later.
3. **Arrival cities for the slice:** about 8 major cities (e.g. New York, Los Angeles, Houston, San Francisco Bay Area, Dallas, Chicago, Washington DC, Atlanta; Seattle moves to a later add-on because far fewer Nigeria-born residents live there), chosen from where these groups actually settle.
4. **In-game fact cards** show a real statistic with its source name, so the game teaches as well as plays.
5. **No monetization in the slice.**
6. **Languages:** English only for now.

## Sources the research phase will use
DHS Yearbook of Immigration Statistics, USCIS data and fee schedule, State Department Visa Bulletin, Migration Policy Institute country profiles, Census ACS, BLS occupational data, Department of Labor wage data.

## Not yet decided
- Art style details for people, since avatars are stylized and not photoreal.
- Whether the first release covers all 5 to 20 year lengths or caps at about 10 years.
- Decided (confirmed): players can pick **any arrival year from 2015 to 2026**. Late arrivals play mostly projected years, clearly labelled as projected.

---

# v2 revisions (from your feedback; these supersede earlier text where they conflict)

## 1. Complete visa catalog, open to every country
Every US immigrant and nonimmigrant category is modeled as data, and **every country can use the universal routes** (B visitor, F/M/J student and exchange, O-1, H, L, P, R and so on), with country-specific realism applied: refusal rates, travel bans, caps and backlogs, and a note on how common each route actually is for that country.
- **Nonimmigrant:** every class from A through V, TN/TD, plus visa-waiver travel, each with eligibility, duration, work rights, family rights, path to a green card, and ways to lose status.
- **Immigrant:** immediate relatives, family preference F1 to F4, K-1 fiance(e), EB-1 to EB-5, diversity visa (only in years when the country is eligible), special immigrants including religious workers, refugee and asylee adjustment, humanitarian parole, TPS, VAWA, and similar relief.
- **Setup screen:** the player picks any valid status for their country and year; a "how common is this for your country" note keeps the choice informed, not blocked.
- **Nigeria:** the lottery path is replaced by B, F and O routes, and the same routes are open to India and Mexico.

## 2. Informal ("under the table") work, for every country
Every country gets an informal-work track, open to undocumented, out-of-status and status-limited characters (for example students working beyond their hours), built from data on real sectors, pay against the minimum wage, wage theft, injury rates, raids and E-Verify exposure, taxes (ITIN), banking, driver's licences and health access.
- It is shown as a real choice with real consequences. It is never glamorized, and the game gives no how-to for avoiding the law, only odds and outcomes.
- Exits are modeled too: adjustment of status where eligible, relief from removal, voluntary departure, or return home.

## 3. Length and replay: the game must not be finishable in a day
- **Run length:** each yearly level has 12+ challenges, one "big" set piece, a commute segment and a year summary. Target about 8 minutes a year, so a 10-year run is roughly 80 minutes and a 20-year run roughly 2.5 hours. These are targets that playtesting must confirm.
- **Content breadth:** the combination of country, route (dozens), arrival city, arrival year (12), career or informal track, and Reality setting gives thousands of distinct journeys. The design target is 400+ unique challenge templates and 60+ named endings.
- **Dynasty mode:** your character's children grow up and you continue as the next generation, inheriting money, status, language, community and family ties. A campaign can span three generations and 40 to 60 years.
- **Meta progress:** an ending collection, route achievements, a "what if" replay of the same journey with one choice changed, and seeded weekly journeys.

## 4. Risk fixes
| Risk I flagged | Fix |
|---|---|
| Nigeria DV path closed | Replaced by B, F and O routes (done in this brief). |
| 2025-26 policy unsettled | "Policy in flux" events: rules and court fights shown as events, labelled "as of November 2026". |
| Seattle poor fit | Washington DC replaces Seattle for the slice. |
| Estimated pay and rents | Shown in game as "illustrative", with source and confidence in the data. |
| Rules from memory or unverified | Verification pass against primary sources (USCIS, Federal Register, DOL); nothing unverified may decide an outcome without review. |
| Deportation and waiver accuracy | Simplified, sourced flow plus a **release gate: review by an immigration attorney**. |
| Tone and stereotypes | Community review gate, diverse characters, the three-way Reality setting. |
| Legal advice confusion | "Not legal advice" notice on the title and settings screens. |
| Scope | Reusable challenge pool plus data-driven parameters; country packs added in phases. |
| Monetization | None in the first slice. |

I cannot do the attorney or community reviews. Those are release gates for you to arrange.

## 5. Data schema rule
Every number that affects an outcome carries `source`, `confidence` (confirmed, likely, unverified) and `asOf` date. The build flags any unverified outcome-deciding value.

## 6. Status-driven yearly tasks (from your feedback)
The entry status decides what a normal year looks like. Each year's 12+ challenges are drawn from four tracks, weighted by the character's current status:

1. **Status track:** tasks the visa itself creates (below).
2. **Life track:** dating, marriage, children, divorce, health, parents back home. Open to every status, but the rules differ by status.
3. **Work and money track:** job search, pay, housing, commute, taxes, remittances.
4. **Era track:** real policy events of that calendar year, and "policy in flux" events for 2025-26.

### Examples of status tracks
| Entry status | What the year asks of you |
|---|---|
| **F-1 student** | Attend class and keep a full course load. If on a scholarship, keep the required GPA and standing. Attend conferences (travel and re-entry risk, visa renewal abroad, administrative delays). Research and thesis milestones. Limited on-campus work, internships through CPT. Apply for OPT, then STEM OPT. Job search and the H-1B lottery. Meet someone, date, marry, have children. The tempting-but-risky cash job when money runs out. |
| **Work visa (H-1B, L-1, TN)** | Performance reviews, layoffs and the 60-day grace period, employer green-card steps, spouse work rights, travel and stamping risk, promotion or job change and transfer rules. |
| **B-1/B-2 visitor** | A short legal stay, a decision before it ends: leave, change status (for example to a student), or overstay and move into informal work. |
| **O-1 or P (talent)** | Building the portfolio, gigs and contracts, advisory letters, renewals, and the self-petition route toward a green card. |
| **J-1 exchange** | The home-residence requirement and waivers, program rules, sponsor relations. |
| **K-1 fiance(e)** | The 90-day marry-or-leave clock, then adjustment and the interview. |
| **H-2A/H-2B seasonal** | Contract dates, employer dependence, housing, going home between seasons. |
| **Family-based or green card holder** | Waiting lists, work, the path to naturalization. |
| **Out of status** | Informal work, fear of enforcement, no driver's licence or limited access, family risk, and the few exits. |

### The student journey as a worked example
Arrive on F-1 (scholarship or self-funded) -> classes, GPA, conferences, research -> dating and possible marriage and children -> graduate -> OPT -> job search -> STEM OPT -> **work authorization fork**:
- **Employer route:** H-1B lottery, then employer-sponsored green card (wait depends on country).
- **Marriage route:** marry a US citizen or permanent resident, then green card through the marriage with the real interview and evidence process, including what happens if a marriage is judged not genuine.
- **Self-petition route:** extraordinary ability (EB-1A) or national interest waiver (NIW), built over years of publications, impact and recommendation letters.
- **Failure branches:** lose status, drop to informal work, leave voluntarily, or be removed.

### Life events are status-aware
- **Dating and marriage:** partner types include a US citizen, a permanent resident, someone from the same country, or someone with another status, each changing the legal path and the odds.
- **Children:** a child born in the US changes family decisions; birthright citizenship rules are contested in 2025-26 and shown as "policy in flux" until settled.
- **Divorce, separation, caregiving abroad:** each can end or change a status path.

### Modeling rules
- Status rules must come from the verified visa catalog, so marriage-based and self-petition rules (for example whether and when someone who is on or has left F-1 status can adjust) must be checked against the catalog agent's primary-source output before they ship.
- Marriage fraud is shown only as a risk with real consequences, never as a how-to.

## 7. Entry without inspection (crossing the border without authorization)
Added at your request. It is one entry method on the setup screen, next to "admitted on a visa" and "arrived seeking asylum", and it is available to any country, with country-specific realism (it is common for Mexico, a growing but smaller route for India, and rare for Nigeria; the research will confirm the numbers).

**How the game treats it**
- **Data and consequences, never instructions.** The game shows odds, costs, dangers, detention, court process and outcomes drawn from sourced public data. It never shows routes, crossing locations, methods, smuggler contacts or ways to avoid enforcement.
- **A short journey segment,** told as a sequence of decisions and outcomes with abstract scenes, not a how-to. It is treated seriously: the dangers, debts and exploitation people face are shown as the data describes them, and nothing is played for thrills or jokes.
- **Honest branches:** apprehended and removed; apprehended and released to a court case; apprehended and a credible-fear screening for asylum; not apprehended and living out of status; death or harm along the way (shown with care, not graphically).
- **Downstream consequences are modeled from the law I have read:** a person who entered without inspection cannot adjust status through marriage or employment (adjustment requires being inspected and admitted or paroled, and 245(i) is closed to recent arrivals); removal and reentry bring the permanent-bar rules; the paths that remain are asylum and other relief, a long court process, or returning home.
- **Informal work** (section 2) is the main economic path for people who stay without status, with the same documented risks.
- **Protagonists are adults.** Children appear as family members and dependents only.
- **Support screen:** an in-game "if this is your story" page pointing to legal-aid directories and free legal help, since players may be living parts of this.
- **Reality setting** applies here too. Hopeful, Honest and Hard modes change the odds, never the facts.

**Research and law checks:** border data by country and year, the asylum and removal process, outcome statistics, the policy timeline 2015-2026 (for example the pandemic-era expulsions, remain-in-Mexico, appointment-based entry, and the 2025 changes: all to be verified), and the statutes on improper entry, reentry after removal, expedited removal and asylum.
