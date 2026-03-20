# AniMaker 文档架构设计

## 文档工具栈

### 核心工具

- **VitePress** - 文档网站生成器
  - 快速的开发服务器
  - Markdown 原生支持
  - 响应式设计
  - 搜索功能

- **TypeDoc** - API 文档生成器
  - 从 TypeScript 类型定义自动生成
  - 支持 Markdown 输出
  - 与 VitePress 集成

### 开发工具

- **Changesets** - 变更日志管理
- **ESLint** - 代码规范检查
- **Prettier** - 代码格式化

## 文档结构

```
docs/
├── .vitepress/              # VitePress 配置
│   ├── config.ts            # 站点配置
│   └── theme/               # 自定义主题
│       ├── index.ts
│       └── custom.css       # 自定义样式
├── guide/                   # 指南文档
│   ├── getting-started.md   # 快速开始
│   ├── concepts.md          # 核心概念
│   ├── plugins.md           # 插件开发
│   └── migration.md         # 迁移指南
├── api/                     # API 文档
│   ├── index.md             # API 概览
│   └── reference/           # TypeDoc 生成（自动）
├── examples/                # 示例集合
│   └── index.md             # 示例索引
├── public/                  # 静态资源
│   ├── images/              # 图片
│   ├── videos/              # 视频
│   └── examples/            # 可运行示例
├── index.md                 # 首页
├── contributing.md          # 贡献指南
├── README.md                # 文档说明
└── typedoc.config.json      # TypeDoc 配置
```

## 文档类型

### 1. 指南文档（Guide）

面向用户的教程和概念说明：

- **Getting Started** - 5分钟快速上手
- **Concepts** - 核心概念深度解析
- **Plugins** - 插件开发教程
- **Migration** - 从其他框架迁移

### 2. API 文档（API Reference）

完整的 API 参考，由 TypeDoc 自动生成：

- 核心类（Animator, Renderer, Tween, Timeline）
- 图形对象（Shape, Rectangle, Circle, Text 等）
- 工具函数（Easing, Utils, Color）

### 3. 示例集合（Examples）

实战示例代码，按难度分级：

- 基础示例（移动、旋转、缩放）
- 进阶示例（序列、并行、交互）
- 完整项目（小游戏、数据可视化）

### 4. 开发者文档

面向贡献者和插件开发者：

- Contributing - 贡献指南
- Architecture - 架构设计文档
- Changelog - 版本变更记录

## 文档模板

### 指南文档模板

```markdown
# 标题

简介段落，说明本文档的内容。

## 前置条件

- 条件 1
- 条件 2

## 主要内容

### 小节 1

内容...

### 小节 2

内容...

## 代码示例

```typescript
// 示例代码
\`\`\`

## 相关文档

- [相关链接](../path/to/page.md)
```

### API 文档模板

TypeDoc 自动生成，遵循 JSDoc 规范：

```typescript
/**
 * 类的简短描述
 *
 * 详细说明...
 *
 * @example
 * ```ts
 * const instance = new ClassName();
 * ```
 */
class ClassName {
  /**
   * 方法描述
   * @param param1 - 参数说明
   * @returns 返回值说明
   */
  methodName(param1: Type1): ReturnType {
    // 实现
  }
}
```

## 样式指南

### 设计规范

- 主色：`#3498db`（蓝色）
- 辅助色：`#e74c3c`（红色）
- 强调色：`#9b59b6`（紫色）
- 背景：`#1e1e1e`（深色）

### 排版规范

- 标题层级清晰（H1 → H2 → H3）
- 代码块使用语法高亮
- 表格用于对比和说明
- 警告框用于注意事项

## 自动化流程

### 1. API 文档生成

```bash
npm run docs:api
```

从 TypeScript 类型定义自动生成 Markdown 格式的 API 文档。

### 2. 文档构建

```bash
npm run docs:build
```

生成静态 HTML 文件，可部署到任何静态托管服务。

### 3. 开发预览

```bash
npm run docs:dev
```

启动开发服务器，实时预览文档更改。

## 质量标准

### 文档质量检查清单

- [ ] 所有公共 API 都有文档
- [ ] 代码示例可以运行
- [ ] 链接有效性验证
- [ ] 拼写和语法检查
- [ ] 与代码同步更新

### 代码文档要求

- 所有导出的函数/类/接口必须有 JSDoc
- JSDoc 包含：描述、参数、返回值、示例
- 使用 `@example` 标签提供使用示例
- 复杂逻辑添加行内注释

## 发布流程

1. 更新 `CHANGELOG.md`
2. 运行 `npm run docs:api` 生成 API 文档
3. 运行 `npm run docs:build` 构建文档
4. 部署到 GitHub Pages 或其他托管服务
5. 在发布说明中包含文档链接

## 扩展计划

### 短期（v0.2）

- [ ] 添加交互式示例编辑器
- [ ] 完善插件开发文档
- [ ] 添加性能优化指南

### 中期（v0.3）

- [ ] 多语言支持（英文、中文）
- [ ] 视频教程
- [ ] API 版本切换

### 长期（v1.0+）

- [ ] 社区贡献的示例集合
- [ ] 在线 Playground
- [ ] API 浏览器增强
