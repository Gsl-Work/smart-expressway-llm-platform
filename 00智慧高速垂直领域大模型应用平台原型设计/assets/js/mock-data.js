/* ============================================================
   模拟数据（mock-data.js）—— 全内存，无后端依赖
   数据结构对齐 PFD 第十章《前端数据对象定义》
   ============================================================ */
(function (global) {
  "use strict";
  const now = Date.now();
  const H = 3600e3, D = 24 * H;
  const rnd = seedArr => seedArr;

  const DB = {};

  /* ---------- 用户（P5-01 用户管理） ---------- */
  DB.users = [
    { id: "U1001", name: "周建国", account: "zhoujg", dept: "集团信息中心", deptPath: "交控集团/信息中心", roles: ["R-02"], status: "enabled", phone: "13907310101", lastLogin: now - 2 * H, createdAt: now - 400 * D },
    { id: "U1002", name: "李文静", account: "liwj", dept: "集团知识管理部", deptPath: "交控集团/知识管理部", roles: ["R-01"], status: "enabled", phone: "13907310102", lastLogin: now - 26 * H, createdAt: now - 380 * D },
    { id: "U1003", name: "王志远", account: "wangzy", dept: "长沙分公司运营部", deptPath: "长沙分公司/运营部", roles: ["R-05"], status: "enabled", phone: "13907310103", lastLogin: now - 5 * H, createdAt: now - 300 * D },
    { id: "U1004", name: "陈晓芳", account: "chenxf", dept: "客服中心", deptPath: "交控集团/客服中心", roles: ["R-09"], status: "enabled", phone: "13907310104", lastLogin: now - 40 * 60e3, createdAt: now - 260 * D },
    { id: "U1005", name: "刘德明", account: "liudm", dept: "集团审计部", deptPath: "交控集团/审计部", roles: ["R-03"], status: "enabled", phone: "13907310105", lastLogin: now - 3 * D, createdAt: now - 200 * D },
    { id: "U1006", name: "赵思琪", account: "zhaosq", dept: "长沙分公司监控中心", deptPath: "长沙分公司/监控中心", roles: ["R-07"], status: "enabled", phone: "13907310106", lastLogin: now - 9 * H, createdAt: now - 150 * D },
    { id: "U1007", name: "孙浩然", account: "sunhr", dept: "集团运营部", deptPath: "交控集团/运营部", roles: ["R-04", "R-10"], status: "enabled", phone: "13907310107", lastLogin: now - 11 * H, createdAt: now - 120 * D },
    { id: "U1008", name: "吴丽娟", account: "wulj", dept: "岳阳分公司财务部", deptPath: "岳阳分公司/财务部", roles: ["R-05"], status: "disabled", phone: "13907310108", lastLogin: now - 45 * D, createdAt: now - 100 * D },
    { id: "U1009", name: "郑海涛", account: "zhenght", dept: "运维中心", deptPath: "交控集团/运维中心", roles: ["R-06"], status: "enabled", phone: "13907310109", lastLogin: now - 1 * H, createdAt: now - 90 * D },
    { id: "U1010", name: "何雨欣", account: "heyx", dept: "稽查大队", deptPath: "长沙分公司/稽查大队", roles: ["R-08"], status: "enabled", phone: "13907310110", lastLogin: now - 18 * H, createdAt: now - 60 * D },
    { id: "U1011", name: "马俊杰", account: "majj", dept: "株洲分公司养护科", deptPath: "株洲分公司/养护科", roles: ["R-05"], status: "enabled", phone: "13907310111", lastLogin: now - 30 * H, createdAt: now - 30 * D },
    { id: "U1012", name: "林婉如", account: "linwr", dept: "客服中心", deptPath: "交控集团/客服中心", roles: ["R-09"], status: "enabled", phone: "13907310112", lastLogin: now - 7 * H, createdAt: now - 20 * D }
  ];

  /* ---------- 角色与权限树（P5-02） ---------- */
  DB.roles = [
    { id: "R-01", name: "知识管理员", desc: "知识库全生命周期管理，含审核与冲突裁决", builtin: true, users: 2, status: "enabled" },
    { id: "R-02", name: "系统管理员", desc: "系统配置、用户与权限管理", builtin: true, users: 1, status: "enabled" },
    { id: "R-03", name: "审计员", desc: "只读审计，可查看全部操作日志", builtin: true, users: 1, status: "enabled" },
    { id: "R-04", name: "集团运营", desc: "集团层面运营分析与看板", builtin: true, users: 1, status: "enabled" },
    { id: "R-05", name: "路段管理", desc: "路段级业务管理，数据范围限本路段", builtin: true, users: 3, status: "enabled" },
    { id: "R-06", name: "运维", desc: "系统运维与接口监控", builtin: true, users: 1, status: "enabled" },
    { id: "R-07", name: "应急", desc: "应急处置与预案查询", builtin: true, users: 1, status: "enabled" },
    { id: "R-08", name: "稽查", desc: "稽查业务查询与取证文档", builtin: true, users: 1, status: "enabled" },
    { id: "R-09", name: "客服", desc: "人工兜底工单处理", builtin: true, users: 2, status: "enabled" },
    { id: "R-10", name: "数据分析", desc: "自然语言数据查询与可视化", builtin: true, users: 1, status: "enabled" }
  ];

  DB.permTree = [
    { key: "qa", label: "智能问答", children: [
      { key: "qa-workbench", label: "问答工作台" }, { key: "qa-history", label: "会话历史" }, { key: "qa-tickets", label: "人工兜底工单" }
    ]},
    { key: "doc", label: "文档生成", children: [
      { key: "doc-workbench", label: "生成工作台" }, { key: "doc-records", label: "生成记录" }, { key: "doc-templates", label: "模板管理" }
    ]},
    { key: "kb", label: "知识库管理", children: [
      { key: "kb-overview", label: "知识库总览" }, { key: "kb-assets", label: "知识素材列表" }, { key: "kb-import", label: "知识批量导入" },
      { key: "kb-review", label: "知识审核队列" }, { key: "kb-conflict", label: "知识冲突裁决" }, { key: "kb-category", label: "分类体系管理" }, { key: "kb-exception", label: "解析异常任务" }
    ]},
    { key: "data", label: "数据查询", children: [
      { key: "data-query", label: "自然语言查询" }, { key: "data-dict", label: "数据字典" }, { key: "data-monitor", label: "接口监控" }
    ]},
    { key: "sys", label: "系统管理", children: [
      { key: "sys-users", label: "用户管理" }, { key: "sys-roles", label: "角色权限" }, { key: "sys-org", label: "组织管理" },
      { key: "sys-logs", label: "操作日志" }, { key: "sys-config", label: "系统参数" }, { key: "sys-dashboard", label: "运营看板" }
    ]}
  ];
  DB.rolePerms = {
    "R-01": ["qa", "doc", "kb", "data-query", "sys-dashboard", "qa-workbench", "qa-history", "doc-workbench", "doc-records", "doc-templates", "kb-overview", "kb-assets", "kb-import", "kb-review", "kb-conflict", "kb-category", "kb-exception", "data-query", "sys-dashboard"],
    "R-02": ["qa", "doc", "kb", "data", "sys", "qa-workbench", "qa-history", "doc-workbench", "doc-records", "doc-templates", "kb-overview", "kb-assets", "kb-import", "kb-exception", "data-query", "data-dict", "data-monitor", "sys-users", "sys-roles", "sys-org", "sys-logs", "sys-config", "sys-dashboard"],
    "R-09": ["qa-workbench", "qa-history", "qa-tickets", "doc-workbench", "doc-records", "kb-overview", "data-query", "sys-dashboard"]
  };

  /* ---------- 组织（P5-03） ---------- */
  DB.orgTree = [
    { id: "ORG001", name: "交控集团", type: "group", code: "JKJT", children: [
      { id: "ORG011", name: "信息中心", type: "station", code: "JKJT-XX", children: [] },
      { id: "ORG012", name: "客服中心", type: "station", code: "JKJT-KF", children: [] },
      { id: "ORG013", name: "审计部", type: "station", code: "JKJT-SJ", children: [] },
      { id: "ORG014", name: "运营部", type: "station", code: "JKJT-YY", children: [] },
      { id: "ORG015", name: "运维中心", type: "station", code: "JKJT-YW", children: [] },
      { id: "ORG02", name: "长沙分公司", type: "company", code: "CS", children: [
        { id: "ORG021", name: "运营部", type: "station", code: "CS-YY", children: [] },
        { id: "ORG022", name: "监控中心", type: "station", code: "CS-JK", children: [] },
        { id: "ORG023", name: "稽查大队", type: "station", code: "CS-ZC", children: [] },
        { id: "ORG024", name: "G4京港澳高速长沙段", type: "section", code: "G4-CS", children: [
          { id: "ORG0241", name: "星沙收费站", type: "station", code: "G4-CS-XS", children: [] },
          { id: "ORG0242", name: "黎托养护工区", type: "station", code: "G4-CS-LT", children: [] }
        ]}
      ]},
      { id: "ORG03", name: "岳阳分公司", type: "company", code: "YY", children: [
        { id: "ORG031", name: "财务部", type: "station", code: "YY-CW", children: [] },
        { id: "ORG032", name: "G56杭瑞高速岳阳段", type: "section", code: "G56-YY", children: [] }
      ]},
      { id: "ORG04", name: "株洲分公司", type: "company", code: "ZZ", children: [
        { id: "ORG041", name: "养护科", type: "station", code: "ZZ-YH", children: [] },
        { id: "ORG042", name: "G60沪昆高速株洲段", type: "section", code: "G60-ZZ", children: [] }
      ]}
    ]}
  ];

  /* ---------- 知识分类体系（P3-07） ---------- */
  DB.categoryTree = [
    { id: "CAT01", name: "收费政策", count: 486, children: [
      { id: "CAT011", name: "收费标准", count: 128 }, { id: "CAT012", name: "免费政策", count: 86 }, { id: "CAT013", name: "绿通认定", count: 92 }, { id: "CAT014", name: "逃费稽核", count: 180 }
    ]},
    { id: "CAT02", name: "养护管理", count: 352, children: [
      { id: "CAT021", name: "日常养护", count: 145 }, { id: "CAT022", name: "桥隧养护", count: 98 }, { id: "CAT023", name: "应急处置", count: 109 }
    ]},
    { id: "CAT03", name: "应急安全", count: 268, children: [
      { id: "CAT031", name: "应急预案", count: 76 }, { id: "CAT032", name: "事故处置", count: 64 }, { id: "CAT033", name: "恶劣天气", count: 58 }, { id: "CAT034", name: "施工安全", count: 70 }
    ]},
    { id: "CAT04", name: "运营调度", count: 421, children: [
      { id: "CAT041", name: "路网调度", count: 132 }, { id: "CAT042", name: "节假日保畅", count: 156 }, { id: "CAT043", name: "重点物资运输", count: 133 }
    ]},
    { id: "CAT05", name: "法规制度", count: 189, children: [
      { id: "CAT051", name: "国家法规", count: 87 }, { id: "CAT052", name: "行业规范", count: 102 }
    ]}
  ];

  /* ---------- 知识素材（P3-02 / P3-04） ---------- */
  DB.assets = [];
  const assetSeeds = [
    ["绿色通道车辆免费通行认定标准", "收费政策/绿通认定", "doc", "published", "集团收费处", "R-01"],
    ["高速公路货车计重收费标准（湖南段）", "收费政策/收费标准", "doc", "published", "集团收费处", "R-01"],
    ["G4京港澳高速长沙段桥梁定期检测规程", "养护管理/桥隧养护", "pdf", "published", "长沙分公司", "R-05"],
    ["恶劣天气条件下道路封闭与放行标准", "应急安全/恶劣天气", "doc", "published", "集团运营部", "R-04"],
    ["重大节假日免收小型客车通行费实施方案", "收费政策/免费政策", "doc", "published", "集团运营部", "R-04"],
    ["路面积水结冰应急处置操作手册", "应急安全/应急处置", "doc", "published", "运维中心", "R-06"],
    ["假冒绿通车稽核取证要点", "收费政策/逃费稽核", "doc", "published", "稽查大队", "R-08"],
    ["桥梁伸缩缝日常养护技术要求", "养护管理/日常养护", "pdf", "pending", "株洲分公司", "R-05"],
    ["春运期间重点物资运输保障预案", "运营调度/重点物资运输", "doc", "pending", "集团运营部", "R-04"],
    ["危化品车辆通行高速管理办法摘要", "应急安全/事故处置", "doc", "pending", "岳阳分公司", "R-05"],
    ["节假日路网流量预测与保畅方案编制指南", "运营调度/节假日保畅", "doc", "rejected", "集团运营部", "R-04"],
    ["隧道机电设施巡检周期与内容规范", "养护管理/桥隧养护", "pdf", "published", "运维中心", "R-06"],
    ["收费广场拥堵分级响应机制", "运营调度/路网调度", "doc", "published", "长沙分公司", "R-05"],
    ["施工区交通安全设施布置标准", "应急安全/施工安全", "pdf", "published", "集团运营部", "R-04"],
    ["《公路法》涉路施工许可条款解读", "法规制度/国家法规", "doc", "published", "知识管理部", "R-01"],
    ["收费站文明服务规范用语手册", "运营调度/路网调度", "doc", "published", "客服中心", "R-09"],
    ["超限运输车辆认定与处置流程", "法规制度/行业规范", "doc", "pending", "稽查大队", "R-08"],
    ["路面坑槽修补材料与工艺要求", "养护管理/日常养护", "pdf", "published", "株洲分公司", "R-05"]
  ];
  assetSeeds.forEach((a, i) => {
    DB.assets.push({
      id: "KA" + String(3021 + i),
      title: a[0], category: a[1], type: a[2], status: a[3],
      source: a[4], creator: a[5],
      size: (0.4 + (i * 7 % 40) / 10).toFixed(1) + "MB",
      citations: 3 + (i * 13 % 60),
      updateTime: now - (i + 1) * 9 * H,
      version: "V" + (1 + i % 3) + "." + (i % 7),
      summary: "本文档规定了" + a[0].replace(/标准|要点|规范|手册|指南|办法摘要|流程|要求|机制|规程|方案|条款解读|内容$/, "") + "相关业务的执行标准、适用范围与操作流程，适用于集团各路段公司及收费站、养护工区参照执行。",
      keywords: a[0].slice(0, 4) + "、" + a[1].split("/")[1] + "、高速公路"
    });
  });

  /* ---------- 审核队列（P3-05） ---------- */
  DB.reviews = [
    { id: "RV2026", asset: "桥梁伸缩缝日常养护技术要求", type: "新增", submitter: "王志远（株洲分公司）", submitAt: now - 3 * H, priority: "high" },
    { id: "RV2027", asset: "春运期间重点物资运输保障预案", type: "新增", submitter: "孙浩然（集团运营部）", submitAt: now - 8 * H, priority: "high" },
    { id: "RV2028", asset: "危化品车辆通行高速管理办法摘要", type: "新增", submitter: "马俊杰（岳阳分公司）", submitAt: now - 22 * H, priority: "normal" },
    { id: "RV2029", asset: "超限运输车辆认定与处置流程", type: "新增", submitter: "何雨欣（稽查大队）", submitAt: now - 30 * H, priority: "normal" },
    { id: "RV2030", asset: "收费广场拥堵分级响应机制（V2.1）", type: "版本更新", submitter: "王志远（长沙分公司）", submitAt: now - 2 * D, priority: "low" },
    { id: "RV2031", asset: "隧道机电设施巡检周期与内容规范（V2.0）", type: "版本更新", submitter: "郑海涛（运维中心）", submitAt: now - 3 * D, priority: "normal" }
  ];

  /* ---------- 知识冲突（P3-06） ---------- */
  DB.conflicts = [
    {
      id: "CF031", title: "桥梁定期检测周期", category: "养护管理/桥隧养护", detectAt: now - 5 * H, status: "open",
      a: { source: "《公路桥涵养护规范》JTG 5120-2021", content: "桥梁定期检测周期一般不超过3年，特大桥应不超过1年。", updateTime: now - 800 * D },
      b: { source: "G4京港澳高速长沙段桥梁管理台账", content: "主桥定期检测每年1次，引桥每2年1次。", updateTime: now - 90 * D }
    },
    {
      id: "CF032", title: "绿通车辆免费通行核载认定", category: "收费政策/绿通认定", detectAt: now - 20 * H, status: "open",
      a: { source: "交通运输部绿通政策问答", content: "核载认定以行驶证标注的核定载质量为准。", updateTime: now - 600 * D },
      b: { source: "湖南高速绿通执行细则（2025修订）", content: "核载认定以行驶证核定载质量与货物实际装载质量共同认定，装载率不低于80%。", updateTime: now - 120 * D }
    },
    {
      id: "CF033", title: "恶劣天气能见度封闭阈值", category: "应急安全/恶劣天气", detectAt: now - 2 * D, status: "open",
      a: { source: "集团恶劣天气处置预案", content: "能见度低于100米时封闭路段。", updateTime: now - 500 * D },
      b: { source: "湖南省高速公路管制标准", content: "能见度低于50米时封闭路段，50-100米限速40km/h通行。", updateTime: now - 200 * D }
    }
  ];

  /* ---------- 批量导入 / 解析异常（P3-03 / P3-08） ---------- */
  DB.imports = [
    { id: "IM2026", file: "2026年新收费政策汇编.pdf", size: "12.4MB", status: "parsing", progress: 68, total: 156, ok: 0, fail: 0, createAt: now - 20 * 60e3, creator: "李文静" },
    { id: "IM2025", file: "株洲分公司养护规程合集.zip", size: "48.2MB", status: "done", progress: 100, total: 89, ok: 85, fail: 4, createAt: now - 8 * H, creator: "马俊杰" },
    { id: "IM2024", file: "应急预案库2026版.docx", size: "5.1MB", status: "done", progress: 100, total: 32, ok: 31, fail: 1, createAt: now - 2 * D, creator: "李文静" },
    { id: "IM2023", file: "稽查案例汇编（扫描件）.pdf", size: "86MB", status: "error", progress: 42, total: 210, ok: 60, fail: 28, createAt: now - 3 * D, creator: "何雨欣" }
  ];
  DB.exceptions = [
    { id: "EX1088", file: "稽查案例汇编（扫描件）.pdf", reason: "扫描件无法提取文本，需人工转录", count: 22, status: "open", createAt: now - 3 * D },
    { id: "EX1087", file: "稽查案例汇编（扫描件）.pdf", reason: "表格结构异常：嵌套表头超过3层", count: 6, status: "open", createAt: now - 3 * D },
    { id: "EX1086", file: "株洲分公司养护规程合集.zip/桥梁细则.docx", reason: "文档损坏，无法解析", count: 1, status: "open", createAt: now - 8 * H },
    { id: "EX1085", file: "应急预案库2026版.docx", reason: "图片中的文字未做OCR标注", count: 1, status: "ignored", createAt: now - 2 * D },
    { id: "EX1084", file: "岳阳段收费月报.xlsx", reason: "合并单元格导致数据错位", count: 3, status: "resolved", createAt: now - 5 * D }
  ];

  /* ---------- 文档模板（P2-04 / P2-05） ---------- */
  DB.templates = [
    { id: "TPL01", name: "路段月度运营分析报告", category: "运营分析", chapters: ["运行概况", "流量与收费分析", "养护执行情况", "安全事件统计", "问题与建议"], status: "enabled", usage: 328, updateTime: now - 6 * D, owner: "集团运营部" },
    { id: "TPL02", name: "突发事件处置报告", category: "应急安全", chapters: ["事件概述", "处置经过", "原因分析", "损失评估", "责任认定", "整改措施"], status: "enabled", usage: 96, updateTime: now - 12 * D, owner: "集团运营部" },
    { id: "TPL03", name: "节假日保畅工作总结", category: "运营调度", chapters: ["总体情况", "流量特征分析", "保畅措施执行", "典型案例", "经验与改进"], status: "enabled", usage: 154, updateTime: now - 20 * D, owner: "集团运营部" },
    { id: "TPL04", name: "桥梁定期检测报告", category: "养护管理", chapters: ["工程概况", "检测内容与方法", "技术状况评定", "病害分析", "维修建议"], status: "enabled", usage: 87, updateTime: now - 30 * D, owner: "运维中心" },
    { id: "TPL05", name: "稽查案例分析报告", category: "稽查管理", chapters: ["案例背景", "稽查过程", "证据链说明", "处理结果", "风险提示"], status: "enabled", usage: 62, updateTime: now - 15 * D, owner: "稽查大队" },
    { id: "TPL06", name: "收费站文明服务自查报告", category: "服务管理", chapters: ["自查范围", "服务达标情况", "问题清单", "整改计划"], status: "disabled", usage: 18, updateTime: now - 60 * D, owner: "客服中心" }
  ];

  /* ---------- 文档生成记录（P2-03） ---------- */
  DB.docTasks = [
    { id: "DT2026", title: "G4京港澳高速长沙段8月运营分析报告", template: "路段月度运营分析报告", status: "generating", progress: 72, creator: "王志远", createAt: now - 12 * 60e3, words: 0 },
    { id: "DT2025", title: "星沙收费站拥堵事件处置报告（8月18日）", template: "突发事件处置报告", status: "done", progress: 100, creator: "赵思琪", createAt: now - 26 * H, words: 4820, reviewed: true },
    { id: "DT2024", title: "2026年春运保畅工作总结", template: "节假日保畅工作总结", status: "done", progress: 100, creator: "孙浩然", createAt: now - 3 * D, words: 6530, reviewed: true },
    { id: "DT2023", title: "黎托养护工区桥梁检测报告（K1542+300）", template: "桥梁定期检测报告", status: "done", progress: 100, creator: "马俊杰", createAt: now - 4 * D, words: 3210, reviewed: false },
    { id: "DT2022", title: "假冒绿通车稽查案例分析（7月）", template: "稽查案例分析报告", status: "done", progress: 100, creator: "何雨欣", createAt: now - 5 * D, words: 2860, reviewed: false },
    { id: "DT2021", title: "岳阳分公司汛期应急处置报告", template: "突发事件处置报告", status: "failed", progress: 35, creator: "刘德明", createAt: now - 6 * D, words: 0 },
    { id: "DT2020", title: "沪昆高速株洲段7月运营分析报告", template: "路段月度运营分析报告", status: "done", progress: 100, creator: "马俊杰", createAt: now - 8 * D, words: 5120, reviewed: true }
  ];

  /* ---------- 问答会话（P1-01 / P1-02） ---------- */
  DB.qaSessions = [
    {
      id: "SE9001", title: "绿通车辆认定标准", time: now - 30 * 60e3, count: 3,
      messages: [
        { role: "user", text: "拉运新鲜蔬菜的货车免费通行怎么认定？" },
        { role: "ai", text: "根据《绿色通道车辆免费通行认定标准》等知识条目：\n\n**一、认定条件**\n- 车辆须为合法装载运输**新鲜蔬菜**的货车，且行驶证核定载质量达标；\n- 装载的蔬菜须属于《鲜活农产品品种目录》范围；\n- 装载率不低于核定载质量的80%。", conf: 0.94, cites: ["KA3021 绿色通道车辆免费通行认定标准", "《鲜活农产品品种目录》"] }
      ]
    },
    { id: "SE8999", title: "桥梁检测周期要求", time: now - 5 * H, count: 2, messages: [] },
    { id: "SE8998", title: "恶劣天气封路标准", time: now - 8 * H, count: 5, messages: [] },
    { id: "SE8997", title: "超限运输许可办理流程", time: now - 2 * D, count: 3, messages: [] },
    { id: "SE8996", title: "节假日免费通行时间范围", time: now - 3 * D, count: 2, messages: [] },
    { id: "SE8995", title: "施工区安全设施布置要求", time: now - 4 * D, count: 4, messages: [] },
    { id: "SE8994", title: "隧道机电巡检周期", time: now - 5 * D, count: 2, messages: [] },
    { id: "SE8993", title: "收费争议处理流程", time: now - 6 * D, count: 6, messages: [] }
  ];

  /* ---------- 问答答案库（模拟大模型） ---------- */
  DB.qaAnswers = [
    {
      conf: 0.93, cites: ["KA3025 重大节假日免收小型客车通行费实施方案", "收费政策/免费政策"],
      text: "根据现行收费政策知识条目：\n\n**一、免费通行时间范围**\n- 仅限**春节、清明节、劳动节、国庆节**四个国家法定节假日；\n- 免费时段为节假日第一天**00:00**开始，至最后一天**24:00**结束（普通公路以车辆通过收费站收费车道的时间为准，高速公路以车辆驶离出口收费车道的时间为准）。\n\n**二、免费车辆范围**\n- 行驶收费公路的**7座以下（含7座）载客车辆**。\n\n**三、注意事项**\n- 免费期间ETC车道正常通行，系统自动判别；\n- 免费与收费转换过渡期时段以通知为准。"
    },
    {
      conf: 0.87, cites: ["KA3031 桥梁伸缩缝日常养护技术要求", "《公路桥涵养护规范》"],
      text: "根据养护管理知识条目：\n\n**一、检测周期**\n- 桥梁定期检测周期一般不超过**3年**；\n- 特大桥、特殊结构桥梁应**每年1次**；\n- 三类以上桥梁应加密检测频次。\n\n**二、伸缩缝日常养护要点**\n- 每月巡查1次，重点检查锚固区混凝土破损、异响；\n- 及时清除缝内杂物（泥沙、石块）；\n- 发现异响或破损应在**48小时内**报修。"
    },
    {
      conf: 0.85, cites: ["KA3030 恶劣天气条件下道路封闭与放行标准"],
      text: "根据应急安全知识条目：\n\n**恶劣天气分级管控标准**\n- **能见度低于50米**：封闭路段，车辆就近驶离；\n- **能见度50-100米**：限速40km/h，保持100米以上车距；\n- **能见度100-200米**：限速60km/h，开启雾灯示廓灯；\n- **路面结冰**：限速30km/h，必要时撒布融雪剂并间歇放行。\n\n**放行条件**：能见度恢复至100米以上且路面无结冰，由路网调度中心统一发布放行指令。"
    },
    {
      conf: 0.78, cites: ["KA3037 超限运输车辆认定与处置流程"],
      text: "根据法规制度知识条目：\n\n**一、认定标准**\n- 车货总高度超过**4米**、宽度超过**2.55米**、长度超过**18.1米**；\n- 车货总质量超过**49吨**（六轴及以上）。\n\n**二、处置流程**\n1. 收费站发现疑似超限车辆，引导至检测点称重；\n2. 确认超限后录入系统并通知路政部门；\n3. 责令卸载分装并依法处罚；\n4. 涉及不可解体物品的，需办理《超限运输车辆通行证》。\n\n**注**：具体处罚标准以最新法规版本为准。"
    },
    {
      conf: 0.91, cites: ["KA3034 收费广场拥堵分级响应机制"],
      text: "根据运营调度知识条目：\n\n**收费广场拥堵分级响应**\n- **一级（排队超过200米）**：开启全部车道，便携机收费；\n- **二级（排队超过500米或等待15分钟）**：一级措施+主线分流引导；\n- **三级（排队超过1公里）**：上报路网调度中心，启动远端分流预案，联动交警现场指挥。\n\n**配套要求**：广场广播循环播报、情报板发布提示、每10分钟上报一次排队长度。"
    }
  ];
  DB.qaFallbackAnswer = {
    conf: 0.42, cites: [],
    text: "抱歉，当前知识库中未检索到与该问题直接相关的内容。\n\n您可以：\n- 更换关键词后重新提问（建议使用政策名称+具体问题）；\n- 在【知识库管理-知识素材】中确认相关资料是否已入库；\n- 点击下方「转人工工单」，由客服人员跟进处理。"
  };

  /* ---------- 人工兜底工单（P1-03） ---------- */
  DB.tickets = [
    { id: "TK2068", session: "SE9012", question: "跨省绿通车辆装载率争议如何处理？", asker: "星沙收费站-刘敏", channel: "问答工作台", status: "open", createAt: now - 50 * 60e3, sla: "2小时", reply: "" },
    { id: "TK2067", session: "SE9010", question: "通行费电子发票开票单位与实际收款单位不一致怎么办？", asker: "王先生（车主）", channel: "问答工作台", status: "open", createAt: now - 3 * H, sla: "2小时", reply: "" },
    { id: "TK2066", session: "SE9008", question: "ETC重复扣费申诉进度查询", asker: "李女士（车主）", channel: "客服热线", status: "processing", createAt: now - 6 * H, sla: "24小时", reply: "已联系发行方核实，属门架计费重复，预计3个工作日内原路退回。" },
    { id: "TK2065", session: "SE9002", question: "桥梁检测报告中技术状况等级评定依据哪个规范版本？", asker: "株洲分公司-马俊杰", channel: "问答工作台", status: "processing", createAt: now - 20 * H, sla: "24小时", reply: "按JTG/T H21-2011执行，2026年起新项目同步参照省厅新规。" },
    { id: "TK2064", session: "SE8995", question: "绿通目录外的农产品（如榴莲）是否免费？", asker: "岳阳分公司-周鹏", channel: "问答工作台", status: "closed", createAt: now - 2 * D, sla: "24小时", reply: "榴莲属于《鲜活农产品品种目录》内品类，可免费，但需满足装载率要求。" }
  ];

  /* ---------- 消息通知（P0-04） ---------- */
  DB.notifications = [
    { id: "N01", type: "todo", title: "知识审核待办", desc: "《桥梁伸缩缝日常养护技术要求》等 6 条知识待审核", time: now - 30 * 60e3, read: false },
    { id: "N02", type: "todo", title: "冲突裁决待办", desc: "检测到 3 条知识冲突，需要人工裁决", time: now - 5 * H, read: false },
    { id: "N03", type: "notice", title: "系统公告", desc: "平台将于周六 02:00-04:00 例行维护，期间问答服务降级", time: now - 9 * H, read: false },
    { id: "N04", type: "msg", title: "文档生成完成", desc: "《2026年春运保畅工作总结》已生成完毕，可前往编辑", time: now - 26 * H, read: true },
    { id: "N05", type: "msg", title: "导入任务完成", desc: "株洲分公司养护规程合集.zip 解析完成：85条成功、4条异常", time: now - 8 * H, read: true },
    { id: "N06", type: "notice", title: "知识库更新", desc: "《收费政策》分类本周新增 23 条知识", time: now - 2 * D, read: true },
    { id: "N07", type: "msg", title: "工单升级提醒", desc: "工单 TK2067 即将超出 SLA（剩余40分钟）", time: now - 80 * 60e3, read: false }
  ];

  /* ---------- 数据字典（P4-03） ---------- */
  DB.dict = [
    { id: "D001", table: "t_traffic_flow", tableCn: "路网流量表", field: "section_code", fieldCn: "路段编码", type: "string", enum: "G4-CS / G56-YY / G60-ZZ", unit: "-", nullable: "否", desc: "唯一标识路段，关联组织维度", owner: "数据组", sensitive: false },
    { id: "D002", table: "t_traffic_flow", tableCn: "路网流量表", field: "flow_total", fieldCn: "断面总流量", type: "int", enum: "-", unit: "辆/日", nullable: "否", desc: "24小时断面自然流量合计", owner: "数据组", sensitive: false },
    { id: "D003", table: "t_toll", tableCn: "收费流水表", field: "toll_amount", fieldCn: "通行费金额", type: "decimal(10,2)", enum: "-", unit: "元", nullable: "否", desc: "实收通行费金额（含拆分后）", owner: "收费组", sensitive: false },
    { id: "D004", table: "t_incident", tableCn: "事件表", field: "incident_type", fieldCn: "事件类型", type: "string", enum: "交通事故 / 恶劣天气 / 施工 / 设施故障 / 其他", unit: "-", nullable: "否", desc: "路网事件类型分类", owner: "调度组", sensitive: false },
    { id: "D005", table: "t_maintenance", tableCn: "养护作业表", field: "cost", fieldCn: "养护费用", type: "decimal(12,2)", enum: "-", unit: "万元", nullable: "是", desc: "当期养护作业费用", owner: "养护组", sensitive: false },
    { id: "D006", table: "t_vehicle_pass", tableCn: "车辆通行表", field: "plate_no", fieldCn: "车牌号码", type: "string", enum: "-", unit: "-", nullable: "否", desc: "脱敏后车牌（保留首尾字符）", owner: "数据组", sensitive: true },
    { id: "D007", table: "t_green_channel", tableCn: "绿通查验表", field: "pass_result", fieldCn: "查验结论", type: "string", enum: "通过 / 不通过 / 存疑", unit: "-", nullable: "否", desc: "绿通车辆查验结论", owner: "收费组", sensitive: false },
    { id: "D008", table: "t_satisfaction", tableCn: "满意度表", field: "score", fieldCn: "满意度评分", type: "int", enum: "1-5", unit: "分", nullable: "否", desc: "服务满意度评分", owner: "客服组", sensitive: false }
  ];

  /* ---------- 数据查询（P4-01 / P4-02） ---------- */
  DB.queryHistory = [
    { id: "Q3018", text: "查一下G4长沙段8月份日均断面流量和环比", sql: "SELECT section, AVG(flow) FROM t_traffic_flow WHERE month='2026-08' GROUP BY section", time: now - 40 * 60e3, duration: "1.8s", rows: 12, user: "孙浩然" },
    { id: "Q3017", text: "各路段2026年截至目前通行费收入排名", sql: "SELECT section, SUM(toll_amount) ... GROUP BY section ORDER BY 2 DESC", time: now - 5 * H, duration: "2.4s", rows: 9, user: "孙浩然" },
    { id: "Q3016", text: "上半年交通事故数量按类型分布", sql: "SELECT incident_type, COUNT(*) ... GROUP BY 1", time: now - 2 * D, duration: "1.2s", rows: 5, user: "赵思琪" },
    { id: "Q3015", text: "各养护工区二季度养护费用对比", sql: "SELECT org, SUM(cost) ... GROUP BY org", time: now - 3 * D, duration: "1.6s", rows: 7, user: "马俊杰" },
    { id: "Q3014", text: "绿通查验不通过率最高的前5个收费站", sql: "SELECT station, ... ORDER BY rate DESC LIMIT 5", time: now - 5 * D, duration: "2.1s", rows: 5, user: "何雨欣" }
  ];
  DB.querySuggests = ["各路段本月通行费收入对比", "G4长沙段近30天断面流量趋势", "恶劣天气事件数量按月分布", "各收费站绿通通过率排名", "养护费用按路段汇总"];
  DB.queryResult = {
    sql: "SELECT section_code AS 路段, SUM(flow_total) AS 总流量, ROUND(SUM(toll_amount),2) AS 通行费收入, COUNT(DISTINCT incident_id) AS 事件数 FROM v_section_daily WHERE month = '2026-08' GROUP BY section_code",
    intent: { dims: ["路段"], metrics: ["总流量", "通行费收入", "事件数"], filter: "统计月份 = 2026-08", scope: "数据范围：全集团（用户权限内 9 个路段）" },
    columns: ["路段", "总流量（辆）", "通行费收入（万元）", "事件数（起）"],
    rows: [
      ["G4京港澳高速长沙段", 1286400, 6892.4, 43],
      ["G56杭瑞高速岳阳段", 954300, 4657.8, 31],
      ["G60沪昆高速株洲段", 887200, 5210.6, 27],
      ["G5513长张高速常德段", 642100, 3128.9, 19],
      ["S50长韶娄高速", 498700, 2264.3, 14],
      ["G0421许广高速衡阳段", 452600, 2089.7, 22]
    ]
  };

  /* ---------- 接口监控（P4-04） ---------- */
  DB.interfaces = [
    { id: "api-001", name: "会话创建 /v1/sessions", qps: 34.2, p95: "182ms", errRate: 0.12, today: 812400, status: "healthy" },
    { id: "api-002", name: "问答生成 /v1/chat/completions", qps: 21.8, p95: "4.2s", errRate: 0.31, today: 512900, status: "healthy" },
    { id: "api-003", name: "知识检索 /v1/kb/search", qps: 45.6, p95: "96ms", errRate: 0.08, today: 1086000, status: "healthy" },
    { id: "api-004", name: "文档生成 /v1/doc/generate", qps: 2.1, p95: "38s", errRate: 1.24, today: 18300, status: "warn" },
    { id: "api-005", name: "数据查询 /v1/data/query", qps: 8.4, p95: "2.3s", errRate: 0.42, today: 198700, status: "healthy" },
    { id: "api-006", name: "字典服务 /v1/data/dict", qps: 12.7, p95: "45ms", errRate: 0.03, today: 302100, status: "healthy" },
    { id: "api-007", name: "工单服务 /v1/tickets", qps: 0.8, p95: "310ms", errRate: 0.00, today: 6800, status: "healthy" },
    { id: "api-008", name: "模型推理网关 /v1/infer", qps: 18.9, p95: "6.8s", errRate: 3.82, today: 449800, status: "down" }
  ];

  /* ---------- 操作日志（P5-04） ---------- */
  const logSeeds = [
    ["zhoujg", "周建国", "系统管理", "修改系统参数：会话超时时间 30分钟 → 45分钟", "warning"],
    ["liwj", "李文静", "知识库管理", "审核通过知识《桥梁伸缩缝日常养护技术要求》", "normal"],
    ["wangzy", "王志远", "文档生成", "生成文档《G4长沙段8月运营分析报告》", "normal"],
    ["chenxf", "陈晓芳", "智能问答", "回复人工工单 TK2066", "normal"],
    ["heyx", "何雨欣", "知识库管理", "提交知识《超限运输车辆认定与处置流程》待审核", "normal"],
    ["zhenght", "郑海涛", "系统管理", "接口监控告警确认：模型推理网关错误率3.82%", "warning"],
    ["sunhr", "孙浩然", "数据查询", "执行自然语言查询：各路段本月通行费收入对比", "normal"],
    ["majj", "马俊杰", "知识库管理", "批量导入：株洲分公司养护规程合集.zip（89条）", "normal"],
    ["zhoujg", "周建国", "系统管理", "新增用户：林婉如（客服中心，角色-客服）", "important"],
    ["liudm", "刘德明", "文档生成", "生成失败：岳阳分公司汛期应急处置报告（知识不足）", "warning"],
    ["zhaosq", "赵思琪", "智能问答", "会话满意度评价：满意", "normal"],
    ["liwj", "李文静", "知识库管理", "冲突裁决：保留《湖南省高速公路管制标准》版本", "important"]
  ];
  DB.logs = logSeeds.map((l, i) => ({
    id: "LG" + (98600 - i * 7),
    account: l[0], name: l[1], module: l[2], action: l[3], level: l[4],
    ip: "10.62." + (30 + i) + "." + (100 + i * 13 % 150),
    time: now - (i + 1) * 47 * 60e3
  }));

  /* ---------- 系统参数（P5-05） ---------- */
  DB.sysConfig = {
    session: { timeout: 45, maxRounds: 20, historyKeep: 90, streamSpeed: "fast" },
    generation: { maxWords: 8000, temperature: 0.7, retryTimes: 2, citationRequired: true, reviewRequired: true },
    security: { passwordPolicy: "复杂度3/4", pwdExpire: 90, loginLock: 5, watermark: true, privacyMask: true, auditKeep: 365 }
  };

  /* ---------- 看板统计（P5-06 / P3-01 / P4-04） ---------- */
  const days = 14;
  DB.statDays = Array.from({ length: days }, (_, i) => {
    const d = new Date(now - (days - 1 - i) * D);
    return `${d.getMonth() + 1}/${d.getDate()}`;
  });
  DB.trendQA = rnd([3120, 3480, 3905, 4210, 4620, 5105, 5860, 4530, 4380, 4890, 5240, 5680, 6120, 6540]);
  DB.trendDoc = rnd([86, 102, 95, 128, 140, 166, 188, 121, 115, 132, 148, 160, 175, 190]);
  DB.trendQuery = rnd([210, 260, 245, 310, 342, 380, 420, 298, 285, 312, 348, 366, 402, 438]);
  DB.donutAssets = [
    { name: "收费政策", value: 486 }, { name: "运营调度", value: 421 }, { name: "养护管理", value: 352 },
    { name: "应急安全", value: 268 }, { name: "法规制度", value: 189 }
  ];
  DB.topUsers = [
    { name: "王志远", dept: "长沙分公司", qa: 486, doc: 38 }, { name: "陈晓芳", dept: "客服中心", qa: 452, doc: 12 },
    { name: "孙浩然", dept: "集团运营部", qa: 398, doc: 56 }, { name: "赵思琪", dept: "长沙分公司", qa: 355, doc: 21 },
    { name: "何雨欣", dept: "稽查大队", qa: 298, doc: 18 }, { name: "马俊杰", dept: "株洲分公司", qa: 276, doc: 25 }
  ];
  DB.kpi = {
    qaTotal: 54210, qaToday: 6540, qaWeekGrowth: 12.4,
    docTotal: 8260, docToday: 190, docAvgTime: "3分42秒",
    kbAssets: 1716, kbPending: 6, kbConflicts: 3, kbExceptions: 3,
    satisfaction: 92.6, resolveRate: 78.3, ticketTotal: 68,
    tokens: 4.2, activeUsers: 1286, modelQPS: 18.9, modelErrRate: 3.82
  };

  /* ---------- 文档生成模拟内容（P2-01/P2-02） ---------- */
  DB.docDraft = {
    title: "G4京港澳高速长沙段8月运营分析报告",
    sections: [
      { id: "s1", title: "一、运行概况", paras: [
        "8月份，G4京港澳高速长沙段整体运行平稳，全月断面平均流量42,880辆/日，环比增长6.8%，同比增长11.2%。其中小型客车占比68.4%，货车占比24.1%，其他车型占比7.5%。",
        "全月共发生各类路网事件43起，其中交通事故12起、设施故障9起、恶劣天气管制8起、施工作业14起，事件总量环比下降9.4%，未发生重大及以上安全责任事故。"
      ], cites: [1, 3] },
      { id: "s2", title: "二、流量与收费分析", paras: [
        "8月通行费收入6,892.4万元，完成月度预算的103.5%。收费车流量1,286,400辆，ETC使用率87.2%，环比提升1.3个百分点。",
        "分时段看，早高峰（7:00-9:00）与晚高峰（17:00-19:00）流量占全天流量的28.6%，暑期周末流量较工作日高出22.4%，8月第三个周末受短途出游影响创当月流量峰值（单日54,620辆）。"
      ], cites: [2] },
      { id: "s3", title: "三、养护执行情况", paras: [
        "当月完成日常养护巡查31次，完成路面坑槽修补42处、伸缩缝清理维护18道、护栏维修2.4公里，养护费用支出286.5万元，占年度预算的6.9%。"
      ], cites: [4] },
      { id: "s4", title: "四、安全事件统计", paras: [
        "全月交通事故12起（其中伤人事故3起），事故多发点位为K1542-K1545长下坡路段，共计4起，占比33.3%，建议持续加强该路段速度管控与提示设施优化。"
      ], cites: [3] },
      { id: "s5", title: "五、问题与建议", paras: [
        "建议：一是在9月开学季叠加中秋出行前完成K1542路段增设减速标线与视频监控补盲；二是针对绿通查验争议工单上升趋势（环比+15%），加强一线人员政策培训；三是推进星沙收费站拥堵分级响应机制落地演练。"
      ], cites: [5] }
    ],
    citations: [
      { id: 1, title: "G4长沙段流量月报（2026-08）", from: "数据中台 t_traffic_flow" },
      { id: 2, title: "通行费收入统计（2026-08）", from: "数据中台 t_toll" },
      { id: 3, title: "路网事件月度汇总", from: "数据中台 t_incident" },
      { id: 4, title: "养护作业台账（2026-08）", from: "数据中台 t_maintenance" },
      { id: 5, title: "收费广场拥堵分级响应机制", from: "知识库 KA3034" }
    ]
  };

  global.DB = DB;
})(window);
