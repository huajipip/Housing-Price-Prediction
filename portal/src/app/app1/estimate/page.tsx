"use client";

/**
 * 估值预测页 — 单条房源价格预测。
 *
 * 功能：
 * - 7 个特征字段输入表单（React Hook Form + Zod 校验）
 * - 提交后调用 App1 后端 /api/app1/predict
 * - 结果以数字 + 柱状图（Recharts）展示
 * - 自动保存到 localStorage 历史记录
 */

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
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
import { FIELD_META } from "@/lib/constants";
import { app1Api } from "@/lib/api";
import { usePredictionHistory } from "@/hooks/usePredictionHistory";
import type { HouseFeatures } from "@/lib/types";
import ErrorDisplay from "@/components/ErrorDisplay";

// ---------------------------------------------------------------------------
// Zod 校验 schema（与后端 Pydantic 校验规则一致）
// ---------------------------------------------------------------------------

const houseSchema = z.object({
    square_footage: z.coerce
        .number({ invalid_type_error: "请输入数字" })
        .min(500, "最小 500 sq ft")
        .max(10000, "最大 10000 sq ft"),
    bedrooms: z.coerce
        .number({ invalid_type_error: "请输入整数" })
        .int("请输入整数")
        .min(1, "最少 1 间")
        .max(10, "最多 10 间"),
    bathrooms: z.coerce
        .number({ invalid_type_error: "请输入数字" })
        .min(0.5, "最少 0.5 间")
        .max(10, "最多 10 间"),
    year_built: z.coerce
        .number({ invalid_type_error: "请输入年份" })
        .int("请输入整数年份")
        .min(1800, "最早 1800 年")
        .max(2030, "最晚 2030 年"),
    lot_size: z.coerce
        .number({ invalid_type_error: "请输入数字" })
        .min(1000, "最小 1000 sq ft")
        .max(50000, "最大 50000 sq ft"),
    distance_to_city_center: z.coerce
        .number({ invalid_type_error: "请输入数字" })
        .min(0, "最小 0 英里")
        .max(50, "最大 50 英里"),
    school_rating: z.coerce
        .number({ invalid_type_error: "请输入数字" })
        .min(0, "最低 0 分")
        .max(10, "最高 10 分"),
});

type FormValues = z.infer<typeof houseSchema>;

// ---------------------------------------------------------------------------
// 组件
// ---------------------------------------------------------------------------

