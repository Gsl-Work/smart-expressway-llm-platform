/* ============================================================
   数据查询模块视图（views-data.js）
   P4-01 自然语言数据查询 / P4-02 查询结果与可视化
   P4-03 数据字典维护 / P4-04 接口监控看板
   ============================================================ */
(function () {
  "use strict";

  /* ==================== P4-01 自然语言数据查询 ==================== */
  App.register("data-query", el => {
    el.innerHTML = `
      ${App.header("自然语言数据查询", "用自然语言描述查询需求，系统解析为 SQL 并执行（数据范围受角色权限约束）")}
      <div class="card">
        <div class="search-bar" style="margin-bottom:0">
          <input class="input" id="nlInput" style="width:100%;height:40px;font-size:14px" placeholder="例如：查一下各路段8月份的通行费收入和流量对比" value="各路段8月份的通行费收入、总流量和事件数">
          <button class="btn primary lg" id="nlRun" style="height:40px">执行查询</button>
        </div>
        <div class="mt-8" id="nlSug"></div>
      </div>
      <div id="nlResult"></div>`;

    // 推荐问题
    const sug = el.querySelector("#nlSug");
    DB.querySuggests.forEach(q => {
      const s = document.createElement("span");
      s.className = "tag blue"; s.style.cursor = "pointer"; s.style.marginRight = "8px";
      s.textContent = q;
      s.onclick = () => { el.querySelector("#nlInput").value = q; };
      sug.appendChild(s);
    });

    el.querySelector("#nlRun").onclick = run;
    el.querySelector("#nlInput").addEventListener("keydown", e => { if (e.key === "Enter") run(); });

    async function run() {
      const q = el.querySelector("#nlInput").value.trim();
      if (!q) { U.toast("请输入查询需求", "warning"); return; }
      const box = el.querySelector("#nlResult");
      const steps = [["意图识别与实体抽取", 0.6], ["数据范围校验（角色权限）", 0.4], ["SQL 生成与校验", 0.5], ["执行查询", 0.8], ["结果组装", 0.3]];
      box.innerHTML = `
        <div class="card">
          <div class="card-title">解析过程</div>
          <div id="nlSteps">${steps.map((s, i) => `
            <div class="flex align-c gap-12" style="padding:7px 0" data-s="${i}">
              <span class="st-i" style="width:20px">${i === 0 ? "▶" : "○"}</span>
              <span class="flex-1">${s[0]}</span><span class="text-sub text-sm st-t"></span>
            </div>`).join("")}
          </div>
        </div>`;
      const els = box.querySelectorAll("[data-s]");
      for (let i = 0; i < steps.length; i++) {
        if (i) { els[i - 1].querySelector(".st-i").innerHTML = "<span style='color:var(--success)'>✓</span>"; els[i - 1].querySelector(".st-t").textContent = steps[i - 1][1] + "s"; }
        els[i].querySelector(".st-i").innerHTML = "▶";
        await U.delay(steps[i][1] * 1000);
      }
      els[els.length - 1].querySelector(".st-i").innerHTML = "<span style='color:var(--success)'>✓</span>";
      els[els.length - 1].querySelector(".st-t").textContent = steps[4][1] + "s";
      DB.queryHistory.unshift({ id: "Q" + Math.floor(3019 + Math.random() * 40), text: q, sql: DB.queryResult.sql, time: Date.now(), duration: "2.1s", rows: DB.queryResult.rows.length, user: (App.user || {}).name || "当前用户" });
      renderResult(box, q);
    }

    function renderResult(box, q) {
      const R = DB.queryResult;
      box.insertAdjacentHTML("beforeend", `
        <div class="card">
          <div class="flex justify-b align-c mb-16">
            <div class="card-title" style="margin:0">查询结果<span class="ct-extra">共 ${R.rows.length} 行 · 耗时 2.1s</span></div>
            <div class="flex gap-8">
              <button class="btn sm" id="nlSql">查看 SQL</button>
              <button class="btn sm" id="nlCsv">导出 CSV</button>
              <button class="btn sm primary" onclick="App.nav('data-viz')">图表分析 →</button>
            </div>
          </div>
          <div class="kv-list mb-16" style="grid-template-columns:repeat(4,1fr)">
            <div class="kv"><span class="k">维度</span><span>${R.intent.dims.join("、")}</span></div>
            <div class="kv"><span class="k">指标</span><span>${R.intent.metrics.join("、")}</span></div>
            <div class="kv"><span class="k">筛选条件</span><span>${R.intent.filter}</span></div>
            <div class="kv"><span class="k">权限范围</span><span>${R.intent.scope}</span></div>
          </div>
          <div class="tbl-wrap"><table class="tbl">
            <thead><tr>${R.columns.map(c => `<th>${c}</th>`).join("")}</tr></thead>
            <tbody>${R.rows.map(r => `<tr>${r.map((v, i) => `<td>${i === 0 ? v : U.fmtNum(v)}</td>`).join("")}</tr>`).join("")}</tbody>
          </table></div>
        </div>
        <div class="card">
          <div class="card-title">最近查询</div>
          <div id="nlHist"></div>
        </div>`);
      box.querySelector("#nlSql").onclick = () => U.modal({
        title: "生成的 SQL（只读）",
        body: `<pre class="mono" style="background:var(--bg);padding:14px;border-radius:8px;white-space:pre-wrap;font-size:12.5px">${U.esc(R.sql)}</pre>`,
        footer: null
      });
      box.querySelector("#nlCsv").onclick = () => U.toast("原型演示：结果已导出 CSV（含数据水印）", "success");
      U.renderTable(box.querySelector("#nlHist"), {
        rows: DB.queryHistory.slice(0, 6),
        pageSize: 6,
        cols: [
          { title: "查询内容", key: "text" },
          { title: "执行人", key: "user", width: "90px" },
          { title: "执行时间", key: "time", render: r => U.fmtTime(r.time), width: "150px" },
          { title: "耗时 / 行数", render: r => `${r.duration} · ${r.rows} 行`, width: "110px" },
          { title: "操作", width: "80px", render: () => `<button class="btn link sm">重新执行</button>` }
        ]
      });
    }
  });

  /* ==================== P4-02 查询结果与可视化 ==================== */
  App.register("data-viz", el => {
    let mode = "bar";
    el.innerHTML = `
      ${App.header("查询结果与可视化", "对查询结果进行图表化分析与方案保存", `
        <div class="btn-group">
          <button class="btn sm ${mode === "bar" ? "primary" : ""}" data-m="bar">柱状图</button>
          <button class="btn sm ${mode === "line" ? "primary" : ""}" data-m="line">折线图</button>
          <button class="btn sm ${mode === "donut" ? "primary" : ""}" data-m="donut">占比图</button>
        </div>
        <button class="btn" id="vzSave">保存方案</button>`)}
      <div class="grid cols-2">
        <div class="card">
          <div class="card-title">各路段通行费收入（2026-08）<span class="ct-extra">单位：万元</span></div>
          <div class="chart-box"><canvas id="vzChart"></canvas></div>
        </div>
        <div class="card">
          <div class="card-title">明细数据</div>
          <div class="tbl-wrap"><table class="tbl">
            <thead><tr>${DB.queryResult.columns.map(c => `<th>${c}</th>`).join("")}</tr></thead>
            <tbody>${DB.queryResult.rows.map(r => `<tr>${r.map((v, i) => `<td>${i === 0 ? U.esc(v) : U.fmtNum(v)}</td>`).join("")}</tr>`).join("")}</tbody>
          </table></div>
        </div>
      </div>
      <div class="card">
        <div class="card-title">我的可视化方案</div>
        ${[
          ["各路段通行费月度对比（柱状）", "孙浩然 · 分享给集团运营部", "2026-08-30"],
          ["断面流量30天趋势（折线）", "孙浩然 · 私有", "2026-08-25"],
          ["绿通查验通过率TOP5（占比）", "何雨欣 · 分享给稽查大队", "2026-08-18"]
        ].map(([n, s, t]) => `
          <div class="flex justify-b align-c" style="padding:10px 0;border-bottom:1px solid var(--border-2)">
            <div><span class="fwb">${n}</span><div class="text-sub text-sm">${s}</div></div>
            <div class="flex align-c gap-8"><span class="text-sub text-sm">${t}</span>
              <button class="btn sm">打开</button><button class="btn sm danger">删除</button></div>
          </div>`).join("")}
      </div>`;

    const R = DB.queryResult;
    const labels = R.rows.map(r => r[0].replace("高速", "").slice(0, 8));
    function draw() {
      const c = el.querySelector("#vzChart");
      if (mode === "bar") U.barChart(c, { labels, data: R.rows.map(r => r[2]), showValue: true, color: "#185FA5" });
      else if (mode === "line") U.lineChart(c, { labels, series: [{ name: "通行费收入", data: R.rows.map(r => r[2]) }] });
      else U.donutChart(c, { data: R.rows.map((r, i) => ({ name: labels[i], value: r[2] })) });
    }
    el.querySelectorAll("[data-m]").forEach(b => b.onclick = () => {
      mode = b.dataset.m;
      el.querySelectorAll("[data-m]").forEach(x => x.classList.toggle("primary", x === b));
      draw();
    });
    el.querySelector("#vzSave").onclick = () => U.modal({
      title: "保存可视化方案",
      body: `
        <div class="form-item"><label>方案名称<span class="req">*</span></label><input class="input" value="各路段通行费收入对比（${U.fmtDate(Date.now())}）"></div>
        <div class="form-item"><label>图表类型</label><input class="input" value="${{ bar: "柱状图", line: "折线图", donut: "占比图" }[mode]}" disabled></div>
        <div class="form-item"><label>共享范围</label>
          <label class="radio"><input type="radio" name="vzShare" checked>私有</label>
          <label class="radio"><input type="radio" name="vzShare">本部门</label>
          <label class="radio"><input type="radio" name="vzShare">全集团</label></div>`,
      onOk: () => U.toast("方案已保存，可在下方方案列表中打开", "success")
    });
    requestAnimationFrame(draw);
    window.addEventListener("resize", U.debounce(draw, 300));
  });

  /* ==================== P4-03 数据字典维护 ==================== */
  App.register("data-dict", el => {
    el.innerHTML = `
      ${App.header("数据字典维护", "数据表与字段元数据管理，供自然语言查询理解语义", `
        <button class="btn primary" id="dcNew">＋ 新增字段</button>`)}
      <div class="card">
        <div class="search-bar">
          <input class="input" id="dcKw" placeholder="搜索表名 / 字段 / 中文名">
          <select class="input w-140" id="dcTable"><option value="">全部数据表</option>${[...new Set(DB.dict.map(d => d.table))].map(t => `<option>${t}</option>`).join("")}</select>
          <label class="checkbox"><input type="checkbox" id="dcSens">仅看敏感字段</label>
          <span class="flex-gap"></span><span class="text-sub text-sm" id="dcCount"></span>
        </div>
        <div id="dcTableBox"></div>
      </div>`;

    function draw() {
      const kw = el.querySelector("#dcKw").value.trim().toLowerCase();
      const tb = el.querySelector("#dcTable").value;
      const sens = el.querySelector("#dcSens").checked;
      const rows = DB.dict.filter(d =>
        (!kw || d.field.toLowerCase().includes(kw) || d.fieldCn.includes(kw) || d.tableCn.includes(kw)) &&
        (!tb || d.table === tb) && (!sens || d.sensitive));
      el.querySelector("#dcCount").textContent = `共 ${rows.length} 个字段`;
      U.renderTable(el.querySelector("#dcTableBox"), {
        rows,
        pageSize: 10,
        rowClick: d => openEdit(d),
        cols: [
          { title: "数据表", key: "tableCn", width: "120px", render: d => `${U.esc(d.tableCn)}<br><span class="mono text-sub">${d.table}</span>` },
          { title: "字段", key: "field", render: d => `<span class="mono">${d.field}</span>` },
          { title: "中文名", key: "fieldCn", width: "110px" },
          { title: "类型", key: "type", width: "120px", render: d => `<span class="tag blue">${d.type}</span>` },
          { title: "枚举 / 单位", width: "200px", render: d => d.enum !== "-" ? U.esc(d.enum) : U.esc(d.unit) },
          { title: "敏感", key: "sensitive", width: "70px", render: d => d.sensitive ? `<span class="tag red">敏感</span>` : "-" },
          { title: "责任人", key: "owner", width: "80px" },
          { title: "操作", width: "110px", render: () => `<button class="btn link sm">编辑</button><button class="btn link sm danger">停用</button>` }
        ]
      });
    }
    ["dcKw", "dcTable", "dcSens"].forEach(id => {
      const n = el.querySelector("#" + id);
      n.oninput = U.debounce(draw, 250); n.onchange = draw;
    });
    function openEdit(d) {
      U.modal({
        title: "编辑字段元数据 · " + d.field,
        width: "w-720",
        body: `
          <div class="form-row">
            <div class="form-item"><label>字段名</label><input class="input" value="${d.field}" disabled></div>
            <div class="form-item"><label>中文名<span class="req">*</span></label><input class="input" id="deCn" value="${U.esc(d.fieldCn)}"></div>
          </div>
          <div class="form-row">
            <div class="form-item"><label>数据类型</label><input class="input" value="${d.type}" disabled></div>
            <div class="form-item"><label>单位</label><input class="input" id="deUnit" value="${U.esc(d.unit)}"></div>
          </div>
          <div class="form-item"><label>枚举值（顿号分隔）</label><input class="input" id="deEnum" value="${U.esc(d.enum)}"></div>
          <div class="form-item"><label>业务含义<span class="req">*</span></label><textarea class="input" rows="2" id="deDesc">${U.esc(d.desc)}</textarea></div>
          <div class="form-item"><label>敏感等级</label>
            <label class="radio"><input type="radio" name="deSens" ${d.sensitive ? "" : "checked"}>非敏感</label>
            <label class="radio"><input type="radio" name="deSens" ${d.sensitive ? "checked" : ""}>敏感（查询自动脱敏）</label>
          </div>`,
        onOk() {
          d.fieldCn = document.getElementById("deCn").value || d.fieldCn;
          d.desc = document.getElementById("deDesc").value || d.desc;
          U.toast("字段元数据已更新，下次查询生效", "success"); draw();
        }
      });
    }
    el.querySelector("#dcNew").onclick = () => {
      U.modal({
        title: "新增字段元数据",
        width: "w-720",
        body: `
          <div class="form-row">
            <div class="form-item"><label>所属数据表</label><select class="input">${[...new Set(DB.dict.map(d => d.tableCn))].map(t => `<option>${t}</option>`).join("")}</select></div>
            <div class="form-item"><label>字段名<span class="req">*</span></label><input class="input" placeholder="如 flow_peak"></div>
          </div>
          <div class="form-row">
            <div class="form-item"><label>中文名<span class="req">*</span></label><input class="input" placeholder="如 高峰流量"></div>
            <div class="form-item"><label>单位</label><input class="input" placeholder="如 辆/小时"></div>
          </div>
          <div class="form-item"><label>业务含义<span class="req">*</span></label><textarea class="input" rows="2"></textarea></div>`,
        onOk: () => U.toast("字段已登记，待数据组核对后生效", "success")
      });
    };
    draw();
  });

  /* ==================== P4-04 接口监控看板 ==================== */
  App.register("data-monitor", el => {
    const stMap = { healthy: { text: "正常", cls: "green" }, warn: { text: "告警", cls: "orange" }, down: { text: "故障", cls: "red" } };
    el.innerHTML = `
      ${App.header("接口监控看板", "平台全部 API 的实时运行状态（数据每 30 秒自动刷新）", `
        <select class="input" id="monRange" style="width:130px;height:34px"><option>近 24 小时</option><option>近 7 天</option><option>近 30 天</option></select>`)}
      <div class="grid cols-4 mb-16">
        <div class="stat-card"><div class="sc-icon" style="background:var(--success-light);color:var(--success)">✓</div><div><div class="sc-value">6/8</div><div class="sc-label">健康接口</div></div></div>
        <div class="stat-card"><div class="sc-icon" style="background:var(--primary-light);color:var(--primary)">⚡</div><div><div class="sc-value">${DB.kpi.modelQPS}</div><div class="sc-label">推理网关 QPS</div></div></div>
        <div class="stat-card"><div class="sc-icon" style="background:var(--warning-light);color:var(--warning)">⏱</div><div><div class="sc-value">4.2s</div><div class="sc-label">问答 P95 时延</div></div></div>
        <div class="stat-card"><div class="sc-icon" style="background:var(--danger-light);color:var(--danger)">⚠</div><div><div class="sc-value">${DB.kpi.modelErrRate}%</div><div class="sc-label">推理网关错误率</div><div class="sc-trend up">▲ 超阈值（3%）</div></div></div>
      </div>
      <div class="card">
        <div class="card-title">请求量与错误率趋势<span class="ct-extra">近 24 小时 · 每小时采样</span></div>
        <div class="chart-box"><canvas id="monChart" style="height:240px"></canvas></div>
        <div class="legend">
          <span class="lg-item"><span class="lg-dot" style="background:#185FA5"></span>请求量（万次）</span>
          <span class="lg-item"><span class="lg-dot" style="background:#E0705C"></span>错误率（%）</span>
        </div>
      </div>
      <div class="grid cols-2">
        <div class="card">
          <div class="card-title">今日调用 Top 5</div>
          <div class="chart-box"><canvas id="monTop"></canvas></div>
        </div>
        <div class="card">
          <div class="card-title">告警事件</div>
          <div class="timeline">
            <div class="tl-item hot"><div class="tl-time">${U.fmtTime(Date.now() - 25 * 60e3)} · 触发</div>
              <div class="tl-text"><span class="tag red">P1</span> 模型推理网关错误率 3.82%，超过阈值 3%（持续 15 分钟）<br>
              <button class="btn sm mt-8" onclick="U.toast('已通知值班运维：郑海涛','success')">派单处理</button>
              <button class="btn sm mt-8" onclick="U.toast('告警已确认','success')">确认</button></div></div>
            <div class="tl-item"><div class="tl-time">${U.fmtTime(Date.now() - 6 * 36e5)} · 已恢复</div>
              <div class="tl-text"><span class="tag orange">P2</span> 文档生成接口 P95 时延 62s，超过阈值 60s（持续 8 分钟）</div></div>
            <div class="tl-item"><div class="tl-time">${U.fmtTime(Date.now() - 15 * 36e5)} · 已恢复</div>
              <div class="tl-text"><span class="tag orange">P2</span> 知识检索接口 QPS 达到限流阈值 80%，自动扩容完成</div></div>
          </div>
        </div>
      </div>
      <div class="card">
        <div class="card-title">接口清单</div>
        <div id="monTable"></div>
      </div>`;

    function draw() {
      U.renderTable(el.querySelector("#monTable"), {
        rows: DB.interfaces,
        pageSize: 8,
        cols: [
          { title: "接口", key: "name" },
          { title: "状态", key: "status", width: "80px", render: r => U.statusTag(stMap, r.status) },
          { title: "实时 QPS", key: "qps", width: "100px" },
          { title: "P95 时延", key: "p95", width: "100px" },
          { title: "错误率", key: "errRate", width: "100px", render: r => `<span style="color:${r.errRate > 3 ? "var(--danger)" : r.errRate > 1 ? "var(--warning)" : "inherit"}">${r.errRate}%</span>` },
          { title: "今日调用量", key: "today", render: r => U.fmtNum(r.today), width: "110px" },
          { title: "操作", width: "100px", render: () => `<button class="btn link sm" onclick="U.toast('原型演示：接口详情与依赖拓扑','info')">详情</button>` }
        ]
      });
    }
    draw();

    requestAnimationFrame(() => {
      const hours = Array.from({ length: 24 }, (_, i) => `${U.pad((new Date(Date.now() - (23 - i) * 36e5)).getHours())}时`);
      U.lineChart(el.querySelector("#monChart"), {
        labels: hours,
        series: [
          { name: "请求量", data: [3.1, 2.4, 1.8, 1.5, 1.6, 2.2, 3.8, 5.6, 7.2, 8.1, 8.4, 8.2, 7.9, 8.3, 8.6, 8.4, 8.1, 7.6, 6.8, 6.2, 5.4, 4.8, 4.2, 3.6] },
          { name: "错误率", data: [0.2, 0.2, 0.1, 0.1, 0.2, 0.3, 0.4, 0.6, 0.8, 0.9, 1.2, 1.1, 1.4, 1.6, 1.8, 2.1, 2.6, 3.1, 3.5, 3.8, 3.6, 2.9, 2.2, 1.8], color: "#E0705C" }
        ], height: 240
      });
      U.barChart(el.querySelector("#monTop"), {
        labels: DB.interfaces.slice().sort((a, b) => b.today - a.today).slice(0, 5).map(i => i.name.split(" ")[0]),
        data: DB.interfaces.slice().sort((a, b) => b.today - a.today).slice(0, 5).map(i => i.today / 10000),
        showValue: true
      });
    });
  });
})();
