# Task 2 遗留问题清单

> 更新：2026-08-07（第三轮） | 原 8 项 → 已修复 7 项，剩余 1 项

---

## ✅ 已修复（7 项）

| # | 问题 | 修复方式 |
|---|------|----------|
| #1 | App2 healthcheck 用 curl，但镜像无 curl | `Dockerfile` 运行阶段安装 curl |
| #2 | `NEXT_PUBLIC_*` 运行时 env 无效 | 移除 compose 误导性 env，浏览器实际需要 `localhost:8001`（默认值已正确） |
| #3 | App2 RestClient 无超时 | `task1RestClient` 已配置 5s/10s 超时；删除了无超时的死代码 `restClient()` |
| #4 | What-If `useDebounce` 死代码 | 现已被自动触发分析使用（`debouncedMin/Max` 传入 `runAnalysis`） |
| #5 | 缺少 `.dockerignore` | 4 个服务目录均已创建 |
| #6 | 数据导出缺 PDF | `@react-pdf/renderer` + 导出范围选择 + 后端筛选导出 |
| #7 | 批量预测不存历史 | `compare/page.tsx` 已调用 `addEntries(houses, predictions)` |

## ⏳ 剩余（1 项）

### #8 缺少根目录 README.md

面试官打开仓库第一眼看到的是文件列表。应添加顶层 `README.md` 说明：
- 项目整体架构图
- 4 个子项目的职责
- 一键启动命令
- 技术栈一览

---

## 其他跟踪项（见 REQUIREMENTS-AUDIT.md）

- ✅ 需求偏离 15 项中 14 项已修复（仅剩 #12 RSC 数据加载未修）
- ✅ 工程质量项：`global-error.tsx`、页面过渡动画、WCAG 补全、App1 错误响应 `detail`、空状态文案均已修复
