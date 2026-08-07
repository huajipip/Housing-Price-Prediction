# 需求偏离审计报告（Task 2）

> 审计日期：2026-08-07 | 对照文档：`my-asset/Interview Tasks Fullstack (1).txt` + `my-asset/Task2-Requirements.md`

---

## 总览

对 Task 2 的三个模块（Portal 共享层、App1 估值器、App2 市场分析）逐条对照需求后发现 **15 项偏离**，其中 6 项为功能性缺失，3 项为功能性偏差，6 项为工程质量/一致性问题。

---

## 🔴 功能性缺失（6 项）

| # | 模块 | 偏离 | 需求原文 | 实际 | 修复状态 |
|---|------|------|----------|------|----------|
| 1 | **App2 导出** | 不支持筛选导出 | "导出**当前筛选条件下**的数据集" | 始终全量导出，端点无筛选参数 | ✅ 已修 |
| 2 | **App2 导出** | 缺少导出范围选择 | "支持「全部数据」或「当前筛选结果」" | 仅一个"下载 CSV"按钮 | ✅ 已修 |
| 3 | **App2 Dashboard** | 第 4 张卡片指标错误 | "4 张卡片：平均、中位数、**总条数**、最高/最低" | 第 4 张为"标准差" | ✅ 已修 |
| 4 | **App2 Dashboard** | 缺少散点图 | "散点图展示 square_footage vs price、distance_to_city_center vs price" | 仅有 Pearson 相关性柱状图 | ✅ 已修 |
| 5 | **App2 Dashboard** | FilterBar 只有下限 | "按 bedrooms、year_built **区间**、school_rating **范围**" | 仅 min 输入框 | ✅ 已修 |
| 6 | **App1 Compare** | 缺少重排序 | "支持删除、清空、**重新排序**" | 有删除/清空，无排序功能 | ✅ 已修 |

## 🟡 功能性偏差（3 项）

| # | 模块 | 偏离 | 需求原文 | 实际 | 修复状态 |
|---|------|------|----------|------|----------|
| 7 | **App1 History** | 缺少点击回填 | "支持点击某条**回填到预测表单**" | 行不可点击 | ✅ 已修 |
| 8 | **App2 What-If** | 重置目标值 | "重置为数据集**中位数**" | 重置为均值 | ✅ 已修 |
| 9 | **App2 导出** | PDF 未实现 | "PDF 报告（可选加分项）" | 按钮 disabled | ✅ 已修 |

## 🟢 工程质量/一致性（6 项）

| # | 模块 | 偏离 | 详情 | 修复状态 |
|---|------|------|------|----------|
| 10 | Portal | 缺少 `global-error.tsx` | 根布局崩溃时白屏无回退 | 待修复 |
| 11 | Portal | 缺少页面过渡动画 | 需求提了"平滑过渡" | 待修复 |
| 12 | Portal | 未用 RSC 数据加载 | 首页用 useEffect，未用 async RSC | 待修复 |
| 13 | Portal | WCAG 不完整 | 缺 skip-link、aria-current、focus-visible、图表 alt | 待修复 |
| 14 | App1 后端 | 错误响应缺 detail | predict.py 502 响应仅 {error, message} | 待修复 |
| 15 | App1 Estimate | 空状态文案偏差 | 多出"点击「开始估值」获取 AI 预测价格" | 待修复 |

---

## 本次修复详情（2026-08-07）

### App2 数据导出全面修复

**Phase A — 后端筛选导出支持**

| 文件 | 操作 | 说明 |
|------|------|------|
| `app2-market-analysis/.../service/ExportService.java` | 重写 | `exportAllWithPredictions()` → `exportWithPredictions(6 filter params)`；新增 `filterRecords()` 内联筛选；不传参 = 全量（向后兼容） |
| `app2-market-analysis/.../controller/ExportController.java` | 修改 | 增加 6 个 `@RequestParam(required=false)` 筛选参数，参数命名与 `StatsController` 一致 |

**Phase B — 前端导出范围选择**

| 文件 | 操作 | 说明 |
|------|------|------|
| `portal/src/lib/api.ts` | 修改 | `exportCsvUrl()` 改为 `exportCsvUrl(params?)`，接受可选筛选参数 |
| `portal/src/app/app2/export/page.tsx` | 重写 | 新增 Radio group「全部数据/当前筛选结果」；选择筛选时展开 FilterBar（6 字段）；CSV 导出自动拼接筛选参数 |

**Phase C — PDF 报告生成**

| 文件 | 操作 | 说明 |
|------|------|------|
| `portal/src/components/DashboardReport.tsx` | 新建 | 使用 `@react-pdf/renderer`（已有依赖）生成 PDF；包含标题、日期、统计概览表、价格分布柱状图；支持中文字体 |

