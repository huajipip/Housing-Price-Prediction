"use client";

/**
 * 交互式仪表盘 — 房产市场数据概览。
 *
 * 功能：
 * - 4 个统计概览卡片（均值/中位数/最值/标准差）
 * - 价格分布直方图
 * - 特征相关性散点图（sqft vs price）
 * - 筛选器面板（bedrooms / year_built / school_rating）
 * - 筛选参数同步到 URL searchParams
 */

import { useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    ScatterChart,
    Scatter,
    ZAxis,
} from "recharts";
import {
    useMarketStats,
    useDistribution,
    useCorrelation,
} from "@/hooks/useMarketStats";
import LoadingSkeleton from "@/components/LoadingSkeleton";
import ErrorDisplay from "@/components/ErrorDisplay";

// ---------------------------------------------------------------------------
// 筛选器组件
// ---------------------------------------------------------------------------

function FilterBar({
    filters,
    onFilterChange,
}: {
    filters: Record<string, string>;
    onFilterChange: (key: string, value: string) => void;
}) {
    return (
        <div className="flex flex-wrap gap-3 rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-900">
            <div>
                <label className="mb-1 block text-xs text-gray-500">最少卧室数</label>
                <select
                    value={filters.minBedrooms || ""}
                    onChange={(e) => onFilterChange("minBedrooms", e.target.value)}
                    className="rounded border border-gray-300 px-2 py-1 text-sm dark:border-gray-600 dark:bg-gray-800"
                >
                    <option value="">不限</option>
                    {[1, 2, 3, 4].map((v) => (
                        <option key={v} value={v}>{v} 间</option>
                    ))}
                </select>
            </div>
            <div>
                <label className="mb-1 block text-xs text-gray-500">最早建造年</label>
                <select
                    value={filters.minYearBuilt || ""}
                    onChange={(e) => onFilterChange("minYearBuilt", e.target.value)}
                    className="rounded border border-gray-300 px-2 py-1 text-sm dark:border-gray-600 dark:bg-gray-800"
                >
                    <option value="">不限</option>
                    {[1980, 1990, 2000, 2010].map((v) => (
                        <option key={v} value={v}>{v}</option>
                    ))}
                </select>
            </div>
            <div>
                <label className="mb-1 block text-xs text-gray-500">最低学校评分</label>
                <select
                    value={filters.minSchoolRating || ""}
                    onChange={(e) => onFilterChange("minSchoolRating", e.target.value)}
                    className="rounded border border-gray-300 px-2 py-1 text-sm dark:border-gray-600 dark:bg-gray-800"
                >
                    <option value="">不限</option>
                    {[6, 7, 8, 9].map((v) => (
                        <option key={v} value={v}>{v} 分</option>
                    ))}
                </select>
            </div>
        </div>
    );
}

// ---------------------------------------------------------------------------
// 统计卡片
// ---------------------------------------------------------------------------

function StatCard({
    label,
    value,
    format = "money",
}: {
    label: string;
    value: number | string;
    format?: "money" | "number" | "text";
}) {
    const formatted =
        format === "money"
            ? `$${Number(value).toLocaleString("en-US")}`
            : format === "number"
                ? Number(value).toLocaleString("en-US")
                : value;

    return (
        <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-800 dark:bg-gray-900">
            <p className="text-xs text-gray-500">{label}</p>
            <p className="mt-1 text-2xl font-bold text-gray-900 dark:text-white">
                {formatted}
            </p>
        </div>
    );
}

// ---------------------------------------------------------------------------
// 主页面
// ---------------------------------------------------------------------------

