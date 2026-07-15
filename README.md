# 盯一眼 · Glance

> 面向**股票小白**的 A 股自选股追踪桌面客户端 —— 扫一眼就懂，不要求任何专业知识。

- 出品：**Yuyuet Mo**
- 设计基调：**酒红游戏控制台 / 沉浸式娱乐 Dashboard / 新拟态卡片**——酒红(#140a0d 底色)＋深棕红主色＋超大圆角＋厚实新拟态卡片＋轻玻璃质感，模块如控制台般排布
- 核心原则：**只给你"颜色 + 大数字 + 一句话"**，绝不暴露 K 线、MACD、均线等专业图表，也不展示 PE / PB / ROE 等专业指标，更没有任何买入/卖出/交易按钮。

---

## 功能一览

| 功能 | 说明 |
|---|---|
| 自选股管理 | 搜索（代码 / 名称 / 拼音首字母）添加，卡片右上角 × 删除 |
| 实时行情 | 每 3 秒刷新价格、涨跌幅、迷你走势线；**非交易时段自动降频到 30 秒** |
| 顶部指数栏 | 上证 / 深证 / 创业板实时联动（红涨绿跌，符合 A 股习惯） |
| 涨跌家数对比 | 指数栏下方一行：**上涨 xxx 涨停 xxx ｜ 下跌 xxx 跌停 xxx**（红涨绿跌，数据为示意） |
| 价格高亮 | 价格变动时卡片闪烁红/绿 |
| 我的持仓 | 同花顺式盈亏视图：每只显示 现价/数量/成本/市值/浮动盈亏/盈亏率；顶部汇总 总市值/总浮动盈亏/总收益率——**仅记录成本与股数，不交易** |
| 主力资金 | 个股详情浮层 + 板块热力页市场概览，展示主力净流入(亿)与一句话解读（**数据为示意，仅供参考**） |
| 账号资料 | 设置账号名 + 上传头像（存 IndexedDB，非真实登录）；首页按时间问候「晚上好，xxx」+ 连续看盘天数 |
| 命令面板 | `Ctrl/⌘ + K` 唤起，模糊 + 拼音搜索，一行完成跳转 / 添加 / 设预警 |
| 详情浮层 | 点卡片从右侧滑出，保留主列表上下文；含"贵不贵 / 赚不赚钱 / 主力资金"结论 |
| 资讯流 | 4 个标签：**全部 / 持仓 / 自选 / 市场**；自动判 利好/利空/中性 并打彩色标签，点标签可见判定原因 |
| 价格预警 | 渐进式表单：选股 → 选类型 → 填数值 → 确认；触发弹系统通知 |
| 板块热力 | 各板块今日涨跌红绿成片，一眼看主线；顶部含主力资金市场概览 |
| 首页 Hero | 头像 + 问候 + 连续看盘天数 + 自选/持仓/预警统计 + 风险盾提示卡 |
| 系统托盘 | 关闭窗口时最小化到托盘（非退出），托盘右键「显示窗口 / 退出」 |
| 应用图标 | 多尺寸 Windows `.ico`（含软件内、任务栏、托盘），由 `build/icon.png` 生成 |
| 本地持久化 | 自选股、预警、持仓、账号资料、新闻缓存全部存入 IndexedDB |

---

## 技术选型

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
│   ├── icon.png         # 源图（你上传的「盯一眼logo.png」）
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
                         # AlertsPage / HeatMapPage / ProfilePage
```

---

## 启动方式

```bash
cd glance
npm install      # 会自动下载 Electron 二进制（首次较慢）
npm run dev      # 同时启动 Vite(5173) 与 Electron 窗口
```

构建并打包 Windows 客户端（含安装包 + 免安装单文件）：

```bash
npm run dist
# 输出：dist-electron/Glance-Setup-1.0.0.exe（安装包）
#       dist-electron/Glance-Portable-1.0.0.exe（免安装单文件）
```

产物输出到 `dist-electron/`：

| 文件 | 用途 |
|---|---|
| `Glance-Setup-1.0.0.exe` | 标准安装包，双击安装、可卸载 |
| `Glance-Portable-1.0.0.exe` | 免安装单文件，直接双击运行 |
| `win-unpacked/` | 绿色版目录，里面的 `盯一眼 Glance.exe` 可直接运行 |

---

## 行情代理层（重点）

渲染进程**无法直接连接交易所**（CORS + 鉴权），因此所有行情都经由
**Electron 主进程代理转发 + 缓存**后再喂给前端，架构如下：

```
渲染进程 (React)                Electron 主进程               行情源
─────────────────             ─────────────────             ─────────
store.startTicking()  ──IPC──▶  get-quotes handler
                                     │
                                     ├─ 读内存缓存 (TTL 内直接返回)
                                     │
                                     └─ 调腾讯行情 API → 写缓存 → 返回
```

- **真实数据源**：默认调用腾讯财经免费行情接口 `https://qt.gtimg.cn/q=...`，
  覆盖全部自选股与上证/深证/创业板 3 大指数，实时抓取当前价、昨收、
  今开、最高、最低、成交量等字段。
- 渲染端桥接在 `src/quotes.js`：检测到 `window.electronAPI.getQuotes` 就走主进程；
  否则降级到 `mockData.js` 的本地模拟引擎。
- 主进程代理在 `electron/main.js` 的 `ipcMain.handle('get-quotes', ...)`，
  内置**内存缓存（TTL）**与**网络错误离线降级**，断网时自动回到 mock 引擎。

### 切换数据源

通过环境变量配置（`electron/main.js` 读取）：

| 变量 | 默认值 | 说明 |
|---|---|---|
| `GLANCE_QUOTE_SOURCE` | `http` | `http` = 腾讯财经真实行情；`mock` = 本地模拟引擎 |
| `GLANCE_CACHE_TTL` | `1500` | 缓存有效期（毫秒），避免频繁打数据源 |

开发时若不想走网络，可切回 mock：

```bash
# Windows PowerShell
$env:GLANCE_QUOTE_SOURCE="mock"
npm run dev

# Windows CMD
set GLANCE_QUOTE_SOURCE=mock
npm run dev
```

> 注意：腾讯接口为公开免费接口，字段与稳定性可能变化；生产环境如需更高稳定性，
> 建议接入合规数据服务商。默认真实源已做降级处理，网络异常不会导致应用崩溃。

---

## 关于"示意"数据（诚信护栏）

为兼顾「小白可读性」与「不误导」，以下功能的数据为**示意 / 非真实全市场数据**，界面均已显著标注：

- **涨跌家数对比**（上涨/涨停/下跌/跌停）：由当前追踪样本估算并放大，标注「示意」。
- **主力资金 / 资金流向**（个股净流入、市场概览）：算法生成，标注「数据为示意，仅供参考」。

真实持仓盈亏（成本 × 股数）基于真实行情价计算，无需标注。

---

## 设计护栏（可用性优先）

- ✅ 新拟态厚卡片、轻玻璃质感、命令面板、智能搜索、上下文浮层、可解释标签、渐进式表单 —— 直接采用
- ✅ 酒红沉浸式控制台风格、连续看盘天数、账号头像与问候 —— 增强归属感
- ❌ 禁止 K 线 / 蜡烛 / MACD / KDJ / 均线；禁止 PE/PB/ROE 裸奔；禁止任何交易功能
- ❌ 禁止把示意数据伪装成真实数据
- 一切以小白可读性为准，同一屏只允许一种"炫"，其余全是酒红灰阶与留白

---

## 版本

`盯一眼 · Glance v1.0.0` — Yuyuet Mo 出品
