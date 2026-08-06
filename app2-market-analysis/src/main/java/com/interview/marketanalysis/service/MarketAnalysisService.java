package com.interview.marketanalysis.service;

import com.interview.marketanalysis.dto.CorrelationResponse;
import com.interview.marketanalysis.dto.DistributionResponse;
import com.interview.marketanalysis.dto.StatsResponse;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;

import java.util.*;
import java.util.stream.Collectors;

/**
 * 市场分析服务 — 聚合统计、价格分布、特征相关性。
 *
 * <p>所有计算基于内存中的 CSV 数据，使用 Java Stream API。
 * 结果使用 Spring Cache（Caffeine，TTL 5 分钟）缓存。
 */
@Service
public class MarketAnalysisService {

    private final DataLoader dataLoader;

    public MarketAnalysisService(DataLoader dataLoader) {
        this.dataLoader = dataLoader;
    }

    // ===================================================================
    // 聚合统计
    // ===================================================================

    /**
     * 计算数据集的描述性统计量。
     */
    @Cacheable("stats")  // 第二次用相同参数再调用时，直接返回缓存结果
    public StatsResponse getStats(
            Integer minBedrooms, Integer maxBedrooms,
            Integer minYearBuilt, Integer maxYearBuilt,
            Double minSchoolRating, Double maxSchoolRating) {

        // 过滤数据集
        List<HouseRecord> filtered = filterRecords(
                dataLoader.getRecords(),
                minBedrooms, maxBedrooms,
                minYearBuilt, maxYearBuilt,
                minSchoolRating, maxSchoolRating);

        if (filtered.isEmpty()) {
            return emptyStats();
        }

        DoubleSummaryStatistics priceStats = filtered.stream()
                .mapToDouble(HouseRecord::price) // 把 HouseRecord 流→price 的 double 流
                .summaryStatistics();            // 一次遍历算出 count/sum/min/average/max

        // 中位数
        double median = median(filtered.stream().mapToDouble(HouseRecord::price).sorted().toArray());
       
        // 标准差
        double stdDev = stdDev(filtered.stream().mapToDouble(HouseRecord::price).toArray(), priceStats.getAverage());

        return new StatsResponse(
                filtered.size(),
                priceStats.getAverage(),
                median,
                priceStats.getMin(),
                priceStats.getMax(),
                stdDev,
                filtered.stream().mapToDouble(HouseRecord::squareFootage).average().orElse(0),
                filtered.stream().mapToDouble(HouseRecord::bedrooms).average().orElse(0),
                filtered.stream().mapToDouble(HouseRecord::bathrooms).average().orElse(0),
                filtered.stream().mapToDouble(HouseRecord::yearBuilt).average().orElse(0),
                filtered.stream().mapToDouble(HouseRecord::lotSize).average().orElse(0),
                filtered.stream().mapToDouble(HouseRecord::distanceToCityCenter).average().orElse(0),
                filtered.stream().mapToDouble(HouseRecord::schoolRating).average().orElse(0)
        );
    }

    // ===================================================================
    // 价格分布（直方图用）
    // ===================================================================

    @Cacheable("distribution")
    public DistributionResponse getDistribution(
            Integer minBedrooms, Integer maxBedrooms,
            Integer minYearBuilt, Integer maxYearBuilt,
            Double minSchoolRating, Double maxSchoolRating) {

        List<HouseRecord> filtered = filterRecords(
                dataLoader.getRecords(),
                minBedrooms, maxBedrooms,
                minYearBuilt, maxYearBuilt,
                minSchoolRating, maxSchoolRating);

        if (filtered.isEmpty()) {
            return new DistributionResponse(List.of(), List.of());
        }

        double minPrice = filtered.stream().mapToDouble(HouseRecord::price).min().orElse(0);
        double maxPrice = filtered.stream().mapToDouble(HouseRecord::price).max().orElse(0);

        // 分成 5 个价格区间
        int bucketCount = 5;
        double bucketWidth = (maxPrice - minPrice) / bucketCount;
        if (bucketWidth == 0) bucketWidth = 1;

        List<String> buckets = new ArrayList<>();
        List<Integer> counts = new ArrayList<>();

        for (int i = 0; i < bucketCount; i++) {
            double low = minPrice + i * bucketWidth;
            double high = low + bucketWidth;
            String label = String.format("%.0fk-%.0fk", low / 1000, high / 1000);
            buckets.add(label);

            int count = (int) filtered.stream()
                    .filter(r -> r.price() >= low && r.price() < high)
                    .count();
            // 最后一个区间包含边界
            if (i == bucketCount - 1) {
                count = (int) filtered.stream()
                        .filter(r -> r.price() >= low && r.price() <= high)
                        .count();
            }
            counts.add(count);
        }

        return new DistributionResponse(buckets, counts);
    }

