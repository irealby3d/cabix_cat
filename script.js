/* ================================================================
   CABIX MEBEL — Premium Catalog Reader · script.js
   ================================================================ */

'use strict';

const CATS = [
    { id:'akril',   name:'Akril',   badge:'A1', folder:'akril',   count:11, desc:'Zamonaviy akril yuzalar kolleksiyasi' },
    { id:'korpus',  name:'Korpus',  badge:'K1', folder:'korpus',  count:11, desc:'Mustahkam korpus konstruksiyalari'     },
    { id:'laminat', name:'Laminat', badge:'L1', folder:'laminat', count:11, desc:'Premium laminat qoplamalar seriyasi'   }
];

let pf         = null;
let currentCat = null;
let zoom       = 1;
let thumbsOpen = false;

const $ = id => document.getElementById(id);

// ================================================================
// HOME
// ================================================================
function renderHome() {
    const grid = $('category-grid');
    if (!grid) return;
    grid.innerHTML = '';

    CATS.forEach(cat => {
        const card = document.createElement('div');
        card.className = 'cat-card';
        card.innerHTML = `
            <span class="card-badge">${cat.badge}</span>
            <div class="card-img-wrap">
                <img class="card-img" src="${cat.folder}/00.webp" alt="${cat.name}" loading="lazy"
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
        grid.appendChild(card);
    });
}

// ================================================================
// OPEN BOOK
// ================================================================
function openBook(catId) {
    const cat = CATS.find(c => c.id === catId);
    if (!cat) return;

    currentCat = cat;

    // 1) Avval view ni ko'rsatamiz — elementlar DOM da bo'ladi
    showLoading(true);
    showView('book');

    // 2) Eski PageFlip ni yo'q qilamiz
    destroyFlip();

    // 3) Elementlarni tozalaymiz
    const flipEl     = $('flipbook');
    const thumbsList = $('thumbs-list');
    if (!flipEl || !thumbsList) { showLoading(false); return; }

    flipEl.innerHTML     = '';
    thumbsList.innerHTML = '';

    $('reader-title').textContent = `${cat.name.toUpperCase()} (${cat.badge})`;
    $('total-pages').textContent  = cat.count;
    $('page-input').value         = 1;
    $('page-input').max           = cat.count;

    // 4) Sahifalarni quramiz
    for (let i = 0; i < cat.count; i++) {
        const num = String(i).padStart(2, '0');
        const src = `${cat.folder}/${num}.webp`;

        const pg  = document.createElement('div');
        pg.className = 'page' + (i === 0 || i === cat.count - 1 ? ' --hard' : '');

        const img = document.createElement('img');
        img.src     = src;
        img.alt     = `Sahifa ${i + 1}`;
        img.loading = i < 3 ? 'eager' : 'lazy';
        pg.appendChild(img);
        flipEl.appendChild(pg);

        buildThumb(src, i);
    }

    resetZoom();

    // 5) PageFlip ni ishga tushiramiz
    requestAnimationFrame(() => requestAnimationFrame(() => {
        setTimeout(initPageFlip, 250);
    }));
}

function initPageFlip() {
    const flipEl = $('flipbook');
    if (!flipEl) { showLoading(false); return; }

    const pages = flipEl.querySelectorAll('.page');
    if (!pages.length) { showLoading(false); return; }

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
            mobileScrollSupport: true,
            usePortrait:         true,
            drawShadow:          true,
            flippingTime:        700
        });

        pf.loadFromHTML(pages);

        pf.on('flip', e => {
            $('page-input').value = e.data + 1;
            updateNav();
            activateThumb(e.data);
        });

        pf.on('changeState', updateNav);
        updateNav();

    } catch(err) {
        console.error('PageFlip xatosi:', err);
    }

    showLoading(false);
}

// ================================================================
// GO HOME
// ================================================================
function goHome() {
    destroyFlip();
    const flipEl = $('flipbook');
    if (flipEl) flipEl.innerHTML = '';
    const tl = $('thumbs-list');
    if (tl) tl.innerHTML = '';
    closeThumbs();
    resetZoom();
    showView('home');
}

function destroyFlip() {
    if (!pf) return;
    try { pf.destroy(); } catch(e) {}
    pf = null;

    // MUHIM: page-flip kutubxonasining destroy() metodi #flipbook
    // elementining ICHINI emas, balki O'ZINI butunlay DOM'dan olib
    // tashlaydi (this.block.remove()). Shu sababli keyingi safar
    // openBook() chaqirilganda $('flipbook') -> null qaytaradi va
    // funksiya jim chiqib ketadi. Shuning uchun #flipbook ni har safar
    // qaytadan yaratib, joyiga qo'yib qo'yamiz.
    const zoomWrapper = $('zoom-wrapper');
    if (zoomWrapper && !$('flipbook')) {
        const fresh = document.createElement('div');
        fresh.id = 'flipbook';
        zoomWrapper.appendChild(fresh);
    }
}

// ================================================================
// THUMBNAILS
// ================================================================
function buildThumb(src, idx) {
    const tl = $('thumbs-list');
    if (!tl) return;
    const item = document.createElement('div');
    item.className = 'thumb-item' + (idx === 0 ? ' on' : '');
    item.dataset.i = idx;
    item.innerHTML = `<img src="${src}" alt="Sahifa ${idx+1}" loading="lazy"><div class="thumb-num">${idx+1}</div>`;
    item.addEventListener('click', () => { if (pf) pf.flip(idx); });
    tl.appendChild(item);
}

function activateThumb(idx) {
    const tl = $('thumbs-list');
    if (!tl) return;
    tl.querySelectorAll('.thumb-item').forEach((e, i) => e.classList.toggle('on', i === idx));
    const active = tl.querySelector('.thumb-item.on');
    if (active) active.scrollIntoView({ behavior:'smooth', block:'nearest' });
}

function toggleThumbs() {
    thumbsOpen = !thumbsOpen;
    $('thumbs-panel').classList.toggle('open', thumbsOpen);
    $('thumbs-btn').classList.toggle('on', thumbsOpen);
}

function closeThumbs() {
    thumbsOpen = false;
    $('thumbs-panel').classList.remove('open');
    $('thumbs-btn').classList.remove('on');
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
    $('page-input').value = pg + 1;
}

function updateNav() {
    if (!pf) return;
    const cur   = pf.getCurrentPageIndex();
    const total = pf.getPageCount();
    $('prev-btn').disabled = cur <= 0;
    $('next-btn').disabled = cur >= total - 1;
    $('page-input').value  = cur + 1;
}

// ================================================================
// ZOOM
// ================================================================
const ZOOM_MIN = 0.4, ZOOM_MAX = 3.0, ZOOM_STEP = 0.25;

function setZoom(z) {
    zoom = Math.max(ZOOM_MIN, Math.min(ZOOM_MAX, z));
    const w = $('zoom-wrapper');
    if (w) w.style.transform = `scale(${zoom})`;
    const d = $('zoom-display');
    if (d) d.textContent = Math.round(zoom * 100) + '%';
}
function zoomIn()    { setZoom(zoom + ZOOM_STEP); }
function zoomOut()   { setZoom(zoom - ZOOM_STEP); }
function resetZoom() { setZoom(1); }

const flipArea = $('flipbook-area');
if (flipArea) {
    flipArea.addEventListener('wheel', e => {
        if (!e.ctrlKey && !e.metaKey) return;
        e.preventDefault();
        e.deltaY < 0 ? zoomIn() : zoomOut();
    }, { passive: false });
}

// ================================================================
// FULLSCREEN
// ================================================================
function toggleFullscreen() {
    if (!document.fullscreenElement) document.documentElement.requestFullscreen?.().catch(()=>{});
    else document.exitFullscreen?.().catch(()=>{});
}

document.addEventListener('fullscreenchange', () => {
    const isFs   = !!document.fullscreenElement;
    const fsIcon = $('fs-icon');
    if (!fsIcon) return;
    fsIcon.innerHTML = isFs
        ? `<polyline points="4,14 4,20 10,20"/><polyline points="20,10 20,4 14,4"/><line x1="14" y1="10" x2="20" y2="4"/><line x1="4" y1="20" x2="10" y2="14"/>`
        : `<polyline points="15,3 21,3 21,9"/><polyline points="9,21 3,21 3,15"/><line x1="21" y1="3" x2="14" y2="10"/><line x1="3" y1="21" x2="10" y2="14"/>`;
    $('fs-btn').classList.toggle('on', isFs);
});

// ================================================================
// KEYBOARD
// ================================================================
document.addEventListener('keydown', e => {
    const bv = $('book-view');
    if (!bv || !bv.classList.contains('active')) return;
    if (e.target === $('page-input')) return;
    switch(e.key) {
        case 'ArrowRight': case 'ArrowDown': case ' ': e.preventDefault(); flipNext(); break;
        case 'ArrowLeft':  case 'ArrowUp':             e.preventDefault(); flipPrev(); break;
        case 'Escape': goHome(); break;
        case '+': case '=': e.preventDefault(); zoomIn();    break;
        case '-':           e.preventDefault(); zoomOut();   break;
        case '0':           e.preventDefault(); resetZoom(); break;
        case 'f': case 'F': toggleFullscreen(); break;
        case 't': case 'T': toggleThumbs();     break;
    }
});

// ================================================================
// PAGE INPUT
// ================================================================
const pageInput = $('page-input');
if (pageInput) {
    pageInput.addEventListener('keydown', e => {
        if (e.key === 'Enter') { jumpToPage(pageInput.value); pageInput.blur(); }
    });
    pageInput.addEventListener('blur', () => jumpToPage(pageInput.value));
}

// ================================================================
// RESIZE
// ================================================================
window.addEventListener('resize', () => { if (pf) try { pf.update(); } catch(e) {} });

// ================================================================
// VIEW SWITCHER
// ================================================================
function showView(which) {
    const home = $('home-view');
    const book = $('book-view');
    if (which === 'book') {
        if (home) home.classList.remove('active');
        if (book) book.classList.add('active');
        document.body.style.overflow = 'hidden';
    } else {
        if (book) book.classList.remove('active');
        if (home) home.classList.add('active');
        document.body.style.overflow = '';
        window.scrollTo(0, 0);
    }
}

// ================================================================
// LOADING
// ================================================================
function showLoading(show) {
    const ls = $('loading-screen');
    if (ls) ls.classList.toggle('show', show);
}

// ================================================================
// INIT
// ================================================================
renderHome();
