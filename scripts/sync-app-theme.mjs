import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const root = fileURLToPath(new URL('../', import.meta.url));
const source = fs.readFileSync(path.join(root, '../app/cy-pregnancy/styles/theme.ts'), 'utf8');
const body = source.slice(source.indexOf('export const palettes'), source.indexOf('export function getChartColors'));
const output = '// 由 App styles/theme.ts 生成，禁止手工改颜色。\n' + body;
const target = path.join(root, 'src/theme/app-palette.generated.ts');
if (process.argv.includes('--check')) {
  if (!fs.existsSync(target) || fs.readFileSync(target, 'utf8') !== output) throw Error('App主题已变化，请运行 npm run tokens');
} else { fs.mkdirSync(path.dirname(target), { recursive: true }); fs.writeFileSync(target, output); }
