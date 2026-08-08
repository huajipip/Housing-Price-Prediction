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
    useScatter,
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
        <div className="flex flex-wrap gap-3 rounded-xl border border-line bg-surface p-4">
            <div>
                <label htmlFor="f-min-bedrooms" className="mb-1 block text-sm text-silver">最少卧室数</label>
                <select
                    id="f-min-bedrooms"
                    value={filters.minBedrooms || ""}
                    onChange={(e) => onFilterChange("minBedrooms", e.target.value)}
                    className="rounded border border-line bg-input px-2 py-1 text-sm"
                >
                    <option value="">不限</option>
                    {[1, 2, 3, 4].map((v) => (
                        <option key={v} value={v}>{v} 间</option>
                    ))}
                </select>
            </div>
            <div>
                <label htmlFor="f-max-bedrooms" className="mb-1 block text-sm text-silver">最多卧室数</label>
                <select
                    id="f-max-bedrooms"
                    value={filters.maxBedrooms || ""}
                    onChange={(e) => onFilterChange("maxBedrooms", e.target.value)}
                    className="rounded border border-line bg-input px-2 py-1 text-sm"
                >
                    <option value="">不限</option>
                    {[2, 3, 4, 5].map((v) => (
                        <option key={v} value={v}>{v} 间</option>
                    ))}
                </select>
            </div>
            <div>
                <label htmlFor="f-min-year" className="mb-1 block text-sm text-silver">最早建造年</label>
                <select
                    id="f-min-year"
                    value={filters.minYearBuilt || ""}
                    onChange={(e) => onFilterChange("minYearBuilt", e.target.value)}
                    className="rounded border border-line bg-input px-2 py-1 text-sm"
                >
                    <option value="">不限</option>
                    {[1980, 1990, 2000, 2010].map((v) => (
                        <option key={v} value={v}>{v}</option>
                    ))}
                </select>
            </div>
            <div>
                <label htmlFor="f-max-year" className="mb-1 block text-sm text-silver">最晚建造年</label>
                <select
                    id="f-max-year"
                    value={filters.maxYearBuilt || ""}
                    onChange={(e) => onFilterChange("maxYearBuilt", e.target.value)}
                    className="rounded border border-line bg-input px-2 py-1 text-sm"
                >
                    <option value="">不限</option>
                    {[1990, 2000, 2010, 2020].map((v) => (
                        <option key={v} value={v}>{v}</option>
                    ))}
                </select>
            </div>
            <div>
                <label htmlFor="f-min-school" className="mb-1 block text-sm text-silver">最低学校评分</label>
                <select
                    id="f-min-school"
                    value={filters.minSchoolRating || ""}
                    onChange={(e) => onFilterChange("minSchoolRating", e.target.value)}
                    className="rounded border border-line bg-input px-2 py-1 text-sm"
                >
                    <option value="">不限</option>
                    {[6, 7, 8, 9].map((v) => (
                        <option key={v} value={v}>{v} 分</option>
                    ))}
                </select>
            </div>
            <div>
                <label htmlFor="f-max-school" className="mb-1 block text-sm text-silver">最高学校评分</label>
                <select
                    id="f-max-school"
                    value={filters.maxSchoolRating || ""}
                    onChange={(e) => onFilterChange("maxSchoolRating", e.target.value)}
                    className="rounded border border-line bg-input px-2 py-1 text-sm"
                >
                    <option value="">不限</option>
                    {[7, 8, 9, 10].map((v) => (
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
        <div className="rounded-xl border border-line bg-surface p-4 shadow-subtle">
            <p className="text-sm text-silver">{label}</p>
            <p className="mt-1 text-2xl font-bold text-ink">
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

    // 从 URL 读取筛选参数（min/max 全部支持）
    const [filters, setFilters] = useState<Record<string, string>>({
        minBedrooms: searchParams.get("minBedrooms") || "",
        maxBedrooms: searchParams.get("maxBedrooms") || "",
        minYearBuilt: searchParams.get("minYearBuilt") || "",
        maxYearBuilt: searchParams.get("maxYearBuilt") || "",
        minSchoolRating: searchParams.get("minSchoolRating") || "",
        maxSchoolRating: searchParams.get("maxSchoolRating") || "",
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
    // 散点图数据：需求要求 square_footage 与 distance_to_city_center 两个维度
    const { data: scatterSqft } = useScatter("square_footage");
    const { data: scatterDistance } = useScatter("distance_to_city_center");

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
                <h2 className="mb-6 text-3xl font-bold text-ink">
                    市场分析仪表盘
                </h2>
                <div className="rounded-xl border border-dashed border-line bg-surface-subtle p-12 text-center">
                    <p className="text-coolgray">暂无匹配的数据，请调整筛选条件。</p>
                </div>
            </div>
        );
    }

    return (
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
            <h2 className="mb-6 text-3xl font-bold text-ink">
                市场分析仪表盘
            </h2>

            {/* 筛选器 */}
            <div className="mb-6">
                <FilterBar filters={filters} onFilterChange={updateFilter} />
            </div>

            {/* 统计卡片 — 需求要求 4 张：平均 / 中位数 / 总条数 / 最高最低 */}
            <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <StatCard label="平均房价" value={stats.meanPrice} />
                <StatCard label="中位数房价" value={stats.medianPrice} />
                <StatCard label="数据集总条数" value={stats.totalRecords} format="number" />
                <StatCard label="最低 / 最高" value={`$${stats.minPrice.toLocaleString("en-US")} - $${stats.maxPrice.toLocaleString("en-US")}`} format="text" />
            </div>

            {/* 图表区 */}
            <div className="grid gap-6 lg:grid-cols-2">
                {/* 价格分布直方图 */}
                {distribution && (
                    <div className="rounded-xl border border-line bg-surface p-6">
                        <h3 className="mb-4 text-sm font-medium text-ink">
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
                                <Bar dataKey="count" fill="#7132f5" radius={[6, 6, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                )}

                {/* 相关性散点图：sqft vs price */}
                {scatterSqft && (
                    <div className="rounded-xl border border-line bg-surface p-6">
                        <h3 className="mb-4 text-sm font-medium text-ink">
                            居住面积 vs 房价 (散点)
                        </h3>
                        <ResponsiveContainer width="100%" height={250}>
                            <ScatterChart margin={{ top: 10, right: 20, bottom: 10, left: 0 }}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis
                                    type="number"
                                    dataKey="x"
                                    name="square_footage"
                                    label={{ value: "sq ft", position: "insideBottom", offset: -5, fontSize: 11 }}
                                    tick={{ fontSize: 11 }}
                                />
                                <YAxis
                                    type="number"
                                    dataKey="y"
                                    name="price"
                                    tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`}
                                    tick={{ fontSize: 11 }}
                                />
                                <ZAxis range={[60, 60]} />
                                <Tooltip
                                    formatter={(value, name) => {
                                        const num = typeof value === "number" ? value : Number(value);
                                        return name === "price"
                                            ? [`$${num.toLocaleString()}`, name]
                                            : [num, name];
                                    }}
                                />
                                <Scatter data={scatterSqft.points} fill="#7132f5" />
                            </ScatterChart>
                        </ResponsiveContainer>
                    </div>
                )}

                {/* 相关性散点图：distance vs price */}
                {scatterDistance && (
                    <div className="rounded-xl border border-line bg-surface p-6">
                        <h3 className="mb-4 text-sm font-medium text-ink">
                            距市中心距离 vs 房价 (散点)
                        </h3>
                        <ResponsiveContainer width="100%" height={250}>
                            <ScatterChart margin={{ top: 10, right: 20, bottom: 10, left: 0 }}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis
                                    type="number"
                                    dataKey="x"
                                    name="distance"
                                    label={{ value: "miles", position: "insideBottom", offset: -5, fontSize: 11 }}
                                    tick={{ fontSize: 11 }}
                                />
                                <YAxis
                                    type="number"
                                    dataKey="y"
                                    name="price"
                                    tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`}
                                    tick={{ fontSize: 11 }}
                                />
                                <ZAxis range={[60, 60]} />
                                <Tooltip
                                    formatter={(value, name) => {
                                        const num = typeof value === "number" ? value : Number(value);
                                        return name === "price"
                                            ? [`$${num.toLocaleString()}`, name]
                                            : [num, name];
                                    }}
                                />
                                <Scatter data={scatterDistance.points} fill="#5741d8" />
                            </ScatterChart>
                        </ResponsiveContainer>
                    </div>
                )}
            </div>

            {/* 数据表 */}
            <div className="mt-6 rounded-xl border border-line bg-surface p-6 shadow-subtle">
                <h3 className="mb-3 text-sm font-medium text-ink">
                    数据概要
                </h3>
                <div className="grid grid-cols-2 gap-3 text-sm sm:grid-cols-4">
                    <div>
                        <span className="text-silver">总记录数:</span>{" "}
                        <span className="font-semibold">{stats.totalRecords}</span>
                    </div>
                    <div>
                        <span className="text-silver">平均面积:</span>{" "}
                        <span className="font-semibold">{stats.meanSquareFootage.toFixed(0)} sq ft</span>
                    </div>
                    <div>
                        <span className="text-silver">平均建造年份:</span>{" "}
                        <span className="font-semibold">{stats.meanYearBuilt.toFixed(0)}</span>
                    </div>
                    <div>
                        <span className="text-silver">平均学校评分:</span>{" "}
                        <span className="font-semibold">{stats.meanSchoolRating.toFixed(1)}</span>
                    </div>
                    <div>
                        <span className="text-silver">价格标准差:</span>{" "}
                        <span className="font-semibold">${stats.stdDevPrice.toLocaleString("en-US")}</span>
                    </div>
                </div>
            </div>
        </div>
    );
}
