/* ================================================================
   CABIX MEBEL — Premium Catalog Reader · script.js
   ================================================================ */

'use strict';

const CATS = [
    { id:'akril',  name:'Akril',  badge:'A1', folder:'AKRIL (A1)',  count:11, desc:'Zamonaviy akril yuzalar kolleksiyasi' },
    { id:'korpus', name:'Korpus', badge:'K1', folder:'KORPUS (K1)', count:11, desc:'Mustahkam korpus konstruksiyalari'     },
    { id:'laminat',name:'Laminat',badge:'L1', folder:'LAMINAT (L1)',count:11, desc:'Premium laminat qoplamalar seriyasi'   }
];

// ─── State ────────────────────────────────────────────────────────
let pf         = null;
let currentCat = null;
let zoom       = 1;
let thumbsOpen = false;
let _opening   = false;   // ikki marta ochilishini oldini olish

// ─── DOM helpers ─────────────────────────────────────────────────
const $  = id => document.getElementById(id);
const el = {
    homeView:      $('home-view'),
    bookView:      $('book-view'),
    catGrid:       $('category-grid'),
    pageInput:     $('page-input'),
    totalPages:    $('total-pages'),
    prevBtn:       $('prev-btn'),
    nextBtn:       $('next-btn'),
    zoomDisplay:   $('zoom-display'),
    thumbsPanel:   $('thumbs-panel'),
    thumbsList:    $('thumbs-list'),
    thumbsBtn:     $('thumbs-btn'),
    readerTitle:   $('reader-title'),
    loadingScreen: $('loading-screen'),
    zoomWrapper:   $('zoom-wrapper'),
    flipbookArea:  $('flipbook-area')
};

// ================================================================
// AUDIO — bitta doimiy AudioContext, hech qachon yopilmaydi
// ================================================================
let _audioCtx = null;

function playFlip() {
    try {
        if (!_audioCtx || _audioCtx.state === 'closed') {
            _audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        }
        const ctx = _audioCtx;

        const play = () => {
            const sr  = ctx.sampleRate;
            const n   = Math.floor(sr * 0.13);
            const buf = ctx.createBuffer(1, n, sr);
            const d   = buf.getChannelData(0);
            for (let i = 0; i < n; i++) {
                const t = i / n;
                const e = t < 0.05 ? t / 0.05 : Math.pow(1 - (t - 0.05) / 0.95, 2.2);
                d[i] = (Math.random() * 2 - 1) * e * 0.35;
            }
            const src = ctx.createBufferSource();
            src.buffer = buf;
            const bp = ctx.createBiquadFilter(); bp.type='bandpass'; bp.frequency.value=2800; bp.Q.value=1.2;
            const hp = ctx.createBiquadFilter(); hp.type='highpass'; hp.frequency.value=600;
            const gn = ctx.createGain(); gn.gain.value=0.7;
            src.connect(hp); hp.connect(bp); bp.connect(gn); gn.connect(ctx.destination);
            src.start();
        };

        ctx.state === 'suspended' ? ctx.resume().then(play).catch(()=>{}) : play();
    } catch(e) {}
}

// ================================================================
// HOME
// ================================================================
function renderHome() {
    el.catGrid.innerHTML = '';
    CATS.forEach(cat => {
        const card = document.createElement('div');
        card.className = 'cat-card';
        card.innerHTML = `
            <span class="card-badge">${cat.badge}</span>
            <div class="card-img-wrap">
                <img class="card-img" src="${enc(cat.folder)}/00.webp" alt="${cat.name}" loading="lazy"
                     onerror="this.style.minHeight='230px'">
            </div>
            <div class="card-body">
                <div class="card-info">
                    <h3>${cat.name}</h3>
                    <p>${cat.desc} · ${cat.count} sahifa</p>
                </div>
                <div class="card-arrow">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                        <polyline points="9,18 15,12 9,6"/>
                    </svg>
                </div>
            </div>`;
        card.addEventListener('click', () => openBook(cat.id));
        el.catGrid.appendChild(card);
    });
}

