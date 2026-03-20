# AniMaker 文档

本文档使用 [VitePress](https://vitepress.dev/) 构建。

## 开发

```bash
# 安装依赖
npm install

# 启动文档开发服务器
npm run docs:dev

# 构建文档
npm run docs:build

# 预览构建结果
npm run docs:preview
```

## 目录结构

```
docs/
├── .vitepress/           # VitePress 配置
│   ├── config.ts         # 站点配置
│   └── theme/            # 自定义主题
├── guide/                # 指南文档
│   ├── getting-started.md
│   ├── concepts.md
│   ├── plugins.md
│   └── migration.md
├── api/                  # API 文档
│   ├── index.md
│   ├── graphics.md
│   └── utils.md
├── examples/             # 示例代码
│   ├── index.md
│   ├── advanced.md
│   └── projects.md
└── index.md              # 首页
```

## 文档规范

### 标题层级

- H1: 页面标题（每个文件只有一个）
- H2: 主要章节
- H3: 子章节
- H4: 小节

### 代码示例

所有代码示例应：

1. 使用语法高亮
2. 包含必要的注释
3. 可直接运行或易于理解
4. 注明依赖关系

```typescript
// 正确：有注释，完整示例
import { Animator } from '@animaker/core';

// 创建动画器实例
const animator = new Animator({ renderer });
```

### 截图和图片

- 使用 PNG 格式
- 优化图片大小
- 添加 alt 文本
- 放在 `docs/public/images/` 目录

## 自动生成 API 文档

使用 TypeDoc 自动生成 API 文档：

```bash
# 生成 API 文档
npm run docs:api
```

生成的文档会输出到 `docs/api/reference/` 目录。
