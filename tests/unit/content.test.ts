import { test } from "node:test";
import assert from "node:assert/strict";
import {
  safeReturnTo,
  validPassword,
  validateContent,
  displayDate,
} from "../../src/domain/content";
test("登录返回地址拒绝跨域、反斜线和控制字符", () => {
  for (const value of [
    "https://evil.test",
    "//evil.test",
    "/\\evil.test",
    "/login",
    "/\n/evil.test",
    null,
  ])
    assert.equal(safeReturnTo(value), "/overview");
  assert.equal(safeReturnTo("/knowledge?q=x"), "/knowledge?q=x");
});
test("密码校验遵循BCrypt的UTF8字节边界", () => {
  assert.equal(validPassword("a".repeat(12)), true);
  assert.equal(validPassword("a".repeat(11)), false);
  assert.equal(validPassword("孕".repeat(24)), true);
  assert.equal(validPassword("孕".repeat(25)), false);
});
test("内容必须包含两种表达、证据说明并限制引用边界", () => {
  const form = {
    title: "测试知识",
    category: "孕期",
    proContent: "专业表达",
    plainContent: "通俗表达",
    references: [],
    evidenceNote: "证据适用边界",
  };
  assert.deepEqual(validateContent(form, "test-article"), {});
  assert.ok(
    validateContent({ ...form, proContent: " ", evidenceNote: "" }).proContent,
  );
  assert.ok(validateContent({ ...form, references: [" "] }).references);
  assert.ok(validateContent(form, "A B").slug);
});
test("日期统一转换为北京时间且无效值不抛异常", () => {
  assert.equal(displayDate(null), "—");
  assert.equal(displayDate("invalid"), "—");
  assert.match(displayDate("2026-10-18T16:00:00Z"), /2026-10-19 00:00/);
});
