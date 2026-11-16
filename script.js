/* ═══════════════════════════════════════════════════════════════════════════
   Infinity Contract — script condiviso da index.html e lavora-con-noi.html.
   Nessuna libreria. Un solo listener di scroll (throttled con rAF), tutto il
   resto è IntersectionObserver. Ogni modulo esce subito se la pagina corrente
   non contiene i suoi elementi.
   ═══════════════════════════════════════════════════════════════════════════ */
(function(){
'use strict';
var $  = function(s,c){ return (c||document).querySelector(s); };
var $$ = function(s,c){ return Array.prototype.slice.call((c||document).querySelectorAll(s)); };
var calmo = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
var puntatore = window.matchMedia('(hover: hover) and (pointer: fine)').matches;

/* ── Titolo: parte a font caricati, così non salta ───────────────────── */
function avvia(){ document.body.classList.add('ready'); }
if (document.fonts && document.fonts.ready) {
  document.fonts.ready.then(avvia);
  setTimeout(avvia, 1200);           /* rete lenta: non lasciamo il titolo nascosto */
} else { avvia(); }

/* ── Reveal ──────────────────────────────────────────────────────────── */
(function reveal(){
  var el = $$('.rv, .stagger');
  $$('.stagger').forEach(function(g){
    Array.prototype.forEach.call(g.children, function(c,i){
      c.style.transitionDelay = (i * 70) + 'ms';
    });
  });
  if (calmo || !('IntersectionObserver' in window)) {
    el.forEach(function(e){ e.classList.add('in'); });
    return;
  }
  var io = new IntersectionObserver(function(voci){
    voci.forEach(function(v){
      if (!v.isIntersecting) return;
      v.target.classList.add('in');
      io.unobserve(v.target);
    });
  }, { rootMargin: '0px 0px -12% 0px', threshold: .12 });
  el.forEach(function(e){ io.observe(e); });
})();

/* ── Menu mobile ─────────────────────────────────────────────────────── */
(function menu(){
  var b = $('#burger'), m = $('#menu'); if (!b || !m) return;
  function chiudi(){
    b.setAttribute('aria-expanded','false'); b.setAttribute('aria-label','Apri il menu');
    m.classList.remove('open'); m.setAttribute('aria-hidden','true');
    document.body.style.overflow = '';
  }
  b.addEventListener('click', function(){
    if (b.getAttribute('aria-expanded') === 'true') return chiudi();
    b.setAttribute('aria-expanded','true'); b.setAttribute('aria-label','Chiudi il menu');
    m.classList.add('open'); m.setAttribute('aria-hidden','false');
    document.body.style.overflow = 'hidden';
    $$('#menu a').forEach(function(a,i){ a.style.transitionDelay = (60 + i*55) + 'ms'; });
  });
  $$('#menu a').forEach(function(a){ a.addEventListener('click', chiudi); });
  document.addEventListener('keydown', function(e){ if (e.key === 'Escape') chiudi(); });
})();

/* ── La pianta che si disegna ────────────────────────────────────────── */
(function pianta(){
  var fasi = $$('.fase'), stadi = $$('.pianta .st');
  var stato = $('#planStato'), next = $('#planNext');
  if (!fasi.length || !stadi.length) return;
  var nomi = ['Idea e fattibilità','Progetto e capitolato','Cantiere','Consegna delle chiavi'];
  var corrente = 0, auto = null;

  function mostra(n){
    corrente = n;
    stadi.forEach(function(g,i){ g.classList.toggle('on', i <= n); });
    fasi.forEach(function(f,i){ f.setAttribute('aria-pressed', String(i === n)); });
    stato.textContent = 'Fase 0' + (n+1) + ' — ' + nomi[n];
    next.firstChild.nodeValue = (n === stadi.length - 1) ? 'Ricomincia ' : 'Fase successiva ';
  }
  function ferma(){ if (auto) { clearInterval(auto); auto = null; } }

  fasi.forEach(function(f,i){ f.addEventListener('click', function(){ ferma(); mostra(i); }); });
  next.addEventListener('click', function(){
    ferma();
    mostra(corrente >= stadi.length - 1 ? 0 : corrente + 1);
  });

  if (calmo || !('IntersectionObserver' in window)) { mostra(stadi.length - 1); return; }
  mostra(0);
  var io = new IntersectionObserver(function(v){
    if (!v[0].isIntersecting || auto) return;
    io.disconnect();
    auto = setInterval(function(){
      if (corrente >= stadi.length - 1) return ferma();
      mostra(corrente + 1);
    }, 1900);
  }, { threshold: .45 });
  io.observe($('.pianta'));
})();

/* ── Galleria: filtri e lightbox ─────────────────────────────────────────
   Le frecce scorrono solo le immagini visibili con il filtro attivo, non
   tutte: altrimenti filtrare non servirebbe a niente.
   ──────────────────────────────────────────────────────────────────────── */
(function galleria(){
  var griglia = $('#galleria'); if (!griglia) return;
  var voci   = $$('.gal-voce', griglia);
  var lb     = $('#lightbox');
  var imgLb  = $('img', lb);
  var titolo = $('.lb-didascalia b', lb);
  var tag    = $('.lb-didascalia span', lb);
  var chiudi = $('.lb-chiudi', lb);
  var corrente = null, tornaA = null;

  /* ── filtri ── */
  var bottoni = $$('.gal-filtro');
  bottoni.forEach(function(b){
    b.addEventListener('click', function(){
      bottoni.forEach(function(o){ o.setAttribute('aria-pressed', String(o === b)); });
      var f = b.dataset.f;
      voci.forEach(function(v){
        v.classList.toggle('nascosta', f !== 'tutte' && v.dataset.gruppo !== f);
      });
    });
  });

  function visibili(){
    return voci.filter(function(v){ return !v.classList.contains('nascosta'); });
  }

  function mostra(fig){
    var b = $('.gal-apri', fig);
    corrente = fig;
    imgLb.src = b.dataset.grande;
    imgLb.alt = $('img', b).alt;
    titolo.textContent = b.dataset.titolo;
    tag.textContent = b.dataset.tag === 'Oggi' ? 'Stato di fatto' : 'Render di progetto';
  }

  function apri(fig){
    tornaA = $('.gal-apri', fig);
    mostra(fig);
    lb.hidden = false;
    lb.classList.add('aperto');
    document.body.style.overflow = 'hidden';
    chiudi.focus();
  }
  function chiudiLb(){
    lb.classList.remove('aperto');
    lb.hidden = true;
    imgLb.removeAttribute('src');
    document.body.style.overflow = '';
    if (tornaA) tornaA.focus();
  }
  function scorri(passo){
    var v = visibili(), i = v.indexOf(corrente);
    if (i < 0) return;
    mostra(v[(i + passo + v.length) % v.length]);
  }

  voci.forEach(function(fig){
    $('.gal-apri', fig).addEventListener('click', function(){ apri(fig); });
  });
  chiudi.addEventListener('click', chiudiLb);
  $('.lb-prec', lb).addEventListener('click', function(){ scorri(-1); });
  $('.lb-succ', lb).addEventListener('click', function(){ scorri(1); });
  /* Il click sullo sfondo chiude; quello sull'immagine o sui bottoni no. */
  lb.addEventListener('click', function(e){ if (e.target === lb) chiudiLb(); });
  document.addEventListener('keydown', function(e){
    if (lb.hidden) return;
    if (e.key === 'Escape')     { chiudiLb(); }
    if (e.key === 'ArrowLeft')  { scorri(-1); }
    if (e.key === 'ArrowRight') { scorri(1); }
  });
})();

/* ── FAQ: una alla volta ─────────────────────────────────────────────── */
$$('details.q').forEach(function(d){
  d.addEventListener('toggle', function(){
    if (!d.open) return;
    $$('details.q').forEach(function(o){ if (o !== d) o.open = false; });
  });
});

/* ── Bottoni magnetici (solo mouse) ──────────────────────────────────── */
if (puntatore && !calmo) {
  $$('.btn').forEach(function(b){
    b.addEventListener('pointermove', function(e){
      var q = b.getBoundingClientRect();
      b.style.transform = 'translate(' + ((e.clientX - q.left - q.width/2) * .14).toFixed(1) + 'px,' +
                                         ((e.clientY - q.top - q.height/2) * .22).toFixed(1) + 'px)';
    });
    b.addEventListener('pointerleave', function(){ b.style.transform = ''; });
  });
}

/* ── Le domande dell'invito finale precompilano il motivo nel modulo ─── */
(function motivo(){
  var sel = $('#f-int'); if (!sel) return;
  $$('[data-motivo]').forEach(function(a){
    a.addEventListener('click', function(){
      var v = a.getAttribute('data-motivo');
      var ok = $$('option', sel).some(function(o){ return o.value === v || o.textContent.trim() === v; });
      if (ok) { sel.value = v; sel.dispatchEvent(new Event('change')); }
    });
  });
})();

/* ── Video su richiesta ──────────────────────────────────────────────────
   Niente parte da solo. Con un file locale si usa <video preload="none">,
   così il browser non scarica nulla finché non si preme play; con un video
   incorporato (YouTube/Vimeo) l'iframe nasce soltanto al click, quindi al
   primo caricamento non viene contattato nessun terzo.
   Per passare all'incorporato basta sostituire l'attributo data-video con
   data-embed="https://www.youtube-nocookie.com/embed/XXXX?autoplay=1".
   ──────────────────────────────────────────────────────────────────────── */
$$('[data-video],[data-embed]').forEach(function(b){
  b.addEventListener('click', function(){
    var el;
    if (b.dataset.embed) {
      el = document.createElement('iframe');
      el.src = b.dataset.embed;
      el.setAttribute('title', b.getAttribute('aria-label') || 'Video');
      el.setAttribute('allow', 'accelerometer; autoplay; encrypted-media; picture-in-picture; fullscreen');
      el.setAttribute('referrerpolicy', 'strict-origin-when-cross-origin');
      el.setAttribute('allowfullscreen', '');
    } else {
      el = document.createElement('video');
      el.src = b.dataset.video;
      el.controls = true;
      el.setAttribute('preload', 'none');
      el.setAttribute('playsinline', '');
    }
    b.replaceWith(el);
    el.focus({ preventScroll: true });
    /* Se il browser rifiuta l'avvio automatico restano comunque i controlli. */
    if (el.play) { var p = el.play(); if (p && p.catch) p.catch(function(){}); }
  });
});

/* ── Mappa su richiesta: nessun embed di terzi prima del click ───────── */
(function mappa(){
  var b = $('#mapBtn'); if (!b) return;
  b.addEventListener('click', function(){
    var m = $('#map');
    var f = document.createElement('iframe');
    f.setAttribute('title', 'Mappa: Via Ronzoni 28, Cermenate');
    f.setAttribute('loading', 'lazy');
    f.setAttribute('referrerpolicy', 'no-referrer-when-downgrade');
    /* [DA VERIFICARE] coordinate prese sul centro di Cermenate, non sul civico:
       vanno corrette qui e nel JSON-LD in testa a index.html. */
    f.src = 'https://www.openstreetmap.org/export/embed.html?bbox=9.070%2C45.700%2C9.098%2C45.715&layer=mapnik&marker=45.7075%2C9.0839';
    m.innerHTML = '';
    m.appendChild(f);
  });
})();

/* ── Moduli ──────────────────────────────────────────────────────────────
   Un solo gestore per i due moduli del sito (contatti e candidature): la
   validazione si costruisce dagli attributi `required` del markup, così
   aggiungere un campo non richiede di toccare il codice.

   EmailJS: la chiave pubblica sta per forza qui in chiaro — è pensata per
   essere pubblica — e si protegge limitando i domini in
   EmailJS → Account → Security.
   [DA COMPILARE] i tre valori qui sotto e i due Template ID.
   ──────────────────────────────────────────────────────────────────────── */
var EMAILJS = {
  servizio:        'INSERISCI_SERVICE_ID',
  chiave:          'INSERISCI_PUBLIC_KEY',
  tmplContatti:    'INSERISCI_TEMPLATE_ID_CONTATTI',
  tmplCandidature: 'INSERISCI_TEMPLATE_ID_CANDIDATURE'
};

$$('form[data-emailjs]').forEach(function(f){
  var bottone = f.querySelector('button[type=submit]');
  var etichetta = bottone.innerHTML;
  var errBox = $('.form-error', f);
  var priv = f.querySelector('input[type=checkbox][required]');
  var campi = $$('input[required], select[required], textarea[required]', f)
                .filter(function(e){ return e.type !== 'checkbox'; });
  var tel = f.querySelector('input[type=tel]');
  var daControllare = campi.concat(tel ? [tel] : []);

  function bad(el, on){
    var box = el.closest('.field');
    if (box) box.classList.toggle('err', on);
    el.setAttribute('aria-invalid', on ? 'true' : 'false');
  }
  function check(el){
    var v = (el.value || '').trim(), ok = true;
    if (el.type === 'email')       ok = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v);
    else if (el.type === 'tel')    ok = (v === '' && !el.required) || v.replace(/\D/g,'').length >= 8;
    else if (el.tagName === 'SELECT') ok = v !== '';
    else                           ok = v.length >= 2;
    bad(el, !ok);
    return ok;
  }
  daControllare.forEach(function(el){
    el.addEventListener('blur', function(){ check(el); });
    el.addEventListener('input', function(){
      var box = el.closest('.field');
      if (box && box.classList.contains('err')) check(el);
    });
  });

  f.addEventListener('submit', function(e){
    e.preventDefault();
    if (errBox) errBox.classList.remove('show');

    var ok = true, primo = null;
    daControllare.forEach(function(el){
      if (!check(el)) { ok = false; if (!primo) primo = el; }
    });
    if (priv) {
      if (!priv.checked) {
        ok = false;
        priv.setAttribute('aria-invalid','true');
        priv.closest('.check').style.color = '#FF9C8E';
        if (!primo) primo = priv;
      } else {
        priv.removeAttribute('aria-invalid');
        priv.closest('.check').style.color = '';
      }
    }
    if (!ok) { if (primo) primo.focus(); return; }

    function fatto(){
      f.classList.add('done');
      var h3 = f.querySelector('.sent h3');
      if (h3) { h3.setAttribute('tabindex','-1'); h3.focus(); }
      /* Il CV non può viaggiare con questo invio: lo chiediamo via email,
         con oggetto già pronto. Vedi la nota nel README. */
      var file = f.querySelector('input[type=file]');
      var avviso = $('.sent .allega', f);
      if (file && avviso) {
        avviso.hidden = false;
        var nome = (f.querySelector('input[name=nome]') || {}).value || '';
        avviso.querySelector('a').href =
          'mailto:infinity@infinitycontract.org?subject=' +
          encodeURIComponent('Candidatura — ' + nome.trim()) +
          '&body=' + encodeURIComponent('Allego CV o portfolio.');
      }
    }

    /* Trappola antispam: solo un bot compila questo campo invisibile. Si finge
       riuscito, così non riprova con un altro modulo. */
    var trappola = f.querySelector('input[name=azienda]');
    if (trappola && trappola.value) { fatto(); return; }

    var dati = {};
    $$('input[name], select[name], textarea[name]', f).forEach(function(el){
      if (el.name === 'azienda' || el.type === 'file' || el.type === 'checkbox') return;
      if (el.type === 'radio' && !el.checked) return;
      dati[el.name] = (el.value || '').trim();
    });
    var file = f.querySelector('input[type=file]');
    if (file) dati.allegato = file.files && file.files[0] ? file.files[0].name : 'nessuno';

    bottone.disabled = true;
    bottone.innerHTML = '<span>Invio in corso…</span>';
    fetch('https://api.emailjs.com/api/v1.0/email/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        service_id:  EMAILJS.servizio,
        template_id: f.dataset.emailjs === 'candidature' ? EMAILJS.tmplCandidature : EMAILJS.tmplContatti,
        user_id:     EMAILJS.chiave,
        template_params: dati
      })
    }).then(function(r){
      /* EmailJS risponde "OK" in testo semplice, non JSON */
      if (!r.ok) return r.text().then(function(t){ throw new Error(t); });
      fatto();
    }).catch(function(){
      bottone.disabled = false;
      bottone.innerHTML = etichetta;
      if (errBox) {
        errBox.classList.add('show');
        errBox.scrollIntoView({ block:'nearest', behavior: calmo ? 'auto' : 'smooth' });
      }
    });
  });
});

