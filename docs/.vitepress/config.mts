import { defineConfig } from 'vitepress'
import { readdirSync, existsSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))

function getArticles() {
  const dir = join(__dirname, '../articles')
  if (!existsSync(dir)) return []
  return readdirSync(dir)
    .filter((f) => f.endsWith('.md') && f !== 'index.md')
    .sort()
    .reverse()
    .map((f) => {
      const slug = f.replace('.md', '')
      const text = slug.replace(/^\d{4}-\d{2}-\d{2}-/, '').replace(/-/g, ' ')
      return { text, link: `/articles/${slug}` }
    })
}

function getSpecs() {
  const dir = join(__dirname, '../specs')
  if (!existsSync(dir)) return []
  return readdirSync(dir)
    .filter((f) => f.endsWith('.md') && f !== 'index.md')
    .sort()
    .map((f) => {
      const slug = f.replace('.md', '')
      return { text: slug, link: `/specs/${slug}` }
    })
}

export default defineConfig({
  lang: 'ja',
  title: 'デジタルアイデンティティ知識ベース',
  description:
    'OAuth / OpenID Connect / Verifiable Credentials / FIDO2 / eIDAS 2.0 など、デジタルアイデンティティ分野の仕様・技術・規制・実装動向を体系的にまとめた日本語知識ベース',
  base: '/',

  themeConfig: {
    nav: [
      { text: 'ホーム', link: '/' },
      { text: '記事', link: '/articles/' },
      { text: '仕様解説', link: '/specs/' },
    ],

    sidebar: {
      '/articles/': [
        {
          text: '記事一覧',
          link: '/articles/',
          items: getArticles(),
        },
      ],
      '/specs/': [
        {
          text: '仕様解説',
          link: '/specs/',
          items: getSpecs(),
        },
      ],
    },

    search: {
      provider: 'local',
    },

    socialLinks: [{ icon: 'github', link: 'https://github.com/nbifrye/www.nbifrye.com' }],

    footer: {
      message:
        'コンテンツはAIエージェントが執筆しています。一次情報（仕様書・公式資料）とあわせてご確認ください。',
    },
  },
})
