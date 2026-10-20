const created = [];
let ix = 0;
for (const [id, title] of [
  ["W01", "登录管理工作台"],
  ["W12", "管理员"],
  ["W13", "新建管理员"],
  ["W14", "编辑管理员"],
  ["W15", "角色权限"],
  ["W16", "操作审计"],
  ["W17", "系统能力"],
  ["W18", "修改密码"],
])
  for (const theme of ["Light", "Dark"]) {
    let s;
    if (id === "W01") {
      const root = box(
        page,
        "Web/W01/" + theme + "/Default",
        1440,
        "HORIZONTAL",
        null,
        40,
        40,
      );
      root.resize(1440, 900);
      root.layoutSizingVertical = "FIXED";
      root.primaryAxisAlignItems = "CENTER";
      root.counterAxisAlignItems = "CENTER";
      root.fills = [
        gradient(["bg-gradientStart", "bg-gradientMid", "bg-gradientEnd"]),
      ];
      root.setExplicitVariableModeForCollection(tc, modeIds[theme]);
      const brand = box(root, "Brand", 600, "VERTICAL", null, 0, 24);
      const logo = text(brand, "春雨孕算", "Title", "primary");
      logo.fontSize = 48;
      logo.lineHeight = { unit: "PIXELS", value: 64 };
      text(brand, "同一份内容，更清楚地维护。", "Title", "text-primary", 600);
      text(
        brand,
        "专业与白话双表达\n独立审核与发布\n来源和版本可追溯",
        "Reading",
        "text-secondary",
        560,
      );
      const pane = card(root, "登录管理工作台", 480);
      text(pane, "使用分配给你的管理员账号登录", "Body", "text-secondary", 432);
      field(pane, "用户名", "请输入用户名", 432);
      field(pane, "密码", "••••••••••••     显示", 432);
      const b = button(pane, "登录", "Primary", 432);
      bindLink(b, "W02");
      text(
        pane,
        "管理员账号与 App 用户账号相互独立",
        "Caption",
        "text-tertiary",
        432,
      );
      s = { root };
    } else {
      s = shell(
        id,
        title,
        "系统管理",
        theme,
        1440,
        ["W13", "W14", "W18"].includes(id) ? 1100 : 1000,
      );
      if (id === "W12") {
        const b = button(s.header, "新建管理员", "Primary", 152);
        bindLink(b, "W13");
        instance(s.body, "OperatorsTable");
      }
      if (id === "W13" || id === "W14") {
        const f = card(s.body, id === "W13" ? "账号信息" : "账号与角色", 1152);
        field(
          f,
          "用户名",
          id === "W13" ? "请输入唯一用户名" : "content_editor",
          1104,
          id === "W14" ? "ReadOnly" : "Default",
        );
        field(f, "显示名", "内容编辑", 1104);
        if (id === "W13")
          field(f, "初始密码", "至少12字符，UTF-8不超过72字节", 1104);
        const roles = row(f, "Role selection", 1104);
        text(roles, "预置角色", "Label", "text-primary", 160);
        badge(roles, "内容编辑");
        badge(roles, "审核人员", "Neutral");
        badge(roles, "发布人员", "Neutral");
        badge(roles, "安全管理员", "Neutral");
        if (id === "W14") {
          field(f, "账号状态", "启用", 1104);
          notice(
            s.body,
            "角色与状态变化会撤销目标账号会话",
            "最后一名安全管理员受到保护；具体阻止原因由服务端返回。",
            1152,
            "Warning",
          );
          const reset = card(s.body, "重置密码", 1152);
          text(reset, "重置与普通资料保存分开处理。", "Body", "text-secondary");
          button(reset, "重置密码", "Secondary", 152);
        }
        const a = row(s.body, "Actions", 1152);
        const cancel = button(a, "取消", "Secondary");
        bindLink(cancel, "W12");
        const save = button(a, id === "W13" ? "创建管理员" : "保存修改");
        bindLink(save, "W12");
      }
      if (id === "W15") {
        const c = card(s.body, "预置角色与权限", 1152);
        text(
          c,
          "角色只读，不在这里新增角色或编辑权限码。",
          "Body",
          "text-secondary",
        );
        for (const [label, code, scope] of [
          [
            "安全管理员",
            "security_admin",
            "operator:read · operator:manage · audit:read",
          ],
          ["内容编辑", "content_editor", "knowledge:read · knowledge:edit"],
          [
            "内容审核",
            "clinical_reviewer",
            "knowledge:read · knowledge:review",
          ],
          ["发布人员", "publisher", "knowledge:read · knowledge:publish"],
        ]) {
          const r = box(c, label, 1104, "VERTICAL", "glass-fallback", 16, 8);
          text(r, label + "  " + code, "Label");
          text(r, scope, "Body", "text-secondary", 1072);
        }
      }
      if (id === "W16") {
        instance(s.body, "AuditsTable");
        text(
          s.body,
          "只读审计 · 复制标识不会回显到通知正文",
          "Caption",
          "text-secondary",
        );
      }
      if (id === "W17") {
        notice(
          s.body,
          "能力清单不等于运行健康",
          "这里不推断数据库、Redis 的在线状态或响应耗时。",
          1152,
        );
        instance(s.body, "CapabilityPanel");
      }
      if (id === "W18") {
        const f = card(s.body, "修改登录密码", 680);
        field(f, "旧密码", "••••••••••••", 632);
        field(f, "新密码", "至少12字符，UTF-8不超过72字节", 632);
        field(f, "确认新密码", "请再次输入新密码", 632);
        text(
          f,
          "修改成功后撤销当前会话，请重新登录。",
          "Body",
          "text-secondary",
          632,
        );
        const b = button(f, "修改密码", "Primary", 152);
        bindLink(b, "W01");
      }
    }
    position(s.root, ix++);
    created.push(evidence(s.root));
  }
return { screens: created, count: created.length };
