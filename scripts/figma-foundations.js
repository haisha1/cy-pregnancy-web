// 在 use_figma 执行；CONFIG 与 createSemanticTokens 由本地编排注入。
const names = [
  "00-Cover",
  "01-Foundations",
  "02-Base Components",
  "03-Business Components",
  "04-Content",
  "05-Review & Release",
  "06-Account & System",
  "07-Overview & Users",
  "08-States & Responsive",
  "09-Interactive Prototype",
  "99-Dev Handoff",
];
const pages = {};
figma.root.children[0].name = names[0];
pages[names[0]] = figma.root.children[0].id;
for (const name of names.slice(1)) {
  const p = figma.createPage();
  p.name = name;
  pages[name] = p.id;
}
await figma.setCurrentPageAsync(
  await figma.getNodeByIdAsync(pages["01-Foundations"]),
);
await Promise.all(
  ["Regular", "Medium", "Bold"].map((style) =>
    figma.loadFontAsync({ family: "Noto Sans SC", style }),
  ),
);
const primitive = figma.variables.createVariableCollection("Primitives");
const theme = figma.variables.createVariableCollection("Theme");
theme.renameMode(theme.modes[0].modeId, "Light");
const modes = { Light: theme.modes[0].modeId, Dark: theme.addMode("Dark") };
const dimensions = figma.variables.createVariableCollection("Dimensions");
function rgba(value) {
  if (value.startsWith("#")) {
    const h = value.slice(1);
    return {
      r: parseInt(h.slice(0, 2), 16) / 255,
      g: parseInt(h.slice(2, 4), 16) / 255,
      b: parseInt(h.slice(4, 6), 16) / 255,
      a: 1,
    };
  }
  const n = value.match(/[\d.]+/g).map(Number);
  return { r: n[0] / 255, g: n[1] / 255, b: n[2] / 255, a: n[3] ?? 1 };
}
const vars = {};
for (const key of Object.keys(CONFIG.light)) {
  const aliases = {};
  for (const mode of ["Light", "Dark"]) {
    const v = figma.variables.createVariable(
      mode + "/" + key,
      primitive,
      "COLOR",
    );
    v.setValueForMode(
      primitive.defaultModeId,
      rgba(CONFIG[mode.toLowerCase()][key]),
    );
    v.scopes = [];
    v.setVariableCodeSyntax(
      "WEB",
      "var(--primitive-" + mode.toLowerCase() + "-" + key + ")",
    );
    aliases[mode] = { type: "VARIABLE_ALIAS", id: v.id };
  }
  const scopes = /text/.test(key)
    ? ["TEXT_FILL"]
    : /stroke|grid/.test(key)
      ? ["STROKE_COLOR", "FRAME_FILL", "SHAPE_FILL"]
      : ["FRAME_FILL", "SHAPE_FILL", "TEXT_FILL", "STROKE_COLOR"];
  const made = await createSemanticTokens(theme, modes, [
    {
      name: key,
      type: "COLOR",
      values: aliases,
      scopes,
      codeSyntax: { WEB: "var(--" + key + ")" },
    },
  ]);
  vars[key] = made.variables[key].id;
}
const dims = {
  "radius/tag": 8,
  "radius/input": 12,
  "radius/button": 16,
  "radius/card": 24,
  "space/4": 4,
  "space/8": 8,
  "space/12": 12,
  "space/16": 16,
  "space/20": 20,
  "space/24": 24,
  "space/32": 32,
  "space/40": 40,
  "desktop/control": 40,
  "desktop/sidebar": 232,
  "desktop/topbar": 64,
  "desktop/row": 52,
};
for (const [name, value] of Object.entries(dims)) {
  const v = figma.variables.createVariable(name, dimensions, "FLOAT");
  v.setValueForMode(dimensions.defaultModeId, value);
  v.scopes = name.startsWith("radius")
    ? ["CORNER_RADIUS"]
    : name.startsWith("space")
      ? ["GAP"]
      : ["WIDTH_HEIGHT"];
  v.setVariableCodeSyntax(
    "WEB",
    "var(--web-" + name.replaceAll("/", "-") + ")",
  );
  vars[name] = v.id;
}
const styles = {};
for (const [name, size, line, style] of [
  ["Title", 24, 32, "Bold"],
  ["Heading", 16, 24, "Bold"],
  ["Body", 14, 22, "Regular"],
  ["Label", 14, 22, "Medium"],
  ["Caption", 12, 18, "Regular"],
  ["Reading", 15, 26, "Regular"],
  ["Metric", 32, 40, "Bold"],
]) {
  const s = figma.createTextStyle();
  s.name = "Cy/" + name;
  s.fontName = { family: "Noto Sans SC", style };
  s.fontSize = size;
  s.lineHeight = { unit: "PIXELS", value: line };
  styles[name] = s.id;
}
const glass = figma.createEffectStyle();
glass.name = "Cy/Glass";
glass.effects = [
  { type: "BACKGROUND_BLUR", radius: 24, visible: true },
  {
    type: "DROP_SHADOW",
    color: { r: 0.078, g: 0.118, b: 0.235, a: 0.08 },
    offset: { x: 0, y: 8 },
    radius: 24,
    spread: 0,
    visible: true,
    blendMode: "NORMAL",
  },
];
styles.Glass = glass.id;
return {
  pages,
  collections: {
    theme: theme.id,
    primitive: primitive.id,
    dimensions: dimensions.id,
  },
  modes,
  variables: vars,
  styles,
  counts: {
    pages: names.length,
    primitives: 62,
    semantic: 31,
    dimensions: 16,
    textStyles: 7,
  },
};
