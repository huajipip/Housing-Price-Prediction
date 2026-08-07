"use client";

/**
 * 数据导出页 — CSV / PDF 下载。
 *
 * 功能：
 * - 导出范围选择：全部数据 / 当前筛选结果
 * - CSV 导出：下载含原始价格和预测价格的 CSV 文件
 * - PDF 报告：使用 @react-pdf/renderer 生成仪表盘摘要报告
 *
 * 设计思路：
 * - 筛选条件通过 URL query params 跨页面传递（Dashboard → Export）
 * - 后端筛选参数命名与 StatsController 一致，复用同一套 filter API
 */

import { useMemo, useState } from "react";
import dynamic from "next/dynamic";
import { app2Api } from "@/lib/api";

/**
 * PdfExportCard 依赖 @react-pdf/renderer（浏览器 API：Web Worker、Blob），
 * 必须禁用 SSR，否则 next build 时报 "Export encountered an error"。
 */
const PdfExportCard = dynamic(() => import("@/components/PdfExportCard"), {
    ssr: false,
    loading: () => (
        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900">
            <div className="h-full animate-pulse space-y-3">
                <div className="h-8 w-8 rounded-lg bg-gray-200 dark:bg-gray-700" />
                <div className="h-5 w-32 rounded bg-gray-200 dark:bg-gray-700" />
                <div className="h-4 w-48 rounded bg-gray-200 dark:bg-gray-700" />
                <div className="h-9 w-28 rounded-lg bg-gray-200 dark:bg-gray-700" />
            </div>
        </div>
    ),
});

// ============================================================
// 筛选参数类型（与后端 @RequestParam 对齐）
// ============================================================

interface FilterParams {
    minBedrooms?: string;
    maxBedrooms?: string;
    minYearBuilt?: string;
    maxYearBuilt?: string;
    minSchoolRating?: string;
    maxSchoolRating?: string;
}

type ExportRange = "all" | "filtered";

// ============================================================
// 页面组件
// ============================================================

