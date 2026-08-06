"use client";

/**
 * Navbar — 统一导航栏。
 *
 * 桌面端：水平导航链接
 * 移动端：汉堡菜单展开，点击链接后自动收起
 */

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

const NAV_ITEMS = [
    {
        label: "App1 · 房源估值",
        href: "/app1",
        description: "Property Value Estimator",
    },
    {
        label: "App2 · 市场分析",
        href: "/app2",
        description: "Property Market Analysis",
    },
];

export default function Navbar() {
    const pathname = usePathname();
    const [mobileOpen, setMobileOpen] = useState(false);

    const isActive = (href: string) =>
        pathname === href || pathname.startsWith(href + "/");

    return (
        <nav className="sticky top-0 z-50 border-b border-gray-200 bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/80 dark:border-gray-800 dark:bg-gray-950/95">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                <div className="flex h-16 items-center justify-between">
                    {/* Logo + 首页链接 */}
                    <Link
                        href="/"
                        className="flex items-center gap-2 text-lg font-bold text-gray-900 dark:text-white"
                    >
                        <span className="rounded-lg bg-blue-600 px-2 py-1 text-sm text-white">
                            HP
                        </span>
                        Housing Portal
                    </Link>

                    {/* 桌面端导航 */}
                    <div className="hidden sm:flex sm:gap-1">
                        {NAV_ITEMS.map((item) => (
                            <Link
                                key={item.href}
                                href={item.href}
                                className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${isActive(item.href)
                                        ? "bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300"
                                        : "text-gray-600 hover:bg-gray-100 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-white"
                                    }`}
                                title={item.description}
                            >
                                {item.label}
                            </Link>
                        ))}
                    </div>

                    {/* 移动端汉堡按钮 */}
                    <button
                        className="rounded-lg p-2 text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800 sm:hidden"
                        onClick={() => setMobileOpen(!mobileOpen)}
                        aria-label={mobileOpen ? "关闭菜单" : "打开菜单"}
                        aria-expanded={mobileOpen}
                    >
                        <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            {mobileOpen ? (
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            ) : (
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                            )}
                        </svg>
                    </button>
                </div>

                {/* 移动端菜单 */}
                {mobileOpen && (
                    <div className="border-t border-gray-200 pb-3 dark:border-gray-800 sm:hidden">
                        {NAV_ITEMS.map((item) => (
                            <Link
                                key={item.href}
                                href={item.href}
                                onClick={() => setMobileOpen(false)}
                                className={`block rounded-lg px-4 py-3 text-sm font-medium ${isActive(item.href)
                                        ? "bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300"
                                        : "text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800"
                                    }`}
                            >
                                <div>{item.label}</div>
                                <div className="text-xs opacity-60">{item.description}</div>
                            </Link>
                        ))}
                    </div>
                )}
            </div>
        </nav>
    );
}
