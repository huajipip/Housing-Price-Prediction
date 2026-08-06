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
import type { HistoryEntry } from "@/lib/types";

export default function HistoryPage() {
    const { history, removeEntry, clearAll } = usePredictionHistory();

    if (history.length === 0) {
        return (
            <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
                <h2 className="mb-6 text-2xl font-bold text-gray-900 dark:text-white">
                    预测历史记录
                </h2>
                <div className="rounded-xl border border-dashed border-gray-300 bg-gray-50 p-12 text-center dark:border-gray-700 dark:bg-gray-900">
                    <p className="text-gray-500 dark:text-gray-400">
                        暂无历史估值记录。去「估值预测」页面开始您的第一次预测吧。
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
            <div className="mb-6 flex items-center justify-between">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                    预测历史记录
                    <span className="ml-2 text-base font-normal text-gray-400">
                        ({history.length} 条)
                    </span>
                </h2>
                <button
                    onClick={() => {
                        if (window.confirm("确认清空全部历史记录？")) clearAll();
                    }}
                    className="rounded-lg border border-red-300 px-3 py-1.5 text-sm font-medium text-red-600 hover:bg-red-50 dark:border-red-700 dark:text-red-400 dark:hover:bg-red-950"
                >
                    清空全部
                </button>
            </div>

            {/* 历史记录表格 */}
            <div className="overflow-x-auto rounded-xl border border-gray-200 dark:border-gray-800">
                <table className="w-full text-sm">
                    <thead className="bg-gray-50 text-gray-700 dark:bg-gray-800 dark:text-gray-300">
                        <tr>
                            <th className="px-3 py-2 text-left">时间</th>
                            {Object.values(FIELD_META).map((f) => (
                                <th key={f.key} className="px-3 py-2 text-left">
                                    {f.label}
                                </th>
                            ))}
                            <th className="px-3 py-2 text-left font-semibold text-green-700">
                                预测价格
                            </th>
                            <th className="px-3 py-2"></th>
                        </tr>
                    </thead>
                    <tbody>
                        {history.map((entry: HistoryEntry) => (
                            <tr
                                key={entry.id}
                                className="border-t border-gray-100 transition-colors hover:bg-gray-50 dark:border-gray-800 dark:hover:bg-gray-800/50"
                            >
                                <td className="whitespace-nowrap px-3 py-2 text-xs text-gray-500">
                                    {new Date(entry.timestamp).toLocaleString("zh-CN", {
                                        month: "2-digit",
                                        day: "2-digit",
                                        hour: "2-digit",
                                        minute: "2-digit",
                                    })}
                                </td>
                                {Object.keys(FIELD_META).map((key) => {
                                    const k = key as keyof typeof FIELD_META;
                                    return (
                                        <td key={k} className="px-3 py-2 text-gray-600 dark:text-gray-400">
                                            {entry.features[k]}
                                        </td>
                                    );
                                })}
                                <td className="px-3 py-2 font-semibold text-green-700 dark:text-green-400">
                                    $
                                    {entry.predictedPrice.toLocaleString("en-US", {
                                        minimumFractionDigits: 2,
                                    })}
                                </td>
                                <td className="px-3 py-2">
                                    <button
                                        onClick={() => removeEntry(entry.id)}
                                        className="text-xs text-red-500 hover:underline"
                                    >
                                        删除
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
