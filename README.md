# AstraZeneca + BMS portfolio fit-or-collision explorer

A static, dependency-free website package for GitHub Pages. The main chart combines stacked late-stage portfolio bars with interactive overlap bubbles. Click a disease-area bar to open an indication-territory × modality-family matrix. Company-only cells show complementarity; split AZ/BMS cells show collision. Clicking any populated matrix cell filters the detailed program table.

## Publish on GitHub Pages

1. Create a new GitHub repository.
2. Upload **all files and folders from this package root** to the repository root.
3. In GitHub, open **Settings → Pages**.
4. Under **Build and deployment**, choose **Deploy from a branch**.
5. Select `main` and `/ (root)`, then save.

The site uses plain HTML, CSS, JavaScript and local data files. No npm installation or build step is required.

## Local preview

From the package folder:

```bash
python -m http.server 8000
```

Then open `http://localhost:8000`.

## Update the data

- `assets/data.js` is the browser-ready data file.
- `data/portfolio_data.json` is the same dataset as JSON.
- `data/fit_collision_matrix.csv` contains the aggregated matrix cells.
- `data/program_matrix_mapping.csv` contains the program-level matrix tags.
- `data/sales_trends.csv` contains reported revenue, analyst projection assumptions and patent / exclusivity events.
- CSV exports are in `data/`.
- The source workbook is in `downloads/`.

After changing the data model, keep `assets/data.js` and `data/portfolio_data.json` synchronized. The included `build_az_bms_website.py` generator in the parent deliverable can be used as the authoritative build path.

## Analytical definitions

- **Late-stage program:** unique lead investigational asset in Phase II or Phase III/pivotal/registration development; approved-indication expansions and major lifecycle-management programs excluded from the core count.
- **Overlap count:** distinct shared territory/class, not all possible asset-pair permutations.
- **Launch window:** illustrative analyst scenario from trial primary-completion timing plus a stage-specific lag; not company guidance.
- **Brand context:** the program table distinguishes an approved asset brand from a marketed component or related franchise.
- **Sales trajectory:** relevant marketed brands are overlaid in one chart on a linear revenue scale. Solid segments are company-reported worldwide revenue and dashed segments are transparent analyst scenarios. Product-specific patent / exclusivity events are shown as red diamonds and incorporated into the forecast assumptions.
- **Forecast caveat:** projections are not company guidance or consensus estimates; 2026E generally annualizes H1 2026 and later years use disclosed assumptions.

## License and trademarks

The website code is provided under the MIT License. AstraZeneca and Bristol Myers Squibb names are used descriptively; all trademarks remain the property of their respective owners. The package does not include company logo artwork.

## Refresh an existing GitHub Pages site

1. Extract the updated ZIP.
2. Open the repository root and choose **Add file → Upload files**.
3. In Windows File Explorer, open the extracted folder, press **Ctrl+A**, and drag the full selection directly onto GitHub's upload area. Do not use the Windows **Open** dialog, which cannot select folders.
4. Commit directly to `main`. Existing files with the same paths will be replaced and new matrix files will be added.
5. Check the **Actions** tab for a green Pages deployment, then hard-refresh the live site with **Ctrl+F5**.
