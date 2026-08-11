package com.interview.marketanalysis.controller;

import com.interview.marketanalysis.dto.WhatIfRequest;
import com.interview.marketanalysis.dto.WhatIfResponse;
import com.interview.marketanalysis.service.WhatIfService;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.*;

/**
 * What-If 分析控制器 — 情景模拟：改变单一特征观察预测价格变化。
 */
@RestController
@RequestMapping("/api/app2")
public class WhatIfController {

    private final WhatIfService whatIfService;

    public WhatIfController(WhatIfService whatIfService) {
        this.whatIfService = whatIfService;
    }

    /**
     * 执行 What-If 分析。
     *
     * <p>请求体包含基准特征 + 变化参数（哪个特征、范围、采样点数）。
     * 返回 (特征值, 预测价格) 数据点列表供前端画折线图。
     */
    @PostMapping("/what-if")
    public WhatIfResponse analyze(@RequestBody @Valid WhatIfRequest request) {
        return whatIfService.analyze(request);
    }
}
