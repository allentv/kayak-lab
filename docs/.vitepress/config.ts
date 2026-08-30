import { defineConfig } from "vitepress";

export default defineConfig({
  title: "kayak-lab",
  description:
    "Event-sourced agent interaction platform built with Deno 2",
  base: "/kayak-lab/",

  markdown: {
    mermaid: true,
  },

  themeConfig: {
    nav: [
      { text: "Home", link: "/" },
      { text: "Architecture", link: "/architecture" },
      { text: "Getting Started", link: "/getting-started" },
      { text: "Event Types", link: "/event-types" },
      {
        text: "GitHub",
        link: "https://github.com/allentv/kayak-lab",
      },
    ],

    sidebar: [
      {
        text: "Introduction",
        items: [
          { text: "Overview", link: "/" },
          { text: "Getting Started", link: "/getting-started" },
        ],
      },
      {
        text: "Core Concepts",
        items: [
          { text: "Architecture", link: "/architecture" },
          { text: "Event Types", link: "/event-types" },
          { text: "Sessions", link: "/sessions" },
          { text: "Capabilities", link: "/capabilities" },
        ],
      },
      {
        text: "Development",
        items: [
          { text: "Contributing", link: "/contributing" },
          { text: "Changelog", link: "/changelog" },
        ],
      },
    ],

    socialLinks: [
      { icon: "github", link: "https://github.com/allentv/kayak-lab" },
    ],

    footer: {
      message: "Released under the ISC License.",
      copyright: "© 2026 kayak-lab",
    },
  },
});
