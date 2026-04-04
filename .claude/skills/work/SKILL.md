---
description: デジタルアイデンティティ知識ベースを自律的に成長させる — テーマ選定・調査・執筆・レビュー・校正・基盤改善・コミットをすべて行う
allowed-tools: Read Write Edit Bash Glob Grep WebSearch WebFetch Agent
---

# /work — 自律的知識ベース構築

このスキルは人間の介入なしに完走するよう設計されています。
不明点があっても人間に質問せず、最善判断で進めてください。

まず `CLAUDE.md` と `.claude/skills/work/style-guide.md` を読んでプロジェクト全体の方針を把握してください。

---

## Step 0 — モード判定

セッション開始時に `.claude/hooks/session-start.sh` が未レビュー記事を自動検出し、結果をセッションコンテキストに出力しています。

そのコンテキストを確認してください:

- **`📋 Unreviewed content:` のリストがある場合** → **レビューモード**
  `.claude/skills/work/review-mode.md` を Read し、その指示（Step R1〜R6）に従って実行してください。

- **`✅ All content reviewed` の場合** → **執筆モード**
  `.claude/skills/work/write-mode.md` を Read し、その指示（Step 1〜9）に従って実行してください。
