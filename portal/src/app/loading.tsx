/**
 * 全局加载状态 — 页面切换时的骨架屏。
 */

import LoadingSkeleton from "@/components/LoadingSkeleton";

export default function Loading() {
    return <LoadingSkeleton rows={6} />;
}
