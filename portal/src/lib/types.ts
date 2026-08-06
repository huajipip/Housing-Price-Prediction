/**
 * types.ts — 全局 TypeScript 类型定义。
 *
 * 所有接口和数据字段严格对应数据集字段名（snake_case），
 * 与 Python/Java 后端保持一致。
 */

/** 房源特征输入（7 个字段，对应数据集列） */
export interface HouseFeatures {
    square_footage: number;
    bedrooms: number;
    bathrooms: number;
    year_built: number;
    lot_size: number;
    distance_to_city_center: number;
    school_rating: number;
}

/** 预测响应 */
export interface PredictionResponse {
    predictions: number[];
}

/** 统一错误响应 */
export interface ErrorResponse {
    error: boolean;
    message: string;
    detail?: string;
}

/** 健康检查响应 */
export interface HealthResponse {
    status: "healthy" | "degraded";
    task1_connected: boolean;
}

/** 聚合统计响应 (App2) */
export interface StatsResponse {
    totalRecords: number;
    meanPrice: number;
    medianPrice: number;
    minPrice: number;
    maxPrice: number;
    stdDevPrice: number;
    meanSquareFootage: number;
    meanBedrooms: number;
    meanBathrooms: number;
    meanYearBuilt: number;
    meanLotSize: number;
    meanDistanceToCityCenter: number;
    meanSchoolRating: number;
}

/** 价格分布响应 (App2) */
export interface DistributionResponse {
    buckets: string[];
    counts: number[];
}

/** 特征相关性响应 (App2) */
export interface CorrelationResponse {
    correlations: Record<string, number>;
}

/** What-If 请求 (App2) */
export interface WhatIfRequest {
    baseFeatures: HouseFeatures;
    varyFeature: string;
    varyMin: number;
    varyMax: number;
    steps: number;
}

/** What-If 响应 (App2) */
export interface WhatIfResponse {
    varyFeature: string;
    dataPoints: { featureValue: number; predictedPrice: number }[];
}

/** 历史记录条目 (localStorage) */
export interface HistoryEntry {
    id: string;
    timestamp: number;
    features: HouseFeatures;
    predictedPrice: number;
}
