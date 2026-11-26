#!/usr/bin/env python3
"""Ansai GitHub stats card — bento + glass, full data (public + private).
Reads data.json, writes card.html (rich page) and card.svg (README-embeddable)."""
import json, math, os

D = json.load(open(os.path.join(os.path.dirname(__file__), "data.json")))

def cdf(x, median):
    return 1 - 2 ** (-x / median)

# github-readme-stats rank formula, run on FULL data (private included)
parts = [
    (D["commits_all"], 1000, 2),   # commits (all-commits median)
    (D["prs_all"], 50, 3),         # pull requests
    (D["issues_all"], 25, 1),      # issues
    (4, 2, 1),                     # reviews (last-year count on file)
    (D["stars"], 50, 4),           # stars
    (D["followers"], 10, 1),       # followers
]
score = sum(w * cdf(x, m) for x, m, w in parts) / sum(w for _, _, w in parts)
pct = (1 - score) * 100
levels = [(1, "S"), (12.5, "A+"), (25, "A"), (37.5, "A-"), (50, "B+"), (62.5, "B"), (75, "B-"), (87.5, "C+"), (101, "C")]
grade = next(l for t, l in levels if pct <= t)
D["grade"], D["grade_pct"] = grade, round(pct, 1)

LANG_COLORS = {"HTML": "#E8B33C", "TypeScript": "#3178C6", "Python": "#4B8BBE", "JavaScript": "#F1E05A", "CSS": "#8B5CF6"}
total_lang = sum(v for _, v in D["languages"])
lang_rows = [(n, round(100 * v / total_lang, 1)) for n, v in D["languages"]]

def heat_cells():
    days = D["calendar"]
    cells, x, y = [], 0, 0
    for i, d in enumerate(days):
        col, row = divmod(i, 7)
        c = d["contributionCount"]
        fill = "#1E293B" if c == 0 else "#7A4E12" if c < 3 else "#B45309" if c < 6 else "#E8B33C" if c < 10 else "#F5D67A"
        cells.append(f'<rect x="{col*21.4}" y="{row*21.4}" width="17" height="17" rx="3.5" fill="{fill}"/>')
    return "".join(cells)

HTML = f"""<!doctype html><html><head><meta charset="utf-8"><style>
*{{margin:0;box-sizing:border-box;font-family:'Segoe UI',system-ui,-apple-system,Roboto,sans-serif}}
body{{width:1240px;height:972px;overflow:hidden;background:#070B14;color:#F4EFE6;position:relative}}
.blob{{position:absolute;border-radius:50%;filter:blur(90px);opacity:.5}}
.b1{{width:560px;height:560px;background:#B45309;top:-220px;right:-120px}}
.b2{{width:480px;height:480px;background:#1D4ED8;bottom:-240px;left:-120px;opacity:.35}}
.b3{{width:300px;height:300px;background:#E8B33C;bottom:-80px;right:280px;opacity:.22}}
.grid{{position:relative;display:grid;grid-template-columns:300px 1fr 1fr 300px;grid-template-rows:196px 196px 196px 252px;gap:16px;padding:28px}}
.glass{{background:rgba(255,255,255,.055);border:1px solid rgba(255,255,255,.14);border-radius:22px;backdrop-filter:blur(14px);padding:22px 24px;box-shadow:0 18px 40px rgba(0,0,0,.35)}}
.k{{font-size:12.5px;letter-spacing:.22em;color:#C9CEDA;font-weight:700;text-transform:uppercase}}
.big{{font-size:56px;font-weight:800;line-height:1.05;margin-top:8px}}
.sub{{font-size:14.5px;color:#A7AEC2;margin-top:6px;line-height:1.45}}
.gold{{color:#E8B33C}}
.grade{{grid-row:span 2;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center}}
.ring{{width:172px;height:172px;border-radius:50%;background:conic-gradient(#E8B33C {100-D['grade_pct']}%,rgba(255,255,255,.12) 0);display:flex;align-items:center;justify-content:center}}
.ring i{{width:140px;height:140px;border-radius:50%;background:#0D1424;display:flex;align-items:center;justify-content:center;font-style:normal;font-size:64px;font-weight:800;color:#E8B33C}}
.who{{grid-column:span 2}}
.who .name{{font-size:37px;font-weight:800;margin-top:6px}}
.langs{{grid-column:span 2}}
.bar{{display:flex;height:14px;border-radius:99px;overflow:hidden;margin:14px 0 12px}}
.bar span{{display:block;height:100%}}
.lrow{{display:flex;flex-wrap:wrap;gap:8px 18px;font-size:14px;color:#C9CEDA}}
.dot{{display:inline-block;width:9px;height:9px;border-radius:50%;margin-right:6px}}
.heat{{grid-column:span 4}}
svg.heat{{margin-top:12px}}
.foot{{position:absolute;bottom:14px;right:30px;font-size:12px;color:#7C8499;letter-spacing:.14em}}
</style></head><body>
<div class="blob b1"></div><div class="blob b2"></div><div class="blob b3"></div>
<div class="grid">
  <div class="glass grade"><div class="ring"><i>{grade}</i></div><div class="k" style="margin-top:16px">Full-data grade</div><div class="sub">Public + private work,<br>one honest count</div></div>
  <div class="glass who"><div class="k">GitHub · @{D['login']}</div><div class="name">{D['name']}</div><div class="sub">Software engineer &amp; systems thinker — founder, Ansai Technologies. Building agentic infrastructure from Nairobi.</div></div>
  <div class="glass"><div class="k">Commits · all time</div><div class="big gold">{D['commits_all']:,}</div><div class="sub">Including private repos — the public card sees a fraction of this</div></div>
  <div class="glass"><div class="k">Current streak</div><div class="big">{D['streak_current']} days</div><div class="sub">Longest streak too — still running</div></div>
  <div class="glass"><div class="k">Pull requests</div><div class="big gold">{D['prs_all']}</div><div class="sub">Across personal + org repos</div></div>
  <div class="glass langs"><div class="k">Languages · by code volume</div><div class="bar">{''.join(f'<span style="width:{p}%;background:{LANG_COLORS[n]}"></span>' for n, p in lang_rows)}</div><div class="lrow">{''.join(f'<span><span class="dot" style="background:{LANG_COLORS[n]}"></span>{n} · {p}%</span>' for n, p in lang_rows)}</div></div>
  <div class="glass"><div class="k">Contributions · last year</div><div class="big">{D['contrib_last_year']:,}</div><div class="sub">{D['active_days']} active days · {D['repos_owned']} repos owned · {D['stars']} stars · {D['followers']} followers</div></div>
  <div class="glass heat"><div class="k">The year in commits</div><svg class="heat" width="1150" height="152">{heat_cells()}</svg></div>
</div>
<div class="foot">ANSAI · SELF-HOSTED STATS — PRIVATE WORK COUNTED</div>
</body></html>"""
open(os.path.join(os.path.dirname(__file__), "card.html"), "w").write(HTML)
json.dump(D, open(os.path.join(os.path.dirname(__file__), "data.json"), "w"), indent=1)
print("grade:", grade, "pct:", D["grade_pct"])
print("wrote card.html")
