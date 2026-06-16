# GitHub Pages Implementation Plan: SOC Maturity Jeopardy

> Planning document for turning Hunt Jeopardy into a browser-playable, GitHub Pages-hosted
> game that assesses SOC maturity across all seven security operations functions.

---

## 1. Goal

Today the repo contains markdown-only Jeopardy boards (`game/class-{1,2,3}/{schema,sit,non-prod,uat,prod}/jeopardy-matrix.md`)
covering 10 ATT&CK-aligned hunt types × 4 domains, scored on a **CTI → Hunt → Detection trifecta**.

The new goal: a **static site on GitHub Pages** where each Jeopardy item exercises one of
**seven SOC functions**, and the act of playing produces a **maturity assessment** for each
function (and a rolled-up SOC-CMM-style score), using real, citable capability maturity
models — not an invented scoring scheme.

---

## 2. Three inputs that generate Jeopardy content

| Input | What it determines | Existing repo tie-in |
|---|---|---|
| **Known capabilities & service offerings** (SOC-CMM service catalog, **MITRE INFORM**) | *Which* capabilities are even in scope to quiz on — seeds the foundational/Tier 1-2 clues per function | New — needs a capability/service inventory doc |
| **Priority Intelligence Requirements (PIRs)** | *Which* threats/techniques/domains appear on a given campaign's board, keeping the game aligned to leadership's stated intel priorities | Maps to the existing `class-1/2/3` campaign concept and hunt-type selection |
| **Threat landscape analysis** | Drives the *advanced/innovative* Tier 3-4 clues (emerging TTPs) and which domains carry higher risk multipliers | Maps to the existing env/privilege multiplier mechanic already in `jeopardy-matrix.md` |

These three feed a single **content authoring workflow** (Section 8) rather than three separate systems.

---

## 3. SOC function → maturity model mapping

Each of the 7 components gets its own real, named CMM. Point-tier rows on the board (5 tiers,
Jeopardy-style) map onto each model's maturity levels — convenient because nearly all of these
models have 4-5 levels already.

| # | SOC Function | Maturity Model | Levels | Source |
|---|---|---|---|---|
| 1 | **CTI** (informing the SOC) | **CTI-CMM** | CTI0 Pre-Foundational → CTI1 Foundational → CTI2 Established → CTI3 Advanced | cti-cmm.org |
| 2 | **Threat Hunting** (hypothesis testing, baselining) | **Hunting Maturity Model (HMM)** | HM0 Initial → HM1 Minimal → HM2 Procedural → HM3 Innovative → HM4 Leading | David Bianco / Sqrrl |
| 3 | **Detection Engineering** | **Detection Engineering Maturity Matrix** | Ad hoc → Repeatable → Detection-as-Code → Continuous/optimized | Kyle Bailey |
| 4 | **Engagement** (SOC + cyber threat emulation) | **SCYTHE Purple Team Maturity Model** | 5 levels across *Threat Understanding* × *Detection Understanding* axes | SCYTHE PTEF |
| 5 | **Digital Forensics** (artifact collection & analysis) | **Digital Forensic Readiness & Maturity Model (DFR&MM)**, grounded in **ISO/IEC 27043** | 5 levels, Ad hoc → Optimized | Academic / ISO |
| 6 | **Incident Response** (automation & process) | **SIM3** | 44 parameters across Organization / Human / Tools / Process, each 0-4 | Open CSIRT Foundation / FIRST |
| 7 | **Security Engineering** (controls + architecture reassessment) | **OWASP SAMM v2** | 0-3 per practice across Governance / Design / Implementation / Verification / Operations | OWASP |
| ⮑ | **Overall SOC roll-up — service/process maturity** | **SOC-CMM** | 0-5 across Business / People / Process / Technology / Services | Rob van Os, soc-cmm.com |
| ⮑ | **Overall SOC roll-up — threat-informed maturity** | **MITRE INFORM** | Weighted dimensions/components across the 3 Dimensions of Threat-Informed Defense, each with a least→most threat-informed maturity spectrum | MITRE Center for Threat-Informed Defense, v2.0 (Jan 2026) |

