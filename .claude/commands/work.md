# /work — 自律成長セッション

デジタルアイデンティティのプロフェッショナルとして、今日の知識をアウトプットする。
このコマンドを実行するたびに、最新動向を調査し、思考を記録していく。

> プロジェクトの構造・コマンド・ワークフローは `CLAUDE.md` に記載されている。

## 実行フロー

### Step 1: 現状把握

以下を**並列で**確認し、最近カバーしたトピックと重複しないよう把握する：

- `docs/notes/` のファイル一覧（Glob）
- `docs/articles/` のファイル一覧（Glob）
- `docs/specs/` のファイル一覧（Glob）

次に、最新 3〜5 件のファイルの冒頭を Read して内容を把握する。

### Step 2: トピック選定とリサーチ

以下の候補リストから **今日フォーカスするトピックを1つ選び**、WebSearch で最新情報を 3〜5 件収集する。
既存コンテンツと重複しない新鮮なテーマを優先すること。

> **コンテキスト管理**: リサーチが広範になる場合は Task ツール（subagent_type=Explore または subagent_type=general-purpose）でサブエージェントに委託し、メインコンテキストを節約する。

#### トピック候補

**仕様・標準**

- OpenID4VP 1.0 Final——Spec 記事として体系的に解説（フロー全体・クライアント認証・JAR/JARM・wallet_nonce 等）
- OpenID4VCI 1.0 Final——credential issuance フロー・Wallet Attestation の詳細
- FAPI 2.0 Security Profile 2.0 の実装状況
- OpenID Federation 1.0——60日間パブリックレビュー完了（2025年12月）・Final 公開後のトラスト基盤への影響
- W3C Verifiable Credentials Data Model 2.0
- SD-JWT VC（draft-ietf-oauth-sd-jwt-vc）——RFC 9901 との関係・HAIP での採用・実装状況（RFC 9901 Note 済み）
- IETF OAuth 2.x 関連 RFC の動き
- WebAuthn Level 3 / CTAP 2.2 の標準化進捗
- FIDO CXP/CXF——正式標準化（2026年初頭）後のエコシステム展開（Note 済み、続報待ち）
- Digital Credentials API——RP 実装課題・OpenID4VP 組み合わせの実装詳細（Note 済み、深掘り余地あり）
- Android Credential Manager API——プラットフォームレベルのクレデンシャル管理と DC API の関係

**エコシステム**

- EU EUDI Wallet 実装ロードマップ・各国状況
- mDL (ISO 18013-5) の導入事例・技術詳細
- Passkeys / FIDO2 の普及状況・最新統計
- Apple / Google / Microsoft のデジタルウォレット戦略
- 日本のデジタルID動向（マイナンバーカード活用、行政API、民間連携）——Article 済み（JPKI基礎・マイナ保険証・次期カード）
- JPKI × OpenID4VP 連携——次期マイナンバーカード（2028年）での ECDSA 対応・Digital Credentials API 連携の可能性・国際標準との整合性
- 日本のデジタルID法制度——マイナンバー法改正・犯罪収益移転防止法 2027年施行・eKYC ワ方式廃止の業界インパクト
- 日本金融業界のパスキー必須化——証券口座乗っ取り事件と業界対応

**エンタープライズ ID セキュリティ**

- IPSIE（Interoperability Profile for Secure Identity in the Enterprise）——OpenID Foundation WG 進捗・相互運用テストイベント（Article 済み）
- Shared Signals Framework (SSF) / CAEP——エンタープライズ向け継続的アクセス評価の実装詳細
- OpenID Provider Commands——IdP からアプリへの強制セッション終了コマンドプロトコル
- FAPI 2.0 Security Profile 2.0 の実装状況

**セキュリティ**

- AI エージェント・NHI の次フェーズ——委譲チェーン管理・Agentic JWT・agent-sd-jwt ドラフトの動向
- IETF WIMSE WG——ワークロードアイデンティティの国際標準化（draft-ietf-wimse-s2s-protocol / identifier の進捗）
- DeepFake・AI生成攻撃と IAL の関係
- フィッシング耐性認証 (FIDO2, passkeys) の最新事例
- Account Takeover トレンドと対策

**プライバシー技術**

- Zero Knowledge Proof の実用化事例——Google Longfellow ZK・Groth16 の DC API 上での動向
- 選択的開示 (Selective Disclosure) の仕様比較
- Privacy-Enhancing Technologies (PET) の動向

**規制・ガバナンス**

