"use client";

/**
 * 数据导出页 — CSV / PDF 下载。
 *
 * 功能：
 * - CSV 导出：点击直接下载（调用 App2 /export/csv）
 * - PDF 导出：界面入口（具体实现在 Step 9 可选完善）
 */

import { useState } from "react";
import { app2Api } from "@/lib/api";

export default function ExportPage() {
    const [isExporting, setIsExporting] = useState(false);
    const [message, setMessage] = useState<string | null>(null);

    /** CSV 导出 */
    const handleCsvExport = async () => {
        setIsExporting(true);
        setMessage(null);
        try {
            const res = await fetch(app2Api.exportCsvUrl());
            if (!res.ok) {
                // 尝试解析服务端 JSON 错误详情
                const errBody = await res.json().catch(() => ({}));
                throw new Error(errBody.message || errBody.detail || `导出失败 (${res.status})`);
            }
            const blob = await res.blob();
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = "housing-market-analysis.csv";
            a.click();
            URL.revokeObjectURL(url);
            setMessage("CSV 导出成功！");
        } catch (err) {
            setMessage(err instanceof Error ? err.message : "CSV 导出失败");
        } finally {
            setIsExporting(false);
        }
    };

    return (
        <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
            <h2 className="mb-6 text-2xl font-bold text-gray-900 dark:text-white">
                数据导出
            </h2>

            <div className="grid gap-6 sm:grid-cols-2">
                {/* CSV 导出卡片 */}
                <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900">
                    <div className="mb-4 inline-flex rounded-lg bg-green-100 p-2 dark:bg-green-900/40">
                        <svg
                            className="h-6 w-6 text-green-600 dark:text-green-400"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                            />
                        </svg>
                    </div>
                    <h3 className="mb-2 text-lg font-semibold text-gray-900 dark:text-white">
                        CSV 格式导出
                    </h3>
                    <p className="mb-4 text-sm text-gray-600 dark:text-gray-400">
                        导出完整数据集（含原始价格和模型预测价格），可在 Excel 中打开。
                    </p>
                    <button
                        onClick={handleCsvExport}
                        disabled={isExporting}
                        className="rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-green-700 disabled:opacity-50"
                    >
                        {isExporting ? "导出中..." : "下载 CSV"}
                    </button>
                </div>

                {/* PDF 导出卡片 */}
                <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900">
                    <div className="mb-4 inline-flex rounded-lg bg-red-100 p-2 dark:bg-red-900/40">
                        <svg
                            className="h-6 w-6 text-red-600 dark:text-red-400"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"
                            />
                        </svg>
                    </div>
                    <h3 className="mb-2 text-lg font-semibold text-gray-900 dark:text-white">
                        PDF 报告导出
                    </h3>
                    <p className="mb-4 text-sm text-gray-600 dark:text-gray-400">
                        生成包含仪表盘摘要的 PDF 报告（需额外前端库支持，可面试时展示思路）。
                    </p>
                    <button
                        disabled
                        className="cursor-not-allowed rounded-lg bg-gray-300 px-4 py-2 text-sm font-medium text-gray-500 dark:bg-gray-700 dark:text-gray-400"
                        title="PDF 导出需安装 html2canvas + jsPDF，可在 docker 环境中完善"
                    >
                        即将推出
                    </button>
                </div>
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
