/* =============================================================
 * Bevart: chamada da Black Friday do plano vitalício (index.html)
 *
 * O site é estático; o lote vigente vem do sistema
 * (profissionais.bevart.com.br/blackfriday.php?formato=json), que é a
 * fonte única de lotes, preços e cupons. Sem resposta, ou fora da
 * campanha, nada aparece e a página fica como era.
 * ============================================================= */
(function () {
  'use strict';

  var API = 'https://profissionais.bevart.com.br/blackfriday.php?formato=json';
  if (!window.fetch) { return; }

  function brl(v) { return 'R$ ' + Number(v).toLocaleString('pt-BR', { maximumFractionDigits: 2 }); }
  function dia(d) { var p = d.split('-'); return p[2] + '/' + p[1]; }
  function dois(n) { return (n < 10 ? '0' : '') + n; }
  function todos(chave, fn) { document.querySelectorAll('[data-bf="' + chave + '"]').forEach(fn); }

  fetch(API, { credentials: 'omit' }).then(function (r) { return r.json(); }).then(function (e) {
    if (!e || e.fase !== 'ativa' || !e.lote) { return; }
    var lote = e.lote, prox = e.proximo;

    todos('lote', function (el) { el.textContent = lote.numero; });
    todos('total', function (el) { el.textContent = e.lotes.length; });
    todos('desconto', function (el) { el.textContent = lote.desconto + '%'; });
    todos('cheio', function (el) { el.textContent = brl(e.preco_cheio); });
    todos('preco', function (el) { el.textContent = brl(lote.preco); });
    todos('vidas', function (el) { el.textContent = e.vidas; });
    todos('link', function (el) { el.href = e.url; });
    todos('prazo', function (el) {
      el.innerHTML = prox
        ? 'O lote ' + lote.numero + ' termina em <b>' + dia(lote.fim) + ' às 23h59</b>. Depois, o mesmo plano custa <b>' + brl(prox.preco) + '</b>.'
        : '<b>Último lote</b>: termina em ' + dia(lote.fim) + ' às 23h59.';
    });

    var tabela = document.querySelector('[data-bf="tabela"]');
    if (tabela) {
      tabela.innerHTML = e.lotes.map(function (l) {
        return '<tr class="' + l.situacao + '"><td>' + dois(l.numero) + '</td><td>' + dia(l.inicio) + ' a ' + dia(l.fim) +
          '</td><td>' + l.desconto + '%</td><td>' + brl(l.preco) + '</td></tr>';
      }).join('');
    }

    // Cartão do vitalício nos planos: preço do lote e a página da campanha.
    var badge = document.getElementById('bv-vit-badge');
    var desc = document.getElementById('bv-vit-desc');
    var preco = document.getElementById('bv-vit-preco');
    var botao = document.getElementById('bv-vit-botao');
    if (badge) { badge.textContent = 'Black Friday · -' + lote.desconto + '%'; }
    if (desc) { desc.textContent = 'Lote ' + lote.numero + ' até ' + dia(lote.fim) + ' · pagamento único'; }
    if (preco) {
      preco.innerHTML = '<s class="bv-bf-de">' + brl(e.preco_cheio) + '</s><span class="bv-price__value">' + brl(lote.preco) +
        '</span><span class="bv-price__period">/único</span>';
    }
    if (botao) { botao.href = e.url; botao.textContent = 'Garantir no lote ' + lote.numero; }

    ['bv-bf-faixa', 'black-friday'].forEach(function (id) {
      var el = document.getElementById(id);
      if (el) { el.hidden = false; }
    });

    // Contagem até a virada do lote, pelo relógio do servidor.
    var alvo = (lote.fim_ts + 1) * 1000;
    var desvio = e.agora_ts * 1000 - Date.now();
    var contador = document.querySelector('[data-bf="contador"]');
    function tique() {
      var s = Math.max(0, Math.floor((alvo - (Date.now() + desvio)) / 1000));
      var d = Math.floor(s / 86400), h = Math.floor(s % 86400 / 3600), m = Math.floor(s % 3600 / 60), seg = s % 60;
      todos('relogio', function (el) { el.textContent = (d > 0 ? d + 'd ' : '') + dois(h) + ':' + dois(m) + ':' + dois(seg); });
      if (contador) {
        contador.querySelector('[data-c="d"]').textContent = dois(d);
        contador.querySelector('[data-c="h"]').textContent = dois(h);
        contador.querySelector('[data-c="m"]').textContent = dois(m);
        contador.querySelector('[data-c="s"]').textContent = dois(seg);
      }
    }
    tique();
    setInterval(tique, 1000);
  }).catch(function () {});
})();
