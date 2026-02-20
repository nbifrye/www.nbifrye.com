# /work — 自律成長セッション

デジタルアイデンティティのプロフェッショナルとして、今日の知識をアウトプットします。
このコマンドを実行するたびに、最新動向を調査し、思考を記録していきます。

> プロジェクトの構造・コマンド・ワークフローは `CLAUDE.md` に記載されており、セッション開始時に自動ロードされる。

## 実行フロー

### Step 1: 既存コンテンツの確認

以下を確認し、最近カバーしたトピックと重複しないよう把握する：

- `docs/notes/` のファイル一覧（Glob ツールを使用）
- `docs/articles/` のファイル一覧（Glob ツールを使用）
- 最新の数件のファイルの冒頭を Read して内容を把握する

### Step 2: トピック選定とリサーチ

以下の観点から **今日フォーカスするトピックを1つ選び**、WebSearch で最新情報を3〜5件収集する。
既存コンテンツと重複しない新鮮なテーマを優先すること。

> **コンテキスト管理のヒント**: リサーチが広範になる場合は Task ツールでサブエージェントに委託すると、
> メインコンテキストを節約できる。

**仕様・標準**
- OpenID4VP / OpenID4VCI の最新ドラフト・実装状況
- FAPI 2.0 / OpenID Federation 1.1 の動向
- W3C Verifiable Credentials Data Model 2.0
- SD-JWT (RFC 9901) / SD-JWT VC (draft-ietf-oauth-sd-jwt-vc) の実装状況
- IETF OAuth 2.x 関連 RFC の動き
- WebAuthn Level 3 / CTAP 2.2 の標準化進捗
- FIDO Credential Exchange Protocol（CXP / CXF）——パスキーのプロバイダー間移行

**エコシステム**
- EU EUDI Wallet の実装ロードマップ・各国状況
- mDL (ISO 18013-5) の導入事例・技術詳細
- Passkeys / FIDO2 の普及状況・最新統計
- Apple / Google / Microsoft のデジタルウォレット戦略
- 日本のデジタルID動向（マイナンバーカード活用、行政API、民間連携）
- 日本金融業界のパスキー必須化——証券口座乗っ取り事件と業界対応

**セキュリティ**
- AI エージェント時代の非人間アイデンティティ (NHI) 管理
- AI エージェント認証（SPIFFE/SPIRE、Verifiable Credentials for agents）
- DeepFake・AI生成攻撃と IAL (Identity Assurance Level) の関係
- フィッシング耐性認証 (FIDO2, passkeys) の最新事例
- Account Takeover トレンドと対策

**プライバシー技術**
- Zero Knowledge Proof の実用化事例
- 選択的開示 (Selective Disclosure) の仕様比較
- Privacy-Enhancing Technologies (PET) の動向

**規制・ガバナンス**
- eIDAS 2.0 実施状況と各国対応
- NIST SP 800-63-4 最終版——Synced Passkeys の AAL2 認定と影響
- NIST SP 800 / NISTIR ガイドライン更新
- OpenID Foundation ワーキンググループ活動
- HAIP (High Assurance Interoperability Profile) 1.0 と OpenID Foundation 適合テスト・自己認証プログラム

### Step 3: コンテンツ執筆

**形式の選択**:
- **ノート** `docs/notes/YYYY-MM-DD-<slug>.md` — ニュース反応・気付き・短い考察（800〜2000字）
- **記事** `docs/articles/YYYY-MM-<slug>.md` — 深い技術解説・包括的考察（2000字以上）

通常はノートを書く。月1〜2本のペースで記事を書く。
今日の日付はシステムコンテキスト（`currentDate`）で確認してから、正しいファイル名を付けること。

**ノートのテンプレート**:

```markdown
# [タイトル]

> [一言サマリー：何が起きていて、なぜ重要か]

## 背景

[なぜ今このトピックが注目されているか。前提知識の整理。]

## [メインセクション：技術詳細 or 動向分析]

[本文。具体的な仕様名・バージョン・数字・タイムラインを含める。]

## 所感

[単なる要約ではなく、業界への示唆・自分の見解・今後の注目点を書く。]

## 参考

- [リンクテキスト](URL)
- [リンクテキスト](URL)
```

**記事のテンプレート**:

```markdown
# [タイトル]

> [一言サマリー]

## はじめに

[読者へ：何を学べるか、なぜ重要か]

## [セクション1]

## [セクション2]

## [セクション3]

## まとめ

[重要ポイントの整理と今後の展望]

## 参考

- [リンクテキスト](URL)
```

**執筆基準**:
- **日本語**で書く（技術用語・固有名詞・仕様名は英語のまま可）
- **自分の視点・考察**を必ず入れる（要約サイトではなく、プロとしての解釈）
- **一次情報**へリンクする（仕様書・RFC・公式ブログ・学術論文を優先）
- **具体性**を重視する（抽象論より実装例・数字・タイムラインを含める）

### Step 4: コマンド自己改善

コンテンツを書き終えたら、**このコマンド自身** (`.claude/commands/work.md`) と **`CLAUDE.md`** を見直して改善する。

Read ツールで両ファイルを読み込み、以下の観点で評価する：

**`.claude/commands/work.md` のトピックリスト更新**
- 今回リサーチした中で、候補リストにまだ載っていない重要トピックはあるか？
- 古くなった・旬を過ぎたトピックがあれば削除または更新する
- 新たに浮上した仕様・規格・業界動向をリストに追加する

**実行プロセスの改善**
- 今回の実行で手順が不明瞭だった箇所はあるか？
- より良い執筆フロー・調査方法があれば指示を更新する
- テンプレートや執筆基準に改善余地はあるか？

**`CLAUDE.md` の更新**
- プロジェクト構造やワークフローに変更があれば `CLAUDE.md` を更新する

改善すべき点があれば Edit ツールでファイルを更新する。
変更がなければこのステップはスキップしてよい。

### Step 5: コミットとプッシュ

```bash
# ステージング（変更したファイルのみ個別に指定）
git add docs/notes/<filename>.md          # 新規ノート
git add .claude/commands/work.md          # コマンドを更新した場合
git add CLAUDE.md                         # CLAUDE.md を更新した場合

# コミット（日本語メッセージ推奨）
git commit -m "Add note: [タイトル]"
# または
git commit -m "Add article: [タイトル]"
# コマンドも更新した場合：
git commit -m "Add note: [タイトル] + /work コマンド改善"

# プッシュ（現在のブランチへ）
git push -u origin HEAD
```

---

*このコマンドは毎回実行するたびに新しいコンテンツを生み出し、自らも進化します。
`main` ブランチ上で実行すれば、GitHub Actions 経由で自動デプロイされます。*
