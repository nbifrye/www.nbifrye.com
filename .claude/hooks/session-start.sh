#!/bin/bash
# SessionStart hook: /work セッション開始時に現在の状態をサマリー表示する
#
# Claude はこの出力を読んでから作業を開始することで、
# CLAUDE.md / topics.md / git log を手動で読む前にコンテキストを把握できる。

cd "${CLAUDE_PROJECT_DIR}" || exit 1

echo "=== Knowledge Base Session Context ==="
echo ""

# 日付
echo "📅 Date: $(date '+%Y-%m-%d')"

# ブランチ
BRANCH=$(git branch --show-current 2>/dev/null || echo "unknown")
echo "🌿 Branch: ${BRANCH}"
echo ""

# 最新コミット（タイトルのみ、5件）
echo "📝 Recent commits:"
git log --oneline -5 2>/dev/null | sed 's/^/  /'
echo ""

# コンテンツ数
ARTICLE_COUNT=$(find docs/articles -name "*.md" ! -name "index.md" 2>/dev/null | wc -l | tr -d ' ')
SPEC_COUNT=$(find docs/specs -name "*.md" ! -name "index.md" 2>/dev/null | wc -l | tr -d ' ')
echo "📚 Content: ${ARTICLE_COUNT} articles, ${SPEC_COUNT} specs"
echo ""

# P0 カバレッジギャップ（Score=0 かつ P0）
echo "🎯 P0 coverage gaps (Score=0):"
grep -E '\|\s*P0\s*\|\s*0\s*\|' .claude/skills/work/topics.md 2>/dev/null \
  | sed 's/|[^|]*$//; s/^| *//; s/ *| */\t/g' \
  | awk -F'\t' '{print "  - " $1}' \
  | head -10
echo ""

echo "=== End of Context ==="
