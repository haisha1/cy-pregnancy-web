import {
  test,
  expect,
  type Page,
  type APIRequestContext,
} from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { readFileSync } from "node:fs";
import { writeFileSync, mkdirSync } from "node:fs";
const apiBase = process.env.ADMIN_URL || "http://127.0.0.1:18732/admin/api/v1";
const password = "E2e-fixture-password-2026!";
const suffix = Date.now().toString(36);
let token = "";
let version = "";
const accounts = [
  { username: "webedit_" + suffix, role: "content_editor", uuid: "" },
  { username: "webreview_" + suffix, role: "clinical_reviewer", uuid: "" },
  { username: "webpub_" + suffix, role: "publisher", uuid: "" },
];
async function call(
  request: APIRequestContext,
  path: string,
  body?: unknown,
  revision?: number,
  method = "POST",
) {
  const response = await request.fetch(apiBase + path, {
    method,
    headers: {
      Authorization: "Bearer " + token,
      "Idempotency-Key": crypto.randomUUID(),
      ...(revision ? { "If-Match": `"${revision}"` } : {}),
    },
    data: body,
  });
  expect(response.ok(), path + " HTTP " + response.status()).toBeTruthy();
  return (await response.json()).data;
}
async function navigate(page: Page, path: string) {
  await page.evaluate((target) => {
    history.pushState(history.state, "", target);
    window.dispatchEvent(
      new PopStateEvent("popstate", { state: history.state }),
    );
  }, path);
}
async function login(page: Page, username: string, pw = password) {
  await page.goto("/login");
  await page.getByLabel("用户名", { exact: true }).fill(username);
  await page.getByLabel("密码", { exact: true }).fill(pw);
  await page.getByRole("button", { name: "登录", exact: true }).click();
  await expect(page).toHaveURL(/overview/);
}
test.beforeAll(async ({ request }) => {
  const bootstrap =
    process.env.ADMIN_TEST_PASSWORD ||
    readFileSync(
      "../cy-pregnancy-admin/server/.local/bootstrap-password.txt",
      "utf8",
    ).trim();
  const response = await request.post(apiBase + "/auth/login", {
    data: {
      username: process.env.ADMIN_TEST_USERNAME || "local_admin",
      password: bootstrap,
    },
  });
  expect(response.ok(), "本地安全管理员登录").toBeTruthy();
  token = (await response.json()).data.accessToken;
  for (const account of accounts) {
    const result = await call(request, "/operators", {
      clientUuid: crypto.randomUUID(),
      username: account.username,
      displayName: "Web联调夹具 " + account.role,
      password,
      roleCodes: [account.role],
    });
    account.uuid = result.uuid;
  }
});
test.afterAll(async ({ request }) => {
  // 即使跨端断言失败，也先下架本轮测试内容，避免给游客留下发布中的夹具。
  if (version && accounts[2]?.uuid) {
    const securityToken = token;
    try {
      const response = await request.post(apiBase + "/auth/login", {
        data: { username: accounts[2].username, password },
      });
      if (response.ok()) {
        token = (await response.json()).data.accessToken;
        const item = await call(
          request,
          "/knowledge/versions/" + version,
          undefined,
          undefined,
          "GET",
        );
        if (item.currentlyPublished)
          await call(
            request,
            "/knowledge/" + item.articleUuid + "/withdraw",
            undefined,
            item.articleRevision,
          );
      }
    } finally {
      token = securityToken;
    }
  }
  for (const account of accounts)
    if (account.uuid) {
      const current = await call(
        request,
        "/operators/" + account.uuid,
        undefined,
        undefined,
        "GET",
      );
      await call(
        request,
        "/operators/" + account.uuid,
        {
          displayName: current.displayName,
          state: "disabled",
          roleCodes: current.roleCodes,
        },
        current.revision,
        "PATCH",
      );
    }
});
test("真实编辑→提交→独立审核→发布→下架完整流程", async ({ browser }) => {
  const context = await browser.newContext(),
    page = await context.newPage();
  await login(page, accounts[0]!.username);
  await navigate(page, "/knowledge/new");
  await page
    .getByLabel("知识标题", { exact: true })
    .fill("Web联调验证 " + suffix);
  await page.getByLabel("分类", { exact: true }).fill("测试夹具");
  await page.getByLabel("slug", { exact: true }).fill("web-e2e-" + suffix);
  await page
    .getByLabel("专业正文")
    .fill("测试内容，仅用于验证工作流，不构成医学建议。");
  await page.getByLabel("通俗正文").fill("这是一条自动化测试记录。");
  await page
    .getByLabel("证据说明与适用边界")
    .fill("自动化测试夹具，不代表有效临床依据，不可用于实际指导。");
  await page.getByRole("button", { name: "添加引用" }).click();
  await page
    .getByLabel("引用 1", { exact: true })
    .fill("测试引用占位，不用于临床发布");
  await page.getByRole("button", { name: "保存草稿", exact: true }).click();
  await expect(page).toHaveURL(/knowledge\/versions\/[a-f0-9-]+$/);
  version = page.url().split("/").pop()!;
  await page.getByRole("button", { name: "提交审核", exact: true }).click();
  await page
    .getByRole("dialog")
    .getByRole("button", { name: "提交审核", exact: true })
    .click();
  await expect(page.getByText("待审核", { exact: true }).first()).toBeVisible();
  await context.close();
  const reviewContext = await browser.newContext(),
    review = await reviewContext.newPage();
  await login(review, accounts[1]!.username);
  await navigate(review, "/reviews/" + version);
  await review
    .getByLabel("审核意见（批准与驳回均必填）")
    .fill("测试工作流确认；非真实医学审核");
  await review.getByRole("button", { name: "批准", exact: true }).click();
  await review
    .getByRole("dialog")
    .getByRole("button", { name: "批准版本", exact: true })
    .click();
  await expect(
    review.getByText("已批准", { exact: true }).first(),
  ).toBeVisible();
  await reviewContext.close();
  const pubContext = await browser.newContext(),
    pub = await pubContext.newPage();
  await login(pub, accounts[2]!.username);
  await navigate(pub, "/knowledge/versions/" + version);
  await pub.getByRole("button", { name: "发布知识", exact: true }).click();
  await pub
    .getByRole("dialog")
    .getByRole("button", { name: "发布知识", exact: true })
    .click();
  await expect(pub.getByText("当前发布版本", { exact: true })).toBeVisible();
  // 四项目真实链路：浏览器发布→管理服务→用户服务→小程序H5游客，不使用内容接口替身。
  const guestContext = await browser.newContext({
      viewport: { width: 390, height: 844 },
    }),
    guest = await guestContext.newPage();
  const listed = await guestContext.request.get(
    "http://127.0.0.1:18731/api/v1/knowledge?q=" +
      encodeURIComponent("Web联调验证 " + suffix),
  );
  expect(listed.ok()).toBeTruthy();
  const published = (await listed.json()).data.records[0];
  expect(published.versionUuid).toBe(version);
  await guest.goto(
    "http://127.0.0.1:5173/#/pages/knowledge/index?kind=published",
  );
  await guest.locator(".ga-search input").fill("Web联调验证 " + suffix);
  await guest
    .getByRole("button", { name: new RegExp("Web联调验证 " + suffix) })
    .click();
  await expect(
    guest.getByText("测试内容，仅用于验证工作流，不构成医学建议。", {
      exact: true,
    }),
  ).toBeVisible();
  expect(
    await guest.evaluate(() => localStorage.getItem("cy:account:v1")),
  ).toBeNull();
  await guest.screenshot({
    path: "artifacts/runtime/app-published-light.png",
    fullPage: true,
  });
  await pub.getByRole("button", { name: "下架", exact: true }).click();
  await pub
    .getByRole("dialog")
    .getByRole("button", { name: "下架知识", exact: true })
    .click();
  await expect(pub.getByText("非当前发布版本", { exact: true })).toBeVisible();
  const withdrawn = await guestContext.request.get(
    "http://127.0.0.1:18731/api/v1/knowledge/" + published.uuid,
  );
  expect(withdrawn.status()).toBe(404);
  await guest.reload();
  await expect(
    guest.getByText("内容已下架或不存在", { exact: true }),
  ).toBeVisible();
  await expect(
    guest.getByText("测试内容，仅用于验证工作流，不构成医学建议。", {
      exact: true,
    }),
  ).toHaveCount(0);
  await guest.screenshot({
    path: "artifacts/runtime/app-withdrawn-light.png",
    fullPage: true,
  });
  await guestContext.close();
  await pubContext.close();
});
test("安全管理员真实用户查询、审计、能力与可访问性", async ({ page }) => {
  const pw =
    process.env.ADMIN_TEST_PASSWORD ||
    readFileSync(
      "../cy-pregnancy-admin/server/.local/bootstrap-password.txt",
      "utf8",
    ).trim();
  await login(page, process.env.ADMIN_TEST_USERNAME || "local_admin", pw);
  await expect(page.getByText("匿名账号总数")).toBeVisible();
  for (const [path, title] of [
    ["/users", "用户管理"],
    ["/operators", "管理员账号"],
    ["/roles", "角色与权限"],
    ["/audits", "审计日志"],
    ["/capabilities", "系统能力"],
  ]) {
    await navigate(page, path!);
    await expect(
      page.getByRole("heading", { name: title, exact: true }),
    ).toBeVisible();
    await expect(
      page.getByRole("heading", { name: "暂时无法加载" }),
    ).toHaveCount(0);
  }
  await page.getByRole("button", { name: "检查连接" }).click();
  await expect(page.getByText("数据库", { exact: true })).toBeVisible();
  await expect(page.getByText("知识分发链路", { exact: true })).toBeVisible();
  await expect(page.getByText("正常", { exact: true })).toHaveCount(4);
  const results = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa"])
    .analyze();
  expect(results.violations).toEqual([]);
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.screenshot({
    path: "artifacts/runtime/capabilities-light.png",
    fullPage: true,
  });
});
test("搜索无结果、权限拦截、离开保护和移动布局", async ({ page }) => {
  await login(page, accounts[0]!.username);
  await navigate(page, "/knowledge");
  await page
    .getByLabel("搜索标题或 slug")
    .fill("definitely-no-result-" + suffix);
  await expect(page.getByText("没有匹配结果")).toBeVisible();
  await navigate(page, "/operators");
  await expect(
    page.getByRole("heading", { name: "暂无访问权限" }),
  ).toBeVisible();
  await navigate(page, "/knowledge/new");
  await page.getByLabel("知识标题", { exact: true }).fill("未保存修改");
  await page.getByRole("link", { name: "知识内容", exact: true }).click();
  await expect(page.getByRole("dialog")).toBeVisible();
  await page.getByRole("dialog").getByRole("button", { name: "取消" }).click();
  await expect(page.getByLabel("知识标题", { exact: true })).toHaveValue(
    "未保存修改",
  );
  await page.getByRole("link", { name: "知识内容", exact: true }).click();
  await page
    .getByRole("dialog")
    .getByRole("button", { name: "放弃修改" })
    .click();
  await page.setViewportSize({ width: 390, height: 844 });
  await expect(page.getByRole("button", { name: "打开导航" })).toBeVisible();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBeTruthy();
  await page.getByRole("button", { name: "打开导航" }).click();
  await expect(page.getByRole("dialog")).toBeVisible();
  await page
    .getByRole("dialog")
    .getByRole("link", { name: "系统能力", exact: true })
    .click();
  await expect(page.getByRole("heading", { name: "系统能力" })).toBeVisible();
  await page.screenshot({
    path: "artifacts/runtime/mobile.png",
    fullPage: true,
  });
});

