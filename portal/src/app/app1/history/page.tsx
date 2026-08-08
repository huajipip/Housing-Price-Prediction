"use client";

/**
 * 历史记录页 — 查看和管理之前的预测记录。
 *
 * 功能：
 * - 表格列表（按时间倒序）
 * - 显示输入特征摘要 + 预测价格 + 时间戳
 * - 支持单条删除、全部清空
 * - 点击某条记录可复制参数
 */

import { usePredictionHistory } from "@/hooks/usePredictionHistory";
import { FIELD_META } from "@/lib/constants";
import { useRouter } from "next/navigation";
import type { HistoryEntry, HouseFeatures } from "@/lib/types";

export default function HistoryPage() {
    const { history, removeEntry, removeBatch, clearAll } = usePredictionHistory();
    const router = useRouter();

    /** 点击某条记录 → 回填到估值预测表单（需求要求） */
    const refillToEstimate = (features: HouseFeatures) => {
        router.push(
            `/app1/estimate?prefill=${encodeURIComponent(JSON.stringify(features))}`
        );
    };

    if (history.length === 0) {
        return (
            <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
                <h2 className="mb-6 text-3xl font-bold text-ink">
                    预测历史记录
                </h2>
                <div className="rounded-xl border border-dashed border-line bg-surface-subtle p-12 text-center">
                    <p className="text-coolgray">
                        暂无历史估值记录。去「估值预测」页面开始您的第一次预测吧。
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
            <div className="mb-6 flex items-center justify-between">
                <h2 className="text-3xl font-bold text-ink">
                    预测历史记录
                    <span className="ml-2 text-lg font-normal text-silver">
                        ({history.length} 条)
                    </span>
                </h2>
                <button
                    onClick={() => {
                        if (window.confirm("确认清空全部历史记录？")) clearAll();
                    }}
                    className="btn-danger"
                >
                    清空全部
                </button>
            </div>

            {/* 历史记录表格 */}
            <div className="overflow-x-auto rounded-xl border border-line">
                <table className="w-full text-sm">
                    <thead className="bg-surface-subtle text-ink">
                        <tr>
                            <th className="px-3 py-2 text-left">时间</th>
                            {Object.values(FIELD_META).map((f) => (
                                <th key={f.key} className="px-3 py-2 text-left">
                                    {f.label}
                                </th>
                            ))}
                            <th className="px-3 py-2 text-left font-semibold text-success">
                                预测价格
                            </th>
                            <th className="px-3 py-2"></th>
                        </tr>
                    </thead>
                    <tbody>
                        {history.map((entry: HistoryEntry, idx: number) => {
                            const prevEntry = idx > 0 ? history[idx - 1] : null;
                            const nextEntry = idx < history.length - 1 ? history[idx + 1] : null;
                            const isBatchStart =
                                entry.batchId && entry.batchId !== prevEntry?.batchId;
                            const isBatchEnd =
                                entry.batchId && entry.batchId !== nextEntry?.batchId;
                            const isInBatch = !!entry.batchId;
                            const batchSize =
                                entry.batchId
                                    ? history.filter((e) => e.batchId === entry.batchId).length
                                    : 1;

                            return (
                                <tr
                                    key={entry.id}
                                    className={`border-t border-line/60 transition-colors hover:bg-surface-subtle ${isInBatch
                                        ? "border-l-4 border-l-kraken bg-kraken-soft/20 dark:border-l-kraken dark:bg-kraken-soft/10"
                                        : ""
                                        } ${isBatchStart
                                            ? "border-t-2 border-t-kraken/60 dark:border-t-kraken"
                                            : ""
                                        } ${isBatchEnd
                                            ? "border-b-2 border-b-kraken/60 dark:border-b-kraken"
                                            : ""
                                        }`}
                                >
                                    <td className="whitespace-nowrap px-3 py-2 text-xs text-silver">
                                        {isBatchStart ? (
                                            <span className="inline-flex items-center gap-1 rounded bg-kraken-soft px-1.5 py-0.5 text-xs font-medium text-kraken-deep dark:text-kraken">
                                                📋 CSV 导入 ({batchSize} 条)
                                            </span>
                                        ) : isInBatch ? (
                                            <span className="pl-4 text-silver">
                                                #{entry.batchIndex}
                                            </span>
                                        ) : (
                                            <span>
                                                {new Date(entry.timestamp).toLocaleString(
                                                    "zh-CN",
                                                    {
                                                        month: "2-digit",
                                                        day: "2-digit",
                                                        hour: "2-digit",
                                                        minute: "2-digit",
                                                    }
                                                )}
                                            </span>
                                        )}
                                    </td>
                                    {Object.keys(FIELD_META).map((key) => {
                                        const k = key as keyof typeof FIELD_META;
                                        return (
                                            <td
                                                key={k}
                                                className="px-3 py-2 text-coolgray"
                                            >
                                                {entry.features[k]}
                                            </td>
                                        );
                                    })}
                                    <td className="px-3 py-2 font-semibold text-success-dark">
                                        $
                                        {entry.predictedPrice.toLocaleString("en-US", {
                                            minimumFractionDigits: 2,
                                        })}
                                    </td>
                                    <td className="px-3 py-2">
                                        <div className="flex items-center gap-2">
                                            <button
                                                onClick={() => refillToEstimate(entry.features)}
                                                className="text-xs text-kraken hover:underline dark:text-kraken"
                                                title="回填到估值预测表单"
                                            >
                                                回填
                                            </button>
                                            <button
                                                onClick={() => removeEntry(entry.id)}
                                                className="text-xs text-danger hover:underline"
                                            >
                                                删除
                                            </button>
                                            {isBatchStart && entry.batchId && (
                                                <button
                                                    onClick={() =>
                                                        removeBatch(entry.batchId!)
                                                    }
                                                    className="text-xs text-warning hover:underline"
                                                    title={`删除此批次全部 ${batchSize} 条记录`}
                                                >
                                                    删除整批
                                                </button>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
