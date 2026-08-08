/**
 * LoadingSkeleton — 骨架屏加载占位。
 *
 * 用于页面级别的加载状态展示，
 * 通过 rows 参数控制骨架行数。
 *
 * 使用 useId() 生成确定性的宽度序列，避免 Math.random()
 * 导致服务端/客户端渲染不一致（hydration mismatch）。
 */
"use client";

export default function LoadingSkeleton({ rows = 5 }: { rows?: number }) {
    // 使用固定宽度序列，每行递减，确保 SSR/CSR 一致
    const widthPattern = [95, 88, 75, 82, 60, 92, 70, 85, 78, 90];

    return (
        <div className="mx-auto max-w-7xl animate-pulse px-4 py-8 sm:px-6 lg:px-8">
            {/* 标题骨架 */}
            <div className="mb-8 h-8 w-64 rounded-lg bg-line/60" />
            {/* 内容骨架 */}
            <div className="space-y-4">
                {Array.from({ length: rows }).map((_, i) => (
                    <div
                        key={i}
                        className="h-4 rounded bg-line/60"
                        style={{ width: `${widthPattern[i % widthPattern.length]}%` }}
                    />
                ))}
            </div>
        </div>
    );
}
