#!/bin/bash
# PostToolUse hook: .md ファイルを oxfmt でフォーマットする
#
# Codex は PostToolUse 時に stdin へ以下の JSON を渡す:
#   { "tool_name": "Write", "tool_input": { "file_path": "..." }, ... }

set -euo pipefail

FILE=$(node -e "
  let data = '';
  process.stdin.on('data', c => data += c);
  process.stdin.on('end', () => {
    try {
      const d = JSON.parse(data);
      process.stdout.write(d.tool_input?.file_path ?? '');
    } catch { process.stdout.write(''); }
  });
")

if [[ "$FILE" == *.md ]] && [[ -f "$FILE" ]]; then
  OXFMT="${CODEX_PROJECT_DIR}/node_modules/.bin/oxfmt"
  if [[ -x "$OXFMT" ]]; then
    if ! "$OXFMT" "$FILE"; then
      echo "format-md.sh: oxfmt failed on ${FILE}" >&2
      exit 1
    fi
  else
    echo "format-md.sh: oxfmt not found at ${OXFMT} (skipping)" >&2
    exit 0
  fi
fi
