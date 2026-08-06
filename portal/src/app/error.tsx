"use client";

/**
 * 全局错误边界 — 捕获未处理的渲染错误。
 *
 * Next.js 要求 error.tsx 必须是 Client Component。
 */

import ErrorDisplay from "@/components/ErrorDisplay";

export default function GlobalError({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    return <ErrorDisplay error={error} reset={reset} title="页面加载失败" />;
}
