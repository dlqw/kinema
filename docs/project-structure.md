# AniMaker 项目目录结构规范

## 目录组织原则

- 高内聚低耦合
- 按功能域组织而非类型
- 单个文件不超过 800 行
- 工具函数单独提取

## 推荐目录结构

```
AniMaker/
├── src/                          # 源代码
│   ├── core/                     # 核心功能
│   │   ├── renderer/             # 渲染引擎
│   │   │   ├── canvas.ts         # Canvas渲染器
│   │   │   ├── context.ts        # 渲染上下文
│   │   │   └── batch.ts          # 批处理渲染
│   │   ├── animation/            # 动画核心
│   │   │   ├── timeline.ts       # 时间线管理
│   │   │   ├── tween.ts          # 补间动画
│   │   │   └── easings.ts        # 缓动函数
│   │   └── scene/                # 场景管理
│   │       ├── scene-graph.ts    # 场景图
│   │       └── transform.ts      # 变换系统
│   ├── entities/                 # 实体定义
│   │   ├── node.ts               # 基础节点
│   │   ├── sprite.ts             # 精灵
│   │   ├── shape.ts              # 形状
│   │   └── text.ts               # 文本
│   ├── components/               # 组件系统
│   │   ├── transform.ts          # 变换组件
│   │   └── renderable.ts         # 可渲染组件
│   ├── utils/                    # 工具函数
│   │   ├── math.ts               # 数学工具
│   │   ├── color.ts              # 颜色工具
│   │   └── geometry.ts           # 几何工具
│   ├── types/                    # 类型定义
│   │   ├── core.ts               # 核心类型
│   │   └── events.ts             # 事件类型
│   └── index.ts                  # 入口文件
├── tests/                        # 测试文件
│   ├── unit/                     # 单元测试
│   │   ├── core/
│   │   │   └── renderer/
│   │   │       └── canvas.test.ts
│   │   ├── utils/
│   │   │   └── math.test.ts
│   │   └── ...
│   ├── integration/              # 集成测试
│   │   └── rendering/
│   │       └── scene-graph.test.ts
│   ├── e2e/                      # 端到端测试
│   │   └── workflows/
│   │       └── animation-pipeline.test.ts
│   ├── fixtures/                 # 测试夹具
│   │   └── sample-scene.ts
│   ├── mocks/                    # Mock对象
│   │   └── canvas-mock.ts
│   └── setup.ts                  # 测试配置
├── docs/                         # 文档
│   ├── api/                      # API文档
│   ├── guides/                   # 指南
│   └── architecture/             # 架构文档
├── examples/                     # 示例代码
│   ├── basic/
│   └── advanced/
├── scripts/                      # 构建脚本
├── changelogs/                   # 更新日志
│   └── v0.1.0.md
└── 配置文件...
```

## 文件命名规范

### TypeScript 源文件
- 使用 kebab-case: `scene-graph.ts`
- 类型定义: `types/core.ts` 或与实现同名
- 测试文件: `*.test.ts` (单元测试), `*.spec.ts` (规格测试)
- 工具文件: `utils/[name].ts`

### 导入顺序
1. Node.js 内置模块
2. 外部依赖
3. 内部模块（按路径层级）
4. 类型导入（使用 `import type`）

## 代码组织规则

1. **单个文件专注单一职责**
   - 每个文件只导出一个主要类/函数
   - 相关辅助函数可以放在同一文件

2. **导出顺序**
   ```typescript
   // 1. 类型导出
   export type { MyType };

   // 2. 常量导出
   export const MY_CONSTANT = ...;

   // 3. 函数导出
   export function myFunction() { ... }

   // 4. 类导出
   export class MyClass { ... }
   ```

3. **测试文件组织**
   - 与源文件对应: `src/utils/math.ts` → `tests/unit/utils/math.test.ts`
   - 测试文件包含: describe 分组、清晰的测试名称、合理的断言

## 依赖管理

- 避免循环依赖
- 使用依赖注入
- 明确导出和导入的类型
