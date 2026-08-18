/* =====================================================================
 * Bevart Blog — verificação
 *
 *   node blog/_build/verificar.mjs
 *
 * Confere o que o build não consegue garantir sozinho: JSON-LD válido,
 * links e imagens que existem em disco, ausência de placeholder, um H1
 * por página, XML bem formado e classes de CSS que quebram o container.
 * Roda sem servidor e sem dependência.
 * ===================================================================== */

import { readFileSync, existsSync, readdirSync, statSync } from 'node:fs';
import { join, dirname, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const DIR_BLOG = join(dirname(fileURLToPath(import.meta.url)), '..');
const DIR_SITE = join(DIR_BLOG, '..');

const erros = [];
const ok = [];

function paginas(dir, saida = []) {
  for (const nome of readdirSync(dir)) {
    if (nome.startsWith('_') || nome === 'assets') continue;
    const caminho = join(dir, nome);
    if (statSync(caminho).isDirectory()) paginas(caminho, saida);
    else if (nome.endsWith('.html')) saida.push(caminho);
  }
  return saida;
}

const rel = (p) => p.replace(DIR_SITE + sep, '').split(sep).join('/');

const arquivos = paginas(DIR_BLOG);

/* ============================ HTML ============================ */

for (const arquivo of arquivos) {
  const nome = rel(arquivo);
  const html = readFileSync(arquivo, 'utf8');

  // placeholders esquecidos
  if (html.includes('{{')) erros.push(`${nome}: placeholder {{...}} não substituído`);

  // um H1
  const h1 = (html.match(/<h1[\s>]/g) || []).length;
  if (h1 !== 1) erros.push(`${nome}: ${h1} H1 (precisa ser exatamente 1)`);

  // marcadores do build preenchidos
  for (const m of html.matchAll(/<!--\s*build:(\w+)\s*-->([\s\S]*?)<!--\s*\/build:\1\s*-->/g)) {
    if (!m[2].trim()) erros.push(`${nome}: bloco build:${m[1]} está vazio (rode o build)`);
  }

  // JSON-LD válido
  for (const m of html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)) {
    try {
      JSON.parse(m[1]);
    } catch (e) {
      erros.push(`${nome}: JSON-LD inválido — ${e.message}`);
    }
  }

  // canonical presente, absoluto e com barra final
  const canonical = html.match(/<link rel="canonical" href="([^"]+)"/);
  if (!canonical) erros.push(`${nome}: sem canonical`);
  else if (!canonical[1].startsWith('https://bevart.com.br/')) erros.push(`${nome}: canonical não absoluto`);
  else if (!canonical[1].endsWith('/')) erros.push(`${nome}: canonical sem barra final`);

  // links e imagens relativos precisam existir em disco
  const base = dirname(arquivo);

  for (const m of html.matchAll(/(?:href|src)="([^"#]+)"/g)) {
    const alvo = m[1];
    if (/^(https?:|mailto:|tel:|data:|#|\/\/)/.test(alvo)) continue;

    const semQuery = alvo.split('?')[0];
    if (!semQuery) continue;

    let caminho = resolve(base, decodeURIComponent(semQuery));
    if (semQuery.endsWith('/')) caminho = join(caminho, 'index.html');
    if (!existsSync(caminho)) erros.push(`${nome}: caminho quebrado -> ${alvo}`);
  }

  // imagens com alt
  for (const m of html.matchAll(/<img\s([^>]*)>/g)) {
    if (!/\balt=/.test(m[1])) erros.push(`${nome}: <img> sem alt`);
  }

  ok.push(nome);
}

/* ============================ CSS ============================ */
/* O .bv-wrap centraliza (margin: 0 auto) e dá o respiro lateral
 * (padding: 0 20px). Ele é usado em conjunto: class="bv-wrap bv-algo".
 * Se a classe irmã declarar margin ou padding no atalho, apaga os dois e
 * desloca o bloco inteiro para fora do eixo da página — foi o que
 * aconteceu com a capa dos posts. Esta checagem existe para isso não
 * voltar sem ninguém perceber. */

function regrasDoCss(cssBruto) {
  const regras = new Map();
  // comentários fora do caminho: eles contêm ":" e "{" e bagunçam a leitura
  const css = cssBruto.replace(/\/\*[\s\S]*?\*\//g, '');

  for (const parte of css.split('}')) {
    const corte = parte.lastIndexOf('{');
    if (corte === -1) continue;

    const seletores = parte.slice(0, corte).split('\n').pop().trim();
    const corpo = parte.slice(corte + 1);
    if (!seletores.startsWith('.')) continue;

    for (const seletor of seletores.split(',')) {
      const limpo = seletor.trim();
      if (/^\.[a-zA-Z0-9_-]+$/.test(limpo)) regras.set(limpo, corpo);
    }
  }

  return regras;
}

function declaracao(corpo, propriedade) {
  for (const linha of corpo.split(';')) {
    const [prop, valor] = linha.split(':');
    if (prop && prop.trim() === propriedade && valor) return valor.trim();
  }
  return null;
}

{
  const caminhoCss = join(DIR_BLOG, 'assets', 'css', 'blog.css');
  const css = readFileSync(caminhoCss, 'utf8');
  const regras = regrasDoCss(css);
  const combinadas = new Set();

  for (const arquivo of arquivos) {
    const html = readFileSync(arquivo, 'utf8');
    for (const m of html.matchAll(/class="([^"]*\bbv-wrap\b[^"]*)"/g)) {
      for (const classe of m[1].split(/\s+/)) {
        if (classe && classe !== 'bv-wrap') combinadas.add(classe);
      }
    }
  }

  // valor horizontal do atalho: 1 valor -> ele mesmo; 2, 3 ou 4 -> o segundo
  const horizontal = (valor) => {
    const lados = valor.split(/\s+/);
    return lados.length === 1 ? lados[0] : lados[1];
  };

  // o que o .bv-wrap precisa que sobreviva
  const esperado = { margin: 'auto', padding: '20px' };

  for (const classe of combinadas) {
    const corpo = regras.get('.' + classe);
    if (!corpo) continue;

    for (const propriedade of ['margin', 'padding']) {
      const valor = declaracao(corpo, propriedade);
      if (!valor) continue;
      if (horizontal(valor) === esperado[propriedade]) continue;

      erros.push(
        `blog.css: .${classe} declara "${propriedade}: ${valor}" e anda junto com .bv-wrap — ` +
        `isso apaga a centralização e o respiro lateral ` +
        `(use ${propriedade}-block ou mantenha ${esperado[propriedade]} na lateral)`
      );
    }
  }

  ok.push('blog/assets/css/blog.css');
}

/* ============================ XML ============================ */

for (const xml of [join(DIR_BLOG, 'sitemap.xml'), join(DIR_BLOG, 'feed.xml'),
  join(DIR_SITE, 'sitemap.xml'), join(DIR_SITE, 'sitemap-paginas.xml')]) {
  if (!existsSync(xml)) {
    erros.push(`${rel(xml)}: não existe`);
    continue;
  }

  const txt = readFileSync(xml, 'utf8');
  if (!txt.startsWith('<?xml')) erros.push(`${rel(xml)}: sem declaração XML`);

  const abre = (txt.match(/<(?!\?|!|\/)([a-z:]+)[^>]*?(?<!\/)>/gi) || []).length;
  const fecha = (txt.match(/<\/[a-z:]+>/gi) || []).length;
  if (abre !== fecha) erros.push(`${rel(xml)}: tags desbalanceadas (${abre} abrem, ${fecha} fecham)`);

  ok.push(rel(xml));
}

/* ============================ posts.json ============================ */

try {
  const dados = JSON.parse(readFileSync(join(DIR_BLOG, 'posts.json'), 'utf8'));
  const slugs = dados.posts.map((p) => p.slug);
  const repetidos = slugs.filter((s, i) => slugs.indexOf(s) !== i);
  if (repetidos.length) erros.push(`posts.json: slug repetido — ${repetidos.join(', ')}`);

  const destaques = dados.posts.filter((p) => p.destaque && !p.rascunho).length;
  if (destaques > 1) erros.push(`posts.json: ${destaques} posts marcados como destaque (use apenas 1)`);

  ok.push('blog/posts.json');
} catch (e) {
  erros.push(`posts.json inválido — ${e.message}`);
}

/* ============================ llms.txt ============================ */

const llms = join(DIR_SITE, 'llms.txt');
if (!existsSync(llms)) erros.push('llms.txt: não existe na raiz');
else if (!readFileSync(llms, 'utf8').includes('build:blog')) erros.push('llms.txt: sem marcador build:blog');
else ok.push('llms.txt');

/* ============================ resultado ============================ */

console.log(`\nBevart Blog — verificação`);
console.log(`  arquivos conferidos: ${ok.length}`);

if (erros.length) {
  console.log(`\n  PROBLEMAS (${erros.length}):`);
  erros.forEach((e) => console.log(`    x ${e}`));
  console.log('');
  process.exit(1);
}

console.log(`\n  tudo certo.\n`);
