// Ansai GitHub Stats — self-hosted, full-data (public + private) bento glass card.
// Serves an SVG computed live from the GitHub API using GITHUB_TOKEN (server-side only).
const LOGIN = "IamAmasai";
const NAME = "Melchizedek Amasai";

async function gh(path, token, isGraphql, body) {
  const r = await fetch("https://api.github.com" + path, {
    method: isGraphql ? "POST" : "GET",
    headers: {
      Authorization: "Bearer " + token,
      Accept: "application/vnd.github+json",
      "Content-Type": "application/json",
      "User-Agent": "ansai-github-stats",
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!r.ok) throw new Error("github " + r.status + " on " + path);
  return r.json();
}

function cdf(x, m) { return 1 - Math.pow(2, -x / m); }

function gradeFor(d) {
  const parts = [
    [d.commits, 1000, 2], [d.prs, 50, 3], [d.issues, 25, 1],
    [d.reviews, 2, 1], [d.stars, 50, 4], [d.followers, 10, 1],
  ];
  const score = parts.reduce((a, [x, m, w]) => a + w * cdf(x, m), 0) / 12;
  const pct = (1 - score) * 100;
  const levels = [[1, "S"], [12.5, "A+"], [25, "A"], [37.5, "A-"], [50, "B+"], [62.5, "B"], [75, "B-"], [87.5, "C+"], [101, "C"]];
  return { grade: levels.find(([t]) => pct <= t)[1], pct };
}

async function collect(token) {
  const q = `query { user(login: "${LOGIN}") { followers { totalCount }
    contributionsCollection { totalPullRequestReviewContributions contributionCalendar { totalContributions weeks { contributionDays { contributionCount } } } }
    repositories(ownerAffiliations: OWNER, isFork: false, first: 100) { totalCount nodes { stargazerCount languages(first: 5, orderBy: {field: SIZE, direction: DESC}) { edges { size node { name } } } } } } }`;
  const g = await gh("/graphql", token, true, { query: q });
  const u = g.data.user;
  const [commits, prs, issues] = await Promise.all([
    gh(`/search/commits?q=author:${LOGIN}&per_page=1`, token),
    gh(`/search/issues?q=author:${LOGIN}+type:pr&per_page=1`, token),
    gh(`/search/issues?q=author:${LOGIN}+type:issue&per_page=1`, token),
  ]);
  const days = u.contributionsCollection.contributionCalendar.weeks.flatMap(w => w.contributionDays);
  let best = 0, run = 0;
  for (const d of days) { run = d.contributionCount > 0 ? run + 1 : 0; best = Math.max(best, run); }
  run = 0;
  for (const d of [...days].reverse()) { if (d.contributionCount > 0) run++; else if (run > 0) break; }
  const langs = {};
  for (const n of u.repositories.nodes) for (const e of (n.languages || {}).edges || []) langs[e.node.name] = (langs[e.node.name] || 0) + e.size;
  const topLangs = Object.entries(langs).sort((a, b) => b[1] - a[1]).slice(0, 5);
  const langTotal = topLangs.reduce((a, [, v]) => a + v, 0);
  return {
    commits: commits.total_count, prs: prs.total_count, issues: issues.total_count,
    reviews: u.contributionsCollection.totalPullRequestReviewContributions,
    followers: u.followers.totalCount,
    contrib: u.contributionsCollection.contributionCalendar.totalContributions,
    repos: u.repositories.totalCount,
    stars: u.repositories.nodes.reduce((a, n) => a + n.stargazerCount, 0),
    streak: run, best,
    activeDays: days.filter(d => d.contributionCount > 0).length,
    days: days.slice(-371),
    langs: topLangs.map(([n, v]) => [n, Math.round(1000 * v / langTotal) / 10]),
  };
}

const esc = s => String(s).replace(/&/g, "&amp;");
const LANG_COLORS = { HTML: "#E8B33C", TypeScript: "#3178C6", Python: "#4B8BBE", JavaScript: "#F1E05A", CSS: "#8B5CF6" };

function panel(x, y, w, h, inner) {
  return `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="22" fill="#FFFFFF" fill-opacity="0.055" stroke="#FFFFFF" stroke-opacity="0.14"/><g transform="translate(${x + 24},${y + 24})">${inner}</g>`;
}
const K = t => `<text font-size="13" letter-spacing="3" fill="#C9CEDA" font-weight="700">${esc(t)}</text>`;
const BIG = (t, gold) => `<text y="66" font-size="56" font-weight="800" fill="${gold ? "#E8B33C" : "#F4EFE6"}">${esc(t)}</text>`;
const SUB = (lines) => lines.map((t, i) => `<text y="${96 + i * 22}" font-size="15" fill="#A7AEC2">${esc(t)}</text>`).join("");

function render(d) {
  const { grade, pct } = gradeFor(d);
  const circ = 2 * Math.PI * 86;
  const heat = d.days.map((day, i) => {
    const col = Math.floor(i / 7), row = i % 7, c = day.contributionCount;
    const fill = c === 0 ? "#1E293B" : c < 3 ? "#7A4E12" : c < 6 ? "#B45309" : c < 10 ? "#E8B33C" : "#F5D67A";
    return `<rect x="${52 + col * 21.4}" y="${716 + row * 21.4}" width="17" height="17" rx="3.5" fill="${fill}"/>`;
  }).join("");
  const langBar = (() => { let x = 0; return d.langs.map(([n, p]) => { const w = 536 * p / 100; const s = `<rect x="${x}" y="34" width="${w}" height="14" fill="${LANG_COLORS[n] || "#64748B"}"/>`; x += w; return s; }).join(""); })();
  const langLegend = d.langs.map(([n, p], i) => `<g transform="translate(${(i % 3) * 190},${66 + Math.floor(i / 3) * 26})"><circle r="5" cy="-4" fill="${LANG_COLORS[n] || "#64748B"}"/><text x="12" font-size="14.5" fill="#C9CEDA">${esc(n)} · ${p}%</text></g>`).join("");
  return `<svg xmlns="http://www.w3.org/2000/svg" width="1240" height="972" viewBox="0 0 1240 972" font-family="'Segoe UI',system-ui,-apple-system,Roboto,sans-serif">
<defs>
<radialGradient id="b1" cx="50%" cy="50%" r="50%"><stop offset="0%" stop-color="#B45309" stop-opacity="0.5"/><stop offset="100%" stop-color="#B45309" stop-opacity="0"/></radialGradient>
<radialGradient id="b2" cx="50%" cy="50%" r="50%"><stop offset="0%" stop-color="#1D4ED8" stop-opacity="0.35"/><stop offset="100%" stop-color="#1D4ED8" stop-opacity="0"/></radialGradient>
<radialGradient id="b3" cx="50%" cy="50%" r="50%"><stop offset="0%" stop-color="#E8B33C" stop-opacity="0.2"/><stop offset="100%" stop-color="#E8B33C" stop-opacity="0"/></radialGradient>
</defs>
<rect width="1240" height="972" fill="#070B14"/>
<circle cx="1180" cy="60" r="330" fill="url(#b1)"/><circle cx="40" cy="900" r="300" fill="url(#b2)"/><circle cx="880" cy="940" r="190" fill="url(#b3)"/>
${panel(28, 28, 300, 408, `
  <circle cx="126" cy="150" r="86" fill="none" stroke="#2A3040" stroke-width="16"/>
  <circle cx="126" cy="150" r="86" fill="none" stroke="#E8B33C" stroke-width="16" stroke-linecap="round" stroke-dasharray="${(100 - pct) / 100 * circ} ${circ}" transform="rotate(-90 126 150)"/>
  <text x="126" y="172" text-anchor="middle" font-size="62" font-weight="800" fill="#E8B33C">${grade}</text>
  <text x="126" y="316" text-anchor="middle" font-size="13" letter-spacing="3" fill="#C9CEDA" font-weight="700">FULL-DATA GRADE</text>
  <text x="126" y="346" text-anchor="middle" font-size="15" fill="#A7AEC2">Public + private work,</text>
  <text x="126" y="368" text-anchor="middle" font-size="15" fill="#A7AEC2">one honest count</text>`)}
${panel(344, 28, 552, 196, `
  ${K("GITHUB · @" + LOGIN.toUpperCase())}
  <text y="52" font-size="37" font-weight="800" fill="#F4EFE6">${esc(NAME)}</text>
  <text y="88" font-size="15.5" fill="#A7AEC2">Software engineer &amp; systems thinker — founder, Ansai Technologies.</text>
  <text y="112" font-size="15.5" fill="#A7AEC2">Building agentic infrastructure from Nairobi.</text>`)}
${panel(912, 28, 300, 196, `${K("COMMITS · ALL TIME")}${BIG(d.commits.toLocaleString("en-US"), true)}${SUB(["Including private repos — the", "public card sees a fraction"])}`)}
${panel(344, 240, 268, 196, `${K("CURRENT STREAK")}${BIG(d.streak + " days")}${SUB(["Longest streak too —", "still running"])}`)}
${panel(628, 240, 268, 196, `${K("PULL REQUESTS")}${BIG(d.prs, true)}${SUB(["Across personal +", "org repos"])}`)}
${panel(28, 452, 584, 196, `${K("LANGUAGES · BY CODE VOLUME")}${langBar}${langLegend}`)}
${panel(628, 452, 268, 196, `${K("CONTRIBUTIONS · LAST YEAR")}${BIG(d.contrib.toLocaleString("en-US"))}${SUB([d.activeDays + " active days · " + d.repos + " repos", "owned · " + d.stars + " stars · " + d.followers + " followers"])}`)}
${panel(28, 664, 1184, 252, `${K("THE YEAR IN COMMITS")}`)}
${heat}
<text x="1212" y="952" text-anchor="end" font-size="12" letter-spacing="2" fill="#7C8499">ANSAI · SELF-HOSTED STATS — PRIVATE WORK COUNTED</text>
</svg>`;
}

function placeholder() {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="1240" height="300" viewBox="0 0 1240 300" font-family="system-ui,sans-serif"><rect width="1240" height="300" fill="#070B14"/><rect x="28" y="28" width="1184" height="244" rx="22" fill="#FFFFFF" fill-opacity="0.055" stroke="#FFFFFF" stroke-opacity="0.14"/><text x="620" y="140" text-anchor="middle" font-size="30" font-weight="800" fill="#F4EFE6">Ansai GitHub Stats</text><text x="620" y="178" text-anchor="middle" font-size="16" fill="#A7AEC2">Service is up — waiting for its GitHub token to be set (GITHUB_TOKEN).</text></svg>`;
}

module.exports = async (req, res) => {
  const token = process.env.GITHUB_TOKEN;
  res.setHeader("Content-Type", "image/svg+xml");
  res.setHeader("Cache-Control", "public, s-maxage=21600, stale-while-revalidate=86400");
  if (!token) { res.status(200).send(placeholder()); return; }
  try {
    const d = await collect(token);
    res.status(200).send(render(d));
  } catch (e) {
    res.setHeader("Cache-Control", "no-store");
    res.status(200).send(placeholder());
  }
};
