// 已按 createComponentWithVariants 帮助脚本的“组合后定位”模式组织。
const ids = {},
  sets = [];
let cursorY = 0;
function component(
  name,
  w,
  dir = "HORIZONTAL",
  surface = null,
  padding = 0,
  spacing = 8,
) {
  const c = figma.createComponent();
  c.name = name;
  c.layoutMode = dir;
  c.resize(w, 40);
  c.primaryAxisSizingMode = "AUTO";
  c.counterAxisSizingMode = "FIXED";
  c.fills = [];
  gap(c, spacing);
  if (padding) pad(c, padding);
  if (surface) {
    fill(c, surface);
    radius(c);
  }
  page.appendChild(c);
  return c;
}
function variants(name, items) {
  const cs = figma.combineAsVariants(
    items.map((i) => i.node),
    page,
  );
  cs.name = "Cy/" + name;
  cs.description =
    "春雨孕算管理端公共组件。继承App主题；页面通过实例和属性复用。";
  cs.x = 0;
  cs.y = cursorY;
  let x = 24,
    y = 48,
    maxH = 0,
    maxW = 0;
  items.forEach((item, i) => {
    if (i && i % 3 === 0) {
      x = 24;
      y += maxH + 24;
      maxH = 0;
    }
    item.node.x = x;
    item.node.y = y;
    maxH = Math.max(maxH, item.node.height);
    x += item.node.width + 24;
    maxW = Math.max(maxW, x);
    ids[name + "/" + item.key] = item.node.id;
  });
  cs.resize(Math.max(maxW, 400), y + maxH + 24);
  cursorY += cs.height + 100;
  sets.push({ id: cs.id, name: cs.name, variants: items.length });
  return cs;
}
variants(
  "Button",
  ["Primary", "Secondary", "Ghost", "Danger", "Busy", "Disabled"].map(
    (kind) => {
      const c = component("Style=" + kind, 152);
      c.counterAxisAlignItems = "CENTER";
      c.primaryAxisAlignItems = "CENTER";
      c.resize(152, 40);
      c.primaryAxisSizingMode = "FIXED";
      radius(c, "button");
      c.setBoundVariable("height", V["desktop/control"]);
      if (kind === "Primary" || kind === "Busy")
        c.fills = [gradient(["action-start", "action-end"])];
      else if (kind === "Danger") fill(c, "danger");
      else if (kind !== "Ghost") fill(c, "glass-fillStrong");
      if (kind === "Secondary") {
        c.strokes = [paint("grid")];
        c.strokeWeight = 1;
      }
      if (kind === "Disabled") c.opacity = 0.5;
      const t = text(
        c,
        kind === "Busy" ? "保存中…" : "保存草稿",
        "Label",
        ["Primary", "Danger", "Busy"].includes(kind)
          ? "text-inverse"
          : "primary",
      );
      prop(c, t, "Label", t.characters);
      return { key: kind, node: c };
    },
  ),
);
variants(
  "Field",
  ["Default", "Focused", "Error", "Disabled", "ReadOnly"].map((state) => {
    const c = component("State=" + state, 490, "VERTICAL", null, 0, 8);
    prop(c, text(c, "字段名称", "Label"), "Label", "字段名称");
    const input = box(c, "Input", 490, "HORIZONTAL", "glass-fillStrong", 12, 8);
    radius(input, "input");
    input.resize(490, 44);
    input.layoutSizingVertical = "FIXED";
    input.counterAxisAlignItems = "CENTER";
    input.strokes = [
      paint(
        state === "Error" ? "danger" : state === "Focused" ? "primary" : "grid",
      ),
    ];
    input.strokeWeight = state === "Focused" ? 2 : 1;
    prop(
      c,
      text(input, "请输入内容", "Body", "text-secondary", 450),
      "Value",
      "请输入内容",
    );
    const help = text(
      c,
      state === "Error" ? "请核对必填内容后重试" : " ",
      "Caption",
      state === "Error" ? "danger" : "text-tertiary",
      490,
    );
    prop(c, help, "Help", help.characters);
    if (state === "Disabled") c.opacity = 0.5;
    return { key: state, node: c };
  }),
);
variants(
  "Badge",
  ["Info", "Success", "Warning", "Danger", "Neutral"].map((tone) => {
    const c = component(
      "Tone=" + tone,
      96,
      "HORIZONTAL",
      tone === "Warning"
        ? "warning-tint"
        : tone === "Danger"
          ? "danger-tint"
          : "tint-blue",
      8,
    );
    radius(c, "tag");
    c.counterAxisAlignItems = "CENTER";
    c.primaryAxisAlignItems = "CENTER";
    const t = text(
      c,
      {
        Info: "待审核",
        Success: "已批准",
        Warning: "已驳回",
        Danger: "已停用",
        Neutral: "未接入",
      }[tone],
      "Caption",
      {
        Info: "primary",
        Success: "success",
        Warning: "warning",
        Danger: "danger",
        Neutral: "text-secondary",
      }[tone],
    );
    prop(c, t, "Label", t.characters);
    return { key: tone, node: c };
  }),
);
variants(
  "Notice",
  ["Info", "Warning", "Danger"].map((tone) => {
    const c = component(
      "Tone=" + tone,
      1096,
      "VERTICAL",
      tone === "Warning"
        ? "warning-tint"
        : tone === "Danger"
          ? "danger-tint"
          : "tint-blue",
      16,
      4,
    );
    const color =
      tone === "Warning" ? "warning" : tone === "Danger" ? "danger" : "primary";
    prop(c, text(c, "使用说明", "Label", color), "Title", "使用说明");
    prop(
      c,
      text(
        c,
        "管理库发布与 App 内容分发是不同流程。",
        "Body",
        "text-secondary",
        1064,
      ),
      "Body",
      "管理库发布与 App 内容分发是不同流程。",
    );
    return { key: tone, node: c };
  }),
);
variants(
  "NavItem",
  ["Default", "Selected", "Disabled"].map((state) => {
    const c = component(
      "State=" + state,
      192,
      "HORIZONTAL",
      state === "Selected" ? "tint-blue" : null,
      12,
      12,
    );
    radius(c, "input");
    c.resize(192, 46);
    c.primaryAxisSizingMode = "FIXED";
    c.counterAxisAlignItems = "CENTER";
    const mark = figma.createEllipse();
    mark.resize(6, 6);
    fill(mark, state === "Selected" ? "primary" : "text-tertiary");
    c.appendChild(mark);
    prop(
      c,
      text(
        c,
        "知识内容",
        "Label",
        state === "Selected" ? "primary" : "text-secondary",
      ),
      "Label",
      "知识内容",
    );
    if (state === "Disabled") c.opacity = 0.5;
    return { key: state, node: c };
  }),
);
variants(
  "GlassCard",
  ["Default", "Strong"].map((s) => {
    const c = component(
      "Surface=" + s,
      330,
      "VERTICAL",
      s === "Strong" ? "glass-fillStrong" : "glass-fill",
      24,
      12,
    );
    c.effectStyleId = effect.id;
    c.strokes = [paint("glass-stroke")];
    prop(c, text(c, "知识内容", "Heading"), "Title", "知识内容");
    prop(
      c,
      text(
        c,
        "维护双表达与真实来源，所有版本可追溯。",
        "Body",
        "text-secondary",
        282,
      ),
      "Body",
      "维护双表达与真实来源，所有版本可追溯。",
    );
    return { key: s, node: c };
  }),
);
variants(
  "Select",
  ["Default", "Focused", "Disabled"].map((s) => {
    const c = component(
      "State=" + s,
      240,
      "HORIZONTAL",
      "glass-fillStrong",
      12,
      8,
    );
    radius(c, "input");
    c.resize(240, 40);
    c.primaryAxisSizingMode = "FIXED";
    c.counterAxisAlignItems = "CENTER";
    prop(
      c,
      text(c, "全部分类", "Body", "text-secondary", 184),
      "Label",
      "全部分类",
    );
    text(c, "⌄", "Body", "primary");
    c.strokes = [paint(s === "Focused" ? "primary" : "grid")];
    if (s === "Disabled") c.opacity = 0.5;
    return { key: s, node: c };
  }),
);
// 组件实例会在业务库和页面中直接复用，禁止 detach。
for (const [n, id] of Object.entries(ids))
  C[n] = await figma.getNodeByIdAsync(id);