export default function ExportPage() {
    // 导出范围
    const [range, setRange] = useState<ExportRange>("all");

    // 筛选条件（仅 range="filtered" 时生效）
    const [filters, setFilters] = useState<FilterParams>({});

    // CSV 导出状态
    const [isExporting, setIsExporting] = useState(false);
    const [message, setMessage] = useState<string | null>(null);

    /** 构建实际传给后端的筛选参数：范围=全部时不传任何参数 */
    const activeFilters = useMemo(() => {
        if (range === "all") return undefined;

        const params: Record<string, string> = {};
        for (const [k, v] of Object.entries(filters)) {
            if (v !== "" && v !== undefined) params[k] = v;
        }
        return Object.keys(params).length > 0 ? params : undefined;
    }, [range, filters]);

    /** 更新单个筛选字段 */
    const updateFilter = (key: keyof FilterParams, value: string) => {
        setFilters((prev) => ({ ...prev, [key]: value }));
    };

    /** CSV 导出 */
    const handleCsvExport = async () => {
        setIsExporting(true);
        setMessage(null);
        try {
            const url = app2Api.exportCsvUrl(activeFilters);
            const res = await fetch(url);
            if (!res.ok) throw new Error("导出失败 (HTTP " + res.status + ")");
            const blob = await res.blob();
            const objectUrl = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = objectUrl;
            a.download = range === "filtered"
                ? "housing-market-analysis-filtered.csv"
                : "housing-market-analysis.csv";
            a.click();
            URL.revokeObjectURL(objectUrl);

            const scopeText = range === "filtered" ? "筛选结果" : "全部数据";
            setMessage(`CSV 导出成功！（${scopeText}）`);
        } catch (err) {
            setMessage(err instanceof Error ? err.message : "CSV 导出失败");
        } finally {
            setIsExporting(false);
        }
    };

    // ============================================================
    // 渲染
    // ============================================================

    const filterFields: { key: keyof FilterParams; label: string; placeholder: string }[] = [
        { key: "minBedrooms", label: "卧室 ≥", placeholder: "例: 2" },
        { key: "maxBedrooms", label: "卧室 ≤", placeholder: "例: 5" },
        { key: "minYearBuilt", label: "年份 ≥", placeholder: "例: 1990" },
        { key: "maxYearBuilt", label: "年份 ≤", placeholder: "例: 2020" },
        { key: "minSchoolRating", label: "学校评分 ≥", placeholder: "例: 6.0" },
        { key: "maxSchoolRating", label: "学校评分 ≤", placeholder: "例: 9.0" },
    ];

    return (
        <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
            <h2 className="mb-6 text-2xl font-bold text-gray-900 dark:text-white">
                数据导出
            </h2>

            {/* ================================================ */}
            {/* 导出范围选择 */}
            {/* ================================================ */}
            <div className="mb-6 rounded-xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900">
                <h3 className="mb-3 text-sm font-semibold text-gray-700 dark:text-gray-300">
                    导出范围
                </h3>
                <div className="flex gap-4">
                    <label
                        className={`flex cursor-pointer items-center gap-2 rounded-lg border px-4 py-2 text-sm transition-colors ${range === "all"
                                ? "border-blue-500 bg-blue-50 text-blue-700 dark:border-blue-400 dark:bg-blue-950 dark:text-blue-300"
                                : "border-gray-300 text-gray-600 hover:border-gray-400 dark:border-gray-700 dark:text-gray-400"
                            }`}
                    >
                        <input
                            type="radio"
                            name="exportRange"
                            value="all"
                            checked={range === "all"}
                            onChange={() => setRange("all")}
                            className="sr-only"
                        />
                        全部数据
                    </label>
                    <label
                        className={`flex cursor-pointer items-center gap-2 rounded-lg border px-4 py-2 text-sm transition-colors ${range === "filtered"
                                ? "border-blue-500 bg-blue-50 text-blue-700 dark:border-blue-400 dark:bg-blue-950 dark:text-blue-300"
                                : "border-gray-300 text-gray-600 hover:border-gray-400 dark:border-gray-700 dark:text-gray-400"
                            }`}
                    >
                        <input
                            type="radio"
                            name="exportRange"
                            value="filtered"
                            checked={range === "filtered"}
                            onChange={() => setRange("filtered")}
                            className="sr-only"
                        />
                        当前筛选结果
                    </label>
                </div>

                {/* 筛选条件（仅选择"当前筛选结果"时显示） */}
                {range === "filtered" && (
                    <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
                        {filterFields.map((f) => (
                            <div key={f.key}>
                                <label className="mb-1 block text-xs font-medium text-gray-500 dark:text-gray-400">
                                    {f.label}
                                </label>
                                <input
                                    type="number"
                                    className="w-full rounded-lg border border-gray-300 px-3 py-1.5 text-sm dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                                    placeholder={f.placeholder}
                                    value={filters[f.key] || ""}
                                    onChange={(e) => updateFilter(f.key, e.target.value)}
                                />
                            </div>
                        ))}
                    </div>
                )}

                {range === "filtered" && !activeFilters && (
                    <p className="mt-3 text-xs text-amber-600 dark:text-amber-400">
                        ⚠️ 未设置任何筛选条件，将导出全部数据
                    </p>
                )}
            </div>

            {/* ================================================ */}
            {/* 导出卡片 */}
            {/* ================================================ */}
            <div className="grid gap-6 sm:grid-cols-2">
                {/* CSV 导出 */}
                <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900">
                    <div className="mb-4 inline-flex rounded-lg bg-green-100 p-2 dark:bg-green-900/40">
                        <svg className="h-6 w-6 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                    </div>
                    <h3 className="mb-2 text-lg font-semibold text-gray-900 dark:text-white">
                        CSV 格式导出
                    </h3>
                    <p className="mb-4 text-sm text-gray-600 dark:text-gray-400">
                        {range === "all"
                            ? "导出完整数据集（含原始价格和模型预测价格），可在 Excel 中打开。"
                            : "按当前筛选条件导出数据（含原始价格和模型预测价格），可在 Excel 中打开。"}
                    </p>
                    <button
                        onClick={handleCsvExport}
                        disabled={isExporting}
                        className="rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-green-700 disabled:opacity-50"
                    >
                        {isExporting ? "导出中..." : "下载 CSV"}
                    </button>
                </div>

                {/* PDF 导出 — 动态加载，禁用 SSR（@react-pdf/renderer 依赖浏览器 API） */}
                <PdfExportCard
                    activeFilters={activeFilters}
                    onMessage={setMessage}
                />
            </div>

            {/* 状态消息 */}
            {message && (
                <div
                    className={`mt-6 rounded-lg border p-4 text-sm ${message.includes("成功")
                            ? "border-green-200 bg-green-50 text-green-700 dark:border-green-800 dark:bg-green-950 dark:text-green-400"
                            : "border-red-200 bg-red-50 text-red-700 dark:border-red-800 dark:bg-red-950 dark:text-red-400"
                        }`}
                >
                    {message}
                </div>
            )}
        </div>
    );
}
