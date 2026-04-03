#!/bin/bash
# PostToolUse hook: .md ファイルを oxfmt でフォーマットする
#
# Claude Code は PostToolUse 時に stdin へ以下の JSON を渡す:
#   { "tool_name": "Write", "tool_input": { "file_path": "..." }, ... }

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
  OXFMT="${CLAUDE_PROJECT_DIR}/node_modules/.bin/oxfmt"
  if [[ -x "$OXFMT" ]]; then
    "$OXFMT" "$FILE"
  fi
fi
