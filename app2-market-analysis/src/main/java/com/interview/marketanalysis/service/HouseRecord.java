package com.interview.marketanalysis.service;

/**
 * 内部数据模型 — CSV 中的一行房源数据。
 *
 * <p>与 DTO 的 HouseFeatures 不同：此模型包含 price 字段（训练数据有标签），
 * 用于聚合统计计算；DTO 仅含特征字段（预测时不传价格）。
 */
public record HouseRecord(
        double squareFootage,
        int bedrooms,
        double bathrooms,
        int yearBuilt,
        double lotSize,
        double distanceToCityCenter,
        double schoolRating,
        double price
) {}
