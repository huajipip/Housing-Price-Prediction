"use client";

/**
 * ModelInfoCard — 首页展示 Task 1 模型信息。
 *
 * 客户端组件：加载时异步请求 App1 的 /model-info，
 * 展示模型系数和性能指标。加载失败时静默隐藏。
 */

import { useEffect, useState } from "react";
import { app1Api } from "@/lib/api";

interface ModelInfo {
    coefficients: Record<string, number>;
    intercept: number;
    metrics: Record<string, number>;
}

export default function ModelInfoCard() {
    const [info, setInfo] = useState<ModelInfo | null>(null);
    const [error, setError] = useState(false);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        app1Api
            .getModelInfo()
            .then((data) => setInfo(data as unknown as ModelInfo))
            .catch(() => setError(true))
            .finally(() => setLoading(false));
    }, []);

    // 加载中：显示骨架屏
    if (loading) {
        return (
            <div className="mx-auto mt-10 max-w-3xl rounded-xl border border-line bg-surface p-6 shadow-micro">
                <div className="mb-4 h-6 w-32 animate-pulse rounded bg-line/60" />
                <div className="grid grid-cols-4 gap-3">
                    {[1, 2, 3, 4].map((i) => (
                        <div key={i} className="rounded-lg bg-surface-subtle p-3">
                            <div className="mx-auto mb-1 h-3 w-10 animate-pulse rounded bg-line/60" />
                            <div className="mx-auto h-5 w-16 animate-pulse rounded bg-line/60" />
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    // 加载失败：显示错误提示
    if (error || !info) {
        return (
            <div className="mx-auto mt-10 max-w-3xl rounded-xl border border-warning/40 bg-warning-soft p-4 text-sm text-warning shadow-micro">
                模型信息暂时无法加载，请确认 Task 1 服务运行正常。
            </div>
        );
    }

    // 特征名中文化映射
    const featureNames: Record<string, string> = {
        square_footage: "居住面积",
        bedrooms: "卧室数",
        bathrooms: "浴室数",
        year_built: "建造年份",
        lot_size: "地块面积",
        distance_to_city_center: "距市中心",
        school_rating: "学校评分",
    };

    return (
        <div className="mx-auto mt-10 max-w-3xl rounded-xl border border-line bg-surface p-6 shadow-micro">
            <h3 className="mb-4 text-lg font-semibold text-ink">
                ML 模型信息
            </h3>

            {/* 性能指标 */}
            <div className="mb-4 grid grid-cols-4 gap-3">
                {Object.entries(info.metrics).map(([key, val]) => (
                    <div
                        key={key}
                        className="rounded-lg bg-surface-subtle p-3 text-center"
                    >
                        <p className="text-xs text-silver">{key.toUpperCase()}</p>
                        <p className="text-lg font-bold text-kraken">
                            {typeof val === "number" ? val.toFixed(4) : val}
                        </p>
                    </div>
                ))}
            </div>

            {/* 特征系数（影响权重） */}
            <div>
                <p className="mb-2 text-xs text-silver">特征影响权重</p>
                <div className="space-y-1.5">
                    {Object.entries(info.coefficients)
                        .sort((a, b) => Math.abs(b[1]) - Math.abs(a[1]))
                        .map(([key, val]) => (
                            <div key={key} className="flex items-center gap-2 text-sm">
                                <span className="w-24 text-coolgray">
                                    {featureNames[key] || key}
                                </span>
                                <div className="h-3 flex-1 rounded-full bg-line/60">
                                    <div
                                        className={`h-3 rounded-full ${val >= 0 ? "bg-success" : "bg-danger"
                                            }`}
                                        style={{
                                            width: `${Math.min(
                                                Math.abs(val) /
                                                Math.max(
                                                    ...Object.values(info.coefficients).map(
                                                        (v) => Math.abs(v)
                                                    )
                                                ) *
                                                100,
                                                100
                                            )}%`,
                                        }}
                                    />
                                </div>
                                <span
                                    className={`w-20 text-right font-mono text-xs ${val >= 0 ? "text-success" : "text-danger"
                                        }`}
                                >
                                    {val >= 0 ? "+" : ""}
                                    {val.toFixed(2)}
                                </span>
                            </div>
                        ))}
                </div>
            </div>
        </div>
    );
}
