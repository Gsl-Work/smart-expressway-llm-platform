/* ============================================================
   工具与基础组件库：toast / modal / drawer / table / 图表 / 流式输出
   ============================================================ */
(function (global) {
  "use strict";
  const U = {};

  /* ---------- 基础 ---------- */
  U.esc = s => String(s == null ? "" : s)
    .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;").replace(/'/g, "&#39;");

  U.pad = n => String(n).padStart(2, "0");
  U.fmtDate = ts => { const d = new Date(ts); return `${d.getFullYear()}-${U.pad(d.getMonth() + 1)}-${U.pad(d.getDate())}`; };
  U.fmtTime = ts => { const d = new Date(ts); return `${U.fmtDate(ts)} ${U.pad(d.getHours())}:${U.pad(d.getMinutes())}`; };
  U.fmtNum = n => (n == null ? "-" : Number(n).toLocaleString("zh-CN"));
  U.uid = (p) => (p || "id") + "_" + Math.random().toString(36).slice(2, 9);
  U.debounce = (fn, ms) => { let t; return (...a) => { clearTimeout(t); t = setTimeout(() => fn(...a), ms); }; };

  /* ---------- Toast ---------- */
  U.toast = (msg, type = "info", ms = 2600) => {
    let wrap = document.querySelector(".toast-wrap");
    if (!wrap) { wrap = document.createElement("div"); wrap.className = "toast-wrap"; document.body.appendChild(wrap); }
    const icons = { info: "ℹ", success: "✓", error: "✕", warning: "⚠" };
    const el = document.createElement("div");
    el.className = "toast " + type;
    el.innerHTML = `<span>${icons[type] || "ℹ"}</span><span>${U.esc(msg)}</span>`;
    wrap.appendChild(el);
    setTimeout(() => { el.classList.add("out"); setTimeout(() => el.remove(), 350); }, ms);
  };

  /* ---------- Modal ---------- */
  let modalRoot = null;
  function ensureModalRoot() {
    if (!modalRoot) { modalRoot = document.createElement("div"); modalRoot.className = "modal-mask"; document.body.appendChild(modalRoot); }
    return modalRoot;
  }
  /**
   * U.modal({ title, body(html), footer(html), width: 'w-720', onOpen(box), onClose })
   * 返回 { close, box }
   */
  U.modal = opt => {
    const root = ensureModalRoot();
    root.innerHTML = `
      <div class="modal ${opt.width || ""}">
        <div class="modal-head"><h3>${opt.title || "标题"}</h3><span class="close" data-close>✕</span></div>
        <div class="modal-body">${opt.body || ""}</div>
        ${opt.footer === null ? "" : `<div class="modal-foot">${opt.footer || `<button class="btn" data-close>取消</button><button class="btn primary" data-ok>确定</button>`}</div>`}
      </div>`;
    root.classList.add("open");
    const api = {
      box: root.querySelector(".modal"),
      close() { root.classList.remove("open"); root.innerHTML = ""; opt.onClose && opt.onClose(); }
    };
    root.querySelectorAll("[data-close]").forEach(b => b.onclick = api.close);
    const ok = root.querySelector("[data-ok]");
    if (ok) ok.onclick = () => { const r = opt.onOk ? opt.onOk(api) : true; if (r !== false) api.close(); };
    root.onclick = e => { if (e.target === root) api.close(); };
    opt.onOpen && opt.onOpen(api);
    return api;
  };

  U.confirm = (msg, title = "操作确认") => new Promise(resolve => {
    const m = U.modal({
      title,
      body: `<div style="padding:6px 2px;font-size:14px;">${msg}</div>`,
      onOk: () => resolve(true),
      onClose: () => resolve(false)
    });
  });

  /* ---------- Drawer ---------- */
  U.drawer = opt => {
    let mask = document.querySelector(".drawer-mask");
    if (!mask) { mask = document.createElement("div"); mask.className = "drawer-mask"; document.body.appendChild(mask); }
    mask.innerHTML = `<div class="drawer ${opt.width || ""}">
      <div class="drawer-head"><h3>${opt.title || "详情"}</h3><span class="close" style="cursor:pointer;font-size:18px;color:var(--text-3)" data-close>✕</span></div>
      <div class="drawer-body">${opt.body || ""}</div>
      ${opt.footer ? `<div class="drawer-foot">${opt.footer}</div>` : ""}
    </div>`;
    mask.classList.add("open");
    const drawer = mask.querySelector(".drawer");
    requestAnimationFrame(() => drawer.classList.add("open"));
    const api = {
      box: drawer,
      close() { drawer.classList.remove("open"); setTimeout(() => { mask.classList.remove("open"); mask.innerHTML = ""; }, 260); opt.onClose && opt.onClose(); }
    };
    mask.querySelector("[data-close]").onclick = api.close;
    mask.onclick = e => { if (e.target === mask) api.close(); };
    opt.onOpen && opt.onOpen(api);
    return api;
  };

  /* ---------- 标签 ---------- */
  U.statusTag = (map, key) => {
    const it = map[key] || map.default || { text: key, cls: "gray" };
    return `<span class="tag ${it.cls}">${it.text}</span>`;
  };
  U.dot = color => `<span class="dot" style="background:${color}"></span>`;

  /* ---------- 表格渲染器 ----------
     U.renderTable(container, {
       cols: [{key, title, width, render(row, idx), cls}],
       rows: [...],
       pageSize: 10,
       rowClick(row), empty: '暂无数据'
     }) → { refresh(newRows) }
  */
  U.renderTable = (container, opt) => {
    let page = 1;
    const pageSize = opt.pageSize || 10;
    let rows = opt.rows || [];

    function draw() {
      const cols = opt.cols;
      const total = rows.length;
      const pages = Math.max(1, Math.ceil(total / pageSize));
      if (page > pages) page = pages;
      const slice = rows.slice((page - 1) * pageSize, page * pageSize);

      let html = `<div class="tbl-wrap"><table class="tbl"><thead><tr>`;
      cols.forEach(c => html += `<th style="${c.width ? "width:" + c.width : ""}">${c.title}</th>`);
      html += `</tr></thead><tbody>`;
      if (!slice.length) {
        html += `<tr><td class="tbl-empty" colspan="${cols.length}"><div class="empty-state"><div class="es-icon">🗒</div>${opt.empty || "暂无数据"}</div></td></tr>`;
      }
      slice.forEach((row, idx) => {
        html += `<tr ${opt.rowClick ? 'class="clickable"' : ""}>`;
        cols.forEach(c => {
          const v = c.render ? c.render(row, (page - 1) * pageSize + idx) : U.esc(row[c.key]);
          html += `<td>${v == null ? "-" : v}</td>`;
        });
        html += `</tr>`;
      });
      html += `</tbody></table></div>`;
      if (total > pageSize) {
        html += `<div class="pagination"><span class="pg-info">共 ${total} 条</span>
          <span class="pg-btn" data-pg="prev" ${page <= 1 ? "disabled" : ""}>‹</span>`;
        const start = Math.max(1, page - 2), end = Math.min(pages, start + 4);
        for (let i = start; i <= end; i++) html += `<span class="pg-btn ${i === page ? "active" : ""}" data-pg="${i}">${i}</span>`;
        html += `<span class="pg-btn" data-pg="next" ${page >= pages ? "disabled" : ""}>›</span></div>`;
      }
      container.innerHTML = html;
      container.querySelectorAll("[data-pg]").forEach(b => {
        b.onclick = () => {
          const v = b.dataset.pg;
          if (v === "prev") { if (page > 1) { page--; draw(); } }
          else if (v === "next") { if (page < pages) { page++; draw(); } }
          else { page = +v; draw(); }
        };
      });
      container.querySelectorAll("tbody tr").forEach((tr, idx) => {
        if (opt.rowClick && slice[idx]) tr.onclick = () => opt.rowClick(slice[idx]);
      });
      if (opt.afterDraw) opt.afterDraw(container, slice);
    }
    draw();
    return { refresh(newRows) { if (newRows) rows = newRows; page = 1; draw(); }, redraw: draw, get rows() { return rows; } };
  };

  /* ---------- 简易图表（纯 canvas，无外部依赖） ---------- */
  const CHART_COLORS = ["#185FA5", "#4A8FD5", "#6FC0A8", "#D9A44B", "#B57FD4", "#E0705C", "#7C8BA8", "#9BC53D"];

  function setupCanvas(canvas, height) {
    const dpr = window.devicePixelRatio || 1;
    const w = canvas.parentElement.clientWidth || 600;
    const h = height || canvas.parentElement.clientHeight || 220;
    canvas.width = w * dpr; canvas.height = h * dpr;
    canvas.style.height = h + "px";
    const ctx = canvas.getContext("2d");
    ctx.scale(dpr, dpr);
    return { ctx, w, h };
  }

  U.lineChart = (canvas, opt) => {
    const { ctx, w, h } = setupCanvas(canvas, opt.height || 220);
    const padL = 44, padR = 14, padT = 16, padB = 26;
    const labels = opt.labels, series = opt.series;
    const all = series.flatMap(s => s.data);
    let max = Math.max(...all, 1), min = Math.min(...all, 0);
    if (max === min) max = min + 1;
    max = max * 1.15;
    const cw = w - padL - padR, ch = h - padT - padB;
    const x = i => padL + (cw * i / Math.max(1, labels.length - 1));
    const y = v => padT + ch - (v - min) / (max - min) * ch;
    ctx.font = "10.5px Microsoft YaHei";
    // 网格
    ctx.strokeStyle = "#EDF1F5"; ctx.fillStyle = "#9AA5B1"; ctx.lineWidth = 1;
    for (let i = 0; i <= 4; i++) {
      const v = min + (max - min) * i / 4, yy = y(v);
      ctx.beginPath(); ctx.moveTo(padL, yy); ctx.lineTo(w - padR, yy); ctx.stroke();
      const label = v >= 10000 ? (v / 10000).toFixed(1) + "万" : Math.round(v);
      ctx.fillText(label, 4, yy + 3);
    }
    labels.forEach((l, i) => {
      if (labels.length > 12 && i % Math.ceil(labels.length / 8) !== 0 && i !== labels.length - 1) return;
      ctx.save(); ctx.fillStyle = "#9AA5B1"; ctx.textAlign = "center";
      ctx.fillText(l, x(i), h - 8); ctx.restore();
    });
    // 折线
    series.forEach((s, si) => {
      const color = s.color || CHART_COLORS[si % CHART_COLORS.length];
      ctx.strokeStyle = color; ctx.lineWidth = 2; ctx.beginPath();
      s.data.forEach((v, i) => i ? ctx.lineTo(x(i), y(v)) : ctx.moveTo(x(i), y(v)));
      ctx.stroke();
      // 面积
      const grad = ctx.createLinearGradient(0, padT, 0, padT + ch);
      grad.addColorStop(0, color + "38"); grad.addColorStop(1, color + "05");
      ctx.fillStyle = grad; ctx.beginPath();
      s.data.forEach((v, i) => i ? ctx.lineTo(x(i), y(v)) : ctx.moveTo(x(i), y(v)));
      ctx.lineTo(x(labels.length - 1), padT + ch); ctx.lineTo(padL, padT + ch); ctx.closePath(); ctx.fill();
      // 点
      ctx.fillStyle = "#fff"; ctx.strokeStyle = color;
      s.data.forEach((v, i) => { ctx.beginPath(); ctx.arc(x(i), y(v), 3, 0, 7); ctx.fill(); ctx.stroke(); });
    });
  };

  U.barChart = (canvas, opt) => {
    const { ctx, w, h } = setupCanvas(canvas, opt.height || 220);
    const padL = 44, padR = 14, padT = 16, padB = 40;
    const labels = opt.labels, data = opt.data;
    const max = Math.max(...data, 1) * 1.15;
    const cw = w - padL - padR, ch = h - padT - padB;
    const bw = Math.min(38, cw / labels.length * 0.55);
    ctx.font = "10.5px Microsoft YaHei";
    ctx.strokeStyle = "#EDF1F5"; ctx.fillStyle = "#9AA5B1";
    for (let i = 0; i <= 4; i++) {
      const v = max * i / 4, yy = padT + ch - ch * i / 4;
      ctx.beginPath(); ctx.moveTo(padL, yy); ctx.lineTo(w - padR, yy); ctx.stroke();
      ctx.fillText(v >= 10000 ? (v / 10000).toFixed(1) + "万" : Math.round(v), 4, yy + 3);
    }
    labels.forEach((l, i) => {
      const x0 = padL + cw * (i + 0.5) / labels.length;
      const bh = data[i] / max * ch;
      const grad = ctx.createLinearGradient(0, padT + ch - bh, 0, padT + ch);
      const c = opt.color || "#185FA5";
      grad.addColorStop(0, c); grad.addColorStop(1, c + "66");
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.roundRect ? ctx.roundRect(x0 - bw / 2, padT + ch - bh, bw, bh, [4, 4, 0, 0]) : ctx.rect(x0 - bw / 2, padT + ch - bh, bw, bh);
      ctx.fill();
      ctx.save(); ctx.fillStyle = "#5F6B7A"; ctx.textAlign = "center";
      ctx.fillText(String(l).length > 6 ? String(l).slice(0, 6) + "…" : l, x0, h - 24);
      if (opt.showValue) { ctx.fillStyle = "#26303B"; ctx.fillText(U.fmtNum(data[i]), x0, padT + ch - bh - 6); }
      ctx.restore();
    });
  };

  U.donutChart = (canvas, opt) => {
    const { ctx, w, h } = setupCanvas(canvas, opt.height || 220);
    const cx = opt.center || w * 0.32, cy = h / 2, R = Math.min(h, w * 0.6) / 2 - 14;
    const data = opt.data, total = data.reduce((s, d) => s + d.value, 0) || 1;
    let a0 = -Math.PI / 2;
    data.forEach((d, i) => {
      const a1 = a0 + d.value / total * Math.PI * 2;
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.arc(cx, cy, R, a0, a1);
      ctx.closePath();
      ctx.fillStyle = d.color || CHART_COLORS[i % CHART_COLORS.length];
      ctx.fill();
      a0 = a1;
    });
    // 中空
    ctx.beginPath(); ctx.arc(cx, cy, R * 0.62, 0, 7); ctx.fillStyle = "#fff"; ctx.fill();
    ctx.fillStyle = "#26303B"; ctx.font = "700 16px Microsoft YaHei"; ctx.textAlign = "center";
    ctx.fillText(opt.totalLabel || U.fmtNum(total), cx, cy + 1);
    ctx.fillStyle = "#9AA5B1"; ctx.font = "11px Microsoft YaHei";
    ctx.fillText(opt.totalName || "总计", cx, cy + 18);
    // 图例
    if (opt.legend !== false) {
      ctx.textAlign = "left"; ctx.font = "12px Microsoft YaHei";
      const lx = cx + R + 24;
      data.forEach((d, i) => {
        const ly = cy - data.length * 11 + i * 22 + 6;
        ctx.fillStyle = d.color || CHART_COLORS[i % CHART_COLORS.length];
        ctx.fillRect(lx, ly - 8, 10, 10);
        ctx.fillStyle = "#5F6B7A";
        ctx.fillText(`${d.name}  ${U.fmtNum(d.value)}${opt.percent === false ? "" : "（" + (d.value / total * 100).toFixed(1) + "%）"}`, lx + 16, ly);
      });
    }
  };

  U.ring = (canvas, opt) => { // 进度环
    const { ctx, w, h } = setupCanvas(canvas, opt.height || 120);
    const cx = w / 2, cy = h / 2, R = Math.min(w, h) / 2 - 10;
    ctx.lineWidth = 10; ctx.lineCap = "round";
    ctx.beginPath(); ctx.arc(cx, cy, R, 0, 7); ctx.strokeStyle = "#EDF1F5"; ctx.stroke();
    ctx.beginPath();
    ctx.arc(cx, cy, R, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * Math.min(1, opt.value));
    ctx.strokeStyle = opt.color || "#185FA5"; ctx.stroke();
    ctx.fillStyle = "#26303B"; ctx.font = "700 15px Microsoft YaHei"; ctx.textAlign = "center";
    ctx.fillText(opt.label || Math.round(opt.value * 100) + "%", cx, cy + 5);
  };

  /* ---------- 流式文本输出（模拟大模型逐字生成） ---------- */
  U.stream = (el, text, opt = {}) => {
    return new Promise(resolve => {
      const speed = opt.speed || 12;
      let i = 0;
      const cursor = "<span class='cursor-blink'></span>";
      const timer = setInterval(() => {
        i += opt.chunk || 3;
        el.innerHTML = U.mdLite(text.slice(0, i)) + cursor;
        if (opt.scrollWrap) opt.scrollWrap.scrollTop = opt.scrollWrap.scrollHeight;
        if (i >= text.length) {
          clearInterval(timer);
          el.innerHTML = U.mdLite(text);
          resolve();
        }
      }, speed);
      if (opt.cancelToken) opt.cancelToken.cancel = () => { clearInterval(timer); el.innerHTML = U.mdLite(text); resolve(); };
    });
  };

  /* ---------- 轻量 Markdown 渲染（问答气泡内） ---------- */
  U.mdLite = src => {
    let s = U.esc(src);
    s = s.replace(/^#{1,4}\s*(.+)$/gm, "<h4>$1</h4>");
    s = s.replace(/\*\*(.+?)\*\*/g, "<b>$1</b>");
    s = s.replace(/^\s*[-•]\s+(.+)$/gm, "<li>$1</li>");
    s = s.replace(/(<li>[\s\S]*?<\/li>)(?!\s*<li>)/g, m => "<ul>" + m + "</ul>");
    s = s.replace(/<\/li>\s*\n+\s*<li>/g, "</li><li>");
    s = s.replace(/`([^`]+)`/g, "<code style='background:#EEF2F6;padding:1px 5px;border-radius:3px;font-family:Consolas,monospace;font-size:12.5px'>$1</code>");
    s = s.replace(/\n{2,}/g, "</p><p>").replace(/\n/g, "<br>");
    return "<p>" + s + "</p>";
  };

  /* ---------- 骨架屏延迟 ---------- */
  U.delay = ms => new Promise(r => setTimeout(r, ms));

  global.U = U;
})(window);
