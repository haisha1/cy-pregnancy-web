// use_figma 共用构建函数。页面和组件只消费变量/样式，不另建色板。
const page = await figma.getNodeByIdAsync(PAGE_ID);
await figma.setCurrentPageAsync(page);
await Promise.all(
  ["Regular", "Medium", "Bold"].map((style) =>
    figma.loadFontAsync({ family: "Noto Sans SC", style }),
  ),
);
const allVars = await figma.variables.getLocalVariablesAsync();
const V = Object.fromEntries(allVars.map((v) => [v.name, v]));
const allStyles = await figma.getLocalTextStylesAsync();
const TS = Object.fromEntries(
  allStyles.map((s) => [s.name.split("/").at(-1), s]),
);
const effect = (await figma.getLocalEffectStylesAsync()).find(
  (s) => s.name === "Cy/Glass",
);
const tc = (await figma.variables.getLocalVariableCollectionsAsync()).find(
  (c) => c.name === "Theme",
);
const modeIds = Object.fromEntries(tc.modes.map((m) => [m.name, m.modeId]));
function paint(key) {
  return figma.variables.setBoundVariableForPaint(
    { type: "SOLID", color: { r: 0, g: 0, b: 0 } },
    "color",
    V[key],
  );
}
function fill(n, key) {
  n.fills = [paint(key)];
}
function radius(n, key = "card") {
  n.setBoundVariable("cornerRadius", V["radius/" + key]);
}
function pad(n, size) {
  for (const k of [
    "paddingTop",
    "paddingBottom",
    "paddingLeft",
    "paddingRight",
  ])
    n.setBoundVariable(k, V["space/" + size]);
}
function gap(n, size) {
  n.setBoundVariable("itemSpacing", V["space/" + size]);
}
function gradient(keys) {
  return {
    type: "GRADIENT_LINEAR",
    gradientTransform: [
      [0.8, 0.5, -0.1],
      [-0.5, 0.8, 0.3],
    ],
    gradientStops: keys.map((k, i) => ({
      position: i / (keys.length - 1),
      color: { r: 0.5, g: 0.6, b: 1, a: 1 },
      boundVariables: { color: { type: "VARIABLE_ALIAS", id: V[k].id } },
    })),
  };
}
function text(parent, chars, style = "Body", color = "text-primary", width) {
  const n = figma.createText();
  n.name = chars.slice(0, 30);
  n.fontName = { family: "Noto Sans SC", style: "Regular" };
  n.characters = chars;
  n.textStyleId = TS[style].id;
  fill(n, color);
  parent.appendChild(n);
  if (width) {
    n.resize(width, 24);
    n.textAutoResize = "HEIGHT";
  } else n.textAutoResize = "WIDTH_AND_HEIGHT";
  return n;
}
function box(
  parent,
  name,
  w,
  dir = "VERTICAL",
  surface = null,
  padding = 0,
  spacing = 16,
) {
  const n = figma.createAutoLayout(dir);
  n.name = name;
  n.resize(w, 10);
  n.primaryAxisSizingMode = dir === "VERTICAL" ? "AUTO" : "FIXED";
  n.counterAxisSizingMode = dir === "VERTICAL" ? "FIXED" : "AUTO";
  n.fills = [];
  n.clipsContent = false;
  if (padding) pad(n, padding);
  gap(n, spacing);
  if (surface) {
    fill(n, surface);
    radius(n);
    n.strokes = [paint("glass-stroke")];
    n.strokeWeight = 1;
    n.effectStyleId = effect.id;
  }
  parent.appendChild(n);
  return n;
}
function row(parent, name, w, g = 12) {
  const n = box(parent, name, w, "HORIZONTAL", null, 0, g);
  n.counterAxisAlignItems = "CENTER";
  return n;
}
function prop(c, t, name, value) {
  const k = c.addComponentProperty(name, "TEXT", value);
  t.componentPropertyReferences = { characters: k };
  return k;
}
function setText(inst, values) {
  const p = {};
  for (const [k, v] of Object.entries(values)) {
    const full = Object.keys(inst.componentProperties).find(
      (x) => x.split("#")[0] === k,
    );
    if (full) p[full] = String(v);
  }
  if (Object.keys(p).length) inst.setProperties(p);
  return inst;
}
const C = {};
if (typeof COMPONENT_IDS !== "undefined")
  for (const [name, id] of Object.entries(COMPONENT_IDS))
    C[name] = await figma.getNodeByIdAsync(id);
