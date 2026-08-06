/**
 * constants.ts — 全局常量定义。
 *
 * 集中管理后端 URL、特征字段元数据、默认值等，
 * 避免页面中硬编码。
 */

import type { HouseFeatures } from "./types";

// ============================================================
// 后端 URL 配置
// ============================================================

/** App1 FastAPI 后端 */
export const APP1_BASE_URL =
    process.env.NEXT_PUBLIC_APP1_URL || "http://localhost:8001";

/** App2 Spring Boot 后端 */
export const APP2_BASE_URL =
    process.env.NEXT_PUBLIC_APP2_URL || "http://localhost:8002";

// ============================================================
// 特征字段元数据（用于表单标签、校验规则、单位）
// ============================================================

export interface FieldMeta {
    key: keyof HouseFeatures;
    label: string;
    unit: string;
    type: "number" | "integer";
    min: number;
    max: number;
    step: number;
    placeholder: string;
}

// 训练数据范围（由 train.py 计算，与 feature_stats.json 保持一致）
// 用于 what-if 滑块的默认范围，避免无意义的外推
export const FIELD_META: Record<keyof HouseFeatures, FieldMeta> = {
    square_footage: {
        key: "square_footage",
        label: "居住面积",
        unit: "sq ft",
        type: "integer",
        min: 980,
        max: 2400,
        step: 50,
        placeholder: "例: 1500",
    },
    bedrooms: {
        key: "bedrooms",
        label: "卧室数量",
        unit: "间",
        type: "integer",
        min: 2,
        max: 4,
        step: 1,
        placeholder: "例: 3",
    },
    bathrooms: {
        key: "bathrooms",
        label: "浴室数量",
        unit: "间",
        type: "number",
        min: 1,
        max: 3,
        step: 0.5,
        placeholder: "例: 2",
    },
    year_built: {
        key: "year_built",
        label: "建造年份",
        unit: "年",
        type: "integer",
        min: 1978,
        max: 2012,
        step: 1,
        placeholder: "例: 1997",
    },
    lot_size: {
        key: "lot_size",
        label: "地块面积",
        unit: "sq ft",
        type: "integer",
        min: 4400,
        max: 10500,
        step: 100,
        placeholder: "例: 6800",
    },
    distance_to_city_center: {
        key: "distance_to_city_center",
        label: "距市中心距离",
        unit: "mile",
        type: "number",
        min: 2.1,
        max: 8.2,
        step: 0.1,
        placeholder: "例: 4.1",
    },
    school_rating: {
        key: "school_rating",
        label: "学校评分",
        unit: "/10",
        type: "number",
        min: 6.5,
        max: 9.1,
        step: 0.1,
        placeholder: "例: 7.6",
    },
};

/** 默认房源特征值（训练数据均值，用于 What-If 预填） */
export const DEFAULT_FEATURES: HouseFeatures = {
    square_footage: 1690,
    bedrooms: 3,
    bathrooms: 2,
    year_built: 1996,
    lot_size: 7230,
    distance_to_city_center: 4.6,
    school_rating: 7.8,
};

/** localStorage key */
export const HISTORY_STORAGE_KEY = "app1-prediction-history";
