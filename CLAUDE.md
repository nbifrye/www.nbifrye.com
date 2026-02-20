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

- `docs/notes/YYYY-MM-DD-<slug>.md` — ニュース反応・短い考察（800〜2000字）
- `docs/articles/YYYY-MM-<slug>.md` — 深い技術解説・月1〜2本（2000字以上）

サイドバーは `docs/.vitepress/config.mts` が自動生成（逆順ソート）。新しいファイルを追加するだけで反映される。

## Git ワークフロー

`main` ブランチへのプッシュで GitHub Actions が自動デプロイ（GitHub Pages）。

```bash
git add <specific-files>
git commit -m "Add note: タイトル"   # または "Add article: タイトル"
git push -u origin HEAD
```

## カスタムコマンド

- `/work` — デジタルアイデンティティのコンテンツを調査・執筆する自律ワークフロー
