# Ansai GitHub Stats

A self-hosted GitHub stats card that counts **public and private work** — bento layout, glass panels, one honest grade.

Public stats cards only see public repositories. Most of the real work lives in private repos, so the public grade undersells the engineer. This service reads the full record with a server-side token and renders one card: every commit, every pull request, public and private.

## How it works
- `service/api/card.js` — a Vercel serverless function. Calls the GitHub GraphQL + search APIs with `GITHUB_TOKEN` (server-side only), computes totals, streak, languages and the grade (standard ranking formula on full data), and returns an SVG. CDN-cached for 6 hours.
- `service/index.html` — the landing page at [stats.ansaitechnologies.co.ke](https://stats.ansaitechnologies.co.ke).
- `build.py` + `data.json` — the offline prototype that produced the first render.

## Embed
```md
![GitHub stats — full data](https://stats.ansaitechnologies.co.ke/api/card.svg)
```

## Setup
1. Deploy `service/` to Vercel.
2. Set the `GITHUB_TOKEN` environment variable (a GitHub token with read access to the account's repos).
3. Redeploy. The card goes live at `/api/card.svg`.
