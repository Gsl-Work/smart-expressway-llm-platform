/* ============================================================
   文档生成模块视图（views-doc.js）
   P2-01 生成工作台 / P2-02 生成结果编辑 / P2-03 生成记录
   P2-04 模板管理 / P2-05 模板编辑器
   ============================================================ */
(function () {
  "use strict";

  /* ==================== P2-01 文档生成工作台 ==================== */
  App.register("doc-workbench", el => {
    let step = 1;
    const form = { templateId: "TPL01", title: "", month: "2026-08", section: "G4京港澳高速长沙段", chapters: [], words: 3000, review: true };
    const tpl = () => DB.templates.find(t => t.id === form.templateId);

    el.innerHTML = `
      ${App.header("文档生成工作台", "基于模板与数据中台指标自动生成业务文档，生成结果可编辑导出")}

      <div class="card" style="padding-bottom:6px">
        <div class="steps">
          <div class="step" data-step="1"><div class="st-dot">1</div><div class="st-label">选择模板</div></div>
          <div class="step" data-step="2"><div class="st-dot">2</div><div class="st-label">填写配置</div></div>
          <div class="step" data-step="3"><div class="st-dot">3</div><div class="st-label">生成文档</div></div>
        </div>
        <div id="wizardBody"></div>
      </div>`;

    const body = el.querySelector("#wizardBody");

    function renderSteps() {
      el.querySelectorAll(".step").forEach(s => {
        const n = +s.dataset.step;
        s.classList.toggle("active", n === step);
        s.classList.toggle("done", n < step);
        if (n < step) s.querySelector(".st-dot").textContent = "✓";
        else s.querySelector(".st-dot").textContent = n;
      });
    }

    function render() {
      renderSteps();
      if (step === 1) renderTplList();
      else if (step === 2) renderForm();
      else renderProgress();
    }

    /* ---- 第1步：模板 ---- */
    function renderTplList() {
      body.innerHTML = `
        <div class="grid cols-3">
          ${DB.templates.filter(t => t.status === "enabled").map(t => `
            <div class="card" style="margin:0;cursor:pointer;border:2px solid ${form.templateId === t.id ? "var(--primary)" : "transparent"}" data-tpl="${t.id}">
              <div class="flex justify-b align-c mb-8">
                <span class="fwb">${U.esc(t.name)}</span>
                <span class="tag blue">${U.esc(t.category)}</span>
              </div>
              <div class="text-sub text-sm mb-8">章节结构：${t.chapters.map((c, i) => `${i + 1}.${c}`).join(" ")}</div>
              <div class="flex justify-b text-sub text-sm">
                <span>已使用 ${t.usage} 次</span><span>最近更新 ${U.fmtDate(t.updateTime)}</span>
              </div>
            </div>`).join("")}
        </div>
        <div class="flex gap-12 mt-16" style="padding-bottom:12px">
          <button class="btn primary" id="wNext">下一步：填写配置</button>
        </div>`;
      body.querySelectorAll("[data-tpl]").forEach(c => c.onclick = () => {
        form.templateId = c.dataset.tpl;
        form.chapters = tpl().chapters.slice();
        render();
      });
      body.querySelector("#wNext").onclick = () => { step = 2; render(); };
    }

    /* ---- 第2步：配置 ---- */
    function renderForm() {
      const t = tpl();
      if (!form.chapters.length) form.chapters = t.chapters.slice();
      body.innerHTML = `
        <div class="form-row">
          <div class="form-item"><label>文档标题<span class="req">*</span></label>
            <input class="input" id="fTitle" placeholder="例如：G4长沙段8月运营分析报告" value="${U.esc(form.title)}">
            <div class="err-msg">请填写文档标题</div></div>
          <div class="form-item"><label>统计月份</label><input class="input" type="month" id="fMonth" value="${form.month}"></div>
        </div>
        <div class="form-row">
          <div class="form-item"><label>数据范围（路段）</label>
            <select class="input" id="fSection">
              <option>G4京港澳高速长沙段</option><option>G56杭瑞高速岳阳段</option><option>G60沪昆高速株洲段</option><option>全集团汇总</option>
            </select></div>
          <div class="form-item"><label>目标字数</label>
            <select class="input" id="fWords">
              <option value="1500">约 1,500 字（简报）</option>
              <option value="3000">约 3,000 字（标准）</option>
              <option value="6000">约 6,000 字（详版）</option>
            </select></div>
        </div>
        <div class="form-item"><label>包含章节<span class="req">*</span></label>
          <div>${t.chapters.map(c => `
            <label class="checkbox"><input type="checkbox" data-ch="${U.esc(c)}" ${form.chapters.includes(c) ? "checked" : ""}>${U.esc(c)}</label>`).join("")}
          </label></div>
        <div class="form-item"><label>引用要求</label>
          <label class="checkbox"><input type="checkbox" id="fCite" checked>生成内容标注数据与知识引用</label>
          <label class="checkbox"><input type="checkbox" id="fReview" ${form.review ? "checked" : ""}>生成后进入人工审核流</label>
        </div>
        <div class="flex gap-12" style="padding-bottom:12px">
          <button class="btn" id="wPrev">上一步</button>
          <button class="btn primary" id="wGen">开始生成</button>
        </div>`;
      body.querySelector("#fTitle").oninput = e => form.title = e.target.value;
      body.querySelector("#fMonth").onchange = e => form.month = e.target.value;
      body.querySelector("#fSection").onchange = e => form.section = e.target.value;
      body.querySelector("#fWords").onchange = e => form.words = +e.target.value;
      body.querySelectorAll("[data-ch]").forEach(cb => cb.onchange = () => {
        form.chapters = [...body.querySelectorAll("[data-ch]:checked")].map(x => x.dataset.ch);
      });
      body.querySelector("#fReview").onchange = e => form.review = e.target.checked;
      body.querySelector("#wPrev").onclick = () => { step = 1; render(); };
      body.querySelector("#wGen").onclick = () => {
        const ti = body.querySelector("#fTitle");
        if (!form.title.trim() || !form.chapters.length) {
          if (!form.title.trim()) { ti.closest(".form-item").classList.add("has-err"); ti.classList.add("err"); }
          if (!form.chapters.length) U.toast("请至少选择一个章节", "error");
          return;
        }
        step = 3; render();
      };
    }

    /* ---- 第3步：生成进度与结果 ---- */
    let genTimer = null;
    function renderProgress() {
      const t = tpl();
      const task = { id: "DT" + Math.floor(2027 + Math.random() * 50), title: form.title || t.name, template: t.name };
      const phases = [
        ["模板解析与章节规划", 1.2], ["数据指标检索（数据中台）", 2.0], ["知识库引用匹配", 1.6], ["大模型内容生成", 4.5], ["格式排版与引用标注", 1.0]
      ];
      let phaseIdx = 0, progress = 0;
      body.innerHTML = `
        <div class="flex align-c gap-16 mb-16">
          <div class="fwb">${U.esc(task.title)}</div>
          <span class="tag blue">${U.esc(t.name)}</span>
          <span class="text-sub text-sm">任务号 ${task.id}</span>
        </div>
        <div id="genPhaseList">${phases.map((p, i) => `
          <div class="flex align-c gap-12" style="padding:9px 0" data-ph="${i}">
            <span class="ph-state" style="width:20px">${i === 0 ? "▶" : "○"}</span>
            <span class="flex-1">${p[0]}</span>
            <span class="text-sub text-sm ph-time"></span>
          </div>`).join("")}
        </div>
        <div class="progress-bar mt-16" id="genBar" style="height:8px"><div class="pb-inner" style="width:0%"></div></div>
        <div class="flex justify-b mt-8 text-sub text-sm">
          <span id="genPhaseText">正在生成…</span><span id="genPct">0%</span>
        </div>
        <div class="flex gap-12 mt-16" style="padding-bottom:12px">
          <button class="btn" id="wCancel">取消任务</button>
        </div>`;

      const bar = body.querySelector("#genBar .pb-inner");
      const pct = body.querySelector("#genPct");
      const phaseText = body.querySelector("#genPhaseText");
      const phaseEls = body.querySelectorAll("[data-ph]");
      genTimer = setInterval(() => {
        progress += 2 + Math.random() * 4;
        if (progress >= 100) {
          progress = 100; clearInterval(genTimer);
          DB.docTasks.unshift({ ...task, status: "done", progress: 100, creator: (App.user || {}).name || "演示用户", createAt: Date.now(), words: form.words, reviewed: false });
          setTimeout(() => renderDone(task), 400);
        }
        bar.style.width = progress + "%";
        pct.textContent = Math.round(progress) + "%";
        const pi = Math.min(phases.length - 1, Math.floor(progress / 100 * phases.length));
        if (pi !== phaseIdx) {
          phaseEls[phaseIdx].querySelector(".ph-state").innerHTML = "<span style='color:var(--success)'>✓</span>";
          phaseEls[phaseIdx].querySelector(".ph-time").textContent = (phases[phaseIdx][1]).toFixed(1) + "s";
          phaseIdx = pi;
          phaseEls[pi].querySelector(".ph-state").innerHTML = "▶";
        }
        phaseText.textContent = "阶段：" + phases[phaseIdx][0];
      }, 180);
      body.querySelector("#wCancel").onclick = () => {
        clearInterval(genTimer);
        U.confirm("取消后本次生成进度将丢失，确定取消吗？", "取消任务").then(ok => { if (ok) { step = 2; render(); } });
      };
    }

    function renderDone(task) {
      const draft = DB.docDraft;
      body.innerHTML = `
        <div class="flex align-c gap-12 mb-16">
          <span class="tag green"><span class="dot" style="background:var(--success)"></span>生成完成</span>
          <span class="text-sub text-sm">耗时 42 秒 · 约 ${form.words} 字 · 引用 5 处（3 数据源 + 2 知识条目）</span>
        </div>
        <div class="card" style="margin:0;background:var(--bg);border:1px dashed var(--border)">
          <div class="fwb mb-8">${U.esc(draft.title)}</div>
          ${draft.sections.slice(0, 2).map(s => `
            <div class="text-sm"><b>${U.esc(s.title)}</b></div>
            <div class="text-sm text-muted" style="margin-bottom:8px">${U.esc(s.paras[0].slice(0, 90))}…</div>`).join("")}
          <div class="text-sub text-sm">（预览节选，完整内容请进入编辑器）</div>
        </div>
        <div class="flex gap-12 mt-16" style="padding-bottom:12px">
          <button class="btn" id="wAgain">再生成一份</button>
          <button class="btn" id="wExport">导出 Word</button>
          <button class="btn primary" id="wEdit">进入编辑器</button>
        </div>`;
      body.querySelector("#wAgain").onclick = () => { step = 2; render(); };
      body.querySelector("#wExport").onclick = () => U.toast("原型演示：已导出 .docx（含水印与引用脚注）", "success");
      body.querySelector("#wEdit").onclick = () => App.nav("doc-editor", { taskId: task.id });
    }

    render();
  });

  /* ==================== P2-02 生成结果编辑页 ==================== */
  App.register("doc-editor", el => {
    const draft = DB.docDraft;
    const revisions = [
      { time: Date.now() - 40 * 60e3, user: "王志远", text: "AI 生成初稿" },
      { time: Date.now() - 30 * 60e3, user: "王志远", text: "人工修改「二、流量与收费分析」第2段" },
      { time: Date.now() - 12 * 60e3, user: "王志远", text: "AI 润色「五、问题与建议」第1段" }
    ];

    el.innerHTML = `
      ${App.header("生成结果编辑", `${U.esc(draft.title)} · 修订模式`, `
        <button class="btn" id="edRefresh">AI 全文润色</button>
        <button class="btn" id="edSave">保存</button>
        <button class="btn primary" id="edSubmit">提交审核</button>`)}
      <div class="doc-editor">
        <div class="doc-outline">
          <div class="text-sub text-sm mb-8" style="padding:0 10px">文档大纲</div>
          ${draft.sections.map((s, i) => `
            <div class="do-item ${i === 0 ? "active" : ""}" data-sec="${s.id}">
              <span>${U.esc(s.title)}</span><span class="text-sub">${s.paras.length}段</span>
            </div>`).join("")}
          <div class="help-text" style="padding:0 10px">章节支持拖拽排序（原型示意）</div>
        </div>
        <div class="doc-main">
          <div class="dm-head">
            <span class="tag blue">修订模式</span>
            <span class="text-sub text-sm">自动保存 · 刚刚</span>
            <span class="flex-1"></span>
            <button class="btn sm" id="edUndo">撤销</button>
            <button class="btn sm" id="edRedo">恢复</button>
            <span class="text-sub text-sm" id="edCount">3,246 字</span>
          </div>
          <div class="dm-body" id="edBody">
            <input class="doc-title-input" id="edTitle" value="${U.esc(draft.title)}">
            ${draft.sections.map(s => `
              <div class="doc-section" data-sec="${s.id}">
                <div class="doc-h">${U.esc(s.title)}</div>
                ${s.paras.map((p, pi) => `
                  <div class="doc-para" data-p="${pi}">
                    <div class="dp-tools">
                      <button class="btn sm" data-ai>✨ 润色</button>
                      <button class="btn sm" data-expand>⤢ 扩写</button>
                    </div>
                    <div class="dp-text">${U.esc(p)}<span class="dp-cite" title="${U.esc(draft.citations.filter(c => s.cites && s.cites.includes(c.id)).map(c => c.title).join("；"))}">[${(s.cites || []).join("][")}]</span></div>
                  </div>`).join("")}
              </div>`).join("")}
          </div>
        </div>
        <div class="doc-side">
          <div class="tabs" style="margin-bottom:12px">
            <div class="tab-item active" data-tab="cite">引用溯源</div>
            <div class="tab-item" data-tab="rev">修订记录</div>
          </div>
          <div id="sideCite">
            ${draft.citations.map(c => `
              <div class="file-item" style="padding:10px 12px">
                <div class="fi-icon" style="background:var(--primary-light);color:var(--primary)">📄</div>
                <div class="fi-info"><div class="fi-name">[${c.id}] ${U.esc(c.title)}</div><div class="fi-size">${U.esc(c.from)}</div></div>
              </div>`).join("")}
          </div>
          <div id="sideRev" style="display:none">
            <div class="timeline">
              ${revisions.map((r, i) => `
                <div class="tl-item ${i === 0 ? "hot" : ""}">
                  <div class="tl-time">${U.fmtTime(r.time)} · ${U.esc(r.user)}</div>
                  <div class="tl-text">${U.esc(r.text)}</div>
                </div>`).join("")}
            </div>
          </div>
        </div>
      </div>`;

    // 大纲定位
    el.querySelectorAll("[data-sec]").forEach(item => item.onclick = () => {
      el.querySelectorAll("[data-sec]").forEach(x => x.classList.remove("active"));
      item.classList.add("active");
      const sec = el.querySelector(".doc-main .doc-section[data-sec='" + item.dataset.sec + "']");
      if (sec) sec.scrollIntoView({ behavior: "smooth", block: "start" });
    });
    // 段落编辑（contenteditable）
    el.querySelectorAll(".dp-text").forEach(p => {
      p.contentEditable = true;
      p.addEventListener("blur", () => U.toast("段落已保存", "success", 1200));
    });
    // 段落 AI 操作
    el.querySelectorAll(".doc-para").forEach(para => {
      const text = para.querySelector(".dp-text");
      para.querySelector("[data-ai]").onclick = () => aiAction(text, "润色");
      para.querySelector("[data-expand]").onclick = () => aiAction(text, "扩写");
    });
    async function aiAction(text, kind) {
      const orig = text.textContent.replace(/\[\d\]/g, "");
      text.style.opacity = .5;
      await U.delay(900);
      const extra = kind === "润色" ? "" : " 需要特别关注的是，相关指标变化背后存在结构性因素影响，建议结合历史同期数据与现场调研情况综合研判，并在下一统计周期内持续跟踪验证。";
      await U.stream(text, orig + extra, { speed: 10 });
      revisions.unshift({ time: Date.now(), user: (App.user || {}).name || "当前用户", text: `AI ${kind}：${orig.slice(0, 20)}…` });
      U.toast(`AI ${kind}完成`, "success");
    }
    el.querySelector("#edRefresh").onclick = async () => {
      U.toast("正在对全文进行一致性润色…", "info", 1500);
      await U.delay(1600);
      U.toast("全文润色完成，共优化 11 处表述", "success");
    };
    el.querySelector("#edSave").onclick = () => U.toast("文档已保存为 V1.1 草稿", "success");
    el.querySelector("#edSubmit").onclick = () => U.confirm("提交后文档将进入审核流程（审核人：李文静），确定提交吗？", "提交审核").then(ok => {
      if (ok) U.toast("已提交审核，可在【生成记录】中跟踪状态", "success");
    });
    el.querySelector("#edUndo").onclick = () => U.toast("已撤销上一步操作", "info", 1500);
    el.querySelector("#edRedo").onclick = () => U.toast("已恢复操作", "info", 1500);
    // 侧栏 Tab
    el.querySelectorAll("[data-tab]").forEach(t => t.onclick = () => {
      el.querySelectorAll("[data-tab]").forEach(x => x.classList.remove("active"));
      t.classList.add("active");
      const isCite = t.dataset.tab === "cite";
      el.querySelector("#sideCite").style.display = isCite ? "" : "none";
      el.querySelector("#sideRev").style.display = isCite ? "none" : "";
    });
  });

  /* ==================== P2-03 生成记录列表 ==================== */
  App.register("doc-records", el => {
    const stMap = {
      generating: { text: "生成中", cls: "blue" }, done: { text: "已完成", cls: "green" },
      failed: { text: "生成失败", cls: "red" }, reviewed: { text: "已审核", cls: "purple" }
    };
    el.innerHTML = `
      ${App.header("文档生成记录", "全部生成任务的状态跟踪，生成完成后可查看、编辑、导出", `<button class="btn" onclick="U.toast('原型演示：已导出记录清单','success')">导出清单</button>`)}
      <div class="card">
        <div class="search-bar">
          <input class="input" id="rKw" placeholder="搜索文档标题">
          <select class="input w-140" id="rStatus"><option value="">全部状态</option><option value="generating">生成中</option><option value="done">已完成</option><option value="failed">生成失败</option></select>
          <span class="flex-gap"></span><span class="text-sub text-sm" id="rCount"></span>
        </div>
        <div id="recTable"></div>
      </div>`;

    function draw() {
      const kw = el.querySelector("#rKw").value.trim().toLowerCase();
      const st = el.querySelector("#rStatus").value;
      const rows = DB.docTasks.filter(d =>
        (!kw || d.title.toLowerCase().includes(kw)) && (!st || d.status === st));
      el.querySelector("#rCount").textContent = `共 ${rows.length} 条记录`;
      U.renderTable(el.querySelector("#recTable"), {
        rows,
        pageSize: 8,
        cols: [
          { title: "任务号", key: "id", render: r => `<span class="mono">${r.id}</span>` },
          { title: "文档标题", key: "title", render: r => `<span class="cell-link">${U.esc(r.title)}</span>` },
          { title: "模板", key: "template", width: "180px" },
          { title: "创建人", key: "creator", width: "90px" },
          { title: "创建时间", key: "createAt", render: r => U.fmtTime(r.createAt), width: "160px" },
          { title: "状态", key: "status", render: r => U.statusTag(stMap, r.status), width: "100px" },
          { title: "操作", width: "200px", render: r => r.status === "generating"
              ? `<span class="progress-bar" style="width:120px;display:inline-block"><span class="pb-inner" style="width:${r.progress}%"></span></span>`
              : `${r.status === "done" ? `<button class="btn link sm" data-a="view">查看</button><button class="btn link sm" data-a="edit">编辑</button><button class="btn link sm" data-a="export">导出</button>` : `<button class="btn link sm" data-a="retry">重试</button><button class="btn link sm danger" data-a="del">删除</button>`}` }
        ],
        afterDraw(container) {
          container.querySelectorAll('[data-a="view"]').forEach(b => b.onclick = () => openView(b));
          container.querySelectorAll('[data-a="edit"]').forEach(b => b.onclick = () => App.nav("doc-editor"));
          container.querySelectorAll('[data-a="export"]').forEach(b => b.onclick = () => U.toast("原型演示：已导出 .docx", "success"));
          container.querySelectorAll('[data-a="retry"]').forEach(b => b.onclick = () => { U.toast("已重新发起生成任务", "success"); App.nav("doc-workbench"); });
          container.querySelectorAll('[data-a="del"]').forEach(b => b.onclick = () => U.confirm("确定删除该生成记录吗？", "删除记录").then(ok => {
            if (!ok) return;
            const tr = b.closest("tr"), id = tr.children[0].textContent;
            const i = DB.docTasks.findIndex(x => x.id === id);
            if (i > -1) DB.docTasks.splice(i, 1);
            U.toast("记录已删除", "success"); draw();
          }));
        }
      });
    }

    function openView(b) {
      const tr = b.closest("tr"), id = tr.children[0].textContent;
      const d = DB.docTasks.find(x => x.id === id) || DB.docTasks[0];
      U.drawer({
        title: d.title, width: "w-760",
        body: `
          <div class="desc-list" style="margin-bottom:16px">
            <dt>任务号</dt><dd class="mono">${d.id}</dd>
            <dt>模板</dt><dd>${U.esc(d.template)}</dd>
            <dt>创建人</dt><dd>${U.esc(d.creator)}</dd>
            <dt>创建时间</dt><dd>${U.fmtTime(d.createAt)}</dd>
            <dt>字数</dt><dd>${d.words ? U.fmtNum(d.words) + " 字" : "-"}</dd>
            <dt>审核状态</dt><dd>${d.reviewed ? `<span class="tag purple">已审核</span>` : `<span class="tag orange">待审核</span>`}</dd>
          </div>
          <div class="section-title">内容预览</div>
          <div class="text-sm text-muted" style="line-height:2;background:var(--bg);border-radius:8px;padding:14px">
            ${DB.docDraft.sections.slice(0, 3).map(s => `<b>${U.esc(s.title)}</b><br>${U.esc(s.paras[0])}<br>`).join("<br>")}
          </div>`,
        footer: `<button class="btn" data-close>关闭</button><button class="btn" id="dvExport">导出 Word</button><button class="btn primary" id="dvEdit">进入编辑</button>`,
        onOpen(api) {
          api.box.querySelector("#dvExport").onclick = () => U.toast("原型演示：已导出 .docx", "success");
          api.box.querySelector("#dvEdit").onclick = () => { api.close(); App.nav("doc-editor"); };
        }
      });
    }

    el.querySelector("#rKw").oninput = U.debounce(draw, 250);
    el.querySelector("#rStatus").onchange = draw;
    draw();
  });

  /* ==================== P2-04 模板管理 ==================== */
  App.register("doc-templates", el => {
    el.innerHTML = `
      ${App.header("文档模板管理", "业务文档模板的维护：章节结构、适用范围、启停控制", `
        <button class="btn primary" id="tplNew">＋ 新建模板</button>`)}
      <div class="grid cols-3" id="tplGrid"></div>`;

    const grid = el.querySelector("#tplGrid");
    function draw() {
      grid.innerHTML = DB.templates.map(t => `
        <div class="card" style="margin:0">
          <div class="flex justify-b align-c mb-8">
            <span class="fwb">${U.esc(t.name)}</span>
            ${t.status === "enabled" ? `<span class="tag green"><span class="dot" style="background:var(--success)"></span>启用</span>` : `<span class="tag gray">停用</span>`}
          </div>
          <div class="text-sub text-sm" style="min-height:40px">章节：${t.chapters.map((c, i) => `${i + 1}.${U.esc(c)}`).join("，")}</div>
          <div class="kv-list mt-16" style="grid-template-columns:1fr">
            <div class="kv"><span class="k">责任部门</span><span>${U.esc(t.owner)}</span></div>
            <div class="kv"><span class="k">使用次数 / 更新时间</span><span>${t.usage} 次 · ${U.fmtDate(t.updateTime)}</span></div>
          </div>
          <div class="flex gap-8 mt-16">
            <button class="btn sm primary" data-t="edit" data-id="${t.id}">编辑</button>
            <button class="btn sm" data-t="copy" data-id="${t.id}">复制</button>
            <button class="btn sm" data-t="toggle" data-id="${t.id}">${t.status === "enabled" ? "停用" : "启用"}</button>
            <span class="flex-1"></span>
            <button class="btn sm danger" data-t="del" data-id="${t.id}">删除</button>
          </div>
        </div>`).join("");
      grid.querySelectorAll("[data-t]").forEach(b => b.onclick = () => {
        const t = DB.templates.find(x => x.id === b.dataset.id);
        const act = b.dataset.t;
        if (act === "edit") App.nav("tpl-editor", { id: t.id });
        else if (act === "copy") {
          DB.templates.unshift({ ...t, id: "TPL" + String(DB.templates.length + 1).padStart(2, "0"), name: t.name + "（副本）", usage: 0, status: "disabled" });
          U.toast("模板已复制（默认停用状态）", "success"); draw();
        } else if (act === "toggle") {
          t.status = t.status === "enabled" ? "disabled" : "enabled";
          U.toast(t.status === "enabled" ? "模板已启用" : "模板已停用，新建任务将不可选择该模板", "success"); draw();
        } else if (act === "del") {
          if (t.usage > 50) { U.toast("该模板已产生使用记录，不允许删除，请停用", "error"); return; }
          U.confirm("删除模板不可恢复，确定删除吗？", "删除模板").then(ok => {
            if (!ok) return;
            DB.templates.splice(DB.templates.indexOf(t), 1);
            U.toast("模板已删除", "success"); draw();
          });
        }
      });
    }
    el.querySelector("#tplNew").onclick = () => App.nav("tpl-editor", { id: "" });
    draw();
  });

  /* ==================== P2-05 模板编辑器 ==================== */
  App.register("tpl-editor", el => {
    const p = App.params || {};
    const isNew = !p.id;
    const t = isNew ? { id: "", name: "", category: "运营分析", owner: "集团运营部", status: "disabled", chapters: [], usage: 0, updateTime: Date.now() } : DB.templates.find(x => x.id === p.id);

    el.innerHTML = `
      ${App.header(isNew ? "新建模板" : "编辑模板", isNew ? "定义模板基础信息与章节结构" : `模板编号 ${t.id} · 使用 ${t.usage} 次`, `
        <button class="btn" onclick="history.back()">返回</button>
        <button class="btn primary" id="teSave">保存模板</button>`)}
      <div class="grid cols-2">
        <div class="card">
          <div class="card-title">基础信息</div>
          <div class="form-item"><label>模板名称<span class="req">*</span></label>
            <input class="input" id="teName" value="${U.esc(t.name)}" placeholder="例如：季度安全形势分析报告">
            <div class="err-msg">请填写模板名称</div></div>
          <div class="form-row">
            <div class="form-item"><label>分类</label>
              <select class="input" id="teCat">${["运营分析", "应急安全", "运营调度", "养护管理", "稽查管理", "服务管理"].map(c => `<option ${t.category === c ? "selected" : ""}>${c}</option>`).join("")}</select></div>
            <div class="form-item"><label>责任部门</label>
              <select class="input" id="teOwner">${["集团运营部", "运维中心", "稽查大队", "客服中心", "知识管理部"].map(c => `<option ${t.owner === c ? "selected" : ""}>${c}</option>`).join("")}</select></div>
          </div>
          <div class="form-item"><label>状态</label>
            <div class="flex align-c gap-12">
              <span class="switch ${t.status === "enabled" ? "on" : ""}" id="teStatus"></span>
              <span class="text-sub text-sm">启用后可在生成工作台选择该模板</span>
            </div></div>
          <div class="form-item"><label>适用范围</label>
            <label class="checkbox"><input type="checkbox" checked>集团本部</label>
            <label class="checkbox"><input type="checkbox" checked>分公司/路段</label>
            <label class="checkbox"><input type="checkbox">收费站/工区</label>
          </div>
        </div>
        <div class="card">
          <div class="card-title">章节结构<span class="ct-extra">拖拽调整顺序 · 至少 1 章</span></div>
          <div id="teChapters"></div>
          <button class="btn block" id="teAddChapter" style="margin-top:12px">＋ 添加章节</button>
        </div>
      </div>`;

    const chBox = el.querySelector("#teChapters");
    function renderChapters() {
      chBox.innerHTML = t.chapters.length ? t.chapters.map((c, i) => `
        <div class="flex align-c gap-8" style="padding:8px 10px;border:1px solid var(--border);border-radius:8px;margin-bottom:8px">
          <span class="text-sub" style="cursor:grab">⋮⋮</span>
          <span class="text-sub">${i + 1}</span>
          <input class="input flex-1" value="${U.esc(c)}" data-ci="${i}">
          <button class="btn sm danger" data-cd="${i}">删除</button>
        </div>`).join("") : `<div class="empty-state" style="padding:20px"><div class="es-icon">📄</div>尚未定义章节</div>`;
      chBox.querySelectorAll("[data-ci]").forEach(inp => inp.oninput = e => t.chapters[+e.target.dataset.ci] = e.target.value);
      chBox.querySelectorAll("[data-cd]").forEach(b => b.onclick = () => {
        t.chapters.splice(+b.dataset.cd, 1); renderChapters();
      });
    }
    el.querySelector("#teAddChapter").onclick = () => { t.chapters.push("新章节"); renderChapters(); };
    renderChapters();

    el.querySelector("#teStatus").onclick = e => e.target.classList.toggle("on");
    el.querySelector("#teSave").onclick = () => {
      const name = el.querySelector("#teName");
      if (!name.value.trim()) { name.closest(".form-item").classList.add("has-err"); name.classList.add("err"); U.toast("请填写模板名称", "error"); return; }
      if (!t.chapters.length) { U.toast("请至少定义一个章节", "error"); return; }
      t.name = name.value.trim();
      t.category = el.querySelector("#teCat").value;
      t.owner = el.querySelector("#teOwner").value;
      t.status = el.querySelector("#teStatus").classList.contains("on") ? "enabled" : "disabled";
      t.updateTime = Date.now();
      if (isNew) { t.id = "TPL" + String(DB.templates.length + 1).padStart(2, "0"); DB.templates.push(t); }
      U.toast("模板已保存", "success");
      App.nav("doc-templates");
    };
  });
})();
