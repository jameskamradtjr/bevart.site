/* =====================================================================
 * Migração única: posts escritos antes dos marcadores build:head,
 * build:byline, build:share, build:autor, build:sidebar e build:ctafinal
 * passam a delegar esses blocos ao build.
 *
 *   node blog/_build/_migrar-marcadores.mjs
 *
 * Idempotente: quem já tem o marcador é ignorado. Pode apagar este
 * arquivo depois que todos os posts estiverem convertidos.
 * ===================================================================== */

import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const DIR_BLOG = join(dirname(fileURLToPath(import.meta.url)), '..');
const dados = JSON.parse(readFileSync(join(DIR_BLOG, 'posts.json'), 'utf8'));

const marcador = (nome, recuo) => `${recuo}<!-- build:${nome} -->\n${recuo}<!-- /build:${nome} -->`;

const trocas = [
  {
    nome: 'head',
    re: /<head>[\s\S]*?<\/head>/,
    para: () => `<head>\n${marcador('head', '  ')}\n</head>`
  },
  {
    nome: 'byline',
    re: /^ {8}<div class="bv-byline">[\s\S]*?\n {8}<\/div>$/m,
    para: () => marcador('byline', '        ')
  },
  {
    nome: 'share',
    re: /^ {10}<div class="bv-share" data-share>[\s\S]*?\n {10}<\/div>$/m,
    para: () => marcador('share', '          ')
  },
  {
    nome: 'autor',
    re: /^ {10}<aside class="bv-author">[\s\S]*?\n {10}<\/aside>$/m,
    para: () => marcador('autor', '          ')
  },
  {
    nome: 'sidebar',
    re: /^ {8}<aside class="bv-toc">[\s\S]*?\n {8}<\/aside>$/m,
    para: () => marcador('sidebar', '        ')
  },
  {
    nome: 'ctafinal',
    re: /^ {4}<section class="bv-section">\n {6}<div class="bv-wrap">\n {8}<div class="bv-band">[\s\S]*?\n {4}<\/section>$/m,
    para: () => marcador('ctafinal', '    ')
  }
];

for (const post of dados.posts) {
  const arquivo = join(DIR_BLOG, post.slug, 'index.html');
  if (!existsSync(arquivo)) continue;

  let html = readFileSync(arquivo, 'utf8');
  const aplicados = [];
  const faltando = [];

  for (const t of trocas) {
    if (html.includes(`<!-- build:${t.nome} -->`)) continue;
    if (!t.re.test(html)) {
      faltando.push(t.nome);
      continue;
    }
    html = html.replace(t.re, t.para());
    aplicados.push(t.nome);
  }

  if (aplicados.length) writeFileSync(arquivo, html);

  const resumo = aplicados.length ? `+ ${aplicados.join(', ')}` : '= já convertido';
  const alerta = faltando.length ? `  !! não encontrado: ${faltando.join(', ')}` : '';
  console.log(`${post.slug}\n   ${resumo}${alerta}`);
}

console.log('');
