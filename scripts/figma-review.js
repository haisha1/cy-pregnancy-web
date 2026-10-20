const created = [];
let ix = 0;
for (const [id, title] of [
  ["W09", "审核工作台"],
  ["W10", "审核知识版本"],
  ["W11", "发布中心"],
])
  for (const theme of ["Light", "Dark"]) {
    const s = shell(
      id,
      title,
      "审核发布",
      theme,
      1440,
      id === "W10" ? 1240 : 1000,
    );
    position(s.root, ix++);
    if (id === "W09") {
      notice(
        s.body,
        "全量队列 · 接口待补",
        "此稿展示后续队列结构。现阶段可从知识版本详情进入单条审核，不用当前分页伪造全量队列。",
        1152,
      );
      instance(s.body, "QueueTable");
    }
    if (id === "W10") {
      const meta = card(s.body, "胎儿生长测量说明 · v4", 1152);
      const r = row(meta, "Identity", 1104);
      text(
        r,
        "作者 7df0…  ·  当前版本非本人提交",
        "Body",
        "text-secondary",
        820,
      );
      badge(r, "待审核");
      instance(s.body, "DualExpression/Read");
      instance(s.body, "ReferenceEvidence");
      instance(s.body, "ReviewDecisionPanel");
      const back = button(s.body, "返回版本详情", "Secondary", 176);
      bindLink(back, "W08");
    }
    if (id === "W11") {
      notice(
        s.body,
        "管理库发布",
        "内容分发尚未接通。这里的发布与下架不代表 App 已更新或缓存已撤回。",
        1152,
        "Warning",
      );
      const r = row(s.body, "Release views", 1152);
      badge(r, "待发布");
      badge(r, "当前发布", "Neutral");
      const c = card(s.body, "胎儿生长测量说明", 1152);
      text(c, "v4 · 已批准 · 非当前发布", "Body", "text-secondary");
      text(
        c,
        "全量发布队列依赖新增接口。此处为设计样例，不表示当前有待发布任务。",
        "Body",
        "text-secondary",
        1104,
      );
      const actions = row(c, "Release actions", 1104);
      const preview = button(actions, "查看版本", "Secondary");
      bindLink(preview, "W08");
      const publish = button(actions, "发布", "Primary");
      bindLink(publish, "publish");
      const c2 = card(s.body, "羊水指数说明", 1152);
      text(c2, "v2 · 管理库当前发布", "Body", "text-secondary");
      const withdraw = button(c2, "下架", "Secondary");
      bindLink(withdraw, "withdraw");
    }
    created.push(evidence(s.root));
  }
return { screens: created, count: created.length };
