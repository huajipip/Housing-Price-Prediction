package com.interview.marketanalysis.dto;

import java.util.List;

/**
 * What-If 分析请求。
 *
 * @param baseFeatures     基准房源特征（7 个字段）
 * @param varyFeature      要变化的特征名（如 "square_footage"）
 * @param varyMin          变化范围下限
 * @param varyMax          变化范围上限
 * @param steps            采样点数（默认 20）
 */
public record WhatIfRequest(
        HouseFeatures baseFeatures,
        String varyFeature,
        double varyMin,
        double varyMax,
        int steps
) {
    public WhatIfRequest {
        if (steps <= 0) steps = 20;
    }
}
