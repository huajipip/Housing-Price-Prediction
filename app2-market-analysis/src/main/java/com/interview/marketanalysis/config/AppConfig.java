package com.interview.marketanalysis.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.web.client.RestClient;

/**
 * 应用配置：创建 RestClient Bean 用于调用 Task 1。
 *
 * <p>使用 Java 21 内置的 RestClient（替代 RestTemplate），
 * 支持同步阻塞调用。Task 1 调用场景简单，无需 WebClient 的响应式能力。
 */
@Configuration
public class AppConfig {

    @Value("${app.task1.base-url}")
    private String task1BaseUrl;

    /**
     * 创建预配置的 RestClient，基准 URL 指向 Task 1 容器。
     * 设置连接/读取超时，防止 Task 1 不可达时无限阻塞。
     */
    @Bean
    public RestClient task1RestClient() {
        SimpleClientHttpRequestFactory factory = new SimpleClientHttpRequestFactory();
        factory.setConnectTimeout(java.time.Duration.ofSeconds(5));
        factory.setReadTimeout(java.time.Duration.ofSeconds(10));

        return RestClient.builder()
                .baseUrl(task1BaseUrl)
                .requestFactory(factory)
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
