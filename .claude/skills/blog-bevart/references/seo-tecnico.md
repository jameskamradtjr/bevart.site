# SEO técnico — Blog Bevart

Como o site está montado hoje e o que precisa continuar verdadeiro a cada publicação.

## Mapa dos arquivos de descoberta

| Arquivo | Papel | Quem mantém |
|---|---|---|
| `/robots.txt` | libera buscadores e rastreadores de IA, aponta os sitemaps | manual |
| `/sitemap.xml` | **índice** de sitemaps | manual (raro) |
| `/sitemap-paginas.xml` | páginas institucionais e de produto | manual |
| `/blog/sitemap.xml` | hub, categorias e posts, com `image:image` | `build.mjs` |
| `/blog/feed.xml` | RSS 2.0 dos posts | `build.mjs` |
| `/llms.txt` | mapa do site em texto para modelos de linguagem | build injeta os posts |

Ao criar uma **página nova fora do blog**, acrescente a URL em `sitemap-paginas.xml` e,
se for relevante, em `llms.txt`. O build não toca nesses dois.

## URLs

- Padrão: `https://bevart.com.br/blog/<slug>/` — pasta com `index.html`, sempre com
  barra no fim. O Apache resolve `/blog/<slug>` redirecionando para a versão com barra.
- Slug em minúsculas, sem acento, separado por hifens, com a palavra-chave.
- URL publicada **não muda**. Se for inevitável, o novo post assume e o antigo recebe
  `RewriteRule` 301 no `.htaccess`.
- Parâmetros `?q=` e `?categoria=` são bloqueados no robots.txt: filtram o hub, mas não
  geram página nova para indexar.

## Dados estruturados

Cada post carrega um `@graph` com quatro nós:

1. `Organization` (`@id` `https://bevart.com.br/#organization`) — o mesmo id usado na
   home, para o Google costurar as páginas na mesma entidade.
2. `BlogPosting` — headline, description, image, datePublished, dateModified,
   articleSection, keywords, wordCount, author, publisher, isPartOf, mainEntityOfPage.
3. `BreadcrumbList` — Bevart › Blog › Categoria › Post.
4. `FAQPage` — só com perguntas que aparecem visíveis na página. FAQ estruturado que
   não existe no HTML é violação de diretriz do Google.

O hub tem `Blog` + `ItemList` + `BreadcrumbList`; as categorias, `CollectionPage` +
`ItemList` + `BreadcrumbList`. Ambos são gerados pelo build — não edite à mão.

## Imagens

- Capa em SVG (`capa.svg`) para a página: leve, nítida em qualquer tela.
- `og:image` aceita SVG mal: gere `capa.png` com `capa-png.mjs` quando o post for
  divulgado em LinkedIn/WhatsApp. O build passa a usar o PNG sozinho quando ele existe.
- Imagens do corpo: WebP, largura máxima 1200px, `loading="lazy"`, `decoding="async"`,
  `width`/`height` sempre presentes (evita CLS).
- `alt` descreve o conteúdo da imagem. Capa pode repetir o tema; imagem decorativa
  recebe `alt=""`.

## Links internos

O que mais move ranking neste blog:

- Todo post novo deve receber link de pelo menos **um post antigo** relevante (edite o
  antigo, atualize `atualizado` no posts.json e rode o build).
- "Continue lendo" e anterior/próximo são automáticos, mas não substituem o link
  contextual dentro do texto.
- Cada post aponta para uma página de solução do site; as páginas de solução podem
  apontar para o post correspondente quando o usuário pedir.

## Performance (Core Web Vitals)

O blog não usa Tailwind CDN nem Alpine — só `blog.css` e `blog.js`, ambos pequenos.
Mantenha assim:

- nada de biblioteca nova sem necessidade real;
- imagem da capa com `fetchpriority="high"`, as demais `lazy`;
- fonte Inter via Google Fonts com `preconnect` (já no template);
- scripts sempre com `defer`.

## Rastreadores de IA

`robots.txt` libera GPTBot, OAI-SearchBot, ClaudeBot, Claude-User, PerplexityBot,
Google-Extended, Applebot-Extended, CCBot e outros — decisão deliberada: queremos ser
citados por assistentes. `llms.txt` dá a esses modelos um mapa curto do site.

Para ser bem citado por LLM, o post precisa de: resposta direta no começo, blocos
"O essencial em 30 segundos", FAQ objetivo e tabelas — formatos que o modelo consegue
extrair sem ambiguidade. Isso não é enfeite: é o que faz o conteúdo ser reaproveitado.

## Depois de publicar

1. Google Search Console → Inspeção de URL → Solicitar indexação.
2. Confira o post no teste de resultados ricos (rich results) do Google.
3. Se o post substituir conteúdo do antigo `blog.bevart.com.br`, configure o 301 —
   o `.htaccess` já tem o bloco pronto, comentado.
