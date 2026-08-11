package com.interview.marketanalysis.dto;

import jakarta.validation.Validation;
import jakarta.validation.Validator;
import org.junit.jupiter.api.Test;

import java.util.Set;
import java.util.stream.Collectors;

import static org.junit.jupiter.api.Assertions.assertTrue;

/**
 * HouseFeatures 输入校验的单元测试（纯 JUnit，不启动 Spring 上下文）。
 *
 * <p>直接用 jakarta Validation API 的 Validator 校验 record 实例，
 * 验证各字段约束（范围与训练数据集 feature_stats.json 一致）真实生效。
 *
 * <p>合法输入：square_footage 980–2400 / bedrooms 2–4 / bathrooms 1–3 /
 * year_built 1978–2012 / lot_size 4400–10500 / distance 2.1–8.2 / school_rating 6.5–9.1
 *
 * <p>运行：在 app2-market-analysis/ 目录下执行 {@code mvn test}
 */
class HouseFeaturesValidationTest {

    private final Validator validator =
            Validation.buildDefaultValidatorFactory().getValidator();

    /** 一组合法的输入（均落在训练数据范围内）。 */
    private HouseFeatures valid() {
        return new HouseFeatures(1500, 3, 2, 1997, 6800, 4.1, 7.6);
    }

    /** 返回校验失败的字段名集合（record 组件名，如 squareFootage）。 */
    private Set<String> failedFields(HouseFeatures f) {
        return validator.validate(f).stream()
                .map(v -> v.getPropertyPath().toString())
                .collect(Collectors.toSet());
    }

    @Test
    void validFeatures_passValidation() {
        assertTrue(validator.validate(valid()).isEmpty());
    }

    @Test
    void bedroomsAboveTrainingMax_fails() {
        // bedrooms=5 超出训练集最大值 4
        HouseFeatures f = new HouseFeatures(1500, 5, 2, 1997, 6800, 4.1, 7.6);
        assertTrue(failedFields(f).contains("bedrooms"));
    }

    @Test
    void squareFootageBelowTrainingMin_fails() {
        // square_footage=500 低于训练集最小值 980
        HouseFeatures f = new HouseFeatures(500, 3, 2, 1997, 6800, 4.1, 7.6);
        assertTrue(failedFields(f).contains("squareFootage"));
    }

    @Test
    void schoolRatingAboveTrainingMax_fails() {
        // school_rating=9.5 超出训练集最大值 9.1
        HouseFeatures f = new HouseFeatures(1500, 3, 2, 1997, 6800, 4.1, 9.5);
        assertTrue(failedFields(f).contains("schoolRating"));
    }

    @Test
    void yearBuiltBelowTrainingMin_fails() {
        // year_built=1900 低于训练集最小值 1978
        HouseFeatures f = new HouseFeatures(1500, 3, 2, 1900, 6800, 4.1, 7.6);
        assertTrue(failedFields(f).contains("yearBuilt"));
    }
}
