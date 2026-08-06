package com.interview.marketanalysis.dto;

import java.util.List;

/**
 * 预测响应 DTO。
 */
public record PredictionResponse(List<Double> predictions) {}
