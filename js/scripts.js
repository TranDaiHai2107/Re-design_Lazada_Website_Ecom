// Accent-insensitive normalization (Vietnamese + common diacritics)
function normalizeToAscii(input) {
  if (!input) return "";
  return input
    .toString()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // strip diacritics
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D")
    .toLowerCase()
    .trim();
}

function setupProductSearch() {
  const searchInput = document.querySelector('.search-input');
  const searchBtn = document.querySelector('.search-btn');
  const productCards = Array.from(document.querySelectorAll('.product-card'));

  if (!searchInput || !searchBtn || productCards.length === 0) return;

  // Cache searchable text per card
  const cardSearchText = new Map();
  productCards.forEach((card) => {
    const titleEl = card.querySelector('.product-title');
    const priceEl = card.querySelector('.price-current');
    const metaEl = card.querySelector('.product-meta');
    const raw = [
      titleEl ? titleEl.textContent : '',
      priceEl ? priceEl.textContent : '',
      metaEl ? metaEl.textContent : ''
    ].join(' ');
    cardSearchText.set(card, normalizeToAscii(raw));
  });

  function applyFilter(queryRaw) {
    const query = normalizeToAscii(queryRaw);
    const isEmpty = query.length === 0;
    let visibleCount = 0;

    productCards.forEach((card) => {
      if (isEmpty) {
        card.style.display = '';
        visibleCount++;
        return;
      }
      const haystack = cardSearchText.get(card) || '';
      const match = haystack.includes(query);
      card.style.display = match ? '' : 'none';
      if (match) visibleCount++;
    });

    // Optionally, you could show a simple empty-state
    toggleEmptyState(visibleCount === 0);
  }

  function toggleEmptyState(show) {
    const grid = document.querySelector('.for-you-grid');
    if (!grid) return;
    let emptyEl = document.getElementById('search-empty-state');
    if (show) {
      if (!emptyEl) {
        emptyEl = document.createElement('div');
        emptyEl.id = 'search-empty-state';
        emptyEl.style.gridColumn = '1 / -1';
        emptyEl.style.textAlign = 'center';
        emptyEl.style.color = '#666';
        emptyEl.style.padding = '24px 0';
        emptyEl.textContent = 'Không tìm thấy sản phẩm phù hợp.';
        grid.appendChild(emptyEl);
      }
    } else if (emptyEl) {
      emptyEl.remove();
    }
  }

  // Events
  searchBtn.addEventListener('click', function() {
    applyFilter(searchInput.value);
  });

  searchInput.addEventListener('keyup', function(e) {
    if (e.key === 'Enter') {
      applyFilter(searchInput.value);
      return;
    }
    // Live filtering while typing (optional; keep it lightweight)
    applyFilter(searchInput.value);
  });
}

// Run after DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', setupProductSearch);
} else {
  setupProductSearch();
}


