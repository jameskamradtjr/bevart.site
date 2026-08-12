/* =====================================================================
 * Bevart - rastreamento de origem (anúncio -> site -> cadastro)
 *
 * bevart.site e profissionais.bevart.com.br são hosts diferentes: cookies
 * não atravessam. Este script captura a origem na chegada, guarda localmente
 * e reanexa tudo na URL quando o visitante vai criar a conta.
 *
 * Instala o Meta Pixel se a página ainda não tiver (só a index.html tinha).
 * ===================================================================== */
(function () {
  'use strict';

  var PIXEL_ID = '1004315305690659';
  var CHAVE = 'bev_attr';
  var DIAS = 90;
  var DESTINO = 'profissionais.bevart.com.br/app/src/login/views/login';

  var PARAMS = [
    'utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term', 'utm_id',
    'fb_campaign_id', 'fb_adset_id', 'fb_ad_id', 'fb_placement',
    'fbclid', 'gclid'
  ];

  /* ---------- pixel ---------- */

  // Páginas de conteúdo não tinham o pixel; a index já tem e não pode
  // receber um segundo init (geraria PageView duplicado).
  function garantirPixel() {
    if (typeof window.fbq === 'function') { return; }

    !function (f, b, e, v, n, t, s) {
      if (f.fbq) return; n = f.fbq = function () {
        n.callMethod ? n.callMethod.apply(n, arguments) : n.queue.push(arguments)
      };
      if (!f._fbq) f._fbq = n; n.push = n; n.loaded = !0; n.version = '2.0';
      n.queue = []; t = b.createElement(e); t.async = !0;
      t.src = v; s = b.getElementsByTagName(e)[0];
      s.parentNode.insertBefore(t, s)
    }(window, document, 'script', 'https://connect.facebook.net/en_US/fbevents.js');

    fbq('init', PIXEL_ID);
    fbq('track', 'PageView');
  }

  /* ---------- utilidades ---------- */

  function lerCookie(nome) {
    var m = document.cookie.match('(^|;)\\s*' + nome + '\\s*=\\s*([^;]+)');
    return m ? decodeURIComponent(m[2]) : '';
  }

  function gravarCookie(nome, valor, dias) {
    var d = new Date();
    d.setTime(d.getTime() + dias * 86400000);
    document.cookie = nome + '=' + encodeURIComponent(valor) +
      ';expires=' + d.toUTCString() + ';path=/;SameSite=Lax' +
      (location.protocol === 'https:' ? ';Secure' : '');
  }

  function novoVid() {
    if (window.crypto && crypto.randomUUID) {
      return crypto.randomUUID().replace(/-/g, '');
    }
    return (Date.now().toString(16) + Math.random().toString(16).slice(2) +
      Math.random().toString(16).slice(2)).slice(0, 32);
  }

  function ler() {
    var bruto = '';
    try { bruto = localStorage.getItem(CHAVE) || ''; } catch (e) { /* modo privado */ }
    if (!bruto) { bruto = lerCookie(CHAVE); }
    if (!bruto) { return {}; }
    try { return JSON.parse(bruto) || {}; } catch (e) { return {}; }
  }

  function gravar(dados) {
    var json = JSON.stringify(dados);
    try { localStorage.setItem(CHAVE, json); } catch (e) { /* modo privado */ }
    gravarCookie(CHAVE, json, DIAS);
  }

  function ehAnuncio(a) {
    if (a.fb_ad_id || a.fbclid || a.gclid) { return true; }
    var s = (a.utm_source || '').toLowerCase();
    var m = (a.utm_medium || '').toLowerCase();
    var fonteMeta = ['facebook', 'instagram', 'fb', 'ig', 'meta', 'google'].indexOf(s) > -1;
    var meioPago = ['paid', 'cpc', 'ppc', 'paid_social', 'paidsocial', 'ads', 'anuncio'].indexOf(m) > -1;
    return fonteMeta && meioPago;
  }

  /* ---------- 1. captura na chegada ---------- */

  function capturar() {
    var url = new URL(window.location.href);
    var anterior = ler();
    var novo = {};
    var achou = false;

    PARAMS.forEach(function (p) {
      var v = url.searchParams.get(p);
      if (v) { novo[p] = v.slice(0, 500); achou = true; }
    });

    // Sem parâmetros novos: mantém a origem já conhecida.
    if (!achou) {
      if (!anterior.bev_vid) {
        anterior.bev_vid = novoVid();
        anterior.primeiro_contato = new Date().toISOString();
        anterior.lp = location.href.slice(0, 500);
        anterior.ref = document.referrer.slice(0, 500);
        gravar(anterior);
      }
      return anterior;
    }

    novo.bev_vid = anterior.bev_vid || novoVid();
    novo.primeiro_contato = anterior.primeiro_contato || new Date().toISOString();
    novo.lp = location.href.slice(0, 500);
    novo.ref = document.referrer.slice(0, 500);
    novo.ts = Date.now();
    novo.origem = ehAnuncio(novo) ? 'anuncio' : 'organico';

    gravar(novo);
    return novo;
  }

  /* ---------- 2. handoff entre hosts ---------- */

  function decorar(link, attr) {
    var destino;
    try { destino = new URL(link.href, location.href); } catch (e) { return; }

    Object.keys(attr).forEach(function (chave) {
      if (chave === 'origem' || chave === 'primeiro_contato') { return; }
      if (attr[chave]) { destino.searchParams.set(chave, attr[chave]); }
    });

    // Cookies do pixel deste host, para o servidor conseguir parear
    // o cadastro com a pessoa que clicou no anúncio.
    var fbp = lerCookie('_fbp');
    var fbc = lerCookie('_fbc');
    if (fbp) { destino.searchParams.set('fbp', fbp); }
    if (fbc) { destino.searchParams.set('fbc', fbc); }

    link.href = destino.toString();
  }

  function ligarLinks(attr) {
    var links = document.querySelectorAll('a[href*="' + DESTINO + '"]');

    Array.prototype.forEach.call(links, function (link) {
      // Decora já no carregamento (cobre clique do meio / abrir em nova aba)
      decorar(link, attr);

      link.addEventListener('click', function () {
        // Redecora no clique: o _fbp pode ter sido criado depois do load.
        decorar(link, attr);

        if (typeof fbq === 'function') {
          fbq('trackCustom', 'IniciouCadastro', {
            origem: attr.origem || 'direto',
            campanha: attr.utm_campaign || '',
            anuncio_id: attr.fb_ad_id || ''
          });
        }
      });
    });
  }

  /* ---------- inicialização ---------- */

  garantirPixel();

  var attr = capturar();

  if (typeof fbq === 'function' && attr.origem === 'anuncio') {
    fbq('trackCustom', 'VisitaAnuncio', {
      campanha: attr.utm_campaign || '',
      anuncio_id: attr.fb_ad_id || ''
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () { ligarLinks(attr); });
  } else {
    ligarLinks(attr);
  }

  // Exposto para depuração no console: bev_attr()
  window.bev_attr = ler;
})();
