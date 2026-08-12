/* =====================================================================
 * Bevart — comportamento do site
 *
 * Carregado por todas as páginas. Cada bloco verifica se o elemento
 * existe antes de agir, porque as páginas internas têm estruturas
 * diferentes da home.
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

  pronto(function () {

    /* ---------- animações de entrada ---------- */
    if (typeof AOS !== 'undefined') {
      AOS.init({
        duration: semMovimento ? 0 : 600,
        easing: 'ease-out-cubic',
        once: true,
        offset: 60,
        disable: semMovimento
      });
    }

    /* ---------- navbar ao rolar ---------- */
    var navbar = document.getElementById('navbar');
    var navbarWrapper = document.getElementById('navbar-wrapper');

    if (navbar && navbarWrapper) {
      var aplicarEstadoNavbar = function () {
        var rolou = window.pageYOffset > 40;
        navbar.classList.toggle('scrolled', rolou);
        navbarWrapper.style.paddingTop = rolou ? '8px' : '16px';
      };
      aplicarEstadoNavbar();
      window.addEventListener('scroll', aplicarEstadoNavbar, { passive: true });
    }

    /* ---------- CTA fixo no mobile ----------
     * Aparece quando o hero sai da tela e some no rodapé, para não
     * competir com o CTA final. */
    var stickyCta = document.getElementById('sticky-cta');
    var fimDoHero = document.getElementById('hero-fim');
    var ctaFinal = document.getElementById('contato');

    if (stickyCta && fimDoHero && 'IntersectionObserver' in window) {
      var passouDoHero = false;
      var chegouNoFim = false;

      var atualizarSticky = function () {
        var mostrar = passouDoHero && !chegouNoFim;
        stickyCta.classList.toggle('is-visible', mostrar);
        stickyCta.setAttribute('aria-hidden', mostrar ? 'false' : 'true');
        document.body.classList.toggle('has-sticky-cta', mostrar);
      };

      new IntersectionObserver(function (entradas) {
        // Só conta como "passou" quando o fim do hero ficou ACIMA da tela.
        // Sem o teste de posição, o CTA apareceria já no topo da página,
        // porque o sentinela nasce fora da viewport.
        var e = entradas[0];
        passouDoHero = !e.isIntersecting && e.boundingClientRect.top < 0;
        atualizarSticky();
      }).observe(fimDoHero);

      if (ctaFinal) {
        new IntersectionObserver(function (entradas) {
          chegouNoFim = entradas[0].isIntersecting;
          atualizarSticky();
          // threshold 0: em telas pequenas a seção final é mais alta que a
          // viewport e um threshold maior nunca seria atingido.
        }, { threshold: 0 }).observe(ctaFinal);
      }
    }

    /* ---------- vídeo: só carrega o player no clique ---------- */
    document.querySelectorAll('[data-video]').forEach(function (caixa) {
      var botao = caixa.querySelector('.bv-video-btn');
      if (!botao) { return; }

      botao.addEventListener('click', function () {
        var iframe = document.createElement('iframe');
        iframe.src = 'https://www.youtube.com/embed/' + caixa.getAttribute('data-video') + '?autoplay=1&rel=0';
        iframe.title = 'Apresentação da plataforma Bevart';
        iframe.allow = 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share';
        iframe.allowFullscreen = true;
        caixa.replaceChild(iframe, botao);
      });
    });

    /* ---------- consentimento de cookies ---------- */
    var banner = document.getElementById('cookie-consent');
    var aceitar = document.getElementById('accept-cookies');
    var gatilho = document.getElementById('cookie-settings-trigger');

    if (banner && aceitar && gatilho) {
      var jaAceitou = false;
      try { jaAceitou = !!localStorage.getItem('bevart_cookies_accepted_v2'); } catch (e) { /* modo privado */ }

      // No mobile o banner divide o rodapé com o CTA fixo e o WhatsApp.
      var marcarBanner = function (aberto) {
        document.body.classList.toggle('cookie-aberto', aberto);
      };

      if (jaAceitou) {
        gatilho.classList.remove('hidden');
      } else {
        gatilho.classList.add('hidden');
        setTimeout(function () {
          banner.classList.add('show');
          marcarBanner(true);
        }, 600);
      }

      aceitar.addEventListener('click', function () {
        try { localStorage.setItem('bevart_cookies_accepted_v2', 'true'); } catch (e) { /* modo privado */ }
        banner.classList.remove('show');
        marcarBanner(false);
        setTimeout(function () { gatilho.classList.remove('hidden'); }, 400);
      });

      var abrirPreferencias = function () {
        banner.classList.add('show');
        marcarBanner(true);
        gatilho.classList.add('hidden');
      };

      gatilho.addEventListener('click', abrirPreferencias);
      gatilho.addEventListener('keydown', function (e) {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          abrirPreferencias();
        }
      });
    }

    /* ---------- qual CTA gerou o clique ----------
     * A conversão em si é registrada pelo bev-tracking.js (Meta) e pelo
     * gtag_report_conversion (Google Ads). Aqui só marcamos a origem
     * do clique dentro da página, para saber qual seção converte. */
    document.querySelectorAll('[data-cta]').forEach(function (link) {
      link.addEventListener('click', function () {
        var origem = link.getAttribute('data-cta');
        if (typeof gtag === 'function') {
          gtag('event', 'clique_cta', { origem_cta: origem });
        }
        if (typeof fbq === 'function') {
          fbq('trackCustom', 'CliqueCTA', { origem: origem });
        }
      });
    });

  });
})();