test("传输失败重试复用幂等key，并恢复过期会话中的知识草稿", async ({
  page,
}) => {
  await login(page, accounts[0]!.username);
  await navigate(page, "/knowledge/new");
  await page.getByLabel("知识标题", { exact: true }).fill("重试验证 " + suffix);
  await page.getByLabel("分类", { exact: true }).fill("测试夹具");
  await page.getByLabel("slug", { exact: true }).fill("retry-e2e-" + suffix);
  await page.getByLabel("专业正文").fill("自动化测试专业表达");
  await page.getByLabel("通俗正文").fill("自动化测试通俗表达");
  await page.getByLabel("证据说明与适用边界").fill("测试夹具，非医学依据");
  const keys: string[] = [];
  let interrupted = false;
  // 第一请求真实落库后模拟连接中断；重试必须拿到同一回执，不能产生第二条记录。
  await page.route("**/admin/api/v1/knowledge", async (route) => {
    if (route.request().method() === "POST") {
      keys.push(route.request().headers()["idempotency-key"]!);
      if (!interrupted) {
        interrupted = true;
        await route.fetch();
        await route.abort("connectionfailed");
        return;
      }
    }
    await route.continue();
  });
  await page.getByRole("button", { name: "保存草稿", exact: true }).click();
  await expect(page.getByText(/无法连接服务/)).toBeVisible();
  await expect(page.getByLabel("知识标题", { exact: true })).toHaveValue(
    "重试验证 " + suffix,
  );
  await page.getByRole("button", { name: "保存草稿", exact: true }).click();
  await expect(page).toHaveURL(/knowledge\/versions\/[a-f0-9-]+$/);
  expect(keys).toHaveLength(2);
  expect(keys[0]).toBe(keys[1]);
  await page.getByRole("button", { name: "编辑草稿", exact: true }).click();
  await page
    .getByLabel("知识标题", { exact: true })
    .fill("会话过期暂存 " + suffix);
  await page.route("**/admin/api/v1/knowledge/versions/*", async (route) => {
    if (route.request().method() === "PATCH") {
      await route.fulfill({
        status: 401,
        contentType: "application/json",
        body: JSON.stringify({
          code: "AUTH_EXPIRED",
          message: "会话已过期",
          data: null,
        }),
      });
    } else await route.continue();
  });
  await page.getByRole("button", { name: "保存草稿", exact: true }).click();
  await expect(page).toHaveURL(/login\?/);
  await page.getByLabel("用户名", { exact: true }).fill(accounts[0]!.username);
  await page.getByLabel("密码", { exact: true }).fill(password);
  await page.getByRole("button", { name: "登录", exact: true }).click();
  await expect(page.getByLabel("知识标题", { exact: true })).toHaveValue(
    "会话过期暂存 " + suffix,
  );
});

