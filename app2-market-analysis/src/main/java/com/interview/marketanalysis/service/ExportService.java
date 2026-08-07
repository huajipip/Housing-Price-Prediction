package com.interview.marketanalysis.service;

import com.interview.marketanalysis.dto.HouseFeatures;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

/**
 * CSV 导出服务 — 生成带预测价格的 CSV 文本。
 *
 * <p>支持两种导出模式：
 * <ul>
 *   <li>全量导出：不传筛选参数，导出数据集全部行</li>
 *   <li>筛选导出：传入筛选条件（bedrooms/ year_built/ school_rating 的上下限），
 *       仅导出符合条件的行</li>
 * </ul>
 * 两种模式都会为每行调用 Task 1 模型生成 predicted_price 列，方便对比。
 *
 * <p>直接返回 CSV 字符串，由 Controller 设置 Content-Type 和 Content-Disposition 响应头。
 */
@Service
public class ExportService {

    private final DataLoader dataLoader;
    private final Task1Client task1Client;

    public ExportService(DataLoader dataLoader, Task1Client task1Client) {
        this.dataLoader = dataLoader;
        this.task1Client = task1Client;
    }

    /**
     * 按筛选条件导出房源数据（含预测价格）为 CSV。
     *
     * <p>所有筛选参数均为可选，不传则不做对应维度的筛选（等价于全量导出）。
     *
     * @param minBedrooms     卧室数下限（含）
     * @param maxBedrooms     卧室数上限（含）
     * @param minYearBuilt    建造年份下限（含）
     * @param maxYearBuilt    建造年份上限（含）
     * @param minSchoolRating 学校评分下限（含）
     * @param maxSchoolRating 学校评分上限（含）
     * @return CSV 格式字符串（含表头）
     */
    public String exportWithPredictions(
            Integer minBedrooms, Integer maxBedrooms,
            Integer minYearBuilt, Integer maxYearBuilt,
            Double minSchoolRating, Double maxSchoolRating) {

        // 1. 从内存数据集筛选
        List<HouseRecord> records = filterRecords(
                dataLoader.getRecords(),
                minBedrooms, maxBedrooms,
                minYearBuilt, maxYearBuilt,
                minSchoolRating, maxSchoolRating);

        if (records.isEmpty()) return csvHeader();

        // 2. 构建批量预测请求
        List<HouseFeatures> featuresList = records.stream()
                .map(r -> new HouseFeatures(
                        r.squareFootage(), r.bedrooms(), r.bathrooms(),
                        r.yearBuilt(), r.lotSize(),
                        r.distanceToCityCenter(), r.schoolRating()))
                .toList();

        // 3. 调用 Task 1 模型获取预测价格
        List<Double> predictions = task1Client.predictBatch(featuresList);

        // 4. 生成 CSV（原始特征 + 实际价格 + 预测价格）
        StringBuilder sb = new StringBuilder(csvHeader()).append("\n");
        for (int i = 0; i < records.size(); i++) {
            HouseRecord r = records.get(i);
            sb.append(String.format("%.2f,%d,%.1f,%d,%.2f,%.1f,%.1f,%.2f,%.2f\n",
                    r.squareFootage(), r.bedrooms(), r.bathrooms(),
                    r.yearBuilt(), r.lotSize(),
                    r.distanceToCityCenter(), r.schoolRating(),
                    r.price(), predictions.get(i)));
        }
        return sb.toString();
    }

    // ================================================================
    // 筛选逻辑（与 MarketAnalysisService.filterRecords 保持一致）
    // ================================================================

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

    private String csvHeader() {
        return "square_footage,bedrooms,bathrooms,year_built,lot_size,distance_to_city_center,school_rating,actual_price,predicted_price";
    }
}
