"use client";

/**
 * SubNav — 子应用内导航栏（App1 / App2 共用）。
 *
 * 需要 usePathname 判断激活态，因此是客户端组件；
 * 父布局保持 Server Component。
 *
 * 无障碍：当前激活标签带 aria-current="page"（WCAG 2.4.1 / 3.2.3）。
 */

import Link from "next/link";
import { usePathname } from "next/navigation";

interface SubNavProps {
    /** 子应用标题（如 "App 1 · 房源估值器"） */
    title: string;
    /** 子导航项 */
    items: { href: string; label: string }[];
}

export default function SubNav({ title, items }: SubNavProps) {
    const pathname = usePathname();

    const isActive = (href: string) =>
        pathname === href || pathname.startsWith(href + "/");

    return (
        <div className="border-b border-line bg-kraken-soft/50 dark:bg-kraken-soft/10">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                <div className="flex items-center gap-1 overflow-x-auto py-3">
                    <span className="mr-4 shrink-0 text-sm font-semibold text-kraken-deep dark:text-kraken">
                        {title}
                    </span>
                    {items.map((item) => {
                        const active = isActive(item.href);
                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                aria-current={active ? "page" : undefined}
                                className={`shrink-0 rounded-lg px-3 py-1.5 text-sm transition-colors ${active
                                    ? "bg-surface text-kraken-deep shadow-micro dark:text-kraken"
                                    : "text-coolgray hover:bg-surface hover:text-kraken-deep dark:text-silver dark:hover:text-kraken"
                                    }`}
                            >
                                {item.label}
                            </Link>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}
