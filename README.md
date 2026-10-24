# Xuhui Lu — Academic Homepage

Personal academic homepage: https://xuhuilu.github.io/

A dependency-free, responsive academic page with a warm paper palette, research-focused editorial layout, and optional country-level visitor statistics.

## Update the website

Edit `index.html` for biography, publications, research, and experience. Shared styles and interactions are in `assets/`. Replace `cv.pdf` to update the CV. Changes pushed to `main` automatically redeploy through GitHub Pages; no build step is required.

## Local preview

Run `python -m http.server 8000` in this directory, then open `http://localhost:8000`. Keep `cv.pdf` in the same directory.

## Privacy-conscious visitor map (optional)

The visitor module uses **GoatCounter aggregate statistics** and **Tencent Maps**. It displays only country-level counts at approximate country anchors—not individual visitors or precise coordinates. GoatCounter states that it does not store IP addresses or use tracking cookies; see its [privacy policy](https://www.goatcounter.com/help/privacy).

The map and counters remain in a clearly labelled unconfigured state until you complete these steps:

1. Create a GoatCounter site for `xuhuilu.github.io`. In its settings, disable individual pageview collection and any statistics categories you do not need. Generate a read-only API token under **Username → API**.
2. In the GitHub repository, open **Settings → Secrets and variables → Actions**:
   - Add secret `GOATCOUNTER_TOKEN` with the API token.
   - Add variable `GOATCOUNTER_CODE` with your GoatCounter subdomain code.
3. In `assets/config.js`, set `goatcounterCode` to the same public subdomain code. This enables the lightweight counter script.
4. Apply for a web JavaScript API key at the [Tencent Location Service Open Platform](https://lbs.qq.com/). Configure a Referer/domain whitelist for `https://xuhuilu.github.io/*`, then replace `tencentMapKey` in `assets/config.js`. A worldwide map requires an appropriately enabled key. Do not use unrestricted keys.
5. Open **Actions → Update aggregate visitor statistics → Run workflow** for the first export. It subsequently updates `data/visitor-stats.json` weekly. The export script uses only the standard Python library; the token stays in GitHub Secrets and is never shipped to browsers.

To test the export locally, set `GOATCOUNTER_CODE` and `GOATCOUNTER_TOKEN` in your shell environment and run `python scripts/export_visitor_stats.py`. Without those variables it exits safely without changing the data file.
