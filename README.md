# 盯一眼 · Glance

![Platform](https://img.shields.io/badge/platform-Windows-blue)
![Electron](https://img.shields.io/badge/Electron-31-2b2b2b)
![React](https://img.shields.io/badge/React-18-61dafb)
![Release](https://img.shields.io/github/v/release/YuyuetMo/glance-stock)

> 面向**股票小白**的 A 股自选股追踪桌面客户端 —— 扫一眼就懂，不要求任何专业知识。

**出品：Yuyuet Mo**

---

## 产品简介

盯一眼（Glance）是一款面向 A 股新手的自选股追踪桌面应用。它把复杂的行情信息压缩为**颜色 + 大数字 + 一句话结论**，让没有任何投资经验的用户也能在几秒内看懂自己关注股票的涨跌状态，而不必面对 K 线、技术指标或专业财务术语。

应用聚焦"看"而非"交易"：不提供任何买入、卖出或下单入口，所有数据仅用于日常观察与认知建立。

## 设计风格

采用**酒红沉浸式控制台**视觉语言：以 `#140a0d` 为基底色，深棕红为主强调色，配合 24px 超大圆角、厚实的新拟态卡片与轻量玻璃质感，功能模块以控制台栅格方式排布，整体偏向游戏化仪表盘观感。

## 设计原则

- 只呈现「颜色 + 大数字 + 一句话」结论，降低认知负担；
- 不展示 K 线、MACD、均线、KDJ 等专业图表；
- 不展示 PE / PB / ROE 等专业财务指标；
- 不包含任何买入 / 卖出 / 交易功能。

## 功能特性

| 功能 | 说明 |
|---|---|
| 自选股管理 | 搜索（代码 / 名称 / 拼音首字母）添加，卡片右上角 × 删除 |
| 实时行情 | 每 3 秒刷新价格、涨跌幅、迷你走势线；非交易时段自动降频到 30 秒 |
| 顶部指数栏 | 上证 / 深证 / 创业板实时联动（红涨绿跌，符合 A 股习惯） |
| 涨跌家数对比 | 指数栏下方一行：上涨 xxx 涨停 xxx ｜ 下跌 xxx 跌停 xxx，由东方财富全市场实时统计，标注「实时」 |
| 价格高亮 | 价格变动时卡片闪烁红 / 绿 |
| 我的持仓 | 同花顺式盈亏视图：每只显示 现价 / 数量 / 成本 / 市值 / 浮动盈亏 / 盈亏率；顶部汇总 总市值 / 总浮动盈亏 / 总收益率——仅记录成本与股数，不交易；支持在命令面板输入**任意 6 位 A 股代码**实时查询后加为持仓，不再局限于内置 25 只 |
| 主力资金 | 个股详情浮层 + 板块热力页市场概览，展示主力净流入(亿)与一句话解读（数据为示意，仅供参考） |
| 账号资料 | 设置账号名 + 上传头像（存 IndexedDB，非真实登录）；首页按时间问候并展示连续看盘天数 |
| 命令面板 | `Ctrl/⌘ + K` 唤起，模糊 + 拼音搜索，一行完成跳转 / 添加 / 设预警 |
| 详情浮层 | 点卡片从右侧滑出，保留主列表上下文；含「贵不贵 / 赚不赚钱 / 主力资金」结论 |
| 资讯流 | 4 个标签：全部 / 持仓 / 自选 / 市场；自动判定 利好 / 利空 / 中性 并打彩色标签 |
| 价格预警 | 渐进式表单：选股 → 选类型 → 填数值 → 确认；触发弹系统通知 |
| 板块热力 | 各板块今日涨跌红绿成片，一眼看主线；顶部含主力资金市场概览；点击板块查看简介 / 观望指 / 投资潜力 |
| 首页大盘情绪 | 首页半圆仪表盘展示市场恐慌 / 贪婪指数，由真实涨跌家数与指数表现推算，标注「实时」 |
| 首页 Hero | 头像 + 问候 + 连续看盘天数 + 自选 / 持仓 / 预警统计 + 风险盾提示卡 |
| 系统托盘 | 关闭窗口时可最小化到托盘（非强制退出），托盘右键「显示窗口 / 退出」 |
| 版本更新检查 | 启动后自动比对 GitHub Release 版本号；发现新版本弹出更新提示，可一键查看更新内容或下载新版本 |
| 应用图标 | 多尺寸 Windows `.ico`（含软件内、任务栏、托盘），由 `build/icon.png` 生成 |
| 本地持久化 | 自选股、预警、持仓、账号资料、新闻缓存全部存入 IndexedDB |

## 技术架构

### 技术选型

- **Electron 31** + **React 18** + **Vite 5**
- 状态管理：**zustand**
- 本地存储：**IndexedDB**（`idb` 库）
- 迷你走势线：纯 **SVG polyline**，不引入任何图表库
- 样式：纯手写 CSS 设计系统（CSS 变量驱动），无 Tailwind / CSS-in-JS
- 字体：系统字体栈 + JetBrains Mono（数字显示）

### 目录结构

```
glance/
├── package.json
├── vite.config.mjs
├── index.html
├── build/
│   ├── icon.png         # 源图
│   └── icon.ico         # 多尺寸 Windows 图标（自动生成）
├── electron/
│   ├── main.js          # 窗口 + 行情代理层(IPC) + 系统托盘 + 系统通知
│   └── preload.js       # 安全暴露 electronAPI 给渲染进程
└── src/
    ├── main.jsx
    ├── App.jsx          # 布局 / 快捷键 / tick 生命周期
    ├── App.css          # 完整酒红控制台设计系统
    ├── store.js         # zustand 全局状态（含 profile / 持仓 / 涨跌家数）
    ├── db.js            # IndexedDB 读写（含 profile 仓库）
    ├── utils.js         # 问候语 / 连续天数 / 金额格式化等工具
    ├── quotes.js        # 渲染端行情桥接（主进程优先，本地兜底）
    ├── mockData.js      # 模拟行情引擎 + 市场资讯 + 主力资金示意数据
    ├── newsClassifier.js# 资讯利好/利空/中性判定
    └── components/      # TopBar / Sidebar / BottomNav / SparkLine /
                         # StockCard / CommandPalette / DetailPanel /
                         # WatchlistPage / HoldingsPage / NewsPage /
                         # AlertsPage / HeatMapPage / ProfilePage /
                         # SectorDetailPanel / Gauge
```

### 行情代理层

渲染进程**无法直接连接交易所**（CORS + 鉴权），因此所有行情都经由 **Electron 主进程代理转发 + 缓存**后再喂给前端：

```
渲染进程 (React)                Electron 主进程               行情源
─────────────────             ─────────────────             ─────────
store.startTicking()  ──IPC──▶  get-quotes handler
                                     │
                                     ├─ 读内存缓存 (TTL 内直接返回)
                                     │
                                     └─ 调腾讯行情 API → 写缓存 → 返回
```

- **真实数据源**：默认调用腾讯财经免费行情接口 `https://qt.gtimg.cn/q=...`，覆盖全部自选股与上证 / 深证 / 创业板 3 大指数。
- 渲染端桥接在 `src/quotes.js`：检测到 `window.electronAPI.getQuotes` 走主进程；否则降级到 `mockData.js` 本地模拟引擎。
- 主进程代理内置**内存缓存（TTL）**与**网络错误离线降级**，断网时自动回到模拟引擎。
- 资讯源默认走新浪财经滚动接口（主进程代理），断网回退本地模拟。

### 环境变量

| 变量 | 默认值 | 说明 |
|---|---|---|
| `GLANCE_QUOTE_SOURCE` | `http` | `http` = 腾讯财经真实行情；`mock` = 本地模拟引擎 |
| `GLANCE_CACHE_TTL` | `1500` | 缓存有效期（毫秒） |

## 下载与安装

前往 [Releases](https://github.com/YuyuetMo/glance-stock/releases) 下载最新版本：

| 文件 | 用途 |
|---|---|
| `Glance-Setup-1.1.0.exe` | 标准安装包，双击安装、可卸载 |
| `Glance-Portable-1.1.0.exe` | 免安装单文件，直接双击运行 |

> 系统要求：Windows 10 及以上。

## 本地开发

```bash
git clone https://github.com/YuyuetMo/glance-stock.git
cd glance-stock
npm install      # 首次会下载 Electron 二进制，较慢
npm run dev      # 同时启动 Vite(5173) 与 Electron 窗口
```

构建并打包 Windows 客户端（含安装包 + 免安装单文件）：

```bash
npm run dist
# 输出：dist-electron/Glance-Setup-1.1.0.exe（安装包）
#       dist-electron/Glance-Portable-1.1.0.exe（免安装单文件）
```

## 数据说明（诚信护栏）

为兼顾小白可读性与信息真实性，以下功能的数据为**示意 / 非真实全市场数据**，界面均已显著标注：

- **主力资金 / 资金流向**（个股净流入、市场概览）：算法生成，标注「数据为示意，仅供参考」；
- **板块观望指 / 投资潜力**：由涨跌幅与资金方向推算，标注「示意」。

以下数据已接入真实来源：

- **涨跌家数对比**（上涨 / 涨停 / 下跌 / 跌停）：由东方财富全市场实时统计（约 5500 只 A 股），标注「实时」；
- **大盘情绪指数**：由真实涨跌家数与三大指数表现推算，标注「实时」；
- **自选 / 持仓实时行情**：腾讯财经接口，断网回退本地模拟。

真实持仓盈亏（成本 × 股数）基于真实行情价计算。

## 免责声明

本应用仅用于行情观察与学习，**不构成任何投资建议**。市场有风险，决策需谨慎。示例 / 示意数据可能与真实情况存在偏差，请以券商或交易所官方数据为准。

## 许可证

版权所有 © 2026 Yuyuet Mo。本项目代码仅供学习与交流，未经书面授权不得用于商业用途。
