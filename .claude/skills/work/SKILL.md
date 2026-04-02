---
description: デジタルアイデンティティ知識ベースを自律的に成長させる — テーマ選定・調査・執筆・レビュー・校正・基盤改善・コミットをすべて行う
allowed-tools: Read Write Edit Bash Glob Grep WebSearch WebFetch Agent
context: fork
---

# /work — 自律的知識ベース構築

このスキルは人間の介入なしに完走するよう設計されています。
不明点があっても人間に質問せず、最善判断で進めてください。

まず `CLAUDE.md` を読んでプロジェクト全体の方針を把握してください。

---

## Step 1 — カバレッジ分析

### 1-1. 既存コンテンツを確認する

```bash
# 既存の記事と仕様解説を列挙
find docs/articles -name "*.md" ! -name "index.md" | sort
find docs/specs -name "*.md" ! -name "index.md" | sort
```

### 1-2. トピックマトリクスと照合する

`.claude/skills/work/topics.md` を読み、`[ ]`（未着手）のトピックを抽出します。

### 1-3. カバレッジギャップリストを作成する

未着手トピックを列挙し、次のステップに進みます。

---

## Step 2 — トピック選定

以下の優先度基準で **1 件** のトピックを選んでください。

1. **タイムリー性** — 直近 6 ヶ月以内にアップデートがあった仕様
2. **依存関係** — 他のトピックが前提としている未解説の基礎仕様
3. **希少価値** — 日本語の良質な解説が存在しない分野
4. **バランス** — 6 ドメインで極端な偏りが生じないよう考慮

選定したトピックと選定理由を簡潔に記録してください。

コンテンツ種別を決定:

- **Spec 記事**: 単一仕様の深い解説 → `docs/specs/<id>.md`
- **Article**: 複数仕様の横断分析・技術考察・業界動向 → `docs/articles/YYYY-MM-DD-<slug>.md`

---

## Step 3 — リサーチ

以下の Agent ツールを使って Explore サブエージェントを起動し、一次情報を収集してください。

```
Agent(subagent_type="Explore", prompt="""
次のトピックについて一次情報を収集してください: <選定したトピック>

1. 仕様書本文を取得:
   - IETF RFC であれば https://www.rfc-editor.org/rfc/rfcXXXX.html
   - OpenID Foundation であれば https://openid.net/specs/ から最新版
   - W3C であれば https://www.w3.org/TR/ から最新版
   - FIDO Alliance であれば https://fidoalliance.org/specifications/

2. WebSearch で最新動向を調査:
   - "<仕様名> latest update 2025 OR 2026"
   - "<仕様名> implementation Japan"
   - 関連する日本語情報

3. 以下をまとめて返してください:
   - 仕様の正式名称・バージョン・URL
   - 主要な技術的概念（箇条書き）
   - 設計上の重要な決定とその理由
   - 関連仕様・前身仕様・後継仕様
   - 実装例・採用事例
   - 注意点・既知の問題
   - 最近の変更・更新情報
""")
```

サブエージェントの結果を受け取り、執筆に使います。

---

## Step 4 — 執筆

`.claude/skills/work/style-guide.md` を読んでから執筆してください。

### Spec 記事のテンプレート (`docs/specs/<id>.md`)

```markdown
---
title: <仕様の正式名称>
description: <1〜2文の説明>
---

> **Note:** このページはAIエージェントが執筆しています。内容の正確性は一次情報（仕様書・公式資料）とあわせてご確認ください。

# <仕様の正式名称>

## 概要

<!-- 仕様の目的・解決する問題を 200〜400字で -->

## 背景と経緯

<!-- なぜこの仕様が生まれたか、前身仕様との関係 -->

## 設計思想

<!-- 主要な設計上の決定とその理由 -->

## 技術詳細

<!-- コアとなる技術仕様の解説。コード例・フロー図を含む -->

## 実装上の注意点

<!-- 実装者が踏みやすい落とし穴・セキュリティ上の注意 -->

## 採用事例

<!-- 実際に採用している製品・サービス・標準 -->

## 関連仕様・後継仕様

<!-- 依存関係のある仕様、superseded する仕様 -->

## 参考資料

<!-- 一次情報へのリンク必須 -->
```

### Article のテンプレート (`docs/articles/YYYY-MM-DD-<slug>.md`)

```markdown
---
title: <記事タイトル（日本語）>
description: <1〜2文の説明>
date: YYYY-MM-DD
---

> **Note:** この記事はAIエージェントが執筆しています。内容の正確性は一次情報とあわせてご確認ください。

# <記事タイトル>

## 要約

<!-- 記事の主張を 3〜5 行で -->

## 本文

<!-- 本論 -->

## まとめ

<!-- 読者へのアクションアイテム・今後の展望 -->

## 参考資料
```

---

## Step 5 — 正確性レビュー

以下の Agent ツールで Explore サブエージェントを起動してレビューしてください。

```
Agent(subagent_type="Explore", prompt="""
以下のファイルを読み、技術的正確性をレビューしてください: <ファイルパス>

チェック項目:
1. 仕様バージョンは最新か（古い情報は "as of <version>" として明記）
2. 技術的な主張に根拠（URL・RFC番号）が示されているか
3. 誤った情報・誤解を招く表現がないか
4. 関連仕様との整合性（矛盾がないか）

問題があれば具体的な修正案を返してください。
""")
```

レビュー結果をもとにファイルを修正してください。

---

## Step 6 — 校正

以下の観点で日本語品質を確認し、必要に応じて修正してください。

- 文末の統一（「です・ます」調または「だ・である」調、混在しない）
- 技術用語の表記統一（style-guide.md の表記ルールに従う）
- 句読点の適切な使用（読みやすさ）
- 受動態の多用を避け、能動的な文体
- 冗長な表現の削除

---

## Step 7 — 自己改善

今回の執筆作業を通じて気づいた改善点を以下のファイルに反映してください。

### `.claude/skills/work/topics.md`

- 執筆したトピックのチェックボックスを `[x]` に更新
- 今回の調査で発見した新しいトピック候補を `[ ]` として追加

### `.claude/skills/work/style-guide.md`

- 今回使った表現パターンで有用なものをガイドに追記

### `CLAUDE.md`

- プロジェクト方針に変更が必要な場合のみ更新（軽微な変更は不要）

### `docs/.vitepress/config.mts`

- サイドバーは動的生成のため通常は変更不要
- nav リンクの修正が必要な場合のみ更新

---

## Step 8 — Git commit & push

すべてのファイルをステージしてコミット・プッシュしてください。

```bash
# ステージング
git add docs/ .claude/ CLAUDE.md

# コミット（記事の内容に合わせてメッセージを変更）
git commit -m "feat: <トピック名>の記事を追加

- docs/<type>/<filename>.md を新規作成
- .claude/skills/work/topics.md を更新"

# プッシュ
git push -u origin claude/autonomous-knowledge-base-cZuro
```

---

## エラー対処

- **WebFetch 失敗**: 別の URL（例: HTML版 → テキスト版 RFC）を試す
- **ビルドエラー**: `npm run docs:build` で確認し、frontmatter の構文エラーを修正
- **push 失敗**: `git pull --rebase origin claude/autonomous-knowledge-base-cZuro` してから再試行
