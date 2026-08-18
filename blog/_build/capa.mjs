/* =====================================================================
 * Bevart Blog — gerador de capa
 *
 *   node blog/_build/capa.mjs <slug>      gera a capa de um post
 *   node blog/_build/capa.mjs --todos     gera as capas que faltam
 *   node blog/_build/capa.mjs --forcar    regera todas
 *
 * Cria blog/<slug>/assets/capa.svg (1200x630, proporção de OG image) com
 * a identidade do site: fundo ink, malha discreta, brilho azul/verde,
 * etiqueta da categoria e o título quebrado em linhas.
 *
 * SVG resolve a capa dentro do site. Para redes sociais (LinkedIn,
 * WhatsApp e Facebook não renderizam SVG), gere também um PNG com
 * blog/_build/capa-png.mjs — o build usa o PNG no og:image quando existe.
 * ===================================================================== */

import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const DIR_BUILD = dirname(fileURLToPath(import.meta.url));
const DIR_BLOG = join(DIR_BUILD, '..');

const dados = JSON.parse(readFileSync(join(DIR_BLOG, 'posts.json'), 'utf8'));
const categorias = new Map(dados.categorias.map((c) => [c.slug, c]));

const esc = (s = '') => String(s)
  .replace(/&/g, '&amp;')
  .replace(/</g, '&lt;')
  .replace(/>/g, '&gt;');

/** Quebra o título em linhas usando a largura média de caractere da fonte. */
function quebrar(titulo, maxLinhas = 4) {
  const limite = 24; // caracteres por linha no corpo de 62px
  const palavras = titulo.split(/\s+/);
  const linhas = [];
  let atual = '';

  for (const palavra of palavras) {
    const teste = atual ? `${atual} ${palavra}` : palavra;
    if (teste.length > limite && atual) {
      linhas.push(atual);
      atual = palavra;
    } else {
      atual = teste;
    }
  }

  if (atual) linhas.push(atual);

  if (linhas.length > maxLinhas) {
    const cortadas = linhas.slice(0, maxLinhas);
    cortadas[maxLinhas - 1] = cortadas[maxLinhas - 1].replace(/[,;:]$/, '') + '…';
    return cortadas;
  }

  return linhas;
}

function svgCapa(post) {
  const cat = categorias.get(post.categoria);
  const linhas = quebrar(post.titulo);
  const alturaLinha = 74;
  const topo = 315 - ((linhas.length - 1) * alturaLinha) / 2;

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 630" width="1200" height="630" role="img"
  aria-label="${esc(post.titulo)}">
  <defs>
    <linearGradient id="fundo" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#0b1220" />
      <stop offset="100%" stop-color="#16233b" />
    </linearGradient>
    <radialGradient id="brilhoAzul" cx="0.12" cy="0.06" r="0.7">
      <stop offset="0%" stop-color="#2563eb" stop-opacity=".55" />
      <stop offset="100%" stop-color="#2563eb" stop-opacity="0" />
    </radialGradient>
    <radialGradient id="brilhoVerde" cx="0.95" cy="0.95" r="0.6">
      <stop offset="0%" stop-color="#059669" stop-opacity=".38" />
      <stop offset="100%" stop-color="#059669" stop-opacity="0" />
    </radialGradient>
    <pattern id="malha" width="48" height="48" patternUnits="userSpaceOnUse">
      <path d="M48 0H0v48" fill="none" stroke="#ffffff" stroke-opacity=".05" stroke-width="1" />
    </pattern>
  </defs>

  <rect width="1200" height="630" fill="url(#fundo)" />
  <rect width="1200" height="630" fill="url(#malha)" />
  <rect width="1200" height="630" fill="url(#brilhoAzul)" />
  <rect width="1200" height="630" fill="url(#brilhoVerde)" />

  <g font-family="Inter, system-ui, -apple-system, Segoe UI, sans-serif">
    <g transform="translate(88 78)">
      <rect x="0" y="0" width="${28 + cat.nome.length * 10.4}" height="34" rx="17" fill="#2563eb" fill-opacity=".18"
        stroke="#60a5fa" stroke-opacity=".45" />
      <text x="14" y="23" fill="#93c5fd" font-size="16" font-weight="700" letter-spacing="1.2">
        ${esc(cat.nome.toUpperCase())}</text>
    </g>

    <text x="88" y="${topo}" fill="#ffffff" font-size="62" font-weight="800" letter-spacing="-1.6">
${linhas.map((l, i) => `      <tspan x="88" dy="${i === 0 ? 0 : alturaLinha}">${esc(l)}</tspan>`).join('\n')}
    </text>

    <g transform="translate(88 532)">
      <rect x="0" y="0" width="40" height="40" rx="12" fill="#2563eb" />
      <text x="20" y="27" fill="#ffffff" font-size="18" font-weight="800" text-anchor="middle">B</text>
      <text x="56" y="19" fill="#ffffff" font-size="19" font-weight="700">bevart</text>
      <text x="56" y="38" fill="#94a3b8" font-size="15" font-weight="500">bevart.com.br/blog</text>
    </g>

    <text x="1112" y="560" fill="#64748b" font-size="16" font-weight="600" text-anchor="end">
      ${post.tempoLeitura} min de leitura</text>
  </g>

  <rect x="0" y="626" width="1200" height="4" fill="#2563eb" />
</svg>
`;
}

/* ============================ execução ============================ */

const args = process.argv.slice(2);
const forcar = args.includes('--forcar');
const todos = args.includes('--todos') || forcar;
const alvos = todos ? dados.posts : dados.posts.filter((p) => args.includes(p.slug));

if (!alvos.length) {
  console.log('\nUso: node blog/_build/capa.mjs <slug> | --todos | --forcar\n');
  console.log('Posts em posts.json:');
  dados.posts.forEach((p) => console.log(`  · ${p.slug}`));
  process.exit(1);
}

for (const post of alvos) {
  const dir = join(DIR_BLOG, post.slug, 'assets');
  const arquivo = join(dir, 'capa.svg');

  if (existsSync(arquivo) && !forcar && todos) {
    console.log(`  = já existe: blog/${post.slug}/assets/capa.svg`);
    continue;
  }

  mkdirSync(dir, { recursive: true });
  writeFileSync(arquivo, svgCapa(post));
  console.log(`  + blog/${post.slug}/assets/capa.svg`);
}

console.log('');
