# 贡献指南

感谢您对 Kinema 项目的关注！我们欢迎任何形式的贡献。

## 如何贡献

### 报告问题

如果您发现了 Bug 或有功能建议：

1. 在 [GitHub Issues](https://github.com/your-username/kinema/issues) 搜索现有问题
2. 如果问题不存在，创建新 Issue 并包含：
   - 清晰的标题和描述
   - 复现步骤（针对 Bug）
   - 预期行为 vs 实际行为
   - 环境信息（操作系统、Node 版本等）
   - 相关日志或截图

### 提交代码

#### 开发流程

1. **Fork 仓库**

   ```bash
   # Fork 并克隆您的 fork
   git clone https://github.com/your-username/kinema.git
   cd kinema
   ```

2. **安装依赖**

   ```bash
   pnpm install
   ```

3. **创建功能分支**

   ```bash
   git checkout -b feature/your-feature-name
   # 或修复分支
   git checkout -b fix/your-bug-fix
   ```

4. **进行开发**

   ```bash
   # 启动开发模式
   pnpm run dev

   # 运行测试
   pnpm run test

   # 类型检查
   pnpm run typecheck

   # 代码检查
   pnpm run lint
   ```

5. **提交更改**

   ```bash
   git add .
   git commit -m "feat: 添加 XXX 功能"
   ```

6. **推送到您的 fork**

   ```bash
   git push origin feature/your-feature-name
   ```

7. **创建 Pull Request**
   - 访问原仓库的 Pull Requests 页面
   - 点击 "New Pull Request"
   - 选择您的功能分支
   - 填写 PR 描述模板

#### 提交信息规范

使用 [Conventional Commits](https://www.conventionalcommits.org/) 格式：

```
<type>: <description>

[optional body]

[optional footer]
```

**类型 (type)**：

- `feat`: 新功能
- `fix`: Bug 修复
- `docs`: 文档更新
- `style`: 代码格式（不影响功能）
- `refactor`: 代码重构
- `perf`: 性能优化
- `test`: 测试相关
- `chore`: 构建/工具相关

**示例**：

```
feat: 添加视频导出功能

实现了 MP4 和 WebM 格式的视频导出功能。

Closes #123
```

### 代码规范

#### TypeScript

- 使用 TypeScript 严格模式
- 所有公共 API 必须有 JSDoc 注释
- 使用 `interface` 定义对象类型
- 使用 `type` 定义联合类型和交叉类型

#### 测试

- 新功能必须包含测试
- 目标测试覆盖率：80%+
- 使用描述性的测试名称

```typescript
describe('Scene', () => {
  describe('add', () => {
    it('should add object to scene', () => {
      // 测试代码
    });
  });
});
```

#### 文档

- 更新相关文档
- 添加代码示例
- 更新 `changelogs/CHANGELOG.md`

### Pull Request 检查清单

提交 PR 前，请确保：

- [ ] 代码通过所有检查（`pnpm run ci`）
- [ ] 新功能包含测试
- [ ] 测试覆盖率不低于 80%
- [ ] 文档已更新
- [ ] COMMIT 信息遵循规范
- [ ] PR 描述清晰说明变更内容

### 代码审查

所有 PR 需要通过代码审查：

1. 至少一位维护者审查
2. 解决所有审查意见
3. 确保所有 CI 检查通过
4. 维护者批准后合并

## 开发环境

### 必需工具

- **Node.js**: 18.0.0+
- **pnpm**: 8.0.0+
- **Git**: 2.0+

### 推荐工具

- **VS Code**: 推荐的 IDE
- **ESLint 插件**: 代码检查
- **Prettier 插件**: 代码格式化

### 项目结构

```
Kinema/
├── packages/
│   ├── core/           # 核心框架
│   └── workstation/    # 视频工作站
├── docs/               # 文档
├── tests/              # 测试
└── scripts/            # 构建脚本
```

## 获取帮助

- 查看 [文档](../guide/getting-started.md)
- 加入 [Discussions](https://github.com/your-username/kinema/discussions)
- 联系维护者

## 行为准则

- 尊重所有贡献者
- 欢迎不同观点
- 建设性反馈
- 关注问题而非个人

## 许可证

贡献的代码将遵循项目的 [MIT License](../../LICENSE)。
