/* =====================================================================
 * Bevart Blog — capa.svg -> capa.png (1200x630)
 *
 *   node blog/_build/capa-png.mjs <slug>
 *   node blog/_build/capa-png.mjs --todos
 *
 * LinkedIn, WhatsApp e Facebook não renderizam SVG em og:image. Quando
 * existir blog/<slug>/assets/capa.png, o build passa a usá-lo nas metas
 * sociais automaticamente.
 *
 * Depende do puppeteer, que NÃO é dependência do site. Se não estiver
 * instalado, o script explica o que fazer e sai sem quebrar nada:
 *   npm i -D puppeteer      (ou npx puppeteer browsers install chrome)
 * ===================================================================== */

import { readFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const DIR_BUILD = dirname(fileURLToPath(import.meta.url));
const DIR_BLOG = join(DIR_BUILD, '..');

const dados = JSON.parse(readFileSync(join(DIR_BLOG, 'posts.json'), 'utf8'));
const args = process.argv.slice(2);
const alvos = args.includes('--todos') ? dados.posts : dados.posts.filter((p) => args.includes(p.slug));

if (!alvos.length) {
  console.log('\nUso: node blog/_build/capa-png.mjs <slug> | --todos\n');
  process.exit(1);
}

let puppeteer;

try {
  puppeteer = (await import('puppeteer')).default;
} catch {
  console.log('\n  puppeteer não encontrado — o PNG é opcional.');
  console.log('  Para gerar: npm i -D puppeteer  (uma vez, na raiz do site)');
  console.log('  Sem PNG, o og:image cai na imagem padrão definida em posts.json.\n');
  process.exit(0);
}

const navegador = await puppeteer.launch({ headless: 'new' });
const pagina = await navegador.newPage();
await pagina.setViewport({ width: 1200, height: 630, deviceScaleFactor: 1 });

for (const post of alvos) {
  const svg = join(DIR_BLOG, post.slug, 'assets', 'capa.svg');

  if (!existsSync(svg)) {
    console.log(`  ! sem capa.svg: ${post.slug} (rode capa.mjs antes)`);
    continue;
  }

  await pagina.goto(pathToFileURL(svg).href, { waitUntil: 'networkidle0' });
  await pagina.screenshot({ path: join(DIR_BLOG, post.slug, 'assets', 'capa.png'), type: 'png' });
  console.log(`  + blog/${post.slug}/assets/capa.png`);
}

await navegador.close();
console.log('');
