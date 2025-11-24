# 简易留言板

一个基于原生 Node.js 的轻量留言板应用，支持 Markdown 输入、Tailwind 风格界面、深浅色主题、标签系统，以及使用 SQLite 持久化留言。

## 功能亮点
- **Markdown 支持**：前端使用 `marked` + `DOMPurify` 渲染，支持代码块、高亮、列表等常见语法。
- **代码块增强**：自动包裹标题栏与"复制"按钮，可根据语法高亮推断语言，并与主题联动。
- **标签系统**：支持为留言添加多个标签，自动生成彩色标签，并支持按标签筛选浏览。
- **搜索功能**：支持全文搜索，快速定位留言内容。
- **持久化存储**：留言记录保存到 SQLite 数据库，最多保留 1024 条，超出后自动丢弃最早的记录。
- **分页浏览**：每页显示 50 条留言，最多 21 页，可通过翻页导航快速跳转。
- **深浅色主题**：页面右上角可切换主题，优先读取浏览器偏好并存储在 `localStorage`。
- **语言切换**：内置中文与英文界面，一键切换即时生效并记忆偏好。
- **键盘快捷键**：在输入框按 `Ctrl + Enter` 可快速提交留言。
- **命令行工具**：支持后台运行、进程管理、自定义端口和数据目录。

## 环境要求
- Node.js 18 或更高版本（建议与本地环境一致）
- npm / pnpm / yarn 任一包管理工具

## 快速开始

### 方式一：通过 npm 全局安装（推荐）

```bash
# 全局安装
npm install -g simple-message-board

# 启动服务（默认后台运行）
message-board start

# 查看状态
message-board status

# 查看日志
message-board logs

# 停止服务
message-board stop

# 默认监听地址
# http://localhost:13478
```

### 方式二：使用 npx（无需安装）

```bash
# 直接运行
npx simple-message-board start

# 自定义端口
npx simple-message-board start -p 8080
```

### 方式三：从源码运行

```bash
# 克隆项目
git clone https://github.com/chenpu17/Simple-Message-Board.git
cd Simple-Message-Board

# 安装依赖
npm install

# 启动服务
npm start

# 或使用命令行工具
./bin/cli.js start
```

## 命令行工具使用

### 基本命令

```bash
# 启动服务（默认后台运行）
message-board start

# 在前台运行（查看实时日志）
message-board start --foreground
message-board start -f

# 自定义端口
message-board start --port 8080
message-board start -p 8080

# 自定义数据目录
message-board start --data-dir /path/to/data
message-board start -d /path/to/data

# 停止服务
message-board stop

# 重启服务
message-board restart

# 查看运行状态
message-board status

# 查看最近日志（最后 50 行）
message-board logs

# 查看版本信息
message-board --version
message-board version

# 查看帮助
message-board help
```

### 数据存储

- **默认数据目录**：`~/.message-board/`
- **数据库文件**：`~/.message-board/messages.db`
- **进程 PID 文件**：`~/.message-board/message-board.pid`
- **日志文件**：`~/.message-board/message-board.log`

首次运行会在用户目录自动创建 `.message-board` 文件夹，用于持久化所有数据。

## 项目结构
```
.
├── bin/
│   └── cli.js              # 命令行工具入口
├── src/
│   ├── config.js           # 配置文件
│   ├── db.js               # 数据库初始化和工具函数
│   ├── routes.js           # 路由处理
│   ├── server.js           # HTTP 服务器
│   ├── services/           # 业务逻辑层
│   │   ├── messageService.js
│   │   └── tagService.js
│   ├── templates/          # HTML 模板
│   │   └── homePage.js
│   └── utils/              # 工具函数
│       ├── body.js
│       ├── format.js
│       ├── http.js
│       ├── paths.js
│       └── search.js
├── public/                 # 静态资源
│   ├── app.js              # 前端 JavaScript
│   └── app.css             # 前端样式
├── server.js               # 应用入口
└── package.json
```

## 使用小贴士
- 删除按钮位于每条留言右上角，可删除指定记录。
- 主题切换会自动记忆上一次选择，如需恢复系统默认，可清理浏览器的 `localStorage`。
- 若要重置留言数据，可停止服务并删除数据库文件后重新启动：
  ```bash
  message-board stop
  rm ~/.message-board/messages.db
  message-board start
  ```
- 后台运行的日志会保存到 `~/.message-board/message-board.log`
- 生产环境建议：
  - 将 Tailwind CDN 替换为本地构建的 CSS
  - 增加访问限制或鉴权逻辑
  - 配置 Nginx 反向代理
  - 设置防火墙规则

## 开发

