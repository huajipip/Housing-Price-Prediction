/**
 * App1 子布局 — 房源估值器。
 *
 * 子导航（Estimate / Compare / History）由共享的 SubNav
 * 客户端组件渲染，带激活态与 aria-current。
 */

import SubNav from "@/components/SubNav";

const SUB_NAV = [
    { href: "/app1/estimate", label: "估值预测" },
    { href: "/app1/compare", label: "批量对比" },
    { href: "/app1/history", label: "历史记录" },
];

export default function App1Layout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div>
            <SubNav title="App 1 · 房源估值器" items={SUB_NAV} />
            {/* 页面内容 */}
            {children}
        </div>
    );
}