### 设计决策说明（供面试解释）

1. **一个端点两种模式** > 两个端点：`/api/app2/export/csv` 不传参 = 全量，传参 = 筛选。避免接口膨胀，RESTful 风格更简洁。

2. **筛选参数复用 StatsController 命名**：`minBedrooms/maxBedrooms/minYearBuilt/maxYearBuilt/minSchoolRating/maxSchoolRating` — 前端 FilterBar 和 Dashboard 可零成本复用。

3. **PDF 用 @react-pdf/renderer** > html2canvas+jspdf：`@react-pdf/renderer` 已是项目依赖，声明式 React 组件定义 PDF 布局更结构化，支持中文字体，生成的 PDF 是真正的矢量文档而非截图。

4. **筛选状态跨页面传递**：用 URL query params 而非全局状态（Redux/Context），无额外依赖，可分享链接，面试时最好解释。

---

## 修复记录 2（2026-08-07 下午）— 需求偏离项 #3~#8 + 新发现

### 功能修复

| # | 修复 | 涉及文件 |
|---|------|----------|
| 3 | Dashboard 第 4 张卡片改为「数据集总条数」，标准差移到数据概要区 | `dashboard/page.tsx` |
| 4 | 新增散点图：后端加 `/stats/scatter?feature=` 端点返回原始数据点；前端渲染 `square_footage vs price` 和 `distance_to_city_center vs price` 两个散点图 | `ScatterResponse.java`、`MarketAnalysisService`、`StatsController`、`types.ts`、`api.ts`、`useMarketStats.ts`、`dashboard/page.tsx` |
| 5 | FilterBar 增加 `maxBedrooms/maxYearBuilt/maxSchoolRating` 上限筛选（后端本就支持） | `dashboard/page.tsx` |
| 6 | Compare 增加上移/下移重排序按钮 | `compare/page.tsx` |
| 7 | History 增加「回填」按钮 → 跳转 `/app1/estimate?prefill=<JSON>`，estimate 页读取并预填表单 | `history/page.tsx`、`estimate/page.tsx` |
| 8 | What-If 重置改为中位数：后端 `StatsResponse` 增加 7 个 `median*` 字段，前端重置时使用 | `StatsResponse.java`、`MarketAnalysisService`、`types.ts`、`what-if/page.tsx` |

### 新发现修复

| # | 修复 | 涉及文件 |
|---|------|----------|
| A1 | `feature_stats` 被 `ModelInfoResponse` schema 静默丢弃（what-if 动态范围失效）→ schema 补充 `FeatureStats` 模型 | `schemas.py` |
| A2 | `AppConfig` 无超时的死代码 `restClient()` → 删除（仅保留有 5s/10s 超时的 `task1RestClient`） | `AppConfig.java` |
| A3 | `show-details: always` → `when-authorized` | `application.yml` |

### 遗留项（未修）

- ~~Portal：`global-error.tsx`、页面过渡动画、RSC 数据加载、WCAG 补全（#10-13）~~ → #10/#11/#13 已修（2026-08-07），#12 RSC 未修
- ~~App1：错误响应缺 `detail`、空状态文案（#14-15）~~ → 已修（2026-08-07）
- ~~Docker：app2 healthcheck 用 curl（镜像无 curl，ISSUES #1）、`NEXT_PUBLIC_*` 构建期内联（ISSUES #2）~~ → 已修（2026-08-07）

## 修复记录 3（2026-08-07 晚）— 工程质量/运维项

| # | 修复 | 说明 |
|---|------|------|
| #1 | app2 Dockerfile 安装 curl | `eclipse-temurin:21-jre` 加 `apt-get install curl`，healthcheck 不再永远 unhealthy |
| #2 | 移除 compose 中误导性 `NEXT_PUBLIC_*` env | NEXT_PUBLIC 变量构建期内联，运行时设置无效；浏览器实际需要 `localhost:8001`（默认值已正确） |
| #10 | 新增 `global-error.tsx` | 根布局崩溃时不再白屏，自带 `<html>/<body>` + ErrorDisplay |
| #11 | 页面过渡动画 | 新增 `PageTransition` 组件（`usePathname` 为 key 触发 CSS 淡入），替代不可用的 View Transitions API |
| #13 | WCAG 补全 | layout 加跳过链接（WCAG 2.4.1）、Navbar 活动链接加 `aria-current="page"` |
| #14 | App1 错误响应补 `detail` | predict.py 4 处 502 响应补 detail 字段，与 ErrorResponse schema 一致 |
| #15 | App1 空状态文案 | 改为需求原文「请输入房源信息开始估值」 |

### 未修复 ⏳
- #12 RSC 数据加载（首页用 useEffect，可改为 async server component 演示 RSC）
