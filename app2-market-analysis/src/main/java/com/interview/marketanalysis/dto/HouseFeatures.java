package com.interview.marketanalysis.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;

/**
 * 房源特征输入 DTO — 对应 Task 1 的 7 个字段。
 *
 * <p>使用 Java record（不可变、自动生成构造器/getter/equals/hashCode/toString）。
 * {@code @JsonProperty} 确保 JSON 字段名与 Python 端 snake_case 一致。
 *
 * <p>校验约束：各字段范围与训练数据集实际分布（feature_stats.json）完全一致，
 * 非法输入返回 400
 */
public record HouseFeatures(
        @JsonProperty("square_footage")
        @DecimalMin(value = "980.0", message = "square_footage 必须在 [980, 2400] 范围内")
        @DecimalMax(value = "2400.0", message = "square_footage 必须在 [980, 2400] 范围内")
        double squareFootage,

        @JsonProperty("bedrooms")
        @Min(value = 2, message = "bedrooms 必须在 [2, 4] 范围内")
        @Max(value = 4, message = "bedrooms 必须在 [2, 4] 范围内")
        int bedrooms,

        @JsonProperty("bathrooms")
        @DecimalMin(value = "1.0", message = "bathrooms 必须在 [1, 3] 范围内")
        @DecimalMax(value = "3.0", message = "bathrooms 必须在 [1, 3] 范围内")
        double bathrooms,

        @JsonProperty("year_built")
        @Min(value = 1978, message = "year_built 必须在 [1978, 2012] 范围内")
        @Max(value = 2012, message = "year_built 必须在 [1978, 2012] 范围内")
        int yearBuilt,

        @JsonProperty("lot_size")
        @DecimalMin(value = "4400.0", message = "lot_size 必须在 [4400, 10500] 范围内")
        @DecimalMax(value = "10500.0", message = "lot_size 必须在 [4400, 10500] 范围内")
        double lotSize,

        @JsonProperty("distance_to_city_center")
        @DecimalMin(value = "2.1", message = "distance_to_city_center 必须在 [2.1, 8.2] 范围内")
        @DecimalMax(value = "8.2", message = "distance_to_city_center 必须在 [2.1, 8.2] 范围内")
        double distanceToCityCenter,

        @JsonProperty("school_rating")
        @DecimalMin(value = "6.5", message = "school_rating 必须在 [6.5, 9.1] 范围内")
        @DecimalMax(value = "9.1", message = "school_rating 必须在 [6.5, 9.1] 范围内")
        double schoolRating
) {}
