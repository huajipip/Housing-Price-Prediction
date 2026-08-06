package com.interview.marketanalysis.dto;

import com.fasterxml.jackson.annotation.JsonProperty;

/**
 * 房源特征输入 DTO — 对应 Task 1 的 7 个字段。
 *
 * <p>使用 Java record（不可变、自动生成构造器/getter/equals/hashCode/toString）。
 * {@code @JsonProperty} 确保 JSON 字段名与 Python 端 snake_case 一致。
 */
public record HouseFeatures(
        @JsonProperty("square_footage") double squareFootage,
        @JsonProperty("bedrooms") int bedrooms,
        @JsonProperty("bathrooms") double bathrooms,
        @JsonProperty("year_built") int yearBuilt,
        @JsonProperty("lot_size") double lotSize,
        @JsonProperty("distance_to_city_center") double distanceToCityCenter,
        @JsonProperty("school_rating") double schoolRating
) {}
