import { defineConfig } from "vitepress";
import { withMermaid } from "vitepress-plugin-mermaid";

export default withMermaid(
  defineConfig({
    title: "kayak-lab",
    description:
      "Event-sourced agent interaction platform built with Deno 2",
    base: "/kayak-lab/",

    markdown: {
      mermaid: true,
    },

    mermaid: {
      theme: "base",
      themeVariables: {
        primaryColor: "#e0f2fe",
        primaryTextColor: "#0f172a",
        primaryBorderColor: "#5b9bd5",
        lineColor: "#64748b",
        secondaryColor: "#f0fdf4",
        tertiaryColor: "#fef3c7",
      },
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
  })
);
