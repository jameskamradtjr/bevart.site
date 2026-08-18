/* =====================================================================
 * Bevart Blog — comportamento
 *
 * Vanilla JS, sem dependências. Todo bloco checa se o elemento existe,
 * porque o mesmo arquivo roda no hub, nas categorias e nos posts.
 *
 * Importante: nada aqui gera conteúdo. Os cards e o texto dos posts são
 * HTML estático (bom para SEO e para quem está sem JS); o script só
 * filtra, destaca e facilita a leitura.
 * ===================================================================== */

(function () {
  'use strict';

  var semMovimento = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function pronto(fn) {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', fn);
    } else {
      fn();
    }
  }

  function slugificar(texto) {
    return texto
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9\s-]/g, '')
      .trim()
      .replace(/\s+/g, '-')
      .slice(0, 60);
  }

  function normalizar(texto) {
    return (texto || '')
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '');
  }

  function evento(nome, params) {
    if (typeof window.gtag === 'function') {
      window.gtag('event', nome, params || {});
    }
  }

  pronto(function () {

    /* ---------- abrindo por file:// (duplo clique, sem servidor) ----------
     * Servidor nenhum = ninguem resolve pasta -> index.html. Os links do blog
     * apontam para pastas (/blog/slug/) porque é assim que a URL fica em
     * produção; aqui completamos com index.html só quando o protocolo é file:,
     * para dar pra navegar no blog inteiro sem subir o Apache. */
    if (window.location.protocol === 'file:') {
      Array.prototype.slice.call(document.querySelectorAll('a[href]')).forEach(function (link) {
        var href = link.getAttribute('href');
        if (!href || /^(https?:|mailto:|tel:|#|data:)/.test(href)) { return; }
        var partes = href.split('#');
        if (partes[0] === '' || partes[0] === './') {
          partes[0] = 'index.html';
        } else if (partes[0].slice(-1) === '/') {
          partes[0] += 'index.html';
        } else {
          return;
        }
        link.setAttribute('href', partes.join('#'));
      });
    }

    /* ---------- menu mobile ---------- */
    var burger = document.querySelector('[data-burger]');
    var menuMobile = document.getElementById('menu-mobile');

    if (burger && menuMobile) {
      burger.addEventListener('click', function () {
        var aberto = menuMobile.classList.toggle('is-open');
        burger.setAttribute('aria-expanded', aberto ? 'true' : 'false');
      });
    }

    /* ---------- busca e filtro de categoria (hub e categorias) ---------- */
    var lista = document.getElementById('lista-posts');

    if (lista) {
      var cards = Array.prototype.slice.call(lista.querySelectorAll('[data-post]'));
      var campoBusca = document.getElementById('busca');
      var botoesFiltro = Array.prototype.slice.call(document.querySelectorAll('[data-filtro]'));
      var vazio = document.getElementById('sem-resultados');
      var destaque = document.getElementById('post-destaque');
      var contador = document.getElementById('contador-posts');
      var categoriaAtual = 'todas';

      var aplicar = function () {
        var termo = normalizar(campoBusca ? campoBusca.value : '').trim();
        var visiveis = 0;

        cards.forEach(function (card) {
          var casaCategoria = categoriaAtual === 'todas' || card.dataset.categoria === categoriaAtual;
          var casaTermo = !termo || normalizar(card.dataset.busca || card.textContent).indexOf(termo) !== -1;
          var mostrar = casaCategoria && casaTermo;
          card.hidden = !mostrar;
          if (mostrar) { visiveis++; }
        });

        // o destaque só faz sentido na visão sem filtro
        if (destaque) {
          destaque.hidden = !!termo || categoriaAtual !== 'todas';
        }

        if (vazio) {
          vazio.classList.toggle('is-visible', visiveis === 0);
        }

        if (contador) {
          // o post em destaque continua contando quando está visível
          var total = visiveis + (destaque && !destaque.hidden ? 1 : 0);
          contador.textContent = total === 1 ? '1 artigo' : total + ' artigos';
        }
      };

      if (campoBusca) {
        var timerBusca;
        campoBusca.addEventListener('input', function () {
          clearTimeout(timerBusca);
          timerBusca = setTimeout(function () {
            aplicar();
            if (campoBusca.value.length > 2) {
              evento('blog_busca', { termo: campoBusca.value });
            }
          }, 120);
        });
      }

      botoesFiltro.forEach(function (botao) {
        botao.addEventListener('click', function () {
          categoriaAtual = botao.dataset.filtro;
          botoesFiltro.forEach(function (b) {
            var ativo = b === botao;
            b.classList.toggle('is-active', ativo);
            b.setAttribute('aria-pressed', ativo ? 'true' : 'false');
          });
          aplicar();
          evento('blog_filtro_categoria', { categoria: categoriaAtual });
        });
      });

      // permite chegar pela URL: /blog/?categoria=esocial&q=pgr
      var params = new URLSearchParams(window.location.search);
      var catUrl = params.get('categoria');
      var qUrl = params.get('q');

      if (catUrl) {
        var alvo = botoesFiltro.filter(function (b) { return b.dataset.filtro === catUrl; })[0];
        if (alvo) { alvo.click(); }
      }

      if (qUrl && campoBusca) {
        campoBusca.value = qUrl;
      }

      aplicar();
    }

    /* ---------- página do post ---------- */
    var artigo = document.querySelector('.bv-prose');

    if (artigo) {
      /* ids nos títulos + sumário automático */
      var titulos = Array.prototype.slice.call(artigo.querySelectorAll('h2, h3'));
      var usados = {};

      titulos.forEach(function (titulo) {
        if (!titulo.id) {
          var base = slugificar(titulo.textContent) || 'secao';
          usados[base] = (usados[base] || 0) + 1;
          titulo.id = usados[base] > 1 ? base + '-' + usados[base] : base;
        }
      });

      var toc = document.getElementById('sumario');

      if (toc && titulos.length > 2) {
        var ol = document.createElement('ol');

        titulos.forEach(function (titulo) {
          var li = document.createElement('li');
          if (titulo.tagName === 'H3') { li.className = 'is-sub'; }
          var a = document.createElement('a');
          a.href = '#' + titulo.id;
          a.textContent = titulo.textContent;
          li.appendChild(a);
          ol.appendChild(li);
        });

        toc.appendChild(ol);
        toc.hidden = false;

        /* scrollspy */
        var links = Array.prototype.slice.call(toc.querySelectorAll('a'));

        if ('IntersectionObserver' in window) {
          var visiveisIds = [];

          var observer = new IntersectionObserver(function (entradas) {
            entradas.forEach(function (entrada) {
              var id = entrada.target.id;
              var i = visiveisIds.indexOf(id);
              if (entrada.isIntersecting && i === -1) { visiveisIds.push(id); }
              if (!entrada.isIntersecting && i !== -1) { visiveisIds.splice(i, 1); }
            });

            var ativo = titulos.filter(function (t) {
              return visiveisIds.indexOf(t.id) !== -1;
            })[0];

            if (ativo) {
              links.forEach(function (l) {
                l.classList.toggle('is-active', l.getAttribute('href') === '#' + ativo.id);
              });
            }
          }, { rootMargin: '-88px 0px -70% 0px' });

          titulos.forEach(function (t) { observer.observe(t); });
        }
      } else if (toc) {
        toc.remove();
      }

      /* tabelas ganham rolagem própria no mobile */
      Array.prototype.slice.call(artigo.querySelectorAll('table')).forEach(function (tabela) {
        if (tabela.parentElement && tabela.parentElement.classList.contains('bv-table-wrap')) { return; }
        var wrap = document.createElement('div');
        wrap.className = 'bv-table-wrap';
        tabela.parentNode.insertBefore(wrap, tabela);
        wrap.appendChild(tabela);
      });

      /* links externos abrem em nova aba com rel seguro */
      Array.prototype.slice.call(artigo.querySelectorAll('a[href^="http"]')).forEach(function (link) {
        if (link.hostname === window.location.hostname) { return; }
        link.target = '_blank';
        link.rel = 'noopener';
      });

      /* barra de progresso de leitura */
      var progresso = document.getElementById('progresso-leitura');

      if (progresso && !semMovimento) {
        var atualizarProgresso = function () {
          var caixa = artigo.getBoundingClientRect();
          var total = caixa.height - window.innerHeight;
          var lido = total > 0 ? (-caixa.top / total) : (caixa.top < 0 ? 1 : 0);
          progresso.style.width = Math.max(0, Math.min(1, lido)) * 100 + '%';
        };
        atualizarProgresso();
        window.addEventListener('scroll', atualizarProgresso, { passive: true });
        window.addEventListener('resize', atualizarProgresso);
      }

      /* marcos de leitura no analytics (25/50/75/100%) */
      var marcos = [25, 50, 75, 100];
      var marcados = {};

      window.addEventListener('scroll', function () {
        var caixa = artigo.getBoundingClientRect();
        var total = caixa.height - window.innerHeight;
        if (total <= 0) { return; }
        var pct = Math.round(Math.max(0, Math.min(1, -caixa.top / total)) * 100);

        marcos.forEach(function (m) {
          if (pct >= m && !marcados[m]) {
            marcados[m] = true;
            evento('blog_leitura', { percentual: m, post: document.title });
          }
        });
      }, { passive: true });
    }

    /* ---------- compartilhamento ---------- */
    var share = document.querySelector('[data-share]');

    if (share) {
      var url = (document.querySelector('link[rel="canonical"]') || {}).href || window.location.href;
      var titulo = document.title.split(' | ')[0];

      var destinos = {
        linkedin: 'https://www.linkedin.com/sharing/share-offsite/?url=' + encodeURIComponent(url),
        whatsapp: 'https://wa.me/?text=' + encodeURIComponent(titulo + ' ' + url),
        x: 'https://twitter.com/intent/tweet?text=' + encodeURIComponent(titulo) + '&url=' + encodeURIComponent(url),
        facebook: 'https://www.facebook.com/sharer/sharer.php?u=' + encodeURIComponent(url)
      };

      Array.prototype.slice.call(share.querySelectorAll('[data-rede]')).forEach(function (botao) {
        var rede = botao.dataset.rede;

        if (destinos[rede]) {
          botao.setAttribute('href', destinos[rede]);
          botao.setAttribute('target', '_blank');
          botao.setAttribute('rel', 'noopener');
          botao.addEventListener('click', function () {
            evento('blog_compartilhar', { rede: rede, post: titulo });
          });
          return;
        }

        if (rede === 'copiar') {
          botao.addEventListener('click', function () {
            var textoOriginal = botao.querySelector('span');

            var confirmar = function () {
              if (textoOriginal) {
                textoOriginal.textContent = 'Link copiado';
                setTimeout(function () { textoOriginal.textContent = 'Copiar link'; }, 2200);
              }
              evento('blog_compartilhar', { rede: 'copiar', post: titulo });
            };

            if (navigator.clipboard) {
              navigator.clipboard.writeText(url).then(confirmar);
            } else {
              var campo = document.createElement('input');
              campo.value = url;
              document.body.appendChild(campo);
              campo.select();
              document.execCommand('copy');
              document.body.removeChild(campo);
              confirmar();
            }
          });
        }
      });
    }

    /* ---------- voltar ao topo ---------- */
    var topo = document.getElementById('voltar-ao-topo');

    if (topo) {
      var alternarTopo = function () {
        topo.classList.toggle('is-visible', window.pageYOffset > 900);
      };
      alternarTopo();
      window.addEventListener('scroll', alternarTopo, { passive: true });
      topo.addEventListener('click', function () {
        window.scrollTo({ top: 0, behavior: semMovimento ? 'auto' : 'smooth' });
      });
    }

    /* ---------- ano no rodapé ---------- */
    Array.prototype.slice.call(document.querySelectorAll('[data-ano]')).forEach(function (el) {
      el.textContent = new Date().getFullYear();
    });
  });
})();
