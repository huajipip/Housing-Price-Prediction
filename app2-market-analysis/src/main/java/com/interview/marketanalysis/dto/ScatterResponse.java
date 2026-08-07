package com.interview.marketanalysis.dto;

import java.util.List;

/**
 * 散点图响应 — 指定特征与 price 的原始数据点。
 *
 * <p>用于前端 ScatterChart 渲染，返回的是真实数据点而非统计量，
 * 与 CorrelationResponse（Pearson 系数）互补。
 */
public record ScatterResponse(
        String feature,
        List<Point> points
) {
    /**
     * 单个数据点：x = 特征值，y = 价格。
     */
    public record Point(
            double x,
            double y
    ) {}
}
