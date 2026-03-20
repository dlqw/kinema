# CI/CD 流程草案

## 持续集成 (CI)

### 触发条件
- 推送到任何分支
- 创建 Pull Request
- 手动触发

### 检查流程

```yaml
# .github/workflows/ci.yml 示例
name: CI

on:
  push:
    branches: ['**']
  pull_request:
    branches: [main, develop]

jobs:
  quality-checks:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '18'

      - name: Install pnpm
        uses: pnpm/action-setup@v2

      - name: Install dependencies
        run: pnpm install

      - name: Type check
        run: pnpm run typecheck

      - name: Lint
        run: pnpm run lint

      - name: Test
        run: pnpm run test:coverage

      - name: Upload coverage
        uses: codecov/codecov-action@v3
        with:
          files: ./coverage/lcov.info

  build:
    needs: quality-checks
    runs-on: ubuntu-latest
    steps:
      - name: Build
        run: pnpm run build

      - name: Upload artifacts
        uses: actions/upload-artifact@v3
        with:
          name: dist
          path: dist/
```

### 质量门禁

- 所有检查必须通过
- 覆盖率必须 >= 80%
- 无 TypeScript 错误
- 无 ESLint 错误（警告可接受）

## 持续部署 (CD)

### 发布流程

1. **版本管理**
   - 使用语义化版本 (Semantic Versioning)
   - 格式: `v{major}.{minor}.{patch}`

2. **发布检查**
   - 所有测试通过
   - Changelog 更新
   - 版本号更新

3. **构建产物**
   - ESM 模块
   - TypeScript 声明文件
   - Source maps

4. **发布目标**
   - npm registry
   - GitHub Releases

### 发布脚本

```json
{
  "scripts": {
    "release": "pnpm run test && pnpm run build && pnpm publish",
    "release:patch": "npm version patch && pnpm run release",
    "release:minor": "npm version minor && pnpm run release",
    "release:major": "npm version major && pnpm run release"
  }
}
```

## 分支策略

### 主要分支
- `main`: 生产就绪代码
- `develop`: 开发主分支

### 功能分支
- `feat/*`: 新功能
- `fix/*`: Bug 修复
- `refactor/*`: 重构
- `docs/*`: 文档更新

### 工作流
1. 从 `develop` 创建功能分支
2. 完成开发后提交 PR
3. CI 检查通过
4. 代码审查通过
5. 合并到 `develop`
6. 定期从 `develop` 合并到 `main` 并发布

## 本地开发

### 安装依赖
```bash
pnpm install
```

### 开发模式
```bash
pnpm run dev
```

### 运行测试
```bash
pnpm run test:watch
```

### 类型检查
```bash
pnpm run typecheck
```

### 代码检查
```bash
pnpm run lint
```

### 格式化代码
```bash
pnpm run format
```

### 完整 CI 流程
```bash
pnpm run ci
```
