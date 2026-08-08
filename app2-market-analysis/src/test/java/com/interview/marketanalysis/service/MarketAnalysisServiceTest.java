package com.interview.marketanalysis.service;

import com.interview.marketanalysis.dto.CorrelationResponse;
import com.interview.marketanalysis.dto.DistributionResponse;
import com.interview.marketanalysis.dto.ScatterResponse;
import com.interview.marketanalysis.dto.StatsResponse;
import org.junit.jupiter.api.Test;

import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

/**
 * MarketAnalysisService 的单元测试（纯 JUnit + Mockito，不启动 Spring 上下文）。
 *
 * <p>设计思路：核心统计算法（均值/中位数/标准差/Pearson/直方图/过滤）是纯 Java 逻辑，
 * 用 mock 的 DataLoader 注入 3 条固定数据，使所有期望值都可手算、可复现。
 *
 * <p>运行：在 app2-market-analysis/ 目录下执行 {@code mvn test}
 */
class MarketAnalysisServiceTest {

    // ===================================================================
    // 测试工具：用 mock DataLoader 构造被测服务
    // ===================================================================

    /** 用固定数据集构造被测服务（避免真实 DataLoader 依赖 classpath CSV）。 */
    private MarketAnalysisService serviceWith(List<HouseRecord> records) {
        DataLoader loader = mock(DataLoader.class);
        when(loader.getRecords()).thenReturn(records);
        return new MarketAnalysisService(loader);
    }

    /**
     * 3 条手算友好的固定数据：
     *   price: 200k / 300k / 400k → mean=300k, min=200k, max=400k, median=300k(奇数)
     *   school_rating: 7/8/9     → 与 price 完全正相关
     */
    private static List<HouseRecord> threeHouses() {
        return List.of(
                new HouseRecord(1500, 3, 2, 2000, 5000, 5.0, 7.0, 200_000),
                new HouseRecord(2000, 4, 3, 2010, 7000, 3.0, 8.0, 300_000),
                new HouseRecord(2500, 4, 3, 2015, 9000, 1.0, 9.0, 400_000)
        );
    }

    // ===================================================================
    // getStats — 聚合统计
    // ===================================================================

    @Test
    void getStats_returnsCorrectAggregates() {
        MarketAnalysisService service = serviceWith(threeHouses());

        StatsResponse stats = service.getStats(null, null, null, null, null, null);

        assertEquals(3, stats.totalRecords());
        assertEquals(300_000, stats.meanPrice(), 1e-9);
        // 3 条记录（奇数）→ 中位数 = 排序后中间值
        assertEquals(300_000, stats.medianPrice(), 1e-9);
        assertEquals(200_000, stats.minPrice(), 1e-9);
        assertEquals(400_000, stats.maxPrice(), 1e-9);
    }

    @Test
    void getStats_appliesBedroomFilter() {
        MarketAnalysisService service = serviceWith(threeHouses());

        // minBedrooms=4 → 只剩 2 条 (bedrooms=4)，均值 (300k+400k)/2 = 350k
        StatsResponse stats = service.getStats(4, null, null, null, null, null);

        assertEquals(2, stats.totalRecords());
        assertEquals(350_000, stats.meanPrice(), 1e-9);
    }

    @Test
    void getStats_returnsZeroForEmptyData() {
        MarketAnalysisService service = serviceWith(List.of());

        StatsResponse stats = service.getStats(null, null, null, null, null, null);

        assertEquals(0, stats.totalRecords());
        assertEquals(0, stats.meanPrice(), 1e-9);
    }

    // ===================================================================
    // getDistribution — 价格直方图
    // ===================================================================

    @Test
    void getDistribution_alwaysHasFiveBucketsAndCountsSumToRecords() {
        MarketAnalysisService service = serviceWith(threeHouses());

        DistributionResponse dist = service.getDistribution(null, null, null, null, null, null);

        // 固定 5 个价格区间
        assertEquals(5, dist.buckets().size());
        assertEquals(5, dist.counts().size());
        // 所有区间计数之和 = 记录总数（无丢失）
        int total = dist.counts().stream().mapToInt(Integer::intValue).sum();
        assertEquals(3, total);
    }

    // ===================================================================
    // getCorrelations — Pearson 相关系数
    // ===================================================================

    @Test
    void getCorrelations_coversAllSevenFeaturesWithinRange() {
        MarketAnalysisService service = serviceWith(threeHouses());

        CorrelationResponse corr = service.getCorrelations();

        // 7 个特征齐全
        assertEquals(7, corr.correlations().size());
        // 相关系数数学上必须落在 [-1, 1]
        corr.correlations().forEach((name, value) ->
                assertTrue(value >= -1.0 && value <= 1.0, name + " 相关系数应在 [-1,1]，实际 " + value));
        // school_rating 与 price 完全线性正相关（7/8/9 ↔ 200k/300k/400k）→ 应接近 1
        assertEquals(1.0, corr.correlations().get("school_rating"), 1e-9);
    }

    // ===================================================================
    // getScatter — 散点数据
    // ===================================================================

    @Test
    void getScatter_returnsOnePointPerRecord() {
        MarketAnalysisService service = serviceWith(threeHouses());

        ScatterResponse scatter = service.getScatter("square_footage");

        assertEquals("square_footage", scatter.feature());
        assertEquals(3, scatter.points().size());
    }

    @Test
    void getScatter_throwsOnUnknownFeature() {
        MarketAnalysisService service = serviceWith(threeHouses());

        // 未知特征名 → 明确报错（防御无效输入）
        assertThrows(IllegalArgumentException.class, () -> service.getScatter("unknown_feature"));
    }
}
