# 项目上下文（Interview Fullstack Project）

## 项目目标
这是一个技术面试项目，面试官会重点考察我对架构、技术选型和设计决策的理解，而不仅仅是代码能否运行。

## 技术栈（严格遵守，不得替换）
### Task 1 - 房价预测服务
- Python 3.12+
- FastAPI
- Scikit-learn
- 必须提供接口：/predict（支持单个+批量）、/model-info、/health
- 必须提供 Dockerfile
- 数据集字段：square_footage, bedrooms, bathrooms, year_built, lot_size, distance_to_city_center, school_rating → 预测 price

### Task 2 - 统一门户
- 前端：Next.js（App Router）+ Tailwind CSS + React Server Components
- App1 后端：Python + FastAPI
- App2 后端：Java 21 + Spring Boot 3.4.4
- 两个后端都必须调用 Task 1 的预测服务
- 必须有统一布局和导航

## 工作方式（非常重要）
1. 每次只完成我当前明确要求的一小步，不要提前实现后续功能。
2. 写代码之前，必须先用简洁的语言说明：
   - 这一步的设计思路
   - 为什么这样选型/这样组织代码
   - 有哪些关键取舍
3. 代码要清晰、可读、方便我向面试官解释，优先简单明确，避免过度设计，对于功能模块都要写好注释。
4. 所有接口和数据字段必须严格对应真实数据集的字段名。
5. 出错时先分析原因，再给出修复方案，不要直接覆盖大段代码。

## 当前阶段
（每次开始新阶段时更新这里）
目前处于：Task 2 — ✅ 全部 9 步完成

### 增量：Task 1 单元测试
- 新增 `housing-price-api/tests/test_api.py` — 7 个接口契约测试（health / 单个预测 / 批量 / 缺字段 422 / 越界 422 / 批量上限 422 / model-info）
- 新增 `housing-price-api/conftest.py` — session 级 TestClient fixture，触发 lifespan 加载真实模型
- 新增 `housing-price-api/requirements-dev.txt` — pytest + httpx（不污染生产镜像）
- 运行：`cd housing-price-api && python -m pytest -v`（当前 7 passed）

### 增量：Task 2 App2 单元测试
- 新增 `app2-market-analysis/src/test/java/com/interview/marketanalysis/service/MarketAnalysisServiceTest.java` — 7 个纯 JUnit 单元测试（mock DataLoader，不启动 Spring 上下文）
- 覆盖：聚合统计正确性 / 过滤 / 空数据边界 / 直方图 5 桶 / 相关性 7 特征 ∈[-1,1] / 散点数据量 / 未知特征报错
- 运行：`cd app2-market-analysis && mvn test`（当前 7 passed，JDK 17 + Maven）

### 增量：App2 异常处理 + WCAG
- 新增 `GlobalExceptionHandler.java`（@RestControllerAdvice）：Task1 不可达/超时→502、上游 4xx/5xx→502、业务参数错→400、兜底→500；错误格式统一 `{error,message,detail}` 与 App1 对齐
- `AppConfig.java` 超时参数化（`application.yml` 可配置 connect 5s / read 10s）
- 新增 `GlobalExceptionHandlerTest.java` — 3 个 handler 单测（App2 现共 10 passed）
- WCAG 补强：`ErrorDisplay` role=alert；estimate 表单 label htmlFor + aria-required/invalid/describedby + 错误 role=alert + 结果 aria-live + 图表 role=img；what-if 控件 label 关联；dashboard 6 个筛选 select label 关联

### 增量：App1 对比视图增强
- 需求 v（对比视图）补强：`portal/src/app/app1/compare/page.tsx` 结果区升级为真正的并排对比视图（方案 A：批量预测工具区保留在顶部，结果区增强）
- 新增能力：①对比摘要（最贵/最便宜/价差/特征差异最大维度）②按价格升/降序（仅作用于结果区，不动输入表格）③并排信息卡（grid 横向，含最高/最低价徽章 + 特征相对数据集均值 ▲▼ 偏离标记）④柱状图加数据集基准价参考线（用 model-info 的 intercept）
- 数据来源零后端改动：复用 `app1Api.getModelInfo()` 的 `feature_stats`（min/max/mean）；图表基准线用 `intercept`（feature_stats 无 price 字段）
- 顺带修正 `portal/src/lib/api.ts`：`getModelInfo` 返回类型 `Record<string, unknown>` → `ModelInfo`；清理 `app2/what-if/page.tsx` 里因此不再需要的双重 cast
- 验证：`npx tsc --noEmit` 通过；`docker compose up -d --build portal` 重建后浏览器实测（3 套房源：摘要/排序/卡片/图表+基准线全部正常）

### 增量：Portal UI/UX 设计系统落地（对齐 DESIGN.md）
- 真实字体：`layout.tsx` 用 `next/font/google` 加载 **IBM Plex Sans**（400-700，构建期自托管），注入 `--font-plex`；`globals.css` 的 `--font-display/--font-body` 引用它，落地 Kraken 双字体体系（此前只有 CSS 回退栈、实际落到 Segoe UI）
- 语义令牌补齐：新增 `surface/surface-subtle/input`（暗色自动翻转，去掉组件内散落的 `dark:bg-gray-*`）与 `danger/warning` 色（DESIGN.md 原本只定义 success）；`red/amber/green-*` 全部替换为 `danger/warning/success` 令牌
- 按钮统一：新增 `.btn-primary/.btn-secondary/.btn-outline/.btn-danger`（全部 12px 圆角 + 13px 16px 内边距，符合 DESIGN.md 第 4/7 节），替换原先三处内边距不一的临时样式；CSV 下载等主操作统一为品牌紫主按钮
- 中性色/阴影：卡片/表头/输入框迁移到 `border-line/bg-surface/bg-surface-subtle/bg-input`；卡片阴影统一 `shadow-subtle`（移除 `shadow-sm`）
- 子导航激活态：新建共享客户端组件 `SubNav.tsx`（App1/App2 布局复用），激活标签 = 白色胶囊 + `aria-current="page"`（WCAG 2.4.1）；全局 `:focus-visible` 焦点环（WCAG 2.4.7）
- 字号回调：页面标题 `text-2xl→text-3xl`，卡片正文 `text-sm→text-base`，表单/筛选/统计标签 `text-xs→text-sm`；图表配色统一到紫阶+success（去掉临时绿/琥珀 hex）
- 验证：`npx tsc --noEmit` 通过；`docker compose up -d --build portal` 重建；浏览器实测计算样式（body/h2 = IBM Plex Sans、主按钮 12px/13-16px/#7132f5、danger #b42318、子导航激活胶囊、仪表盘图表正常）；遗留 1 个 lint error 为改动前已存在的 `usePredictionHistory.ts` setState-in-effect，不在本步骤范围

## 禁止事项
- 不要使用与规定技术栈不符的框架或库
- 不要生成与当前阶段无关的代码
- 不要省略设计解释直接甩代码