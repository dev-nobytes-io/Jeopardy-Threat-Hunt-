# Hunt CTF

A Jeopardy-style CTF board (categories across, point values down — not the
TV game show) used as a browser-playable assessment of SOC maturity. Each
board maps **crown jewels** (PIR-driven assets) across the top and
**maturity tiers** down the side. Selecting a cell walks the team through a
task for **each of the seven SOC functions** in turn, and every task is
graded against a real, named capability maturity model — answering correctly
is evidence the SOC operates at that maturity level for that function.

Play it live via GitHub Pages, or run it locally — no build step required.

## How it works

- **Columns** are crown-jewel categories derived from Priority Intelligence
  Requirements (e.g. Active Directory, Secrets/Identity, Infrastructure,
  Applications), each tied to a representative MITRE ATT&CK technique and
  weighted by a point multiplier.
- **Rows** are maturity tiers (1 through 5), worth increasing point values.
- Each **cell** bundles one task per SOC function. Opening a cell walks
  through its functions one at a time, splitting the cell's point value
  evenly across them.
- Revealing a task's answer also reveals the maturity level it represents,
  graded against that function's own model:

  | Function | Maturity Model |
  |---|---|
  | CTI | CTI-CMM |
  | Threat Hunting | Hunting Maturity Model (HMM) |
  | Detection Engineering | Detection Engineering Maturity Matrix |
  | Engagement | SCYTHE Purple Team Maturity Model |
  | Digital Forensics | Digital Forensic Readiness & Maturity Model |
  | Incident Response | SIM3 |
  | Security Engineering | OWASP SAMM v2 |

- Teams are added on the board screen and earn points per correctly answered
  function task. A maturity summary rolls up the **highest tier answered
  correctly** for each function, across all crown-jewel columns.
- Progress and scores persist per-campaign in the browser via
  `localStorage`, so a session can be closed and resumed.

## Playing

The live site is served from this repo's GitHub Pages deployment (the
`docs/` folder), which redeploys automatically on every push to `main` via
`.github/workflows/static.yml`.

To run it locally:

```bash
cd docs
python3 -m http.server 8910
```

Then open `http://localhost:8910/` in a browser.

## Project structure

```
docs/                          GitHub Pages site (no build step — plain HTML/CSS/JS)
  index.html                   Landing page, links to campaigns
  board.html                   Game board shell
  assets/css/style.css         Styling
  assets/js/board.js           Board rendering, scoring, and grading logic
  data/functions.json          The 7 SOC functions and their maturity models/tiers
  data/campaigns/*.json        Campaign definitions (categories, points, cells, tasks)

game/                          Source material the campaigns are authored from
  class-1/ class-2/ class-3/   Game "classes", each with schema + per-environment
                                (non-prod/sit/uat/prod) Jeopardy matrices

github-pages-implementation-plan.md   Design notes and roadmap for the Pages build
hunt-jeopardy-jira-guide.md            Guide for wiring findings into Jira
```

## Adding a campaign

A campaign is a JSON file in `docs/data/campaigns/`. It declares the 7
function ids (matching `docs/data/functions.json`), point values per tier,
crown-jewel categories (with icon, multiplier, and ATT&CK mapping), and a
`cells` array — one entry per `(category, tier)` pair, each holding a
`clue`/`answer` task for every function. `board.js` reads the campaign via a
`?campaign=<id>` query parameter on `board.html`.

`class-1-schema`, `class-2-schema`, and `class-3-schema` are implemented,
each using a different representative ATT&CK technique per crown jewel so
the boards don't repeat content. The non-prod/sit/uat/prod environment
variants for each class are still pending the same treatment.

Opening a cell shows all 7 function tasks at once (not one at a time) — each
task can be revealed and graded independently within the same view.
