"use client";

/**
 * What-If 分析页 — 改变单一特征观察预测价格变化。
 *
 * 功能：
 * - 7 个基准特征输入（预填数据集均值）
 * - 选择变化特征 + 滑块调整范围
 * - 300ms 防抖后批量调用 App2 /what-if
 * - 折线图展示「特征值 vs 预测价格」
 * - 支持叠加多条曲线（多特征对比）
 * - "恢复默认"按钮
 */

import { useState, useCallback } from "react";
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
import { app2Api } from "@/lib/api";
import { useDebounce } from "@/hooks/useDebounce";
import type { HouseFeatures, WhatIfResponse } from "@/lib/types";

const COLORS = ["#3b82f6", "#ef4444", "#22c55e", "#f59e0b", "#8b5cf6"];

export default function WhatIfPage() {
    // 基准特征
    const [baseFeatures, setBaseFeatures] =
        useState<HouseFeatures>(DEFAULT_FEATURES);

    // 当前变化特征
    const [varyFeature, setVaryFeature] = useState("square_footage");

    // 范围滑块值
    const field = FIELD_META[varyFeature as keyof typeof FIELD_META];
    const [rangeMin, setRangeMin] = useState(field?.min ?? 500);
    const [rangeMax, setRangeMax] = useState(field?.max ?? 3000);

    // 累积的曲线数据（支持叠加）
    const [curves, setCurves] = useState<
        { feature: string; data: { x: number;[key: string]: number }[] }[]
    >([]);

    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // 防抖后触发分析
    const debouncedMin = useDebounce(rangeMin, 300);
    const debouncedMax = useDebounce(rangeMax, 300);

    /** 执行 What-If 分析 */
    const runAnalysis = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        try {
            const res = await app2Api.whatIf({
                baseFeatures,
                varyFeature,
                varyMin: rangeMin,
                varyMax: rangeMax,
                steps: 20,
            });

            // 构建 Recharts 兼容的数据格式
            const chartData = res.dataPoints.map((dp) => ({
                x: dp.featureValue,
                [varyFeature]: dp.predictedPrice,
            }));

            // 更新或添加曲线
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
    }, [baseFeatures, varyFeature, rangeMin, rangeMax]);

    /** 清除所有曲线 */
    const clearCurves = () => setCurves([]);

    /** 恢复默认值 */
    const resetDefaults = () => {
        setBaseFeatures(DEFAULT_FEATURES);
        setVaryFeature("square_footage");
        const sf = FIELD_META.square_footage;
        setRangeMin(sf.min);
        setRangeMax(sf.max);
        setCurves([]);
        setError(null);
    };

    /** 合并所有曲线数据（按 x 值对齐） */
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
                                setVaryFeature(e.target.value);
                                const f =
                                    FIELD_META[e.target.value as keyof typeof FIELD_META];
                                setRangeMin(f.min);
                                setRangeMax(f.max);
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
                        onClick={runAnalysis}
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
