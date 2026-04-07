# 執筆モード

このファイルは `work/skills/SKILL.md` の Step 0 から参照されます。
すべてのコンテンツがレビュー済みの場合に Step 1〜9 を順に実行してください。

---

## Step 1 — カバレッジ分析

### 1-1. 既存コンテンツを確認する

Glob ツールを使って既存ファイルを列挙してください。

```
Glob("docs/articles/*.md") → index.md 以外を抽出
Glob("docs/specs/*.md")    → index.md 以外を抽出
```

### 1-2. トピックマトリクスと照合する

`work/topics.md` を読み、全トピックの Score を確認します。

**重複防止チェック**: 既存ファイルのスラッグ（例: `rfc6749`、`oidc-core`）と topics.md の File(s) 列を照合し、
ファイルは存在するが Score=0 のままのトピックがあれば、この段階で Score を更新してから次に進んでください。

### 1-3. カバレッジギャップリストを作成する

Score=0 のトピックを優先度（P0 → P1 → P2）順に列挙します。

---

## Step 2 — トピック選定

以下の基準で **1 件** のトピックを選んでください。

**選定アルゴリズム（上位ルールが優先）:**

1. **P0 優先**: Score=0 かつ Priority=P0 のトピックを最優先とする
2. **P0 枯渇時**: P0 が残っていなければ P1 → P2 の順に降りる
3. **ドメインバランス**: 同じ優先度内では、カバレッジが最も低いドメインから選ぶ（ドメイン全体でゼロカバレッジのドメインを優先）
4. **タイムリー性**: 直近 6 ヶ月以内にアップデートがあった仕様を優先
5. **依存関係**: 他の複数のトピックが前提としている基礎仕様を優先
6. **希少価値**: 日本語の良質な解説が存在しない分野を優先

選定したトピックと選定理由を 1〜2 文で記録してください。

**コンテンツ種別の決定:**

- **Spec 記事**: 単一仕様の深い解説 → `docs/specs/<id>.md`
  - ファイル名は仕様 ID そのもの（例: `rfc6749.md`, `oidc-core.md`, `webauthn.md`）
- **Article**: 複数仕様の横断分析・技術考察・業界動向 → `docs/articles/YYYY-MM-DD-<slug>.md`
  - ファイル名: `YYYY-MM-DD-<kebab-case>.md`（今日の日付を使う）

---

## Step 3 — リサーチ

Explore サブエージェントを起動して一次情報を収集してください。
トピックのドメインに応じて適切な URL にアクセスしてください。

```
Agent(subagent_type="Explore", prompt="""
次のトピックについて一次情報を収集してください。

## 調査対象

トピック名: <選定したトピック（具体的な名称・RFC番号など）>
ドメイン: <OpenID Standards / W3C Standards / Regulatory / Enterprise Identity / Emerging Technologies / Regional Adoption>

## ドメイン別アクセス先

### IETF RFC（OAuth / JWT / PKCE / DPoP / PAR / RAR / JAR / SCIM など）
- 最新版: https://www.rfc-editor.org/rfc/rfc<番号>.html
- 代替（テキスト版）: https://www.rfc-editor.org/rfc/rfc<番号>.txt
- Internet-Draft: https://datatracker.ietf.org/doc/html/draft-<名前>

### OpenID Foundation（OIDC / FAPI / OID4VCI / OID4VP / SIOPv2 / Federation など）
- 仕様一覧: https://openid.net/developers/specs/
- 各仕様の最新 Draft または Final を直接取得

### W3C（VC / DID / WebAuthn / SD-JWT VC など）
- 勧告（Recommendation）: https://www.w3.org/TR/<shortname>/
- 最新エディタドラフト: https://www.w3.org/TR/<shortname>/

### FIDO Alliance（FIDO2 / WebAuthn / Passkey など）
- 仕様: https://fidoalliance.org/specifications/
- WebAuthn Level 3: https://www.w3.org/TR/webauthn-3/

### 規制（eIDAS 2.0 / NIST / 日本法令）
- EU Official Journal: https://eur-lex.europa.eu/
- NIST SP: https://csrc.nist.gov/publications/detail/sp/<番号>/final
- 日本 e-Gov 法令検索: https://laws.e-gov.go.jp/

### 補足情報
- WebSearch で "<仕様名> site:openid.net OR site:ietf.org OR site:w3.org 2025 OR 2026" を検索
- 実装ガイド・採用事例を検索: "<仕様名> implementation guide 2025"

## 返答形式（この構造で返してください）

### 仕様メタデータ
- 正式名称:
- バージョン:
- 公式 URL:
- ステータス（Draft / Final / Superseded）:
- 最終更新日:

### 概要（200 字以内）
仕様が解決する問題と主な用途

### 主要な技術的概念（5〜10 個）
- 概念名: 説明（一次ソース URL付き）

### 設計上の重要な決定
なぜそう設計されたか。トレードオフを含めて説明

### 関連仕様
- 前身仕様（Obsoletes）:
- 後継仕様（Superseded by）:
- 依存する仕様:
- 競合・代替仕様:

### 実装例・採用事例
実際に採用している製品・サービス・標準（出典付き）

### 注意点・既知の問題
実装者が踏みやすい落とし穴（セキュリティ上の注意を含む）

### 最近の変更
過去 12 ヶ月以内のアップデート（なければ「なし」）
""")
```

