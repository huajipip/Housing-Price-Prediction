import Link from "next/link";

/** App1 首页占位 — Step 7 将替换为真实内容 */
export default function App1Page() {
    return (
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8 text-center">
            <h2 className="mb-4 text-3xl font-bold text-ink">
                App 1 · 房源估值器
            </h2>
            <p className="mb-8 text-coolgray">
                选择上方子导航开始使用，或前往：
            </p>
            <div className="flex justify-center gap-4">
                <Link href="/app1/estimate" className="btn-primary">开始估值</Link>
                <Link href="/app1/compare" className="btn-outline">批量对比</Link>
            </div>
        </div>
    );
}
