"use client";

/**
 * PdfExportCard — PDF 报告导出卡片（仅客户端渲染）。
 *
 * 使用 @react-pdf/renderer 的 pdf() 命令式 API（非 usePDF hook），
 * 在用户点击时一步完成：加载数据 → 生成 PDF blob → 触发浏览器下载。
 *
 * 必须通过 next/dynamic 以 ssr:false 方式导入，因为 @react-pdf/renderer
 * 依赖浏览器 API（Web Worker、Blob、URL.createObjectURL）。
 */

import { useState } from "react";
import { pdf } from "@react-pdf/renderer";
import { app2Api } from "@/lib/api";
import { DashboardReport, type ReportData } from "@/components/DashboardReport";

interface PdfExportCardProps {
    /** 当前生效的筛选参数（全部模式时为 undefined） */
    activeFilters: Record<string, string> | undefined;
    /** 父组件消息回调 */
    onMessage: (msg: string) => void;
}

export default function PdfExportCard({ activeFilters, onMessage }: PdfExportCardProps) {
    const [isGenerating, setIsGenerating] = useState(false);

    /**
     * 一步完成：加载数据 → pdf() 生成 PDF → 触发下载。
     *
     * 使用 pdf() 命令式 API 而非 usePDF hook，原因：
     * 1. usePDF 基于 React 渲染周期，当 document prop 从 undefined
     *    切换到有效元素时可能不触发重新渲染
     * 2. pdf() 是纯函数调用，不依赖 hook 生命周期，更可控
     */
    const handleGenerateAndDownload = async () => {
        setIsGenerating(true);
        onMessage("");

        try {
            // 1. 从后端加载数据
            const filterParams = activeFilters ?? undefined;
            const [stats, distribution] = await Promise.all([
                app2Api.getStats(filterParams),
                app2Api.getDistribution(filterParams),
            ]);

            const reportData: ReportData = {
                stats: {
                    "数据条数": stats.totalRecords,
                    "平均房价": Math.round(stats.meanPrice),
                    "中位数房价": Math.round(stats.medianPrice),
                    "最低房价": Math.round(stats.minPrice),
                    "最高房价": Math.round(stats.maxPrice),
                    "价格标准差": Math.round(stats.stdDevPrice),
                },
                distribution: {
                    buckets: distribution.buckets,
                    counts: distribution.counts,
                },
            };

            // 2. 使用 pdf() 命令式 API 生成 PDF blob
            const blob = await pdf(<DashboardReport data={reportData} />).toBlob();

            // 3. 触发浏览器下载
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = "housing-market-report.pdf";
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);

            onMessage("PDF 报告下载成功！");
        } catch (err) {
            const msg = err instanceof Error ? err.message : "未知错误";
            onMessage(`PDF 生成失败：${msg}`);
        } finally {
            setIsGenerating(false);
        }
    };

    return (
        <div className="card p-6">
            <div className="mb-4 inline-flex rounded-lg bg-kraken-soft p-2">
                <svg className="h-6 w-6 text-kraken" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                </svg>
            </div>
            <h3 className="mb-2 text-lg font-semibold text-ink dark:text-white">
                PDF 报告导出
            </h3>
            <p className="mb-4 text-sm text-coolgray dark:text-silver">
                生成包含仪表盘摘要的 PDF 报告（统计概览 + 价格分布）。点击按钮后会自动下载。
            </p>

            <button
                onClick={handleGenerateAndDownload}
                disabled={isGenerating}
                className="btn-kraken px-4 py-2 text-sm font-medium text-white"
            >
                {isGenerating ? "正在生成 PDF..." : "下载 PDF 报告"}
            </button>
        </div>
    );
}
