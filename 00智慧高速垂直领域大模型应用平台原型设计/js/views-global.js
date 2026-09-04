/* ============================================================
   全局公共页面视图（views-global.js，前台系统）
   P0-05 个人中心与偏好设置
   ============================================================ */
(function () {
  "use strict";

  App.register("profile", el => {
    const u = App.user || { name: "演示用户", account: "demo", dept: "交控集团", roleName: "普通用户" };
    const initTab = (App.params && App.params.tab) === "pref" ? "pref" : "info";

    el.innerHTML = `
      ${App.header("个人中心", "个人信息、偏好设置、安全与通知配置")}
      <div class="card">
        <div class="tabs">
          <div class="tab-item ${initTab === "info" ? "active" : ""}" data-tab="info">个人信息</div>
          <div class="tab-item ${initTab === "pref" ? "active" : ""}" data-tab="pref">偏好设置</div>
          <div class="tab-item" data-tab="security">安全设置</div>
          <div class="tab-item" data-tab="notify">通知偏好</div>
        </div>
        <div id="pBody"></div>
      </div>`;

    const body = el.querySelector("#pBody");

    const tabs = {
      info: () => {
        body.innerHTML = `
          <div class="flex gap-16 mb-16">
            <div class="avatar" style="width:64px;height:64px;font-size:24px">${U.esc(u.name.slice(0, 1))}</div>
            <div style="padding-top:8px">
              <div class="fwb" style="font-size:16px">${U.esc(u.name)}</div>
              <div class="text-sub text-sm mt-8">${U.esc(u.dept || "")} · ${U.esc(u.roleName || "")}</div>
            </div>
          </div>
          <div class="form-row">
            <div class="form-item"><label>姓名</label><input class="input" value="${U.esc(u.name)}" disabled></div>
            <div class="form-item"><label>账号</label><input class="input" value="${U.esc(u.account)}" disabled></div>
          </div>
          <div class="form-row">
            <div class="form-item"><label>手机号</label><input class="input" value="139****0103" disabled><div class="hint">手机号变更需联系管理员（敏感字段）</div></div>
            <div class="form-item"><label>邮箱</label><input class="input" value="${U.esc(u.account)}@hngs.com.cn"></div>
          </div>
          <div class="form-item"><label>所属组织</label><input class="input" value="${U.esc(u.dept || "")}" disabled></div>
          <button class="btn primary" onclick="U.toast('个人信息已保存','success')">保存修改</button>`;
      },
      pref: () => {
        body.innerHTML = `
          <div class="form-item"><label>默认进入页面</label>
            <select class="input"><option>问答工作台</option><option>文档生成工作台</option><option>会话历史</option></select></div>
          <div class="form-item"><label>界面偏好</label>
            <label class="checkbox"><input type="checkbox" checked>紧凑表格密度</label>
            <label class="checkbox"><input type="checkbox" checked>操作成功后显示轻提示</label>
            <label class="checkbox"><input type="checkbox">开启暗色主题（试用）</label>
          </div>
          <div class="form-item"><label>问答偏好</label>
            <label class="checkbox"><input type="checkbox" checked>默认开启知识库检索增强</label>
            <label class="checkbox"><input type="checkbox" checked>回答附带引用来源</label>
            <label class="checkbox"><input type="checkbox">低置信度回答自动转人工建议</label>
          </div>
          <div class="form-item"><label>数据展示范围</label>
            <select class="input"><option>本人权限范围（默认）</option><option>本部门汇总</option></select>
            <div class="hint">数据范围受角色与组织权限约束，仅可缩小不可扩大</div></div>
          <button class="btn primary" onclick="U.toast('偏好设置已保存','success')">保存偏好</button>`;
      },
      security: () => {
        body.innerHTML = `
          <div class="section-title">修改密码</div>
          <div style="max-width:420px">
            <div class="form-item"><label>当前密码<span class="req">*</span></label><input class="input" type="password" id="oldPwd" placeholder="请输入当前密码"></div>
            <div class="form-item"><label>新密码<span class="req">*</span></label><input class="input" type="password" id="newPwd" placeholder="8位以上，含大小写字母与数字"><div class="hint">密码策略：复杂度 3/4，90 天有效期</div></div>
            <div class="form-item"><label>确认新密码<span class="req">*</span></label><input class="input" type="password" id="newPwd2"></div>
            <button class="btn primary" id="secSave">修改密码</button>
          </div>
          <div class="section-title">登录设备</div>
          <table class="tbl">
            <thead><tr><th>设备</th><th>登录地点</th><th>最近登录</th><th></th></tr></thead>
            <tbody>
              <tr><td>Chrome 126 / Windows</td><td>长沙·公司内网</td><td>${U.fmtTime(Date.now() - 2 * 36e5)}</td><td><span class="tag green">当前设备</span></td></tr>
              <tr><td>Edge 125 / Windows</td><td>长沙·公司内网</td><td>${U.fmtTime(Date.now() - 3 * 24 * 36e5)}</td><td><button class="btn link sm danger" onclick="U.toast('设备已下线','success')">下线</button></td></tr>
            </tbody>
          </table>`;
        body.querySelector("#secSave").onclick = () => {
          const np = body.querySelector("#newPwd"), np2 = body.querySelector("#newPwd2"), op = body.querySelector("#oldPwd");
          if (!op.value || !np.value) { U.toast("请填写完整", "error"); return; }
          if (np.value.length < 8) { np.classList.add("err"); U.toast("新密码不满足复杂度要求", "error"); return; }
          if (np.value !== np2.value) { np2.classList.add("err"); U.toast("两次输入的新密码不一致", "error"); return; }
          U.toast("密码修改成功，下次登录生效", "success");
          [op, np, np2].forEach(x => x.value = "");
        };
      },
      notify: () => {
        const items = [
          ["知识审核待办", "todo", true], ["知识冲突裁决提醒", "todo", true], ["文档生成完成", "msg", true],
          ["导入任务结果", "msg", true], ["工单 SLA 预警", "todo", true], ["系统公告", "notice", true], ["运营周报推送", "notice", false]
        ];
        body.innerHTML = `<div>${items.map(([n, t, on], i) => `
          <div class="flex align-c justify-b" style="padding:12px 0;border-bottom:1px solid var(--border-2)">
            <div><div>${n}</div><div class="text-sub text-sm">${{ todo: "站内 + 企业微信", msg: "站内", notice: "站内 + 邮件" }[t]}</div></div>
            <span class="switch ${on ? "on" : ""}" data-ns="${i}"></span>
          </div>`).join("")}</div>
          <button class="btn primary mt-16" onclick="U.toast('通知偏好已保存','success')">保存设置</button>`;
        body.querySelectorAll("[data-ns]").forEach(sw => sw.onclick = () => sw.classList.toggle("on"));
      }
    };

    el.querySelectorAll("[data-tab]").forEach(t => t.onclick = () => {
      el.querySelectorAll("[data-tab]").forEach(x => x.classList.remove("active"));
      t.classList.add("active"); tabs[t.dataset.tab]();
    });
    tabs[initTab]();
  });
})();
