import { defineConfig } from 'vitepress'
import { withMermaid } from 'vitepress-plugin-mermaid'
import { readdirSync, existsSync, readFileSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))

function getTitle(filePath: string, fallback: string): string {
  const content = readFileSync(filePath, 'utf-8')
  const frontmatterMatch = content.match(/^---\s*\n([\s\S]*?)\n---/)
  if (frontmatterMatch) {
    const titleMatch = frontmatterMatch[1].match(/^title:\s*["']?(.+?)["']?\s*$/m)
    if (titleMatch) return titleMatch[1]
  }
  const headingMatch = content.match(/^#\s+(.+)$/m)
  if (headingMatch) return headingMatch[1]
  return fallback
}

function getTags(filePath: string): string[] {
  const content = readFileSync(filePath, 'utf-8')
  const frontmatterMatch = content.match(/^---\s*\n([\s\S]*?)\n---/)
  if (!frontmatterMatch) return []
  const tagsMatch = frontmatterMatch[1].match(/^tags:\s*\n((?:\s*-\s*.+\n?)*)/m)
  if (!tagsMatch || !tagsMatch[1]) return []
  return tagsMatch[1]
    .split('\n')
    .map((line) => line.match(/^\s*-\s*(.+)\s*$/)?.[1]?.trim())
    .filter((tag): tag is string => Boolean(tag))
}

function getNavText(filePath: string, fallback: string): string {
  const title = getTitle(filePath, fallback)
  const tags = getTags(filePath)
  return tags.includes('レビュー済み') ? `✅ ${title}` : title
}

function getArticles() {
  const dir = join(__dirname, '../articles')
  if (!existsSync(dir)) return []
  return readdirSync(dir)
    .filter((f) => f.endsWith('.md') && f !== 'index.md')
    .sort()
    .reverse()
    .map((f) => {
      const slug = f.replace('.md', '')
      const fallback = slug.replace(/^\d{4}-\d{2}-\d{2}-/, '').replace(/-/g, ' ')
      const text = getNavText(join(dir, f), fallback)
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
      const text = getNavText(join(dir, f), slug)
      return { text, link: `/specs/${slug}` }
    })
}

export default withMermaid(defineConfig({
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
}))
