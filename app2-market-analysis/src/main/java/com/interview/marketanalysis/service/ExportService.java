package com.interview.marketanalysis.service;

import com.interview.marketanalysis.dto.HouseFeatures;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;

/**
 * CSV 导出服务 — 生成带预测价格的 CSV 文本。
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
     * 将全部数据集的房源特征 + 模型预测价格导出为 CSV。
     *
     * @return CSV 格式字符串（含表头）
     */
    public String exportAllWithPredictions() {
        List<HouseRecord> records = dataLoader.getRecords();
        if (records.isEmpty()) return csvHeader();

        // 构建批量预测请求
        List<HouseFeatures> featuresList = records.stream()
                .map(r -> new HouseFeatures(
                        r.squareFootage(), r.bedrooms(), r.bathrooms(),
                        r.yearBuilt(), r.lotSize(),
                        r.distanceToCityCenter(), r.schoolRating()))
                .toList();

        List<Double> predictions = task1Client.predictBatch(featuresList);

        // 生成 CSV
        StringBuilder sb = new StringBuilder(csvHeader()).append("\n");
        for (int i = 0; i < records.size(); i++) {
            HouseRecord r = records.get(i);
            sb.append(String.format("%.0f,%d,%.1f,%d,%.0f,%.1f,%.1f,%.0f,%.2f\n",
                    r.squareFootage(), r.bedrooms(), r.bathrooms(),
                    r.yearBuilt(), r.lotSize(),
                    r.distanceToCityCenter(), r.schoolRating(),
                    r.price(), predictions.get(i)));
        }
        return sb.toString();
    }

    private String csvHeader() {
        return "square_footage,bedrooms,bathrooms,year_built,lot_size,distance_to_city_center,school_rating,actual_price,predicted_price";
    }
}
