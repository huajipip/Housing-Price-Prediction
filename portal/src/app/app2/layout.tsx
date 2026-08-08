/**
 * App2 子布局 — 市场分析。
 *
 * 子导航（Dashboard / What-If / Export）由共享的 SubNav
 * 客户端组件渲染，带激活态与 aria-current。
 */

import SubNav from "@/components/SubNav";

const SUB_NAV = [
    { href: "/app2/dashboard", label: "仪表盘" },
    { href: "/app2/what-if", label: "What-If 分析" },
    { href: "/app2/export", label: "数据导出" },
];

export default function App2Layout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div>
            <SubNav title="App 2 · 市场分析" items={SUB_NAV} />
            {/* 页面内容 */}
            {children}
        </div>
    );
}
