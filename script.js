// script.js
const categories = [
    { id: 'akril', name: 'AKRIL (A1)', folder: 'AKRIL (A1)' },
    { id: 'korpus', name: 'KORPUS (K1)', folder: 'KORPUS (K1)' },
    { id: 'laminat', name: 'LAMINAT (L1)', folder: 'LAMINAT (L1)' }
];

const imagesPerCategory = 11; // 00.jpg to 10.jpg
const app = document.getElementById('app');

// Function to render the main categories view
function renderCategories() {
    let html = '<div class="categories-grid">';
    categories.forEach(cat => {
        // Use the first image (00.jpg) as a preview for the category card
        const previewImg = `${encodeURIComponent(cat.folder)}/00.jpg`;
        html += `
            <div class="category-card" onclick="renderGallery('${cat.id}')">
                <img src="${previewImg}" alt="${cat.name}" onerror="this.src='https://via.placeholder.com/300x200?text=${encodeURIComponent(cat.name)}'">
                <h2>${cat.name}</h2>
            </div>
        `;
    });
    html += '</div>';
    app.innerHTML = html;
}

// Function to render the gallery for a specific category
function renderGallery(categoryId) {
    const category = categories.find(c => c.id === categoryId);
    if (!category) return;

    let html = `
        <div class="gallery-header">
            <button class="back-btn" onclick="renderCategories()">
                ← Orqaga
            </button>
            <h2>${category.name}</h2>
        </div>
        <div class="gallery-grid">
    `;

    for (let i = 0; i < imagesPerCategory; i++) {
        const imgName = i.toString().padStart(2, '0') + '.jpg';
        const imgUrl = `${encodeURIComponent(category.folder)}/${imgName}`;
        html += `
            <div class="gallery-item" onclick="openLightbox('${imgUrl}')">
                <img src="${imgUrl}" alt="${category.name} - ${imgName}" onerror="this.src='https://via.placeholder.com/250x200?text=Image+${i}'">
            </div>
        `;
    }

    html += '</div>';
    app.innerHTML = html;
}

// Function to open lightbox
function openLightbox(imgUrl) {
    const lightbox = document.getElementById('lightbox');
    const lightboxImg = document.getElementById('lightbox-img');
    lightboxImg.src = imgUrl;
    lightbox.classList.add('active');
}

// Function to close lightbox
function closeLightbox() {
    const lightbox = document.getElementById('lightbox');
    lightbox.classList.remove('active');
}

// Initialize the app
document.addEventListener('DOMContentLoaded', () => {
    // Add lightbox HTML to body
    const lightboxHtml = `
        <div id="lightbox" class="lightbox" onclick="closeLightbox()">
            <span class="lightbox-close">&times;</span>
            <img id="lightbox-img" src="" alt="Full size image">
        </div>
    `;
    document.body.insertAdjacentHTML('beforeend', lightboxHtml);

    // Render initial categories view
    renderCategories();
});