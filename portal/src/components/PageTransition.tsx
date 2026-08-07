"use client";

/**
 * PageTransition — 页面切换平滑过渡。
 *
 * 原理：监听 usePathname，用 pathname 作为 key 强制子节点重挂载，
 * 从而重新触发 CSS 淡入动画（App Router 默认复用 <main>，不会自动重放动画）。
 *
 * 替代方案对比：
 * - View Transitions API：本版本 Next.js/React 的 <Link viewTransition>
 *   与 React <ViewTransition> 均不可用，故采用此兼容方案
 */

import { usePathname } from "next/navigation";

export default function PageTransition({
    children,
}: {
    children: React.ReactNode;
}) {
    const pathname = usePathname();

    return (
        <div key={pathname} className="animate-page-fade">
            {children}
        </div>
    );
}
