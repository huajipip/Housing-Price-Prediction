/**
 * api.ts — 后端 API 调用封装。
 *
 * 统一的 fetch wrapper，处理 JSON 解析、错误格式化和超时。
 * 所有后端调用都通过这里，方便统一加拦截器、日志等。
 */

import { APP1_BASE_URL, APP2_BASE_URL } from "./constants";
import type {
    CorrelationResponse,
    DistributionResponse,
    ErrorResponse,
    HealthResponse,
    HouseFeatures,
    PredictionResponse,
    StatsResponse,
    WhatIfRequest,
    WhatIfResponse,
} from "./types";

// ============================================================
// 通用 fetch wrapper
// ============================================================

async function request<T>(
    url: string,
    options?: RequestInit
): Promise<T> {
    const res = await fetch(url, {
        headers: { "Content-Type": "application/json", ...options?.headers },
        ...options,
    });

    if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        const err = body as ErrorResponse;
        throw new Error(err.message || `请求失败 (${res.status})`);
    }

    return res.json();
}

// ============================================================
// App1 API (Python FastAPI)
// ============================================================

export const app1Api = {
    /** 单条预测 */
    predict: (features: HouseFeatures) =>
        request<PredictionResponse>(`${APP1_BASE_URL}/api/app1/predict`, {
            method: "POST",
            body: JSON.stringify(features),
        }),

    /** 批量预测 */
    predictBatch: (houses: HouseFeatures[]) =>
        request<PredictionResponse>(`${APP1_BASE_URL}/api/app1/predict/batch`, {
            method: "POST",
            body: JSON.stringify({ houses }),
        }),

    /** 模型信息 */
    getModelInfo: () =>
        request<Record<string, unknown>>(`${APP1_BASE_URL}/api/app1/model-info`),

    /** 健康检查 */
    health: () =>
        request<HealthResponse>(`${APP1_BASE_URL}/api/app1/health`),
};

// ============================================================
// App2 API (Java Spring Boot)
// ============================================================

export const app2Api = {
    /** 聚合统计 */
    getStats: (params?: Record<string, string>) => {
        const qs = params ? "?" + new URLSearchParams(params).toString() : "";
        return request<StatsResponse>(`${APP2_BASE_URL}/api/app2/stats${qs}`);
    },

    /** 价格分布 */
    getDistribution: (params?: Record<string, string>) => {
        const qs = params ? "?" + new URLSearchParams(params).toString() : "";
        return request<DistributionResponse>(
            `${APP2_BASE_URL}/api/app2/stats/distribution${qs}`
        );
    },

    /** 特征相关性 */
    getCorrelation: () =>
        request<CorrelationResponse>(
            `${APP2_BASE_URL}/api/app2/stats/correlation`
        ),

    /** 单条预测（通过 App2 代理） */
    predict: (features: HouseFeatures) =>
        request<PredictionResponse>(`${APP2_BASE_URL}/api/app2/predict`, {
            method: "POST",
            body: JSON.stringify(features),
        }),

    /** What-If 分析 */
    whatIf: (req: WhatIfRequest) =>
        request<WhatIfResponse>(`${APP2_BASE_URL}/api/app2/what-if`, {
            method: "POST",
            body: JSON.stringify(req),
        }),

    /** CSV 导出下载（支持可选筛选参数，不传 = 全量导出） */
    exportCsvUrl: (params?: Record<string, string>) => {
        const qs = params ? "?" + new URLSearchParams(params).toString() : "";
        return `${APP2_BASE_URL}/api/app2/export/csv${qs}`;
    },

    /** 健康检查 */
    health: () =>
        request<HealthResponse>(`${APP2_BASE_URL}/api/app2/health`),
};
