# デジタルアイデンティティ知識ベース — プロジェクト憲法

## プロジェクト概要

このサイトは、デジタルアイデンティティ分野の **Body of Knowledge** を構成する日本語技術知識ベースです。
OAuth / OpenID Connect / Verifiable Credentials / FIDO2 / eIDAS 2.0 など、アイデンティティに関わる仕様・技術・規制・実装動向を体系的にカバーします。

記事はすべてAIエージェントが執筆します。`/work` を実行するだけで、テーマ選定・調査・執筆・レビュー・校正・基盤改善が自律的に行われます。

**技術スタック**: VitePress 1.6.3 / GitHub Pages / oxfmt (Markdown formatter)

---

## コンテンツ構造

```
docs/
├── index.md              # ホームページ
├── articles/
│   ├── index.md          # 記事一覧
│   └── YYYY-MM-DD-slug.md  # 個別記事（日付+スラッグ）
└── specs/
    ├── index.md          # 仕様解説一覧
    └── id.md             # 仕様解説（例: rfc6749.md, oidc-core.md）
```

### Articles (`docs/articles/YYYY-MM-DD-slug.md`)

ニュース反応・技術分析・比較考察など。複数の仕様を横断する記事や、実装・業界動向に関する分析。

- ファイル名: `YYYY-MM-DD-<kebab-case>.md` （例: `2026-04-01-openid4vp-overview.md`）
- 日付は記事を最初に作成した日（UTC+9）
- スラッグは内容を端的に表す英語（ハイフン区切り）

### Specs (`docs/specs/id.md`)

個別仕様の深い解説。背景・設計思想・技術詳細・実装上の注意点・後継仕様まで一本の記事で読めるようにまとめる。

- ファイル名: 仕様IDそのもの（例: `rfc6749.md`, `oidc-core.md`, `webauthn.md`）
- 対象: IETF RFC / OpenID Foundation / W3C / FIDO Alliance / ISO/IEC 仕様

---

## 執筆スタイル

詳細は `.claude/skills/work/style-guide.md` を参照。要点:

- **言語**: 日本語（技術用語・仕様名・RFC番号はそのまま英語）
- **視点**: 実装者・専門家の視点。単なる要約ではなく批評・分析・実践的示唆を含む
- **一次情報**: 主張には必ず一次ソース（仕様書 URL・RFC番号）を付ける
- **具体例**: 抽象論より具体的なコード例・シーケンス・ユースケース
- **AI免責**: 各ページ冒頭に AI 生成コンテンツである旨を明記

---

## コマンド

```bash
npm run docs:dev      # 開発サーバー (localhost:5173)
npm run docs:build    # 本番ビルド → docs/.vitepress/dist/
npm run docs:preview  # ビルド結果のプレビュー
npm run fmt -- <file> # Markdown ファイルのフォーマット (oxfmt)
```

---

## フォーマット

`.md` ファイルを新規作成・編集した後は必ず oxfmt でフォーマットしてください。

```bash
npm run fmt -- docs/articles/2026-04-01-example.md
```

PostToolUse フックにより、Write/Edit ツール使用後は自動的に実行されます（`.claude/settings.json`）。

---

## 品質基準

1. **一次情報必須**: 事実の主張には仕様書・公式資料へのリンクが必要
2. **最新性**: 仕様のバージョンを確認し、廃止済み・superseded の情報は明記
3. **具体例優先**: 抽象的な説明には必ず具体例を添える
4. **批評的視点**: メリットだけでなく設計上のトレードオフ・限界・注意点も記述
5. **長さの目安**: Spec 記事 3,000〜8,000字 / Article 1,500〜4,000字

---

## カバレッジ管理

`.claude/skills/work/topics.md` にトピックマトリクスを管理しています。
記事を追加したら、該当行の Score 列を更新し、File(s) と Last Updated を記入してください。

6つのドメイン:
1. OpenID Standards (OAuth2, OIDC, OpenID4VC, OpenID Federation, FAPI2)
2. W3C Standards (Verifiable Credentials, DID, WebAuthn)
3. Regulatory (eIDAS 2.0, NIST SP 800-63-4, 日本の規制)
4. Enterprise Identity (SSF/CAEP, IPSIE, SCIM, WIMSE)
5. Emerging Technologies (ZKP, AI Agents × Identity, mDL)
6. Regional Adoption (EUDI Wallet, マイナカード, Passkey 戦略)

---

## Git ワークフロー

- **ブランチ**: スケジュールタスクが実行時に払い出すブランチを使用する
- **コミットメッセージ**:
  - 新規記事: `feat: <トピック名>の記事を追加`
  - 基盤改善: `chore: <変更内容>`
  - バグ修正: `fix: <内容>`
- **Push**: `git push origin HEAD:main` を第一戦略とし、失敗時は `git push -u origin HEAD`（現在のブランチへ）

---

## 自律実行の注意事項

- `/work` スキルは `context: fork` で分離実行される
- 各実行で必ず 1 本のコンテンツを完成させてコミット・プッシュすること
- 基盤ファイル（CLAUDE.md / topics.md / style-guide.md / config.mts）の改善も同じコミットに含めてよい
- 実行中に不明点が生じても人間に質問せず、最善判断で進めること
