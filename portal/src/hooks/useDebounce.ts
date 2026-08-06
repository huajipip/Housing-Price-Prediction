/**
 * useDebounce — 防抖 Hook。
 *
 * 延迟 value 的更新，直到用户停止输入 delay 毫秒后。
 * 用于 What-If 滑块等高频更新的场景，减少不必要的 API 调用。
 */

import { useEffect, useState } from "react";

export function useDebounce<T>(value: T, delay: number = 300): T {
    const [debounced, setDebounced] = useState(value);

    useEffect(() => {
        const timer = setTimeout(() => setDebounced(value), delay);
        return () => clearTimeout(timer);
    }, [value, delay]);

    return debounced;
}
