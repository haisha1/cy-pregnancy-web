const created = [];
let ix = 0;
const cases = [
  ["Loading", "载入知识内容"],
  ["Empty", "还没有知识内容"],
  ["NoResults", "没有匹配结果"],
  ["Error", "暂时无法加载"],
  ["Offline", "当前离线"],
  ["403", "权限不足"],
  ["404", "内容不存在"],
  ["Expired", "登录状态已过期"],
  ["Validation", "请核对输入"],
  ["Conflict", "版本已被更新"],
  ["Busy", "正在保存草稿"],
  ["Success", "草稿已保存"],
];
for (const [key, title] of cases)
  for (const theme of ["Light", "Dark"]) {
    const s = shell("State-" + key, title, "内容中心", theme);
    s.root.name = "Web/States/" + theme + "/" + key;
    position(s.root, ix++);
    if (key === "Offline") {
      notice(
        s.body,
        "离线状态",
        "当前显示已载入内容；联网前不能执行写入。",
        1152,
        "Warning",
      );
      instance(s.body, "KnowledgeTable");
    } else if (["Validation", "Conflict", "Busy", "Success"].includes(key)) {
      if (key === "Conflict")
        notice(
          s.body,
          "发现更新版本",
          "你的输入仍保留。先查看最新版本，再决定如何修订，不会静默覆盖。",
          1152,
          "Warning",
        );
      const c = card(s.body, "胎儿生长测量说明 · 草稿", 1152);
      field(
        c,
        "标题",
        key === "Validation" ? "" : "胎儿生长测量说明",
        1104,
        key === "Validation" ? "Error" : "Default",
      );
      field(c, "依据说明", "核对原始来源与双表达一致性", 1104);
      const a = row(c, "Actions", 1104);
      const b = button(
        a,
        key === "Busy"
          ? "保存中…"
          : key === "Conflict"
            ? "查看最新版本"
            : "保存草稿",
        key === "Busy" ? "Busy" : "Primary",
        176,
      );
      bindLink(b, key === "Conflict" ? "W08" : "W07");
      if (key === "Success") instance(s.body, "Toast");
    } else {
      const values = {
        Loading: ["正在载入…", "请稍候，页面布局保持稳定。"],
        Empty: ["还没有知识内容", "创建第一份草稿，填写双表达与来源。"],
        NoResults: [
          "没有匹配结果",
          "服务端搜索就绪后的状态示例；清除条件再试。",
        ],
        Error: ["暂时无法加载内容", "请检查网络后重试，已有编辑输入会保留。"],
        403: ["你没有此操作权限", "请返回有权限的页面，或联系账号管理员。"],
        404: ["内容不存在或已不可访问", "请返回知识内容重新选择。"],
        Expired: ["请重新登录", "重新登录后将重新检查权限和版本。"],
      }[key];
      instance(s.body, "EmptyState", { Title: values[0], Body: values[1] });
      const b = button(
        s.body,
        key === "Expired"
          ? "重新登录"
          : key === "Error"
            ? "重新加载"
            : key === "NoResults"
              ? "清除条件"
              : "返回知识内容",
        "Secondary",
        176,
      );
      bindLink(b, key === "Expired" ? "W01" : "W05");
    }
    created.push(evidence(s.root));
  }
