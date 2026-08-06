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
     * @throws IllegalArgumentException 如果 varyMin >= varyMax 或特征名无效
     */
    public WhatIfResponse analyze(WhatIfRequest request) {
        // 校验：最小值必须小于最大值
        if (request.varyMin() >= request.varyMax()) {
            throw new IllegalArgumentException(
                    "varyMin (" + request.varyMin() + ") must be less than varyMax (" + request.varyMax() + ")");
        }

        String feature = request.varyFeature();
        int steps = Math.max(request.steps(), 2);

        // 如果前端传了自然步长（如 bedrooms=1, bathrooms=0.5），
        // 调整采样点数使其对齐到步长的整数倍，避免生成无意义的中间值（如 1.947 间卧室）
        double naturalStep = request.step();
        if (naturalStep > 0) {
            int alignedSteps = (int) Math.round((request.varyMax() - request.varyMin()) / naturalStep) + 1;
            steps = Math.min(steps, Math.max(alignedSteps, 2));
        }

        double stepSize = (request.varyMax() - request.varyMin()) / (steps - 1);

        // 生成 N 个 HouseFeatures，每个仅改变 varyFeature 的值
        List<HouseFeatures> variants = new ArrayList<>();
        List<Double> featureValues = new ArrayList<>();

        for (int i = 0; i < steps; i++) {
            double variedValue = request.varyMin() + i * stepSize;
            // 按自然步长对齐采样点（如浴室按 0.5 对齐，卧室按 1 对齐）
            if (naturalStep > 0) {
                variedValue = Math.round(variedValue / naturalStep) * naturalStep;
                // 消除 IEEE 754 浮点累积误差（如 0.1×34 = 3.4000000000000004）
                // 仅对小数步长（<1）做精度舍入，整数步长不需要
                if (naturalStep < 1) {
                    int decimals = Math.max(1, (int) Math.ceil(-Math.log10(naturalStep)));
                    double scale = Math.pow(10, decimals);
                    variedValue = Math.round(variedValue * scale) / scale;
                }
            }
            HouseFeatures variant = applyVariation(request.baseFeatures(), feature, variedValue);
            variants.add(variant);
            // 从 HouseFeatures 提取实际生效的特征值，确保 x 轴与预测输入一致
            featureValues.add(extractFeatureValue(variant, feature));
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
     * 从 HouseFeatures 中提取指定特征的实际值（已应用类型转换后的值）。
     *
     * <p>对于 integer 特征（bedrooms, year_built），返回强转后的 int 值；
     * 对于 double 特征，返回原始值。保证 x 轴显示值与传入预测模型的值一致。
     */
    private double extractFeatureValue(HouseFeatures features, String feature) {
        return switch (feature) {
            case "square_footage"       -> features.squareFootage();
            case "bedrooms"             -> features.bedrooms();       // int → double, 已是截断值
            case "bathrooms"            -> features.bathrooms();
            case "year_built"           -> features.yearBuilt();     // int → double, 已是截断值
            case "lot_size"             -> features.lotSize();
            case "distance_to_city_center" -> features.distanceToCityCenter();
            case "school_rating"        -> features.schoolRating();
            default -> throw new IllegalArgumentException("Unknown feature: " + feature);
        };
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
            default -> throw new IllegalArgumentException("Unknown feature: " + feature);
        };
    }
}
