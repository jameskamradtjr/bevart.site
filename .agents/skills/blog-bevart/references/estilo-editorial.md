# Estilo editorial — Blog Bevart

## Para quem escrevemos

Técnico de segurança, engenheiro, médico do trabalho e dono de consultoria de SST.
Gente que **executa**: monta PGR, agenda exame, transmite evento, apanha de prazo.
Não escrevemos para o RH genérico nem para estudante de NR.

Consequência prática: o leitor já sabe o que é PGR. Ele não precisa de "a segurança do
trabalho é muito importante". Ele precisa saber **como fazer sem errar**.

## Voz

- Direta, técnica, sem juridiquês e sem palestra motivacional.
- Segunda pessoa quando ajudar ("você monta o inventário"), impessoal quando for norma.
- Frases curtas. Um parágrafo, uma ideia. Máximo 4 linhas por parágrafo.
- Português do Brasil, formal mas conversado. Nada de "outrossim", nada de gíria.
- Nunca prometer resultado ("garanta 100% de conformidade"). Descrever o mecanismo.

## Estrutura padrão de um post

1. **Abertura (2 a 3 parágrafos).** Comece pelo problema concreto que o leitor vive,
   não pela definição. A dúvida central é respondida nas primeiras 5 linhas — quem só
   lê o começo já sai com resposta.
2. **Resumo "O essencial em 30 segundos"** (bloco `bv-takeaways`): 3 bullets com as
   conclusões, não com o índice do texto.
3. **4 a 7 seções H2**, cada uma respondendo a uma pergunta real. H3 só quando a seção
   tiver de fato subpartes.
4. **Um bloco visual a cada 2 ou 3 seções**: tabela, callout, lista numerada. Parede de
   texto derruba tempo de leitura.
5. **Um CTA no meio** (`bv-inline-cta`), depois do 2º ou 3º H2, ligado ao assunto do
   parágrafo anterior — nunca genérico.
6. **FAQ com 3 a 5 perguntas** escritas como o usuário digitaria no Google.
7. **Fechamento sem "conclusão".** Termine com o que fazer a seguir, não com resumo.

Extensão: 1.200 a 2.000 palavras para guia; 800 a 1.200 para resposta pontual. Abaixo
de 600 o build reclama — e o Google também.

## Títulos

- H1 = `titulo` do posts.json, até ~70 caracteres, com a palavra-chave no começo.
- Prefira o formato que promete entrega: "Como montar o PGR: inventário de riscos e
  plano de ação na prática".
- Evite: título com "tudo sobre", "guia definitivo", "o que você precisa saber".
- H2 descritivo, não criativo. O sumário lateral é montado a partir deles: precisa ler
  como um índice útil.

## Como falar do produto

O Bevart aparece **três vezes no máximo**: CTA lateral, CTA do meio e faixa final.
Dentro do texto, só quando a menção for factual e útil ("no Bevart, o mesmo risco do
inventário alimenta o S-2240"). Nunca comparativo com concorrente, nunca superlativo.

Um link contextual para uma página de solução do site (`../../sistema-pgr-online.html`)
por post é bom para SEO; dois já parece anúncio.

## Links internos (obrigatório)

- 2 a 4 links para outros posts do blog, com âncora descritiva ("inventário de riscos
  do PGR"), nunca "clique aqui".
- 1 link para uma página de solução do site quando fizer sentido.
- Links externos: só para fonte oficial (gov.br, planalto, INSS). Abrem em nova aba
  automaticamente — o `blog.js` cuida disso.

## Rigor técnico (inegociável)

- Não invente número de item de NR, prazo ou valor de multa.
- Prazos que citamos com segurança: S-2210 até o primeiro dia útil seguinte (imediato
  em caso de óbito); S-2220 e S-2240 até o dia 15 do mês seguinte.
- Quando a norma mudou recentemente ou está em transição, descreva o princípio e diga
  que o prazo deve ser conferido na redação vigente — nunca chute data de vigência.
- Diferencie o que é exigência da norma do que é boa prática nossa. O leitor usa isso
  para se defender em auditoria.

## Palavras e hábitos a evitar

- "Solução completa", "revolucionário", "tudo que você precisa", "no mundo de hoje".
- Emojis no corpo do texto.
- Travessão duplo em substituição a vírgula em toda frase — use com parcimônia.
- Listas de 10 itens onde 4 resolvem.
- Repetir a palavra-chave até soar robótico: 3 a 5 vezes em 1.500 palavras basta.

## Imagens

Capa: sempre gerada por `capa.mjs` (SVG com o título). Imagens no corpo só quando
mostram algo — fluxo, tela, tabela complexa. Nome de arquivo descritivo com hifens,
`alt` que descreve o conteúdo (não "imagem do post"), `loading="lazy"` e `width`/
`height` para não causar salto de layout.