```bash
# 安装依赖
npm install

# 前台运行（开发模式）
npm start

# 或使用命令行工具前台运行
./bin/cli.js start -f
```

欢迎根据需求继续扩展功能，例如增加图片上传、导出功能等能力。

---

# Simple Message Board (English)

A lightweight message board built with vanilla Node.js. It supports Markdown input, Tailwind-inspired styling, dark/light themes, tag system, and SQLite persistence.

## Highlights
- **Markdown Support**: Renders Markdown on the client with `marked` + `DOMPurify`, including lists, code blocks, and syntax highlighting.
- **Enhanced Code Blocks**: Each block gains a header, language hint, and one-click copy button that respects the active theme.
- **Tag System**: Add multiple tags to messages, with auto-generated colored badges and tag-based filtering.
- **Search Functionality**: Full-text search to quickly locate message content.
- **Persistent Storage**: Messages are saved in SQLite database. The board keeps at most 1,024 entries and automatically trims the oldest ones.
- **Pagination**: Displays 50 messages per page (up to 21 pages) with easy navigation controls.
- **Dark & Light Themes**: Switch themes from the top-right toggle. Preferences are stored in `localStorage` and aligned with system defaults.
- **Bilingual UI**: Chinese and English interfaces baked in; the switch updates instantly and remembers your choice.
- **Keyboard Shortcut**: Press `Ctrl + Enter` inside the textarea to submit instantly.
- **CLI Tool**: Supports daemon mode, process management, custom port, and data directory.

## Requirements
- Node.js 18 or newer (match your local runtime when possible)
- npm / pnpm / yarn

## Quick Start

### Method 1: Install globally via npm (Recommended)

```bash
# Install globally
npm install -g simple-message-board

# Start service (runs as daemon by default)
message-board start

# Check status
message-board status

# View logs
message-board logs

# Stop service
message-board stop

# Visit the app
# http://localhost:13478
```

### Method 2: Use with npx (No installation)

```bash
# Run directly
npx simple-message-board start

# Custom port
npx simple-message-board start -p 8080
```

### Method 3: Run from source

```bash
# Clone repository
git clone https://github.com/chenpu17/Simple-Message-Board.git
cd Simple-Message-Board

# Install dependencies
npm install

# Start server
npm start

# Or use CLI tool
./bin/cli.js start
```

## CLI Usage

### Basic Commands

```bash
# Start service (daemon mode by default)
message-board start

# Run in foreground (see real-time logs)
message-board start --foreground
message-board start -f

# Custom port
message-board start --port 8080
message-board start -p 8080

# Custom data directory
message-board start --data-dir /path/to/data
message-board start -d /path/to/data

# Stop service
message-board stop

# Restart service
message-board restart

# Check status
message-board status

# View recent logs (last 50 lines)
message-board logs

# Show version information
message-board --version
message-board version

# Show help
message-board help
```

### Data Storage

- **Default data directory**: `~/.message-board/`
- **Database file**: `~/.message-board/messages.db`
- **Process PID file**: `~/.message-board/message-board.pid`
- **Log file**: `~/.message-board/message-board.log`

On first launch the app creates `.message-board` folder in user's home directory to persist all data.

## Project Layout
```
.
├── bin/
│   └── cli.js              # CLI tool entry
├── src/
│   ├── config.js           # Configuration
│   ├── db.js               # Database initialization and utilities
│   ├── routes.js           # Route handlers
│   ├── server.js           # HTTP server
│   ├── services/           # Business logic layer
│   │   ├── messageService.js
│   │   └── tagService.js
│   ├── templates/          # HTML templates
│   │   └── homePage.js
│   └── utils/              # Utility functions
│       ├── body.js
│       ├── format.js
│       ├── http.js
│       ├── paths.js
│       └── search.js
├── public/                 # Static assets
│   ├── app.js              # Frontend JavaScript
│   └── app.css             # Frontend styles
├── server.js               # Application entry
└── package.json
```

## Tips
- Use the delete button at the top-right of each message to remove it.
- Theme choices are stored locally; clear `localStorage` to fall back to system defaults.
- To reset all messages, stop the server, delete database file, then restart:
  ```bash
  message-board stop
  rm ~/.message-board/messages.db
  message-board start
  ```
- Daemon logs are saved to `~/.message-board/message-board.log`
- For production consider:
  - Bundling Tailwind locally instead of loading from the CDN
  - Adding authentication or rate limiting
  - Setting up Nginx reverse proxy
  - Configuring firewall rules

## Development

```bash
# Install dependencies
npm install

# Run in foreground (development mode)
npm start

# Or use CLI tool
./bin/cli.js start -f
```

Feel free to extend the app with image uploads, export functionality, or any other ideas you have.
