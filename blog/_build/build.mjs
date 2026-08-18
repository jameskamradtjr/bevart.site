/* =====================================================================
 * Bevart Blog — build
 *
 * Roda com: node blog/_build/build.mjs
 *
 * O blog é 100% HTML estático. Este script não "compila" os posts: o
 * texto continua sendo HTML escrito à mão dentro de blog/<slug>/index.html.
 * O que ele faz é manter em dia tudo que é derivado de posts.json:
 *
 *   1. cabeçalho e rodapé de todas as páginas do blog (marcadores build:header
 *      e build:footer) — assim um link novo no menu entra em todos os posts;
 *   2. cards do hub, filtros, grade de categorias e o ItemList do JSON-LD;
 *   3. páginas de categoria (geradas inteiras, não precisa editar à mão);
 *   4. posts relacionados e navegação anterior/próximo dentro de cada post;
 *   5. blog/sitemap.xml, blog/feed.xml e a lista de posts do llms.txt.
 *
 * Nada é apagado fora dos marcadores: o build é seguro para rodar sempre.
 * ===================================================================== */

import { readFileSync, writeFileSync, existsSync, mkdirSync, readdirSync, statSync } from 'node:fs';
import { join, dirname, relative, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const DIR_BUILD = dirname(fileURLToPath(import.meta.url));
const DIR_BLOG = join(DIR_BUILD, '..');
const DIR_SITE = join(DIR_BLOG, '..');

const dados = JSON.parse(readFileSync(join(DIR_BLOG, 'posts.json'), 'utf8'));
const { blog, autores, categorias } = dados;

const BASE = blog.site.replace(/\/$/, '');
const URL_BLOG = blog.url.replace(/\/$/, '');

const avisos = [];
const feitos = [];

/* ============================ utilidades ============================ */

const esc = (s = '') => String(s)
  .replace(/&/g, '&amp;')
  .replace(/</g, '&lt;')
  .replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;');

const escAttr = (s = '') => esc(s).replace(/'/g, '&#39;');

const semAcento = (s = '') => String(s).normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();

const MESES = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];

function dataLegivel(iso) {
  const [a, m, d] = iso.split('-').map(Number);
  return `${String(d).padStart(2, '0')} ${MESES[m - 1]} ${a}`;
}

function dataIso(iso) {
  return `${iso}T09:00:00-03:00`;
}

function dataRfc822(iso) {
  const [a, m, d] = iso.split('-').map(Number);
  return new Date(Date.UTC(a, m - 1, d, 12)).toUTCString();
}

/** Troca o conteúdo entre <!-- build:nome --> e <!-- /build:nome -->. */
function substituirBloco(html, nome, conteudo) {
  const re = new RegExp(`(<!--\\s*build:${nome}\\s*-->)[\\s\\S]*?(<!--\\s*/build:${nome}\\s*-->)`);
  if (!re.test(html)) return { html, trocou: false };
  return { html: html.replace(re, `$1\n${conteudo}\n$2`), trocou: true };
}

/** Prefixo relativo (../../) da página até a raiz do blog. */
function prefixoBlog(arquivo) {
  const rel = relative(DIR_BLOG, dirname(arquivo));
  if (!rel) return '';
  return rel.split(sep).map(() => '..').join('/') + '/';
}

function listarPaginas(dir, saida = []) {
  for (const nome of readdirSync(dir)) {
    if (nome.startsWith('_') || nome === 'assets' || nome === 'node_modules') continue;
    const caminho = join(dir, nome);
    if (statSync(caminho).isDirectory()) listarPaginas(caminho, saida);
    else if (nome === 'index.html') saida.push(caminho);
  }
  return saida;
}

/* ============================ dados derivados ============================ */

const mapaCategorias = new Map(categorias.map((c) => [c.slug, c]));

const posts = dados.posts
  .filter((p) => {
    if (p.rascunho) {
      avisos.push(`rascunho ignorado: ${p.slug}`);
      return false;
    }
    if (!mapaCategorias.has(p.categoria)) {
      avisos.push(`categoria inexistente em ${p.slug}: ${p.categoria}`);
      return false;
    }
    if (!existsSync(join(DIR_BLOG, p.slug, 'index.html'))) {
      avisos.push(`post sem arquivo: blog/${p.slug}/index.html`);
      return false;
    }
    return true;
  })
  .sort((a, b) => (a.publicado < b.publicado ? 1 : a.publicado > b.publicado ? -1 : 0));

if (!posts.length) avisos.push('nenhum post publicado encontrado');

const urlPost = (p) => `${URL_BLOG}/${p.slug}/`;
const urlCategoria = (c) => `${URL_BLOG}/categoria/${c.slug}/`;

function urlCapa(p) {
  const pngLocal = join(DIR_BLOG, p.slug, 'assets', 'capa.png');
  if (existsSync(pngLocal)) return `${URL_BLOG}/${p.slug}/assets/capa.png`;
  if (p.ogImagem) return p.ogImagem.startsWith('http') ? p.ogImagem : `${URL_BLOG}/${p.slug}/${p.ogImagem}`;
  return blog.ogPadrao;
}

/* ============================ componentes ============================ */

function cardPost(p, prefixo) {
  const cat = mapaCategorias.get(p.categoria);
  const href = `${prefixo}${p.slug}/`;
  const busca = semAcento([p.titulo, p.dek, cat.nome, (p.tags || []).join(' ')].join(' '));

  return `        <article class="bv-post-card" data-post data-categoria="${escAttr(p.categoria)}"
          data-busca="${escAttr(busca)}">
          <a class="bv-post-card__media" href="${escAttr(href)}" tabindex="-1" aria-hidden="true">
            <img src="${escAttr(href + p.capa)}" alt="" width="640" height="360" loading="lazy" decoding="async">
          </a>
          <div class="bv-post-card__body">
            <a class="bv-chip" href="${escAttr(prefixo + 'categoria/' + cat.slug + '/')}">${esc(cat.nome)}</a>
            <h3 class="bv-post-card__title"><a href="${escAttr(href)}">${esc(p.titulo)}</a></h3>
            <p class="bv-post-card__dek">${esc(p.dek)}</p>
            <p class="bv-meta">
              <time datetime="${p.publicado}">${dataLegivel(p.publicado)}</time>
              <span class="bv-meta__sep">${p.tempoLeitura} min de leitura</span>
            </p>
          </div>
        </article>`;
}

function cardDestaque(p, prefixo) {
  const cat = mapaCategorias.get(p.categoria);
  const href = `${prefixo}${p.slug}/`;

  return `      <article class="bv-featured">
        <a class="bv-featured__media" href="${escAttr(href)}" tabindex="-1" aria-hidden="true">
          <img src="${escAttr(href + p.capa)}" alt="" width="800" height="500" fetchpriority="high" decoding="async">
        </a>
        <div class="bv-featured__body">
          <a class="bv-chip" href="${escAttr(prefixo + 'categoria/' + cat.slug + '/')}">${esc(cat.nome)}</a>
          <h3><a href="${escAttr(href)}">${esc(p.titulo)}</a></h3>
          <p>${esc(p.dek)}</p>
          <p class="bv-meta">
            <time datetime="${p.publicado}">${dataLegivel(p.publicado)}</time>
            <span class="bv-meta__sep">${p.tempoLeitura} min de leitura</span>
          </p>
        </div>
      </article>`;
}

function cabecalho(prefixo, { paginaAtual = '' } = {}) {
  const site = `${prefixo}../`;
  const raiz = prefixo || './';
  const marcaBlog = paginaAtual === 'blog' ? ' aria-current="page"' : '';

  return `  <div class="bv-header">
    <div class="bv-wrap bv-header__inner">
      <a class="bv-header__brand" href="${raiz}" aria-label="Blog do Bevart">
        <img src="${site}assets/img/logo bevart.svg" alt="Bevart" width="140" height="40">
        <span class="bv-header__tag">Blog</span>
      </a>
      <nav class="bv-nav" aria-label="Navegação do blog">
        <a href="${raiz}"${marcaBlog}>Todos os artigos</a>
${categorias.slice(0, 4).map((c) => `        <a href="${prefixo}categoria/${c.slug}/"${paginaAtual === c.slug ? ' aria-current="page"' : ''}>${esc(c.nome)}</a>`).join('\n')}
        <a href="${site}index.html">Plataforma</a>
      </nav>
      <div class="bv-header__actions">
        <a class="bv-btn bv-btn--primary"
          href="https://profissionais.bevart.com.br/app/src/login/views/login" data-cta="blog-header">Criar conta grátis</a>
        <button type="button" class="bv-burger" data-burger aria-expanded="false" aria-controls="menu-mobile"
          aria-label="Abrir menu">
          <svg width="24" height="24" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"
            aria-hidden="true">
            <path d="M4 7h16M4 12h16M4 17h16" />
          </svg>
        </button>
      </div>
    </div>
    <div class="bv-wrap">
      <div class="bv-mobile" id="menu-mobile">
        <a href="${raiz}">Todos os artigos</a>
${categorias.map((c) => `        <a href="${prefixo}categoria/${c.slug}/">${esc(c.nome)}</a>`).join('\n')}
        <a href="${site}index.html">Plataforma Bevart</a>
        <a class="bv-btn bv-btn--primary"
          href="https://profissionais.bevart.com.br/app/src/login/views/login" data-cta="blog-menu-mobile">Criar conta grátis</a>
      </div>
    </div>
    <div class="bv-progress" id="progresso-leitura" aria-hidden="true"></div>
  </div>`;
}

function rodape(prefixo) {
  const site = `${prefixo}../`;
  const raiz = prefixo || './';

  return `  <footer class="bv-footer">
    <div class="bv-wrap">
      <div class="bv-footer__grid">
        <div class="bv-footer__brand">
          <img src="${site}assets/img/logo bevart.svg" alt="Bevart" width="140" height="40">
          <p>Plataforma de gestão de SST que liga o inventário de riscos aos documentos, exames, treinamentos, EPI e
            eventos do eSocial.</p>
        </div>
        <div>
          <h3>Blog</h3>
          <ul>
            <li><a href="${raiz}">Todos os artigos</a></li>
${categorias.map((c) => `            <li><a href="${prefixo}categoria/${c.slug}/">${esc(c.nome)}</a></li>`).join('\n')}
            <li><a href="${raiz}feed.xml">Feed RSS</a></li>
          </ul>
        </div>
        <div>
          <h3>Plataforma</h3>
          <ul>
            <li><a href="${site}index.html">Visão geral</a></li>
            <li><a href="${site}index.html#features">Recursos</a></li>
            <li><a href="${site}index.html#pricing">Preços</a></li>
            <li><a href="${site}index.html#faq">Perguntas frequentes</a></li>
            <li><a href="${site}modelos-de-documentos-sst-pdf.html">Modelos de documentos</a></li>
          </ul>
        </div>
        <div>
          <h3>Soluções</h3>
          <ul>
            <li><a href="${site}sistema-pgr-online.html">Sistema PGR online</a></li>
            <li><a href="${site}sistema-pcmso-e-aso-online.html">PCMSO e ASO online</a></li>
            <li><a href="${site}ltcat-online-sistema.html">Laudo LTCAT digital</a></li>
            <li><a href="${site}esocial-sst-para-empresas.html">eSocial SST para empresas</a></li>
            <li><a href="${site}gestao-de-treinamentos-sst.html">Gestão de treinamentos</a></li>
          </ul>
        </div>
      </div>
      <div class="bv-footer__bar">
        <p>&copy; <span data-ano>2026</span> Bevart. Todos os direitos reservados.</p>
        <nav aria-label="Links legais">
          <a href="${site}termos-de-uso.html">Termos de uso</a>
          <a href="${site}privacidade.html">Privacidade</a>
          <a href="${site}lgpd.html">LGPD</a>
        </nav>
      </div>
    </div>
  </footer>`;
}

/* ============================ hub ============================ */

function montarHub() {
  const arquivo = join(DIR_BLOG, 'index.html');
  if (!existsSync(arquivo)) {
    avisos.push('blog/index.html não encontrado');
    return;
  }

  let html = readFileSync(arquivo, 'utf8');
  const destaque = posts.find((p) => p.destaque) || posts[0];
  const demais = posts.filter((p) => p !== destaque);

  const blocos = {
    header: cabecalho('', { paginaAtual: 'blog' }),
    footer: rodape(''),
    destaque: destaque ? cardDestaque(destaque, '') : '',
    filtros: [
      '        <button type="button" class="bv-filter is-active" data-filtro="todas" aria-pressed="true">Todas</button>',
      ...categorias.map((c) => `        <button type="button" class="bv-filter" data-filtro="${c.slug}" aria-pressed="false">${esc(c.nome)}</button>`)
    ].join('\n'),
    cards: demais.map((p) => cardPost(p, '')).join('\n'),
    categorias: categorias.map((c) => {
      const total = posts.filter((p) => p.categoria === c.slug).length;
      return `        <a class="bv-cat" href="categoria/${c.slug}/">
          <strong>${esc(c.nome)}</strong>
          <span>${esc(c.descricao)}</span>
          <p class="bv-meta" style="margin-top:10px">${total === 1 ? '1 artigo' : total + ' artigos'}</p>
        </a>`;
    }).join('\n'),
    jsonld: `  <script type="application/ld+json">
${JSON.stringify(jsonLdHub(), null, 2).split('\n').map((l) => '  ' + l).join('\n')}
  </script>`
  };

  for (const [nome, conteudo] of Object.entries(blocos)) {
    const r = substituirBloco(html, nome, conteudo);
    if (!r.trocou) avisos.push(`marcador build:${nome} ausente em blog/index.html`);
    html = r.html;
  }

  writeFileSync(arquivo, html);
  feitos.push('blog/index.html');
}

function jsonLdHub() {
  return {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'Blog',
        '@id': `${URL_BLOG}/#blog`,
        name: blog.titulo,
        description: blog.descricao,
        url: `${URL_BLOG}/`,
        inLanguage: blog.idioma,
        publisher: { '@id': `${BASE}/#organization` }
      },
      {
        '@type': 'ItemList',
        itemListElement: posts.slice(0, 20).map((p, i) => ({
          '@type': 'ListItem',
          position: i + 1,
          url: urlPost(p),
          name: p.titulo
        }))
      },
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Bevart', item: `${BASE}/` },
          { '@type': 'ListItem', position: 2, name: 'Blog', item: `${URL_BLOG}/` }
        ]
      }
    ]
  };
}

