package com.interview.marketanalysis.controller;

import org.junit.jupiter.api.Test;
import org.springframework.core.MethodParameter;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.BindingResult;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.client.ResourceAccessException;

import java.util.List;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

/**
 * GlobalExceptionHandler 的单元测试（不启动 Spring 上下文）。
 *
 * <p>验证三类关键异常的统一响应：上游不可用(502)、业务参数错误(400)、兜底(500)。
 * 响应体结构必须与 App1 对齐：{error, message, detail}。
 */
class GlobalExceptionHandlerTest {

    private final GlobalExceptionHandler handler = new GlobalExceptionHandler();

    @Test
    void task1Unavailable_returns502WithFriendlyBody() {
        ResponseEntity<Map<String, Object>> resp =
                handler.handleTask1Unavailable(new ResourceAccessException("connect timed out"));

        assertEquals(HttpStatus.BAD_GATEWAY, resp.getStatusCode());
        assertEquals(true, resp.getBody().get("error"));
        assertTrue(((String) resp.getBody().get("message")).contains("暂不可用"));
    }

    @Test
    void illegalArgument_returns400() {
        ResponseEntity<Map<String, Object>> resp =
                handler.handleBadRequest(new IllegalArgumentException("未知特征: foo"));

        assertEquals(HttpStatus.BAD_REQUEST, resp.getStatusCode());
        assertTrue(((String) resp.getBody().get("message")).contains("未知特征"));
    }

    @Test
    void genericError_returns500() {
        ResponseEntity<Map<String, Object>> resp =
                handler.handleGeneric(new RuntimeException("boom"));

        assertEquals(HttpStatus.INTERNAL_SERVER_ERROR, resp.getStatusCode());
        assertTrue(((String) resp.getBody().get("message")).contains("内部错误"));
    }

    @Test
    void validationError_returns400WithFieldDetails() {
        // 模拟 @Valid 校验失败：某个字段超出训练数据范围
        BindingResult binding = mock(BindingResult.class);
        when(binding.getFieldErrors()).thenReturn(List.of(
                new FieldError("houseFeatures", "bedrooms", "bedrooms 必须在 [2, 4] 范围内")
        ));
        MethodArgumentNotValidException ex =
                new MethodArgumentNotValidException(mock(MethodParameter.class), binding);

        ResponseEntity<Map<String, Object>> resp = handler.handleValidationError(ex);

        // 参数错误 → 400，并携带具体字段信息
        assertEquals(HttpStatus.BAD_REQUEST, resp.getStatusCode());
        assertEquals(true, resp.getBody().get("error"));
        assertTrue(((String) resp.getBody().get("message")).contains("校验失败"));
        assertTrue(((String) resp.getBody().get("detail")).contains("bedrooms"));
    }
}
