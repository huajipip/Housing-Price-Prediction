"use client";

/**
 * usePredictionHistory — 预测历史记录管理 Hook。
 *
 * 基于 localStorage 的客户端持久化，支持 CRUD 操作。
 * 历史记录仅用于个人回顾，不需要后端存储，
 */

import { useCallback, useEffect, useState } from "react";
import { HISTORY_STORAGE_KEY } from "@/lib/constants";
import type { HistoryEntry, HouseFeatures } from "@/lib/types";

export function usePredictionHistory() {
    const [history, setHistory] = useState<HistoryEntry[]>([]);

    // 启动时从 localStorage 加载
    useEffect(() => {
        try {
            const raw = localStorage.getItem(HISTORY_STORAGE_KEY);
            if (raw) {
                const parsed = JSON.parse(raw) as HistoryEntry[];
                setHistory(parsed.sort((a, b) => b.timestamp - a.timestamp));
            }
        } catch {
            setHistory([]);
        }
    }, []);

    // 保存到 localStorage
    const persist = useCallback((entries: HistoryEntry[]) => {
        localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(entries));
    }, []);

    /** 添加一条记录 */
    const addEntry = useCallback(
        (features: HouseFeatures, predictedPrice: number) => {
            const entry: HistoryEntry = {
                id: crypto.randomUUID(),
                timestamp: Date.now(),
                features,
                predictedPrice,
            };
            setHistory((prev) => {
                const next = [entry, ...prev];
                persist(next);
                return next;
            });
        },
        [persist]
    );

    /** 删除单条记录 */
    const removeEntry = useCallback(
        (id: string) => {
            setHistory((prev) => {
                const next = prev.filter((e) => e.id !== id);
                persist(next);
                return next;
            });
        },
        [persist]
    );

    /** 清空全部记录 */
    const clearAll = useCallback(() => {
        setHistory([]);
        localStorage.removeItem(HISTORY_STORAGE_KEY);
    }, []);

    return { history, addEntry, removeEntry, clearAll };
}
