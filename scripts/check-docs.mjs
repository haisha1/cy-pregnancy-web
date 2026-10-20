import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

// 文档包的轻量检查，不依赖 Web 工程或额外 npm 包。
const root = fileURLToPath(new URL("../", import.meta.url));
const files = [];
function walk(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (["archive","node_modules","dist","test-results","playwright-report",".local","artifacts"].includes(entry.name)) continue;
    const target = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(target);
    else if (entry.name.endsWith(".md")) files.push(target);
  }
}
walk(root);
const failures = [];
let localLinks = 0;
for (const file of files) {
  const body = fs.readFileSync(file, "utf8").replace(/```[\s\S]*?```/g, "");
  for (const match of body.matchAll(/\[[^\]\n]+\]\(([^)]+)\)/g)) {
    const href = match[1];
    if (/^(https?:|mailto:|#)/.test(href)) continue;
    const target = path.resolve(
      path.dirname(file),
      decodeURIComponent(href.split("#")[0]),
    );
    localLinks++;
    if (!fs.existsSync(target))
      failures.push(`${path.relative(root, file)}: 无效链接 ${href}`);
  }
}
const requirements = fs.readFileSync(
  path.join(root, "REQUIREMENTS.md"),
  "utf8",
);
const ids = [...requirements.matchAll(/^\| (W\d{2}) \|/gm)].map((m) => m[1]);
if (
  ids.length !== 18 ||
  new Set(ids).size !== 18 ||
  ids[0] !== "W01" ||
  ids.at(-1) !== "W18"
) {
  failures.push("需求页面登记须唯一覆盖 W01-W18");
}
const source = fs.readFileSync(
  path.join(root, "../app/cy-pregnancy/styles/theme.ts"),
  "utf8",
);
const design = fs.readFileSync(path.join(root, "DESIGN.md"), "utf8");
const light = source.split("light: {")[1]?.split("dark: {")[0] ?? "";
const expected = {
  primary: "--primary",
  secondary: "--primary-gradientEnd",
  actionStart: "--action-start",
  actionEnd: "--action-end",
  text: "--text-primary",
  muted: "--text-secondary",
  tertiary: "--text-tertiary",
  background: "--bg-gradientStart",
  backgroundMid: "--bg-gradientMid",
  backgroundEnd: "--bg-gradientEnd",
  glass: "--glass-fill",
  glassStrong: "--glass-fillStrong",
  stroke: "--glass-stroke",
  fallback: "--glass-fallback",
  success: "--success",
  warning: "--warning",
  danger: "--danger",
};
for (const [name, appKey] of Object.entries(expected)) {
  const value = light.match(new RegExp(`"${appKey}": "([^"]+)"`))?.[1];
  const documented = design.match(
    new RegExp(`^  ${name}: "([^"]+)"`, "m"),
  )?.[1];
  if (!value || value !== documented)
    failures.push(`DESIGN ${name} 与 App ${appKey} 不一致`);
}
// 深色表的关键品牌值同样从 App 源检查，不凭浅色值反相推算。
const dark = source.split("dark: {")[1]?.split("} as const")[0] ?? "";
for (const key of [
  "--primary",
  "--hero-start",
  "--hero-end",
  "--text-primary",
  "--glass-fallback",
]) {
  const value = dark.match(new RegExp(`"${key}": "([^"]+)"`))?.[1];
  if (!value || !design.includes(value))
    failures.push(`DESIGN 缺少 App 深色 ${key}`);
}
console.log(
  JSON.stringify(
    {
      markdownFiles: files.length,
      localLinks,
      plannedPages: ids.length,
      sharedLightTokens: Object.keys(expected).length,
      darkBrandChecks: 5,
      failures,
    },
    null,
    2,
  ),
);
if (failures.length) process.exitCode = 1;
