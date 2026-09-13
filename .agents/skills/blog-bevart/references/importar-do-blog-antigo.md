# Importar posts do blog.bevart.com.br

O blog antigo é WordPress em subdomínio. A migração é post a post, sob demanda do
usuário. O que não pode ser perdido: **a URL, a data original e as imagens**.

## Regra número um: o slug não muda

O post novo usa **exatamente o mesmo slug** do antigo.

```
antigo:  https://blog.bevart.com.br/<slug>/
novo:    https://bevart.com.br/blog/<slug>/
```

Com os slugs iguais, a migração inteira cabe em uma regra de redirect — a que já está
pronta e comentada no `.htaccess` da raiz. Slug diferente significa mapear URL por URL
e perder autoridade no caminho. Se o slug antigo for horrível, ainda assim mantenha:
o ganho de SEO de uma URL indexada supera a estética.

## Passo a passo

1. **Puxe o conteúdo** com WebFetch, pedindo transcrição integral: título, data, autor,
   corpo com H2/H3, listas, citações, **URLs de todas as imagens** e links do texto.
2. **Baixe as imagens** para `blog/<slug>/assets/`, com nomes descritivos em kebab-case
   (`relatorio-psicossocial.png`, não `IMG_2024_final-1024x509.png`):
   ```bash
   curl -sS -L -o "blog/<slug>/assets/<nome>.png" "<url-da-imagem>"
   ```
   Antes de baixar, confira se a imagem já existe em `assets/telas/` — várias telas do
   sistema estão no repositório, muitas com versão `.webp` menor. Prefira o `.webp`.
3. **Abra cada imagem** antes de escrever o `alt`. Descreva o que a tela mostra, não o
   nome do arquivo. Banner promocional vertical não vira ilustração de artigo — baixe,
   mas não use no corpo.
4. **Todas as imagens do corpo vão dentro de `<figure>`** com `figcaption`, `width`,
   `height` e `loading="lazy"`. O arredondamento vem do CSS.
5. **Capa:** gere a padrão com `capa.mjs`. A imagem destacada do WordPress quase nunca
   serve (é banner de rede social, em formato vertical).
6. **Preserve a data original** em `publicado` e coloque a data da importação em
   `atualizado`. Registre a URL antiga no campo `origem` do `posts.json`.
7. **Autor:** posts do blog antigo são do James. Use `james-kamradt-jr` e o nó `Person`
   no JSON-LD, com os `sameAs` das redes dele. Conteúdo novo da casa vai como
   `equipe-bevart`.
8. `capa.mjs` → `build.mjs` → `verificar.mjs`, sem avisos.

## O que adaptar e o que preservar

**Preserve:** o argumento, a ordem das seções, os exemplos, a voz do autor e as
afirmações sobre o produto.

**Corrija sem pedir:** erros de digitação e concordância, títulos em Caps Case (o blog
novo usa frase capitalizada), parágrafos gigantes, "clique aqui".

**Adicione:** meta description, bloco "O essencial em 30 segundos", FAQ com 3 a 5
perguntas (os posts do WordPress não têm) e os links internos para os posts já
migrados.

**Suavize e avise ao usuário:** afirmação de fonte não verificável ("baseado em
metodologia do SUS"), promessa absoluta ("garante conformidade") e prazo ou número de
norma que você não consegue sustentar.

## Links entre posts antigos

Post antigo costuma linkar outro post antigo. **Nunca aponte para blog.bevart.com.br**
no conteúdo novo — o subdomínio vai ser desativado. Se o destino ainda não foi migrado,
tire o link e anote na resposta ao usuário quais posts ficaram pendentes de religar.
Quando migrar o destino, volte no post que o citava, refaça o link, atualize
`atualizado` e rode o build.

## Redirect, no fim da migração

No `.htaccess` da raiz, descomente:

```apache
RewriteCond %{HTTP_HOST} ^blog[.]bevart[.]com[.]br$ [NC]
RewriteRule ^(.*)$ https://bevart.com.br/blog/$1 [R=301,L]
```

Isso só funciona se o subdomínio apontar para o mesmo host. Se o WordPress estiver em
outro servidor, o 301 tem que ser configurado lá (plugin de redirect ou regra do
próprio painel). Só faça isso quando **todos** os posts estiverem migrados.