/* ============================ categorias ============================ */

function montarCategorias() {
  for (const cat of categorias) {
    const doCat = posts.filter((p) => p.categoria === cat.slug);
    const dir = join(DIR_BLOG, 'categoria', cat.slug);
    mkdirSync(dir, { recursive: true });

    const prefixo = '../../';
    const url = urlCategoria(cat);

    const jsonld = {
      '@context': 'https://schema.org',
      '@graph': [
        {
          '@type': 'CollectionPage',
          '@id': `${url}#pagina`,
          name: `${cat.tituloSeo} | Blog Bevart`,
          description: cat.descricaoSeo,
          url,
          inLanguage: blog.idioma,
          isPartOf: { '@id': `${URL_BLOG}/#blog` }
        },
        {
          '@type': 'ItemList',
          itemListElement: doCat.map((p, i) => ({
            '@type': 'ListItem', position: i + 1, url: urlPost(p), name: p.titulo
          }))
        },
        {
          '@type': 'BreadcrumbList',
          itemListElement: [
            { '@type': 'ListItem', position: 1, name: 'Bevart', item: `${BASE}/` },
            { '@type': 'ListItem', position: 2, name: 'Blog', item: `${URL_BLOG}/` },
            { '@type': 'ListItem', position: 3, name: cat.nome, item: url }
          ]
        }
      ]
    };

    const html = `<!DOCTYPE html>
<html lang="pt-BR">

<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${esc(cat.tituloSeo)} | Blog Bevart</title>
  <meta name="description" content="${escAttr(cat.descricaoSeo)}">
  <link rel="canonical" href="${url}">
  <meta name="robots" content="${doCat.length ? 'index, follow, max-image-preview:large' : 'noindex, follow'}">
  <meta name="theme-color" content="#2563eb">
  <meta property="og:type" content="website">
  <meta property="og:site_name" content="Blog Bevart">
  <meta property="og:locale" content="pt_BR">
  <meta property="og:url" content="${url}">
  <meta property="og:title" content="${escAttr(cat.tituloSeo)} | Blog Bevart">
  <meta property="og:description" content="${escAttr(cat.descricaoSeo)}">
  <meta property="og:image" content="${blog.ogPadrao}">
  <meta name="twitter:card" content="summary_large_image">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet">
  <link rel="icon" type="image/png" href="${prefixo}../assets/img/favicon.png">
  <link rel="stylesheet" href="${prefixo}assets/css/blog.css">
  <link rel="alternate" type="application/rss+xml" title="Blog Bevart" href="${prefixo}feed.xml">
  <script defer src="${prefixo}assets/js/analytics.js"></script>
  <script defer src="${prefixo}assets/js/blog.js"></script>
  <script type="application/ld+json">
${JSON.stringify(jsonld, null, 2).split('\n').map((l) => '  ' + l).join('\n')}
  </script>
</head>

<body>
  <a href="#conteudo" class="bv-skip">Ir para o conteúdo</a>

  <!-- build:header -->
${cabecalho(prefixo, { paginaAtual: cat.slug })}
  <!-- /build:header -->

  <main id="conteudo">
    <nav class="bv-breadcrumb bv-wrap" aria-label="Você está em">
      <ol>
        <li><a href="${prefixo}../index.html">Bevart</a></li>
        <li><a href="${prefixo}">Blog</a></li>
        <li aria-current="page">${esc(cat.nome)}</li>
      </ol>
    </nav>

    <section class="bv-hero">
      <div class="bv-wrap">
        <p class="bv-eyebrow">Categoria</p>
        <h1>${esc(cat.nome)}</h1>
        <p>${esc(cat.descricaoSeo)}</p>
        <div class="bv-search">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
            <circle cx="11" cy="11" r="7" />
            <path d="m20 20-3.5-3.5" />
          </svg>
          <label class="bv-sr" for="busca">Buscar nesta categoria</label>
          <input type="search" id="busca" placeholder="Buscar em ${escAttr(cat.nome)}…" autocomplete="off">
        </div>
      </div>
    </section>

    <section class="bv-section">
      <div class="bv-wrap">
        <div class="bv-section__head">
          <h2>Artigos de ${esc(cat.nome)}</h2>
          <p class="bv-meta" id="contador-posts">${doCat.length === 1 ? '1 artigo' : doCat.length + ' artigos'}</p>
        </div>
        <div class="bv-grid" id="lista-posts">
${doCat.map((p) => cardPost(p, prefixo)).join('\n') || '        <p class="bv-meta">Ainda não publicamos artigos nesta categoria.</p>'}
        </div>
        <div class="bv-empty" id="sem-resultados">
          <p>Nenhum artigo encontrado para essa busca.</p>
          <p><a href="${prefixo}">Ver todos os artigos do blog</a></p>
        </div>
      </div>
    </section>

    <section class="bv-section">
      <div class="bv-wrap">
        <div class="bv-band">
          <div>
            <h2>Do risco mapeado ao eSocial entregue</h2>
            <p>O Bevart liga o inventário de riscos aos documentos, exames, treinamentos e eventos do eSocial. Teste 5
              dias, sem cartão.</p>
          </div>
          <div class="bv-band__actions">
            <a class="bv-btn bv-btn--light bv-btn--lg"
              href="https://profissionais.bevart.com.br/app/src/login/views/login"
              data-cta="blog-categoria-${cat.slug}">Criar conta grátis</a>
            <a class="bv-btn bv-btn--outline-light bv-btn--lg" href="${prefixo}../index.html#pricing">Ver planos</a>
          </div>
        </div>
      </div>
    </section>
  </main>

  <!-- build:footer -->
${rodape(prefixo)}
  <!-- /build:footer -->

  <button type="button" class="bv-top" id="voltar-ao-topo" aria-label="Voltar ao topo">
    <svg width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"
      aria-hidden="true">
      <path d="M12 19V5M5 12l7-7 7 7" />
    </svg>
  </button>
</body>

</html>
`;

    writeFileSync(join(dir, 'index.html'), html);
    feitos.push(`blog/categoria/${cat.slug}/index.html`);
  }
}