test("主题、选择器键盘、中文输入与错误恢复", async ({ page }) => {
  await login(page, accounts[0]!.username);
  await navigate(page, "/knowledge");
  const search = page.getByLabel("搜索标题或 slug");
  await search.dispatchEvent("compositionstart");
  await search.fill("中文组合输入");
  await expect(page).not.toHaveURL(/q=/);
  const chineseResponse = page.waitForResponse(
    (response) =>
      response.url().includes("/admin/api/v1/knowledge?") &&
      new URL(response.url()).searchParams.get("q") === "中文组合输入",
  );
  await search.dispatchEvent("compositionend");
  expect((await chineseResponse).status()).toBe(200);
  await expect(page).toHaveURL(/q=/);
  await page.getByRole("button", { name: "清除搜索" }).click();
  await expect(search).toBeFocused();
  const theme = page.getByRole("combobox", { name: "界面主题" });
  await theme.focus();
  await theme.press("ArrowDown");
  await theme.press("End");
  await theme.press("Enter");
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
  await page.screenshot({
    path: "artifacts/runtime/knowledge-dark.png",
    fullPage: true,
  });
  const dark = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa"])
    .analyze();
  expect(
    dark.violations.map((v) => ({
      id: v.id,
      nodes: v.nodes.map((n) => n.target),
    })),
  ).toEqual([]);
  await page.route("**/admin/api/v1/knowledge?*", (route) =>
    route.fulfill({
      status: 503,
      contentType: "application/json",
      body: JSON.stringify({
        code: "UNAVAILABLE",
        message: "服务暂不可用",
        data: null,
      }),
    }),
  );
  await page.getByRole("button", { name: "刷新", exact: true }).click();
  await expect(page.getByText("服务暂不可用", { exact: true })).toBeVisible();
  await page.unroute("**/admin/api/v1/knowledge?*");
  await page.getByRole("button", { name: "重新加载", exact: true }).click();
  await expect(page.getByRole("heading", { name: "暂时无法加载" })).toHaveCount(
    0,
  );
});

