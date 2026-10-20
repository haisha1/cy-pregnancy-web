const ids = {};
let py = 0;
function comp(
  name,
  w = 1152,
  dir = "VERTICAL",
  surface = "glass-fillStrong",
  padding = 24,
) {
  const c = figma.createComponent();
  c.name = "Cy/" + name;
  c.description =
    "管理端复用业务组件；双主题通过Theme继承，文字通过组件属性覆盖。";
  c.layoutMode = dir;
  c.resize(w, 100);
  c.primaryAxisSizingMode = "AUTO";
  c.counterAxisSizingMode = "FIXED";
  gap(c, 16);
  c.fills = [];
  if (padding) pad(c, padding);
  if (surface) {
    fill(c, surface);
    radius(c);
    c.strokes = [paint("glass-stroke")];
    c.effectStyleId = effect.id;
  }
  page.appendChild(c);
  c.x = 0;
  c.y = py;
  py += 800;
  ids[name] = c.id;
  C[name] = c;
  return c;
}
const header = comp("PageHeader", 940, "VERTICAL", null, 0);
gap(header, 4);
prop(header, text(header, "知识内容", "Title"), "Title", "知识内容");
prop(
  header,
  text(header, "维护内容、来源与版本记录", "Caption", "text-secondary"),
  "Subtitle",
  "维护内容、来源与版本记录",
);
const rowComp = comp("KnowledgeRow", 1104, "HORIZONTAL", null, 0);
rowComp.resize(1104, 60);
rowComp.primaryAxisSizingMode = "FIXED";
rowComp.counterAxisAlignItems = "CENTER";
gap(rowComp, 16);
const identity = box(rowComp, "Identity", 390, "VERTICAL", null, 0, 4);
prop(
  rowComp,
  text(identity, "胎儿生长测量说明", "Label"),
  "Title",
  "胎儿生长测量说明",
);
prop(
  rowComp,
  text(identity, "fetal-growth", "Caption", "text-tertiary"),
  "Slug",
  "fetal-growth",
);
prop(
  rowComp,
  text(rowComp, "生长", "Body", "text-secondary", 110),
  "Category",
  "生长",
);
prop(
  rowComp,
  text(rowComp, "v4", "Body", "text-secondary", 72),
  "Version",
  "v4",
);
badge(rowComp, "待审核");
prop(
  rowComp,
  text(rowComp, "非当前发布", "Caption", "text-secondary", 150),
  "Published",
  "非当前发布",
);
const detail = button(rowComp, "查看", "Ghost", 100);
bindLink(detail, "W08");
const knowledge = comp("KnowledgeTable");
const kh = row(knowledge, "Table header", 1104);
for (const [s, w] of [
  ["标题 / slug", 390],
  ["分类", 110],
  ["最新版本", 72],
  ["版本状态", 96],
  ["当前发布", 150],
  ["操作", 100],
])
  text(kh, s, "Caption", "text-secondary", w);
const samples = [
  ["胎儿生长测量说明", "fetal-growth", "生长", "v4"],
  ["羊水指数说明", "amniotic-fluid", "羊水", "v2"],
  ["多普勒测量记录", "doppler-record", "血流", "v3"],
  ["双胎随访说明", "twin-follow-up", "双胎", "v1"],
  ["检查日期与孕周", "exam-date", "孕周", "v2"],
];
for (const [s, slug, cat, v] of samples)
  instance(knowledge, "KnowledgeRow", {
    Title: s,
    Slug: slug,
    Category: cat,
    Version: v,
  });