/* ============================ posts ============================ */

function montarPosts() {
  posts.forEach((p, i) => {
    const arquivo = join(DIR_BLOG, p.slug, 'index.html');
    let html = readFileSync(arquivo, 'utf8');

    const anterior = posts[i + 1];
    const proximo = posts[i - 1];

    const relacionados = escolherRelacionados(p);

    const blocoRelacionados = relacionados.length
      ? `    <section class="bv-section bv-section--soft">
      <div class="bv-wrap">
        <div class="bv-section__head">
          <h2>Continue lendo</h2>
          <a class="bv-link" href="../">Ver todos os artigos</a>
        </div>
        <div class="bv-grid">
${relacionados.map((r) => cardPost(r, '../')).join('\n')}
        </div>
      </div>
    </section>`
      : '';

    const blocoPrevNext = (anterior || proximo)
      ? `      <nav class="bv-prevnext" aria-label="Outros artigos">
${anterior ? `        <a href="../${anterior.slug}/"><span>Artigo anterior</span><strong>${esc(anterior.titulo)}</strong></a>` : '        <span></span>'}
${proximo ? `        <a class="is-next" href="../${proximo.slug}/"><span>Próximo artigo</span><strong>${esc(proximo.titulo)}</strong></a>` : '        <span></span>'}
      </nav>`
      : '';

    const trocas = {
      header: cabecalho('../'),
      footer: rodape('../'),
      relacionados: blocoRelacionados,
      prevnext: blocoPrevNext
    };

    for (const [nome, conteudo] of Object.entries(trocas)) {
      const r = substituirBloco(html, nome, conteudo);
      if (!r.trocou) avisos.push(`marcador build:${nome} ausente em blog/${p.slug}/index.html`);
      html = r.html;
    }

    writeFileSync(arquivo, html);
    feitos.push(`blog/${p.slug}/index.html`);
    conferirPost(p, html);
  });
}

