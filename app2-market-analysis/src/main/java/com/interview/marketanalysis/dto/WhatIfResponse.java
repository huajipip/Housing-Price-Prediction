package com.interview.marketanalysis.dto;

import java.util.List;

/**
 * What-If 分析响应。
 *
 * @param varyFeature      变化的特征名
 * @param dataPoints       数据点列表，每个点包含 (特征值, 预测价格)
 */
public record WhatIfResponse(
        String varyFeature,
        List<DataPoint> dataPoints
) {
    public record DataPoint(double featureValue, double predictedPrice) {}
}
