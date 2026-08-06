package com.interview.marketanalysis.service;

import com.interview.marketanalysis.dto.HouseFeatures;
import com.interview.marketanalysis.dto.PredictionResponse;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;

import java.util.List;
import java.util.Map;

/**
 * Task 1 HTTP 客户端 — 封装对 ML 模型容器的所有 REST 调用。
 *
 * <p>使用 Spring 6 的 RestClient（同步阻塞），Task 1 调用场景简单，
 * 无需 WebClient 的响应式能力。
 */
@Service
public class Task1Client {

    private static final Logger log = LoggerFactory.getLogger(Task1Client.class);

    private final RestClient task1RestClient;

    public Task1Client(RestClient task1RestClient) {
        this.task1RestClient = task1RestClient;
    }

    /**
     * 单条预测。
     */
    public double predictSingle(HouseFeatures features) {
        Map<String, Object> response = task1RestClient.post()
                .uri("/predict")
                .body(features)
                .retrieve()
                .body(Map.class);

        @SuppressWarnings("unchecked")
        List<Number> predictions = (List<Number>) response.get("predictions");
        if (predictions == null || predictions.isEmpty()) {
            throw new IllegalStateException("Task 1 returned empty or null predictions list");
        }
        return predictions.get(0).doubleValue();
    }

    /**
     * 批量预测。
     */
    public List<Double> predictBatch(List<HouseFeatures> featuresList) {
        Map<String, Object> response = task1RestClient.post()
                .uri("/predict")
                .body(featuresList)
                .retrieve()
                .body(Map.class);

        @SuppressWarnings("unchecked")
        List<Number> predictions = (List<Number>) response.get("predictions");
        if (predictions == null || predictions.size() != featuresList.size()) {
            throw new IllegalStateException(
                    "Task 1 predictions count (" + (predictions == null ? 0 : predictions.size())
                            + ") does not match request count (" + featuresList.size() + ")");
        }
        return predictions.stream().map(Number::doubleValue).toList();
    }

    /**
     * 获取模型信息（系数 + 性能指标）。
     */
    public Map<String, Object> getModelInfo() {
        return task1RestClient.get()
                .uri("/model-info")
                .retrieve()
                .body(Map.class);
    }
}
