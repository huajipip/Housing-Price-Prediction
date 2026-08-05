package com.interview.marketanalysis.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.cache.annotation.EnableCaching;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.client.RestClient;

/**
 * 应用配置：创建 RestClient Bean 用于调用 Task 1。
 *
 * <p>使用 Java 21 内置的 RestClient（替代 RestTemplate），
 * 支持同步阻塞调用。Task 1 调用场景简单，无需 WebClient 的响应式能力。
 */
@Configuration
@EnableCaching
public class AppConfig {

    @Value("${app.task1.base-url}")
    private String task1BaseUrl;

    /**
     * 创建预配置的 RestClient，基准 URL 指向 Task 1 容器。
     */
    @Bean
    public RestClient task1RestClient() {
        return RestClient.builder()
                .baseUrl(task1BaseUrl)
                .build();
    }

    /**
     * 用于非 Task 1 调用的通用 RestClient。
     */
    @Bean
    public RestClient restClient() {
        return RestClient.create();
    }
}
