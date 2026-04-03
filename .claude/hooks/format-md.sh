#!/bin/bash
# PostToolUse hook: .md ファイルを oxfmt でフォーマットする
#
# Claude Code は PostToolUse 時に以下の環境変数を設定する:
#   CLAUDE_TOOL_RESULT_FILE_PATH — Write/Edit されたファイルのパス
#
# stdin からの JSON パースを試みるフォールバックも持つ。

FILE="${CLAUDE_TOOL_RESULT_FILE_PATH:-}"

# 環境変数が空の場合は stdin から取得を試みる
if [[ -z "$FILE" ]]; then
  INPUT=$(cat 2>/dev/null)
  if [[ -n "$INPUT" ]]; then
    FILE=$(echo "$INPUT" | python3 -c "
import sys, json
try:
    d = json.load(sys.stdin)
    print(d.get('tool_input', {}).get('file_path', ''))
except Exception:
    print('')
" 2>/dev/null || echo "")
  fi
fi

if [[ "$FILE" == *.md ]] && [[ -n "$FILE" ]] && [[ -f "$FILE" ]]; then
  npx oxfmt "$FILE" 2>/dev/null
fi
