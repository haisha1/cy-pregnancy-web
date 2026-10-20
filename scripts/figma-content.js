const created = [];
let ix = 0;
for (const [id, title] of [
  ["W05", "知识内容"],
  ["W06", "新建知识"],
  ["W07", "编辑知识版本"],
  ["W08", "知识版本详情"],
])
  for (const theme of ["Light", "Dark"]) {
    const s = shell(
      id,
      title,
      "内容中心",
      theme,
      1440,
      id === "W05" ? 900 : id === "W08" ? 1280 : 1300,
    );
    position(s.root, ix++);
    if (id === "W05") {
      const b = button(s.header, "新建知识");
      bindLink(b, "W06");
      const intro = row(s.body, "Collection context", 1152);
      text(intro, "全部知识", "Heading", "text-primary", 820);
      badge(intro, "游标浏览", "Neutral");
      instance(s.body, "KnowledgeTable");
      text(
        s.body,
        "来源、专业表达与白话表达由同一内容版本维护。",
        "Caption",
        "text-secondary",
      );
    }
    if (id === "W06" || id === "W07") {
      const base = card(s.body, "基本信息", 1152);
      field(base, "标题", "胎儿生长测量说明", 1104);
      const r = row(base, "Metadata", 1104);
      if (id === "W06") field(r, "slug", "fetal-growth", 544);
      else field(r, "内容版本", "v4 · 草稿", 544, "ReadOnly");
      field(r, "分类", "生长", 544);
      instance(s.body, "DualExpression/Edit");
      instance(s.body, "ReferenceEvidence");
      const acts = box(
        s.body,
        "Sticky actions",
        1152,
        "HORIZONTAL",
        "glass-fillStrong",
        16,
        16,
      );
      const cancel = button(acts, "取消", "Secondary");
      bindLink(cancel, "W05");
      const save = button(acts, id === "W06" ? "创建草稿" : "保存草稿");
      bindLink(save, id === "W06" ? "W08" : "saved");
      if (id === "W07") {
        const submit = button(acts, "保存并提交审核", "Primary", 176);
        bindLink(submit, "submit");
      }
      text(
        acts,
        "未提交的内容只保留在当前编辑会话",
        "Caption",
        "text-secondary",
      );
    }
    if (id === "W08") {
      badge(s.header, "待审核");
      const identity = card(s.body, "胎儿生长测量说明", 1152);
      const r = row(identity, "Version status", 1104);
      text(
        r,
        "fetal-growth  /  v4  /  作者 7df0…",
        "Body",
        "text-secondary",
        800,
      );
      badge(r, "非当前发布", "Neutral");
      const actions = row(identity, "Allowed actions", 1104);
      const rev = button(actions, "开始审核");
      bindLink(rev, "W10");
      const newV = button(actions, "新建修订", "Secondary");
      bindLink(newV, "W07");
      instance(s.body, "DualExpression/Read");
      instance(s.body, "ReferenceEvidence");
      instance(s.body, "VersionHistory");
    }
    created.push(evidence(s.root));
  }
return { screens: created, count: created.length };
