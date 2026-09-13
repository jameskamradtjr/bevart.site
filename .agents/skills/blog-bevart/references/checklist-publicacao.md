# Checklist de publicação — Blog Bevart

Passe item por item **antes** de dizer ao usuário que o post está pronto.
O build cobre parte disso automaticamente; o resto é leitura sua.

## 1. Arquivos

- [ ] `blog/<slug>/index.html` existe e nenhum `{{PLACEHOLDER}}` sobrou
      (`grep -c "{{" blog/<slug>/index.html` deve retornar 0)
- [ ] `blog/<slug>/assets/capa.svg` gerado
- [ ] Entrada criada em `blog/posts.json`, no topo do array, com JSON válido
- [ ] `node blog/_build/build.mjs` rodado **sem avisos**

## 2. Cabeça do HTML

- [ ] `<title>` até ~60 caracteres + " | Blog Bevart"
- [ ] `meta description` entre 120 e 158 caracteres, com a palavra-chave
- [ ] `canonical` = `https://bevart.com.br/blog/<slug>/` (com barra no fim)
- [ ] `og:url`, `og:title`, `og:description`, `og:image` preenchidos
- [ ] `article:published_time` e `article:modified_time` batem com o posts.json

## 3. JSON-LD

- [ ] `BlogPosting`: headline igual ao H1, datas corretas, `wordCount` aproximado
- [ ] `BreadcrumbList` com a categoria certa
- [ ] `FAQPage` com as **mesmas** perguntas e respostas que aparecem na página
- [ ] JSON válido: `node -e "JSON.parse(...)"` ou o teste de resultados ricos do Google

## 4. Conteúdo

- [ ] Exatamente um `<h1>`, igual ao `titulo` do posts.json
- [ ] Bloco "O essencial em 30 segundos" com 3 conclusões (não índice)
- [ ] 4 a 7 H2, na ordem em que o leitor pensa
- [ ] Pelo menos um bloco visual (tabela ou callout) a cada 2 ou 3 seções
- [ ] Um CTA no meio + faixa final, ambos ligados ao tema
- [ ] FAQ com 3 a 5 perguntas
- [ ] 2 a 4 links internos para outros posts + 1 para página de solução
- [ ] Nenhum número, prazo ou item de norma que você não consiga sustentar

## 5. Visual e acessibilidade

- [ ] Abra `http://localhost/bevart.site/blog/<slug>/` e confira: sumário lateral
      aparece, barra de progresso anda, botões de compartilhar funcionam
- [ ] Mobile (≤620px): sem rolagem horizontal, tabela rola dentro da própria caixa
- [ ] Todas as imagens com `alt` descritivo e `width`/`height`
- [ ] Hub (`/blog/`) mostra o card novo; filtro da categoria encontra o post; busca
      pelo título encontra o post

## 6. Rede

- [ ] `blog/feed.xml` traz o post no topo
- [ ] `blog/sitemap.xml` traz a URL com `lastmod` de hoje
- [ ] `llms.txt` (raiz) lista o post na seção Blog

## 7. Só quando o usuário pedir

- [ ] `node blog/_build/capa-png.mjs <slug>` para gerar a imagem social em PNG
      (LinkedIn e WhatsApp não renderizam SVG) e, depois, rodar o build de novo
- [ ] commit e push
- [ ] envio da URL ao Google Search Console para indexação