/** Relacionados: mesma categoria primeiro, depois tags em comum, depois recentes. */
function escolherRelacionados(post, limite = 3) {
  const outros = posts.filter((p) => p.slug !== post.slug);
  const tags = new Set((post.tags || []).map(semAcento));

  const nota = (p) => {
    let n = 0;
    if (p.categoria === post.categoria) n += 10;
    (p.tags || []).forEach((t) => { if (tags.has(semAcento(t))) n += 3; });
    return n;
  };

  return outros
    .map((p) => ({ p, n: nota(p) }))
    .sort((a, b) => b.n - a.n || (a.p.publicado < b.p.publicado ? 1 : -1))
    .slice(0, limite)
    .map((x) => x.p);
}

/** Conferências de SEO que valem um aviso, não um erro. */
function conferirPost(p, html) {
  const onde = `blog/${p.slug}`;
  if (p.descricao.length > 165) avisos.push(`${onde}: meta description com ${p.descricao.length} caracteres (ideal até 160)`);
  if (p.titulo.length > 70) avisos.push(`${onde}: título com ${p.titulo.length} caracteres (ideal até 60-70)`);
  if (!html.includes(`<link rel="canonical" href="${urlPost(p)}"`)) avisos.push(`${onde}: canonical diferente de ${urlPost(p)}`);
  if ((html.match(/<h1[\s>]/g) || []).length !== 1) avisos.push(`${onde}: a página precisa ter exatamente um H1`);
  if (!existsSync(join(DIR_BLOG, p.slug, p.capa))) avisos.push(`${onde}: capa não encontrada (${p.capa})`);

  const texto = (html.split('<div class="bv-prose"')[1] || '').replace(/<[^>]+>/g, ' ');
  const palavras = texto.split(/\s+/).filter(Boolean).length;
  if (palavras && palavras < 600) avisos.push(`${onde}: só ${palavras} palavras no corpo (posts curtos rankeiam mal)`);

  const minutos = Math.max(1, Math.round(palavras / 200));
  if (palavras && Math.abs(minutos - p.tempoLeitura) > 3) {
    avisos.push(`${onde}: tempoLeitura ${p.tempoLeitura} min, texto sugere ${minutos} min`);
  }
}

