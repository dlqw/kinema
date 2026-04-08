# 视频工作站安装指南

Kinema 视频工作站是基于 Electron 的桌面应用程序，提供视频编辑和项目管理功能。

## 系统要求

### 最低配置

- **操作系统**: Windows 10/11, macOS 10.15+, Linux (Ubuntu 20.04+)
- **处理器**: Intel Core i5 或同等性能处理器
- **内存**: 8GB RAM
- **存储**: 500MB 可用空间
- **显卡**: 支持 OpenGL 3.0+

### 推荐配置

- **操作系统**: Windows 11, macOS 13+, Linux (Ubuntu 22.04+)
- **处理器**: Intel Core i7 或更高，Apple M1/M2
- **内存**: 16GB RAM 或更多
- **存储**: SSD，5GB 可用空间
- **显卡**: 独立显卡，支持 OpenGL 4.0+

## 安装方式

### 方式一：下载预编译版本（推荐）

1. 从 [GitHub Releases](https://github.com/your-username/kinema/releases) 下载适合您操作系统的安装包
2. 运行安装程序并按照提示完成安装

**Windows**: 下载 `.exe` 安装程序
**macOS**: 下载 `.dmg` 镜像文件
**Linux**: 下载 `.AppImage` 或 `.deb` 包

### 方式二：从源码构建

#### 前置要求

- **Node.js**: 18.0.0 或更高版本
- **pnpm**: 8.0.0 或更高版本

#### 安装步骤

```bash
# 克隆仓库
git clone https://github.com/your-username/kinema.git
cd kinema

# 安装依赖
pnpm install

# 启动开发模式
pnpm run dev

# 构建生产版本
pnpm run build
```

## 验证安装

启动应用后，您应该能看到主界面，包含以下元素：

- 项目管理面板（左侧）
- 预览窗口（中央）
- 属性编辑器（右侧）
- 时间轴（底部）

## 故障排除

### Windows: "Windows 已保护你的电脑"

这是 Windows Defender 的警告，点击"更多信息"然后"仍要运行"即可。

### macOS: "无法打开，因为无法验证开发者"

在"系统偏好设置">"安全性与隐私">"通用"中，点击"仍要打开"。

### Linux: 缺少依赖

某些 Linux 发行版可能需要安装额外的依赖：

```bash
# Ubuntu/Debian
sudo apt-get install libgtk-3-0 libnotify4 libnss3 libxss1 libxtst6 xdg-utils libatspi2.0-0 libdrm2 libgbm1

# Fedora
sudo dnf install gtk3 libnotify nss libXScrnSaver libXtst xdg-utils at-spi2-atk libdrm mesa-libgbm
```

## 下一步

安装完成后，请阅读 [用户手册](./user-guide.md) 了解基本使用方法。
