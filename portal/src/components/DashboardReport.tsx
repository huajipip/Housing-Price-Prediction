"use client";

/**
 * DashboardReport — 使用 @react-pdf/renderer 生成仪表盘摘要 PDF。
 *
 * PDF 内容：标题 + 日期 + 统计概览表 + 价格分布柱状图。
 *
 * 字体说明：
 * - 使用 Windows 系统黑体（SimHei）支持中文渲染
 * - 字体文件位于 public/fonts/SimHei.ttf，构建时随静态资源一起部署
 * - 通过 Font.register 注册后，@react-pdf/renderer 的 Web Worker 可从
 *   同源路径加载字体，避免了远程 Google Fonts URL 的 CORS/网络问题
 */

import {
    Document,
    Page,
    Text,
    View,
    StyleSheet,
    Font,
} from "@react-pdf/renderer";

// ============================================================
// 注册中文字体（本地文件，随 public/ 部署，Web Worker 同源加载）
// ============================================================

Font.register({
    family: "SimHei",
    src: "/fonts/SimHei.ttf",
});

// ============================================================
// 样式
// ============================================================

const styles = StyleSheet.create({
    page: {
        padding: 40,
        fontFamily: "SimHei",
        fontSize: 11,
        color: "#1f2937",
    },
    title: {
        fontSize: 22,
        fontWeight: 700,
        marginBottom: 6,
        color: "#111827",
    },
    subtitle: {
        fontSize: 12,
        color: "#6b7280",
        marginBottom: 24,
    },
    sectionTitle: {
        fontSize: 14,
        fontWeight: 700,
        marginTop: 20,
        marginBottom: 10,
        paddingBottom: 4,
        borderBottom: "2 solid #3b82f6",
        color: "#1e40af",
    },
    statRow: {
        flexDirection: "row",
        paddingVertical: 5,
        borderBottom: "1 solid #e5e7eb",
    },
    statLabel: {
        width: "40%",
        color: "#4b5563",
    },
    statValue: {
        width: "60%",
        fontWeight: 700,
        color: "#111827",
    },
    distRow: {
        flexDirection: "row",
        alignItems: "center",
        paddingVertical: 3,
    },
    distLabel: {
        width: "28%",
        fontSize: 9,
        color: "#4b5563",
    },
    distBar: {
        height: 14,
        backgroundColor: "#3b82f6",
        borderRadius: 3,
        minWidth: 4,
    },
    distCount: {
        width: "15%",
        textAlign: "right",
        fontSize: 9,
        fontWeight: 700,
        color: "#111827",
    },
    footer: {
        position: "absolute",
        bottom: 30,
        left: 40,
        right: 40,
        fontSize: 9,
        color: "#9ca3af",
        textAlign: "center",
        borderTop: "1 solid #e5e7eb",
        paddingTop: 8,
    },
});

// ============================================================
// 类型
// ============================================================

export interface ReportData {
    stats: Record<string, number>;
    distribution: {
        buckets: string[];
        counts: number[];
    };
}

// ============================================================
// PDF 文档组件
// ============================================================

export function DashboardReport({ data }: { data: ReportData }) {
    const { stats, distribution } = data;
    const today = new Date().toLocaleDateString("zh-CN");
    const maxCount = Math.max(...distribution.counts, 1);

    return (
        <Document>
            <Page size="A4" style={styles.page}>
                {/* 标题 */}
                <Text style={styles.title}>房产市场分析报告</Text>
                <Text style={styles.subtitle}>
                    Housing Market Analysis Report — {today}
                </Text>

                {/* 统计概览 */}
                <Text style={styles.sectionTitle}>统计概览</Text>
                {Object.entries(stats).map(([label, value]) => (
                    <View key={label} style={styles.statRow}>
                        <Text style={styles.statLabel}>{label}</Text>
                        <Text style={styles.statValue}>
                            {label.includes("房价")
                                ? `$${value.toLocaleString()}`
                                : value.toLocaleString()}
                        </Text>
                    </View>
                ))}

                {/* 价格分布 */}
                <Text style={styles.sectionTitle}>价格分布</Text>
                {distribution.buckets.map((bucket, i) => {
                    const barWidth = Math.max(
                        (distribution.counts[i] / maxCount) * 200,
                        8
                    );
                    return (
                        <View key={bucket} style={styles.distRow}>
                            <Text style={styles.distLabel}>{bucket}</Text>
                            <View style={[styles.distBar, { width: barWidth }]} />
                            <Text style={styles.distCount}>
                                {distribution.counts[i]} 条
                            </Text>
                        </View>
                    );
                })}

                {/* 页脚 */}
                <Text style={styles.footer}>
                    由 Housing Price Predictor 系统生成 | App2 市场分析
                </Text>
            </Page>
        </Document>
    );
}
