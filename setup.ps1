# Ansai GitHub Stats - one-command setup (Windows / PowerShell).
# Deploys your own full-data GitHub stats card to your Vercel account.
# Run from a clone of this repo, or:
#   irm https://raw.githubusercontent.com/IamAmasai/github-stats-card/main/setup.ps1 | iex
$ErrorActionPreference = "Stop"
$RepoUrl = "https://github.com/IamAmasai/github-stats-card.git"
$Workdir = Join-Path $env:TEMP "ansai-github-stats-setup"

if (-not (Get-Command git -ErrorAction SilentlyContinue)) { throw "git is required - install it first: https://git-scm.com/downloads" }
if (-not (Get-Command npx -ErrorAction SilentlyContinue)) { throw "Node.js (with npx) is required - install it first: https://nodejs.org" }

Write-Host "`n1/5  Your details" -ForegroundColor White
$StatsLogin = Read-Host "GitHub username"
$StatsName  = Read-Host "Name to show on the card"
$StatsTagline = Read-Host "Tagline (optional, press Enter to skip)"

Write-Host "`n2/5  Your GitHub token (the card only reads)" -ForegroundColor White
Write-Host "Create a CLASSIC token with ONLY the 'repo' scope ticked, then paste it below."
Write-Host "Token page: https://github.com/settings/tokens/new?scopes=repo&description=ansai-github-stats"
$Secure = Read-Host "Paste token" -AsSecureString
$GithubToken = [Runtime.InteropServices.Marshal]::PtrToStringAuto([Runtime.InteropServices.Marshal]::SecureStringToBSTR($Secure))
if (-not $GithubToken) { throw "No token given - stopping." }

Write-Host "`n3/5  Getting the code" -ForegroundColor White
if (Test-Path $Workdir) { Remove-Item -Recurse -Force $Workdir }
git clone -q --depth 1 $RepoUrl $Workdir
Set-Location $Workdir

Write-Host "`n4/5  Deploying to your Vercel (sign in when the CLI asks)" -ForegroundColor White
npx --yes vercel link --yes | Out-Null
$GithubToken | npx --yes vercel env add GITHUB_TOKEN production | Out-Null
$StatsLogin  | npx --yes vercel env add STATS_LOGIN production | Out-Null
$StatsName   | npx --yes vercel env add STATS_NAME production | Out-Null
if ($StatsTagline) { $StatsTagline | npx --yes vercel env add STATS_TAGLINE production | Out-Null }
$DeployUrl = (npx --yes vercel deploy --prod | Select-Object -Last 1).Trim()
$GithubToken = $null

Write-Host "`n5/5  Done - your card is live" -ForegroundColor White
Write-Host "Card:    $DeployUrl/api/card.svg"
Write-Host "Embed in your GitHub profile README:`n"
Write-Host "![GitHub stats - full data]($DeployUrl/api/card.svg)"
Write-Host "`nTip: add a custom domain in Vercel (Settings - Domains) for a cleaner URL."
