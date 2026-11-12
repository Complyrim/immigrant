# years-family.ts notes

File: `src/engine/content/years-family.ts`. 39 cards, ids `yf-*`, flags `yf_*`. All cards are track `life`, weights 1.2 to 2.5.
"Settled" means every status except F1 and B2. Year band is years since arrival (`band(s, from, to)`).

## Cards

| Card id | Statuses | Year band | Legal source used |
|---|---|---|---|
| yf-parents-older | settled | 3+ | none |
| yf-parent-ill | OPT, STEM_OPT, H1B, O1, LPR, CITIZEN, ASY_PENDING, ASYLEE, NONE (AOS_PENDING left to the existing family.ts card) | 2+ | travel lookbacks below, by status |
| yf-funeral-phone (one time, sets yf_lostParent) | settled | 6+ | travel lookbacks below, by status |
| yf-loss-anniversary | settled, after yf_lostParent | year after the loss onward | none |
| yf-sibling-wedding (one time) | settled | 2 to 14 | travel lookbacks below, by status |
| yf-niece-on-screen | settled | 4+ | none |
| yf-money-ask | settled | 1+ | none |
| yf-how-to-come | settled | 3+ (returns every fifth year) | INA 201(b)(2)(A)(i), INA 203(a) |
| yf-first-language | settled | 6+ | none |
| yf-parent-visits (one time) | settled | 5+ | none (no visa rule stated) |
| yf-trip-home | LPR, CITIZEN | 5+ | INA 101(a)(13)(C)(ii), 8 CFR 211.1(a)(2) for LPR |
| yf-friend-leaves | settled | 3+ | none |
| yf-friend-trouble | settled | 2+ | none |
| yf-newcomer-calls | settled | 5+ | none (pointer to a lawyer or accredited representative, no rule stated) |
| yf-mentor | settled | 8+ | none |
| yf-gathering-place | settled | 1 to 12 | none |
| yf-association | settled | 6+ (elder version 13+) | none |
| yf-volunteer | settled | 2+ | none |
| yf-unkind-kind | settled | 1+ | none (report goes to a community group, not police, so it fits every status) |
| yf-holiday-alone | settled, no child | 1 to 7, Nov and Dec | none |
| yf-holiday-host | settled | 7+, Nov and Dec | none |
| yf-old-friend | settled | 9+ | none |
| yf-neighbour-ages | settled | 9+ | none |
| yf-stand-up-wedding | settled | 4+ | none |
| yf-twenty-years (one time) | settled | 18+ | none |
| yf-grow-old-where | settled | 14+ | none |
| yf-go-back-argument | settled, hasPartner | 3+ | none |
| yf-two-careers | settled, hasPartner | 2 to 16 | none |
| yf-inlaws-call | settled, hasPartner | 2+ | none |
| yf-years-together | settled, hasSpouse | 4+ | none |
| yf-quiet-distance | settled, hasPartner | 6+ | none |
| yf-child-born (one time, sets yf_child and yf_childYear) | settled, hasPartner, player aged 44 or under | 2 to 14 | none |
| yf-grandparents-screen | settled, hasChild, child aged 1 to 10 | follows the child | none |
| yf-home-language | settled, hasChild, child aged 2 to 9 | follows the child | none |
| yf-child-school (one time) | settled, hasChild, child aged 5 to 7 | follows the child | none |
| yf-other-parents | settled, hasChild, child aged 6 to 12 | follows the child | none |
| yf-child-translates | settled, hasChild, child aged 8 to 14 | follows the child | none |
| yf-teen-questions | settled, hasChild, child aged 13 to 17 | follows the child (late years) | travel lookbacks below, by status |
| yf-child-graduation (one time) | settled, hasChild, child aged 18+ | 20+ | NONE only: INA 201(b)(2)(A)(i), INA 245(a), INA 212(a)(9)(B) |

## Legal rules relied on

Travel home is offered as a choice only to LPR and CITIZEN (and, in yf-parent-ill only, to H1B and O1 after seeing a lawyer, with no rule stated). Everyone else gets stay-here choices and one of these lookbacks.

| Rule as written in the cards | Citation | Source |
|---|---|---|
| No status: more than 180 days of unlawful presence then departure brings a 3-year bar; a year or more brings a 10-year bar; the bars start on leaving | INA 212(a)(9)(B) | research/verified-law.md (https://www.law.cornell.edu/uscode/text/8/1182) |
| Pending asylum: leaving without advance parole is presumed abandonment of the application; returning to the country of claimed persecution, even with advance parole, is presumed abandonment unless compelling reasons | 8 CFR 208.8(a), (b) | NEW, opened 2026-11-11: https://www.law.cornell.edu/cfr/text/8/208.8 |
| Pending green card application: leaving without advance parole granted first is treated as abandonment | 8 CFR 245.2(a)(4)(ii)(A) | research/verified-law-family.md (https://www.law.cornell.edu/cfr/text/8/245.2) |
| Since August 13, 2026, travel on advance parole counts as a departure for the unlawful presence bars | USCIS policy, Matter of Delcarmen-Lara | research/rules-verification.md section 8 (https://www.uscis.gov/laws-and-policy/other-resources/unlawful-presence-and-inadmissibility) |
| Asylee may travel abroad only with prior consent | INA 208(c)(1)(C) | research/verified-law-family.md (https://www.law.cornell.edu/uscode/text/8/1158) |
| LPR absent more than 180 days is treated as seeking admission; the card is an entry document only after an absence under one year | INA 101(a)(13)(C)(ii); 8 CFR 211.1(a)(2) | research/verified-law-family.md (https://www.law.cornell.edu/uscode/text/8/1101 , https://www.law.cornell.edu/cfr/text/8/211.1) |
| A citizen may petition for spouse, children, parents (citizen must be 21) and brothers and sisters; cousins, nieces and nephews are not listed | INA 201(b)(2)(A)(i); INA 203(a) | research/verified-law-family.md (https://www.law.cornell.edu/uscode/text/8/1151 , https://www.law.cornell.edu/uscode/text/8/1153) |
| A person never inspected and admitted generally cannot adjust inside the US | INA 245(a) | research/verified-law.md |

## Deliberately not stated (not verified)

- Whether a child born here is a citizen. The graduation lookback says "If your child is a US citizen" and gives only the age-21 petition rule with its limits. No card says a child gives the parent any benefit.
- Visa stamping and re-entry rules for H-1B, O-1, OPT and STEM OPT travel. The lookback says the game has not verified them and to ask a lawyer.
- What a trip to the country fled would mean for an asylee. The lookback says to ask a lawyer.
- Who may give immigration legal advice (8 CFR 292.1 was not opened). The cards only point people to a licensed attorney or accredited representative.
- Visitor visa rules for a visiting parent or grandparent. The text only says a visa came "after two tries".
- All dollar amounts are designed estimates in 2025 dollars passed through `cost(s, n)`. No government fees are used.

## Flags set

yf_parentIll, yf_lostParent, yf_lostYear (number), yf_siblingWed, yf_metNiece, yf_cousinAsked, yf_visitedHome, yf_parentVisited, yf_faithGroup, yf_assocBoard, yf_mentor, yf_twentyYears, yf_child, yf_childYear (number), yf_schoolStarted, yf_homeLanguage, yf_childGraduated.

Flags read from other files: status, marriedCitizen, dating (through `hasSpouse` / `hasPartner`). No salary, jobTitle, marriage or dating flag is set.
