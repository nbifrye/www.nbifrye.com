import { defineConfig } from "vitepress";
import { readdirSync, existsSync, readFileSync } from "fs";
import { resolve, join } from "path";

const docsDir = resolve(__dirname, "..");

function getSidebarItems(subdir: string) {
  const dir = join(docsDir, subdir);
  if (!existsSync(dir)) return [];
  return readdirSync(dir)
    .filter((f) => f.endsWith(".md") && f !== "index.md")
    .sort()
    .reverse()
    .map((f) => ({
      text: f.replace(/\.md$/, ""),
      link: `/${subdir}/${f.replace(/\.md$/, "")}`,
    }));
}

function getSpecsSidebarItems() {
  const dir = join(docsDir, "specs");
  if (!existsSync(dir)) return [];
  return readdirSync(dir)
    .filter((f) => f.endsWith(".md") && f !== "index.md")
    .sort()
    .map((f) => {
      const content = readFileSync(join(dir, f), "utf-8");
      const match = content.match(/^# (.+)$/m);
      const title = match ? match[1] : f.replace(/\.md$/, "");
      return {
        text: title,
        link: `/specs/${f.replace(/\.md$/, "")}`,
      };
    });
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
