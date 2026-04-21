#!/usr/bin/env bash
set -euo pipefail

input=$(cat)

prompt=$(printf '%s' "$input" | jq -r '.prompt // empty')
[[ -z "$prompt" ]] && exit 0

session=$(printf '%s' "$input" | jq -r '.session_id // ""')
cwd=$(printf '%s' "$input" | jq -r '.cwd // ""')
[[ -z "$cwd" ]] && cwd="$PWD"

ts_utc=$(date -u +"%Y-%m-%dT%H:%M:%SZ")
ts_kst=$(TZ=Asia/Seoul date +"%Y-%m-%dT%H:%M:%S%z")

log_dir="$cwd/.omc/state"
mkdir -p "$log_dir"
log_file="$log_dir/user-prompts.raw.jsonl"

jq -nc \
  --arg ts_utc "$ts_utc" \
  --arg ts_kst "$ts_kst" \
  --arg session "$session" \
  --arg cwd "$cwd" \
  --arg prompt "$prompt" \
  '{ts_utc:$ts_utc, ts_kst:$ts_kst, session:$session, cwd:$cwd, prompt:$prompt}' \
  >> "$log_file"

exit 0
