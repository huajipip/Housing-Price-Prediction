package com.interview.marketanalysis.dto;

import jakarta.validation.Valid;

import java.util.List;

/**
 * What-If 分析请求。
 *
 * <p>{@code baseFeatures} 带 {@code @Valid} 级联校验
 *
 * @param baseFeatures     基准房源特征（7 个字段）
 * @param varyFeature      要变化的特征名（如 "square_footage"）
 * @param varyMin          变化范围下限
 * @param varyMax          变化范围上限
 * @param steps            采样点数（默认 20）
 * @param step             特征自然步长（如 bathrooms=0.5, bedrooms=1），
 *                         用于将采样点对齐到合法值。0 表示不对齐。
 */
public record WhatIfRequest(
        @Valid HouseFeatures baseFeatures,
        String varyFeature,
        double varyMin,
        double varyMax,
        int steps,
        double step
) {
    public WhatIfRequest {
        if (steps <= 0) steps = 20;
        if (step < 0) step = 0;
    }
}
