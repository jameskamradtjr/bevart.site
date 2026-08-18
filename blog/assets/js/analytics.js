/* =====================================================================
 * Bevart Blog — tags de medição
 *
 * Um arquivo só, carregado com defer por todas as páginas do blog, para
 * o template do post não repetir 60 linhas de script em cada post.
 * Mesmos IDs do site principal, então a jornada blog -> site -> cadastro
 * fica no mesmo relatório.
 * ===================================================================== */

(function () {
  'use strict';

  var GA = 'G-Z0RJMZR8R2';
  var ADS = 'AW-17992875515';
  var PIXEL = '1004315305690659';
  var CONVERSAO_CADASTRO = ADS + '/YUXSCN2X8IQcEPv71YND';
  var CONVERSAO_WHATSAPP = ADS + '/nPR2CPXJyoUcEPv71YND';

  /* ---------- Google (Analytics + Ads) ---------- */
  window.dataLayer = window.dataLayer || [];
  window.gtag = window.gtag || function () { window.dataLayer.push(arguments); };
  window.gtag('js', new Date());
  window.gtag('config', ADS);
  window.gtag('config', GA);

  var gtagScript = document.createElement('script');
  gtagScript.async = true;
  gtagScript.src = 'https://www.googletagmanager.com/gtag/js?id=' + ADS;
  document.head.appendChild(gtagScript);

  /* ---------- Meta Pixel ---------- */
  (function (f, b, e, v, n, t, s) {
    if (f.fbq) return;
    n = f.fbq = function () { n.callMethod ? n.callMethod.apply(n, arguments) : n.queue.push(arguments); };
    if (!f._fbq) f._fbq = n;
    n.push = n; n.loaded = !0; n.version = '2.0'; n.queue = [];
    t = b.createElement(e); t.async = !0; t.src = v;
    s = b.getElementsByTagName(e)[0]; s.parentNode.insertBefore(t, s);
  })(window, document, 'script', 'https://connect.facebook.net/en_US/fbevents.js');
  window.fbq('init', PIXEL);
  window.fbq('track', 'PageView');

  /* ---------- analytics próprio ---------- */
  var tracker = document.createElement('script');
  tracker.src = 'https://analytics.yggra.com.br/tracker.js?v=' + Date.now();
  tracker.async = true;
  tracker.setAttribute('data-id', 'SB-3C21C2');
  document.head.appendChild(tracker);

  /* ---------- conversões (mesmos rótulos do site) ---------- */
  document.addEventListener('click', function (e) {
    var alvo = e.target.closest ? e.target : e.target.parentElement;
    if (!alvo || !alvo.closest) { return; }

    var cadastro = alvo.closest('a[href*="profissionais.bevart.com.br"]');

    if (cadastro) {
      window.gtag('event', 'conversion', { send_to: CONVERSAO_CADASTRO });
      window.gtag('event', 'blog_cta', {
        origem: cadastro.getAttribute('data-cta') || 'link',
        pagina: window.location.pathname
      });
    }

    if (alvo.closest('a[href*="wa.me"], a[href*="whatsapp.com"]')) {
      window.gtag('event', 'conversion', {
        send_to: CONVERSAO_WHATSAPP,
        value: 1.0,
        currency: 'BRL'
      });
    }
  });
})();
