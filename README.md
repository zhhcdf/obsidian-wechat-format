# WeChat Format — Obsidian 微信公众号排版插件

> **English** · 中文（见下方）

**WeChat Format** turns your Markdown notes into beautifully formatted WeChat Official Account articles. Format once, copy the HTML, and paste it straight into the WeChat editor to publish — no manual styling needed.

- 🎨 6 built-in themes designed for WeChat reading
- 📐 Automatic styling for headings, quotes, code blocks, tables, lists and images
- 📱 Live preview panel showing the final WeChat look
- 📋 One-click copy of WeChat-compatible HTML
- 💾 Export to a standalone HTML file
- 📤 Send directly to your WeChat draft box
- ⚙️ Highly customizable: font size, line height, image width, first-line indent, custom CSS
- 📎 Optional follow-QR footer with custom text

**Install**: search "WeChat Format" in the community plugin marketplace, or copy the release files into `.obsidian/plugins/wechat-format/`. Requires Obsidian 0.15.0+.

简明中文介绍如下:

---

一键将 Obsidian Markdown 排版为微信公众号文章格式。**复制即用，粘帖到公众号编辑器即可发布。**

## ✨ 功能

- 🎨 **6 种精美主题** — 经典商务、清新现代、极简留白、温暖文艺、极客科技、Nord 北欧
- 📐 **智能排版** — 自动处理标题、引用、代码块、表格、列表、图片
- 📱 **实时预览** — 右侧面板实时显示公众号效果
- 📋 **一键复制** — 排版后直接复制 HTML 到公众号编辑器
- 💾 **导出 HTML** — 保存为独立的 HTML 文件
- 📤 **发送到草稿箱** — 直接写入公众号后台草稿箱
- ⚙️ **高度可定制** — 字号、行高、图片宽度、首行缩进、自定义 CSS
- 📎 **底部关注区** — 可选添加「扫码关注」引导区域
- 💬 **自定义引言** — 标题下方添加个性化引言文字

## 📖 使用方法

### 快速开始

1. 在 Obsidian 中打开要排版的笔记
2. 按 `Ctrl+P`（Mac: `Cmd+P`）打开命令面板
3. 搜索以下命令：

| 命令 | 说明 |
|------|------|
| **复制排版到剪贴板** | 排版后直接复制 HTML，粘贴到公众号编辑器 |
| **打开公众号排版预览** | 在右侧打开实时预览面板 |
| **导出为公众号 HTML 文件** | 保存为 `.html` 文件，可下载或分享 |
| **发送到公众号草稿箱** | 直接创建公众号草稿，无需手动粘贴 |

### 推荐的 Markdown 写法

```
# 一级标题（带左边框装饰）
## 二级标题（带左边框装饰）
### 三级标题（带底部分隔线）

> 引用内容会自动变成卡片式引用样式

- 无序列表使用实心圆点标记
1. 有序列表使用数字标记

`行内代码` 会有背景色高亮

```代码块
会使用等宽字体和深色背景
```

![图片描述](图片链接)

| 表头1 | 表头2 |
|-------|-------|
| 内容  | 内容  |

--- 生成装饰性分割线
```

### 粘贴到公众号编辑器

复制排版后的 HTML 后，在公众号编辑器中：
1. 点击编辑器工具栏的 **「HTML」** 或 **「源代码」** 按钮
2. 粘贴内容
3. 保存即可看到排版效果

> 如果编辑器没有 HTML 切换按钮，直接粘贴到正文区域也会保留大部分样式。

## 🎨 主题一览

| 主题 | 适用场景 | 配色特点 |
|------|---------|---------|
| 📰 经典商务 | 企业公众号、正式内容 | 红黑稳重 |
| 🌿 清新现代 | 科技、生活方式 | 蓝绿清爽 |
| ⚪ 极简留白 | 深度阅读、文学 | 灰色调留白 |
| ☕ 温暖文艺 | 情感、生活、故事 | 暖橙棕调 |
| 💻 极客科技 | 技术教程、编程 | 深色代码块 |
| 🏔️ Nord 北欧 | 通用 | 柔和舒适 |

## ⚙️ 设置项

- **排版主题** — 切换整体视觉风格
- **正文字号** — 14px ~ 18px
- **行高** — 1.5 ~ 2.0
- **图片宽度** — 80% / 90% / 100%
- **首行缩进** — 开启/关闭，缩进大小 1~4em
- **底部关注区** — 开启/关闭 + 自定义文案
- **自定义 CSS** — 高级用户可完全自定义样式

## 📦 安装

### 方法一：通过 Obsidian 社区插件市场（待上架）

1. 打开 Obsidian → 设置 → 第三方插件 → 社区插件市场
2. 搜索 "WeChat Format"
3. 点击安装并启用

### 方法二：手动安装

1. 下载本插件的最新 Release
2. 解压到 `.obsidian/plugins/wechat-format/`
3. 在 Obsidian 设置中启用插件

### 方法三：BRAT 安装
1. 安装 BRAT 插件
2. 添加本仓库地址

## 🏗️ 技术架构

```
wechat-format/
├── manifest.json      # 插件元数据
├── main.ts            # 核心 TS 源码（编译后为 main.js）
├── styles.css         # 预览面板样式
├── package.json       # 构建配置
├── CHANGELOG.md       # 更新日志
├── README.md       # 快速入门
└── GUIDE.md        # （预留）详细使用指南
```

### 核心流程

```
Markdown → Obsidian MarkdownRenderer → HTML → 内联样式后处理 → 公众号兼容 HTML
```

## 🔧 开发构建

```bash
# 安装依赖
npm install

# 编译
npm run build

# 开发模式（监视文件变化）
npm run dev
```

## 📖 详细使用指南

如需更详细的说明（设置项详解等），可查阅插件设置面板中的说明文字。

## ⚠️ 注意事项

- 公众号编辑器**不支持外部 CSS 文件**，所有样式已内联到 HTML 标签中
- 图片需要先上传到公众号素材库，粘贴后替换图片链接
- 代码块在公众号中为纯文本高亮，不支持 JavaScript 交互
- 建议发布前先用公众号的「预览」功能在手机上查看效果

## 📄 许可证

MIT

---

**Made with ❤️ for Obsidian & WeChat Official Account creators**