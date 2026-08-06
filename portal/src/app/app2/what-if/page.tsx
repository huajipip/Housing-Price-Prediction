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

import { useState, useCallback, useEffect, useRef } from "react";
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
import { useDebounce } from "@/hooks/useDebounce";
import type { HouseFeatures, FeatureStats, WhatIfResponse } from "@/lib/types";

const COLORS = ["#3b82f6", "#ef4444", "#22c55e", "#f59e0b", "#8b5cf6"];

export default function WhatIfPage() {
    // 基准特征
    const [baseFeatures, setBaseFeatures] =
        useState<HouseFeatures>(DEFAULT_FEATURES);

    // 当前变化特征
    const [varyFeature, setVaryFeature] = useState("square_footage");

    // 训练数据特征统计（从 /model-info 动态获取）
    const [featureStats, setFeatureStats] =
        useState<Record<string, FeatureStats> | null>(null);

    // 页面加载时获取模型信息（含训练数据范围）
    useEffect(() => {
        app1Api.getModelInfo().then((data) => {
            const stats = (data as Record<string, unknown>).feature_stats;
            if (stats) setFeatureStats(stats as Record<string, FeatureStats>);
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

    /** 恢复默认值 */
    const resetDefaults = () => {
        setBaseFeatures(DEFAULT_FEATURES);
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
            <h2 className="mb-6 text-2xl font-bold text-gray-900 dark:text-white">
                What-If 情景分析
            </h2>

            {/* 基准特征输入 */}
            <div className="mb-6 rounded-xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-gray-900">
                <h3 className="mb-3 text-sm font-medium text-gray-700 dark:text-gray-300">
                    基准房源参数
                </h3>
                <div className="grid gap-3 sm:grid-cols-4">
                    {Object.values(FIELD_META).map((f) => (
                        <div key={f.key}>
                            <label className="mb-1 block text-xs text-gray-500">
                                {f.label}
                            </label>
                            <input
                                type="number"
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
                                className="w-full rounded border border-gray-300 px-2 py-1 text-sm dark:border-gray-600 dark:bg-gray-800"
                            />
                        </div>
                    ))}
                </div>
            </div>

            {/* 变化控制 */}
            <div className="mb-6 rounded-xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-gray-900">
                <h3 className="mb-3 text-sm font-medium text-gray-700 dark:text-gray-300">
                    变化分析控制
                </h3>
                <div className="flex flex-wrap items-end gap-4">
                    {/* 选择特征 */}
                    <div>
                        <label className="mb-1 block text-xs text-gray-500">变化特征</label>
                        <select
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
                            className="rounded border border-gray-300 px-2 py-1 text-sm dark:border-gray-600 dark:bg-gray-800"
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
                        <label className="mb-1 block text-xs text-gray-500">
                            最小值: <span className="font-medium">{rangeMin}</span>
                            {stats && (
                                <span className="ml-1 text-gray-400">
                                    (训练: {stats.min})
                                </span>
                            )}
                        </label>
                        <input
                            type="range"
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
                        <label className="mb-1 block text-xs text-gray-500">
                            最大值: <span className="font-medium">{rangeMax}</span>
                            {stats && (
                                <span className="ml-1 text-gray-400">
                                    (训练: {stats.max})
                                </span>
                            )}
                        </label>
                        <input
                            type="range"
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
                        className="rounded-lg bg-amber-600 px-4 py-1.5 text-sm font-medium text-white hover:bg-amber-700 disabled:opacity-50"
                    >
                        {isLoading ? "分析中..." : "运行分析"}
                    </button>
                    <button
                        onClick={clearCurves}
                        className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-800"
                    >
                        清除曲线
                    </button>
                    <button
                        onClick={resetDefaults}
                        className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-800"
                    >
                        恢复默认
                    </button>
                </div>
            </div>

            {/* 外推警告 */}
            {isExtrapolating && (
                <div className="mb-6 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-700 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-400">
                    ⚠️ 当前范围超出训练数据（{field.label}: {stats?.min}–{stats?.max}）。
                    线性模型在外推时可能产生不准确的预测。
                </div>
            )}

            {/* 负价格警告 */}
            {hasNegativePrediction && (
                <div className="mb-6 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-800 dark:bg-red-950 dark:text-red-400">
                    ⚠️ 检测到负预测价格。当前模型在训练数据范围外线性外推时不可靠，
                    请将特征范围缩小到训练数据范围内。
                </div>
            )}

            {/* 错误 */}
            {error && (
                <div className="mb-6 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-800 dark:bg-red-950 dark:text-red-400">
                    {error}
                </div>
            )}

            {/* 折线图 */}
            {mergedData.length > 0 && (
                <div className="rounded-xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-gray-900">
                    <h3 className="mb-4 text-sm font-medium text-gray-700 dark:text-gray-300">
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
                <div className="rounded-xl border border-dashed border-gray-300 bg-gray-50 p-12 text-center dark:border-gray-700 dark:bg-gray-900">
                    <p className="text-gray-500 dark:text-gray-400">
                        调整滑块范围，点击「运行分析」查看预测价格变化曲线。
                    </p>
                </div>
            )}
        </div>
    );
}