export default function EstimatePage() {
    const [predictedPrice, setPredictedPrice] = useState<number | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const { addEntry } = usePredictionHistory();

    const {
        register,
        handleSubmit,
        formState: { errors },
        reset,
    } = useForm<FormValues>({
        resolver: zodResolver(houseSchema),
    });

    // 从历史记录回填：读取 ?prefill=<JSON 特征> 并预填表单
    const searchParams = useSearchParams();
    useEffect(() => {
        const raw = searchParams.get("prefill");
        if (!raw) return;
        try {
            const features = JSON.parse(raw) as HouseFeatures;
            // 只取 7 个特征字段，避免多余字段注入
            const { square_footage, bedrooms, bathrooms, year_built, lot_size, distance_to_city_center, school_rating } = features;
            reset({
                square_footage,
                bedrooms,
                bathrooms,
                year_built,
                lot_size,
                distance_to_city_center,
                school_rating,
            });
        } catch {
            /* 解析失败则忽略，保持空表单 */
        }
    }, [searchParams, reset]);

    /** 提交表单 */
    const onSubmit = async (data: FormValues) => {
        setIsLoading(true);
        setError(null);
        try {
            const features: HouseFeatures = {
                square_footage: data.square_footage,
                bedrooms: data.bedrooms,
                bathrooms: data.bathrooms,
                year_built: data.year_built,
                lot_size: data.lot_size,
                distance_to_city_center: data.distance_to_city_center,
                school_rating: data.school_rating,
            };
            const res = await app1Api.predict(features);
            const price = res.predictions[0];
            setPredictedPrice(price);
            addEntry(features, price);
        } catch (err) {
            setError(err instanceof Error ? err.message : "预测失败，请重试。");
        } finally {
            setIsLoading(false);
        }
    };

    // 结果柱状图数据（单条结果也用柱状图，视觉统一）
    const chartData = predictedPrice
        ? [{ name: "预测价格", price: predictedPrice }]
        : [];

    return (
        <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
            <h2 className="mb-6 text-2xl font-bold text-gray-900 dark:text-white">
                房源估值预测
            </h2>

            {/* 表单 */}
            <form
                onSubmit={handleSubmit(onSubmit)}
                className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900"
            >
                <div className="grid gap-4 sm:grid-cols-2">
                    {Object.values(FIELD_META).map((field) => (
                        <div key={field.key}>
                            <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                                {field.label}
                                <span className="ml-1 text-xs text-gray-400">
                                    ({field.unit})
                                </span>
                            </label>
                            <input
                                type="number"
                                step={field.step}
                                placeholder={field.placeholder}
                                {...register(field.key)}
                                className={`w-full rounded-lg border px-3 py-2 text-sm transition-colors focus:outline-none focus:ring-2 dark:bg-gray-800 ${errors[field.key]
                                    ? "border-red-300 focus:ring-red-500 dark:border-red-700"
                                    : "border-gray-300 focus:ring-blue-500 dark:border-gray-600"
                                    }`}
                            />
                            {errors[field.key] && (
                                <p className="mt-1 text-xs text-red-600">
                                    {errors[field.key]?.message}
                                </p>
                            )}
                        </div>
                    ))}
                </div>

                {/* 按钮组 */}
                <div className="mt-6 flex gap-3">
                    <button
                        type="submit"
                        disabled={isLoading}
                        className="rounded-lg bg-blue-600 px-6 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                        {isLoading ? (
                            <span className="flex items-center gap-2">
                                <svg
                                    className="h-4 w-4 animate-spin"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                >
                                    <circle
                                        className="opacity-25"
                                        cx="12"
                                        cy="12"
                                        r="10"
                                        stroke="currentColor"
                                        strokeWidth="4"
                                    />
                                    <path
                                        className="opacity-75"
                                        fill="currentColor"
                                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                                    />
                                </svg>
                                正在估算中...
                            </span>
                        ) : (
                            "开始估值"
                        )}
                    </button>
                    <button
                        type="button"
                        onClick={() => {
                            reset();
                            setPredictedPrice(null);
                            setError(null);
                        }}
                        className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-800"
                    >
                        重置
                    </button>
                </div>
            </form>

            {/* 错误展示 */}
            {error && (
                <div className="mt-6 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-800 dark:bg-red-950 dark:text-red-400">
                    {error}
                </div>
            )}

            {/* 结果展示 */}
            {predictedPrice !== null && (
                <div className="mt-8 space-y-6">
                    {/* 预测价格数字 */}
                    <div className="rounded-xl border border-green-200 bg-green-50 p-8 text-center dark:border-green-800 dark:bg-green-950">
                        <p className="mb-2 text-sm text-green-700 dark:text-green-400">
                            预测价格
                        </p>
                        <p className="text-4xl font-bold text-green-800 dark:text-green-300">
                            $
                            {predictedPrice.toLocaleString("en-US", {
                                minimumFractionDigits: 2,
                            })}
                        </p>
                    </div>

                    {/* 柱状图 */}
                    <div className="rounded-xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-gray-900">
                        <h3 className="mb-4 text-sm font-medium text-gray-700 dark:text-gray-300">
                            预测结果可视化
                        </h3>
                        <ResponsiveContainer width="100%" height={200}>
                            <BarChart data={chartData}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="name" />
                                <YAxis
                                    tickFormatter={(v) =>
                                        `$${(v / 1000).toFixed(0)}k`
                                    }
                                />
                                <Tooltip
                                    formatter={(value) => [
                                        `$${Number(value).toLocaleString("en-US", {
                                            minimumFractionDigits: 2,
                                        })}`,
                                        "预测价格",
                                    ]}
                                />
                                <Bar dataKey="price" radius={[8, 8, 0, 0]}>
                                    <Cell fill="#22c55e" />
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            )}

            {/* 空状态引导 */}
            {predictedPrice === null && !error && (
                <div className="mt-8 rounded-xl border border-dashed border-gray-300 bg-gray-50 p-12 text-center dark:border-gray-700 dark:bg-gray-900">
                    <p className="text-gray-500 dark:text-gray-400">
                        请输入房源信息开始估值
                    </p>
                </div>
            )}
        </div>
    );
}