for (const [k, title, body, action] of [
  [
    "Publish",
    "发布此版本？",
    "此操作更新管理库。App 内容分发尚未接通。",
    "发布",
  ],
  [
    "Withdraw",
    "下架当前版本？",
    "将清空管理库当前发布指针；历史保留，不代表App缓存已撤回。",
    "下架",
  ],
  [
    "Approve",
    "批准此版本？",
    "请确认专业/白话、引用和依据均已完成核对；不能审核自己的版本。",
    "批准",
  ],
  [
    "Leave",
    "离开编辑页面？",
    "尚有未保存修改，可以继续编辑或放弃本次修改。",
    "放弃修改",
  ],
])
  for (const theme of ["Light", "Dark"]) {
    const s = shell("Confirm-" + k, "知识内容", "内容中心", theme);
    s.root.name = "Web/Confirm/" + theme + "/" + k;
    position(s.root, ix++);
    instance(s.body, "KnowledgeTable");
    const overlay = box(
      s.root,
      "Modal overlay",
      1440,
      "HORIZONTAL",
      "glass-fallback",
      40,
      16,
    );
    overlay.layoutPositioning = "ABSOLUTE";
    overlay.x = 0;
    overlay.y = 0;
    overlay.resize(1440, 900);
    overlay.layoutSizingVertical = "FIXED";
    overlay.primaryAxisAlignItems = "CENTER";
    overlay.counterAxisAlignItems = "CENTER";
    const d = instance(overlay, "ConfirmDialog", { Title: title, Body: body });
    const bs = d.findAll(
      (n) => n.type === "INSTANCE" && n.name.startsWith("Style="),
    );
    if (bs[1]) setText(bs[1], { Label: action });
    bindLink(bs[0] ?? d, "close");
    if (bs[1]) bindLink(bs[1], k === "Leave" ? "W05" : "W08");
    created.push(evidence(s.root));
  }
for (const theme of ["Light", "Dark"]) {
  const s = shell("Controls", "筛选与反馈展开态", "内容中心", theme);
  s.root.name = "Web/States/" + theme + "/ControlsOpen";
  position(s.root, ix++);
  const r = row(s.body, "Open controls", 1152, 24);
  instance(r, "SelectMenu");
  instance(r, "DateRangePopover");
  instance(r, "Toast");
  created.push(evidence(s.root));
}
// 小屏布局单独组合，不直接缩放桌面文字。
for (const theme of ["Light", "Dark"]) {
  const root = box(
    page,
    "Web/W01/" + theme + "/390",
    390,
    "VERTICAL",
    null,
    16,
    24,
  );
  root.resize(390, 844);
  root.layoutSizingVertical = "FIXED";
  root.fills = [
    gradient(["bg-gradientStart", "bg-gradientMid", "bg-gradientEnd"]),
  ];
  root.setExplicitVariableModeForCollection(tc, modeIds[theme]);
  text(root, "春雨孕算", "Title", "primary");
  const f = card(root, "登录管理工作台", 358);
  field(f, "用户名", "请输入用户名", 310);
  field(f, "密码", "••••••••••••", 310);
  const b = button(f, "登录", "Primary", 310);
  bindLink(b, "W02");
  root.x = (ix % 2) * 1560;
  root.y = Math.floor(ix++ / 2) * 1680;
  created.push(evidence(root));
}
const wide = shell("W05", "知识内容", "内容中心", "Light", 1280, 720);
wide.root.name = "Web/W05/Light/1280";
position(wide.root, ix++);
const viewport = box(
  wide.body,
  "Table horizontal scroll",
  992,
  "HORIZONTAL",
  null,
  0,
  4,
);
viewport.resize(992, 490);
viewport.layoutSizingVertical = "FIXED";
viewport.clipsContent = true;
viewport.overflowDirection = "HORIZONTAL";
instance(viewport, "KnowledgeTable");
created.push(evidence(wide.root));
const narrow = box(page, "Web/W10/Light/768", 768, "VERTICAL", null, 24, 24);
narrow.fills = [
  gradient(["bg-gradientStart", "bg-gradientMid", "bg-gradientEnd"]),
];
narrow.setExplicitVariableModeForCollection(tc, modeIds.Light);
const top = row(narrow, "Compact header", 720);
button(top, "导航菜单", "Secondary", 120);
text(top, "春雨孕算 / 审核", "Heading", "primary");
text(narrow, "审核知识版本", "Title");
for (const [label, copy] of [
  ["专业表达", "按报告记录日期、孕周、单位和原始数值，保留来源与参考标准。"],
  ["白话表达", "先核对报告日期和数字的单位，再结合复查记录了解变化。"],
]) {
  const c = card(narrow, label, 720);
  text(c, copy, "Reading", "text-primary", 672);
}
field(narrow, "审核意见", "请填写核对结果", 720);
const acts = row(narrow, "Review actions", 720);
button(acts, "驳回", "Secondary");
button(acts, "批准");
narrow.resize(768, 1000);
narrow.layoutSizingVertical = "FIXED";
position(narrow, ix++);
created.push(evidence(narrow));
return { screens: created, count: created.length };
