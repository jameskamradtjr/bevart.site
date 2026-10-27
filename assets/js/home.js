/* =============================================================
 * Bevart: comportamento da home e das páginas de produto novas
 *
 *  - header com sombra ao rolar
 *  - menu "Soluções" (clique, Esc e clique fora fecham)
 *  - gaveta do celular
 *  - animação de entrada dos blocos (.bv-revela)
 *  - aviso de cookies (chave localStorage bevart_cookies_accepted_v2,
 *    a mesma da versão anterior, para quem já aceitou não ver de novo)
 * ============================================================= */
(function () {
  'use strict';

  var header = document.getElementById('header');
  function aoRolar() {
    if (header) { header.classList.toggle('rolou', window.scrollY > 8); }
  }
  window.addEventListener('scroll', aoRolar, { passive: true });
  aoRolar();

  // ---- menu de soluções
  var gatilho = document.getElementById('mega-gatilho');
  var mega = document.getElementById('mega-solucoes');
  function megaAbrir(abrir) {
    if (!gatilho || !mega) { return; }
    gatilho.setAttribute('aria-expanded', abrir ? 'true' : 'false');
    mega.classList.toggle('aberto', abrir);
  }
  if (gatilho && mega) {
    gatilho.addEventListener('click', function (e) {
      e.stopPropagation();
      megaAbrir(gatilho.getAttribute('aria-expanded') !== 'true');
    });
    mega.addEventListener('click', function (e) {
      if (e.target.closest('a')) { megaAbrir(false); }
      e.stopPropagation();
    });
    document.addEventListener('click', function () { megaAbrir(false); });
  }

  // ---- gaveta do celular
  var gaveta = document.getElementById('gaveta');
  var burger = document.getElementById('burger');
  function gavetaAbrir(abrir) {
    if (!gaveta) { return; }
    gaveta.classList.toggle('aberta', abrir);
    gaveta.setAttribute('aria-hidden', abrir ? 'false' : 'true');
    if (burger) { burger.setAttribute('aria-expanded', abrir ? 'true' : 'false'); }
    document.body.style.overflow = abrir ? 'hidden' : '';
    if (abrir) {
      var f = gaveta.querySelector('[data-fechar]');
      if (f) { f.focus(); }
    }
  }
  if (burger && gaveta) {
    burger.addEventListener('click', function () { gavetaAbrir(true); });
    gaveta.addEventListener('click', function (e) {
      if (e.target.closest('[data-fechar]') || e.target.closest('a')) { gavetaAbrir(false); }
    });
  }

  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') {
      megaAbrir(false);
      gavetaAbrir(false);
    }
  });

  // ---- animação de entrada
  var blocos = document.querySelectorAll('.bv-revela');
  if ('IntersectionObserver' in window) {
    var obs = new IntersectionObserver(function (itens) {
      itens.forEach(function (it) {
        if (it.isIntersecting) {
          it.target.classList.add('visivel');
          obs.unobserve(it.target);
        }
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });
    blocos.forEach(function (b) { obs.observe(b); });
  } else {
    blocos.forEach(function (b) { b.classList.add('visivel'); });
  }

  // ---- cookies
  var aviso = document.getElementById('cookies');
  if (aviso) {
    var aceitou = false;
    try { aceitou = !!localStorage.getItem('bevart_cookies_accepted_v2'); } catch (e) { /* modo privado */ }
    if (!aceitou) { aviso.hidden = false; }
    var ok = aviso.querySelector('[data-aceitar]');
    if (ok) {
      ok.addEventListener('click', function () {
        try { localStorage.setItem('bevart_cookies_accepted_v2', 'true'); } catch (e) { /* modo privado */ }
        aviso.hidden = true;
      });
    }
  }

  // ---- ano no rodapé
  document.querySelectorAll('[data-ano]').forEach(function (el) { el.textContent = new Date().getFullYear(); });
})();
