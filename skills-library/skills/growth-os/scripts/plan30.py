#!/usr/bin/env python3
"""Generate a 30-day content plan skeleton as CSV.

Usage:
    python3 plan30.py --start 2026-08-01 --hours 5 --out plan.csv
    python3 plan30.py --start 2026-08-01 --hours 8 \\
        --pillars "Teach,Prove,Opinion,Story" --out plan.csv

The script produces the SKELETON only. The agent must fill `idea`, `hook`,
and `asset_needed` with concrete, literal text before delivering.
"""

import argparse
import csv
import datetime as dt

HEADERS = [
    "day", "date", "week_theme", "stage", "pillar", "format",
    "idea", "hook", "cta", "asset_needed", "est_minutes", "kpi", "status",
]

WEEK_THEMES = [
    "Foundation & Visibility",
    "Trust & Proof",
    "Conversion",
    "Expansion & Repetition",
]

DEFAULT_PILLARS = ["Teach", "Prove", "Opinion", "Story", "Human"]

CADENCE = {
    3: ["Connect", "Consider", "Connect"],
    5: ["Connect", "Consider", "Connect", "Consider", "Close"],
    7: ["Connect", "Consider", "Connect", "Consider",
        "Connect", "Consider", "Close"],
}

FORMAT_BY_STAGE = {
    "Connect": "reel",
    "Consider": "carousel",
    "Close": "reel + story",
}

CTA_BY_STAGE = {
    "Connect": "follow",
    "Consider": "save / comment keyword",
    "Close": "DM or link in bio",
}

KPI_BY_STAGE = {
    "Connect": "reach + % non-followers",
    "Consider": "saves + profile visits",
    "Close": "DMs + link clicks",
}

MINUTES_BY_FORMAT = {
    "reel": 60,
    "carousel": 75,
    "reel + story": 80,
}


def posts_per_week(hours: float) -> int:
    if hours < 3:
        return 3
    if hours <= 6:
        return 5
    return 7


def build(start: dt.date, hours: float, pillars: list) -> list:
    per_week = posts_per_week(hours)
    stages = CADENCE[per_week]
    rows = []
    post_index = 0

    for day in range(1, 31):
        date = start + dt.timedelta(days=day - 1)
        week = (day - 1) // 7
        theme = WEEK_THEMES[min(week, 3)]

        # Retro day at the end of each week.
        if day % 7 == 0:
            rows.append({
                "day": day, "date": date.isoformat(), "week_theme": theme,
                "stage": "Review", "pillar": "-", "format": "retro",
                "idea": "Weekly retro: top 3, bottom 3, one change",
                "hook": "-", "cta": "-", "asset_needed": "-",
                "est_minutes": 30, "kpi": "one change decided",
                "status": "not started",
            })
            continue

        # Spread posts evenly across the six non-retro days of the week.
        day_in_week = (day - 1) % 7
        posting_days = sorted(range(6),
                              key=lambda i: (i * 6) % 6)[:per_week]
        if day_in_week not in posting_days:
            rows.append({
                "day": day, "date": date.isoformat(), "week_theme": theme,
                "stage": "Off", "pillar": "-", "format": "batch / engage",
                "idea": "Batch production + reply to comments and DMs",
                "hook": "-", "cta": "-", "asset_needed": "-",
                "est_minutes": 45, "kpi": "replies sent",
                "status": "not started",
            })
            continue

        stage = stages[post_index % len(stages)]
        pillar = pillars[post_index % len(pillars)]
        fmt = FORMAT_BY_STAGE[stage]
        post_index += 1

        rows.append({
            "day": day, "date": date.isoformat(), "week_theme": theme,
            "stage": stage, "pillar": pillar, "format": fmt,
            "idea": "[FILL: one specific sentence]",
            "hook": "[FILL: literal hook, max 6 words]",
            "cta": CTA_BY_STAGE[stage],
            "asset_needed": "[FILL: filming / design / screenshot]",
            "est_minutes": MINUTES_BY_FORMAT[fmt],
            "kpi": KPI_BY_STAGE[stage],
            "status": "not started",
        })

    return rows


def main():
    p = argparse.ArgumentParser(description="30-day content plan generator")
    p.add_argument("--start", required=True, help="start date YYYY-MM-DD")
    p.add_argument("--hours", type=float, default=5.0,
                   help="hours available per week")
    p.add_argument("--pillars", default=",".join(DEFAULT_PILLARS),
                   help="comma-separated content pillars")
    p.add_argument("--out", default="plan30.csv", help="output CSV path")
    args = p.parse_args()

    start = dt.date.fromisoformat(args.start)
    pillars = [x.strip() for x in args.pillars.split(",") if x.strip()]
    rows = build(start, args.hours, pillars)

    with open(args.out, "w", newline="", encoding="utf-8") as f:
        w = csv.DictWriter(f, fieldnames=HEADERS)
        w.writeheader()
        w.writerows(rows)

    print(f"OK {args.out} - 30 days, {posts_per_week(args.hours)} posts/week")


if __name__ == "__main__":
    main()
