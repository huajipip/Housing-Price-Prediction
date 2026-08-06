package com.interview.marketanalysis.dto;

import java.util.Map;

/**
 * 特征相关性响应 — 各特征与 price 的 Pearson 相关系数。
 */
public record CorrelationResponse(
        Map<String, Double> correlations
) {}
