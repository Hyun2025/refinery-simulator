# CrudeFlow B — run and edit guide

## Summary
This static dashboard compares hypothetical crude purchases. Main analyses recalculate in the browser. The LP table and capacity chart use saved Python results. The feasible-region chart is a separate educational example.

## Run and publish
From the project directory, run `python3 -m http.server 8000` and open http://localhost:8000. Publish all project files, including `assets`, to static hosting. No Python calculation server is needed to display the dashboard. Run existing model checks with `node test.js`.

## Read the dashboard
Read the problem and assumptions, then browse decision, mix, prices, operations, finance and LP pages. The candidate panel identifies the mix used for charts and finances. Selecting a map point changes that display; recommendation and benchmark cards remain based on the recommended mix.

Red map outlines identify feasible candidates within 1% of the absolute best profit. Stars identify candidates within $1. Interpolated contours estimate between calculated points; they do not establish results for every continuous mix.

The document viewer offers Korean/English and previous/next documents. Close with X or Escape. Mobile document and control panels open from bottom buttons.

## Regenerate LP results
Install packages with `python3 -m pip install -r analysis/requirements.txt`. Run in order:

1. `node analysis/export.js` — generate operating records.
2. `python3 analysis/optimize.py` — generate the five LP comparisons.
3. `python3 analysis/capacity_sweep.py` — generate workload sensitivity with baseline arrivals fixed.

After model changes, update descriptions and findings as well as saved results. LP uses common inventory valuation and is not directly comparable with the main dashboard score.

## Editing map
|File|Content|
|---|---|
|`index.html`|Titles, problem, assumptions and chart/table explanations|
|`help.js`|Control tooltips|
|`app.js`, `benchmark.js`|Dynamic descriptions and table headings|
|`lp-charts.js`|Capacity/educational chart text and interaction|
|`engine.js`|Fixed operating and accounting rules|
|`analysis/optimize.py`|LP variables, constraints and objective|
|`analysis/capacity_sweep.py`|Capacity sampling range|
|`analysis/*.ko.md`, `analysis/*.en.md`|Bilingual document sources|
|`reader-pages.js`|Page groups and document viewer|
|`mobile.css`, `mobile.js`|Mobile layout and control sheet|
|`theme.css`, `theme.js`|Artwork position, colors, theme and cooling effect|
|`assets/refinery-day.png`, `assets/refinery-night.png`|Static header artwork|
|`resource-links.js`|Future public source/document URLs; empty values stay hidden|

After document changes run `python3 analysis/build_docs.py`. Do not edit generated `docs-data.js` directly. Changing element IDs requires corresponding JavaScript updates. The dashboard has no direct file-download controls.

## Themes, mobile and scope
Light is the default; night mode changes appearance only. Artwork is static. The border cooling effect can be disabled and respects reduced-motion settings. At widths up to 900px, bottom buttons open control/document panels. Comprehensive cross-browser/device checks remain incomplete.

Purchases use 231 candidates and a 60-day model with synthetic coefficients. Quality, maintenance and demurrage are omitted. LP knows future prices and holds arrivals fixed. Consult METHOD and REPORT for interpretation limits.


## Daily contract inputs

Gasoline and diesel inputs default to 5,000 barrels/day and immediately recalculate the main analysis. Empty, negative, fractional or over-120,000 inputs retain the last valid pair. Contract lines and 60-day totals update. Extra-sale caps and opening product inventories do not change. Saved LP results, capacity experiments and reports remain based on 5,000/5,000 contracts; the educational example is independent.

Keep `engine.js` defaults and HTML input values aligned when editing defaults. Python LP reads contract quantities from exported options. Regenerate LP results and revise reports after changing baseline defaults.