/* ============================ header/footer nas demais páginas ============================ */

function sincronizarPaginas() {
  const conhecidos = new Set([
    join(DIR_BLOG, 'index.html'),
    ...posts.map((p) => join(DIR_BLOG, p.slug, 'index.html')),
    ...categorias.map((c) => join(DIR_BLOG, 'categoria', c.slug, 'index.html'))
  ]);

  for (const arquivo of listarPaginas(DIR_BLOG)) {
    if (conhecidos.has(arquivo)) continue;
    let html = readFileSync(arquivo, 'utf8');
    const prefixo = prefixoBlog(arquivo);
    let mudou = false;

    for (const [nome, conteudo] of [['header', cabecalho(prefixo)], ['footer', rodape(prefixo)]]) {
      const r = substituirBloco(html, nome, conteudo);
      if (r.trocou) { html = r.html; mudou = true; }
    }

    if (mudou) {
      writeFileSync(arquivo, html);
      feitos.push(relative(DIR_SITE, arquivo).split(sep).join('/'));
    }
  }
}

/* ============================ sitemap, feed e llms ============================ */

function montarSitemap() {
  const urls = [
    { loc: `${URL_BLOG}/`, lastmod: posts[0]?.atualizado || posts[0]?.publicado, priority: '0.90' },
    ...categorias
      .filter((c) => posts.some((p) => p.categoria === c.slug))
      .map((c) => ({ loc: urlCategoria(c), lastmod: ultimaAtualizacao(c.slug), priority: '0.60' })),
    ...posts.map((p) => ({
      loc: urlPost(p),
      lastmod: p.atualizado || p.publicado,
      priority: p.destaque ? '0.80' : '0.70',
      imagem: `${URL_BLOG}/${p.slug}/${p.capa}`,
      titulo: p.titulo
    }))
  ];

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">
${urls.map((u) => `  <url>
    <loc>${u.loc}</loc>
    <lastmod>${u.lastmod}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>${u.priority}</priority>${u.imagem ? `
    <image:image>
      <image:loc>${u.imagem}</image:loc>
      <image:title>${esc(u.titulo)}</image:title>
    </image:image>` : ''}
  </url>`).join('\n')}
</urlset>
`;

  writeFileSync(join(DIR_BLOG, 'sitemap.xml'), xml);
  feitos.push('blog/sitemap.xml');
}

function ultimaAtualizacao(slugCategoria) {
  const doCat = posts.filter((p) => p.categoria === slugCategoria);
  return doCat.map((p) => p.atualizado || p.publicado).sort().pop();
}

function montarFeed() {
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom" xmlns:content="http://purl.org/rss/1.0/modules/content/">
  <channel>
    <title>${esc(blog.titulo)}</title>
    <link>${URL_BLOG}/</link>
    <description>${esc(blog.descricao)}</description>
    <language>pt-BR</language>
    <lastBuildDate>${posts[0] ? dataRfc822(posts[0].atualizado || posts[0].publicado) : new Date().toUTCString()}</lastBuildDate>
    <atom:link href="${URL_BLOG}/feed.xml" rel="self" type="application/rss+xml" />
${posts.map((p) => `    <item>
      <title>${esc(p.titulo)}</title>
      <link>${urlPost(p)}</link>
      <guid isPermaLink="true">${urlPost(p)}</guid>
      <pubDate>${dataRfc822(p.publicado)}</pubDate>
      <category>${esc(mapaCategorias.get(p.categoria).nome)}</category>
      <description>${esc(p.descricao)}</description>
    </item>`).join('\n')}
  </channel>
</rss>
`;

  writeFileSync(join(DIR_BLOG, 'feed.xml'), xml);
  feitos.push('blog/feed.xml');
}