instance(knowledge, "CursorPagination", {}, 1104);
for (const type of ["Operators", "Audits", "Users", "Queue"]) {
  const tab = comp(type + "Table");
  const cols =
    type === "Operators"
      ? ["用户名", "显示名", "状态", "角色", "操作"]
      : type === "Audits"
        ? ["发生时间", "操作人", "动作 / 资源", "结果", "requestId"]
        : type === "Users"
          ? ["匿名账号", "状态", "创建时间", "会话摘要", "操作"]
          : ["知识标题 / 版本", "分类", "状态", "作者标识", "操作"];
  const widths = [280, 180, 220, 220, 140];
  const hr = row(tab, "Table header", 1104);
  cols.forEach((t, i) => text(hr, t, "Caption", "text-secondary", widths[i]));
  for (let i = 0; i < 5; i++) {
    const r = row(tab, "Row " + (i + 1), 1104);
    r.resize(1104, 52);
    r.layoutSizingVertical = "FIXED";
    let vals =
      type === "Operators"
        ? [
            ["content_editor", "内容编辑", "启用", "内容编辑", "编辑"],
            ["clinical_review", "审核人员", "启用", "内容审核", "编辑"],
            ["publisher", "发布人员", "启用", "发布", "编辑"],
            ["security_admin", "安全管理员", "启用", "账号管理", "编辑"],
            ["content_editor_02", "内容编辑2", "停用", "内容编辑", "编辑"],
          ][i]
        : type === "Audits"
          ? [
              "2026-10-19 10:" + (20 + i),
              "操作者 #" + (i + 1),
              [
                "发布 / 知识v4",
                "批准 / 知识v3",
                "创建 / 知识v1",
                "修改 / 管理账号",
                "提交 / 知识v2",
              ][i],
              "成功",
              "3f8a…  复制",
            ]
          : type === "Users"
            ? [
                "用户 7df0…" + (i + 1),
                "启用",
                "2026-10-19 09:20",
                "待接口提供",
                "查看",
              ]
            : [
                samples[i][0] + " " + samples[i][3],
                samples[i][2],
                "待审核",
                "作者 7df0…",
                "开始审核",
              ];
    vals.forEach((val, j) => {
      if (j === 4 && type !== "Audits") {
        const b = button(r, val, "Ghost", widths[j]);
        bindLink(
          b,
          type === "Operators" ? "W14" : type === "Users" ? "W04" : "W10",
        );
      } else
        text(
          r,
          val,
          "Body",
          j === 3 ? "text-secondary" : "text-primary",
          widths[j],
        );
    });
  }
  instance(tab, "CursorPagination", {}, 1104);
}
for (const mode of ["Edit", "Read"]) {
  const c = comp("DualExpression/" + mode, 1152, "HORIZONTAL");
  const prose = ["专业表达", "白话表达"];
  for (let i = 0; i < 2; i++) {
    const col = box(c, prose[i], 544, "VERTICAL", null, 0, 12);
    text(col, prose[i], "Heading", "primary");
    const content = box(
      col,
      "Content",
      544,
      "VERTICAL",
      mode === "Edit" ? "glass-fallback" : null,
      mode === "Edit" ? 16 : 0,
      8,
    );
    radius(content, "input");
    const copy =
      i === 0
        ? "核对本次检查日期、孕周及测量单位。记录报告原始数值，并注明采用的参考标准与来源。不同检查时点与测量方法可能影响可比性，解释时需结合连续记录与临床信息。"
        : "先确认报告是哪一天做的、当时怀孕多少周，以及数字旁边的单位。按报告如实记录，复查时再一起看变化。单次测量不能独立代替医生的综合判断。";
    prop(
      c,
      text(
        content,
        copy,
        "Reading",
        "text-primary",
        mode === "Edit" ? 512 : 544,
      ),
      i === 0 ? "Pro" : "Plain",
      copy,
    );
    if (mode === "Edit")
      text(col, "纯文本 · 每项最多 20,000 字符", "Caption", "text-tertiary");
  }
}
const refs = comp("ReferenceEvidence");
text(refs, "引用来源与编写依据", "Heading");
prop(
  refs,
  text(
    refs,
    "[1] Hadlock et al. Estimation of fetal weight… 1985.\n[2] ISUOG Practice Guidelines: ultrasound assessment…",
    "Body",
    "text-secondary",
    1104,
  ),
  "References",
  "[1] Hadlock et al. Estimation of fetal weight… 1985.\n[2] ISUOG Practice Guidelines: ultrasound assessment…",
);
text(refs, "依据说明", "Label");
prop(
  refs,
  text(
    refs,
    "本条为内容结构示例。正式发布前由审核人员核对来源、适用范围和表述一致性，引用登记不等于临床认证。",
    "Body",
    "text-secondary",
    1104,
  ),
  "Evidence",
  "本条为内容结构示例。正式发布前由审核人员核对来源、适用范围和表述一致性，引用登记不等于临床认证。",
);
const review = comp("ReviewDecisionPanel");
text(review, "审核意见", "Heading");
field(
  review,
  "意见（批准与驳回均需填写）",
  "请填写来源核对结果和具体意见",
  1104,
);
const r = row(review, "Review actions", 1104);
const reject = button(r, "驳回", "Secondary");
bindLink(reject, "reject");
const approve = button(r, "批准", "Primary");
bindLink(approve, "approve");
text(r, "作者不可审核自己的版本", "Caption", "text-secondary");
const history = comp("VersionHistory");
text(history, "版本历史", "Heading");
for (const line of [
  "v4  待审核 · 非当前发布",
  "v3  已发布 · 当前发布",
  "v2  曾发布 · 非当前",
  "v1  已驳回 · 历史保留",
])
  text(history, line, "Body", "text-secondary");
