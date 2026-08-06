/**
 * 首页 — 统一门户入口。
 *
 * 展示两个子应用的简介卡片，引导用户选择。
 */

import Link from "next/link";

export default function HomePage() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
      {/* 标题区 */}
      <div className="mb-12 text-center">
        <h1 className="mb-4 text-4xl font-bold tracking-tight text-gray-900 dark:text-white sm:text-5xl">
          Housing Price Portal
        </h1>
        <p className="mx-auto max-w-2xl text-lg text-gray-600 dark:text-gray-400">
          基于机器学习模型的统一房价预测门户。选择下方应用开始使用。
        </p>
      </div>

      {/* 应用入口卡片 */}
      <div className="grid gap-8 md:grid-cols-2">
        {/* App1 卡片 */}
        <Link
          href="/app1"
          className="group rounded-2xl border border-gray-200 bg-white p-8 shadow-sm transition-all hover:border-blue-300 hover:shadow-md dark:border-gray-800 dark:bg-gray-900 dark:hover:border-blue-700"
        >
          <div className="mb-4 inline-flex rounded-xl bg-blue-100 p-3 dark:bg-blue-900/40">
            <svg
              className="h-8 w-8 text-blue-600 dark:text-blue-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
              />
            </svg>
          </div>
          <h2 className="mb-2 text-2xl font-semibold text-gray-900 dark:text-white">
            App 1 · 房源估值器
          </h2>
          <p className="mb-4 text-sm text-gray-600 dark:text-gray-400">
            Property Value Estimator
          </p>
          <ul className="space-y-2 text-sm text-gray-500 dark:text-gray-400">
            <li>• 输入房源特征，一键获取AI预测价格</li>
            <li>• 支持单个和批量房源对比分析</li>
            <li>• 历史估值记录自动保存</li>
            <li className="text-xs text-gray-400">后端: Python FastAPI</li>
          </ul>
          <span className="mt-6 inline-flex items-center text-sm font-medium text-blue-600 group-hover:underline dark:text-blue-400">
            开始估值 →
          </span>
        </Link>

        {/* App2 卡片 */}
        <Link
          href="/app2"
          className="group rounded-2xl border border-gray-200 bg-white p-8 shadow-sm transition-all hover:border-amber-300 hover:shadow-md dark:border-gray-800 dark:bg-gray-900 dark:hover:border-amber-700"
        >
          <div className="mb-4 inline-flex rounded-xl bg-amber-100 p-3 dark:bg-amber-900/40">
            <svg
              className="h-8 w-8 text-amber-600 dark:text-amber-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
              />
            </svg>
          </div>
          <h2 className="mb-2 text-2xl font-semibold text-gray-900 dark:text-white">
            App 2 · 市场分析
          </h2>
          <p className="mb-4 text-sm text-gray-600 dark:text-gray-400">
            Property Market Analysis
          </p>
          <ul className="space-y-2 text-sm text-gray-500 dark:text-gray-400">
            <li>• 交互式仪表盘 + 数据可视化</li>
            <li>• What-If 情景模拟分析</li>
            <li>• 数据导出（CSV）</li>
            <li className="text-xs text-gray-400">后端: Java Spring Boot</li>
          </ul>
          <span className="mt-6 inline-flex items-center text-sm font-medium text-amber-600 group-hover:underline dark:text-amber-400">
            查看分析 →
          </span>
        </Link>
      </div>

      {/* 技术栈展示 */}
      <div className="mt-16 text-center">
        <p className="text-xs text-gray-400 dark:text-gray-500">
          Next.js App Router · Tailwind CSS · React Server Components · FastAPI · Spring Boot 3.4.4 · Scikit-learn
        </p>
      </div>
    </div>
  );
}
