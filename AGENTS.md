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

## 禁止事项
- 不要使用与规定技术栈不符的框架或库
- 不要生成与当前阶段无关的代码
- 不要省略设计解释直接甩代码