import { defineConfig } from 'vitepress'

export default defineConfig({
  lang: 'ja',
  title: 'nbifrye.com',
  description: 'nbifrye のサイト',
  base: '/',

  themeConfig: {
    nav: [
      { text: 'ホーム', link: '/' },
    ],

    socialLinks: [],
  },
})