export default function DashboardPage() {
    const searchParams = useSearchParams();
    const router = useRouter();

    // 从 URL 读取筛选参数
    const [filters, setFilters] = useState<Record<string, string>>({
        minBedrooms: searchParams.get("minBedrooms") || "",
        minYearBuilt: searchParams.get("minYearBuilt") || "",
        minSchoolRating: searchParams.get("minSchoolRating") || "",
    });

    const updateFilter = (key: string, value: string) => {
        const next = { ...filters, [key]: value };
        setFilters(next);

        // 同步到 URL
        const params = new URLSearchParams();
        Object.entries(next).forEach(([k, v]) => {
            if (v) params.set(k, v);
        });
        router.replace(`/app2/dashboard?${params.toString()}`, { scroll: false });
    };

    // 数据获取
    const filterParams: Record<string, string> = {};
    Object.entries(filters).forEach(([k, v]) => {
        if (v) filterParams[k] = v;
    });

    const {
        data: stats,
        error: statsError,
        isLoading: statsLoading,
    } = useMarketStats(filterParams);
    const { data: distribution } = useDistribution(filterParams);
    const { data: correlation } = useCorrelation();

    if (statsLoading) return <LoadingSkeleton rows={8} />;
    if (statsError)
        return (
            <ErrorDisplay
                error={statsError}
                title="加载统计数据失败"
            />
        );
    if (!stats || stats.totalRecords === 0) {
        return (
            <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
                <h2 className="mb-6 text-2xl font-bold text-gray-900 dark:text-white">
                    市场分析仪表盘
                </h2>
                <div className="rounded-xl border border-dashed border-gray-300 bg-gray-50 p-12 text-center dark:border-gray-700 dark:bg-gray-900">
                    <p className="text-gray-500">暂无匹配的数据，请调整筛选条件。</p>
                </div>
            </div>
        );
    }

    return (
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
            <h2 className="mb-6 text-2xl font-bold text-gray-900 dark:text-white">
                市场分析仪表盘
            </h2>

            {/* 筛选器 */}
            <div className="mb-6">
                <FilterBar filters={filters} onFilterChange={updateFilter} />
            </div>

            {/* 统计卡片 */}
            <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <StatCard label="平均房价" value={stats.meanPrice} />
                <StatCard label="中位数房价" value={stats.medianPrice} />
                <StatCard label="最低 / 最高" value={`$${stats.minPrice.toLocaleString("en-US")} - $${stats.maxPrice.toLocaleString("en-US")}`} format="text" />
                <StatCard label="标准差" value={stats.stdDevPrice} format="money" />
            </div>

            {/* 图表区 */}
            <div className="grid gap-6 lg:grid-cols-2">
                {/* 价格分布直方图 */}
                {distribution && (
                    <div className="rounded-xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-gray-900">
                        <h3 className="mb-4 text-sm font-medium text-gray-700 dark:text-gray-300">
                            价格分布
                        </h3>
                        <ResponsiveContainer width="100%" height={250}>
                            <BarChart
                                data={distribution.buckets.map((b, i) => ({
                                    bucket: b,
                                    count: distribution.counts[i],
                                }))}
                            >
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="bucket" tick={{ fontSize: 11 }} />
                                <YAxis />
                                <Tooltip />
                                <Bar dataKey="count" fill="#3b82f6" radius={[6, 6, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                )}

                {/* 相关性散点图：sqft vs price */}
                {correlation && (
                    <div className="rounded-xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-gray-900">
                        <h3 className="mb-4 text-sm font-medium text-gray-700 dark:text-gray-300">
                            特征相关性 (Pearson)
                        </h3>
                        <div className="space-y-2">
                            {Object.entries(correlation.correlations).map(([key, val]) => (
                                <div key={key} className="flex items-center gap-2">
                                    <span className="w-40 text-xs text-gray-600 dark:text-gray-400">
                                        {key.replace(/_/g, " ")}
                                    </span>
                                    <div className="h-4 flex-1 rounded-full bg-gray-200 dark:bg-gray-700">
                                        <div
                                            className="h-4 rounded-full bg-blue-500"
                                            style={{ width: `${Math.abs(val) * 100}%` }}
                                        />
                                    </div>
                                    <span className="w-12 text-right text-xs font-medium text-gray-700 dark:text-gray-300">
                                        {val.toFixed(3)}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            {/* 数据表 */}
            <div className="mt-6 rounded-xl border border-gray-200 p-6 dark:border-gray-800 dark:bg-gray-900">
                <h3 className="mb-3 text-sm font-medium text-gray-700 dark:text-gray-300">
                    数据概要
                </h3>
                <div className="grid grid-cols-2 gap-3 text-sm sm:grid-cols-4">
                    <div>
                        <span className="text-gray-500">总记录数:</span>{" "}
                        <span className="font-semibold">{stats.totalRecords}</span>
                    </div>
                    <div>
                        <span className="text-gray-500">平均面积:</span>{" "}
                        <span className="font-semibold">{stats.meanSquareFootage.toFixed(0)} sq ft</span>
                    </div>
                    <div>
                        <span className="text-gray-500">平均建造年份:</span>{" "}
                        <span className="font-semibold">{stats.meanYearBuilt.toFixed(0)}</span>
                    </div>
                    <div>
                        <span className="text-gray-500">平均学校评分:</span>{" "}
                        <span className="font-semibold">{stats.meanSchoolRating.toFixed(1)}</span>
                    </div>
                </div>
            </div>
        </div>
    );
}
