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
    ModelInfo,
    PredictionResponse,
    ScatterResponse,
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

        // 后端返回统一错误结构：{ error, message, detail }
        if (err.message) throw new Error(err.message);

        // FastAPI 422 校验错误：body 是 { detail: [...] }，无 message
        // 转换为用户可读的友好提示
        if (res.status === 422) {
            throw new Error(
                "输入数据校验失败，请检查所有字段的格式和取值范围。" +
                (Array.isArray((body as { detail?: unknown }).detail)
                    ? "（如：卧室数应为整数、浴室数最小 0.5、学校评分 0-10）"
                    : "")
            );
        }

        throw new Error(`请求失败 (${res.status})`);
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

    /** 模型信息（含 coefficients / intercept / metrics / feature_stats） */
    getModelInfo: () =>
        request<ModelInfo>(`${APP1_BASE_URL}/api/app1/model-info`),

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

    /** 散点图数据（特征 vs price） */
    getScatter: (feature: string) =>
        request<ScatterResponse>(
            `${APP2_BASE_URL}/api/app2/stats/scatter?feature=${encodeURIComponent(feature)}`
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
