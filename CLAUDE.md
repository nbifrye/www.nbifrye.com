# www.nbifrye.com

デジタルアイデンティティ標準・技術・エコシステムを記録・考察するサイト（VitePress + GitHub Pages）。

## コマンド

```bash
npm run docs:dev      # 開発サーバー起動（localhost:5173）
npm run docs:build    # 本番ビルド → docs/.vitepress/dist/
npm run docs:preview  # ビルド成果のプレビュー
npm run fmt           # Markdown フォーマット（oxfmt）
```

## コンテンツ構造

```
docs/
├── index.md                          # トップページ（hero + About）
├── articles/
│   ├── index.md                      # Articles セクション索引
│   └── YYYY-MM-DD-<slug>.md          # 記事（短い考察〜深い技術解説）
└── specs/
    ├── index.md                      # Specs セクション索引
    └── <id>.md                       # 仕様書1本を体系的に解説するリファレンス記事
```

### コンテンツ種別の使い分け

| 種別 | ファイル名 | 用途 |
|------|-----------|------|
| **Article** | `YYYY-MM-DD-<slug>.md` | ニュース反応・考察・技術解説・比較分析 |
| **Spec** | `<id>.md` | 仕様書1本を体系的に解説するリファレンス |

### Spec のファイル命名規則

| 発行機関 | 形式 | 例 |
|---------|------|-----|
| IETF RFC | `rfc<番号>.md` | `rfc6749.md`, `rfc7636.md`, `rfc9101.md` |
| OpenID Foundation | `<仕様名>.md` | `openid4vp.md`, `openid4vci.md`, `fapi2.md` |
| W3C | `<仕様名>.md` | `vc-data-model.md`, `did-core.md`, `webauthn.md` |
| FIDO Alliance | `<仕様名>.md` | `passkey.md`, `fido-cxp.md` |
| ISO/IEC | `iso<番号>.md` | `iso18013-5.md` |

## サイドバー自動生成

`docs/.vitepress/config.mts` がビルド時にファイルシステムから自動生成する。

- **articles**: 逆順ソート（新しい順）+ ファイルの H1 見出しをサイドバーラベルに使用
- **specs**: 昇順ソート（仕様番号順）+ ファイルの H1 見出しをサイドバーラベルに使用

新しいファイルを追加するだけで反映される。`config.mts` の手動編集は不要。

## Git ワークフロー

`main` ブランチへのプッシュで GitHub Actions が自動デプロイ（GitHub Pages）。

```bash
git add <specific-files>
git commit -m "Add article: タイトル"   # または "Add spec: タイトル"
git push -u origin HEAD
```

## CI/CD

- `.github/workflows/deploy.yml` — `main` ブランチへのプッシュで GitHub Pages にデプロイ

## カスタムコマンド

- `/work` — デジタルアイデンティティのコンテンツを調査・執筆する自律ワークフロー

## 自動フック

- **PostToolUse（Write/Edit）**: `.md` ファイルへの書き込み後に `oxfmt` で自動フォーマット
