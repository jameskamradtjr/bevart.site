---
name: blog-bevart
description: Cria, atualiza e publica posts no blog em HTML estático do bevart.com.br (pasta blog/). Use sempre que o pedido for "escreve um post sobre X", "cria um artigo de blog", "atualiza o post Y", "publica no blog", "novo conteúdo para o blog", ou quando envolver blog/posts.json, capas de post, sitemap/feed do blog e SEO dos artigos.
---

# Blog Bevart — CMS em HTML

Você é o CMS deste blog. Não existe painel, banco nem build de framework: existe uma
pasta, um JSON e um script. Um post publicado significa **quatro coisas feitas**:
pasta criada, `posts.json` atualizado, capa gerada e `build.mjs` rodado.

## Arquitetura (leia antes de tocar em qualquer arquivo)

```
blog/
  index.html                      hub — cards e filtros são injetados pelo build
  posts.json                      FONTE ÚNICA de metadados (o "banco de dados")
  feed.xml  sitemap.xml           gerados pelo build, nunca editados à mão
  categoria/<slug>/index.html     gerados inteiros pelo build
  <slug-do-post>/
    index.html                    o post (você escreve este arquivo)
    assets/                       imagens só deste post (capa.svg, gráficos…)
  assets/css/blog.css             todo o CSS do blog
  assets/js/blog.js               busca, filtro, sumário, progresso, compartilhar
  assets/js/analytics.js          GA4, Google Ads, Meta Pixel
  _templates/post.html            template a copiar
  _templates/blocos.html          catálogo de blocos editoriais
  _build/build.mjs                gera cards, categorias, relacionados, feed, sitemap
  _build/capa.mjs                 gera a capa SVG do post
  _build/capa-png.mjs             opcional: rasteriza a capa para og:image
```

Regra de ouro: **nada entre `<!-- build:algo -->` e `<!-- /build:algo -->` é escrito
por você.** Header, footer, relacionados, anterior/próximo, cards do hub e JSON-LD do
hub são do build. Se precisar mudar o menu ou o rodapé, mude em `_build/build.mjs`
(funções `cabecalho` e `rodape`) e rode o build — a mudança entra em todas as páginas.

## Fluxo para publicar um post

1. **Confirme o essencial com o usuário** — só o que muda o resultado: tema/pergunta
   que o post responde e, se não for óbvio, a categoria. Ângulo, título e estrutura
   você propõe. Não faça entrevista longa.
2. **Defina o slug**: minúsculas, sem acento, hifens, 3 a 7 palavras, com a palavra-chave.
   O slug é a URL e **não muda depois de publicado** (mudar exige redirect 301).
3. **Crie a pasta** `blog/<slug>/` e copie `blog/_templates/post.html` para
   `blog/<slug>/index.html`. Troque **todos** os `{{CAMPOS}}` — nenhum `{{` pode sobrar.
4. **Escreva o post** seguindo `references/estilo-editorial.md`.
5. **Registre em `blog/posts.json`**, no topo do array `posts` (veja o schema abaixo).
6. **Gere a capa**: `node blog/_build/capa.mjs <slug>`
7. **Rode o build**: `node blog/_build/build.mjs`
8. **Verifique**: `node blog/_build/verificar.mjs` — JSON-LD, links quebrados, H1,
   `alt`, XML e classes de CSS que quebram o `.bv-wrap`.
   **Leia os avisos dos dois e corrija todos.** Aviso ignorado é erro publicado.
9. **Responda ao usuário** com a URL local (`http://localhost/bevart.site/blog/<slug>/`),
   a URL de produção e o que o build mudou.

Nunca faça commit nem push sem o usuário pedir.

## Campo a campo do posts.json

```json
{
  "slug": "igual ao nome da pasta",
  "titulo": "título real do post, até ~70 caracteres",
  "dek": "1 ou 2 frases que aparecem no card e abaixo do H1",
  "descricao": "meta description, 120 a 158 caracteres, com a palavra-chave",
  "categoria": "slug de uma das categorias já existentes",
  "tags": ["3 a 6 termos"],
  "palavraChave": "a busca principal que o post persegue",
  "autor": "equipe-bevart",
  "publicado": "AAAA-MM-DD",
  "atualizado": "AAAA-MM-DD",
  "tempoLeitura": 8,
  "capa": "assets/capa.svg",
  "capaAlt": "descrição objetiva da capa",
  "destaque": false,
  "rascunho": false
}
```

- `destaque: true` em **um único post** — é o card grande do topo do hub.
- `rascunho: true` mantém o post fora do hub, do sitemap e do feed (a pasta pode existir).
- `tempoLeitura` ≈ palavras ÷ 200. O build reclama se estiver muito longe do texto real.
- Categoria nova exige entrada no array `categorias` (com `tituloSeo` e `descricaoSeo`);
  o build cria a página `/blog/categoria/<slug>/` sozinho.

## O que o build faz por você

`node blog/_build/build.mjs` reescreve, sem apagar seu texto:

- cabeçalho e rodapé de todas as páginas do blog;
- card em destaque, cards do hub, botões de filtro e grade de categorias;
- as seis páginas de categoria, inteiras;
- "Continue lendo" (relacionados por categoria e tags) e anterior/próximo em cada post;
- `blog/sitemap.xml`, `blog/feed.xml` e a seção do blog em `llms.txt`.

E confere: canonical correto, um único H1, capa existente, tamanho de título e
description, contagem de palavras e coerência do tempo de leitura.

## Erros que não podem acontecer

- Publicar sem rodar o build — o post fica órfão: fora do hub, do sitemap e do feed.
- Editar `feed.xml`, `sitemap.xml` ou `blog/categoria/**` à mão: o build sobrescreve.
- Reaproveitar slug de post existente, ou mudar slug já publicado sem 301.
- Deixar `{{PLACEHOLDER}}` no HTML publicado.
- Copiar o JSON-LD do template sem trocar perguntas e respostas do `FAQPage`:
  o FAQ estruturado **precisa** repetir, em texto puro, o que está visível na página.
- Inventar número, prazo ou artigo de norma. Em SST, dado errado vira multa para o
  leitor. Se não tiver certeza, escreva o princípio sem citar o número, ou verifique.

## Atualizar um post existente

Edite o HTML, atualize `atualizado` no `posts.json`, ajuste `dateModified` e
`article:modified_time` no próprio arquivo e rode o build. Mantenha a URL. Se o post
mudou de assunto a ponto de merecer outro slug, publique novo e deixe o antigo com um
link para o novo — não delete página indexada.

## Referências

- `references/estilo-editorial.md` — voz, estrutura, títulos, CTAs e o que evitar.
- `references/checklist-publicacao.md` — checagem final antes de entregar.
- `references/seo-tecnico.md` — canonical, JSON-LD, imagens, links internos, IA/LLM.
- `blog/_templates/blocos.html` — HTML de callout, tabela, CTA, FAQ, citação, figura.