test("页面几何、图标尺寸和双主题视觉记录", async ({ page }) => {
  await login(page, accounts[0]!.username);
  await navigate(page, "/knowledge");
  await expect(page.getByRole("table")).toBeVisible();
  await page.screenshot({
    path: "artifacts/runtime/knowledge-light.png",
    fullPage: true,
  });
  const geometry = await page.evaluate(() => {
    const side = document.querySelector(".sidebar")!,
      button = document.querySelector(".cy-button--secondary")!,
      icon = document.querySelector(".nav-icon img")!,
      root = document.documentElement;
    return {
      sidebar: side.getBoundingClientRect().toJSON(),
      button: {
        background: getComputedStyle(button).background,
        color: getComputedStyle(button).color,
      },
      icon: icon.getBoundingClientRect().toJSON(),
      scrollbar: getComputedStyle(root).scrollbarColor,
      theme: root.dataset.theme,
    };
  });
  mkdirSync("artifacts/runtime", { recursive: true });
  writeFileSync(
    "artifacts/runtime/geometry.json",
    JSON.stringify(geometry, null, 2),
  );
  expect(geometry.sidebar.y).toBe(16);
  expect(geometry.sidebar.width).toBe(232);
  expect(geometry.icon.width).toBeLessThanOrEqual(20);
  expect(geometry.icon.height).toBeLessThanOrEqual(20);
  expect(geometry.scrollbar).not.toBe("auto");
  const combo = page.getByRole("combobox", { name: "界面主题" });
  await combo.focus();
  await combo.press("ArrowDown");
  await combo.press("End");
  await combo.press("Enter");
  await page.screenshot({
    path: "artifacts/runtime/knowledge-dark.png",
    fullPage: true,
  });
});

