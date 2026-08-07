package com.interview.marketanalysis.dto;

/**
 * 聚合统计响应 DTO。
 *
 * <p>包含数据集的描述性统计量。
 */
public record StatsResponse(
        int totalRecords,
        double meanPrice,
        double medianPrice,
        double minPrice,
        double maxPrice,
        double stdDevPrice,
        // 各特征的基本统计（用于前端展示参考范围）
        double meanSquareFootage,
        double meanBedrooms,
        double meanBathrooms,
        double meanYearBuilt,
        double meanLotSize,
        double meanDistanceToCityCenter,
        double meanSchoolRating,
        // 各特征的中位数（用于 What-If 的"恢复默认"）
        double medianSquareFootage,
        double medianBedrooms,
        double medianBathrooms,
        double medianYearBuilt,
        double medianLotSize,
        double medianDistanceToCityCenter,
        double medianSchoolRating
) {}
