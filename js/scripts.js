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
    openOverlay(searchInput.value);
  });

  searchInput.addEventListener('keyup', function(e) {
    if (e.key === 'Enter') {
      openOverlay(searchInput.value);
      return;
    }
    // Live filtering while typing (optional; keep it lightweight)
    applyFilter(searchInput.value);
  });

  // Open overlay when user clicks or focuses the input
  searchInput.addEventListener('focus', function(){
    openOverlay(searchInput.value);
  });
  searchInput.addEventListener('click', function(){
    openOverlay(searchInput.value);
  });

  // --- Overlay logic ---
  const overlay = document.getElementById('searchOverlay');
  const overlayClose = document.getElementById('overlayClose');
  const overlayQuery = document.getElementById('overlayQuery');
  const resultsGrid = document.getElementById('resultsGrid');
  const resultsTitle = document.getElementById('resultsTitle');
  const historyList = document.getElementById('historyList');
  const clearHistoryBtn = document.getElementById('clearHistory');

  function openOverlay(queryRaw) {
    const q = (queryRaw || '').trim();
    overlay.style.display = 'block';
    document.body.style.overflow = 'hidden';
    overlayQuery.textContent = q ? q : 'Tìm kiếm';
    renderResults(q);
    rememberQuery(q);
    renderHistory();
  }

  function closeOverlay() {
    overlay.style.display = 'none';
    document.body.style.overflow = '';
  }

  if (overlayClose) overlayClose.addEventListener('click', closeOverlay);
  if (overlay) overlay.addEventListener('click', function(e){
    if (e.target === overlay) closeOverlay();
  });

  function renderResults(queryRaw) {
    const q = normalizeToAscii(queryRaw);
    resultsGrid.innerHTML = '';
    let matches = 0;

    productCards.forEach((card) => {
      const titleEl = card.querySelector('.product-title');
      const priceEl = card.querySelector('.price-current');
      const imgEl = card.querySelector('.product-thumb img');
      const haystack = cardSearchText.get(card) || '';
      const isMatch = q ? haystack.includes(q) : true;
      if (!isMatch) return;
      matches++;

      const item = document.createElement('div');
      item.className = 'result-card';
      item.innerHTML = `
        <div class="thumb"><img src="${imgEl ? imgEl.getAttribute('src') : ''}" alt=""></div>
        <div class="name">${titleEl ? titleEl.textContent : ''}</div>
        <div class="price">${priceEl ? priceEl.textContent : ''}</div>
      `;
      item.addEventListener('click', function(){
        // Điều hướng sang trang sản phẩm chi tiết như hiện đang làm
        window.location.href = './mooncake.html';
      });
      resultsGrid.appendChild(item);
    });

    resultsTitle.textContent = matches ? `Kết quả (${matches})` : 'Không tìm thấy kết quả';
  }

  const HISTORY_KEY = 'lz_search_history_v1';
  function readHistory() {
    try { return JSON.parse(localStorage.getItem(HISTORY_KEY) || '[]'); } catch { return []; }
  }
  function writeHistory(list) {
    try { localStorage.setItem(HISTORY_KEY, JSON.stringify(list.slice(0, 12))); } catch {}
  }
  function rememberQuery(q) {
    const query = (q || '').trim();
    if (!query) return;
    const cur = readHistory().filter(x => x.toLowerCase() !== query.toLowerCase());
    cur.unshift(query);
    writeHistory(cur);
  }
  function renderHistory() {
    const items = readHistory();
    historyList.innerHTML = '';
    items.forEach(text => {
      const li = document.createElement('li');
      li.textContent = text;
      li.addEventListener('click', function(){
        searchInput.value = text;
        overlayQuery.textContent = text;
        renderResults(text);
      });
      historyList.appendChild(li);
    });
  }
  if (clearHistoryBtn) clearHistoryBtn.addEventListener('click', function(){
    writeHistory([]); renderHistory();
  });
}

// Run after DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', setupProductSearch);
} else {
  setupProductSearch();
}

// On homepage, redirect search to search.html
(function(){
  const isSearchPage = typeof window !== 'undefined' && window.__IS_SEARCH_PAGE__ === true;
  if (isSearchPage) return;
  const searchInput = document.querySelector('.search-input');
  const searchBtn = document.querySelector('.search-btn');
  if (!searchInput || !searchBtn) return;
  function gotoSearch() {
    const q = encodeURIComponent(searchInput.value || '');
    window.location.href = './search.html?q=' + q;
  }
  searchBtn.addEventListener('click', gotoSearch);
  searchInput.addEventListener('keyup', function(e){ if (e.key === 'Enter') gotoSearch(); });
})();