test("真实并发修改冲突保留输入，明确确认后加载最新版本", async ({
  page,
  request,
}) => {
  const response = await request.post(apiBase + "/auth/login", {
    data: { username: accounts[0]!.username, password },
  });
  const editorToken = (await response.json()).data.accessToken;
  const content = {
    title: "冲突原始标题 " + suffix,
    category: "测试",
    proContent: "专业测试文本",
    plainContent: "通俗测试文本",
    references: [],
    evidenceNote: "测试夹具，非医学依据",
  };
  const created = await request.post(apiBase + "/knowledge", {
    headers: {
      Authorization: "Bearer " + editorToken,
      "Idempotency-Key": crypto.randomUUID(),
    },
    data: {
      ...content,
      clientUuid: crypto.randomUUID(),
      versionUuid: crypto.randomUUID(),
      slug: "conflict-e2e-" + suffix,
    },
  });
  expect(created.ok()).toBeTruthy();
  const v = (await created.json()).data;
  await login(page, accounts[0]!.username);
  await navigate(page, "/knowledge/versions/" + v.uuid + "/edit");
  await page
    .getByLabel("知识标题", { exact: true })
    .fill("本地输入保留 " + suffix);
  const changed = await request.patch(
    apiBase + "/knowledge/versions/" + v.uuid,
    {
      headers: {
        Authorization: "Bearer " + editorToken,
        "Idempotency-Key": crypto.randomUUID(),
        "If-Match": `"${v.revision}"`,
      },
      data: { ...content, title: "另一窗口新标题 " + suffix },
    },
  );
  expect(changed.ok()).toBeTruthy();
  await page.getByRole("button", { name: "保存草稿", exact: true }).click();
  await expect(
    page.getByRole("button", { name: "查看最新版本" }),
  ).toBeVisible();
  await expect(page.getByLabel("知识标题", { exact: true })).toHaveValue(
    "本地输入保留 " + suffix,
  );
  await page.getByRole("button", { name: "查看最新版本" }).click();
  await page
    .getByRole("dialog")
    .getByRole("button", { name: "加载最新版本", exact: true })
    .click();
  await expect(page.getByLabel("知识标题", { exact: true })).toHaveValue(
    "另一窗口新标题 " + suffix,
  );
});

test("管理员页面创建账号、重置密码与停用", async ({ page, request }) => {
  const pw =
    process.env.ADMIN_TEST_PASSWORD ||
    readFileSync(
      "../cy-pregnancy-admin/server/.local/bootstrap-password.txt",
      "utf8",
    ).trim();
  await login(page, process.env.ADMIN_TEST_USERNAME || "local_admin", pw);
  await navigate(page, "/operators/new");
  const username = "webui_" + suffix;
  await page.getByLabel("用户名", { exact: true }).fill(username);
  await page.getByLabel("显示姓名", { exact: true }).fill("页面创建测试");
  await page.getByLabel("初始密码", { exact: true }).fill(password);
  await page.getByRole("combobox", { name: "角色", exact: true }).click();
  await page.getByRole("option").filter({ hasText: "编辑" }).click();
  await page.keyboard.press("Escape");
  await page.getByRole("button", { name: "保存账号", exact: true }).click();
  await page
    .getByRole("dialog")
    .getByRole("button", { name: "保存账号", exact: true })
    .click();
  await expect(page).toHaveURL(/operators$/);
  const row = page.getByRole("row").filter({ hasText: username });
  await row.getByRole("link", { name: "编辑账号" }).click();
  await expect(page).toHaveURL(/operators\/[a-f0-9-]+$/);
  const uuid = page.url().split("/").pop()!;
  accounts.push({ username, role: "content_editor", uuid });
  await page.getByLabel("新密码", { exact: true }).fill(password + "Reset");
  await page.getByRole("button", { name: "重置密码", exact: true }).click();
  await page
    .getByRole("dialog")
    .getByRole("button", { name: "重置密码", exact: true })
    .click();
  await expect(page.getByLabel("新密码", { exact: true })).toHaveValue("");
  const old = await request.post(apiBase + "/auth/login", {
    data: { username, password },
  });
  expect(old.status()).toBe(401);
  const fresh = await request.post(apiBase + "/auth/login", {
    data: { username, password: password + "Reset" },
  });
  expect(fresh.status()).toBe(200);
  await page.getByRole("combobox", { name: "账号状态" }).click();
  await page.getByRole("option", { name: "停用", exact: true }).click();
  await page.getByRole("button", { name: "保存账号", exact: true }).click();
  await page
    .getByRole("dialog")
    .getByRole("button", { name: "保存账号", exact: true })
    .click();
  await expect(
    page
      .getByRole("row")
      .filter({ hasText: username })
      .getByText("停用", { exact: true }),
  ).toBeVisible();
});
