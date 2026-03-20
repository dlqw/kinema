import { defineConfig } from 'vitepress';

export default defineConfig({
  title: 'AniMaker',
  description: '现代化动画渲染框架',

  themeConfig: {
    nav: [
      { text: '框架指南', link: '/guide/getting-started' },
      { text: '视频工作站', link: '/workstation/' },
      { text: '开发者', link: '/development/' },
      { text: 'API', link: '/api/' },
      { text: '示例', link: '/examples/' },
      { text: 'GitHub', link: 'https://github.com/your-username/animaker' },
    ],

    sidebar: {
      '/guide/': [
        {
          text: '入门教程',
          items: [
            { text: '快速开始', link: '/guide/getting-started' },
            { text: '动画创建入门', link: '/guide/animation-basics' },
            { text: '核心概念', link: '/guide/concepts' },
          ],
        },
        {
          text: '进阶教程',
          items: [
            { text: '自定义动画', link: '/guide/custom-animations' },
            { text: '自定义渲染对象', link: '/guide/custom-objects' },
            { text: '插件开发', link: '/guide/plugins' },
            { text: '性能优化', link: '/guide/performance' },
          ],
        },
        {
          text: '迁移指南',
          items: [
            { text: '迁移指南索引', link: '/guide/migration/' },
            { text: '从 Manim 迁移', link: '/guide/migration/manim' },
            { text: '从 GSAP 迁移', link: '/guide/migration/gsap' },
            { text: '从 Framer Motion 迁移', link: '/guide/migration/framer-motion' },
          ],
        },
      ],
      '/api/': [
        {
          text: 'API 文档',
          items: [
            { text: 'API 概览', link: '/api/' },
            { text: '完整 API 文档（HTML）', link: '/api/html/index.html' },
          ],
        },
        {
          text: '核心 API',
          items: [
            { text: '核心类型', link: '/api/core' },
            { text: '动画', link: '/api/animation' },
            { text: '场景', link: '/api/scene' },
            { text: '缓动函数', link: '/api/easing' },
          ],
        },
      ],
      '/examples/': [
        { text: '基础示例', link: '/examples/' },
        { text: '进阶示例', link: '/examples/advanced' },
        { text: '完整项目', link: '/examples/projects' },
      ],
      '/faq/': [
        {
          text: '常见问题',
          items: [
            { text: 'FAQ 索引', link: '/faq/' },
            { text: '一般问题', link: '/faq/general' },
            { text: '性能问题', link: '/faq/performance' },
            { text: '渲染问题', link: '/faq/rendering' },
            { text: '故障排除', link: '/faq/troubleshooting' },
          ],
        },
      ],
      '/workstation/': [
        {
          text: '视频工作站',
          items: [
            { text: '概述', link: '/workstation/' },
            { text: '安装指南', link: '/workstation/installation' },
            { text: '用户手册', link: '/workstation/user-guide' },
            { text: '项目管理', link: '/workstation/projects' },
            { text: '编辑器功能', link: '/workstation/editor' },
            { text: '设置配置', link: '/workstation/settings' },
          ],
        },
      ],
      '/development/': [
        {
          text: '开发者文档',
          items: [
            { text: '概述', link: '/development/' },
            { text: '贡献指南', link: '/development/contributing' },
            { text: '架构设计', link: '/development/architecture' },
          ],
        },
      ],
    },

    socialLinks: [
      { icon: 'github', link: 'https://github.com/your-username/animaker' },
    ],

    search: {
      provider: 'local',
    },
  },

  markdown: {
    theme: 'github-dark',
    lineNumbers: true,
  },
});
