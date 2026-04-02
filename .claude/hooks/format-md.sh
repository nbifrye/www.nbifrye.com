#!/bin/bash
# PostToolUse hook: .md ファイルを oxfmt でフォーマットする

INPUT=$(cat)
FILE=$(echo "$INPUT" | python3 -c "
import sys, json
try:
    d = json.load(sys.stdin)
    print(d.get('tool_input', {}).get('file_path', ''))
except Exception:
    print('')
" 2>/dev/null || echo "")

if [[ "$FILE" == *.md ]] && [[ -n "$FILE" ]] && [[ -f "$FILE" ]]; then
    npx oxfmt "$FILE" 2>/dev/null
fi
