package com.interview.marketanalysis;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.cache.annotation.EnableCaching;

/**
 * App2 — Property Market Analysis 启动入口。
 *
 * <p>职责：
 * <ul>
 *   <li>提供房产市场聚合统计 API</li>
 *   <li>What-If 情景分析</li>
 *   <li>数据导出（CSV）</li>
 *   <li>作为 Task 1 ML 模型的代理客户端</li>
 * </ul>
 *
 * <p>技术栈：Java 21 + Spring Boot 3.4.4 + Caffeine Cache
 */
@SpringBootApplication
@EnableCaching
public class MarketAnalysisApplication {

    public static void main(String[] args) {
        SpringApplication.run(MarketAnalysisApplication.class, args);
    }
}
