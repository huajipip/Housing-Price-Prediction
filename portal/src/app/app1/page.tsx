import Link from "next/link";

/** App1 首页占位 — Step 7 将替换为真实内容 */
export default function App1Page() {
    return (
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8 text-center">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                App 1 · 房源估值器
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-8">
                选择上方子导航开始使用，或前往：
            </p>
            <div className="flex justify-center gap-4">
                <Link href="/app1/estimate" className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700">开始估值</Link>
                <Link href="/app1/compare" className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-800">批量对比</Link>
            </div>
        </div>
    );
}
