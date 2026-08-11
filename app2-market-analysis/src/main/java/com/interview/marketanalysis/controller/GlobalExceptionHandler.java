package com.interview.marketanalysis.controller;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.client.ResourceAccessException;
import org.springframework.web.client.RestClientResponseException;

import java.util.LinkedHashMap;
import java.util.Map;
import java.util.stream.Collectors;

/**
 * 全局异常处理器 — 统一所有 controller 的错误响应格式。
 *
 * <p>与 App1（Python FastAPI）的错误格式保持一致：
 *   {"error": true, "message": "...", "detail": "..."}
 * 确保前端两个应用共用同一套错误处理逻辑。
 */
@RestControllerAdvice
public class GlobalExceptionHandler {

    private static final Logger log = LoggerFactory.getLogger(GlobalExceptionHandler.class);

    /** 构造统一错误响应体。 */
    private Map<String, Object> errorBody(String message, String detail) {
        Map<String, Object> body = new LinkedHashMap<>();
        body.put("error", true);
        body.put("message", message);
        body.put("detail", detail);
        return body;
    }

    /**
     * Task 1 连接失败 / 超时（ResourceAccessException）。
     * 属于"上游服务不可用"，返回 502 Bad Gateway。
     */
    @ExceptionHandler(ResourceAccessException.class)
    public ResponseEntity<Map<String, Object>> handleTask1Unavailable(ResourceAccessException ex) {
        log.error("Task 1 服务不可达或超时: {}", ex.getMessage());
        return ResponseEntity.status(HttpStatus.BAD_GATEWAY)
                .body(errorBody("Task 1 预测服务暂不可用，请稍后重试。", ex.getMessage()));
    }

    /**
     * Task 1 返回了 4xx/5xx（RestClientResponseException）。
     * 统一映射为 502，避免把上游错误细节直接暴露给客户端。
     */
    @ExceptionHandler(RestClientResponseException.class)
    public ResponseEntity<Map<String, Object>> handleTask1Error(RestClientResponseException ex) {
        log.error("Task 1 返回异常状态: status={}, body={}",
                ex.getStatusCode(), ex.getResponseBodyAsString());
        return ResponseEntity.status(HttpStatus.BAD_GATEWAY)
                .body(errorBody("Task 1 预测服务返回异常。", "上游 HTTP " + ex.getStatusCode()));
    }

    /**
     * 业务参数错误（如 getScatter 的未知特征名）。
     */
    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<Map<String, Object>> handleBadRequest(IllegalArgumentException ex) {
        log.warn("非法参数: {}", ex.getMessage());
        return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                .body(errorBody(ex.getMessage(), ex.getMessage()));
    }

    /**
     * 输入参数校验失败（@Valid 触发，如 HouseFeatures 字段超出训练数据范围）。
     *
     * <p>返回 400 与 App1 的错误格式保持一致。
     */
    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<Map<String, Object>> handleValidationError(MethodArgumentNotValidException ex) {
        log.warn("输入参数校验失败: {}", ex.getBindingResult().getFieldErrors());
        String detail = ex.getBindingResult().getFieldErrors().stream()
                .map(fe -> fe.getField() + ": " + fe.getDefaultMessage())
                .collect(Collectors.joining("; "));
        return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                .body(errorBody("输入参数校验失败，请检查字段范围。", detail));
    }

    /**
     * 兜底：未预期的异常 → 500，不向客户端泄露堆栈细节。
     */
    @ExceptionHandler(Exception.class)
    public ResponseEntity<Map<String, Object>> handleGeneric(Exception ex) {
        log.error("未处理异常", ex);
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(errorBody("服务器内部错误，请稍后重试。", ex.getClass().getSimpleName()));
    }
}