function instance(parent, name, values = {}, width) {
  const comp = C[name];
  if (!comp) throw Error("missing component " + name);
  const n = comp.createInstance();
  parent.appendChild(n);
  setText(n, values);
  if (width) n.resize(width, n.height);
  return n;
}
function button(parent, label, intent = "Primary", width = 128) {
  return instance(parent, "Button/" + intent, { Label: label }, width);
}
function field(parent, label, value, width = 490, state = "Default") {
  return instance(
    parent,
    "Field/" + state,
    {
      Label: label,
      Value: value,
      Help: state === "Error" ? "请核对必填内容后重试" : " ",
    },
    width,
  );
}
function badge(parent, label, tone = "Info") {
  return instance(parent, "Badge/" + tone, { Label: label });
}
function notice(parent, title, body, width = 1096, tone = "Info") {
  return instance(
    parent,
    "Notice/" + tone,
    { Title: title, Body: body },
    width,
  );
}
function card(parent, title, w, caption) {
  const n = box(parent, title, w, "VERTICAL", "glass-fillStrong", 24, 16);
  if (title) text(n, title, "Heading");
  if (caption) text(n, caption, "Caption", "text-secondary", w - 48);
  return n;
}
function bindLink(node, key) {
  node.name = "Link:" + key;
}
function shell(id, title, module, theme = "Light", w = 1440, h = 900) {
  const root = box(
    page,
    "Web/" + id + "/" + theme + "/Default",
    w,
    "HORIZONTAL",
    null,
    16,
    24,
  );
  root.resize(w, h);
  root.layoutSizingVertical = "FIXED";
  root.setExplicitVariableModeForCollection(tc, modeIds[theme]);
  root.fills = [
    gradient(["bg-gradientStart", "bg-gradientMid", "bg-gradientEnd"]),
  ];
  root.clipsContent = true;
  const nav = instance(
    root,
    "Sidebar/" +
      ({
        内容中心: "Content",
        审核发布: "Review",
        系统管理: "System",
        工作台: "Overview",
        用户管理: "Users",
      }[module] || "Overview"),
    {},
    232,
  );
  nav.resize(232, h - 32);
  const main = box(root, "Main", w - 288, "VERTICAL", null, 0, 24);
  const top = row(main, "Topbar", w - 288);
  text(top, "管理工作台  /  " + module, "Caption", "text-secondary", w - 600);
  const themeBtn = button(
    top,
    theme === "Light" ? "浅色模式" : "深色模式",
    "Secondary",
    112,
  );
  bindLink(themeBtn, "theme");
  text(top, "内容团队", "Label", "text-secondary");
  const header = row(main, "Page header", w - 288);
  instance(
    header,
    "PageHeader",
    { Title: title, Subtitle: "春雨孕算 · " + module },
    w - 500,
  );
  const body = box(main, "Content", w - 288, "VERTICAL", null, 0, 16);
  return { root, main, body, header, width: w - 288 };
}
function position(root, index) {
  root.x = (index % 2) * 1560;
  root.y = Math.floor(index / 2) * 1680;
}
function evidence(root) {
  const nodes = root.findAll(() => true),
    types = {};
  for (const n of nodes) types[n.type] = (types[n.type] || 0) + 1;
  return {
    id: root.id,
    name: root.name,
    width: root.width,
    height: root.height,
    types,
    imageNodes: nodes
      .filter(
        (n) =>
          Array.isArray(n.fills) && n.fills.some((f) => f.type === "IMAGE"),
      )
      .map((n) => ({
        id: n.id,
        name: n.name,
        width: n.width,
        height: n.height,
      })),
    fonts: [
      ...new Set(
        nodes.filter((n) => n.type === "TEXT").map((n) => n.fontName.family),
      ),
    ],
  };
}
