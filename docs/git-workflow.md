# Git 工作流程

## 分支策略

AniMaker 使用简化的 Git Flow 工作流程：

### 主要分支

- **main**
  - 稳定发布版本
  - 仅接受经过测试的合并
  - 标签格式: `v{major}.{minor}.{patch}`

- **develop**
  - 开发主分支
  - 所有功能开发在此分支进行
  - 定期合并到 main 进行发布

### 功能分支

从 `develop` 分支创建功能分支：

```bash
git checkout develop
git checkout -b feature/feature-name
```

功能分支命名规范：
- `feature/project-management` - 项目管理功能
- `feature/video-export` - 视频导出功能
- `fix/rendering-bug` - 渲染修复
- `refactor/timeline` - 时间轴重构

### 工作流程

1. **开始新功能**
   ```bash
   git checkout develop
   git checkout -b feature/your-feature
   ```

2. **开发和提交**
   ```bash
   git add .
   git commit -m "feat: add feature description"
   ```

3. **合并到 develop**
   ```bash
   git checkout develop
   git merge feature/your-feature
   ```

4. **发布到 main**
   ```bash
   git checkout main
   git merge develop
   git tag v0.1.1
   ```

## 提交消息规范

使用 [Conventional Commits](https://www.conventionalcommits.org/) 格式：

```
<type>: <description>

[optional body]

[optional footer]
```

### 类型 (type)

- `feat`: 新功能
- `fix`: 缺陷修复
- `refactor`: 代码重构
- `docs`: 文档更新
- `test`: 测试相关
- `chore`: 构建/工具链相关
- `perf`: 性能优化
- `style`: 代码风格（不影响功能）

### 示例

```bash
feat: add project file management system
fix: resolve Scene constructor overload error
docs: update Electron workstation documentation
test: add unit tests for Timeline class
refactor: simplify render pipeline architecture
```

## 代码审查

1. 所有合并到 `main` 的代码需要审查
2. 功能分支完成后创建 Pull Request
3. 至少一名团队成员批准后才能合并

## 发布流程

1. 更新版本号 (package.json)
2. 更新 CHANGELOG.md
3. 创建发布标签
4. 构建和发布

```bash
git checkout main
git merge develop
# 更新版本号
git tag v0.2.0
git push origin main --tags
```
