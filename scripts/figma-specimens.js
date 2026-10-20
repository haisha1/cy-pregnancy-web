const created = [];
if (KIND === "foundations")
  for (const theme of ["Light", "Dark"]) {
    const f = box(page, "Foundations/" + theme, 1440, "VERTICAL", null, 40, 32);
    f.setExplicitVariableModeForCollection(tc, modeIds[theme]);
    f.fills = [
      gradient(["bg-gradientStart", "bg-gradientMid", "bg-gradientEnd"]),
    ];
    text(f, "同一产品，同一套设计语言。", "Title");
    text(
      f,
      "App → 管理端  /  共享色彩、圆角、材质、字体；扩展桌面密度。",
      "Body",
      "text-secondary",
    );
    const palettes = [
      "primary",
      "primary-gradientEnd",
      "text-primary",
      "text-secondary",
      "success",
      "warning",
      "danger",
      "glass-fillStrong",
    ];
    for (let start = 0; start < palettes.length; start += 4) {
      const r = row(f, "Palette", 1360, 16);
      for (const key of palettes.slice(start, start + 4)) {
        const c = box(r, key, 328, "VERTICAL", "glass-fillStrong", 16, 12);
        const swatch = figma.createRectangle();
        swatch.resize(296, 80);
        fill(swatch, key);
        radius(swatch, "input");
        c.appendChild(swatch);
        text(c, key, "Label", "text-primary");
      }
    }
    text(f, "Typography / Noto Sans SC", "Heading");
    for (const [style, chars] of [
      ["Title", "页面标题 24 / 32"],
      ["Heading", "区块标题 16 / 24"],
      ["Body", "正文与控件 14 / 22"],
      ["Reading", "长文阅读 15 / 26"],
      ["Caption", "辅助说明 12 / 18"],
    ])
      text(f, chars, style);
    const shapes = row(f, "Shapes", 1360, 24);
    for (const [key, label] of [
      ["input", "输入 12px"],
      ["button", "按钮 16px"],
      ["card", "卡片 24px"],
    ]) {
      const c = box(shapes, label, 300, "VERTICAL", "glass-fillStrong", 24, 12);
      radius(c, key);
      text(c, label, "Label");
    }
    text(
      f,
      "玻璃：24px模糊 / strong承载长文与表格 / 不支持时实色降级",
      "Caption",
      "text-secondary",
    );
    f.x = theme === "Light" ? 0 : 1560;
    created.push(evidence(f));
  }
if (KIND === "cover") {
  const f = box(
    page,
    "春雨孕算管理端 / 设计索引",
    1440,
    "VERTICAL",
    null,
    40,
    32,
  );
  f.fills = [
    gradient(["bg-gradientStart", "bg-gradientMid", "bg-gradientEnd"]),
  ];
  text(f, "春雨孕算", "Title", "primary");
  const t = text(f, "管理端 Web\n模块化双主题设计", "Title");
  t.fontSize = 48;
  t.lineHeight = { unit: "PIXELS", value: 64 };
  text(
    f,
    "沿用 App 的蓝青渐变、柔光背景与圆角玻璃。",
    "Reading",
    "text-secondary",
  );
  const sum = row(f, "Scope", 1360, 16);
  for (const [title, body] of [
    ["18 个业务页面", "Light / Dark 共 36 张默认设计"],
    ["组件先行", "基础、业务与页面分层复用"],
    ["真实能力边界", "设计示例不等于后端已接通"],
  ])
    instance(sum, "GlassCard/Strong", { Title: title, Body: body }, 440);
  text(f, "模块索引", "Heading");
  for (const [label, key] of [
    ["内容中心 · 列表 / 新建 / 编辑 / 版本详情", "W05"],
    ["审核发布 · 队列 / 核对 / 管理库发布", "W10"],
    ["账号系统 · 登录 / 角色 / 审计 / 能力", "W12"],
    ["工作台与用户 · 任务入口 / 最小账号查询", "W02"],
  ]) {
    const r = row(f, label, 1360);
    text(r, label, "Heading", "text-primary", 1000);
    const b = button(r, "查看模块", "Secondary", 152);
    bindLink(b, key);
  }
  notice(
    f,
    "设计交付说明",
    "页面包含标明的示例内容。全量搜索、队列、统计与用户查询仍有接口依赖；管理库发布不代表App分发已接通。",
    1360,
  );
  created.push(evidence(f));
}
if (KIND === "handoff") {
  const f = box(
    page,
    "Dev Handoff / 设计到开发",
    1440,
    "VERTICAL",
    "glass-fallback",
    40,
    24,
  );
  text(f, "开发交付与组件映射", "Title", "primary");
  text(
    f,
    "结构：Primitives → Theme Light/Dark → 共享组件 → 业务组件 → 页面实例",
    "Heading",
  );
  for (const line of [
    "颜色来源：App styles/theme.ts，31个共享语义色；尺寸沿用12/16/24px圆角。",
    "文字：Noto Sans SC Regular/Medium/Bold，7个共享文字样式。",
    "基础：Button / Field / Badge / Notice / NavItem / GlassCard / Select / Sidebar。",
    "业务：知识表格、双表达、来源依据、审核意见、版本历史、能力、游标、弹层。",
    "内容：W05-W08；审核发布：W09-W11；账号系统：W01、W12-W18；工作台用户：W02-W04。",
    "状态：加载、空、无结果、失败、离线、403/404、会话过期、校验、冲突、忙碌、成功。",
    "响应式：390px登录、768px纵排审核、1280px表格独立横滚。",
    "交互原型：集中到同一Page建立跨模块导航与主题切换，示例状态不写服务器。",
    "实现基线：web/README、DESIGN、REQUIREMENTS、UX-CONTRACT及docs/API-CONTRACT。",
    "Code Connect：管理Web运行组件尚未创建，当前不伪造代码映射。",
    "待联调：全量搜索、统计、用户、审核/发布队列；模型与App分发未接通。",
  ]) {
    text(f, line, "Body", "text-secondary", 1360);
  }
  created.push(evidence(f));
}
if (KIND === "components") {
  for (const theme of ["Light", "Dark"]) {
    const f = box(
      page,
      "Component Review/" + theme,
      1440,
      "VERTICAL",
      null,
      40,
      24,
    );
    f.setExplicitVariableModeForCollection(tc, modeIds[theme]);
    f.fills = [
      gradient(["bg-gradientStart", "bg-gradientMid", "bg-gradientEnd"]),
    ];
    text(f, "公共组件 / " + theme, "Title");
    const r = row(f, "Buttons", 1360, 16);
    for (const [k, l] of [
      ["Primary", "主要操作"],
      ["Secondary", "次级操作"],
      ["Ghost", "文字操作"],
      ["Danger", "危险动作"],
      ["Busy", "保存中…"],
      ["Disabled", "不可用"],
    ])
      button(r, l, k, 176);
    const fields = row(f, "Fields", 1360, 24);
    field(fields, "默认字段", "请输入内容", 430);
    field(fields, "聚焦字段", "正在编辑", 430, "Focused");
    field(fields, "校验错误", "", 430, "Error");
    const statuses = row(f, "Badges", 1360, 24);
    for (const tone of ["Info", "Success", "Warning", "Danger", "Neutral"])
      instance(statuses, "Badge/" + tone);
    instance(f, "ConfirmDialog");
    const controls = row(f, "Open controls", 1360, 24);
    instance(controls, "SelectMenu");
    instance(controls, "DateRangePopover");
    f.x = theme === "Light" ? 5200 : 6760;
    f.y = 0;
    created.push(evidence(f));
  }
}
return { frames: created, count: created.length };
