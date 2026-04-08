# Kinema 产品介绍视频

使用 Kinema 框架制作的自我介绍视频。

## 视频规格

- **时长**: 5分30秒 (330秒)
- **分辨率**: 1920x1080 (1080p)
- **帧率**: 60fps
- **格式**: WebM / MP4

## 目录结构

```
video/
├── main.ts              # 视频主入口
├── scenes/
│   ├── 01-intro.ts      # 开场 (0:00-0:30)
│   ├── 02-introduction.ts # 引入 Kinema (0:30-1:30)
│   ├── 03-core-demo.ts  # 核心演示 (1:30-3:30)
│   ├── 04-type-safety.ts # 类型安全 (3:30-4:30)
│   ├── 05-use-cases.ts  # 应用场景 (4:30-5:00)
│   └── 06-comparison.ts # 对比收尾 (5:00-5:30)
└── assets/              # 静态资源
```

## 使用方法

```bash
# 预览视频
npm run video:preview

# 导出视频
npm run video:export
```

## 设计文档

详细设计文档见: `docs/superpowers/specs/2026-03-19-kinema-intro-video-design.md`

## 颜色方案

| 用途     | 颜色代码  |
| -------- | --------- |
| 主背景   | `#0D1117` |
| 品牌色   | `#58A6FF` |
| 成功色   | `#3FB950` |
| 警告色   | `#F0883E` |
| 错误色   | `#F85149` |
| 代码背景 | `#161B22` |
| 主文字   | `#E6EDF3` |
