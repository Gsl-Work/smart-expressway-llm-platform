/* ============================================================
   系统管理模块视图（views-sys.js）
   P5-01 用户管理 / P5-02 角色权限 / P5-03 组织管理
   P5-04 操作日志审计 / P5-05 系统参数配置 / P5-06 运营看板
   ============================================================ */
(function () {
  "use strict";

  /* ==================== P5-01 用户管理 ==================== */
  App.register("sys-users", el => {
    el.innerHTML = `
      ${App.header("用户管理", "账号全生命周期：创建、分配角色、启停与密码重置", `
        <button class="btn" id="usExport">导出</button>
        <button class="btn primary" id="usNew">＋ 新增用户</button>`)}
      <div class="card">
        <div class="search-bar">
          <input class="input" id="usKw" placeholder="搜索姓名 / 工号 / 手机号">
          <select class="input w-140" id="usDept"><option value="">全部部门</option>${[...new Set(DB.users.map(u => u.dept.split("/").pop()))].map(d => `<option>${d}</option>`).join("")}</select>
          <select class="input w-140" id="usRole"><option value="">全部角色</option>${DB.roles.map(r => `<option>${r.name}</option>`).join("")}</select>
          <select class="input w-140" id="usSt"><option value="">全部状态</option><option value="enabled">启用</option><option value="disabled">停用</option></select>
          <span class="flex-gap"></span><span class="text-sub text-sm" id="usCount"></span>
        </div>
        <div id="usTable"></div>
      </div>`;

    const stMap = { enabled: { text: "启用", cls: "green" }, disabled: { text: "停用", cls: "gray" } };
    function filtered() {
      const kw = el.querySelector("#usKw").value.trim().toLowerCase();
      const dp = el.querySelector("#usDept").value, rl = el.querySelector("#usRole").value, st = el.querySelector("#usSt").value;
      return DB.users.filter(u =>
        (!kw || u.name.toLowerCase().includes(kw) || u.account.includes(kw) || u.phone.includes(kw)) &&
        (!dp || u.dept.endsWith(dp)) &&
        (!rl || u.roles.some(rid => (DB.roles.find(r => r.id === rid) || {}).name === rl)) &&
        (!st || u.status === st));
    }
    function draw() {
      const rows = filtered();
      el.querySelector("#usCount").textContent = `共 ${rows.length} 个账号`;
      U.renderTable(el.querySelector("#usTable"), {
        rows,
        pageSize: 10,
        rowClick: u => openUser(u),
        cols: [
          { title: "工号", key: "account", width: "90px", render: u => `<span class="mono">${u.account}</span>` },
          { title: "姓名", key: "name", render: u => `<span class="cell-link">${U.esc(u.name)}</span>` },
          { title: "所属部门", key: "dept" },
          { title: "角色", key: "roles", render: u => u.roles.map(rid => `<span class="tag blue">${(DB.roles.find(r => r.id === rid) || { name: rid }).name}</span>`).join(" ") },
          { title: "手机号", key: "phone", render: u => u.phone.replace(/(\d{3})\d{4}(\d{4})/, "$1****$2"), width: "130px" },
          { title: "最近登录", key: "lastLogin", render: u => U.fmtTime(u.lastLogin), width: "150px" },
          { title: "状态", key: "status", width: "80px", render: u => U.statusTag(stMap, u.status) },
          { title: "操作", width: "160px", render: u => `
            <button class="btn link sm" data-a="edit">编辑</button>
            <button class="btn link sm" data-a="toggle">${u.status === "enabled" ? "停用" : "启用"}</button>
            <button class="btn link sm" data-a="pwd">重置密码</button>` }
        ],
        afterDraw(container) {
          container.querySelectorAll("[data-a]").forEach(b => b.onclick = e => {
            e.stopPropagation();
            const tr = b.closest("tr"), acc = tr.children[0].textContent;
            const u = DB.users.find(x => x.account === acc);
            const act = b.dataset.a;
            if (act === "edit") openUser(u);
            else if (act === "toggle") U.confirm(`确定${u.status === "enabled" ? "停用" : "启用"}账号「${u.name}」吗？${u.status === "enabled" ? "停用后该用户立即下线。" : ""}`, "账号状态变更").then(ok => {
              if (!ok) return;
              u.status = u.status === "enabled" ? "disabled" : "enabled";
              U.toast(`账号已${u.status === "enabled" ? "启用" : "停用"}`, "success"); draw();
            });
            else if (act === "pwd") U.confirm(`确认向「${u.name}」的手机（${u.phone.replace(/(\d{3})\d{4}(\d{4})/, "$1****$2")}）发送重置密码短信吗？`, "重置密码").then(ok => {
              if (ok) U.toast("重置链接已发送，10 分钟内有效", "success");
            });
          });
        }
      });
    }
    ["usKw", "usDept", "usRole", "usSt"].forEach(id => {
      const n = el.querySelector("#" + id);
      n.oninput = U.debounce(draw, 250); n.onchange = draw;
    });
    el.querySelector("#usExport").onclick = () => U.toast("原型演示：用户清单已导出（敏感字段脱敏）", "success");

    function openUser(u) {
      const isNew = !u;
      const data = u || { id: "", name: "", account: "", dept: "", roles: [], status: "enabled", phone: "", lastLogin: 0, createdAt: Date.now() };
      U.modal({
        title: isNew ? "新增用户" : "编辑用户 · " + data.name,
        width: "w-720",
        body: `
          <div class="form-row">
            <div class="form-item"><label>姓名<span class="req">*</span></label><input class="input" id="uuName" value="${U.esc(data.name)}"></div>
            <div class="form-item"><label>工号（登录账号）<span class="req">*</span></label>
              <input class="input" id="uuAcc" value="${U.esc(data.account)}" ${isNew ? "" : "disabled"}></div>
          </div>
          <div class="form-row">
            <div class="form-item"><label>手机号<span class="req">*</span></label><input class="input" id="uuPhone" value="${U.esc(data.phone)}" placeholder="11位手机号"></div>
            <div class="form-item"><label>所属组织<span class="req">*</span></label>
              <select class="input" id="uuDept">${["集团信息中心", "集团知识管理部", "集团运营部", "客服中心", "长沙分公司运营部", "长沙分公司监控中心", "株洲分公司养护科", "岳阳分公司财务部", "运维中心", "稽查大队"]
                .map(d => `<option ${data.dept === d ? "selected" : ""}>${d}</option>`).join("")}</select></div>
          </div>
          <div class="form-item"><label>角色分配<span class="req">*</span></label>
            ${DB.roles.map(r => `<label class="checkbox" style="margin-right:14px"><input type="checkbox" data-role="${r.id}" ${data.roles.includes(r.id) ? "checked" : ""}>${r.name}</label>`).join("")}
            <div class="hint">一人可多角色；数据范围取角色与组织的交集（最小范围）</div></div>
          ${isNew ? "" : `
          <div class="form-item"><label>账号状态</label>
            <div class="flex align-c gap-12">
              <span class="switch ${data.status === "enabled" ? "on" : ""}" id="uuStatus"></span>
              <span class="text-sub text-sm">${data.status === "enabled" ? "启用中" : "已停用"}</span>
            </div></div>`}`,
        onOk() {
          const name = document.getElementById("uuName").value.trim();
          const phone = document.getElementById("uuPhone").value.trim();
          const roles = [...document.querySelectorAll("[data-role]:checked")].map(x => x.dataset.role);
          if (!name) { U.toast("请填写姓名", "error"); return false; }
          if (!/^1\d{10}$/.test(phone)) { U.toast("手机号格式不正确", "error"); return false; }
          if (!roles.length) { U.toast("请至少分配一个角色", "error"); return false; }
          data.name = name; data.phone = phone;
          data.dept = document.getElementById("uuDept").value;
          data.roles = roles;
          const sw = document.getElementById("uuStatus");
          if (sw) data.status = sw.classList.contains("on") ? "enabled" : "disabled";
          if (isNew) {
            if (DB.users.some(x => x.account === document.getElementById("uuAcc").value.trim())) { U.toast("工号已存在", "error"); return false; }
            DB.users.push({ ...data, account: document.getElementById("uuAcc").value.trim(), lastLogin: 0, createdAt: Date.now() });
          }
          U.toast(isNew ? "用户已创建，初始密码已短信下发" : "用户信息已更新", "success");
          draw();
        },
        onOpen(api) {
          const sw = api.box.querySelector("#uuStatus");
          if (sw) sw.onclick = () => sw.classList.toggle("on");
        }
      });
    }
    el.querySelector("#usNew").onclick = () => openUser(null);
    draw();
  });

  /* ==================== P5-02 角色权限管理 ==================== */
  App.register("sys-roles", el => {
    let activeRole = "R-01";
    el.innerHTML = `
      ${App.header("角色权限管理", "角色定义与页面访问权限（PFD 第 2.2 节权限矩阵的落地配置")}
      <div class="grid" style="grid-template-columns:300px 1fr;gap:16px">
        <div class="card">
          <div class="card-title">角色列表</div>
          <div id="roleList"></div>
          <button class="btn block mt-16" id="roleNew">＋ 新增角色</button>
        </div>
        <div class="card">
          <div id="roleDetail"></div>
        </div>
      </div>`;

    function renderList() {
      const list = el.querySelector("#roleList");
      list.innerHTML = DB.roles.map(r => `
        <div class="tree-node ${r.id === activeRole ? "active" : ""}" data-r="${r.id}" style="justify-content:space-between">
          <span>${U.esc(r.name)}</span>
          <span class="text-sub text-sm">${r.users} 人</span>
        </div>`).join("");
      list.querySelectorAll("[data-r]").forEach(n => n.onclick = () => { activeRole = n.dataset.r; renderList(); renderDetail(); });
    }

    function renderDetail() {
      const r = DB.roles.find(x => x.id === activeRole);
      const perms = DB.rolePerms[r.id] || [];
      const box = el.querySelector("#roleDetail");
      box.innerHTML = `
        <div class="flex justify-b align-c mb-16">
          <div>
            <span class="fwb" style="font-size:15px">${U.esc(r.name)}</span>
            <span class="tag blue" style="margin-left:10px">${r.builtin ? "系统内置" : "自定义"}</span>
          </div>
          <button class="btn primary" id="permSave">保存权限</button>
        </div>
        <div class="text-muted text-sm mb-16">${U.esc(r.desc)}</div>
        <div class="grid cols-3 mb-16">
          <div class="kv"><span class="k">角色编码</span><span class="mono">${r.id}</span></div>
          <div class="kv"><span class="k">关联用户</span><span>${r.users} 人</span></div>
          <div class="kv"><span class="k">数据范围</span><span>${{ "R-01": "全集团", "R-02": "全集团", "R-03": "全集团（只读）", "R-04": "全集团", "R-05": "本路段", "R-06": "全集团（运维）", "R-07": "本路段", "R-08": "本路段", "R-09": "工单范围", "R-10": "本部门" }[r.id] || "自定义"}</span></div>
        </div>
        <div class="section-title">页面访问权限（勾选即授权）</div>
        <table class="tbl">
          <thead><tr><th style="width:200px">一级菜单</th><th>页面权限</th></tr></thead>
          <tbody>
            ${DB.permTree.map(g => `
              <tr>
                <td class="fwb">${U.esc(g.label)}</td>
                <td>${g.children.map(c => `
                  <label class="checkbox" style="margin:2px 18px 2px 0"><input type="checkbox" data-perm="${c.key}" ${perms.includes(c.key) ? "checked" : ""}>${U.esc(c.label)}</label>`).join("")}
                </td>
              </tr>`).join("")}
          </tbody>
        </table>`;
      box.querySelector("#permSave").onclick = () => {
        const checked = [...box.querySelectorAll("[data-perm]:checked")].map(x => x.dataset.perm);
        DB.rolePerms[r.id] = checked;
        U.toast(`「${r.name}」权限已保存，即时生效`, "success");
      };
    }

    el.querySelector("#roleNew").onclick = () => {
      U.modal({
        title: "新增角色",
        body: `
          <div class="form-item"><label>角色名称<span class="req">*</span></label><input class="input" id="nrName" placeholder="例如：路段数据专员"></div>
          <div class="form-item"><label>职责说明</label><textarea class="input" rows="2" placeholder="简述该角色的职责与数据范围"></textarea></div>
          <div class="help-text">新增角色默认无任何页面权限，保存后请在右侧勾选授权。</div>`,
        onOk() {
          const name = document.getElementById("nrName").value.trim();
          if (!name) { U.toast("请填写角色名称", "error"); return false; }
          const id = "R-" + String(DB.roles.length + 1).padStart(2, "0");
          DB.roles.push({ id, name, desc: "自定义角色", builtin: false, users: 0, status: "enabled" });
          DB.rolePerms[id] = [];
          activeRole = id;
          U.toast("角色已创建，请配置权限", "success");
          renderList(); renderDetail();
        }
      });
    };
    renderList(); renderDetail();
  });

  /* ==================== P5-03 组织管理 ==================== */
  App.register("sys-org", el => {
    let activeOrg = "ORG001";
    el.innerHTML = `
      ${App.header("组织管理", "集团—分公司—路段—站点四级组织架构（数据权限的载体）")}
      <div class="grid" style="grid-template-columns:340px 1fr;gap:16px">
        <div class="card">
          <div class="card-title">组织树<span class="ct-extra">4 级 · ${DB.users.length} 个账号</span></div>
          <div class="tree" id="orgTree"></div>
          <button class="btn block mt-16" id="orgAdd">＋ 新增下级组织</button>
        </div>
        <div class="card">
          <div id="orgDetail"></div>
        </div>
      </div>`;

    const typeMap = { group: { text: "集团", cls: "purple" }, company: { text: "分公司", cls: "blue" }, section: { text: "路段", cls: "green" }, station: { text: "部门/站点", cls: "gray" } };
    function flatten(nodes, depth) {
      let out = [];
      nodes.forEach(n => { out.push({ ...n, depth }); out = out.concat(flatten(n.children || [], depth + 1)); });
      return out;
    }
    function renderTree() {
      const tree = el.querySelector("#orgTree");
      tree.innerHTML = flatten(DB.orgTree, 0).map(n => `
        <div class="tree-node ${n.id === activeOrg ? "active" : ""}" data-o="${n.id}" style="padding-left:${n.depth * 18 + 10}px">
          <span>${U.esc(n.name)}</span><span class="flex-1"></span>${U.statusTag(typeMap, n.type)}
        </div>`).join("");
      tree.querySelectorAll("[data-o]").forEach(node => node.onclick = () => { activeOrg = node.dataset.o; renderTree(); renderDetail(); });
    }
    function findOrg(id, nodes) {
      for (const n of nodes || DB.orgTree) {
        if (n.id === id) return n;
        const r = findOrg(id, n.children);
        if (r) return r;
      }
      return null;
    }
    function renderDetail() {
      const org = findOrg(activeOrg);
      const box = el.querySelector("#orgDetail");
      const members = DB.users.filter(u => u.dept.includes(org.name));
      box.innerHTML = `
        <div class="flex justify-b align-c mb-16">
          <div><span class="fwb" style="font-size:15px">${U.esc(org.name)}</span>${U.statusTag(typeMap, org.type)}</div>
          <div class="flex gap-8">
            <button class="btn" id="ogRename">重命名</button>
            <button class="btn danger" id="ogDel">删除组织</button>
          </div>
        </div>
        <div class="kv-list mb-16" style="grid-template-columns:repeat(3,1fr)">
          <div class="kv"><span class="k">组织编码</span><span class="mono">${org.code}</span></div>
          <div class="kv"><span class="k">层级类型</span><span>${U.statusTag(typeMap, org.type).replace("gray", "blue").replace("站点", "部门/站点")}</span></div>
          <div class="kv"><span class="k">下级组织</span><span>${org.children.length} 个</span></div>
        </div>
        <div class="section-title">组织成员（${members.length}）</div>
        <table class="tbl">
          <thead><tr><th>姓名</th><th>工号</th><th>角色</th><th>状态</th><th>最近登录</th></tr></thead>
          <tbody>
            ${members.length ? members.map(u => `
              <tr>
                <td>${U.esc(u.name)}</td><td class="mono">${u.account}</td>
                <td>${u.roles.map(rid => `<span class="tag blue">${(DB.roles.find(r => r.id === rid) || {}).name}</span>`).join(" ")}</td>
                <td>${u.status === "enabled" ? `<span class="tag green">启用</span>` : `<span class="tag gray">停用</span>`}</td>
                <td>${U.fmtTime(u.lastLogin)}</td>
              </tr>`).join("") : `<tr><td colspan="5" class="tbl-empty">该组织暂无直接成员</td></tr>`}
          </tbody>
        </table>`;
      box.querySelector("#ogRename").onclick = () => {
        U.modal({
          title: "重命名组织",
          body: `<div class="form-item"><label>组织名称<span class="req">*</span></label><input class="input" id="rnName" value="${U.esc(org.name)}"></div>`,
          onOk() {
            const v = document.getElementById("rnName").value.trim();
            if (!v) { U.toast("名称不能为空", "error"); return false; }
            org.name = v; U.toast("组织已重命名", "success"); renderTree(); renderDetail();
          }
        });
      };
      box.querySelector("#ogDel").onclick = () => {
        if (org.children.length || members.length) { U.toast("组织下存在下级组织或成员，不允许删除（先迁移数据）", "error"); return; }
        U.confirm("删除组织不可恢复，确定删除吗？", "删除组织").then(ok => {
          if (!ok) return;
          const parent = findOrg("ORG" + org.id.slice(3, 5) === org.id ? "" : org.id, []) || null;
          const remove = nodes => nodes.forEach((n, i) => { if (n.id === org.id) nodes.splice(i, 1); else remove(n.children || []); });
          remove(DB.orgTree);
          activeOrg = "ORG001"; renderTree(); renderDetail(); U.toast("组织已删除", "success");
        });
      };
    }
    el.querySelector("#orgAdd").onclick = () => {
      const parent = findOrg(activeOrg);
      if (parent.type === "station") { U.toast("部门/站点下不能再建下级组织", "error"); return; }
      U.modal({
        title: "新增下级组织（上级：${n}）".replace("${n}", parent.name),
        body: `
          <div class="form-row">
            <div class="form-item"><label>组织名称<span class="req">*</span></label><input class="input" id="noName" placeholder="例如：湘潭分公司"></div>
            <div class="form-item"><label>类型</label>
              <select class="input" id="noType">${{ company: "分公司", section: "路段", station: "部门/站点" }[parent.type === "group" ? "company" : parent.type === "company" ? "section" : "station"] ? `<option>${{ company: "分公司", section: "路段", station: "部门/站点" }[parent.type === "group" ? "company" : parent.type === "company" ? "section" : "station"]}</option>` : ""}</select></div>
          </div>`,
        onOk() {
          const name = document.getElementById("noName").value.trim();
          if (!name) { U.toast("请填写组织名称", "error"); return false; }
          const type = document.getElementById("noType").value;
          const typeKey = { "分公司": "company", "路段": "section", "部门/站点": "station" }[type];
          parent.children.push({ id: "ORG" + Math.floor(Math.random() * 900 + 100), name, type: typeKey, code: parent.code + "-" + name.slice(0, 2), children: [] });
          U.toast("组织已创建", "success"); renderTree();
        }
      });
    };
    renderTree(); renderDetail();
  });

  /* ==================== P5-04 操作日志与审计 ==================== */
  App.register("sys-logs", el => {
    const lvMap = { normal: { text: "常规", cls: "gray" }, warning: { text: "关注", cls: "orange" }, important: { text: "重要", cls: "red" } };
    el.innerHTML = `
      ${App.header("操作日志与审计", "全部用户操作留痕，日志保留 365 天（安全合规要求）", `
        <button class="btn" onclick="U.toast('原型演示：已导出日志（含哈希校验文件）','success')">导出日志</button>`)}
      <div class="card">
        <div class="search-bar">
          <input class="input" id="lgKw" placeholder="搜索操作内容 / 工号">
          <select class="input w-140" id="lgModule"><option value="">全部模块</option>${["智能问答", "文档生成", "知识库管理", "数据查询", "系统管理"].map(m => `<option>${m}</option>`).join("")}</select>
          <select class="input w-140" id="lgLevel"><option value="">全部级别</option><option value="normal">常规</option><option value="warning">关注</option><option value="important">重要</option></select>
          <input class="input w-140" type="date" id="lgDate">
          <span class="flex-gap"></span><span class="text-sub text-sm" id="lgCount"></span>
        </div>
        <div id="lgTable"></div>
      </div>`;

    function draw() {
      const kw = el.querySelector("#lgKw").value.trim().toLowerCase();
      const md = el.querySelector("#lgModule").value, lv = el.querySelector("#lgLevel").value;
      const rows = DB.logs.filter(l =>
        (!kw || l.action.toLowerCase().includes(kw) || l.account.includes(kw)) &&
        (!md || l.module === md) && (!lv || l.level === lv));
      el.querySelector("#lgCount").textContent = `共 ${rows.length} 条`;
      U.renderTable(el.querySelector("#lgTable"), {
        rows,
        pageSize: 12,
        rowClick: l => U.drawer({
          title: "日志详情 · " + l.id,
          body: `
            <div class="desc-list">
              <dt>操作人</dt><dd>${U.esc(l.name)}（${l.account}）</dd>
              <dt>所属模块</dt><dd>${U.esc(l.module)}</dd>
              <dt>操作内容</dt><dd>${U.esc(l.action)}</dd>
              <dt>级别</dt><dd>${U.statusTag(lvMap, l.level)}</dd>
              <dt>来源 IP</dt><dd class="mono">${l.ip}</dd>
              <dt>操作时间</dt><dd>${U.fmtTime(l.time)}</dd>
              <dt>结果</dt><dd><span class="tag green">成功</span></dd>
            </div>
            <div class="section-title">请求上下文</div>
            <pre class="mono" style="background:var(--bg);padding:12px;border-radius:8px;font-size:12px;white-space:pre-wrap">sessionId=${l.id.toLowerCase()}
ua=Mozilla/5.0 (Windows NT 10.0) Chrome/126.0
traceId=trc-${l.ip.replace(/\./g, "")}-${l.id}</pre>`,
          footer: null
        }),
        cols: [
          { title: "日志号", key: "id", width: "100px", render: l => `<span class="mono">${l.id}</span>` },
          { title: "操作人", key: "name", width: "100px", render: l => `${U.esc(l.name)}<br><span class="mono text-sub text-sm">${l.account}</span>` },
          { title: "模块", key: "module", width: "110px" },
          { title: "操作内容", key: "action" },
          { title: "级别", key: "level", width: "80px", render: l => U.statusTag(lvMap, l.level) },
          { title: "来源 IP", key: "ip", width: "120px", render: l => `<span class="mono">${l.ip}</span>` },
          { title: "时间", key: "time", render: l => U.fmtTime(l.time), width: "150px" }
        ]
      });
    }
    ["lgKw", "lgModule", "lgLevel", "lgDate"].forEach(id => {
      const n = el.querySelector("#" + id);
      n.oninput = U.debounce(draw, 250); n.onchange = draw;
    });
    draw();
  });

  /* ==================== P5-05 系统参数配置 ==================== */
  App.register("sys-config", el => {
    el.innerHTML = `
      ${App.header("系统参数配置", "会话、生成、安全等全局参数（修改即时生效并记入审计日志）")}
      <div class="grid cols-3">
        <div class="card">
          <div class="card-title">会话参数</div>
          <div class="form-item"><label>会话超时时间（分钟）</label><input class="input" type="number" id="cfTimeout" value="${DB.sysConfig.session.timeout}"></div>
          <div class="form-item"><label>多轮对话上限（轮）</label><input class="input" type="number" id="cfRounds" value="${DB.sysConfig.session.maxRounds}"></div>
          <div class="form-item"><label>会话历史保留（天）</label><input class="input" type="number" id="cfKeep" value="${DB.sysConfig.session.historyKeep}"></div>
          <div class="form-item"><label>流式输出速度</label>
            <select class="input" id="cfSpeed"><option value="fast">快速</option><option value="smooth">平滑</option></select></div>
        </div>
        <div class="card">
          <div class="card-title">生成参数</div>
          <div class="form-item"><label>单次生成字数上限</label><input class="input" type="number" id="cfWords" value="${DB.sysConfig.generation.maxWords}"></div>
          <div class="form-item"><label>温度（创造性）</label><input class="input" type="number" step="0.1" id="cfTemp" value="${DB.sysConfig.generation.temperature}"></div>
          <div class="form-item"><label>失败重试次数</label><input class="input" type="number" id="cfRetry" value="${DB.sysConfig.generation.retryTimes}"></div>
          <div class="form-item"><label>生成选项</label>
            <label class="checkbox"><input type="checkbox" id="cfCite" ${DB.sysConfig.generation.citationRequired ? "checked" : ""}>强制标注引用</label>
            <label class="checkbox"><input type="checkbox" id="cfReview" ${DB.sysConfig.generation.reviewRequired ? "checked" : ""}>生成后必须人工审核</label></div>
        </div>
        <div class="card">
          <div class="card-title">安全参数</div>
          <div class="form-item"><label>密码有效期（天）</label><input class="input" type="number" id="cfPwd" value="${DB.sysConfig.security.pwdExpire}"></div>
          <div class="form-item"><label>连续失败锁定（次）</label><input class="input" type="number" id="cfLock" value="${DB.sysConfig.security.loginLock}"></div>
          <div class="form-item"><label>安全选项</label>
            <label class="checkbox"><input type="checkbox" id="cfWm" ${DB.sysConfig.security.watermark ? "checked" : ""}>导出文档加数字水印</label>
            <label class="checkbox"><input type="checkbox" id="cfMask" ${DB.sysConfig.security.privacyMask ? "checked" : ""}>敏感字段自动脱敏</label></div>
          <div class="help-text">审计日志保留 ${DB.sysConfig.security.auditKeep} 天（合规要求，不可调低）</div>
        </div>
      </div>
      <div class="flex justify-b align-c card" style="padding:12px 20px">
        <span class="text-sub text-sm">参数修改将记录操作日志；影响范围：全部用户</span>
        <div class="flex gap-8">
          <button class="btn" id="cfReset">恢复默认</button>
          <button class="btn primary" id="cfSave">保存配置</button>
        </div>
      </div>`;

    el.querySelector("#cfSave").onclick = () => {
      DB.sysConfig.session.timeout = +el.querySelector("#cfTimeout").value;
      DB.sysConfig.session.maxRounds = +el.querySelector("#cfRounds").value;
      DB.sysConfig.generation.maxWords = +el.querySelector("#cfWords").value;
      DB.sysConfig.generation.temperature = +el.querySelector("#cfTemp").value;
      DB.sysConfig.generation.citationRequired = el.querySelector("#cfCite").checked;
      DB.sysConfig.generation.reviewRequired = el.querySelector("#cfReview").checked;
      DB.sysConfig.security.watermark = el.querySelector("#cfWm").checked;
      DB.sysConfig.security.privacyMask = el.querySelector("#cfMask").checked;
      DB.logs.unshift({ id: "LG" + Math.floor(98000 + Math.random() * 99), account: "zhoujg", name: "周建国", module: "系统管理", action: "修改系统参数（会话/生成/安全）", level: "warning", ip: "10.62.30.5", time: Date.now() });
      U.toast("系统参数已保存并生效", "success");
    };
    el.querySelector("#cfReset").onclick = () => U.confirm("恢复默认将覆盖当前全部自定义参数，确定吗？", "恢复默认").then(ok => {
      if (ok) U.toast("已恢复默认参数（演示环境仅提示）", "success");
    });
  });

  /* ==================== P5-06 运营看板 ==================== */
  App.register("sys-dashboard", el => {
    el.innerHTML = `
      ${App.header("运营看板", "平台整体运营指标：问答、文档生成、知识库健康度与活跃用户", `
        <select class="input" id="dbRange" style="width:130px;height:34px"><option>近 14 天</option><option>近 30 天</option><option>本季度</option></select>`)}
      <div class="grid cols-4 mb-16">
        <div class="stat-card"><div class="sc-icon" style="background:var(--primary-light);color:var(--primary)">💬</div>
          <div><div class="sc-value">${U.fmtNum(DB.kpi.qaTotal)}</div><div class="sc-label">累计问答次数</div><div class="sc-trend up">▲ 周环比 ${DB.kpi.qaWeekGrowth}%</div></div></div>
        <div class="stat-card"><div class="sc-icon" style="background:var(--success-light);color:var(--success)">📄</div>
          <div><div class="sc-value">${U.fmtNum(DB.kpi.docTotal)}</div><div class="sc-label">累计文档生成</div><div class="sc-trend text-sub">平均 ${DB.kpi.docAvgTime}/篇</div></div></div>
        <div class="stat-card"><div class="sc-icon" style="background:var(--purple-light);color:var(--purple)">😊</div>
          <div><div class="sc-value">${DB.kpi.satisfaction}%</div><div class="sc-label">问答满意度</div><div class="sc-trend up">▲ 1.8pt</div></div></div>
        <div class="stat-card"><div class="sc-icon" style="background:var(--info-light);color:var(--info)">👤</div>
          <div><div class="sc-value">${U.fmtNum(DB.kpi.activeUsers)}</div><div class="sc-label">月活用户</div><div class="sc-trend up">▲ 9.2%</div></div></div>
      </div>
      <div class="grid cols-2">
        <div class="card">
          <div class="card-title">问答量趋势<span class="ct-extra">次/日</span></div>
          <div class="chart-box"><canvas id="dbQa"></canvas></div>
        </div>
        <div class="card">
          <div class="card-title">文档生成量趋势<span class="ct-extra">篇/日</span></div>
          <div class="chart-box"><canvas id="dbDoc"></canvas></div>
        </div>
      </div>
      <div class="grid cols-2">
        <div class="card">
          <div class="card-title">AI 解决率</div>
          <div class="flex gap-16 align-c">
            <div class="chart-box" style="width:150px"><canvas id="dbRing"></canvas></div>
            <div class="flex-1">
              <div class="kv-list" style="grid-template-columns:1fr">
                <div class="kv"><span class="k">AI 直接解决</span><span class="fwb" style="color:var(--success)">${DB.kpi.resolveRate}%</span></div>
                <div class="kv"><span class="k">转人工工单</span><span class="fwb">${DB.kpi.ticketTotal} 件 / 月</span></div>
                <div class="kv"><span class="k">工单按期办结率</span><span class="fwb">96.3%</span></div>
                <div class="kv"><span class="k">月消耗 Tokens</span><span class="fwb">${DB.kpi.tokens} 亿</span></div>
              </div>
            </div>
          </div>
        </div>
        <div class="card">
          <div class="card-title">活跃用户 TOP 6<span class="ct-extra">按问答次数</span></div>
          <div class="tbl-wrap"><table class="tbl">
            <thead><tr><th>用户</th><th>部门</th><th>问答</th><th>文档</th><th>贡献</th></tr></thead>
            <tbody>${DB.topUsers.map((u, i) => `
              <tr><td>${["🥇", "🥈", "🥉", "4", "5", "6"][i]} ${U.esc(u.name)}</td><td>${U.esc(u.dept)}</td>
              <td>${u.qa}</td><td>${u.doc}</td>
              <td><div class="progress-bar" style="width:110px;display:inline-block;vertical-align:middle"><div class="pb-inner" style="width:${u.qa / 486 * 100}%"></div></div></td></tr>`).join("")}
            </tbody>
          </table></div>
        </div>
      </div>`;

    requestAnimationFrame(() => {
      U.lineChart(el.querySelector("#dbQa"), { labels: DB.statDays, series: [{ name: "问答量", data: DB.trendQA }] });
      U.lineChart(el.querySelector("#dbDoc"), { labels: DB.statDays, series: [{ name: "生成量", data: DB.trendDoc, color: "#2E9E5B" }] });
      U.ring(el.querySelector("#dbRing"), { value: DB.kpi.resolveRate / 100, label: DB.kpi.resolveRate + "%", color: "#2E9E5B" });
    });
  });
})();
