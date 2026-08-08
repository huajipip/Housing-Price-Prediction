import Link from "next/link";

/** App2 首页占位 — Step 8 将替换为真实内容 */
export default function App2Page() {
    return (
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8 text-center">
            <h2 className="mb-4 text-3xl font-bold text-ink">
                App 2 · 市场分析
            </h2>
            <p className="mb-8 text-coolgray">
                选择上方子导航开始使用：
            </p>
            <div className="flex justify-center gap-4">
                <Link href="/app2/dashboard" className="btn-primary">仪表盘</Link>
                <Link href="/app2/what-if" className="btn-outline">What-If 分析</Link>
            </div>
        </div>
    );
}