    // ===================================================================
    // 特征相关性（Pearson 相关系数）
    // ===================================================================

    @Cacheable("correlation")
    public CorrelationResponse getCorrelations() {
        List<HouseRecord> records = dataLoader.getRecords();
        if (records.isEmpty()) return new CorrelationResponse(Map.of());

        double[] prices = records.stream().mapToDouble(HouseRecord::price).toArray();

        Map<String, Double> correlations = new LinkedHashMap<>();
        correlations.put("square_footage", pearson(prices, records.stream().mapToDouble(HouseRecord::squareFootage).toArray()));
        correlations.put("bedrooms", pearson(prices, records.stream().mapToDouble(HouseRecord::bedrooms).toArray()));
        correlations.put("bathrooms", pearson(prices, records.stream().mapToDouble(HouseRecord::bathrooms).toArray()));
        correlations.put("year_built", pearson(prices, records.stream().mapToDouble(HouseRecord::yearBuilt).toArray()));
        correlations.put("lot_size", pearson(prices, records.stream().mapToDouble(HouseRecord::lotSize).toArray()));
        correlations.put("distance_to_city_center", pearson(prices, records.stream().mapToDouble(HouseRecord::distanceToCityCenter).toArray()));
        correlations.put("school_rating", pearson(prices, records.stream().mapToDouble(HouseRecord::schoolRating).toArray()));

        return new CorrelationResponse(correlations);
    }

    // ===================================================================
    // 辅助方法
    // ===================================================================

    private List<HouseRecord> filterRecords(
            List<HouseRecord> records,
            Integer minBedrooms, Integer maxBedrooms,
            Integer minYearBuilt, Integer maxYearBuilt,
            Double minSchoolRating, Double maxSchoolRating) {

        return records.stream()
                .filter(r -> minBedrooms == null || r.bedrooms() >= minBedrooms)
                .filter(r -> maxBedrooms == null || r.bedrooms() <= maxBedrooms)
                .filter(r -> minYearBuilt == null || r.yearBuilt() >= minYearBuilt)
                .filter(r -> maxYearBuilt == null || r.yearBuilt() <= maxYearBuilt)
                .filter(r -> minSchoolRating == null || r.schoolRating() >= minSchoolRating)
                .filter(r -> maxSchoolRating == null || r.schoolRating() <= maxSchoolRating)
                .collect(Collectors.toList());
    }

    private double median(double[] sorted) {
        int n = sorted.length;
        if (n == 0) return 0;
        if (n % 2 == 1) return sorted[n / 2];
        return (sorted[n / 2 - 1] + sorted[n / 2]) / 2.0;
    }

    private double stdDev(double[] values, double mean) {
        double variance = Arrays.stream(values)
                .map(v -> (v - mean) * (v - mean)) // 每个值与均值的差的平方
                .average()                          // 求平均 = 方差
                .orElse(0);
        return Math.sqrt(variance);                 // 标准差 = 方差的平方根
    }

    private double pearson(double[] x, double[] y) {
        int n = x.length;
        double meanX = Arrays.stream(x).average().orElse(0);
        double meanY = Arrays.stream(y).average().orElse(0);

        double cov = 0, stdX = 0, stdY = 0;
        for (int i = 0; i < n; i++) {
            double dx = x[i] - meanX;
            double dy = y[i] - meanY;
            cov += dx * dy;
            stdX += dx * dx;
            stdY += dy * dy;
        }

        if (stdX == 0 || stdY == 0) return 0;
        return cov / Math.sqrt(stdX * stdY);
    }

    private StatsResponse emptyStats() {
        return new StatsResponse(0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0);
    }
}
