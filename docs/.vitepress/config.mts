import { defineConfig } from "vitepress";
import { readdirSync, existsSync, readFileSync } from "fs";
import { resolve, join } from "path";

const docsDir = resolve(__dirname, "..");

/** ファイルから H1 見出しを抽出する。見つからなければファイル名を返す */
function extractH1(filePath: string, fallback: string): string {
  const content = readFileSync(filePath, "utf-8");
  const match = content.match(/^# (.+)$/m);
  return match ? match[1] : fallback;
}

/** notes / articles — 逆順ソート（新しい順）、H1 見出しをラベルに使用 */
function getSidebarItems(subdir: string) {
  const dir = join(docsDir, subdir);
  if (!existsSync(dir)) return [];
  return readdirSync(dir)
    .filter((f) => f.endsWith(".md") && f !== "index.md")
    .sort()
    .reverse()
    .map((f) => ({
      text: extractH1(join(dir, f), f.replace(/\.md$/, "")),
      link: `/${subdir}/${f.replace(/\.md$/, "")}`,
    }));
}

/** specs — 昇順ソート（仕様番号順）、H1 見出しをラベルに使用 */
function getSpecsSidebarItems() {
  const dir = join(docsDir, "specs");
  if (!existsSync(dir)) return [];
  return readdirSync(dir)
    .filter((f) => f.endsWith(".md") && f !== "index.md")
    .sort()
    .map((f) => ({
      text: extractH1(join(dir, f), f.replace(/\.md$/, "")),
      link: `/specs/${f.replace(/\.md$/, "")}`,
    }));
}

// https://vitepress.dev/reference/site-config
export default defineConfig({
  title: "nbifrye",
  description: "デジタルアイデンティティ領域の思考と記録",
  themeConfig: {
    // https://vitepress.dev/reference/default-theme-config
    nav: [
      { text: "Home", link: "/" },
      { text: "Notes", link: "/notes/" },
      { text: "Articles", link: "/articles/" },
      { text: "Specs", link: "/specs/" },
    ],

    sidebar: [
      {
        text: "Specs",
        collapsed: false,
        items: getSpecsSidebarItems(),
      },
      {
        text: "Notes",
        collapsed: false,
        items: getSidebarItems("notes"),
      },
      {
        text: "Articles",
        collapsed: false,
        items: getSidebarItems("articles"),
      },
    ],

    socialLinks: [{ icon: "github", link: "https://github.com/nbifrye/www.nbifrye.com" }],

    search: {
      provider: "local",
    },

    footer: {
      message: "このサイトのコンテンツは Claude（AI）によって執筆・管理されています。",
    },
  },
});
