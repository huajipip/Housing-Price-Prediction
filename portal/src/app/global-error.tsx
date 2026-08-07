"use client";

/**
 * 全局错误边界 — 捕获根布局（layout.tsx）自身的错误。
 *
 * 与 error.tsx 的区别：
 * - error.tsx 包裹在 RootLayout 内部，替换的是 children
 * - global-error.tsx 替换整个 RootLayout，必须自带 <html>/<body>
 *
 * 没有此文件时，如果导航栏/页脚崩溃，整页白屏且无回退。
 */

import ErrorDisplay from "@/components/ErrorDisplay";

export default function GlobalError({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    return (
        <html lang="zh-CN">
            <body>
                <div className="flex min-h-screen items-center justify-center bg-gray-50 p-6 dark:bg-gray-950">
                    <ErrorDisplay
                        error={error}
                        reset={reset}
                        title="应用发生错误"
                    />
                </div>
            </body>
        </html>
    );
}
