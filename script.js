const categories = [
    { id: 'akril', name: 'AKRIL (A1)', folder: 'AKRIL (A1)', count: 11 },
    { id: 'korpus', name: 'KORPUS (K1)', folder: 'KORPUS (K1)', count: 11 },
    { id: 'laminat', name: 'LAMINAT (L1)', folder: 'LAMINAT (L1)', count: 11 }
];

let pageFlip = null;
let currentCategory = null;

const homeView = document.getElementById('home-view');
const bookView = document.getElementById('book-view');
const flipbookEl = document.getElementById('flipbook');
const categoryGrid = document.getElementById('category-grid');
const currentPageEl = document.getElementById('current-page');
const totalPagesEl = document.getElementById('total-pages');
const prevBtn = document.getElementById('prev-btn');
const nextBtn = document.getElementById('next-btn');

function renderHome() {
    categoryGrid.innerHTML = '';

    categories.forEach(cat => {
        const previewSrc = `${encodeURIComponent(cat.folder)}/00.webp`;

        const card = document.createElement('div');
        card.className = 'category-card';

        card.innerHTML = `
            <img src="${previewSrc}" alt="${cat.name}" loading="lazy">
            <div class="category-info">
                <h3>${cat.name}</h3>
                <p>${cat.count} ta sahifa</p>
            </div>
        `;

        card.addEventListener('click', () => {
            openBook(cat.id);
        });

        categoryGrid.appendChild(card);
    });
}

function openBook(catId) {

    currentCategory = categories.find(c => c.id === catId);

    if (!currentCategory) return;

    try {
        if (pageFlip) {
            pageFlip.destroy();
            pageFlip = null;
        }
    } catch (e) {
        console.error(e);
    }

    flipbookEl.innerHTML = '';

    const totalPages = currentCategory.count;

    for (let i = 0; i < totalPages; i++) {

        const num = i.toString().padStart(2, '0');

        const src =
            `${encodeURIComponent(currentCategory.folder)}/${num}.webp`;

        const pageDiv = document.createElement('div');

        pageDiv.className = 'page';

        if (i === 0 || i === totalPages - 1) {
            pageDiv.classList.add('--hard');
        }

        const img = document.createElement('img');

        img.src = src;
        img.alt = `Sahifa ${i + 1}`;
        img.loading = 'lazy';

        pageDiv.appendChild(img);

        flipbookEl.appendChild(pageDiv);
    }

    showView('book-view');

    requestAnimationFrame(() => {

        const pages = flipbookEl.querySelectorAll('.page');

        if (!pages.length) {
            console.error('Sahifalar topilmadi');
            return;
        }

        pageFlip = new St.PageFlip(flipbookEl, {
            width: 400,
            height: 600,
            size: 'stretch',
            minWidth: 300,
            maxWidth: 1000,
            minHeight: 400,
            maxHeight: 1200,
            maxShadowOpacity: 0.6,
            showCover: true,
            mobileScrollSupport: false
        });

        pageFlip.loadFromHTML(pages);

        pageFlip.on('flip', (e) => {

            currentPageEl.textContent = e.data + 1;

            updateButtons();
        });

        currentPageEl.textContent = '1';

        totalPagesEl.textContent = totalPages;

        updateButtons();
    });
}

function updateButtons() {

    if (!pageFlip) return;

    const current = pageFlip.getCurrentPageIndex();

    const total = pageFlip.getPageCount();

    prevBtn.disabled = current <= 0;

    nextBtn.disabled = current >= total - 1;
}

function flipNext() {

    if (!pageFlip) return;

    pageFlip.flipNext();
}

function flipPrev() {

    if (!pageFlip) return;

    pageFlip.flipPrev();
}

function showView(viewId) {

    document
        .querySelectorAll('.view')
        .forEach(v => v.classList.remove('active'));

    document
        .getElementById(viewId)
        .classList.add('active');

    window.scrollTo(0, 0);
}

function goHome() {

    try {

        if (pageFlip) {

            pageFlip.destroy();

            pageFlip = null;
        }

    } catch (e) {
        console.error(e);
    }

    flipbookEl.innerHTML = '';

    showView('home-view');
}

document.addEventListener('keydown', (e) => {

    if (!bookView.classList.contains('active')) return;

    if (!pageFlip) return;

    if (e.key === 'ArrowRight') {
        flipNext();
    }

    if (e.key === 'ArrowLeft') {
        flipPrev();
    }

    if (e.key === 'Escape') {
        goHome();
    }
});

window.addEventListener('resize', () => {

    if (!pageFlip) return;

    try {

        pageFlip.update();

    } catch (e) {
        console.error(e);
    }
});

renderHome();
