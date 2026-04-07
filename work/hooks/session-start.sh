#!/bin/bash
# SessionStart hook: セッション開始時に知識ベースの現在状態をサマリー表示する

cd "${CLAUDE_PROJECT_DIR}" || exit 1

# 依存パッケージが未インストールの場合は自動インストール
if [[ ! -d node_modules ]]; then
  echo "📦 Installing dependencies..." >&2
  npm install --prefer-offline --no-audit --no-fund 2>&1 | tail -3 >&2
fi

TOPICS="work/topics.md"

echo "=== Knowledge Base Session Context ==="
echo ""

# 日付・ブランチ
echo "📅 Date: $(date '+%Y-%m-%d')"
BRANCH=$(git branch --show-current 2>/dev/null || echo "unknown")
echo "🌿 Branch: ${BRANCH}"
echo ""

# 最新コミット（5件）
echo "📝 Recent commits:"
git log --oneline -5 2>/dev/null | sed 's/^/  /'
echo ""

# コンテンツ数
ARTICLE_COUNT=$(find docs/articles -name "*.md" ! -name "index.md" 2>/dev/null | wc -l | tr -d ' ')
SPEC_COUNT=$(find docs/specs -name "*.md" ! -name "index.md" 2>/dev/null | wc -l | tr -d ' ')
echo "📚 Content: ${ARTICLE_COUNT} articles, ${SPEC_COUNT} specs"
echo ""

# ドメイン別カバレッジ（awk で topics.md を解析）
# テーブル行フォーマット: | Topic | P0/P1/P2 | Score | File(s) | Last Updated |
echo "📊 Domain coverage:"
awk -F'|' '
  /^## Domain/ {
    if (domain != "") {
      printf "  %s: %d/%d covered\n", domain, covered, total
    }
    domain = substr($0, 4)
    sub(/^[[:space:]]+/, "", domain)
    sub(/[[:space:]]+$/, "", domain)
    covered = 0; total = 0
    next
  }
  /^\|/ && $3 ~ /P[012]/ {
    total++
    score = $4
    gsub(/[[:space:]]/, "", score)
    if (score != "0" && score != "") covered++
  }
  END {
    if (domain != "") printf "  %s: %d/%d covered\n", domain, covered, total
  }
' "$TOPICS" 2>/dev/null
echo ""

# カバレッジギャップ表示（P0 優先、P0 完了時は P1 を表示）
# テーブル行: | Topic | Priority | Score | ...
#   $2=topic, $3=priority, $4=score
P0_GAPS=$(awk -F'|' '/^\|/ && $3 ~ /P0/ { gsub(/[[:space:]]/, "", score_field); score_field=$4; gsub(/[[:space:]]/, "", score_field); if (score_field == "0") { gsub(/^[[:space:]]+|[[:space:]]+$/, "", $2); print "  - " $2 } }' "$TOPICS" 2>/dev/null | head -10)

if [ -n "$P0_GAPS" ]; then
  echo "🎯 P0 coverage gaps:"
  echo "$P0_GAPS"
else
  P1_GAPS=$(awk -F'|' '/^\|/ && $3 ~ /P1/ { gsub(/[[:space:]]/, "", score_field); score_field=$4; gsub(/[[:space:]]/, "", score_field); if (score_field == "0") { gsub(/^[[:space:]]+|[[:space:]]+$/, "", $2); print "  - " $2 } }' "$TOPICS" 2>/dev/null | head -10)
  if [ -n "$P1_GAPS" ]; then
    echo "✅ All P0 covered! P1 coverage gaps:"
    echo "$P1_GAPS"
  else
    echo "🎉 All P0 and P1 topics covered!"
  fi
fi
echo ""

# 未レビュー記事の検出（Specs > Articles の優先順でソート）
# フロントマターに "レビュー済み" タグが含まれないファイルを列挙する
SPECS_UNREVIEWED=$(find docs/specs -name "*.md" ! -name "index.md" 2>/dev/null \
  | xargs grep -L "レビュー済み" 2>/dev/null | sort)
ARTICLES_UNREVIEWED=$(find docs/articles -name "*.md" ! -name "index.md" 2>/dev/null \
  | xargs grep -L "レビュー済み" 2>/dev/null | sort)
UNREVIEWED=$(printf '%s\n%s' "$SPECS_UNREVIEWED" "$ARTICLES_UNREVIEWED" | grep -v '^$')

if [ -n "$UNREVIEWED" ]; then
  NEXT_TARGET=$(echo "$UNREVIEWED" | head -1)
  echo "📋 Unreviewed content (review before writing new articles):"
  echo "$UNREVIEWED" | sed 's/^/  /'
  echo ""
  echo "🎯 Next review target: ${NEXT_TARGET}"
else
  echo "✅ All content reviewed"
fi
echo ""

echo "=== End of Context ==="