- eIDAS 2.0 実施状況と各国対応——EU EUDI Wallet の法的義務化（2026年12月）と各国実装ロードマップ
- NIST SP 800-63-4 最終版（2025年7月31日）——DIRM・PAD 必須化・mDL/VC 受け入れ・実装インパクト
- FIDO Alliance Passkey Index——採用統計と分析
- OpenWallet Foundation ライブラリ群——DCQL TypeScript・OpenID4VC TS・OpenID Federation TS の採用状況と DIDComm への展開
- DIF Presentation Exchange の現状——DCQL 移行後の PE の位置づけ・既存実装への影響・残存する使われ方

### Step 3: コンテンツ形式の選択

以下の基準で形式を**自律的に選択**する（頻度制限なし）：

| 形式 | 選択基準 |
|------|---------|
| **Spec** (`docs/specs/<id>.md`) | 特定の RFC・標準仕様を中心とし、`docs/specs/` に該当ファイルが未存在。体系的整理で高い参照価値が出る場合 |
| **Article** (`docs/articles/YYYY-MM-<slug>.md`) | 複数の仕様・技術を横断する比較分析、長期トレンド解説、アーキテクチャ論。2000字以上 |
| **Note** (`docs/notes/YYYY-MM-DD-<slug>.md`) | 最新ニュース・エコシステム動向・実装状況・業界観察。800〜2000字 |

今日の日付はシステムコンテキスト（`currentDate`）で確認してから、正しいファイル名を付けること。

### Step 4: コンテンツ執筆

**Spec のファイル命名規則は `CLAUDE.md` を参照。**

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

[この記事が何を論じるか。読者が得られる価値。]

## [セクション1: 背景・問題提起]

[...]

## [セクション2: 技術分析・比較]

[...]

## [セクション3: 実装・事例]

[...]

## まとめと展望

[結論・今後の方向性・読者へのアクション提案。]

## 参考

- [リンクテキスト](URL)
```

**仕様書解説のテンプレート**:

```markdown
# [仕様名] — [正式タイトル]

> **発行**: [発行機関] / [発行年月] / **ステータス**: [標準の状態]
> **著者**: [主要著者] / **更新**: [主要な更新 RFC/仕様]

---

## 概要

[仕様が何を定義するか、なぜ存在するかを3〜5文で説明する。]

---

## 背景：なぜこの仕様が必要だったか

[この仕様が解決した問題・設計の動機。]

---

## 基本概念

[仕様を理解するために必要な用語・ロール・データ構造の定義。]

---

## [主要なフロー/プロトコル詳細]

[シーケンス図（ASCII）やリクエスト/レスポンス例を含める。]

---

## セキュリティ上の重要な考慮事項

[仕様が定義するセキュリティ要件・既知の脅威と対策。]

---

## 後継・関連仕様

[この仕様を拡張・補完・置き換える仕様の一覧表。]

---

## 実装状況・採用

[主要な実装例・採用サービス・エコシステムの現状。]

---

## 読み解きのポイント

[仕様を読む際に見落としやすい設計判断・誤解されやすいポイント。]

---

## 参考

- [正式仕様書](URL)
- [関連 RFC/仕様](URL)
```

**執筆基準**:

- **日本語**で書く（技術用語・固有名詞・仕様名は英語のまま可）
- **自分の視点・考察**を必ず入れる（要約サイトではなく、プロとしての解釈）
- **一次情報**へリンクする（仕様書・RFC・公式ブログ・学術論文を優先）
- **具体性**を重視する（抽象論より実装例・数字・タイムラインを含める）

### Step 5: 自己改善

コンテンツを書き終えたら、**このコマンド自身** (`.claude/commands/work.md`) と **`CLAUDE.md`** を見直して改善する。

Read ツールで両ファイルを読み込み、以下の観点で評価する：

**トピックリスト更新**

- 今回のリサーチで、候補リストにまだ載っていない重要トピックはあるか？
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

### Step 6: コミットとプッシュ

```bash
# ステージング（変更したファイルのみ個別に指定）
git add docs/notes/<filename>.md          # 新規ノート
git add docs/articles/<filename>.md       # 新規記事
git add docs/specs/<filename>.md          # 新規仕様書解説
git add .claude/commands/work.md          # コマンドを更新した場合
git add CLAUDE.md                         # CLAUDE.md を更新した場合

# コミット（日本語メッセージ推奨）
git commit -m "Add note: [タイトル]"
# または
git commit -m "Add article: [タイトル]"
git commit -m "Add spec: [仕様名] — [正式タイトル]"
# 複数更新の場合：
git commit -m "Add note: [タイトル] + /work コマンド改善"

# プッシュ（現在のブランチへ）
git push -u origin HEAD
```

---

*このコマンドは毎回実行するたびに新しいコンテンツを生み出し、自らも進化する。
`main` ブランチ上で実行すれば、GitHub Actions 経由で自動デプロイされる。*
