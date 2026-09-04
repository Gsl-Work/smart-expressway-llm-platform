/* ============================================================
   知识库管理模块视图（views-kb.js）
   P3-01 总览 / P3-02 素材列表 / P3-03 批量导入 / P3-04 详情编辑
   P3-05 审核队列 / P3-06 冲突裁决 / P3-07 分类体系 / P3-08 解析异常
   ============================================================ */
(function () {
  "use strict";

  /* ==================== P3-01 知识库总览 ==================== */
  App.register("kb-overview", el => {
    el.innerHTML = `
      ${App.header("知识库总览", "知识资产规模、质量健康度与待办事项一览")}
      <div class="grid cols-4 mb-16">
        <div class="stat-card"><div class="sc-icon" style="background:var(--primary-light);color:var(--primary)">📚</div>
          <div><div class="sc-value">${U.fmtNum(DB.kpi.kbAssets)}</div><div class="sc-label">知识条目总量</div><div class="sc-trend up">▲ 本周 +23</div></div></div>
        <div class="stat-card"><div class="sc-icon" style="background:var(--warning-light);color:var(--warning)">⏳</div>
          <div><div class="sc-value">${DB.kpi.kbPending}</div><div class="sc-label">待审核</div><div class="sc-trend text-sub">SLA：48 小时</div></div></div>
        <div class="stat-card"><div class="sc-icon" style="background:var(--danger-light);color:var(--danger)">⚖</div>
          <div><div class="sc-value">${DB.kpi.kbConflicts}</div><div class="sc-label">知识冲突待裁决</div><div class="sc-trend text-sub">高于阈值 0</div></div></div>
        <div class="stat-card"><div class="sc-icon" style="background:var(--success-light);color:var(--success)">🔗</div>
          <div><div class="sc-value">3,204</div><div class="sc-label">近30天被引用次数</div><div class="sc-trend up">▲ 12.6%</div></div></div>
      </div>
      <div class="grid cols-2">
        <div class="card">
          <div class="card-title">知识资产分类分布<span class="ct-extra">按一级分类</span></div>
          <div class="chart-box"><canvas id="kbDonut"></canvas></div>
        </div>
        <div class="card">
          <div class="card-title">近14天入库趋势<span class="ct-extra">条/日</span></div>
          <div class="chart-box"><canvas id="kbTrend"></canvas></div>
        </div>
      </div>
      <div class="grid cols-2">
        <div class="card">
          <div class="card-title">我的待办</div>
          <div>
            <div class="msg-item" style="border-radius:8px" onclick="App.nav('kb-review')">
              <div class="mi-icon" style="background:var(--warning-light);color:var(--warning)">✅</div>
              <div class="mi-body"><div class="mi-title"><span class="fwb">知识审核</span><span class="mi-time">最新提交 ${U.fmtTime(Date.now() - 3 * 36e5)}</span></div>
              <div class="mi-desc">${DB.reviews.length} 条知识待审核（2 条高优先级）</div></div>
            </div>
            <div class="msg-item" style="border-radius:8px" onclick="App.nav('kb-conflict')">
              <div class="mi-icon" style="background:var(--danger-light);color:var(--danger)">⚖</div>
              <div class="mi-body"><div class="mi-title"><span class="fwb">冲突裁决</span><span class="mi-time">最新检出 ${U.fmtTime(Date.now() - 5 * 36e5)}</span></div>
              <div class="mi-desc">${DB.conflicts.length} 条知识冲突待人工裁决</div></div>
            </div>
            <div class="msg-item" style="border-radius:8px" onclick="App.nav('kb-exception')">
              <div class="mi-icon" style="background:var(--info-light);color:var(--info)">⚠</div>
              <div class="mi-body"><div class="mi-title"><span class="fwb">解析异常</span><span class="mi-time">最新 ${U.fmtTime(Date.now() - 8 * 36e5)}</span></div>
              <div class="mi-desc">${DB.exceptions.filter(e => e.status === "open").length} 个导入任务存在解析异常</div></div>
            </div>
          </div>
        </div>
        <div class="card">
          <div class="card-title">最近动态</div>
          <div class="timeline">
            ${[
              ["王志远（株洲分公司）提交《桥梁伸缩缝日常养护技术要求》待审核", Date.now() - 3 * 36e5],
              ["系统检出知识冲突：《恶劣天气能见度封闭阈值》两版本矛盾", Date.now() - 5 * 36e5],
              ["马俊杰批量导入《株洲分公司养护规程合集.zip》完成（85 成功 / 4 异常）", Date.now() - 8 * 36e5],
              ["李文静审核通过《假冒绿通车稽核取证要点》", Date.now() - 26 * 36e5],
              ["何雨欣提交《超限运输车辆认定与处置流程》待审核", Date.now() - 30 * 36e5]
            ].map(([t, time], i) => `
              <div class="tl-item ${i === 0 ? "hot" : ""}">
                <div class="tl-time">${U.fmtTime(time)}</div>
                <div class="tl-text">${U.esc(t)}</div>
              </div>`).join("")}
          </div>
        </div>
      </div>`;

    requestAnimationFrame(() => {
      U.donutChart(el.querySelector("#kbDonut"), { data: DB.donutAssets });
      U.barChart(el.querySelector("#kbTrend"), { labels: DB.statDays, data: [12, 18, 9, 24, 31, 16, 42, 28, 15, 22, 35, 19, 26, 23] });
    });
  });

  /* ==================== P3-02 知识素材列表 ==================== */
  App.register("kb-assets", el => {
    const stMap = { published: { text: "已发布", cls: "green" }, pending: { text: "待审核", cls: "orange" }, rejected: { text: "已驳回", cls: "red" } };
    const typeIcon = { doc: ["📄", "var(--primary-light)", "var(--primary)"], pdf: ["📕", "var(--danger-light)", "var(--danger)"] };
    let selected = [];

    el.innerHTML = `
      ${App.header("知识素材列表", "全部知识条目的检索与管理，支持批量操作", `
        <button class="btn" id="asExport">导出清单</button>
        <button class="btn primary" id="asNew">＋ 新增知识</button>`)}
      <div class="card">
        <div class="search-bar">
          <input class="input" id="asKw" placeholder="搜索标题 / 关键词 / 编号">
          <select class="input w-140" id="asCat"><option value="">全部分类</option>${["收费政策", "养护管理", "应急安全", "运营调度", "法规制度"].map(c => `<option>${c}</option>`).join("")}</select>
          <select class="input w-140" id="asSt"><option value="">全部状态</option><option value="published">已发布</option><option value="pending">待审核</option><option value="rejected">已驳回</option></select>
          <span class="flex-gap"></span>
          <span class="text-sub text-sm" id="asCount"></span>
          <button class="btn sm danger" id="asBatch" disabled>批量下架</button>
        </div>
        <div id="asTable"></div>
      </div>`;

    function draw() {
      const kw = el.querySelector("#asKw").value.trim().toLowerCase();
      const cat = el.querySelector("#asCat").value;
      const st = el.querySelector("#asSt").value;
      const rows = DB.assets.filter(a =>
        (!kw || a.title.toLowerCase().includes(kw) || a.id.toLowerCase().includes(kw)) &&
        (!cat || a.category.startsWith(cat)) && (!st || a.status === st));
      el.querySelector("#asCount").textContent = `共 ${rows.length} 条`;
      U.renderTable(el.querySelector("#asTable"), {
        rows,
        pageSize: 10,
        rowClick: a => openDetail(a),
        cols: [
          { title: "", width: "36px", render: a => `<input type="checkbox" data-ck="${a.id}" ${selected.includes(a.id) ? "checked" : ""}>` },
          { title: "编号", key: "id", width: "90px", render: a => `<span class="mono">${a.id}</span>` },
          { title: "知识标题", key: "title", render: a => {
              const ic = typeIcon[a.type] || typeIcon.doc;
              return `<span style="display:inline-flex;align-items:center;gap:8px">
                <span style="width:28px;height:28px;border-radius:6px;background:${ic[1]};color:${ic[2]};display:inline-flex;align-items:center;justify-content:center">${ic[0]}</span>
                <span class="cell-link">${U.esc(a.title)}</span></span>`;
            } },
          { title: "分类", key: "category", width: "150px" },
          { title: "来源", key: "source", width: "110px" },
          { title: "引用次数", key: "citations", width: "90px" },
          { title: "版本", key: "version", width: "70px" },
          { title: "状态", key: "status", width: "90px", render: a => U.statusTag(stMap, a.status) },
          { title: "更新时间", key: "updateTime", render: a => U.fmtDate(a.updateTime), width: "110px" }
        ],
        afterDraw(container) {
          container.querySelectorAll("[data-ck]").forEach(cb => cb.onclick = e => {
            e.stopPropagation();
            const id = cb.dataset.ck;
            cb.checked ? selected.push(id) : (selected = selected.filter(x => x !== id));
            el.querySelector("#asBatch").disabled = !selected.length;
            el.querySelector("#asBatch").textContent = selected.length ? `批量下架（${selected.length}）` : "批量下架";
          });
        }
      });
    }
    ["asKw", "asCat", "asSt"].forEach(id => {
      const node = el.querySelector("#" + id);
      node.oninput = U.debounce(draw, 250); node.onchange = draw;
    });
    el.querySelector("#asExport").onclick = () => U.toast("原型演示：清单已导出 Excel", "success");
    el.querySelector("#asBatch").onclick = () => U.confirm(`将对 ${selected.length} 条知识执行下架，下架后前台问答不再引用，确认吗？`, "批量下架").then(ok => {
      if (!ok) return;
      selected.forEach(id => { const a = DB.assets.find(x => x.id === id); if (a) a.status = "rejected"; });
      selected = []; el.querySelector("#asBatch").disabled = true; el.querySelector("#asBatch").textContent = "批量下架";
      U.toast("批量下架完成", "success"); draw();
    });
    el.querySelector("#asNew").onclick = () => {
      U.modal({
        title: "新增知识", width: "w-720",
        body: `
          <div class="form-item"><label>知识标题<span class="req">*</span></label><input class="input" id="nkTitle" placeholder="请输入知识标题"></div>
          <div class="form-row">
            <div class="form-item"><label>分类</label><select class="input">${DB.categoryTree.map(c => `<option>${c.name}</option>`).join("")}</select></div>
            <div class="form-item"><label>类型</label><select class="input"><option>结构化文档</option><option>PDF</option><option>表格</option></select></div>
          </div>
          <div class="form-item"><label>内容摘要<span class="req">*</span></label><textarea class="input" rows="3" placeholder="请输入知识内容摘要"></textarea></div>
          <div class="form-item"><label>关键词</label><input class="input" placeholder="多个关键词以顿号分隔"></div>`,
        onOk() {
          if (!el.querySelector("#nkTitle").value) { U.toast("请填写知识标题", "error"); return false; }
          U.toast("已提交审核，审核通过后自动发布", "success");
          DB.assets.unshift({ id: "KA" + Math.floor(3100 + Math.random() * 90), title: el.querySelector("#nkTitle").value, category: "收费政策/收费标准", type: "doc", status: "pending", source: "人工录入", creator: "R-01", size: "0.1MB", citations: 0, updateTime: Date.now(), version: "V1.0", summary: "人工录入知识条目。", keywords: "自定义" });
          draw();
        }
      });
    };

    /* ---- P3-04 知识详情与编辑（抽屉） ---- */
    function openDetail(a) {
      U.drawer({
        title: "知识详情", width: "w-760",
        body: `
          <div class="flex justify-b align-c mb-16">
            <span class="fwb" style="font-size:16px">${U.esc(a.title)}</span>
            ${U.statusTag(stMap, a.status)}
          </div>
          <div class="desc-list">
            <dt>编号 / 版本</dt><dd><span class="mono">${a.id}</span> · ${a.version}</dd>
            <dt>分类</dt><dd>${U.esc(a.category)}</dd>
            <dt>来源 / 提交人</dt><dd>${U.esc(a.source)}</dd>
            <dt>文件大小</dt><dd>${U.esc(a.size)}</dd>
            <dt>引用次数</dt><dd>${a.citations} 次</dd>
            <dt>更新时间</dt><dd>${U.fmtTime(a.updateTime)}</dd>
          </div>
          <div class="section-title">内容摘要</div>
          <div class="text-sm" style="background:var(--bg);border-radius:8px;padding:14px;line-height:2">${U.esc(a.summary)}</div>
          <div class="section-title">关键词</div>
          <div>${a.keywords.split("、").map(k => `<span class="tag blue">${U.esc(k)}</span>`).join(" ")}</div>
          <div class="section-title">引用关系</div>
          <div class="text-sub text-sm">被 2 个模板引用：路段月度运营分析报告、稽查案例分析报告</div>
          <div class="section-title">版本历史</div>
          <div class="timeline">
            ${[0, 1, 2].map(i => `
              <div class="tl-item ${i === 0 ? "hot" : ""}">
                <div class="tl-time">${U.fmtTime(a.updateTime - i * 30 * 24 * 36e5)}</div>
                <div class="tl-text">V${3 - i}.0 ${i === 0 ? "（当前版本）" : "· 修订"}</div>
              </div>`).join("")}
          </div>`,
        footer: a.status === "published"
          ? `<button class="btn" id="kdOff">下架</button><button class="btn" id="kdEdit">编辑</button><button class="btn primary" id="kdNewVer">提交新版本</button>`
          : `<button class="btn" id="kdOff">驳回</button><button class="btn primary" id="kdPass">审核通过</button>`,
        onOpen(api) {
          const off = api.box.querySelector("#kdOff");
          if (off) off.onclick = () => { a.status = "rejected"; U.toast("知识已下架", "success"); api.close(); draw(); };
          const pass = api.box.querySelector("#kdPass");
          if (pass) pass.onclick = () => { a.status = "published"; U.toast("审核通过，知识已发布", "success"); api.close(); draw(); };
          const edit = api.box.querySelector("#kdEdit");
          if (edit) edit.onclick = () => { api.close(); U.toast("原型演示：进入在线编辑器（编辑产生新版本，需重新审核）", "info"); };
          const nv = api.box.querySelector("#kdNewVer");
          if (nv) nv.onclick = () => { api.close(); U.toast("原型演示：上传新版本文件并提交审核", "info"); };
        }
      });
    }
    draw();
  });

  /* ==================== P3-03 知识批量导入 ==================== */
  App.register("kb-import", el => {
    let files = [];

    el.innerHTML = `
      ${App.header("知识批量导入", "支持 docx / pdf / xlsx / zip 批量上传，自动解析、分类并进入审核流")}
      <div class="grid cols-2">
        <div class="card">
          <div class="card-title">① 上传文件</div>
          <div class="upload-area" id="upArea">
            <div class="ua-icon">⬆</div>
            <div class="ua-text">点击选择或 <b>拖拽文件</b> 到此处上传</div>
            <div class="ua-hint">支持 .docx / .pdf / .xlsx / .zip，单文件 ≤ 100MB，单次 ≤ 20 个</div>
          </div>
          <input type="file" id="upInput" multiple hidden>
          <div id="fileList" class="mt-16"></div>
        </div>
        <div class="card">
          <div class="card-title">② 导入配置</div>
          <div class="form-item"><label>目标分类</label>
            <select class="input" id="imCat">${DB.categoryTree.map(c => `<option>${c.name}</option>`).join("")}</select></div>
          <div class="form-item"><label>冲突策略</label>
            <label class="radio"><input type="radio" name="imCs" checked>自动入库，冲突标记待裁决</label><br>
            <label class="radio"><input type="radio" name="imCs">重复内容跳过</label>
          </div>
          <div class="form-item"><label>解析完成后</label>
            <label class="checkbox"><input type="checkbox" checked>自动进入知识审核队列</label>
            <label class="checkbox"><input type="checkbox" checked>异常项推送站内通知</label>
          </div>
          <button class="btn primary block" id="imSubmit" disabled>开始导入</button>
        </div>
      </div>
      <div class="card">
        <div class="card-title">导入任务记录</div>
        <div id="imTable"></div>
      </div>`;

    const area = el.querySelector("#upArea");
    const input = el.querySelector("#upInput");
    area.onclick = () => input.click();
    area.ondragover = e => { e.preventDefault(); area.classList.add("dragover"); };
    area.ondragleave = () => area.classList.remove("dragover");
    area.ondrop = e => { e.preventDefault(); area.classList.remove("dragover"); addFiles([...e.dataTransfer.files]); };
    input.onchange = () => addFiles([...input.files]);

    function addFiles(fs) {
      fs.forEach(f => {
        if (f.size > 100 * 1024 * 1024) { U.toast(`「${f.name}」超过 100MB，已跳过`, "error"); return; }
        files.push({ name: f.name, size: (f.size / 1024 / 1024).toFixed(1) + "MB", progress: 0, status: "uploading" });
      });
      renderFiles();
      files.forEach(simUpload);
    }
    function simUpload(f) {
      if (f.status !== "uploading") return;
      const t = setInterval(() => {
        f.progress += 8 + Math.random() * 16;
        if (f.progress >= 100) { f.progress = 100; f.status = "done"; clearInterval(t); U.toast(`「${f.name}」上传完成，等待导入`, "success"); }
        renderFiles();
        el.querySelector("#imSubmit").disabled = !files.some(x => x.status === "done");
      }, 200);
    }
    function renderFiles() {
      const list = el.querySelector("#fileList");
      list.innerHTML = files.map((f, i) => `
        <div class="file-item">
          <div class="fi-icon" style="background:var(--primary-light);color:var(--primary)">${f.status === "done" ? "✓" : "⬆"}</div>
          <div class="fi-info">
            <div class="fi-name">${U.esc(f.name)}</div>
            <div class="fi-size">${f.size} · ${f.status === "done" ? "已上传" : "上传中 " + Math.round(f.progress) + "%"}</div>
            ${f.status !== "done" ? `<div class="progress-bar"><div class="pb-inner" style="width:${f.progress}%"></div></div>` : ""}
          </div>
          <button class="btn sm" data-rm="${i}">移除</button>
        </div>`).join("");
      list.querySelectorAll("[data-rm]").forEach(b => b.onclick = () => {
        files.splice(+b.dataset.rm, 1); renderFiles();
        el.querySelector("#imSubmit").disabled = !files.some(x => x.status === "done");
      });
    }

    el.querySelector("#imSubmit").onclick = () => {
      const cat = el.querySelector("#imCat").value;
      const total = 20 + Math.floor(Math.random() * 80);
      const task = { id: "IM" + Math.floor(2028 + Math.random() * 30), file: files.filter(f => f.status === "done").map(f => f.name).join("、") || "手工汇总.pdf", size: files.reduce((s, f) => s + (+f.size || 0), 0).toFixed(1) + "MB", status: "parsing", progress: 0, total, ok: 0, fail: 0, createAt: Date.now(), creator: (App.user || {}).name || "当前用户" };
      DB.imports.unshift(task);
      files = []; renderFiles();
      el.querySelector("#imSubmit").disabled = true;
      U.toast("导入任务已创建，正在解析…", "success");
      drawTasks();
      const t = setInterval(() => {
        task.progress += 4 + Math.random() * 9;
        task.ok = Math.round(task.total * task.progress / 100 * 0.97);
        task.fail = Math.round(task.total * task.progress / 100 * 0.03);
        if (task.progress >= 100) {
          task.progress = 100; task.status = "done"; clearInterval(t);
          U.toast(`导入完成：${task.ok} 条成功、${task.fail} 条异常`, "success");
        }
        drawTasks();
      }, 300);
    };

    const imStMap = { parsing: { text: "解析中", cls: "blue" }, done: { text: "已完成", cls: "green" }, error: { text: "失败", cls: "red" } };
    function drawTasks() {
      U.renderTable(el.querySelector("#imTable"), {
        rows: DB.imports,
        pageSize: 5,
        cols: [
          { title: "任务号", key: "id", width: "90px", render: r => `<span class="mono">${r.id}</span>` },
          { title: "文件名", key: "file" },
          { title: "大小", key: "size", width: "80px" },
          { title: "进度", width: "220px", render: r => r.status === "parsing"
              ? `<div style="min-width:180px"><div class="progress-bar"><div class="pb-inner" style="width:${r.progress}%"></div></div><span class="text-sub text-sm">解析中 ${r.ok}/${r.total}</span></div>`
              : U.statusTag(imStMap, r.status) },
          { title: "成功/异常", width: "100px", render: r => r.status === "parsing" ? "-" : `<span style="color:var(--success)">${r.ok}</span> / <span style="color:var(--danger)">${r.fail}</span>` },
          { title: "发起人", key: "creator", width: "90px" },
          { title: "时间", key: "createAt", render: r => U.fmtTime(r.createAt), width: "150px" }
        ]
      });
    }
    drawTasks();
  });

  /* ==================== P3-05 知识审核队列 ==================== */
  App.register("kb-review", el => {
    el.innerHTML = `
      ${App.header("知识审核队列", "新增与更新知识的审核：查重 → 内容核验 → 通过 / 驳回", `
        <button class="btn primary" id="rvPassAll">批量通过</button>`)}
      <div class="grid cols-3 mb-16">
        <div class="stat-card"><div class="sc-icon" style="background:var(--danger-light);color:var(--danger)">⏳</div><div><div class="sc-value">${DB.reviews.length}</div><div class="sc-label">待审核</div></div></div>
        <div class="stat-card"><div class="sc-icon" style="background:var(--warning-light);color:var(--warning)">🔥</div><div><div class="sc-value">2</div><div class="sc-label">高优先级</div></div></div>
        <div class="stat-card"><div class="sc-icon" style="background:var(--success-light);color:var(--success)">✓</div><div><div class="sc-value">96.8%</div><div class="sc-label">近30天审核通过率</div></div></div>
      </div>
      <div class="card"><div id="rvTable"></div></div>`;

    const priMap = { high: { text: "高", cls: "red" }, normal: { text: "中", cls: "orange" }, low: { text: "低", cls: "gray" } };
    function draw() {
      U.renderTable(el.querySelector("#rvTable"), {
        rows: DB.reviews,
        pageSize: 8,
        rowClick: r => openReview(r),
        cols: [
          { title: "审核号", key: "id", render: r => `<span class="mono">${r.id}</span>` },
          { title: "知识标题", key: "asset", render: r => `<span class="cell-link">${U.esc(r.asset)}</span>` },
          { title: "类型", key: "type", width: "90px", render: r => `<span class="tag ${r.type === "新增" ? "blue" : "purple"}">${r.type}</span>` },
          { title: "提交人", key: "submitter", width: "180px" },
          { title: "提交时间", key: "submitAt", render: r => U.fmtTime(r.submitAt), width: "160px" },
          { title: "优先级", key: "priority", width: "80px", render: r => U.statusTag(priMap, r.priority) },
          { title: "操作", width: "160px", render: () => `<button class="btn link sm" data-a="pass">通过</button><button class="btn link sm danger" data-a="reject">驳回</button>` }
        ],
        afterDraw(container) {
          container.querySelectorAll('[data-a]').forEach(b => b.onclick = e => {
            e.stopPropagation();
            const tr = b.closest("tr"), id = tr.children[0].textContent;
            const r = DB.reviews.find(x => x.id === id);
            b.dataset.a === "pass" ? decide(r, true) : decide(r, false);
          });
        }
      });
    }

    function decide(r, pass) {
      U.modal({
        title: pass ? "审核通过" : "审核驳回",
        body: `
          <div class="form-item"><label>知识</label><input class="input" value="${U.esc(r.asset)}" disabled></div>
          <div class="form-item"><label>审核意见<span class="req">*</span></label>
            <textarea class="input" id="rvCmt" rows="3" placeholder="${pass ? "可填写备注（选填）" : "请填写驳回原因（必填，将通知提交人）"}"></textarea></div>
          ${pass ? `<div class="form-item"><label>发布选项</label>
            <label class="checkbox"><input type="checkbox" checked>立即发布</label>
            <label class="checkbox"><input type="checkbox">同步通知相关业务部门</label></div>` : ""}`,
        onOk() {
          const cmt = document.getElementById("rvCmt").value;
          if (!pass && !cmt.trim()) { U.toast("驳回必须填写原因", "error"); return false; }
          DB.reviews.splice(DB.reviews.indexOf(r), 1);
          U.toast(pass ? "已通过并发布" : "已驳回并通知提交人", "success");
          draw();
        }
      });
    }

    function openReview(r) {
      const a = DB.assets.find(x => r.asset.includes(x.title.slice(0, 6))) || DB.assets[0];
      U.drawer({
        title: "审核详情 · " + r.id, width: "w-760",
        body: `
          <div class="flex justify-b align-c mb-16"><span class="fwb" style="font-size:15px">${U.esc(r.asset)}</span>${U.statusTag(priMap, r.priority)}</div>
          <div class="desc-list">
            <dt>变更类型</dt><dd>${r.type}</dd>
            <dt>提交人</dt><dd>${U.esc(r.submitter)}</dd>
            <dt>提交时间</dt><dd>${U.fmtTime(r.submitAt)}</dd>
          </div>
          <div class="section-title">查重结果</div>
          <div class="text-sm" style="background:var(--bg);border-radius:8px;padding:12px 14px;line-height:2">
            <span class="tag green">相似度 23%</span> 与现有知识最高相似度 23%（低于 60% 阈值），无重复入库风险。<br>
            <span class="tag blue">语义冲突检测</span> 未检出与现有知识矛盾的表述。
          </div>
          <div class="section-title">内容摘要</div>
          <div class="text-sm" style="background:var(--bg);border-radius:8px;padding:12px 14px;line-height:2">${U.esc(a.summary)}</div>`,
        footer: `<button class="btn" data-close>取消</button><button class="btn danger" id="rdRej">驳回</button><button class="btn primary" id="rdPass">通过并发布</button>`,
        onOpen(api) {
          api.box.querySelector("#rdPass").onclick = () => { api.close(); decide(r, true); };
          api.box.querySelector("#rdRej").onclick = () => { api.close(); decide(r, false); };
        }
      });
    }
    draw();
  });

  /* ==================== P3-06 知识冲突裁决 ==================== */
  App.register("kb-conflict", el => {
    el.innerHTML = `
      ${App.header("知识冲突裁决", "系统检出互相矛盾的知识条目，人工裁决保留版本，裁决结果回流更新知识库")}`;
    const box = document.createElement("div");
    el.appendChild(box);

    function draw() {
      const open = DB.conflicts.filter(c => c.status === "open");
      const closed = DB.conflicts.filter(c => c.status !== "open");
      box.innerHTML = `
        ${open.length || closed.length ? "" : `<div class="card"><div class="empty-state"><div class="es-icon">🎉</div>暂无待裁决冲突</div></div>`}
        ${open.map(c => `
        <div class="card">
          <div class="flex justify-b align-c mb-16">
            <div class="flex align-c gap-12">
              <span class="tag red"><span class="dot" style="background:var(--danger)"></span>冲突待裁决</span>
              <span class="fwb" style="font-size:15px">${U.esc(c.title)}</span>
              <span class="tag gray">${U.esc(c.category)}</span>
            </div>
            <span class="text-sub text-sm">冲突号 ${c.id} · 检出于 ${U.fmtTime(c.detectAt)}</span>
          </div>
          <div class="grid cols-2">
            <div class="card" style="margin:0;border:1.5px solid var(--primary);cursor:pointer" data-keep="a" data-cid="${c.id}">
              <div class="flex justify-b mb-8"><span class="tag blue">版本 A</span><button class="btn sm primary">保留此版本</button></div>
              <div class="text-sm fwb mb-8">${U.esc(c.a.source)}</div>
              <div class="text-sm text-muted" style="line-height:2">${U.esc(c.a.content)}</div>
              <div class="text-sub text-sm mt-8">更新于 ${U.fmtDate(c.a.updateTime)}</div>
            </div>
            <div class="card" style="margin:0;border:1.5px solid var(--purple);cursor:pointer" data-keep="b" data-cid="${c.id}">
              <div class="flex justify-b mb-8"><span class="tag purple">版本 B</span><button class="btn sm primary">保留此版本</button></div>
              <div class="text-sm fwb mb-8">${U.esc(c.b.source)}</div>
              <div class="text-sm text-muted" style="line-height:2">${U.esc(c.b.content)}</div>
              <div class="text-sub text-sm mt-8">更新于 ${U.fmtDate(c.b.updateTime)}</div>
            </div>
          </div>
          <div class="flex gap-12 mt-16">
            <button class="btn" data-keep="merge" data-cid="${c.id}">⚖ 两者合并（人工编辑）</button>
            <button class="btn danger" data-keep="both" data-cid="${c.id}">两者共存（标注适用场景）</button>
          </div>
        </div>`).join("")}
        ${closed.length ? `
        <div class="card">
          <div class="card-title">已裁决记录</div>
          ${closed.map(c => `
            <div class="flex justify-b align-c" style="padding:10px 0;border-bottom:1px solid var(--border-2)">
              <div><span class="tag green">已裁决</span> <span class="text-sm">${U.esc(c.title)} —— 保留${c.decision === "a" ? "版本 A" : "版本 B"}</span></div>
              <span class="text-sub text-sm">${U.fmtTime(c.decideAt || Date.now())}</span>
            </div>`).join("")}
        </div>` : ""}`;

      box.querySelectorAll("[data-keep]").forEach(b => b.onclick = () => {
        const c = DB.conflicts.find(x => x.id === b.dataset.cid);
        const keep = b.dataset.keep;
        if (keep === "merge") { U.toast("原型演示：打开合并编辑器，人工融合两版本后提交审核", "info"); return; }
        if (keep === "both") { U.toast("原型演示：两者共存，需分别标注适用路段/时间范围", "info"); return; }
        U.confirm(`确定保留<b>版本 ${keep.toUpperCase()}</b>吗？另一版本将标记为「历史版本」，前台问答仅引用保留版本。`, "冲突裁决").then(ok => {
          if (!ok) return;
          c.status = "closed"; c.decision = keep; c.decideAt = Date.now();
          U.toast("裁决完成，知识库已更新", "success"); draw();
        });
      });
    }
    draw();
  });

  /* ==================== P3-07 知识分类体系管理 ==================== */
  App.register("kb-category", el => {
    el.innerHTML = `
      ${App.header("知识分类体系管理", "知识目录树维护：新增、重命名、调整与删除分类")}
      <div class="grid cols-2" style="grid-template-columns:1fr 1.4fr">
        <div class="card">
          <div class="card-title">分类树<span class="ct-extra">共 5 个一级 / 18 个二级分类</span></div>
          <div class="tree" id="catTree"></div>
          <button class="btn block mt-16" id="catAddRoot">＋ 新增一级分类</button>
        </div>
        <div class="card">
          <div class="card-title">分类详情</div>
          <div id="catInfo"></div>
        </div>
      </div>`;

    let active = null;
    function renderTree() {
      const tree = el.querySelector("#catTree");
      tree.innerHTML = DB.categoryTree.map(cat => `
        <div class="tree-node" data-id="${cat.id}"><span class="tn-arrow open">▶</span><span>${U.esc(cat.name)}</span><span class="flex-1"></span><span class="text-sub text-sm">${cat.count}</span></div>
        <div class="tree-children">
          ${cat.children.map(ch => `<div class="tree-node" data-id="${ch.id}" style="padding-left:10px"><span class="tn-arrow" style="visibility:hidden">▶</span><span>${U.esc(ch.name)}</span><span class="flex-1"></span><span class="text-sub text-sm">${ch.count}</span></div>`).join("")}
        </div>`).join("");
      tree.querySelectorAll(".tree-node").forEach(node => {
        node.onclick = () => { active = node.dataset.id; renderTree(); renderInfo(); };
        node.querySelectorAll("span")[0].onclick = e => e.stopPropagation();
      });
    }
    function findCat(id) {
      for (const c of DB.categoryTree) {
        if (c.id === id) return c;
        const ch = c.children.find(x => x.id === id);
        if (ch) return ch;
      }
      return null;
    }
    function renderInfo() {
      const info = el.querySelector("#catInfo");
      const cat = active ? findCat(active) : null;
      if (!cat) { info.innerHTML = `<div class="empty-state"><div class="es-icon">🌳</div>请选择左侧分类节点</div>`; return; }
      const isRoot = DB.categoryTree.some(c => c.id === cat.id);
      info.innerHTML = `
        <div class="form-item"><label>分类名称</label><input class="input" id="ciName" value="${U.esc(cat.name)}"></div>
        <div class="kv-list mb-16" style="grid-template-columns:1fr">
          <div class="kv"><span class="k">分类编码</span><span class="mono">${cat.id}</span></div>
          <div class="kv"><span class="k">层级</span><span>${isRoot ? "一级分类" : "二级分类"}</span></div>
          <div class="kv"><span class="k">知识条目数</span><span>${cat.count}</span></div>
        </div>
        <div class="flex gap-8">
          <button class="btn primary" id="ciSave">保存</button>
          ${isRoot ? `<button class="btn" id="ciAddChild">＋ 添加子分类</button>` : ""}
          <span class="flex-1"></span>
          <button class="btn danger" id="ciDel">删除分类</button>
        </div>`;
      info.querySelector("#ciSave").onclick = () => { cat.name = info.querySelector("#ciName").value; renderTree(); U.toast("分类已更新", "success"); };
      const addBtn = info.querySelector("#ciAddChild");
      if (addBtn) addBtn.onclick = () => {
        cat.children.push({ id: cat.id + (cat.children.length + 1), name: "新分类", count: 0 });
        renderTree(); U.toast("子分类已添加，请完善名称后保存", "success");
      };
      info.querySelector("#ciDel").onclick = () => {
        if (cat.count > 0) { U.toast(`该分类下仍有 ${cat.count} 条知识，不允许删除（请先迁移知识）`, "error"); return; }
        U.confirm("删除分类不可恢复，确定删除吗？", "删除分类").then(ok => {
          if (!ok) return;
          DB.categoryTree.forEach(c => { c.children = c.children.filter(x => x.id !== cat.id); });
          if (DB.categoryTree.some(c => c.id === cat.id)) DB.categoryTree = DB.categoryTree.filter(c => c.id !== cat.id);
          active = null; renderTree(); renderInfo(); U.toast("分类已删除", "success");
        });
      };
    }
    el.querySelector("#catAddRoot").onclick = () => {
      DB.categoryTree.push({ id: "CAT" + String(DB.categoryTree.length + 1).padStart(2, "0"), name: "新一级分类", count: 0, children: [] });
      renderTree(); U.toast("一级分类已添加", "success");
    };
    renderTree(); renderInfo();
  });

  /* ==================== P3-08 解析异常任务列表 ==================== */
  App.register("kb-exception", el => {
    const stMap = { open: { text: "待处理", cls: "red" }, ignored: { text: "已忽略", cls: "gray" }, resolved: { text: "已处理", cls: "green" } };
    el.innerHTML = `
      ${App.header("解析异常任务", "批量导入中解析失败的条目：人工修复、忽略或重试")}
      <div class="card"><div id="exTable"></div></div>`;

    function draw() {
      U.renderTable(el.querySelector("#exTable"), {
        rows: DB.exceptions,
        pageSize: 8,
        cols: [
          { title: "异常号", key: "id", render: r => `<span class="mono">${r.id}</span>` },
          { title: "来源文件", key: "file" },
          { title: "异常原因", key: "reason", render: r => `<span class="tag orange">⚠</span> ${U.esc(r.reason)}` },
          { title: "涉及条目", key: "count", width: "90px" },
          { title: "发生时间", key: "createAt", render: r => U.fmtTime(r.createAt), width: "160px" },
          { title: "状态", key: "status", width: "90px", render: r => U.statusTag(stMap, r.status) },
          { title: "操作", width: "170px", render: r => r.status === "open"
              ? `<button class="btn link sm" data-a="fix">人工修复</button><button class="btn link sm" data-a="retry">重试解析</button><button class="btn link sm" data-a="ignore">忽略</button>`
              : "<span class='text-sub text-sm'>-</span>" }
        ],
        afterDraw(container) {
          container.querySelectorAll("[data-a]").forEach(b => b.onclick = () => {
            const tr = b.closest("tr"), id = tr.children[0].textContent;
            const r = DB.exceptions.find(x => x.id === id);
            const act = b.dataset.a;
            if (act === "fix") U.drawer({
              title: "人工修复 · " + r.id,
              body: `
                <div class="desc-list">
                  <dt>来源文件</dt><dd>${U.esc(r.file)}</dd>
                  <dt>异常原因</dt><dd>${U.esc(r.reason)}</dd>
                  <dt>涉及条目</dt><dd>${r.count} 条</dd>
                </div>
                <div class="section-title">逐条修复（示意第 1 条）</div>
                <div class="form-item"><label>提取文本</label><textarea class="input" rows="4" placeholder="扫描件原文，请人工转录或粘贴文本"></textarea></div>
                <div class="form-item"><label>目标分类</label><select class="input">${DB.categoryTree.map(c => `<option>${c.name}</option>`).join("")}</select></div>`,
              footer: `<button class="btn" data-close>取消</button><button class="btn primary" id="fxSave">保存并入库</button>`,
              onOpen(api) { api.box.querySelector("#fxSave").onclick = () => { r.status = "resolved"; api.close(); U.toast("修复完成，条目已进入审核队列", "success"); draw(); }; }
            });
            else if (act === "retry") { U.toast("已重新发起解析任务", "success", 1500); }
            else if (act === "ignore") U.confirm("忽略后该批条目将不再处理，确认忽略吗？", "忽略异常").then(ok => {
              if (ok) { r.status = "ignored"; U.toast("已忽略", "success"); draw(); }
            });
          });
        }
      });
    }
    draw();
  });
})();