variants(
  "Sidebar",
  ["Overview", "Content", "Review", "System", "Users"].map((section) => {
    const c = component(
      "Section=" + section,
      232,
      "VERTICAL",
      "glass-fill",
      20,
      24,
    );
    c.resize(232, 868);
    c.primaryAxisSizingMode = "FIXED";
    c.strokes = [paint("glass-stroke")];
    c.effectStyleId = effect.id;
    const brand = box(c, "Brand", 192, "VERTICAL", null, 0, 8);
    text(brand, "春雨孕算", "Title", "primary");
    text(brand, "管理工作台", "Caption", "text-secondary");
    const nav = box(c, "Navigation", 192, "VERTICAL", null, 0, 8);
    for (const [key, label] of [
      ["Overview", "工作台"],
      ["Content", "知识内容"],
      ["Review", "审核发布"],
      ["Users", "用户管理"],
      ["System", "系统管理"],
    ]) {
      const comp = C["NavItem/" + (section === key ? "Selected" : "Default")];
      const inst = comp.createInstance();
      nav.appendChild(inst);
      setText(inst, { Label: label });
      bindLink(inst, "nav:" + key);
    }
    text(c, "内容有依据\n版本可追溯", "Caption", "text-tertiary", 192);
    return { key: section, node: c };
  }),
);
const pagination = component(
  "Cy/CursorPagination",
  1096,
  "HORIZONTAL",
  "glass-fillStrong",
  16,
  16,
);
button(pagination, "上一批", "Secondary", 100);
text(pagination, "每批 20 条 · 游标分页", "Caption", "text-secondary", 792);
button(pagination, "下一批", "Secondary", 100);
pagination.x = 0;
pagination.y = cursorY;
ids.CursorPagination = pagination.id;
cursorY += 140;
const empty = component(
  "Cy/EmptyState",
  1096,
  "VERTICAL",
  "glass-fillStrong",
  24,
  12,
);
empty.counterAxisAlignItems = "CENTER";
prop(
  empty,
  text(empty, "还没有知识内容", "Heading"),
  "Title",
  "还没有知识内容",
);
prop(
  empty,
  text(empty, "创建第一份草稿，填写双表达与来源。", "Body", "text-secondary"),
  "Body",
  "创建第一份草稿，填写双表达与来源。",
);
button(empty, "创建草稿");
empty.x = 0;
empty.y = cursorY;
ids.EmptyState = empty.id;
cursorY += 240;
const dialog = component(
  "Cy/ConfirmDialog",
  520,
  "VERTICAL",
  "glass-fillStrong",
  24,
  16,
);
prop(dialog, text(dialog, "发布此版本？", "Title"), "Title", "发布此版本？");
prop(
  dialog,
  text(
    dialog,
    "此操作更新管理库。App 内容分发尚未接通。",
    "Body",
    "text-secondary",
    472,
  ),
  "Body",
  "此操作更新管理库。App 内容分发尚未接通。",
);
const actions = row(dialog, "Actions", 472);
button(actions, "取消", "Secondary", 120);
button(actions, "发布", "Primary", 120);
dialog.x = 0;
dialog.y = cursorY;
ids.ConfirmDialog = dialog.id;
return {
  components: ids,
  sets,
  standalone: [pagination.id, empty.id, dialog.id],
  font: "Noto Sans SC",
  count: Object.keys(ids).length,
};
