/**
 * LoadingSkeleton — 骨架屏加载占位。
 *
 * 用于页面级别的加载状态展示，
 * 通过 rows 参数控制骨架行数。
 */

export default function LoadingSkeleton({ rows = 5 }: { rows?: number }) {
    return (
        <div className="mx-auto max-w-7xl animate-pulse px-4 py-8 sm:px-6 lg:px-8">
            {/* 标题骨架 */}
            <div className="mb-8 h-8 w-64 rounded-lg bg-gray-200 dark:bg-gray-700" />
            {/* 内容骨架 */}
            <div className="space-y-4">
                {Array.from({ length: rows }).map((_, i) => (
                    <div
                        key={i}
                        className="h-4 rounded bg-gray-200 dark:bg-gray-700"
                        style={{ width: `${70 + Math.random() * 30}%` }}
                    />
                ))}
            </div>
        </div>
    );
}