/* ── Un solo listener di scroll ──────────────────────────────────────── */
(function scroll(){
  var head = $('#head'), mbar = $('#mbar'), prog = $('#prog'), heroPh = $('#heroPh');
  var voci = $$('#nav a').filter(function(a){ return a.getAttribute('href').charAt(0) === '#'; });
  var sez  = voci.map(function(a){ return $(a.getAttribute('href')); });
  var atteso = false;

  function esegui(){
    atteso = false;
    var y = window.pageYOffset;

    if (head) head.classList.toggle('stuck', y > 20);
    if (mbar) mbar.classList.toggle('show', y > 620);

    if (prog) {
      var alto = document.documentElement.scrollHeight - window.innerHeight;
      prog.style.transform = 'scaleX(' + (alto > 0 ? Math.min(y / alto, 1) : 0) + ')';
    }

    /* Parallasse leggera sulla foto dell'hero: sta dentro il suo contenitore,
       quindi non scopre mai i bordi. */
    if (heroPh && !calmo && y < window.innerHeight * 1.2) {
      heroPh.style.transform = 'translate3d(0,' + (y * .045).toFixed(1) + 'px,0)';
    }

    var att = null;
    sez.forEach(function(s,i){
      if (s && s.getBoundingClientRect().top <= 140) att = i;
    });
    voci.forEach(function(a,i){ a.classList.toggle('on', i === att); });
  }

  window.addEventListener('scroll', function(){
    if (atteso) return;
    atteso = true;
    requestAnimationFrame(esegui);
  }, { passive: true });
  esegui();
})();

})();
