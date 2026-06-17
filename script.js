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

// 1. Bosh sahifani chizish
function renderHome() {
    categoryGrid.innerHTML = '';
    categories.forEach(cat => {
        const previewSrc = `${encodeURIComponent(cat.folder)}/00.webp`;
        const card = document.createElement('div');
        card.className = 'category-card';
        card.onclick = () => openBook(cat.id);
        card.innerHTML = `
            <img src="${previewSrc}" alt="${cat.name}" loading="lazy">
            <div class="category-info">
                <h3>${cat.name}</h3>
                <p>${cat.count} ta sahifa</p>
            </div>
        `;
        categoryGrid.appendChild(card);
    });
}

// 2. Kitobni ochish va PageFlip ni ishga tushirish
function openBook(catId) {
    currentCategory = categories.find(c => c.id === catId);
    if (!currentCategory) return;

    // Oldingi kitobni tozalash
    if (pageFlip) {
        pageFlip.destroy();
    }

    flipbookEl.innerHTML = '';
    const totalPages = currentCategory.count;

    // Sahifalarni yaratish
    for (let i = 0; i < totalPages; i++) {
        const num = i.toString().padStart(2, '0');
        const src = `${encodeURIComponent(currentCategory.folder)}/${num}.webp`;
        
        const pageDiv = document.createElement('div');
        pageDiv.className = 'page';
        
        // Birinchi va oxirgi sahifalarga "qattiq muqova" effekti
        if (i === 0 || i === totalPages - 1) {
            pageDiv.classList.add('--hard');
        }
        
        pageDiv.innerHTML = `<img src="${src}" alt="Sahifa ${i + 1}" loading="lazy">`;
        flipbookEl.appendChild(pageDiv);
    }

    // PageFlip ni ishga tushirish (DOM tayyor bo'lishi uchun ozgina kutamiz)
    setTimeout(() => {
        pageFlip = new St.PageFlip(flipbookEl, {
            width: 400,       // Baza kenglik
            height: 600,      // Baza balandlik
            size: 'stretch',  // Ekran o