// ================================================================
// OPEN BOOK  ← asosiy tuzatish shu yerda
// ================================================================
function openBook(catId) {
    if (_opening) return;               // ikki marta bosishni bloklash
    const cat = CATS.find(c => c.id === catId);
    if (!cat) return;

    _opening   = true;
    currentCat = cat;

    showLoading(true);

    // 1) Avvalgi PageFlip'ni yo'q qilamiz
    destroyFlip();

    // 2) Flipbook konteynerini innerHTML bilan TOZALAYMIZ
    //    (replaceChild emas — bu xavfsizroq)
    const flipEl = $('flipbook');
    flipEl.innerHTML = '';
    el.thumbsList.innerHTML = '';

    // 3) Meta ma'lumotlarni yangilaymiz
    el.readerTitle.textContent  = `${cat.name.toUpperCase()} (${cat.badge})`;
    el.totalPages.textContent   = cat.count;
    el.pageInput.value          = 1;
    el.pageInput.max            = cat.count;

    // 4) Sahifa div larini quramiz
    for (let i = 0; i < cat.count; i++) {
        const num = String(i).padStart(2, '0');
        const src = `${enc(cat.folder)}/${num}.webp`;

        const pg  = document.createElement('div');
        pg.className = 'page' + (i === 0 || i === cat.count - 1 ? ' --hard' : '');

        const img = document.createElement('img');
        img.src     = src;
        img.alt     = `Sahifa ${i + 1}`;
        img.loading = i < 3 ? 'eager' : 'lazy';
        // Rasm yuklanmaganda ham sahifa ko'rinishi uchun
        img.onerror = function() { this.style.background = '#1a1a1a'; };
        pg.appendChild(img);
        flipEl.appendChild(pg);

        buildThumb(src, i);
    }

    showView('book');
    resetZoom();

    // 5) PageFlip ni 2 ta frame + 200ms keyin ishga tushiramiz
    //    (DOM to'liq render bo'lishi uchun)
    requestAnimationFrame(() => requestAnimationFrame(() => {
        setTimeout(initPageFlip, 200);
    }));
}

function initPageFlip() {
    const flipEl = $('flipbook');
    const pages  = flipEl ? flipEl.querySelectorAll('.page') : [];

    if (!pages.length) {
        showLoading(false);
        _opening = false;
        return;
    }

    try {
        pf = new St.PageFlip(flipEl, {
            width:               420,
            height:              594,
            size:                'stretch',
            minWidth:            230,
            maxWidth:            920,
            minHeight:           300,
            maxHeight:           1300,
            maxShadowOpacity:    0.75,
            showCover:           true,
            mobileScrollSupport: false,
            usePortrait:         true,
            drawShadow:          true,
            flippingTime:        700
        });

        pf.loadFromHTML(pages);

        pf.on('flip', e => {
            const pg = e.data;
            el.pageInput.value = pg + 1;
            updateNav();
            activateThumb(pg);
            playFlip();
        });

        pf.on('changeState', updateNav);

        updateNav();
    } catch(err) {
        console.error('PageFlip xatosi:', err);
    }

    showLoading(false);
    _opening = false;
}

// ================================================================
// GO HOME
// ================================================================
function goHome() {
    _opening = false;
    destroyFlip();

    const flipEl = $('flipbook');
    if (flipEl) flipEl.innerHTML = '';
    el.thumbsList.innerHTML = '';
    closeThumbs();
    resetZoom();
    showView('home');
}

function destroyFlip() {
    if (!pf) return;
    try { pf.destroy(); } catch(e) {}
    pf = null;
}

// ================================================================
// THUMBNAILS
// ================================================================
function buildThumb(src, idx) {
    const item = document.createElement('div');
    item.className = 'thumb-item' + (idx === 0 ? ' on' : '');
    item.dataset.i = idx;
    item.innerHTML = `<img src="${src}" alt="Sahifa ${idx+1}" loading="lazy"><div class="thumb-num">${idx+1}</div>`;
    item.addEventListener('click', () => { if (pf) pf.flip(idx); });
    el.thumbsList.appendChild(item);
}

function activateThumb(idx) {
    el.thumbsList.querySelectorAll('.thumb-item').forEach((e, i) => e.classList.toggle('on', i === idx));
    const active = el.thumbsList.querySelector('.thumb-item.on');
    if (active) active.scrollIntoView({ behavior:'smooth', block:'nearest' });
}

function toggleThumbs() {
    thumbsOpen = !thumbsOpen;
    el.thumbsPanel.classList.toggle('open', thumbsOpen);
    el.thumbsBtn.classList.toggle('on', thumbsOpen);
}

function closeThumbs() {
    thumbsOpen = false;
    el.thumbsPanel.classList.remove('open');
    el.thumbsBtn.classList.remove('on');
}

