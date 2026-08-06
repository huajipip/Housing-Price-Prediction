"use client";

/**
 * useMarketStats — App2 市场统计数据获取 Hook。
 *
 * 基于 SWR 的轻量封装：自动缓存、重验证、错误处理。
 * SWR 比 TanStack Query 更轻量，适合此场景的数据获取需求。
 */

import useSWR from "swr";
import { app2Api } from "@/lib/api";
import type {
    StatsResponse,
    DistributionResponse,
    CorrelationResponse,
} from "@/lib/types";

export function useMarketStats(params?: Record<string, string>) {
    const key = params ? `stats-${JSON.stringify(params)}` : "stats";

    const stats = useSWR<StatsResponse>(key, () => app2Api.getStats(params), {
        revalidateOnFocus: false,
        dedupingInterval: 60000, // 1 分钟内不重复请求
    });

    return stats;
}

export function useDistribution(params?: Record<string, string>) {
    const key = params ? `dist-${JSON.stringify(params)}` : "dist";

    return useSWR<DistributionResponse>(
        key,
        () => app2Api.getDistribution(params),
        {
            revalidateOnFocus: false,
            dedupingInterval: 60000,
        }
    );
}

export function useCorrelation() {
    return useSWR<CorrelationResponse>("correlation", () =>
        app2Api.getCorrelation()
    );
}
