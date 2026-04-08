# Kinema 质量保障标准

## 测试要求

### 覆盖率目标

- **总体覆盖率**: 80%+
- **行覆盖率**: 80%+
- **函数覆盖率**: 80%+
- **分支覆盖率**: 80%+
- **语句覆盖率**: 80%+

### 测试类型

#### 1. 单元测试

- 测试单个函数、方法、类
- 使用 mock 隔离外部依赖
- 快速执行（<100ms/测试）

#### 2. 集成测试

- 测试模块间交互
- 测试 API 端点
- 测试数据流

#### 3. E2E 测试

- 测试关键用户流程
- 场景渲染管线
- 动画播放流程

### 测试编写规范

```typescript
import { describe, it, expect, beforeEach } from 'vitest';

describe('MathUtils', () => {
  // 每个测试前的准备
  beforeEach(() => {
    // Setup code
  });

  describe('lerp', () => {
    it('should interpolate between two values', () => {
      const result = lerp(0, 10, 0.5);
      expect(result).toBe(5);
    });

    it('should handle edge cases', () => {
      expect(lerp(0, 10, 0)).toBe(0);
      expect(lerp(0, 10, 1)).toBe(10);
    });

    it('should throw on invalid t value', () => {
      expect(() => lerp(0, 10, -0.1)).toThrow();
    });
  });
});
```

## 代码质量

### TypeScript Strict Mode

- 已启用所有严格检查
- 禁止 `any` 类型（除非有明确注释说明原因）
- 所有函数必须有返回类型
- 所有参数必须有类型

### ESLint 规则

- 无 `console.log`（使用 logger）
- 无未使用变量
- 强制类型导入分离
- 导入语句按字母排序

### 代码审查清单

提交代码前检查：

- [ ] 所有测试通过
- [ ] 测试覆盖率 >= 80%
- [ ] TypeScript 编译无错误
- [ ] ESLint 无警告
- [ ] 代码格式符合 Prettier 规则
- [ ] 函数有明确的单一职责
- [ ] 复杂逻辑有注释说明
- [ ] 无硬编码的魔法数字
- [ ] 错误被妥善处理
- [ ] 无安全漏洞（注入、XSS等）

## 性能标准

- 渲染帧率: 60 FPS (16.67ms/frame)
- 内存使用: 合理的 GC 压力
- 包大小: 生产环境 < 500KB (gzip)

## 文档要求

### API 文档

- 所有公开 API 必须有 JSDoc 注释
- 包含使用示例
- 说明参数类型和返回值

### 代码注释

- 复杂算法必须有解释
- 性能关键路径标记
- 已知问题标记 TODO