// ================================================================
// NAVIGATION
// ================================================================
function flipNext() { if (pf) pf.flipNext('bottom'); }
function flipPrev() { if (pf) pf.flipPrev('bottom'); }

function jumpToPage(val) {
    if (!pf || !currentCat) return;
    const pg = Math.max(0, Math.min((parseInt(val, 10) || 1) - 1, currentCat.count - 1));
    pf.flip(pg);
    el.pageInput.value = pg + 1;
}

function updateNav() {
    if (!pf) return;
    const cur   = pf.getCurrentPageIndex();
    const total = pf.getPageCount();
    el.prevBtn.disabled    = cur <= 0;
    el.nextBtn.disabled    = cur >= total - 1;
    el.pageInput.value     = cur + 1;
}

// ================================================================
// ZOOM
// ================================================================
const ZOOM_MIN = 0.4, ZOOM_MAX = 3.0, ZOOM_STEP = 0.25;

function setZoom(z) {
    zoom = Math.max(ZOOM_MIN, Math.min(ZOOM_MAX, z));
    el.zoomWrapper.style.transform = `scale(${zoom})`;
    el.zoomDisplay.textContent     = Math.round(zoom * 100) + '%';
}
function zoomIn()    { setZoom(zoom + ZOOM_STEP); }
function zoomOut()   { setZoom(zoom - ZOOM_STEP); }
function resetZoom() { setZoom(1); }

el.flipbookArea?.addEventListener('wheel', e => {
    if (!e.ctrlKey && !e.metaKey) return;
    e.preventDefault();
    e.deltaY < 0 ? zoomIn() : zoomOut();
}, { passive: false });

// ================================================================
// FULLSCREEN
// ================================================================
function toggleFullscreen() {
    if (!document.fullscreenElement) document.documentElement.requestFullscreen?.().catch(()=>{});
    else document.exitFullscreen?.().catch(()=>{});
}

document.addEventListener('fullscreenchange', () => {
    const isFs = !!document.fullscreenElement;
    $('fs-icon').innerHTML = isFs
        ? `<polyline points="4,14 4,20 10,20"/><polyline points="20,10 20,4 14,4"/><line x1="14" y1="10" x2="20" y2="4"/><line x1="4" y1="20" x2="10" y2="14"/>`
        : `<polyline points="15,3 21,3 21,9"/><polyline points="9,21 3,21 3,15"/><line x1="21" y1="3" x2="14" y2="10"/><line x1="3" y1="21" x2="10" y2="14"/>`;
    $('fs-btn').classList.toggle('on', isFs);
});

// ================================================================
// KEYBOARD
// ================================================================
document.addEventListener('keydown', e => {
    if (!el.bookView.classList.contains('active')) return;
    if (e.target === el.pageInput) return;
    switch(e.key) {
        case 'ArrowRight': case 'ArrowDown': case ' ': e.preventDefault(); flipNext(); break;
        case 'ArrowLeft':  case 'ArrowUp':             e.preventDefault(); flipPrev(); break;
        case 'Escape': goHome(); break;
        case '+': case '=': e.preventDefault(); zoomIn();     break;
        case '-':           e.preventDefault(); zoomOut();    break;
        case '0':           e.preventDefault(); resetZoom();  break;
        case 'f': case 'F': toggleFullscreen(); break;
        case 't': case 'T': toggleThumbs();     break;
    }
});

// ================================================================
// PAGE INPUT
// ================================================================
el.pageInput.addEventListener('keydown', e => {
    if (e.key === 'Enter') { jumpToPage(el.pageInput.value); el.pageInput.blur(); }
});
el.pageInput.addEventListener('blur', () => jumpToPage(el.pageInput.value));

// ================================================================
// RESIZE
// ================================================================
window.addEventListener('resize', () => { if (pf) try { pf.update(); } catch(e) {} });

// ================================================================
// VIEW SWITCHER
// ================================================================
function showView(which) {
    if (which === 'book') {
        el.homeView.classList.remove('active');
        el.bookView.classList.add('active');
        document.body.style.overflow = 'hidden';
    } else {
        el.bookView.classList.remove('active');
        el.homeView.classList.add('active');
        document.body.style.overflow = '';
        window.scrollTo(0, 0);
    }
}

// ================================================================
// LOADING
// ================================================================
function showLoading(show) { el.loadingScreen.classList.toggle('show', show); }

// ================================================================
// HELPERS
// ================================================================
function enc(f) { return encodeURIComponent(f); }

// ================================================================
// INIT
// ================================================================
renderHome();
