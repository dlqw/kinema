# 文档贡献指南

## 快速开始

```bash
# 启动文档开发服务器
npm run docs:dev

# 在浏览器打开
# http://localhost:5173
```

## 文档工作流程

### 1. 编写文档

- 在 `docs/` 目录下创建或编辑 `.md` 文件
- 使用 Markdown 语法编写内容
- 遵循文档模板和样式指南

### 2. 查看预览

文档服务器会自动刷新，实时查看更改效果。

### 3. 构建验证

```bash
# 构建文档
npm run docs:build

# 预览构建结果
npm run docs:preview
```

### 4. 提交更改

遵循项目的 Commit 规范：

- `docs:` 文档更新
- `docs:api` API 文档更新

## 文档类型

### 指南文档 (Guide/)

教学性质的文档，帮助用户理解和使用框架。

**目录结构：**

```
guide/
├── getting-started.md   # 快速开始
├── concepts.md          # 核心概念
├── plugins.md           # 插件开发
└── migration.md         # 迁移指南
```

**编写规范：**

- 使用渐进式的讲解方式
- 提供可运行的代码示例
- 添加图表和截图辅助说明
- 包含"下一步"引导

### API 文档 (api/)

API 参考文档，由 TypeDoc 自动生成。

**更新流程：**

1. 在源代码中添加/更新 JSDoc 注释
2. 运行 `npm run docs:api` 生成文档
3. 检查生成的文档是否正确

**JSDoc 规范：**

````typescript
/**
 * 动画器类，负责管理和控制动画播放
 *
 * @example
 * ```ts
 * const animator = new Animator({ renderer });
 * animator.play();
 * ```
 *
 * @see {@link Renderer} 渲染器接口
 * @since 0.1.0
 */
class Animator {
  /**
   * 播放动画
   *
   * @param from - 起始时间（毫秒），默认从当前位置开始
   * @throws {Error} 如果没有可播放的动画
   *
   * @example
   * ```ts
   * animator.play();
   * animator.play(1000); // 从1秒处开始播放
   * ```
   */
  play(from?: number): void {
    // ...
  }
}
````

### 示例文档 (examples/)

实战示例，展示框架的各种用法。

**示例规范：**

- 完整可运行的代码
- 包含详细注释
- 说明实现原理
- 提供在线演示链接（如可能）

## 文档样式

### 标题层级

```markdown
# H1 - 页面标题（每个文件只有一个）

## H2 - 主要章节

### H3 - 子章节

#### H4 - 小节
```

### 代码块

使用语言标识符启用语法高亮：

````markdown
```typescript
const animator = new Animator();
```
````

### 警告框

```markdown
::: warning 注意
这是一个警告信息
:::

::: tip 提示
这是一个提示信息
:::
```

### 链接

- 内部链接：`[快速开始](./getting-started.md)`
- 外部链接：`[VitePress](https://vitepress.dev/)`
- API 链接：`[@kinema/core](../api/)

## 图片和媒体

### 图片存放

```
docs/public/images/
├── guide/          # 指南用图
├── api/            # API 示意图
├── examples/       # 示例截图
└── logos/          # Logo 和品牌资源
```

### 图片使用

```markdown
![图片描述](/images/guide/example.png)
```

### 视频支持

```markdown
<video src="/videos/demo.mp4" controls></video>
```

## 常见任务

### 添加新指南

1. 在 `docs/guide/` 创建新文件
2. 在 `docs/.vitepress/config.ts` 添加到侧边栏
3. 编写内容
4. 测试链接有效性

### 更新 API 文档

1. 修改源代码的 JSDoc 注释
2. 运行 `npm run docs:api`
3. 检查 `docs/api/reference/` 中的生成结果
4. 必要时手动调整

### 添加示例

1. 在 `docs/examples/` 创建示例文件
2. 编写可运行的代码
3. 添加详细说明
4. 在相关指南中添加链接

## 质量检查

提交前检查：

- [ ] 所有链接有效
- [ ] 代码示例可运行
- [ ] 语法正确，无拼写错误
- [ ] 遵循样式指南
- [ ] 移动端显示正常

## 工具和快捷键

### VS Code 扩展

- Markdown All in One
- markdownlint
- Code Spell Checker

### 快捷键

- `Ctrl/Cmd + K`：插入链接
- `Ctrl/Cmd + Shift + ]`：切换标题级别
- `Alt + Shift + F`：格式化文档

## 获取帮助

- 查看 `docs/ARCHITECTURE.md` 了解文档架构
- 参考 `docs/contributing.md` 了解贡献流程
- 提交 Issue 报告文档问题
