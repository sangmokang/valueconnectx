#!/usr/bin/env python3
"""Append new git commits to history.md, grouped by date in desc order.

Triggered by Stop hook. Idempotent — uses .omc/state/history-last-commit.txt as
a marker to track the last commit already logged.
"""
from __future__ import annotations

import re
import subprocess
import sys
from collections import defaultdict
from pathlib import Path

REPO = Path(__file__).resolve().parents[2]
HISTORY = REPO / "history.md"
STATE_DIR = REPO / ".omc" / "state"
MARKER = STATE_DIR / "history-last-commit.txt"

TYPE_RE = re.compile(
    r"^(feat|fix|refactor|docs|chore|test|perf|style|build|ci)(\([^)]+\))?:\s*(.*)"
)
DATE_HEADER_RE = re.compile(r"^## (\d{4}-\d{2}-\d{2})( \(.+\))?$", re.MULTILINE)


def git(*args: str) -> str:
    res = subprocess.run(
        ["git", *args], cwd=str(REPO), capture_output=True, text=True
    )
    return res.stdout.strip()


def main() -> int:
    if not HISTORY.exists():
        return 0
    STATE_DIR.mkdir(parents=True, exist_ok=True)

    head = git("rev-parse", "HEAD")
    if not head:
        return 0

    last = MARKER.read_text().strip() if MARKER.exists() else ""
    if not last:
        MARKER.write_text(head + "\n")
        return 0
    if last == head:
        return 0

    log_out = git(
        "log",
        "--reverse",
        "--pretty=format:%h|%ad|%s",
        "--date=short",
        f"{last}..HEAD",
    )
    if not log_out:
        MARKER.write_text(head + "\n")
        return 0

    by_date: dict[str, list[str]] = defaultdict(list)
    for line in log_out.splitlines():
        try:
            h, d, s = line.split("|", 2)
        except ValueError:
            continue
        m = TYPE_RE.match(s)
        if m:
            t, _, msg = m.groups()
        else:
            t, msg = "chore", s
        by_date[d].append(f"- [{t}] {msg} (commit:{h})")

    content = HISTORY.read_text()
    matches = list(DATE_HEADER_RE.finditer(content))

    if not matches:
        addition = "\n".join(
            f"## {d}\n\n" + "\n".join(by_date[d])
            for d in sorted(by_date.keys(), reverse=True)
        )
        new_content = content.rstrip() + "\n\n" + addition + "\n"
        HISTORY.write_text(new_content)
        MARKER.write_text(head + "\n")
        return 0

    first_idx = matches[0].start()
    prefix = content[:first_idx]
    body = content[first_idx:]

    starts = [m.start() - first_idx for m in matches] + [len(body)]
    sections: list[list[str]] = []
    for i, m in enumerate(matches):
        text = body[starts[i] : starts[i + 1]]
        sections.append([m.group(1), text])

    existing_idx = {s[0]: i for i, s in enumerate(sections)}

    for d in sorted(by_date.keys()):
        entries = "\n".join(by_date[d])
        if d in existing_idx:
            idx = existing_idx[d]
            sec = sections[idx][1].rstrip() + "\n" + entries + "\n\n"
            sections[idx][1] = sec
        else:
            new_block = f"## {d}\n\n{entries}\n\n"
            inserted = False
            for i, sec in enumerate(sections):
                if sec[0] < d:
                    sections.insert(i, [d, new_block])
                    inserted = True
                    break
            if not inserted:
                sections.append([d, new_block])

    new_body = "".join(s[1] for s in sections)
    HISTORY.write_text(prefix + new_body)
    MARKER.write_text(head + "\n")
    return 0


if __name__ == "__main__":
    sys.exit(main())
