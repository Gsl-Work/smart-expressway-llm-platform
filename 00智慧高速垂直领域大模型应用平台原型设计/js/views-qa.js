/* ============================================================
   智能问答模块视图（views-qa.js）
   P1-01 问答工作台 / P1-02 会话历史 / P1-03 人工兜底工单
   ============================================================ */
(function () {
  "use strict";

  /* ==================== P1-01 问答工作台 ==================== */
  App.register("qa-workbench", el => {
    el.innerHTML = `
      ${App.header("智能问答工作台", "基于集团知识库的 RAG 增强问答 · 模型：交控大模型 v2.1", `
        <select class="input" id="modelSel" style="width:190px;height:34px">
          <option>交控大模型 v2.1（推荐）</option>
          <option>交控大模型 v1.8（稳定）</option>
          <option>通用问答（无知识库）</option>
        </select>
        <button class="btn" id="btnNewSession">＋ 新会话</button>
      `)}
      <div class="qa-layout">
        <div class="qa-sessions">
          <div class="qs-head">
            <button class="btn primary sm block" id="btnNew2" style="width:100%">＋ 新建会话</button>
          </div>
          <div class="qs-list" id="sessionList"></div>
        </div>
        <div class="qa-chat">
          <div class="qc-head">
            <span class="tag blue"><span class="dot" style="background:var(--success)"></span>知识库已连接</span>
            <span class="text-sub text-sm">检索条目 1,716 · 近30天问答 54,210 次</span>
            <span class="flex-1"></span>
            <button class="btn sm" id="btnExport">导出会话</button>
            <button class="btn sm" id="btnTicket" title="未解决问题转人工">转人工工单</button>
          </div>
          <div class="qc-messages" id="messages"></div>
          <div class="qa-input-bar">
            <div class="qa-input-box">
              <textarea id="chatInput" placeholder="请输入您的问题，Enter 发送 / Shift+Enter 换行…（例如：节假日免费通行的时间范围是？）"></textarea>
              <div class="qib-foot">
                <div class="qib-tools">
                  <span id="toolRag" class="on" title="检索增强">🔗 知识库检索</span>
                  <span id="toolCtx" title="多轮上下文">🧠 上下文记忆</span>
                  <span class="text-sub" style="cursor:default">字数 ≤ 2000</span>
                </div>
                <button class="btn primary" id="btnSend">发送 ➤</button>
              </div>
            </div>
          </div>
        </div>
        <div class="qa-side">
          <div class="fwb mb-8" style="font-size:13.5px">推荐问题</div>
          <div class="suggest-list" id="suggestList"></div>
          <div class="section-title" style="margin-top:20px">会话信息</div>
          <div class="kv-list" id="sessionInfo" style="grid-template-columns:1fr"></div>
        </div>
      </div>`;

    const msgsEl = el.querySelector("#messages");
    const inputEl = el.querySelector("#chatInput");
    let currentSession = DB.qaSessions[0];
    let answerQueue = DB.qaAnswers.slice();

    /* ---- 会话列表 ---- */
    function renderSessions() {
      const list = el.querySelector("#sessionList");
      list.innerHTML = DB.qaSessions.map(s => `
        <div class="qa-session-item ${s.id === (currentSession || {}).id ? "active" : ""}" data-sid="${s.id}">
          <div class="qsi-title">${U.esc(s.title)}</div>
          <div class="qsi-meta">${U.fmtTime(s.time)} · ${s.count} 轮</div>
        </div>`).join("");
      list.querySelectorAll("[data-sid]").forEach(item => item.onclick = () => {
        currentSession = DB.qaSessions.find(s => s.id === item.dataset.sid);
        renderSessions(); renderMessages(); renderSessionInfo();
      });
    }

    function renderSessionInfo() {
      const info = el.querySelector("#sessionInfo");
      if (!currentSession) { info.innerHTML = `<div class="kv"><span class="k">暂无会话</span></div>`; return; }
      info.innerHTML = `
        <div class="kv"><span class="k">会话编号</span><span class="mono">${currentSession.id}</span></div>
        <div class="kv"><span class="k">创建时间</span><span>${U.fmtTime(currentSession.time)}</span></div>
        <div class="kv"><span class="k">对话轮数</span><span>${currentSession.count}</span></div>
        <div class="kv"><span class="k">数据范围</span><span>${U.esc((App.user || {}).dept || "本人权限范围")}</span></div>`;
    }

    /* ---- 消息渲染 ---- */
    function renderMsg(m, streaming) {
      const u = App.user || { name: "用户" };
      const confBadge = m.conf == null ? "" : confHtml(m.conf);
      const cites = (m.cites || []).map(c =>
        `<span class="cite-chip" title="点击查看引用来源">📎 ${U.esc(c)}</span>`).join("");
      const meta = m.role === "ai" && !streaming ? `
        <div class="m-meta">
          ${confBadge}
          <span class="m-actions">
            <span class="ma-btn" title="复制" data-act="copy">⧉</span>
            <span class="ma-btn" title="赞" data-act="good">👍</span>
            <span class="ma-btn" title="踩" data-act="bad">👎</span>
            <span class="ma-btn" title="重新生成" data-act="regen">↻</span>
          </span>
        </div>` : "";
      return `<div class="msg ${m.role === "user" ? "user" : "ai"}" data-mid="${m.mid || ""}">
        <div class="m-avatar">${m.role === "user" ? U.esc(u.name.slice(0, 1)) : "AI"}</div>
        <div class="m-body">
          <div class="m-bubble ${m.role === "ai" ? "md" : ""}">${m.role === "ai" ? U.mdLite(m.text) : U.esc(m.text)}</div>
          ${m.role === "ai" && !streaming && cites ? `<div class="citations">${cites}</div>` : ""}
          ${meta}
        </div>
      </div>`;
    }

    function confHtml(conf) {
      const level = conf >= 0.85 ? "high" : conf >= 0.6 ? "mid" : "low";
      const label = level === "high" ? "高置信" : level === "mid" ? "中置信" : "低置信";
      return `<span class="conf-badge ${level}" title="综合置信度 ${Math.round(conf * 100)}%">置信度 ${Math.round(conf * 100)}% · ${label}</span>`;
    }

    function renderMessages() {
      if (!currentSession || !currentSession.messages.length) {
        msgsEl.innerHTML = `
          <div class="chat-welcome">
            <div class="cw-icon">💬</div>
            <h3>您好，我是交控大模型助手</h3>
            <div class="text-muted text-sm">我已学习集团知识库 1,716 条知识，可为您解答收费政策、养护管理、应急处置等问题</div>
            <div class="cw-sug" id="welcomeSug"></div>
          </div>`;
        const sug = msgsEl.querySelector("#welcomeSug");
        DB.qaAnswers.forEach((a, i) => {
          const q = ["节假日免费通行的时间范围？", "桥梁定期检测的周期要求？", "恶劣天气封路标准是什么？", "超限运输车辆如何认定？", "收费广场拥堵怎么分级响应？"][i];
          if (q) { const sp = document.createElement("span"); sp.textContent = q; sp.onclick = () => { inputEl.value = q; send(); }; sug.appendChild(sp); }
        });
        return;
      }
      msgsEl.innerHTML = currentSession.messages.map(m => renderMsg(m)).join("");
      bindMsgActions();
      msgsEl.scrollTop = msgsEl.scrollHeight;
    }

    function bindMsgActions() {
      msgsEl.querySelectorAll(".ma-btn").forEach(b => {
        b.onclick = e => {
          e.stopPropagation();
          const act = b.dataset.act;
          if (act === "copy") U.toast("已复制到剪贴板", "success", 1500);
          else if (act === "good") { b.classList.add("active"); U.toast("感谢反馈，已记录满意度评价", "success", 1800); }
          else if (act === "bad") { b.classList.add("active"); U.toast("已记录，将用于优化知识库与模型", "info", 1800); }
          else if (act === "regen") { doAnswer(true); }
        };
      });
      msgsEl.querySelectorAll(".cite-chip").forEach(c => {
        c.onclick = () => U.toast("原型演示：引用详情抽屉（含原文高亮定位）", "info", 2000);
      });
    }

    /* ---- 发送与模拟生成 ---- */
    let busy = false;
    async function send() {
      if (busy) { U.toast("正在生成回答，请稍候…", "warning", 1500); return; }
      const q = inputEl.value.trim();
      if (!q) { U.toast("请输入问题", "warning", 1500); return; }
      if (q.length > 2000) { U.toast("问题长度超过 2000 字上限", "error"); return; }
      if (!currentSession) {
        currentSession = { id: "SE" + Math.floor(10000 + Math.random() * 9000), title: q.slice(0, 16), time: Date.now(), count: 0, messages: [] };
        DB.qaSessions.unshift(currentSession);
      }
      busy = true;
      inputEl.value = "";
      currentSession.messages.push({ role: "user", text: q, mid: U.uid("m") });
      currentSession.count += 1;
      renderMessages(); renderSessions();
      await doAnswer();
      busy = false;
    }

    async function doAnswer(isRegen) {
      // 检索中提示
      const think = document.createElement("div");
      think.className = "msg ai";
      think.innerHTML = `<div class="m-avatar">AI</div><div class="m-body"><div class="m-bubble md"><span class="cursor-blink"></span>&nbsp;正在检索知识库…</div></div>`;
      msgsEl.appendChild(think);
      msgsEl.scrollTop = msgsEl.scrollHeight;
      await U.delay(700);
      think.remove();

      // 命中答案（关键词简单匹配，否则兜底）
      const ans = answerQueue.shift();
      const fallback = ans == null || (isRegen === undefined && Math.random() < 0);
      const target = ans || DB.qaFallbackAnswer;
      const m = { role: "ai", text: target.text, conf: target.conf, cites: target.cites, mid: U.uid("m") };
      const wrap = document.createElement("div");
      wrap.innerHTML = renderMsg(m, true);
      msgsEl.appendChild(wrap.firstChild);
      const bubble = msgsEl.lastElementChild.querySelector(".m-bubble");
      await U.stream(bubble, target.text, { scrollWrap: msgsEl });
      currentSession.messages.push(m);
      // 重绘以展示引用与操作条
      renderMessages(); renderSessions(); renderSessionInfo();
    }

    el.querySelector("#btnSend").onclick = send;
    inputEl.addEventListener("keydown", e => {
      if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); }
    });
    el.querySelector("#btnNewSession").onclick = el.querySelector("#btnNew2").onclick = () => {
      currentSession = null;
      renderSessions(); renderMessages(); renderSessionInfo();
      inputEl.focus();
    };
    el.querySelector("#btnExport").onclick = () => U.toast("原型演示：会话已导出为 Markdown 文件", "success");
    el.querySelector("#btnTicket").onclick = () => {
      U.modal({
        title: "转人工工单",
        body: `
          <div class="form-item"><label>问题摘要<span class="req">*</span></label><input class="input" id="tkQ" value="${U.esc(inputEl.value || (currentSession ? currentSession.title : ""))}"></div>
          <div class="form-item"><label>补充说明</label><textarea class="input" rows="3" placeholder="请补充问题背景、期望答复时间等"></textarea></div>
          <div class="form-item"><label>紧急程度</label>
            <label class="radio"><input type="radio" name="tkPri" checked>普通（24小时内答复）</label>
            <label class="radio"><input type="radio" name="tkPri">紧急（2小时内答复）</label>
          </div>`,
        onOk: () => U.toast("工单已提交，客服人员将尽快跟进（原型演示）", "success")
      });
    };
    // 工具开关
    const rag = el.querySelector("#toolRag"), ctx = el.querySelector("#toolCtx");
    rag.onclick = () => { rag.classList.toggle("on"); U.toast(rag.classList.contains("on") ? "已开启知识库检索增强" : "已关闭知识库检索增强", "info", 1500); };
    ctx.onclick = () => { ctx.classList.toggle("on"); U.toast(ctx.classList.contains("on") ? "已开启多轮上下文记忆" : "已关闭多轮上下文记忆", "info", 1500); };

    // 推荐问题
    const sugList = el.querySelector("#suggestList");
    DB.querySuggests.slice(0, 4).forEach(q => {
      const d = document.createElement("div");
      d.className = "suggest-item"; d.textContent = q;
      d.onclick = () => { inputEl.value = q; send(); };
      sugList.appendChild(d);
    });

    renderSessions(); renderMessages(); renderSessionInfo();
  });

  /* ==================== P1-02 会话历史 ==================== */
  App.register("qa-history", el => {
    el.innerHTML = `
      ${App.header("会话历史", "个人近 90 天问答会话记录，支持检索、导出与归档", `<button class="btn" onclick="U.toast('原型演示：已按当前筛选条件导出 Excel','success')">导出记录</button>`)}
      <div class="card">
        <div class="search-bar">
          <input class="input" id="hKw" placeholder="搜索会话标题">
          <select class="input w-140" id="hRange"><option value="">全部时间</option><option value="1">今天</option><option value="7">近7天</option><option value="30">近30天</option></select>
          <span class="flex-gap"></span>
          <span class="text-sub text-sm" id="hCount"></span>
        </div>
        <div id="histTable"></div>
      </div>`;

    const statusMap = { archived: { text: "已归档", cls: "gray" } };
    function draw() {
      const kw = el.querySelector("#hKw").value.trim().toLowerCase();
      const range = el.querySelector("#hRange").value;
      const rows = DB.qaSessions.filter(s => {
        if (kw && !s.title.toLowerCase().includes(kw)) return false;
        if (range) { const days = (Date.now() - s.time) / 24e3 / 3600; if (days > +range) return false; }
        return true;
      });
      el.querySelector("#hCount").textContent = `共 ${rows.length} 个会话`;
      U.renderTable(el.querySelector("#histTable"), {
        rows,
        pageSize: 8,
        cols: [
          { title: "会话编号", key: "id", render: r => `<span class="mono">${r.id}</span>` },
          { title: "会话标题", key: "title", render: r => `<span class="cell-link">${U.esc(r.title)}</span>` },
          { title: "轮数", key: "count", width: "70px" },
          { title: "最近提问时间", key: "time", render: r => U.fmtTime(r.time), width: "170px" },
          { title: "满意度", width: "100px", render: r => r.feedback || (r.count > 3 ? `<span class="tag green">已评价·满意</span>` : `<span class="tag gray">未评价</span>`) },
          { title: "状态", width: "100px", render: r => U.statusTag(statusMap, r.status || "active") },
          { title: "操作", width: "170px", render: r => `
            <button class="btn link sm" data-act="open">查看</button>
            <button class="btn link sm" data-act="arch">归档</button>
            <button class="btn link sm danger" data-act="del">删除</button>` }
        ],
        afterDraw(container) {
          container.querySelectorAll('[data-act="open"]').forEach(b => b.onclick = () => App.nav("qa-workbench"));
          container.querySelectorAll('[data-act="arch"]').forEach(b => b.onclick = () => {
            const tr = b.closest("tr"); const sid = tr.children[0].textContent;
            const s = DB.qaSessions.find(x => x.id === sid); if (s) s.status = "archived";
            U.toast("会话已归档，归档会话仅本人可见", "success"); draw();
          });
          container.querySelectorAll('[data-act="del"]').forEach(b => b.onclick = () => {
            U.confirm("删除后不可恢复，确定删除该会话吗？", "删除会话").then(ok => {
              if (!ok) return;
              const tr = b.closest("tr"); const sid = tr.children[0].textContent;
              const idx = DB.qaSessions.findIndex(x => x.id === sid);
              if (idx > -1) DB.qaSessions.splice(idx, 1);
              U.toast("会话已删除", "success"); draw();
            });
          });
        }
      });
    }
    el.querySelector("#hKw").oninput = U.debounce(draw, 250);
    el.querySelector("#hRange").onchange = draw;
    draw();
  });

  /* ==================== P1-03 人工兜底工单 ==================== */
  App.register("qa-tickets", el => {
    const stMap = { open: { text: "待处理", cls: "red" }, processing: { text: "处理中", cls: "orange" }, closed: { text: "已办结", cls: "green" } };
    el.innerHTML = `
      ${App.header("人工兜底工单", "AI 无法解答的问题自动转人工，客服人员在此处理与回复", `
        <select class="input" id="tFilter" style="width:130px;height:34px"><option value="">全部状态</option><option value="open">待处理</option><option value="processing">处理中</option><option value="closed">已办结</option></select>
      `)}
      <div class="grid cols-4 mb-16">
        <div class="stat-card"><div class="sc-icon" style="background:var(--danger-light);color:var(--danger)">🎫</div><div><div class="sc-value">2</div><div class="sc-label">待处理</div></div></div>
        <div class="stat-card"><div class="sc-icon" style="background:var(--warning-light);color:var(--warning)">⏱</div><div><div class="sc-value">2</div><div class="sc-label">处理中</div></div></div>
        <div class="stat-card"><div class="sc-icon" style="background:var(--success-light);color:var(--success)">✓</div><div><div class="sc-value">96.3%</div><div class="sc-label">本月按期办结率</div></div></div>
        <div class="stat-card"><div class="sc-icon" style="background:var(--primary-light);color:var(--primary)">📈</div><div><div class="sc-value">2.1h</div><div class="sc-label">平均响应时长</div></div></div>
      </div>
      <div class="card"><div id="tkTable"></div></div>`;

    function draw() {
      const f = el.querySelector("#tFilter").value;
      const rows = DB.tickets.filter(t => !f || t.status === f);
      U.renderTable(el.querySelector("#tkTable"), {
        rows,
        pageSize: 8,
        rowClick: t => openDetail(t),
        cols: [
          { title: "工单号", key: "id", render: r => `<span class="mono">${r.id}</span>` },
          { title: "问题摘要", key: "question", render: r => `<span class="cell-link">${U.esc(r.question)}</span>` },
          { title: "提问人", key: "asker", width: "150px" },
          { title: "来源", key: "channel", width: "110px" },
          { title: "创建时间", key: "createAt", render: r => U.fmtTime(r.createAt), width: "160px" },
          { title: "SLA", key: "sla", width: "80px" },
          { title: "状态", key: "status", render: r => U.statusTag(stMap, r.status), width: "90px" }
        ]
      });
    }
    el.querySelector("#tFilter").onchange = draw;

    function openDetail(t) {
      U.drawer({
        title: `工单 ${t.id}`,
        width: "w-760",
        body: `
          <div class="mb-16">${U.statusTag(stMap, t.status)}</div>
          <div class="desc-list">
            <dt>问题摘要</dt><dd class="fwb">${U.esc(t.question)}</dd>
            <dt>提问人</dt><dd>${U.esc(t.asker)}</dd>
            <dt>来源渠道</dt><dd>${U.esc(t.channel)}（会话 ${t.session}）</dd>
            <dt>创建时间</dt><dd>${U.fmtTime(t.createAt)}</dd>
            <dt>SLA 时限</dt><dd>${U.esc(t.sla)}</dd>
          </div>
          <div class="section-title">回复内容</div>
          <textarea class="input" id="tkReply" rows="5" placeholder="请输入回复内容…">${U.esc(t.reply || "")}</textarea>
          <div class="help-text">回复后将同步至提问用户的问答工作台，并计入知识回流候选（高频问题将转知识管理员沉淀入库）。</div>`,
        footer: t.status === "closed" ? `<button class="btn" data-close>关闭</button>` :
          `<button class="btn" data-close>取消</button><button class="btn" id="tkSave">保存草稿</button><button class="btn primary" id="tkDone">提交并办结</button>`,
        onOpen(api) {
          const save = done => {
            t.reply = api.box.querySelector("#tkReply").value;
            if (done) { t.status = "closed"; U.toast("工单已办结，回复已同步用户", "success"); api.close(); draw(); }
            else U.toast("草稿已保存", "success");
          };
          const s = api.box.querySelector("#tkSave"), d = api.box.querySelector("#tkDone");
          if (s) s.onclick = () => save(false);
          if (d) d.onclick = () => save(true);
        }
      });
    }
    draw();
  });
})();
