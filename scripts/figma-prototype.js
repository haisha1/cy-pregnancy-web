const map = {},
  copied = [];
let i = 0;
function placeClone(source, name) {
  const f = source.clone();
  page.appendChild(f);
  f.name = "Prototype/" + name;
  f.x = (i % 2) * 1560;
  f.y = Math.floor(i++ / 2) * 1680;
  copied.push(f.id);
  return f;
}
for (const info of MAIN_SCREENS) {
  const source = await figma.getNodeByIdAsync(info.id);
  const parts = info.name.split("/");
  const key = parts[1] + "/" + parts[2];
  map[key] = placeClone(source, key);
}
for (const info of STATE_SCREENS.filter(
  (s) => s.name.endsWith("/Success") || s.name.startsWith("Web/Confirm/"),
)) {
  const parts = info.name.split("/");
  const key =
    (parts[1] === "Confirm" ? "Confirm-" : "State-") +
    parts[3] +
    "/" +
    parts[2];
  map[key] = placeClone(await figma.getNodeByIdAsync(info.id), key);
}
for (const theme of ["Light", "Dark"]) {
  for (const [state, label] of [
    ["Draft", "草稿"],
    ["Approved", "已批准"],
    ["Published", "管理库已发布"],
    ["Withdrawn", "已下架"],
    ["Rejected", "已驳回"],
  ]) {
    const key = state + "/" + theme;
    const f = placeClone(map["W08/" + theme], key);
    map[key] = f;
    for (const n of f.findAllWithCriteria({ types: ["INSTANCE"] })) {
      const props = n.componentProperties;
      const labelKey = Object.keys(props).find(
        (k) => k.split("#")[0] === "Label",
      );
      if (labelKey && props[labelKey].value === "待审核") {
        n.swapComponent(
          C[
            "Badge/" +
              (["Approved", "Published"].includes(state)
                ? "Success"
                : state === "Rejected"
                  ? "Warning"
                  : "Info")
          ],
        );
        setText(n, { Label: label });
      }
      if (n.name === "Link:W10") {
        setText(n, {
          Label:
            state === "Draft"
              ? "编辑草稿"
              : state === "Approved"
                ? "发布"
                : state === "Published"
                  ? "下架"
                  : "新建修订",
        });
        bindLink(
          n,
          state === "Draft"
            ? "W07"
            : state === "Approved"
              ? "publish"
              : state === "Published"
                ? "withdraw"
                : "W07",
        );
      }
    }
  }
  for (const [k, title, body, action] of [
    [
      "Submit",
      "提交审核？",
      "送审后当前版本将只读，专业与白话将一起交由独立审核。",
      "提交审核",
    ],
    [
      "Reject",
      "驳回此版本？",
      "审核意见会随当前版本保留；后续修订需新建版本。",
      "驳回",
    ],
  ]) {
    const f = placeClone(
      map["Confirm-Approve/" + theme],
      "Confirm-" + k + "/" + theme,
    );
    map["Confirm-" + k + "/" + theme] = f;
    for (const n of f.findAllWithCriteria({ types: ["INSTANCE"] })) {
      if (
        Object.keys(n.componentProperties).some((p) =>
          p.startsWith("Title#"),
        ) &&
        n.componentProperties[
          Object.keys(n.componentProperties).find((p) => p.startsWith("Title#"))
        ]?.value === "批准此版本？"
      )
        setText(n, { Title: title, Body: body });
      if (n.name === "Link:W08") {
        setText(n, { Label: action });
        bindLink(n, k === "Submit" ? "submitted" : "rejected");
      }
    }
  }
}
const nav = {
  Overview: "W02",
  Content: "W05",
  Review: "W09",
  System: "W12",
  Users: "W03",
};
let linked = 0;
for (const [key, f] of Object.entries(map)) {
  const theme = key.split("/").at(-1);
  for (const node of f.findAll(
    (n) => n.type === "INSTANCE" && n.name.startsWith("Link:"),
  )) {
    const token = node.name.slice(5);
    let target;
    if (token.startsWith("nav:"))
      target = nav[token.split(":")[1]] + "/" + theme;
    else if (token === "theme")
      target = key.replace(
        /\/(Light|Dark)$/,
        theme === "Light" ? "/Dark" : "/Light",
      );
    else if (token === "saved") target = "State-Success/" + theme;
    else if (token === "submit") target = "Confirm-Submit/" + theme;
    else if (token === "approve") target = "Confirm-Approve/" + theme;
    else if (token === "reject") target = "Confirm-Reject/" + theme;
    else if (token === "publish") target = "Confirm-Publish/" + theme;
    else if (token === "withdraw") target = "Confirm-Withdraw/" + theme;
    else if (token === "submitted") target = "W08/" + theme;
    else if (token === "rejected") target = "Rejected/" + theme;
    else if (token === "close")
      target =
        (key.startsWith("Confirm-Approve") || key.startsWith("Confirm-Reject")
          ? "W10"
          : "W08") +
        "/" +
        theme;
    else if (token === "W08" && key.startsWith("W06"))
      target = "Draft/" + theme;
    else if (token === "W08" && key.startsWith("Confirm-Approve"))
      target = "Approved/" + theme;
    else if (token === "W08" && key.startsWith("Confirm-Publish"))
      target = "Published/" + theme;
    else if (token === "W08" && key.startsWith("Confirm-Withdraw"))
      target = "Withdrawn/" + theme;
    else target = token + "/" + theme;
    if (map[target] && map[target].id !== f.id) {
      await node.setReactionsAsync([
        {
          trigger: { type: "ON_CLICK" },
          actions: [
            {
              type: "NODE",
              destinationId: map[target].id,
              navigation: "NAVIGATE",
              transition: null,
              preserveScrollPosition: false,
            },
          ],
        },
      ]);
      linked++;
    }
  }
}
return {
  frames: Object.fromEntries(Object.entries(map).map(([k, v]) => [k, v.id])),
  createdNodeIds: copied,
  count: copied.length,
  connections: linked,
  start: map["W01/Light"].id,
  overview: map["W02/Light"].id,
};
