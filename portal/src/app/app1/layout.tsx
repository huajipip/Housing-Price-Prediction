/**
 * App1 子布局 — 房源估值器。
 *
 * 包含子导航（Estimate / Compare / History）。
 */

import Link from "next/link";

const SUB_NAV = [
    { href: "/app1/estimate", label: "估值预测" },
    { href: "/app1/compare", label: "批量对比" },
    { href: "/app1/history", label: "历史记录" },
];

export default function App1Layout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div>
            {/* 子导航 */}
            <div className="border-b border-gray-200 bg-blue-50/50 dark:border-gray-800 dark:bg-blue-950/20">
                <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center gap-1 overflow-x-auto py-3">
                        <span className="mr-4 text-sm font-semibold text-blue-700 dark:text-blue-300">
                            App 1 · 房源估值器
                        </span>
                        {SUB_NAV.map((item) => (
                            <Link
                                key={item.href}
                                href={item.href}
                                className="rounded-lg px-3 py-1.5 text-sm text-gray-600 transition-colors hover:bg-white hover:text-blue-700 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-blue-300"
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
