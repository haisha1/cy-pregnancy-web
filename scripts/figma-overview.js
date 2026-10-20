const created = [];
let ix = 0;
for (const [id, title] of [
  ["W02", "工作台"],
  ["W03", "用户管理"],
  ["W04", "用户详情"],
])
  for (const theme of ["Light", "Dark"]) {
    const s = shell(
      id,
      title,
      id === "W02" ? "工作台" : "用户管理",
      theme,
      1440,
      1100,
    );
    position(s.root, ix++);
    if (id === "W02") {
      const hero = box(
        s.body,
        "Brand workspace card",
        1152,
        "VERTICAL",
        null,
        24,
        16,
      );
      hero.fills = [gradient(["hero-start", "hero-end"])];
      radius(hero);
      const inner = box(
        hero,
        "Readable brand content",
        700,
        "VERTICAL",
        "glass-fillStrong",
        20,
        12,
      );
      text(inner, "内容有依据，版本可追溯。", "Title", "text-primary");
      text(
        inner,
        "从一份草稿开始，让专业表达与白话表达一起审核。",
        "Body",
        "text-secondary",
        660,
      );
      const b = button(inner, "进入知识内容", "Primary", 176);
      bindLink(b, "W05");
      const cards = row(s.body, "Tasks", 1152, 16);
      for (const [title, body, key] of [
        ["维护知识", "创建和修订双表达内容", "W05"],
        ["独立审核", "核对来源、表述与版本", "W10"],
        ["账号与权限", "管理预置角色和账号", "W12"],
      ]) {
        const c = instance(
          cards,
          "GlassCard/Strong",
          { Title: title, Body: body },
          373,
        );
        bindLink(c, key);
      }
      instance(s.body, "CapabilityPanel");
      text(
        s.body,
        "统计总览与用户趋势等待聚合接口，不用零值或示意曲线替代。",
        "Caption",
        "text-secondary",
      );
    }
    if (id === "W03") {
      notice(
        s.body,
        "最小账号查询 · 接口待补",
        "仅查询授权的匿名账号资料，不展示孕期、超声报告或健康输入。下方是结构示例。",
        1152,
      );
      instance(s.body, "UsersTable");
    }
    if (id === "W04") {
      notice(
        s.body,
        "用户查询接口待补",
        "此页仅定义只读账号结构，样例不来自真实用户。",
        1152,
      );
      const c = card(s.body, "匿名账号 7df0…", 1152);
      for (const [label, value] of [
        ["账号状态", "启用"],
        ["创建时间", "接口提供后显示"],
        ["会话摘要", "接口提供后显示"],
        ["健康档案", "不在本管理范围展示"],
      ]) {
        const r = row(c, label, 1104);
        text(r, label, "Label", "text-secondary", 260);
        text(r, value, "Body", "text-primary", 820);
      }
      const b = button(s.body, "返回用户列表", "Secondary", 176);
      bindLink(b, "W03");
    }
    created.push(evidence(s.root));
  }
return { screens: created, count: created.length };
