"use client";

/**
 * What-If 分析页 — 改变单一特征观察预测价格变化。
 *
 * 功能：
 * - 7 个基准特征输入（预填数据集均值）
 * - 选择变化特征 + 滑块调整范围
 * - 300ms 防抖后自动调用 App2 /what-if（也支持手动触发）
 * - 折线图展示「特征值 vs 预测价格」
 * - "恢复默认"按钮
 */

import { useState, useCallback, useEffect, useRef, useMemo } from "react";
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    Legend,
} from "recharts";
import { FIELD_META, DEFAULT_FEATURES } from "@/lib/constants";
import { app1Api, app2Api } from "@/lib/api";
import { useMarketStats } from "@/hooks/useMarketStats";
import { useDebounce } from "@/hooks/useDebounce";
import type { HouseFeatures, FeatureStats, WhatIfResponse } from "@/lib/types";

const COLORS = ["#7132f5", "#5741d8", "#5b1ecf", "#149e61", "#9497a9"];

export default function WhatIfPage() {
    // 基准特征
    const [baseFeatures, setBaseFeatures] =
        useState<HouseFeatures>(DEFAULT_FEATURES);

    // 检查基准特征中哪些字段超出训练数据范围（FIELD_META 与 feature_stats 一致）
    // 越界的输入框立即红框标记，并在提交前拦截
    const outOfRangeFields = useMemo(() => {
        const invalid: Record<keyof HouseFeatures, boolean> = {
            square_footage: false,
            bedrooms: false,
            bathrooms: false,
            year_built: false,
            lot_size: false,
            distance_to_city_center: false,
            school_rating: false,
        };
        Object.values(FIELD_META).forEach((f) => {
            const v = baseFeatures[f.key];
            if (typeof v === "number" && (v < f.min || v > f.max)) {
                invalid[f.key] = true;
            }
        });
        return invalid;
    }, [baseFeatures]);

    // 当前变化特征
    const [varyFeature, setVaryFeature] = useState("square_footage");

    // 训练数据特征统计（从 /model-info 动态获取）
    const [featureStats, setFeatureStats] =
        useState<Record<string, FeatureStats> | null>(null);

    // 数据集聚合统计（含各特征中位数，供"恢复默认"使用）
    const { data: marketStats } = useMarketStats();

    // 页面加载时获取模型信息（含训练数据范围）
    useEffect(() => {
        app1Api.getModelInfo().then((data) => {
            const stats = data.feature_stats;
            if (stats) setFeatureStats(stats);
        }).catch(() => { /* 静默失败，使用 FIELD_META 兜底 */ });
    }, []);

    // 范围滑块值：优先用训练数据范围，兜底用 FIELD_META
    const stats = featureStats?.[varyFeature];
    const field = FIELD_META[varyFeature as keyof typeof FIELD_META];
    const [rangeMin, setRangeMin] = useState(
        stats?.min ?? field?.min ?? 0
    );
    const [rangeMax, setRangeMax] = useState(
        stats?.max ?? field?.max ?? 100
    );

    // 累积的曲线数据（支持叠加）
    const [curves, setCurves] = useState<
        { feature: string; data: { x: number;[key: string]: number }[] }[]
    >([]);

    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // 防抖后触发分析
    const debouncedMin = useDebounce(rangeMin, 300);
    const debouncedMax = useDebounce(rangeMax, 300);

    // 跳过组件首次挂载时的自动触发
    const isInitialMount = useRef(true);

    /** 执行 What-If 分析（接受 min/max 参数以支持防抖自动触发） */
    const runAnalysis = useCallback(async (min: number, max: number) => {
        // 前端校验：最小值必须小于最大值
        if (min >= max) {
            setError(`范围无效：最小值 (${min}) 必须小于最大值 (${max})`);
            return;
        }

        // 前端预校验：基准特征必须落在训练数据范围内（与后端 Bean Validation 一致）
        // 命中即提示具体字段与合法范围，不发无效请求
        const badField = Object.values(FIELD_META).find(
            (f) => baseFeatures[f.key] < f.min || baseFeatures[f.key] > f.max
        );
        if (badField) {
            setError(
                `基准参数超出合法范围：${badField.label} 应为 ` +
                `${badField.min}–${badField.max}，当前 ${baseFeatures[badField.key]}。`
            );
            return;
        }

        setIsLoading(true);
        setError(null);
        try {
            const res = await app2Api.whatIf({
                baseFeatures,
                varyFeature,
                varyMin: min,
                varyMax: max,
                steps: 20,
                step: field.step,
            });

            // 构建 Recharts 兼容的数据格式
            const chartData = res.dataPoints.map((dp) => ({
                x: dp.featureValue,
                [varyFeature]: dp.predictedPrice,
            }));

            // 替换当前特征的曲线（同一特征只保留最新一条）
            setCurves((prev) => {
                const existing = prev.findIndex((c) => c.feature === varyFeature);
                if (existing >= 0) {
                    const next = [...prev];
                    next[existing] = { feature: varyFeature, data: chartData };
                    return next;
                }
                return [...prev, { feature: varyFeature, data: chartData }];
            });
        } catch (err) {
            setError(err instanceof Error ? err.message : "分析失败");
        } finally {
            setIsLoading(false);
        }
    }, [baseFeatures, varyFeature]);

    // 用 ref 存储最新 runAnalysis，避免 varyFeature/baseFeatures 变化时
    // useEffect 用旧的 debouncedMin/Max 触发竞态请求（导致后端 500）
    const runAnalysisRef = useRef(runAnalysis);
    useEffect(() => {
        runAnalysisRef.current = runAnalysis;
    });

    // 防抖自动触发：仅当滑块防抖值变化时触发，
    // 始终通过 ref 使用最新的 runAnalysis（避免闭包过期）
    useEffect(() => {
        if (isInitialMount.current) {
            isInitialMount.current = false;
            return;
        }
        runAnalysisRef.current(debouncedMin, debouncedMax);
    }, [debouncedMin, debouncedMax]);

    /** 清除所有曲线 */
    const clearCurves = () => setCurves([]);

    /** 恢复默认值 — 需求要求重置为数据集中位数 */
    const resetDefaults = () => {
        setBaseFeatures(
            marketStats
                ? {
                    square_footage: marketStats.medianSquareFootage,
                    bedrooms: marketStats.medianBedrooms,
                    bathrooms: marketStats.medianBathrooms,
                    year_built: marketStats.medianYearBuilt,
                    lot_size: marketStats.medianLotSize,
                    distance_to_city_center: marketStats.medianDistanceToCityCenter,
                    school_rating: marketStats.medianSchoolRating,
                }
                : DEFAULT_FEATURES // stats 未加载时的兜底（均值）
        );
        setVaryFeature("square_footage");
        const sfStats = featureStats?.square_footage;
        const sf = FIELD_META.square_footage;
        setRangeMin(sfStats?.min ?? sf.min);
        setRangeMax(sfStats?.max ?? sf.max);
        setCurves([]);
        setError(null);
    };

    /** 判断当前范围是否超出训练数据范围 */
    const isExtrapolating =
        stats && (rangeMin < stats.min || rangeMax > stats.max);
    const mergedData = (() => {
        const map = new Map<number, Record<string, number>>();
        curves.forEach((curve) => {
            curve.data.forEach((d) => {
                if (!map.has(d.x)) map.set(d.x, { x: d.x });
                map.get(d.x)![curve.feature] = d[curve.feature];
            });
        });
        return Array.from(map.values()).sort((a, b) => a.x - b.x);
    })();

    /** 检测是否有数据点预测为负（模型外推失效的标志） */
    const hasNegativePrediction = curves.some((c) =>
        c.data.some((d) => {
            const val = d[c.feature];
            return typeof val === "number" && val < 0;
        })
    );

    return (
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
            <h2 className="mb-6 text-3xl font-bold text-ink">
                What-If 情景分析
            </h2>

            {/* 基准特征输入 */}
            <div className="mb-6 rounded-xl border border-line bg-surface p-6 shadow-subtle">
                <h3 className="mb-3 text-sm font-medium text-ink">
                    基准房源参数
                </h3>
                <div className="grid gap-3 sm:grid-cols-4">
                    {Object.values(FIELD_META).map((f) => (
                        <div key={f.key}>
                            <label
                                htmlFor={`whatif-${f.key}`}
                                className="mb-1 block text-sm text-silver"
                            >
                                {f.label}
                            </label>
                            <input
                                type="number"
                                id={`whatif-${f.key}`}
                                min={f.min}
                                max={f.max}
                                step={f.step}
                                value={baseFeatures[f.key]}
                                onChange={(e) =>
                                    setBaseFeatures((prev) => ({
                                        ...prev,
                                        [f.key]:
                                            f.type === "integer"
                                                ? parseInt(e.target.value) || 0
                                                : parseFloat(e.target.value) || 0,
                                    }))
                                }
                                aria-invalid={outOfRangeFields[f.key] || undefined}
                                className={`w-full rounded border px-2 py-1 text-sm ${outOfRangeFields[f.key]
                                        ? "border-danger bg-danger-soft text-danger"
                                        : "border-line bg-input"
                                    }`}
                            />
                        </div>
                    ))}
                </div>
            </div>

            {/* 变化控制 */}
            <div className="mb-6 rounded-xl border border-line bg-surface p-6 shadow-subtle">
                <h3 className="mb-3 text-sm font-medium text-ink">
                    变化分析控制
                </h3>
                <div className="flex flex-wrap items-end gap-4">
                    {/* 选择特征 */}
                    <div>
                        <label htmlFor="vary-feature" className="mb-1 block text-sm text-silver">变化特征</label>
                        <select
                            id="vary-feature"
                            value={varyFeature}
                            onChange={(e) => {
                                const newFeature = e.target.value;
                                setVaryFeature(newFeature);
                                const newStats = featureStats?.[newFeature];
                                const f = FIELD_META[newFeature as keyof typeof FIELD_META];
                                setRangeMin(newStats?.min ?? f.min);
                                setRangeMax(newStats?.max ?? f.max);
                                setCurves([]);
                            }}
                            className="rounded border border-line bg-input px-2 py-1 text-sm"
                        >
                            {Object.values(FIELD_META).map((f) => (
                                <option key={f.key} value={f.key}>
                                    {f.label}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* 最小值滑块 */}
                    <div>
                        <label htmlFor="range-min" className="mb-1 block text-sm text-silver">
                            最小值: <span className="font-medium">{rangeMin}</span>
                            {stats && (
                                <span className="ml-1 text-silver">
                                    (训练: {stats.min})
                                </span>
                            )}
                        </label>
                        <input
                            type="range"
                            id="range-min"
                            min={field.min}
                            max={field.max}
                            step={field.step}
                            value={rangeMin}
                            onChange={(e) => setRangeMin(Number(e.target.value))}
                            className="w-32"
                        />
                    </div>

                    {/* 最大值滑块 */}
                    <div>
                        <label htmlFor="range-max" className="mb-1 block text-sm text-silver">
                            最大值: <span className="font-medium">{rangeMax}</span>
                            {stats && (
                                <span className="ml-1 text-silver">
                                    (训练: {stats.max})
                                </span>
                            )}
                        </label>
                        <input
                            type="range"
                            id="range-max"
                            min={field.min}
                            max={field.max}
                            step={field.step}
                            value={rangeMax}
                            onChange={(e) => setRangeMax(Number(e.target.value))}
                            className="w-32"
                        />
                    </div>

                    {/* 按钮 */}
                    <button
                        onClick={() => runAnalysis(debouncedMin, debouncedMax)}
                        disabled={isLoading}
                        className="btn-primary disabled:opacity-50"
                    >
                        {isLoading ? "分析中..." : "运行分析"}
                    </button>
                    <button
                        onClick={clearCurves}
                        className="btn-secondary"
                    >
                        清除曲线
                    </button>
                    <button
                        onClick={resetDefaults}
                        className="btn-secondary"
                    >
                        恢复默认
                    </button>
                </div>
            </div>

            {/* 外推警告 */}
            {isExtrapolating && (
                <div className="mb-6 rounded-lg border border-warning/40 bg-warning-soft p-3 text-sm text-warning">
                    ⚠️ 当前范围超出训练数据（{field.label}: {stats?.min}–{stats?.max}）。
                    线性模型在外推时可能产生不准确的预测。
                </div>
            )}

            {/* 负价格警告 */}
            {hasNegativePrediction && (
                <div className="mb-6 rounded-lg border border-danger/40 bg-danger-soft p-3 text-sm text-danger">
                    ⚠️ 检测到负预测价格。当前模型在训练数据范围外线性外推时不可靠，
                    请将特征范围缩小到训练数据范围内。
                </div>
            )}

            {/* 错误 */}
            {error && (
                <div className="mb-6 whitespace-pre-line rounded-lg border border-danger/40 bg-danger-soft p-3 text-sm text-danger">
                    {error}
                </div>
            )}

            {/* 折线图 */}
            {mergedData.length > 0 && (
                <div className="rounded-xl border border-line bg-surface p-6">
                    <h3 className="mb-4 text-sm font-medium text-ink">
                        预测价格 vs 特征值
                    </h3>
                    <ResponsiveContainer width="100%" height={400}>
                        <LineChart data={mergedData}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis
                                dataKey="x"
                                tick={{ fontSize: 12 }}
                                label={{
                                    value: FIELD_META[varyFeature as keyof typeof FIELD_META]
                                        ?.label,
                                    position: "insideBottom",
                                    offset: -5,
                                }}
                            />
                            <YAxis
                                domain={[0, "auto"]}
                                tickFormatter={(v) =>
                                    `$${(Number(v) / 1000).toFixed(0)}k`
                                }
                            />
                            <Tooltip
                                formatter={(value) => [
                                    `$${Number(value).toLocaleString("en-US", {
                                        minimumFractionDigits: 2,
                                    })}`,
                                ]}
                                labelFormatter={(label) =>
                                    `${FIELD_META[varyFeature as keyof typeof FIELD_META]?.label
                                    }: ${label}`
                                }
                            />
                            <Legend />
                            {curves.map((curve, i) => (
                                <Line
                                    key={curve.feature}
                                    type="monotone"
                                    dataKey={curve.feature}
                                    name={FIELD_META[curve.feature as keyof typeof FIELD_META]?.label || curve.feature}
                                    stroke={COLORS[i % COLORS.length]}
                                    strokeWidth={2}
                                    dot={false}
                                />
                            ))}
                        </LineChart>
                    </ResponsiveContainer>
                </div>
            )}

            {/* 空状态 */}
            {mergedData.length === 0 && !error && (
                <div className="rounded-xl border border-dashed border-line bg-surface-subtle p-12 text-center">
                    <p className="text-coolgray">
                        调整滑块范围，点击「运行分析」查看预测价格变化曲线。
                    </p>
                </div>
            )}
        </div>
    );
}