const metric = comp("MetricCard", 340);
prop(
  metric,
  text(metric, "待审核", "Label", "text-secondary"),
  "Title",
  "待审核",
);
prop(metric, text(metric, "未接入", "Metric", "primary"), "Value", "未接入");
prop(
  metric,
  text(metric, "需要全量统计接口", "Caption", "text-tertiary"),
  "Meta",
  "需要全量统计接口",
);
const cap = comp("CapabilityPanel");
text(cap, "系统能力", "Heading");
text(
  cap,
  "能力清单表示是否已实现，不代表当前运行健康。",
  "Body",
  "text-secondary",
);
for (const [label, ready] of [
  ["管理员鉴权", true],
  ["账号与预置角色", true],
  ["知识版本与审核发布", true],
  ["操作审计", true],
  ["App 内容分发", false],
  ["模型发布与回滚", false],
]) {
  const r = row(cap, label, 1104);
  text(r, label, "Body", "text-primary", 900);
  badge(r, ready ? "已实现" : "未实现", ready ? "Info" : "Neutral");
}
const search = comp("SearchField", 420, "HORIZONTAL", null, 0);
field(search, "搜索标题（服务端接口待补）", "胎儿生长   ×", 420);
const menu = comp("SelectMenu", 240);
text(menu, "选择分类", "Label");
for (const label of ["全部分类", "孕周", "生长", "血流", "羊水", "双胎"])
  text(menu, label, "Body", label === "生长" ? "primary" : "text-secondary");
const calendar = comp("DateRangePopover", 360);
text(calendar, "2026年10月", "Heading");
text(
  calendar,
  "一    二    三    四    五    六    日",
  "Caption",
  "text-secondary",
);
for (const week of [
  "28   29   30    1     2     3     4",
  " 5    6    7     8     9    10    11",
  "12   13   14   15   16   17    18",
  "19   20   21   22   23   24    25",
  "26   27   28   29   30   31     1",
])
  text(calendar, week, "Body", "text-secondary");
text(calendar, "2026-10-01  至  2026-10-19", "Caption", "primary");
const toast = comp("Toast", 380);
text(toast, "草稿已保存", "Label", "success");
text(toast, "可以继续编辑，或提交审核。", "Body", "text-secondary");
return {
  components: ids,
  ids: Object.values(ids),
  count: Object.keys(ids).length,
  reuse: { tableRows: 5, buttons: true, fields: true },
  font: "Noto Sans SC",
};
