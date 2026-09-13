/* =====================================================================
 * Bevart — comportamento da home (index.html)
 *
 * Substitui Alpine.js + AOS por JS nativo: a home carrega só este
 * arquivo. As páginas internas continuam usando assets/js/app.js.
 *
 * Contratos mantidos do site antigo, para não quebrar rastreamento:
 *  - atributo data-cta nos links de conversão
 *  - chave localStorage bevart_cookies_accepted_v2
 *  - gtag_report_conversion / gtag_report_whatsapp_conversion (no HTML)
 * ===================================================================== */

(function () {
  'use strict';

  var semMovimento = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var $ = function (sel, ctx) { return (ctx || document).querySelector(sel); };
  var $$ = function (sel, ctx) { return Array.prototype.slice.call((ctx || document).querySelectorAll(sel)); };

  function pronto(fn) {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', fn);
    } else {
      fn();
    }
  }

  pronto(function () {

    /* ---------- header: sombra ao rolar ---------- */
    var header = $('#header');
    if (header) {
      var marcarHeader = function () {
        header.classList.toggle('is-scrolled', window.pageYOffset > 8);
      };
      marcarHeader();
      window.addEventListener('scroll', marcarHeader, { passive: true });
    }

    /* ---------- mega-menu de soluções ---------- */
    var gatilhoMega = $('#mega-trigger');
    var mega = $('#mega-solucoes');

    if (gatilhoMega && mega) {
      var fecharTimer = null;

      var abrirMega = function (aberto) {
        clearTimeout(fecharTimer);
        mega.classList.toggle('is-open', aberto);
        gatilhoMega.setAttribute('aria-expanded', aberto ? 'true' : 'false');
      };

      // Fecha com atraso: sem isso, o menu some enquanto o ponteiro
      // atravessa o vão entre o botão e o painel.
      var agendarFechar = function () {
        fecharTimer = setTimeout(function () { abrirMega(false); }, 180);
      };

      gatilhoMega.addEventListener('click', function () {
        abrirMega(!mega.classList.contains('is-open'));
      });
      gatilhoMega.addEventListener('mouseenter', function () { abrirMega(true); });
      gatilhoMega.addEventListener('mouseleave', agendarFechar);
      mega.addEventListener('mouseenter', function () { abrirMega(true); });
      mega.addEventListener('mouseleave', agendarFechar);
      mega.addEventListener('click', function (e) {
        if (e.target.closest('a')) { abrirMega(false); }
      });

      document.addEventListener('click', function (e) {
        if (!mega.contains(e.target) && !gatilhoMega.contains(e.target)) { abrirMega(false); }
      });
      document.addEventListener('keydown', function (e) {
        if (e.key === 'Escape') { abrirMega(false); }
      });
    }

    /* ---------- menu mobile ---------- */
    var burger = $('#burger');
    var drawer = $('#drawer');

    if (burger && drawer) {
      burger.addEventListener('click', function () {
        var aberto = drawer.classList.toggle('is-open');
        burger.setAttribute('aria-expanded', aberto ? 'true' : 'false');
      });
      drawer.addEventListener('click', function (e) {
        if (e.target.closest('a')) {
          drawer.classList.remove('is-open');
          burger.setAttribute('aria-expanded', 'false');
        }
      });
    }

    /* ---------- reveal ao rolar (no lugar do AOS) ---------- */
    var reveals = $$('.bv-reveal');
    if (semMovimento || !('IntersectionObserver' in window)) {
      reveals.forEach(function (el) { el.classList.add('is-in'); });
    } else {
      var obsReveal = new IntersectionObserver(function (entradas) {
        entradas.forEach(function (e) {
          if (e.isIntersecting) {
            e.target.classList.add('is-in');
            obsReveal.unobserve(e.target);
          }
        });
      }, { rootMargin: '0px 0px -60px 0px', threshold: 0.05 });
      reveals.forEach(function (el) { obsReveal.observe(el); });
    }

    /* ---------- abas: explorar a plataforma ---------- */
    var abas = $$('[data-tab]');
    var paineis = $$('[data-painel]');

    function trocarAba(alvo, focar) {
      abas.forEach(function (b) {
        var ativo = b.getAttribute('data-tab') === alvo;
        b.setAttribute('aria-selected', ativo ? 'true' : 'false');
        b.setAttribute('tabindex', ativo ? '0' : '-1');
        if (ativo && focar) { b.focus(); }
        if (ativo) {
          // Só a trilha rola: scrollIntoView levaria a página junto e
          // a tela saltava a cada troca de aba.
          var trilha = b.parentElement;
          var destino = b.offsetLeft - (trilha.clientWidth - b.offsetWidth) / 2;
          trilha.scrollTo({
            left: Math.max(0, Math.min(destino, trilha.scrollWidth - trilha.clientWidth)),
            behavior: semMovimento ? 'auto' : 'smooth'
          });
        }
      });
      paineis.forEach(function (p) {
        p.hidden = p.getAttribute('data-painel') !== alvo;
      });
    }

    if (abas.length) {
      abas.forEach(function (b, i) {
        b.addEventListener('click', function () { trocarAba(b.getAttribute('data-tab'), false); });
        b.addEventListener('keydown', function (e) {
          if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') { return; }
          e.preventDefault();
          var passo = e.key === 'ArrowRight' ? 1 : -1;
          var prox = abas[(i + passo + abas.length) % abas.length];
          trocarAba(prox.getAttribute('data-tab'), true);
        });
      });
    }

    /* ---------- FAQ ---------- */
    $$('.bv-faq__q').forEach(function (botao) {
      botao.addEventListener('click', function () {
        var resposta = botao.nextElementSibling;
        var aberto = botao.getAttribute('aria-expanded') === 'true';

        $$('.bv-faq__q').forEach(function (outro) {
          if (outro === botao) { return; }
          outro.setAttribute('aria-expanded', 'false');
          outro.nextElementSibling.style.maxHeight = '0px';
        });

        botao.setAttribute('aria-expanded', aberto ? 'false' : 'true');
        // scrollHeight em vez de um max-height fixo: respostas longas
        // ficavam cortadas no mobile com o valor chutado do CSS antigo.
        resposta.style.maxHeight = aberto ? '0px' : resposta.scrollHeight + 'px';
      });
    });

    /* ---------- lightbox das telas ---------- */
    var lightbox = $('#lightbox');
    var lightboxImg = $('#lightbox-img');

    if (lightbox && lightboxImg) {
      var fecharLightbox = function () {
        lightbox.hidden = true;
        lightboxImg.removeAttribute('src');
        document.body.style.overflow = '';
      };

      $$('.bv-shot').forEach(function (botao) {
        botao.addEventListener('click', function () {
          var img = botao.querySelector('img');
          if (!img) { return; }
          lightboxImg.src = img.getAttribute('src');
          lightboxImg.alt = img.getAttribute('alt') || '';
          lightbox.hidden = false;
          document.body.style.overflow = 'hidden';
        });
      });

      lightbox.addEventListener('click', fecharLightbox);
      document.addEventListener('keydown', function (e) {
        if (e.key === 'Escape' && !lightbox.hidden) { fecharLightbox(); }
      });
    }

    /* ---------- vídeo: o player só entra no clique ---------- */
    $$('[data-video]').forEach(function (caixa) {
      var botao = $('.bv-video__btn', caixa);
      if (!botao) { return; }
      botao.addEventListener('click', function () {
        var iframe = document.createElement('iframe');
        iframe.src = 'https://www.youtube.com/embed/' + caixa.getAttribute('data-video') + '?autoplay=1&rel=0';
        iframe.title = 'Demonstração da plataforma Bevart';
        iframe.allow = 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share';
        iframe.allowFullscreen = true;
        caixa.replaceChild(iframe, botao);
      });
    });

    /* ---------- modal do WhatsApp ---------- */
    var waBtn = $('#wa-button');
    var waModal = $('#wa-modal');

    if (waBtn && waModal) {
      var fecharWa = function () {
        waModal.hidden = true;
        document.body.style.overflow = '';
      };
      waBtn.addEventListener('click', function () {
        waModal.hidden = false;
        document.body.style.overflow = 'hidden';
      });
      waModal.addEventListener('click', function (e) {
        if (e.target.closest('[data-fechar]') || e.target.closest('a')) { fecharWa(); }
      });
      document.addEventListener('keydown', function (e) {
        if (e.key === 'Escape' && !waModal.hidden) { fecharWa(); }
      });
    }

    /* ---------- CTA fixo no mobile ----------
     * Aparece quando o hero sai da tela e some no CTA final, para os
     * dois não competirem. */
    var sticky = $('#sticky-cta');
    var fimHero = $('#hero-fim');
    var ctaFinal = $('#contato');

    if (sticky && fimHero && 'IntersectionObserver' in window) {
      var passouHero = false;
      var chegouFim = false;

      var atualizarSticky = function () {
        var mostrar = passouHero && !chegouFim;
        sticky.classList.toggle('is-visible', mostrar);
        sticky.setAttribute('aria-hidden', mostrar ? 'false' : 'true');
        document.body.classList.toggle('has-sticky', mostrar);
      };

      new IntersectionObserver(function (entradas) {
        // Só conta como "passou" quando o sentinela ficou ACIMA da tela;
        // sem o teste de posição o CTA aparecia já no topo da página.
        var e = entradas[0];
        passouHero = !e.isIntersecting && e.boundingClientRect.top < 0;
        atualizarSticky();
      }).observe(fimHero);

      if (ctaFinal) {
        new IntersectionObserver(function (entradas) {
          chegouFim = entradas[0].isIntersecting;
          atualizarSticky();
        }, { threshold: 0 }).observe(ctaFinal);
      }
    }

    /* ---------- consentimento de cookies ---------- */
    var banner = $('#cookie-consent');
    var aceitar = $('#accept-cookies');
    var gatilhoCookie = $('#cookie-settings-trigger');

    if (banner && aceitar && gatilhoCookie) {
      var jaAceitou = false;
      try { jaAceitou = !!localStorage.getItem('bevart_cookies_accepted_v2'); } catch (e) { /* modo privado */ }

      if (jaAceitou) {
        gatilhoCookie.hidden = false;
      } else {
        setTimeout(function () { banner.classList.add('is-open'); }, 800);
      }

      aceitar.addEventListener('click', function () {
        try { localStorage.setItem('bevart_cookies_accepted_v2', 'true'); } catch (e) { /* modo privado */ }
        banner.classList.remove('is-open');
        setTimeout(function () { gatilhoCookie.hidden = false; }, 400);
      });

      var abrirPreferencias = function () {
        banner.classList.add('is-open');
        gatilhoCookie.hidden = true;
      };

      gatilhoCookie.addEventListener('click', abrirPreferencias);
      gatilhoCookie.addEventListener('keydown', function (e) {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          abrirPreferencias();
        }
      });
    }

    /* ---------- qual CTA gerou o clique ----------
     * A conversão é registrada pelo gtag_report_conversion (Google Ads)
     * e pelo bev-tracking.js (Meta). Aqui só marcamos a origem dentro
     * da página, para saber qual seção converte. */
    $$('[data-cta]').forEach(function (link) {
      link.addEventListener('click', function () {
        var origem = link.getAttribute('data-cta');
        if (typeof window.gtag === 'function') {
          window.gtag('event', 'clique_cta', { origem_cta: origem });
        }
        if (typeof window.fbq === 'function') {
          window.fbq('trackCustom', 'CliqueCTA', { origem: origem });
        }
      });
    });

    /* ---------- ano do rodapé ---------- */
    $$('[data-ano]').forEach(function (el) {
      el.textContent = new Date().getFullYear();
    });

  });
})();
