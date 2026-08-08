"use client";

/**
 * ErrorDisplay — 错误展示组件。
 *
 * 用于 Error Boundary 和 API 错误展示，
 * 提供"重试"按钮。
 */

interface ErrorDisplayProps {
    error: Error;
    reset?: () => void;
    title?: string;
}

export default function ErrorDisplay({
    error,
    reset,
    title = "加载失败",
}: ErrorDisplayProps) {
    return (
        <div
            role="alert"
            className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8"
        >
            <div className="rounded-xl border border-red-200 bg-red-50 p-8 text-center dark:border-red-800 dark:bg-red-950">
                <div className="mb-4 text-4xl">⚠️</div>
                <h2 className="mb-2 text-xl font-semibold text-red-800 dark:text-red-300">
                    {title}
                </h2>
                <p className="mb-6 text-sm text-red-600 dark:text-red-400">
                    {error.message || "发生了未知错误，请稍后重试。"}
                </p>
                {reset && (
                    <button
                        onClick={reset}
                        className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-red-700"
                    >
                        重试
                    </button>
                )}
            </div>
        </div>
    );
}
