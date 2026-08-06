package com.interview.marketanalysis.dto;

import java.util.List;

/**
 * 价格分布响应 — 用于前端直方图。
 *
 * @param buckets  区间标签（如 "180k-220k"）
 * @param counts   各区间内的房源数量
 */
public record DistributionResponse(
        List<String> buckets,
        List<Integer> counts
) {}
