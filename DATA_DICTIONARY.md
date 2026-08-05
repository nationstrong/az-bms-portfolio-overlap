# Data dictionary

## `chart_data.csv`
One row per disease-area × overlap-factor chart cell.

- `overlapCount`: distinct overlap units represented by bubble size/label.
- `intensity`: analyst-coded directness from 0 to 3.
- `azPrograms`, `bmsPrograms`: late-stage program counts in the stacked bar.

## `overlap_units.csv`
One row per exact shared territory/class. This is the evidence behind each bubble count.

## `program_details.csv`
One row per program in the curated trial-level detail set, plus pipeline-snapshot fields for the broader mapped portfolio.

- `potentialLaunchIndication`: potential first indication inferred from the representative study, not company guidance.
- `illustrativeLaunchWindow`: trial primary-completion year plus a stage-specific lag.
- `brandName`: approved brand or marketed component / related franchise where available.
- `brandRelationship`: distinguishes an approved asset brand from a marketed combination backbone or contextual franchise.
- `historicalSales`: asset-level launch status or the clearly labeled sales context for the marketed component.
- `salesTrendIds`: links a program row to relevant marketed-brand trajectory cards.

## `commercial_benchmarks.csv`
Company-reported brand revenue used only to illustrate franchise scale. Figures are generally worldwide and not indication-specific.

## `fit_collision_matrix.csv`
One row per populated indication-territory × modality-family matrix cell. `status` is `az-only`, `bms-only`, or `overlap`; the company program lists support each cell.

## `program_matrix_mapping.csv`
One row per program × normalized indication-territory assignment. Multi-indication programs appear on multiple rows.


## `sales_trends.csv`
One row per product-period. Reported history and analyst projections are separated by `status`. `growthVsPrior`, `projectionBasis`, `patentSummary` and `patentEvents` make the assumptions auditable. Revenue is worldwide USD millions unless stated otherwise.
