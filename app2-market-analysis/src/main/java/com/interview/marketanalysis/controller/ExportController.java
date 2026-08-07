package com.interview.marketanalysis.controller;

import com.interview.marketanalysis.service.ExportService;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

/**
 * 数据导出控制器 — CSV 文件下载。
 *
 * <p>支持两种模式：
 * <ul>
 *   <li>不传筛选参数 → 全量导出（向后兼容）</li>
 *   <li>传入筛选参数 → 仅导出符合条件的数据行</li>
 * </ul>
 * 筛选参数命名与 {@code StatsController} 一致，方便前端复用。
 */
@RestController
@RequestMapping("/api/app2")
public class ExportController {

    private final ExportService exportService;

    public ExportController(ExportService exportService) {
        this.exportService = exportService;
    }

    /**
     * 导出房源数据（含预测价格）为 CSV 文件。
     *
     * <p>所有筛选参数均为可选。不传任何参数时导出全部数据。
     *
     * @param minBedrooms     卧室数下限（含），可选
     * @param maxBedrooms     卧室数上限（含），可选
     * @param minYearBuilt    建造年份下限（含），可选
     * @param maxYearBuilt    建造年份上限（含），可选
     * @param minSchoolRating 学校评分下限（含），可选
     * @param maxSchoolRating 学校评分上限（含），可选
     */
    @GetMapping("/export/csv")
    public ResponseEntity<String> exportCsv(
            @RequestParam(required = false) Integer minBedrooms,
            @RequestParam(required = false) Integer maxBedrooms,
            @RequestParam(required = false) Integer minYearBuilt,
            @RequestParam(required = false) Integer maxYearBuilt,
            @RequestParam(required = false) Double minSchoolRating,
            @RequestParam(required = false) Double maxSchoolRating) {

        String csv = exportService.exportWithPredictions(
                minBedrooms, maxBedrooms,
                minYearBuilt, maxYearBuilt,
                minSchoolRating, maxSchoolRating);

        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION,
                        "attachment; filename=housing-market-analysis.csv")
                .contentType(MediaType.parseMediaType("text/csv; charset=UTF-8"))
                .body(csv);
    }
}