サブエージェントの結果を受け取り、執筆に使います。

---

## Step 4 — 執筆

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

<!-- 主要な設計上の決定とその理由。トレードオフも含む -->

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

<!-- 記事の主張・結論を 3〜5 行で。読者がここだけ読んでも価値があるように -->

## 背景

<!-- なぜ今このトピックが重要か。前提知識の整理 -->

## <技術詳細セクション（タイトルは内容に合わせる）>

<!-- 本論。必要に応じて複数の h2 セクションに分割 -->
<!-- コード例・シーケンス図・比較表を積極的に使う -->

## 実装・採用上の考察

<!-- 実装者・意思決定者の視点からの分析。メリット・トレードオフ・注意点 -->

## まとめ

<!-- 読者へのアクションアイテム・今後の展望 -->

## 参考資料

<!-- 一次情報へのリンク必須 -->
```

**注意**: ファイル書き込み後、PostToolUse フックが自動的に oxfmt でフォーマットします。手動でのフォーマット実行は不要です。

---

## Step 5 — 正確性レビュー

Explore サブエージェントを起動し、一次情報と照合した正確性レビューを行ってください。

```
Agent(subagent_type="Explore", prompt="""
以下のファイルを技術的正確性の観点でレビューしてください。

## 対象ファイル

<ファイルパス>

## 手順

1. まず対象ファイルを Read ツールで全文読んでください
2. 参考資料セクションの URL を WebFetch で取得し、以下を確認:
   - 仕様バージョンは最新か（URL が示す文書のバージョン番号と記事の記載を照合）
   - 仕様ステータスは正確か（Draft / Final / Superseded）
3. 本文中の主要な技術的主張（3〜5 件）を選び、一次ソースとの整合性を確認

## チェック項目

- [ ] 仕様バージョンが最新（古い場合は "as of <version>" として明記すべき）
- [ ] 全ての技術的主張に根拠（URL・RFC番号）が示されている
- [ ] 誤解を招く表現・事実誤認がない
- [ ] 関連仕様との整合性（矛盾がない）
- [ ] セキュリティ上の注意点が適切に記載されている

## 返答形式

- 問題なし: 「レビュー完了：重大な問題なし」
- 問題あり: 問題箇所・修正案を箇条書きで（ファイルの行番号または引用文付き）
""")
```

レビュー結果をもとにファイルを修正してください。

---

## Step 6 — 校正

以下の観点で日本語品質を確認し、必要に応じてファイルを修正してください。

- **文末統一**: 「です・ます」調（敬体）で混在しない
- **用語統一**: `work/style-guide.md` の表記ルールに従う（英語表記を維持するもの・日本語訳が確立しているものを確認）
- **句読点**: 読みやすい位置に「、」「。」を使う
- **文体**: 受動態の多用を避け、能動的な文体を優先
- **冗長表現**: 同じ内容の繰り返し・余分な接続詞を削除

---

## Step 7 — 自己改善

今回の執筆作業で気づいた改善点を以下のファイルに反映してください。

### `work/topics.md`

- 執筆したトピックの Score を更新（0 → 2 または 3）
  - Spec 記事（単一仕様の詳細解説）→ Score=3
  - Article（概要レベル・横断分析）→ Score=2
- File(s) 列に作成したファイルのパスを記入（例: `docs/specs/rfc6749.md`）
- Last Updated 列に今日の日付（YYYY-MM-DD）を記入
- 今回の調査で発見した新しいトピック候補があれば末尾に追加

### `work/style-guide.md`

今回使った表現パターンで有用なものをガイドに追記（必要な場合のみ）。
既存のルールを変更・削除する場合は慎重に。

### `CLAUDE.md`

プロジェクト方針に変更が必要な場合のみ更新。軽微な変更は不要。

---

## Step 8 — ビルド検証

コミット前に VitePress ビルドが通ることを確認してください。

```bash
npm run docs:build 2>&1
```

ビルドエラーが出た場合は以下を確認して修正し、再ビルドしてください:

- frontmatter の構文エラー（引用符の欠落・インデントの誤り）
- Markdown の見出し構造（h1 が複数ある等）
- 内部リンク切れ（`[text](../specs/xxx.md)` 等）
- Mermaid 記法の構文エラー

---

## Step 9 — Git commit & push

今回の実行で作成・変更したファイルのみを明示的にステージしてコミット・プッシュしてください。

```bash
# 今回作成・変更したファイルのみを追加（例）
git add docs/specs/rfc6749.md work/topics.md

# コミット（記事の内容に合わせてメッセージを変更）
git commit -m "feat: <トピック名>の記事を追加

- docs/<type>/<filename>.md を新規作成
- work/topics.md を更新"

# main ブランチへの直接 push を試みる
git push origin HEAD:main
```

**push 結果に応じた対処:**

- **成功**: そのまま終了
- **失敗**（ブランチ保護・競合など）: 現在のブランチへ push する

```bash
git push -u origin HEAD
```

---

## エラー対処

- **WebFetch 失敗**: 別の URL を試す（HTML 版 → テキスト版 RFC、別ミラーなど）
- **ビルドエラー**: frontmatter の構文エラー・リンク切れを修正してから再実行
- **push 失敗（競合）**: `git pull --rebase origin main` してから再試行
- **push 失敗（ブランチ保護）**: 現在のブランチへ push して終了
