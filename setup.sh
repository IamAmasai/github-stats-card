#!/usr/bin/env bash
# Ansai GitHub Stats — one-command setup.
# Deploys your own full-data GitHub stats card to your Vercel account.
# Usage:  curl -fsSL https://raw.githubusercontent.com/IamAmasai/github-stats-card/main/setup.sh | bash
#     or: bash setup.sh   (from a clone of this repo)
set -euo pipefail

REPO_URL="https://github.com/IamAmasai/github-stats-card.git"
WORKDIR="${TMPDIR:-/tmp}/ansai-github-stats-setup"

say() { printf '\n\033[1m%s\033[0m\n' "$*"; }

command -v git >/dev/null || { echo "git is required — install it first: https://git-scm.com/downloads"; exit 1; }
command -v npx >/dev/null || { echo "Node.js (with npx) is required — install it first: https://nodejs.org"; exit 1; }

say "1/5  Your details"
read -rp "GitHub username: " STATS_LOGIN
read -rp "Name to show on the card: " STATS_NAME
read -rp "Tagline (optional, press Enter to skip): " STATS_TAGLINE || true

say "2/5  Your GitHub token (read-only in practice — the card only reads)"
echo "Create a CLASSIC token with ONLY the 'repo' scope ticked, then paste it below."
echo "Token page: https://github.com/settings/tokens/new?scopes=repo&description=ansai-github-stats"
read -rsp "Paste token (input hidden): " GITHUB_TOKEN; echo
[ -n "$GITHUB_TOKEN" ] || { echo "No token given — stopping."; exit 1; }

say "3/5  Getting the code"
rm -rf "$WORKDIR"; git clone -q --depth 1 "$REPO_URL" "$WORKDIR"
cd "$WORKDIR"

say "4/5  Deploying to your Vercel (sign in when the CLI asks)"
npx --yes vercel link --yes >/dev/null
printf '%s' "$GITHUB_TOKEN" | npx --yes vercel env add GITHUB_TOKEN production >/dev/null
printf '%s' "$STATS_LOGIN"  | npx --yes vercel env add STATS_LOGIN production >/dev/null
printf '%s' "$STATS_NAME"   | npx --yes vercel env add STATS_NAME production >/dev/null
[ -n "${STATS_TAGLINE:-}" ] && { printf '%s' "$STATS_TAGLINE" | npx --yes vercel env add STATS_TAGLINE production >/dev/null; } || true
DEPLOY_URL="$(npx --yes vercel deploy --prod | tail -1)"
unset GITHUB_TOKEN

say "5/5  Done — your card is live"
echo "Card:    ${DEPLOY_URL}/api/card.svg"
echo "Embed in your GitHub profile README:"
echo
echo "![GitHub stats — full data](${DEPLOY_URL}/api/card.svg)"
echo
echo "Tip: add a custom domain in Vercel (Settings → Domains) for a cleaner URL."
