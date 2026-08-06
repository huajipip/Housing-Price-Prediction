package com.interview.marketanalysis.service;

import com.interview.marketanalysis.dto.HouseFeatures;
import com.interview.marketanalysis.dto.WhatIfRequest;
import com.interview.marketanalysis.dto.WhatIfResponse;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;

/**
 * What-If 分析服务 — 在特征范围内采样并批量预测。
 *
 * <p>核心逻辑：在 varyMin～varyMax 范围内均匀取 N 个点，
 * 每次创建一个新的 HouseFeatures（仅改变目标特征），
 * 批量调用 Task 1 预测，返回 (特征值, 预测价格) 数据点列表。
 */
@Service
public class WhatIfService {

    private final Task1Client task1Client;

    public WhatIfService(Task1Client task1Client) {
        this.task1Client = task1Client;
    }

    /**
     * 执行 What-If 分析。
     *
     * @param request 包含基准特征 + 变化参数
     * @return 包含数据点列表的响应
     */
    public WhatIfResponse analyze(WhatIfRequest request) {
        int steps = Math.max(request.steps(), 2);
        double stepSize = (request.varyMax() - request.varyMin()) / (steps - 1);

        // 生成 N 个 HouseFeatures，每个仅改变 varyFeature 的值
        List<HouseFeatures> variants = new ArrayList<>();
        List<Double> featureValues = new ArrayList<>();

        for (int i = 0; i < steps; i++) {
            double variedValue = request.varyMin() + i * stepSize;
            featureValues.add(variedValue);
            variants.add(applyVariation(request.baseFeatures(), request.varyFeature(), variedValue));
        }

        // 批量调用 Task 1 预测（一次 HTTP 请求）
        List<Double> predictions = task1Client.predictBatch(variants);

        // 组装数据点
        List<WhatIfResponse.DataPoint> dataPoints = new ArrayList<>();
        for (int i = 0; i < steps; i++) {
            dataPoints.add(new WhatIfResponse.DataPoint(featureValues.get(i), predictions.get(i)));
        }

        return new WhatIfResponse(request.varyFeature(), dataPoints);
    }

    /**
     * 复制基准特征，仅改变指定字段的值。
     */
    private HouseFeatures applyVariation(HouseFeatures base, String feature, double value) {
        return switch (feature) {
            case "square_footage" -> new HouseFeatures(value, base.bedrooms(), base.bathrooms(),
                    base.yearBuilt(), base.lotSize(), base.distanceToCityCenter(), base.schoolRating());
            case "bedrooms" -> new HouseFeatures(base.squareFootage(), (int) value, base.bathrooms(),
                    base.yearBuilt(), base.lotSize(), base.distanceToCityCenter(), base.schoolRating());
            case "bathrooms" -> new HouseFeatures(base.squareFootage(), base.bedrooms(), value,
                    base.yearBuilt(), base.lotSize(), base.distanceToCityCenter(), base.schoolRating());
            case "year_built" -> new HouseFeatures(base.squareFootage(), base.bedrooms(), base.bathrooms(),
                    (int) value, base.lotSize(), base.distanceToCityCenter(), base.schoolRating());
            case "lot_size" -> new HouseFeatures(base.squareFootage(), base.bedrooms(), base.bathrooms(),
                    base.yearBuilt(), value, base.distanceToCityCenter(), base.schoolRating());
            case "distance_to_city_center" -> new HouseFeatures(base.squareFootage(), base.bedrooms(), base.bathrooms(),
                    base.yearBuilt(), base.lotSize(), value, base.schoolRating());
            case "school_rating" -> new HouseFeatures(base.squareFootage(), base.bedrooms(), base.bathrooms(),
                    base.yearBuilt(), base.lotSize(), base.distanceToCityCenter(), value);
            default -> base;
        };
    }
}
