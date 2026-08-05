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
- `historicalSales`: investigational assets are marked as not launched.

## `commercial_benchmarks.csv`
Company-reported brand revenue used only to illustrate franchise scale. Figures are generally worldwide and not indication-specific.

## `fit_collision_matrix.csv`
One row per populated indication-territory × modality-family matrix cell. `status` is `az-only`, `bms-only`, or `overlap`; the company program lists support each cell.

## `program_matrix_mapping.csv`
One row per program × normalized indication-territory assignment. Multi-indication programs appear on multiple rows.
