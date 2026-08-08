/**
 * Footer — 统一页脚。
 *
 * 简约设计，展示项目名称和技术栈。
 */

export default function Footer() {
    return (
        <footer className="border-t border-line bg-surface-subtle dark:bg-background">
            <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
                <div className="flex flex-col items-center justify-between gap-2 sm:flex-row">
                    <p className="text-sm text-coolgray">
                        Housing Price Portal &copy; {new Date().getFullYear()}
                    </p>
                    <p className="text-xs text-silver">
                        Next.js · FastAPI · Spring Boot · Scikit-learn
                    </p>
                </div>
            </div>
        </footer>
    );
}
