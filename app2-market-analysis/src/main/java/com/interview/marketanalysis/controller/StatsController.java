package com.interview.marketanalysis.controller;

import com.interview.marketanalysis.dto.CorrelationResponse;
import com.interview.marketanalysis.dto.DistributionResponse;
import com.interview.marketanalysis.dto.StatsResponse;
import com.interview.marketanalysis.service.MarketAnalysisService;
import org.springframework.web.bind.annotation.*;

/**
 * 市场统计控制器 — 聚合统计、价格分布、特征相关性。
 *
 * <p>所有 GET 端点支持可选的筛选参数（bedrooms, year_built, school_rating），
 * 统计结果会随筛选条件变化。未传筛选参数时返回全量数据的统计。
 */
@RestController
@RequestMapping("/api/app2")
public class StatsController {

    private final MarketAnalysisService marketAnalysisService;

    public StatsController(MarketAnalysisService marketAnalysisService) {
        this.marketAnalysisService = marketAnalysisService;
    }

    /**
     * 聚合统计（均值、中位数、最值、标准差等）。
     *
     * <p>筛选参数均为可选，不传则不做对应维度的筛选。
     */
    @GetMapping("/stats")
    public StatsResponse getStats(
            @RequestParam(required = false) Integer minBedrooms,
            @RequestParam(required = false) Integer maxBedrooms,
            @RequestParam(required = false) Integer minYearBuilt,
            @RequestParam(required = false) Integer maxYearBuilt,
            @RequestParam(required = false) Double minSchoolRating,
            @RequestParam(required = false) Double maxSchoolRating) {
        return marketAnalysisService.getStats(
                minBedrooms, maxBedrooms,
                minYearBuilt, maxYearBuilt,
                minSchoolRating, maxSchoolRating);
    }

    /**
     * 价格分布（直方图数据）。
     */
    @GetMapping("/stats/distribution")
    public DistributionResponse getDistribution(
            @RequestParam(required = false) Integer minBedrooms,
            @RequestParam(required = false) Integer maxBedrooms,
            @RequestParam(required = false) Integer minYearBuilt,
            @RequestParam(required = false) Integer maxYearBuilt,
            @RequestParam(required = false) Double minSchoolRating,
            @RequestParam(required = false) Double maxSchoolRating) {
        return marketAnalysisService.getDistribution(
                minBedrooms, maxBedrooms,
                minYearBuilt, maxYearBuilt,
                minSchoolRating, maxSchoolRating);
    }

    /**
     * 各特征与价格的 Pearson 相关系数。
     */
    @GetMapping("/stats/correlation")
    public CorrelationResponse getCorrelation() {
        return marketAnalysisService.getCorrelations();
    }
}
