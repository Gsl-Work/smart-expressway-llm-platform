/* ============================================================
   应用框架（app.js）—— 全局主框架 P0-02 / 全局搜索 P0-03
   消息通知 P0-04 / 个人中心 P0-05 / 哈希路由
   ============================================================ */
(function (global) {
  "use strict";

  const App = {
    sys: null,          // 当前系统配置
    views: {},          // 视图注册表
    params: {},         // 视图参数
    user: null,

    /* 注册视图 */
    register(id, fn) { this.views[id] = fn; },

    /* 启动 */
    boot(sys) {
      this.sys = sys;
      this.user = this.loadUser();
      this.buildShell();
      this.bindGlobal();
      window.addEventListener("hashchange", () => this.route());
      const init = location.hash.replace(/^#\/?/, "");
      this.nav(sys.home || (sys.menus[0].items[0].view));
      if (init) this.nav(init);
    },

    loadUser() {
      try { return JSON.parse(sessionStorage.getItem("sys_user") || sessionStorage.getItem("sys_user_" + (this.sys && this.sys.id))); }
      catch (e) { return null; }
    },

    /* ---------- 构建主框架 ---------- */
    buildShell() {
      const u = this.user || { name: "演示用户", role: "演示角色", dept: "演示部门" };
      document.body.innerHTML = `
      <div class="layout">
        <div class="topbar">
          <div class="logo">
            <div class="logo-icon">交</div>
            <div class="logo-name">交控集团智慧交通大模型平台</div>
          </div>
          <div class="sys-name">${U.esc(this.sys.name)}</div>
          <div class="global-search">
            <input id="gSearch" placeholder="搜索功能、知识、文档…（Ctrl+K）" autocomplete="off">
            <span class="gs-icon">⌕</span>
            <div class="search-panel" id="searchPanel"></div>
          </div>
          <div class="topbar-right">
            <span class="icon-btn" id="btnMsg" title="消息通知">🔔<span class="dot" id="msgDot"></span></span>
            <span class="icon-btn" title="帮助"><a href="javascript:;" style="color:inherit" onclick="U.toast('原型演示：帮助中心待接入','info')">?</a></span>
            <span style="position:relative">
              <div class="avatar" id="btnUser">${U.esc(u.name.slice(0, 1))}</div>
              <div class="user-menu" id="userMenu">
                <div class="um-head">
                  <div class="um-name">${U.esc(u.name)}</div>
                  <div class="um-role">${U.esc(u.dept || "")} · ${U.esc(u.roleName || u.role || "")}</div>
                </div>
                <div class="um-item" data-um="profile">👤 个人中心</div>
                <div class="um-item" data-um="pref">⚙ 偏好设置</div>
                <div class="um-item" data-um="logout" style="color:var(--danger)">⇦ 退出登录</div>
              </div>
            </span>
          </div>
        </div>
        <div class="layout-body">
          <aside class="sidebar" id="sidebar"></aside>
          <main class="content" id="content"></main>
        </div>
      </div>`;
      this.renderSidebar();
    },

    renderSidebar(activeView) {
      const sb = document.getElementById("sidebar");
      let html = "";
      this.sys.menus.forEach(g => {
        html += `<div class="nav-group-title">${U.esc(g.label)}</div>`;
        g.items.forEach(it => {
          const badge = it.badge ? `<span class="badge-num">${it.badge}</span>` : "";
          html += `<div class="nav-item ${activeView === it.view ? "active" : ""}" data-view="${it.view}">
            <span class="ni-icon">${it.icon || "•"}</span><span class="ni-label">${U.esc(it.label)}</span>${badge}</div>`;
        });
      });
      const u = this.user || { name: "演示用户", roleName: "" };
      html += `<div class="user-card">👤 ${U.esc(u.name)}<br><span style="opacity:.7">${U.esc(u.roleName || "")} · ${U.esc(u.dept || "")}</span></div>`;
      sb.innerHTML = html;
      sb.querySelectorAll("[data-view]").forEach(el => el.onclick = () => this.nav(el.dataset.view));
    },

    /* ---------- 路由 ---------- */
    nav(view, params) {
      this.params = params || {};
      if (location.hash !== "#/" + view) location.hash = "#/" + view;
      else this.route();
    },
    route() {
      const view = location.hash.replace(/^#\/?/, "") || this.sys.home;
      const el = document.getElementById("content");
      el.scrollTop = 0;
      this.renderSidebar(view);
      // 找到所属菜单组进行菜单徽标匹配
      const fn = this.views[view];
      if (fn) fn(el, this.params);
      else el.innerHTML = `<div class="card"><div class="empty-state"><div class="es-icon">🚧</div>页面 ${U.esc(view)} 开发中</div></div>`;
    },

    /* ---------- 全局搜索（P0-03） ---------- */
    bindGlobal() {
      const input = document.getElementById("gSearch");
      const panel = document.getElementById("searchPanel");
      const doSearch = U.debounce(() => {
        const q = input.value.trim().toLowerCase();
        if (!q) { panel.classList.remove("open"); return; }
        const hits = [];
        // 功能
        this.sys.menus.forEach(g => g.items.forEach(it => {
          if (it.label.toLowerCase().includes(q)) hits.push({ group: "功能", label: it.label, type: g.label, view: it.view });
        }));
        // 知识
        DB.assets.forEach(a => {
          if (a.title.toLowerCase().includes(q)) hits.push({ group: "知识", label: a.title, type: a.category, view: "kb-assets" });
        });
        // 文档
        DB.docTasks.forEach(d => {
          if (d.title.toLowerCase().includes(q)) hits.push({ group: "文档", label: d.title, type: d.template, view: "doc-records" });
        });
        let html = "";
        ["功能", "知识", "文档"].forEach(gp => {
          const items = hits.filter(h => h.group === gp).slice(0, 5);
          if (items.length) {
            html += `<div class="sp-group-title">${gp}</div>`;
            items.forEach(h => {
              const label = U.esc(h.label).replace(new RegExp("(" + q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&") + ")", "gi"), "<mark>$1</mark>");
              html += `<div class="sp-item" data-view="${h.view}"><span class="sp-label">${label}</span><span class="sp-type">${U.esc(h.type)}</span></div>`;
            });
          }
        });
        panel.innerHTML = html || `<div class="sp-empty">未找到与 “${U.esc(input.value)}” 相关的内容</div>`;
        panel.classList.add("open");
        panel.querySelectorAll("[data-view]").forEach(el => el.onclick = () => {
          panel.classList.remove("open"); input.value = "";
          this.nav(el.dataset.view);
        });
      }, 220);
      input.oninput = doSearch;
      input.onfocus = () => { if (input.value.trim()) doSearch(); };
      document.addEventListener("click", e => {
        if (!e.target.closest(".global-search")) panel.classList.remove("open");
        if (!e.target.closest("#btnUser") && !e.target.closest("#userMenu")) document.getElementById("userMenu").classList.remove("open");
      });
      document.addEventListener("keydown", e => {
        if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") { e.preventDefault(); input.focus(); }
        if (e.key === "Escape") { panel.classList.remove("open"); document.getElementById("userMenu").classList.remove("open"); }
      });

      // 消息中心
      document.getElementById("btnMsg").onclick = () => this.openMessages();
      const unread = DB.notifications.filter(n => !n.read).length;
      const dot = document.getElementById("msgDot");
      if (unread) { dot.textContent = unread; dot.style.display = "flex"; } else dot.style.display = "none";

      // 用户菜单
      document.getElementById("btnUser").onclick = e => {
        e.stopPropagation();
        document.getElementById("userMenu").classList.toggle("open");
      };
      document.querySelectorAll("[data-um]").forEach(el => el.onclick = () => {
        const a = el.dataset.um;
        document.getElementById("userMenu").classList.remove("open");
        if (a === "logout") {
          U.confirm("确定要退出当前登录吗？", "退出登录").then(ok => {
            if (ok) { sessionStorage.clear(); location.href = "login.html"; }
          });
        } else {
          this.nav("profile", { tab: a === "pref" ? "pref" : "info" });
        }
      });
    },

    /* ---------- 消息通知中心（P0-04） ---------- */
    openMessages() {
      const icons = { todo: ["📋", "var(--warning-light)", "var(--warning)"], msg: ["✉", "var(--primary-light)", "var(--primary)"], notice: ["📢", "var(--info-light)", "var(--info)"] };
      const items = list => list.length ? list.map(n => {
        const ic = icons[n.type] || icons.msg;
        return `<div class="msg-item ${n.read ? "" : "unread"}">
          <div class="mi-icon" style="background:${ic[1]};color:${ic[2]}">${ic[0]}</div>
          <div class="mi-body">
            <div class="mi-title"><span class="fwb">${U.esc(n.title)}</span><span class="mi-time">${U.fmtTime(n.time)}</span></div>
            <div class="mi-desc">${U.esc(n.desc)}</div>
          </div>
        </div>`;
      }).join("") : `<div class="empty-state"><div class="es-icon">📭</div>暂无消息</div>`;

      U.drawer({
        title: "消息通知中心",
        width: "w-760",
        body: `
          <div class="tabs" id="msgTabs">
            <div class="tab-item active" data-tab="all">全部（${DB.notifications.length}）</div>
            <div class="tab-item" data-tab="todo">待办（${DB.notifications.filter(n => n.type === "todo").length}）</div>
            <div class="tab-item" data-tab="msg">消息（${DB.notifications.filter(n => n.type === "msg").length}）</div>
            <div class="tab-item" data-tab="notice">公告（${DB.notifications.filter(n => n.type === "notice").length}）</div>
          </div>
          <div id="msgList"></div>`,
        footer: `<button class="btn" id="markAll">全部标记已读</button><button class="btn primary" id="msgClose">关闭</button>`,
        onOpen(api) {
          const list = api.box.querySelector("#msgList");
          const render = tab => {
            const arr = tab === "all" ? DB.notifications : DB.notifications.filter(n => n.type === tab);
            list.innerHTML = items(arr);
            list.querySelectorAll(".msg-item").forEach((el, i) => el.onclick = () => {
              arr[i].read = true; el.classList.remove("unread");
              U.toast("已标记为已读", "success", 1500);
            });
          };
          render("all");
          api.box.querySelectorAll("[data-tab]").forEach(t => t.onclick = () => {
            api.box.querySelectorAll("[data-tab]").forEach(x => x.classList.remove("active"));
            t.classList.add("active"); render(t.dataset.tab);
          });
          api.box.querySelector("#markAll").onclick = () => {
            DB.notifications.forEach(n => n.read = true);
            list.querySelectorAll(".msg-item").forEach(el => el.classList.remove("unread"));
            U.toast("已全部标记为已读", "success");
          };
          api.box.querySelector("#msgClose").onclick = api.close;
        }
      });
    },

    /* ---------- 页面头快捷构造 ---------- */
    header(title, desc, actionsHtml) {
      return `<div class="page-header">
        <div><h2>${title}</h2>${desc ? `<div class="page-desc">${desc}</div>` : ""}</div>
        ${actionsHtml ? `<div class="page-actions">${actionsHtml}</div>` : ""}
      </div>`;
    }
  };

  global.App = App;
})(window);
