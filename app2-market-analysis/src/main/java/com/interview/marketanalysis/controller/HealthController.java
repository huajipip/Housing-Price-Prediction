package com.interview.marketanalysis.controller;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.client.RestClient;

import java.util.Map;

/**
 * 健康检查端点。
 *
 * <p>返回自身状态 + Task 1 连通性。与 App1 的 health 端点设计一致：
 * 即使 Task 1 不可达也返回 200，通过 status 字段告知真实状态。
 */
@RestController
@RequestMapping("/api/app2")
public class HealthController {

    private final RestClient task1RestClient;

    public HealthController(RestClient task1RestClient) {
        this.task1RestClient = task1RestClient;
    }

    @GetMapping("/health")
    public Map<String, Object> health() {
        boolean task1Connected;
        try {
            task1RestClient.get()
                    .uri("/health")
                    .retrieve()
                    .toBodilessEntity();
            task1Connected = true;
        } catch (Exception e) {
            task1Connected = false;
        }

        return Map.of(
                "status", task1Connected ? "healthy" : "degraded",
                "task1_connected", task1Connected
        );
    }
}
