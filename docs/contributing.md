# 贡献指南

感谢你对 AniMaker 的关注！我们欢迎各种形式的贡献。

## 如何贡献

### 报告问题

如果你发现了 bug 或有功能建议：

1. 检查 [Issues](https://github.com/your-username/animaker/issues) 是否已存在相似问题
2. 如果没有，创建新的 Issue，提供详细的信息：
   - 复现步骤
   - 预期行为
   - 实际行为
   - 环境信息（浏览器、Node版本等）
   - 截图或示例代码

### 提交代码

1. Fork 项目
2. 创建你的功能分支 (`git checkout -b feature/amazing-feature`)
3. 提交更改 (`git commit -m 'feat: add amazing feature'`)
4. 推送到分支 (`git push origin feature/amazing-feature`)
5. 创建 Pull Request

### 开发环境设置

```bash
# 克隆仓库
git clone https://github.com/your-username/animaker.git
cd animaker

# 安装依赖
npm install

# 启动开发服务器
npm run dev

# 运行测试
npm test

# 构建
npm run build

# 生成文档
npm run docs
```

## 代码规范

### 命名约定

- 类名：PascalCase (`class Animator`)
- 方法/函数：camelCase (`function playAnimation`)
- 常量：UPPER_SNAKE_CASE (`const MAX_FPS`)
- 私有成员：_prefix (`private _update()`)

### 文件组织

```
packages/
├── core/              # 核心包
│   ├── src/
│   │   ├── animator/  # 动画器相关
│   │   ├── renderer/  # 渲染器相关
│   │   ├── scene/     # 场景相关
│   │   └── utils/     # 工具函数
│   └── package.json
├── plugins/           # 插件包
└── examples/          # 示例
```

### 注释规范

使用 JSDoc 注释：

```typescript
/**
 * 动画器类，负责管理和控制动画播放
 *
 * @example
 * ```ts
 * const animator = new Animator({ renderer });
 * animator.play();
 * ```
 */
class Animator {
  /**
   * 播放动画
   * @param from - 起始时间（毫秒）
   */
  play(from?: number): void {
    // ...
  }
}
```

## 测试要求

- 单元测试覆盖率不低于 80%
- 新功能必须包含测试
- Bug 修复需要添加回归测试

```typescript
describe('Animator', () => {
  it('should play animation', () => {
    const animator = new Animator({ renderer });
    animator.play();
    expect(animator.isPlaying).toBe(true);
  });
});
```

## 文档更新

- API 变更需要更新 API 参考
- 新功能需要添加示例和教程
- 保持文档与代码同步

## Commit 规范

使用 Conventional Commits：

- `feat:` 新功能
- `fix:` Bug 修复
- `refactor:` 代码重构
- `docs:` 文档更新
- `test:` 测试相关
- `chore:` 构建/工具相关

示例：
```
feat: add WebGL renderer support
fix: correct easing function calculation
docs: update API reference for v2.0
```

## Pull Request 检查清单

提交 PR 前，请确保：

- [ ] 代码通过所有测试
- [ ] 新增功能有测试覆盖
- [ ] 更新了相关文档
- [ ] 遵循代码规范
- [ ] Commit 消息清晰明确
- [ ] PR 描述详细说明了改动内容

## 发布流程

只有维护者可以发布新版本：

1. 更新版本号
2. 更新 CHANGELOG
3. 创建 Git tag
4. 发布到 npm

```bash
npm version patch|minor|major
npm run changelog
git push --tags
npm publish
```

## 行为准则

- 尊重所有贡献者
- 使用友好和包容的语言
- 接受建设性批评
- 关注对社区最有利的事情

## 获取帮助

- GitHub Issues: 技术问题和 bug 报告
- GitHub Discussions: 功能讨论和疑问
- 邮件: support@animaker.dev

## 许可证

贡献的代码将使用项目的 MIT 许可证。
