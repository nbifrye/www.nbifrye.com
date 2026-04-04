# デジタルアイデンティティ知識ベース

OAuth / OpenID Connect / Verifiable Credentials / FIDO2 / eIDAS 2.0 など、デジタルアイデンティティ分野の仕様・技術・規制・実装動向を体系的にカバーする日本語技術知識ベースです。

**サイト**: https://www.nbifrye.com

---

## 概要

このサイトは、アイデンティティ分野の **Body of Knowledge** を目指した技術リファレンスです。

- **対象読者**: 実装者・セキュリティ専門家・アイデンティティエンジニア
- **記事スタイル**: 仕様の要約にとどまらず、設計思想・トレードオフ・実装上の注意点まで踏み込んだ批評的分析
- **執筆**: AIエージェント（Claude）が `/work` スキルで自律的に執筆。一次ソース（RFC・仕様書）に基づく

---

## カバレッジ

| ドメイン                     | 主なトピック                                |
| ---------------------------- | ------------------------------------------- |
| **1. OpenID Standards**      | OAuth 2.0, OIDC, OpenID4VC, FAPI 2.0        |
| **2. W3C Standards**         | Verifiable Credentials, DID, WebAuthn/FIDO2 |
| **3. Regulatory**            | eIDAS 2.0, NIST SP 800-63-4, 日本の規制     |
| **4. Enterprise Identity**   | SCIM 2.0, SSF/CAEP, WIMSE                   |
| **5. Emerging Technologies** | ZKP, AI Agents × Identity, mDL              |
| **6. Regional Adoption**     | EUDI Wallet, マイナカード, Passkey 戦略     |

---

## コンテンツ構造

```
docs/
├── specs/          # 個別仕様の深い解説（例: rfc6749.md, oidc-core.md）
└── articles/       # 技術分析・比較考察・実装動向（例: 2026-04-03-eudi-wallet.md）
```

- **Specs** (`docs/specs/`): 1仕様 = 1ファイル。背景・設計思想・技術詳細・実装上の注意点を網羅
- **Articles** (`docs/articles/`): 複数仕様の横断分析、業界動向、実装レポート。ファイル名は `YYYY-MM-DD-slug.md`

---

## 技術スタック

- [VitePress](https://vitepress.dev/) 1.6.3 — 静的サイトジェネレーター
- GitHub Pages — ホスティング
- [oxfmt](https://github.com/oxc-project/oxfmt) — Markdown フォーマッター
- [vitepress-plugin-mermaid](https://github.com/emersonbottero/vitepress-plugin-mermaid) — シーケンス図・フローチャート

---

## ローカル開発

```bash
npm install

npm run docs:dev      # 開発サーバー (http://localhost:5173)
npm run docs:build    # 本番ビルド → docs/.vitepress/dist/
npm run docs:preview  # ビルド結果のプレビュー
npm run fmt -- <file> # Markdown ファイルのフォーマット
```

---

## コンテンツ追加

記事の執筆は Claude Code の `/work` スキルで自律実行されます。

```
/work
```

テーマ選定・調査・執筆・レビュー・コミット・プッシュまで一括で行われます。既存記事のレビュー・改善は `/review` スキルを使用してください。

---

## 免責事項

本サイトのコンテンツはAIエージェント（Claude）が生成しています。正確性の確保に努めていますが、仕様の解釈や記述に誤りが含まれる可能性があります。重要な実装判断を行う際は必ず一次ソース（RFC・公式仕様書）を参照してください。
