# 房价预测统一门户 (Housing Price Portal)

基于 Next.js 的统一房价预测平台，集成两个独立后端应用。

## 技术栈

- **前端**: Next.js (App Router) + TypeScript + Tailwind CSS
- **App1 后端**: Python FastAPI（房源估值器）
- **App2 后端**: Java Spring Boot 3.4.4（市场分析）
- **ML 模型**: Scikit-learn 线性回归模型（Task 1）

## 快速开始

```bash
# 安装依赖
npm install

# 启动开发服务器
npm run dev
```

浏览器访问 [http://localhost:3000](http://localhost:3000) 查看效果。

## 项目结构

```
src/
├── app/                    # App Router 路由
│   ├── layout.tsx          # 根布局（导航 + 页脚）
│   ├── page.tsx            # 首页
│   ├── loading.tsx         # 全局加载状态
│   ├── error.tsx           # 全局错误边界
│   ├── app1/               # App1 · 房源估值器
│   │   ├── layout.tsx      # App1 子导航
│   │   ├── estimate/       # 估值预测表单
│   │   ├── compare/        # 批量对比
│   │   └── history/        # 历史记录
│   └── app2/               # App2 · 市场分析
│       ├── layout.tsx      # App2 子导航
│       ├── dashboard/      # 交互仪表盘
│       ├── what-if/        # What-If 分析
│       └── export/         # 数据导出
├── components/             # 共享组件
├── hooks/                  # 自定义 Hooks
└── lib/                    # 工具函数 & API 客户端
```