function montarLlms() {
  const arquivo = join(DIR_SITE, 'llms.txt');
  if (!existsSync(arquivo)) {
    avisos.push('llms.txt não encontrado na raiz');
    return;
  }

  const lista = [
    '',
    ...categorias
      .filter((c) => posts.some((p) => p.categoria === c.slug))
      .map((c) => `- [${c.nome}](${urlCategoria(c)}): ${c.descricao}`),
    '',
    ...posts.map((p) => `- [${p.titulo}](${urlPost(p)}): ${p.descricao}`),
    ''
  ].join('\n');

  let txt = readFileSync(arquivo, 'utf8');
  const re = /(<!-- build:blog -->)[\s\S]*?(<!-- \/build:blog -->)/;

  if (!re.test(txt)) {
    avisos.push('marcador build:blog ausente em llms.txt');
    return;
  }

  txt = txt.replace(re, `$1${lista}$2`);
  writeFileSync(arquivo, txt);
  feitos.push('llms.txt');
}

/* ============================ execução ============================ */

montarHub();
montarCategorias();
montarPosts();
sincronizarPaginas();
montarSitemap();
montarFeed();
montarLlms();

console.log(`\nBevart Blog — build`);
console.log(`  posts publicados : ${posts.length}`);
console.log(`  categorias       : ${categorias.length}`);
console.log(`  arquivos escritos: ${feitos.length}`);
feitos.forEach((f) => console.log(`    · ${f}`));

if (avisos.length) {
  console.log(`\n  avisos (${avisos.length}):`);
  avisos.forEach((a) => console.log(`    ! ${a}`));
} else {
  console.log(`\n  nenhum aviso.`);
}
console.log('');