**Correction — "MITRE Inform" is real.** Confirmed at
[center-for-threat-informed-defense.github.io/inform](https://center-for-threat-informed-defense.github.io/inform/)
and [ctid.mitre.org/inform](https://ctid.mitre.org/inform): **MITRE INFORM** is CTID's
Threat-Informed Defense maturity model (v2.0, updated January 2026 after two years of
operational use). It scores an organization across 3 Dimensions of Threat-Informed Defense,
each broken into technical components, each component scored on a least-to-most
threat-informed maturity spectrum. This sits alongside SOC-CMM as a second overall-rollup
anchor: SOC-CMM measures service/process maturity, INFORM measures how well those services
are actually *driven by adversary intelligence* — which maps directly onto the "known
capabilities & service offerings" content input in Section 2, and onto the CTI/Threat
Hunting/Detection Engineering columns specifically (those are the functions INFORM most
directly assesses).

### Supplementary content-source frameworks

These aren't maturity models, but they're real, citable sources for writing concrete
clue/answer content once a tier/level is chosen for a given cell:

| Function | Source | What it provides |
|---|---|---|
| Detection Engineering | **MITRE CAR** (Cyber Analytics Repository) | Concrete, ATT&CK-mapped analytics with documented data sources/sensors — good source for "what does a Tier-3 detection actually look like" clues |
| Threat Hunting | **Threat Hunter Playbook** + **OSSEM** | A documented hunt lifecycle and a data-source/field dictionary — good source for the data-baselining and hypothesis-structure clues HMM Tier 2-3 calls for |
| Incident Response | **RE&CT / ATC-React** | A knowledge base of actionable Response Actions/Playbooks organized by response stage, explicitly built to support IR process maturity assessment — pairs with SIM3 (SIM3 scores the *program*, RE&CT supplies the *runbook content* for IR clues) |
| Engagement | **MITRE Engage** | Deception/denial/adversary-engagement framework — secondary source if a future board wants a deception-specific cell, distinct from the SCYTHE Purple Team axis used for the primary Engagement column |
| Security Engineering | **D3FEND** | Defensive-technique ontology — useful for control-mapping clues (which D3FEND technique implements a given SAMM practice) |

---

## 4. Board design

A board is **7 categories (columns) × 5 tiers (rows) = 35 cells**, same Jeopardy shape as
today's matrix but with categories = SOC functions instead of hunt-type rows.

The existing technique-grounded content naturally splits the board into two halves:

- **Operational half** — CTI, Threat Hunting, Detection Engineering. Clues stay grounded in
  the existing ATT&CK-technique × domain matrix (the current trifecta deliverables literally
  become the clue/answer content for these three columns, tier = maturity level of the
  deliverable, e.g. "approved task catalog" = Tier 2, "anomaly threshold tuning automation" =
  Tier 4).
- **Programmatic half** — Engagement, DFIR, Incident Response, Security Engineering. Clues
  are grounded directly in their CMM's parameters/practices (SIM3 parameters, SAMM practices,
  Purple Team levels, DFR&MM levels) rather than per-technique, since these are SOC-program
  capabilities rather than per-TTP hunts.

Point values per tier carry the existing environment/privilege multiplier mechanic already
defined in `jeopardy-matrix.md` (e.g., 945/630/315 pts by domain), unchanged.

---

## 5. Data model

Move from markdown-as-source to **JSON-as-source**, with markdown becoming a generated,
human-readable view (keeps the existing files useful, but content gets authored once).

```
data/
  functions.json         # the 7 SOC functions + their CMM metadata (levels, descriptions, source URL)
  campaigns/
    class-1.json
    class-2.json
    class-3.json
```

`functions.json` (excerpt):
```json
{
  "threat_hunting": {
    "label": "Threat Hunting",
    "model": "Hunting Maturity Model (HMM)",
    "source": "https://www.sans.org/tools/hunting-maturity-model",
    "levels": ["HM0 Initial", "HM1 Minimal", "HM2 Procedural", "HM3 Innovative", "HM4 Leading"]
  }
}
```

`campaigns/class-1.json` (excerpt, one cell):
```json
{
  "environment": "schema",
  "categories": ["cti", "threat_hunting", "detection_engineering", "engagement", "dfir", "incident_response", "security_engineering"],
  "cells": [
    {
      "category": "threat_hunting",
      "tier": 2,
      "domain": "active_directory",
      "points": 630,
      "mitre": "T1053",
      "clue": "This deliverable catalogs which scheduled tasks are expected per system role, used to flag deviations.",
      "answer": "Approved scheduled task catalog",
      "maturity_level": "HM2 Procedural"
    }
  ]
}
```

---

## 6. Site architecture (GitHub Pages)

No backend, no build step required — keeps GH Pages deployment trivial.

```
/docs                     <- GitHub Pages source (Settings > Pages > Deploy from branch: main /docs)
  index.html              # campaign/class picker
  board.html              # the game board + engine
  report.html             # post-game maturity report (radar/bar chart)
  assets/
    css/style.css
    js/
      board.js            # fetch campaign JSON, render grid, handle clue modal, scoring
      maturity.js         # per-function tier success -> assessed maturity level, SOC-CMM rollup
      radar.js            # hand-rolled SVG radar chart (avoid adding a chart dependency)
  data/                   # JSON described in Section 5
```

- Plain HTML/CSS/vanilla JS — zero build pipeline, fastest path to a working GH Pages site.
- `fetch()` loads `data/campaigns/class-N.json` client-side; no server, no database.
- State (scores, which cells answered) lives in `localStorage` per session; a "download
  results as JSON" button supports the existing Jira webhook integration described in
  `hunt-jeopardy-jira-guide.md` for teams that want to pipe results into that scoreboard.

---

## 7. Maturity scoring mechanic

1. Each cell answered correctly = evidence the team operates at that cell's tier/maturity level
   for that function.
2. Per function: assessed maturity level = **highest tier where ≥70% of attempted cells were
   correct** (configurable threshold), not just "did they get the top tier."
3. Aggregate the 7 per-function levels into a **SOC-CMM-style radar chart** (Business/People/
   Process/Technology/Services axes are approximated from which functions scored where) on
   `report.html`.
4. Results exportable as JSON for historical tracking across campaign classes (useful since the
   repo already runs multi-year `class-1/2/3` campaigns).

---

## 8. Content authoring workflow

1. Maintain a short **capability/service inventory** doc (new) listing what the SOC currently
   does, mapped to SOC-CMM service-domain aspects and the relevant MITRE INFORM component —
   this seeds which Tier 1-2 clues are even writable per function.
2. Maintain a **PIR list** (new, short doc) — drives which ATT&CK techniques/domains get
   selected into a given campaign class's board.
3. Pull from **threat landscape analysis** (existing case-study references already embedded
   in the matrix, e.g. SolarWinds/XZ Utils) for Tier 3-4 advanced clues.
4. Author clues directly into `campaigns/class-N.json`; markdown views can be regenerated from
   JSON with a small script if the human-readable matrix format is still wanted for review.

---

## 9. Migration plan for existing content

- Existing `class-1/2/3` matrices already contain CTI + Hunt + Detection deliverables per
  hunt-type × domain cell — these become the Tier-mapped clues for the 3 "operational" columns.
  A conversion script extracts each `- [ ] deliverable` bullet into a clue/answer pair with an
  assigned tier (CTI/Hunt/Detection deliverable lists are already roughly ordered low→high
  maturity, e.g. "catalog" before "automated tuning").
- The 4 new "programmatic" columns (Engagement, DFIR, IR, Security Engineering) are authored
  fresh, grounded in their CMM's parameters rather than converted from existing content.
- Existing `sit/non-prod/uat/prod` environment variants stay as-is — they're separate
  `campaigns/*.json` files using the same schema, varying only multipliers/content scope.

---

## 10. Phased roadmap

| Phase | Deliverable |
|---|---|
| 0 | Finalize `functions.json` schema + capability inventory + PIR doc |
| 1 | MVP: single board (`class-1/schema`) as static JSON + working `board.html` game engine, deployed to GH Pages |
| 2 | Convert remaining `class-1/2/3` × 5-environment matrices to JSON; author the 4 new programmatic columns |
| 3 | `report.html` maturity scoring + SOC-CMM radar rollup + JSON export |
| 4 | Polish: multi-team scoring, theming, optional Jira webhook push from `report.html` |

---

## Open assumptions to confirm

- Vanilla HTML/CSS/JS (no framework, no build step) chosen for fastest, dependency-free GitHub Pages deployment — flag if you'd prefer a framework (e.g., for richer UI) instead.
- DFIR has no single dominant industry CMM (unlike the other 6 functions); DFR&MM/ISO 27043 was the best-supported substitute found in research — open to swapping if you know of a model you'd rather standardize on.

## Resolved

- ~~"MITRE Inform" interpreted as ATT&CK + 11 Strategies~~ — corrected: **MITRE INFORM** is a
  real, current Threat-Informed Defense maturity model from CTID (v2.0, Jan 2026). Now used as
  the second overall-rollup anchor alongside SOC-CMM (Section 3). MITRE CAR, Threat Hunter
  Playbook, OSSEM, RE&CT/ATC-React, MITRE Engage, and D3FEND were also incorporated as
  supplementary content sources for specific functions.
