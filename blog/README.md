# Blog Bevart — como isso funciona

Blog estático em HTML, CSS e JS puros, dentro de `bevart.com.br/blog/`.
Sem WordPress, sem banco, sem build de framework: **uma pasta por post**.

O "painel" é a IA. Você pede o post, ela escreve o HTML, registra os metadados e
roda o build. A skill que ensina isso está em `.claude/skills/blog-bevart/`.

## Pedir um post novo

No Claude Code, dentro desta pasta:

```
escreva um post sobre <tema>
```

A skill `blog-bevart` cuida do resto: cria `blog/<slug>/index.html`, registra em
`posts.json`, gera a capa e roda o build.

## Fazer na mão (se precisar)

```bash
# 1. copie o template
cp blog/_templates/post.html blog/meu-post/index.html

# 2. escreva o texto e troque todos os {{CAMPOS}}
# 3. registre o post no topo do array "posts" de blog/posts.json

# 4. capa (SVG 1200x630 com o título)
node blog/_build/capa.mjs meu-post

# 5. build: cards, categorias, relacionados, sitemap, feed e llms.txt
node blog/_build/build.mjs

# 6. conferência: JSON-LD, links quebrados, H1, alt, XML
node blog/_build/verificar.mjs
```

Opcional, para compartilhar em LinkedIn/WhatsApp (que não leem SVG):

```bash
npm i -D puppeteer
node blog/_build/capa-png.mjs meu-post && node blog/_build/build.mjs
```

## Estrutura

```
blog/
  index.html                    hub (o conteúdo dinâmico vem do build)
  posts.json                    fonte única de metadados
  feed.xml, sitemap.xml         gerados — não edite
  categoria/<slug>/             gerados — não edite
  <slug>/index.html             o post
  <slug>/assets/                imagens só desse post
  assets/css/blog.css           todo o CSS
  assets/js/blog.js             busca, filtro, sumário, progresso, share
  assets/js/analytics.js        GA4 + Google Ads + Meta Pixel
  _templates/                   template do post e catálogo de blocos
  _build/                       build, gerador de capa e verificador
```

## Links

Toda navegação termina em `index.html` (`../categoria/esocial/index.html`). Link para
pasta só funciona quando existe um servidor resolvendo o DirectoryIndex, e o blog
precisa abrir também direto do disco.

As URLs canônicas, o sitemap e o feed seguem na forma limpa `/blog/slug/`, que é a
versão indexada pelo Google — o canonical junta as duas pontas.

## Regra única que não pode ser quebrada

Tudo entre `<!-- build:algo -->` e `<!-- /build:algo -->` pertence ao build.
Cabeçalho, rodapé, cards, relacionados e navegação anterior/próximo são reescritos a
cada execução. Para mudar o menu ou o rodapé de **todas** as páginas, edite as funções
`cabecalho` e `rodape` em `_build/build.mjs` e rode o build.

## SEO

- Cada post: canonical, Open Graph, Twitter Card e JSON-LD com `BlogPosting`,
  `BreadcrumbList` e `FAQPage`.
- `/sitemap.xml` é um índice que aponta para `/sitemap-paginas.xml` e
  `/blog/sitemap.xml` (este último regerado a cada build).
- `/robots.txt` libera buscadores e rastreadores de IA (GPTBot, ClaudeBot,
  PerplexityBot, Google-Extended e outros).
- `/llms.txt` é o mapa do site para modelos de linguagem; a lista de posts dentro dele
  é atualizada pelo build.

## Migração do blog.bevart.com.br

Os links do site já apontam para `/blog/`. Quando quiser aposentar o subdomínio,
descomente o bloco de redirect 301 no `.htaccess` da raiz (só funciona se o subdomínio
apontar para este mesmo host) ou configure o redirecionamento no painel da hospedagem.
