# Ansai GitHub Stats — the card that counts private work too

A self-hosted GitHub stats card: **bento layout, glass panels, one honest grade — computed on your full record, public and private repositories alike.**

Public stats cards only see public repositories. For many engineers the real work — company systems, client projects, infrastructure — lives in private repos, so the public grade undersells them. This service reads the full record with a server-side token and renders one card: every commit, every pull request, the streak, the languages, and a grade from the standard ranking formula run on complete data.

**Live instance:** [stats.ansaitechnologies.co.ke](https://stats.ansaitechnologies.co.ke) · Card endpoint: `https://stats.ansaitechnologies.co.ke/api/card.svg`

## What the card shows
- Full-data grade (standard ranking formula, full data) with a progress ring
- Commits, all time — private repos included
- Current streak (and whether it is also your longest)
- Pull requests across personal + organisation repos
- Contributions in the last year, active days, repos owned, stars, followers
- Top 5 languages by code volume
- A gold heatmap of the last year of contributions

## How it works
One serverless function (`api/card.js`) does everything:
1. Calls the GitHub GraphQL API (contributions, calendar, repositories, languages) and the search API (all-time commits / PRs / issues) with your token.
2. Computes the totals, streaks, language shares and grade.
3. Returns an SVG. A CDN cache header (6 hours) keeps it fast and the API quiet.

The token never leaves the server. The card shows **totals only** — never private repository names or contents.

## Set up your own

### Fastest — one-click deploy
[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2FIamAmasai%2Fgithub-stats-card&env=GITHUB_TOKEN,STATS_LOGIN,STATS_NAME,STATS_TAGLINE&envDescription=Your%20GitHub%20token%20(classic%2C%20repo%20scope%20only)%20and%20the%20name%20details%20shown%20on%20your%20card.&project-name=github-stats-card)

Vercel will ask for the environment variables listed in step 4 below — have your token (step 2) ready.

### Or — run the setup script
One command answers four prompts (username, name, tagline, token) and deploys for you:

```bash
# macOS / Linux
curl -fsSL https://raw.githubusercontent.com/IamAmasai/github-stats-card/main/setup.sh | bash
```

```powershell
# Windows (PowerShell)
irm https://raw.githubusercontent.com/IamAmasai/github-stats-card/main/setup.ps1 | iex
```

The scripts need `git` and Node.js (`npx`) installed, and a free Vercel account — the Vercel CLI will ask you to sign in the first time. The token is typed hidden, passed straight to Vercel's encrypted env store, and never written to disk.

### Or — set it up by hand

#### 1. Get the code
Fork this repo, or clone it and push it to your own GitHub account.

### 2. Create a GitHub token
The service only reads. Use a **classic** personal access token:
- GitHub → Settings → Developer settings → Personal access tokens → **Tokens (classic)** → Generate new token (classic)
- Tick **only `repo`** — no other scopes
- Set an expiry you are comfortable with (e.g. 1 year) and generate it

> Fine-grained tokens also work for most fields, but they are known to return the contribution calendar empty, which blanks the streak and heatmap. The classic `repo`-only token is the proven path.

### 3. Deploy to Vercel
- [vercel.com](https://vercel.com) → Add New → Project → import the repo
- Framework preset: Other. Deploy. (The app lives at the repo root — no root-directory setting needed.)

Or deploy the repo root with the Vercel CLI / API from any machine.

### 4. Add the environment variables
In the Vercel project → Settings → Environment Variables (Production):

| Key | Required | Value |
|---|---|---|
| `GITHUB_TOKEN` | **Yes** | The token from step 2 |
| `STATS_LOGIN` | No | Your GitHub username (default `IamAmasai`) |
| `STATS_NAME` | No | The name shown on the card |
| `STATS_TAGLINE` | No | First line under your name |
| `STATS_TAGLINE2` | No | Second line under your name |

### 5. Redeploy
Deployments → ⋯ → Redeploy, so the new variables take effect. Your card is now live at:

```
https://<your-domain-or-vercel-url>/api/card.svg
```

### 6. Embed it
In your GitHub profile README (or any Markdown / HTML page):

```md
![GitHub stats — full data](https://<your-domain>/api/card.svg)
```

## Repository layout
- `api/card.js` — the whole service: fetch, compute, render (SVG)
- `index.html` — the landing page
- `vercel.json` — routes `/api/card.svg` to the function
- `setup.sh` / `setup.ps1` — the one-command setup scripts
- `prototype/` — the offline prototype that produced the first render (kept for reference)

## Privacy notes
- The token is read-only in practice: the code only issues GET/GraphQL read queries.
- Store the token only in your host's environment variables — never commit it.
- Anyone who can open your card URL can see your totals. That is the point of a profile card; if you do not want private work counted, use a public-only token (no `repo` scope) and the card will reflect public data only.

## License
MIT — see [LICENSE](LICENSE). Use it, fork it, ship your own.
