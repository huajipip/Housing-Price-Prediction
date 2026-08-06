package com.interview.marketanalysis.controller;

import com.interview.marketanalysis.service.ExportService;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * 数据导出控制器 — CSV 文件下载。
 */
@RestController
@RequestMapping("/api/app2")
public class ExportController {

    private final ExportService exportService;

    public ExportController(ExportService exportService) {
        this.exportService = exportService;
    }

    /**
     * 导出全部房源数据（含预测价格）为 CSV 文件。
     *
     * <p>设置 Content-Disposition 为 attachment，浏览器自动触发下载。
     */
    @GetMapping("/export/csv")
    public ResponseEntity<String> exportCsv() {
        String csv = exportService.exportAllWithPredictions();

        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION,
                        "attachment; filename=housing-market-analysis.csv")
                .contentType(MediaType.parseMediaType("text/csv; charset=UTF-8"))
                .body(csv);
    }
}
