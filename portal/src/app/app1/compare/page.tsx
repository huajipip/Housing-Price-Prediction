"use client";

/**
 * 批量对比页 — 多条房源并列对比分析。
 *
 * 功能：
 * - 手动逐行添加房源
 * - CSV 文件上传解析
 * - 批量调用 App1 后端 /predict/batch
 * - 表格展示 + 柱状图对比（高亮最高/最低价）
 * - 单次上限 20 条
 */

import { useState, useCallback } from "react";
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    Cell,
} from "recharts";
import Papa from "papaparse";
import { FIELD_META } from "@/lib/constants";
import { app1Api } from "@/lib/api";
import { usePredictionHistory } from "@/hooks/usePredictionHistory";
import type { HouseFeatures } from "@/lib/types";

const MAX_ROWS = 20;

/** 空白房源模板 */
function emptyHouse(): HouseFeatures & { id: string } {
    return {
        id: crypto.randomUUID(),
        square_footage: 0,
        bedrooms: 0,
        bathrooms: 0,
        year_built: 0,
        lot_size: 0,
        distance_to_city_center: 0,
        school_rating: 0,
    };
}

export default function ComparePage() {
    const [rows, setRows] = useState<(HouseFeatures & { id: string })[]>([
        emptyHouse(),
    ]);
    const [results, setResults] = useState<
        (HouseFeatures & { predictedPrice: number; id: string })[] | null
    >(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const { addEntries } = usePredictionHistory();

    /** 更新某行的某个字段 */
    const updateRow = useCallback(
        (id: string, key: keyof HouseFeatures, value: string) => {
            setRows((prev) =>
                prev.map((r) =>
                    r.id === id ? { ...r, [key]: key === "bedrooms" || key === "year_built" ? parseInt(value) || 0 : parseFloat(value) || 0 } : r
                )
            );
        },
        []
    );

    /** 添加一行 */
    const addRow = () => {
        if (rows.length >= MAX_ROWS) return;
        setRows((prev) => [...prev, emptyHouse()]);
    };

    /** 删除一行 */
    const removeRow = (id: string) => {
        setRows((prev) => (prev.length <= 1 ? prev : prev.filter((r) => r.id !== id)));
    };

    /** 重排序：上移/下移指定行（需求要求支持重新排序） */
    const moveRow = (id: string, direction: -1 | 1) => {
        setRows((prev) => {
            const index = prev.findIndex((r) => r.id === id);
            const target = index + direction;
            if (index < 0 || target < 0 || target >= prev.length) return prev;
            const next = [...prev];
            [next[index], next[target]] = [next[target], next[index]];
            return next;
        });
    };

    /** CSV 文件上传 */
    const handleCsvUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        Papa.parse<Record<string, string>>(file, {
            header: true,
            skipEmptyLines: true,
            complete: (result) => {
                const parsed: (HouseFeatures & { id: string })[] = [];
                for (const row of result.data) {
                    if (parsed.length >= MAX_ROWS) break;
                    parsed.push({
                        id: crypto.randomUUID(),
                        square_footage: parseFloat(row.square_footage) || 0,
                        bedrooms: parseInt(row.bedrooms) || 0,
                        bathrooms: parseFloat(row.bathrooms) || 0,
                        year_built: parseInt(row.year_built) || 0,
                        lot_size: parseFloat(row.lot_size) || 0,
                        distance_to_city_center: parseFloat(row.distance_to_city_center) || 0,
                        school_rating: parseFloat(row.school_rating) || 0,
                    });
                }
                if (parsed.length > 0) setRows(parsed);
                setResults(null);
            },
        });
    };

    /** 提交批量预测 */
    const handlePredict = async () => {
        // 客户端校验：给出友好提示，避免直接抛 422 原始错误
        if (rows.length === 0) {
            setError("请先添加至少一行房源数据，再进行批量预测。");
            return;
        }
        // 检查是否有未填写的必填字段（空模板用 0 表示未填）
        const incompleteRows: number[] = [];
        rows.forEach((r, idx) => {
            if (
                !r.square_footage || !r.bedrooms || !r.bathrooms ||
                !r.year_built || !r.lot_size
            ) {
                incompleteRows.push(idx + 1);
            }
        });
        if (incompleteRows.length > 0) {
            setError(
                `第 ${incompleteRows.join("、")} 行房源信息不完整，请填写全部特征` +
                `（居住面积、卧室、浴室、建造年份、地块面积等）后再试。`
            );
            return;
        }

        const houses = rows.map(({ id, ...rest }) => rest);
        setIsLoading(true);
        setError(null);
        try {
            const res = await app1Api.predictBatch(houses);
            setResults(
                rows.map((r, i) => ({
                    ...r,
                    predictedPrice: res.predictions[i] ?? 0,
                }))
            );
            // 批量预测结果存入历史记录
            addEntries(houses, res.predictions);
        } catch (err) {
            setError(err instanceof Error ? err.message : "预测失败");
        } finally {
            setIsLoading(false);
        }
    };

    /** 重置全部 */
    const resetAll = () => {
        setRows([emptyHouse()]);
        setResults(null);
        setError(null);
    };

    // 找出最高/最低价
    const maxPrice = results ? Math.max(...results.map((r) => r.predictedPrice)) : 0;
    const minPrice = results ? Math.min(...results.map((r) => r.predictedPrice)) : 0;

    return (
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
            <h2 className="mb-6 text-2xl font-bold text-gray-900 dark:text-white">
                批量房源对比
            </h2>

            {/* 操作栏 */}
            <div className="mb-4 flex flex-wrap items-center gap-3">
                <button
                    onClick={addRow}
                    disabled={rows.length >= MAX_ROWS}
                    className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-800"
                >
                    + 添加行 ({rows.length}/{MAX_ROWS})
                </button>
                <label className="cursor-pointer rounded-lg border border-gray-300 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-800">
                    📄 上传 CSV
                    <input
                        type="file"
                        accept=".csv"
                        onChange={handleCsvUpload}
                        className="hidden"
                    />
                </label>
                <button
                    onClick={handlePredict}
                    disabled={isLoading}
                    className="rounded-[12px] bg-kraken px-4 py-1.5 text-sm font-medium text-white hover:bg-kraken-deep disabled:opacity-50"
                >
                    {isLoading ? "预测中..." : "批量预测"}
                </button>
                <button
                    onClick={resetAll}
                    className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm font-medium text-red-600 hover:bg-red-50 dark:border-gray-600 dark:text-red-400 dark:hover:bg-red-950"
                >
                    重置全部
                </button>
            </div>

            {/* 表格 */}
            <div className="overflow-x-auto rounded-xl border border-gray-200 dark:border-gray-800">
                <table className="w-full text-sm">
                    <thead className="bg-gray-50 text-gray-700 dark:bg-gray-800 dark:text-gray-300">
                        <tr>
                            <th className="px-3 py-2 text-left">#</th>
                            {Object.values(FIELD_META).map((f) => (
                                <th key={f.key} className="px-3 py-2 text-left">
                                    {f.label}
                                </th>
                            ))}
                            {results && (
                                <th className="px-3 py-2 text-left font-semibold text-green-700">
                                    预测价格
                                </th>
                            )}
                            <th className="px-3 py-2"></th>
                        </tr>
                    </thead>
                    <tbody>
                        {rows.map((row, i) => (
                            <tr
                                key={row.id}
                                className="border-t border-gray-100 dark:border-gray-800"
                            >
                                <td className="px-3 py-2 text-gray-500">{i + 1}</td>
                                {Object.values(FIELD_META).map((f) => (
                                    <td key={f.key} className="px-3 py-2">
                                        <input
                                            type="number"
                                            step={f.step}
                                            min={f.min}
                                            max={f.max}
                                            value={row[f.key] || ""}
                                            onChange={(e) => updateRow(row.id, f.key, e.target.value)}
                                            className="w-24 rounded border border-gray-200 px-2 py-1 text-xs dark:border-gray-700 dark:bg-gray-800"
                                        />
                                    </td>
                                ))}
                                {results && (
                                    <td
                                        className={`px-3 py-2 font-semibold ${results[i].predictedPrice === maxPrice
                                            ? "text-green-600 dark:text-green-400"
                                            : results[i].predictedPrice === minPrice
                                                ? "text-red-600 dark:text-red-400"
                                                : "text-gray-700 dark:text-gray-300"
                                            }`}
                                    >
                                        $
                                        {results[i].predictedPrice.toLocaleString("en-US", {
                                            minimumFractionDigits: 2,
                                        })}
                                    </td>
                                )}
                                <td className="px-3 py-2">
                                    <div className="flex items-center gap-1.5">
                                        <button
                                            onClick={() => moveRow(row.id, -1)}
                                            disabled={i === 0}
                                            title="上移"
                                            aria-label="上移"
                                            className="rounded-md border border-gray-200 px-2 py-1 text-sm text-coolgray transition-colors hover:border-kraken hover:text-kraken disabled:cursor-not-allowed disabled:opacity-40 dark:border-gray-700 dark:text-silver dark:hover:text-kraken"
                                        >
                                            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                                            </svg>
                                        </button>
                                        <button
                                            onClick={() => moveRow(row.id, 1)}
                                            disabled={i === rows.length - 1}
                                            title="下移"
                                            aria-label="下移"
                                            className="rounded-md border border-gray-200 px-2 py-1 text-sm text-coolgray transition-colors hover:border-kraken hover:text-kraken disabled:cursor-not-allowed disabled:opacity-40 dark:border-gray-700 dark:text-silver dark:hover:text-kraken"
                                        >
                                            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                            </svg>
                                        </button>
                                        <button
                                            onClick={() => removeRow(row.id)}
                                            className="ml-1 rounded-md border border-red-200 px-2 py-1 text-xs text-red-600 transition-colors hover:bg-red-50 dark:border-red-800 dark:text-red-400 dark:hover:bg-red-950"
                                        >
                                            删除
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* 错误 */}
            {error && (
                <div className="mt-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-800 dark:bg-red-950 dark:text-red-400">
                    {error}
                </div>
            )}

            {/* 图表对比 */}
            {results && results.length > 0 && (
                <div className="mt-8 rounded-xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-gray-900">
                    <h3 className="mb-4 text-sm font-medium text-gray-700 dark:text-gray-300">
                        价格对比图
                        <span className="ml-2 text-xs text-gray-400">
                            （🟢 最高价 &nbsp; 🔴 最低价）
                        </span>
                    </h3>
                    <ResponsiveContainer width="100%" height={Math.max(250, results.length * 40)}>
                        <BarChart
                            data={results.map((r, i) => ({
                                name: `#${i + 1}`,
                                price: r.predictedPrice,
                            }))}
                            layout="vertical"
                        >
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis type="number" tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} />
                            <YAxis type="category" dataKey="name" width={40} />
                            <Tooltip
                                formatter={(value) => [
                                    `$${Number(value).toLocaleString("en-US", {
                                        minimumFractionDigits: 2,
                                    })}`,
                                    "预测价格",
                                ]}
                            />
                            <Bar dataKey="price" radius={[0, 4, 4, 0]}>
                                {results.map((r) => (
                                    <Cell
                                        key={r.id}
                                        fill={
                                            r.predictedPrice === maxPrice
                                                ? "#22c55e"
                                                : r.predictedPrice === minPrice
                                                    ? "#ef4444"
                                                    : "#7132f5"
                                        }
                                    />
                                ))}
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            )}
        </div>
    );
}
