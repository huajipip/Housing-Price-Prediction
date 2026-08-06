/**
 * App2 子布局 — 市场分析。
 *
 * 包含子导航（Dashboard / What-If / Export）。
 */

import Link from "next/link";

const SUB_NAV = [
    { href: "/app2/dashboard", label: "仪表盘" },
    { href: "/app2/what-if", label: "What-If 分析" },
    { href: "/app2/export", label: "数据导出" },
];

export default function App2Layout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div>
            {/* 子导航 */}
            <div className="border-b border-gray-200 bg-amber-50/50 dark:border-gray-800 dark:bg-amber-950/20">
                <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center gap-1 overflow-x-auto py-3">
                        <span className="mr-4 text-sm font-semibold text-amber-700 dark:text-amber-300">
                            App 2 · 市场分析
                        </span>
                        {SUB_NAV.map((item) => (
                            <Link
                                key={item.href}
                                href={item.href}
                                className="rounded-lg px-3 py-1.5 text-sm text-gray-600 transition-colors hover:bg-white hover:text-amber-700 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-amber-300"
                            >
                                {item.label}
                            </Link>
                        ))}
                    </div>
                </div>
            </div>
            {/* 页面内容 */}
            {children}
        </div>
    );
}
