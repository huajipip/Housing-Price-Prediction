import Link from "next/link";

/** App2 首页占位 — Step 8 将替换为真实内容 */
export default function App2Page() {
    return (
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8 text-center">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                App 2 · 市场分析
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-8">
                选择上方子导航开始使用：
            </p>
            <div className="flex justify-center gap-4">
                <Link href="/app2/dashboard" className="rounded-lg bg-amber-600 px-4 py-2 text-sm font-medium text-white hover:bg-amber-700">仪表盘</Link>
                <Link href="/app2/what-if" className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-800">What-If 分析</Link>
            </div>
        </div>
    );
}
