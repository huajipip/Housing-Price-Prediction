package com.interview.marketanalysis.service;

import jakarta.annotation.PostConstruct;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.core.io.ClassPathResource;
import org.springframework.stereotype.Component;

import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;

/**
 * 数据加载器 — 应用启动时从 CSV 文件加载房源数据到内存。
 *
 * <p>设计决策：不使用数据库。数据集仅 ~10 行演示数据，
 */
@Component
public class DataLoader {

    private static final Logger log = LoggerFactory.getLogger(DataLoader.class);

    private List<HouseRecord> records = new ArrayList<>();

    /**
     * 启动后自动加载 CSV。
     */
    @PostConstruct // 自动执行且只调用一次
    public void load() {
        try {
            var resource = new ClassPathResource("housing-data.csv");
            try (var reader = new BufferedReader(
                    new InputStreamReader(resource.getInputStream(), StandardCharsets.UTF_8))) {

                // 跳过表头
                String header = reader.readLine();
                log.info("CSV 表头: {}", header);

                String line;
                while ((line = reader.readLine()) != null) {
                    String[] fields = line.split(",");
                    if (fields.length < 8) continue;

                    records.add(new HouseRecord(
                            Double.parseDouble(fields[1].trim()),   // square_footage
                            Integer.parseInt(fields[2].trim()),      // bedrooms
                            Double.parseDouble(fields[3].trim()),    // bathrooms
                            Integer.parseInt(fields[4].trim()),      // year_built
                            Double.parseDouble(fields[5].trim()),    // lot_size
                            Double.parseDouble(fields[6].trim()),    // distance_to_city_center
                            Double.parseDouble(fields[7].trim()),    // school_rating
                            Double.parseDouble(fields[8].trim())     // price
                    ));
                }
            }
            log.info("已加载 {} 条房源数据到内存。", records.size());
        } catch (Exception e) {
            log.error("加载 CSV 数据失败", e);
            records = Collections.emptyList();
        }
    }

    /**
     * 返回只读视图，防止外部修改。
     */
    public List<HouseRecord> getRecords() {
        return Collections.unmodifiableList(records);
    }
}
