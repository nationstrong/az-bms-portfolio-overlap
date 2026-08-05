# AstraZeneca + BMS portfolio collision explorer

A static, dependency-free website package for GitHub Pages. The main chart reproduces the stacked late-stage portfolio bars and interactive overlap bubbles. Clicking a bubble scrolls to the evidence table and exposes the exact indication, modality, target/mechanism or stage units behind the count.

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
- CSV exports are in `data/`.
- The source workbook is in `downloads/`.

After changing the data model, keep `assets/data.js` and `data/portfolio_data.json` synchronized. The included `build_az_bms_website.py` generator in the parent deliverable can be used as the authoritative build path.

## Analytical definitions

- **Late-stage program:** unique lead investigational asset in Phase II or Phase III/pivotal/registration development; approved-indication expansions and major lifecycle-management programs excluded from the core count.
- **Overlap count:** distinct shared territory/class, not all possible asset-pair permutations.
- **Launch window:** illustrative analyst scenario from trial primary-completion timing plus a stage-specific lag; not company guidance.
- **Historical sales:** investigational assets have no historical sales. Company-reported brand revenue is used only as contextual scale and is generally not indication-specific.

## License and trademarks

The website code is provided under the MIT License. AstraZeneca and Bristol Myers Squibb names are used descriptively; all trademarks remain the property of their respective owners. The package does not include company logo artwork.
