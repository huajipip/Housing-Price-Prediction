package com.interview.marketanalysis.controller;

import com.interview.marketanalysis.dto.HouseFeatures;
import com.interview.marketanalysis.dto.PredictionResponse;
import com.interview.marketanalysis.service.Task1Client;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * 预测控制器 — 转发预测请求到 Task 1 ML 模型。
 */
@RestController
@RequestMapping("/api/app2")
public class PredictionController {

    private final Task1Client task1Client;

    public PredictionController(Task1Client task1Client) {
        this.task1Client = task1Client;
    }

    /**
     * 单条预测。
     *
     * <p>{@code @Valid} 触发 HouseFeatures 的 Bean Validation：字段范围必须与
     * 训练数据集一致，非法输入在此处返回 400
     */
    @PostMapping("/predict")
    public PredictionResponse predict(@RequestBody @Valid HouseFeatures features) {
        double price = task1Client.predictSingle(features);
        return new PredictionResponse(List.of(price));
    }

    /**
     * 批量预测。
     */
    @PostMapping("/predict/batch")
    public PredictionResponse predictBatch(@RequestBody @Valid List<HouseFeatures> featuresList) {
        List<Double> prices = task1Client.predictBatch(featuresList);
        return new PredictionResponse(prices);
    }
}
