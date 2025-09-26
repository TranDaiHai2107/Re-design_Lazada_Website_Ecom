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
  const overlaySearchInput = document.getElementById('overlaySearchInput');
  const overlaySearchBtn = document.getElementById('overlaySearchBtn');
  const resultsGrid = document.getElementById('resultsGrid');
  const resultsTitle = document.getElementById('resultsTitle');
  const historyList = document.getElementById('historyList');
  const clearHistoryBtn = document.getElementById('clearHistory');
  const suggestPanel = document.getElementById('overlaySuggest');

  function openOverlay(queryRaw) {
    const q = (queryRaw || '').trim();
    overlay.style.display = 'block';
    document.body.style.overflow = 'hidden';
    // Ẩn nút chuyển ngôn ngữ khi overlay mở
  const langSwitcher = document.querySelector('.lang-switcher');
  if (langSwitcher) langSwitcher.style.display = 'none';
    if (overlaySearchInput) {
      overlaySearchInput.value = q;
      setTimeout(() => overlaySearchInput.focus(), 0);
    }
    renderResults(q);
    renderHistory();
  }

  function closeOverlay() {
    overlay.style.display = 'none';
    document.body.style.overflow = '';
    // Hiện lại nút chuyển ngôn ngữ khi overlay đóng
  const langSwitcher = document.querySelector('.lang-switcher');
  if (langSwitcher) langSwitcher.style.display = '';
  }

  if (overlayClose) overlayClose.addEventListener('click', closeOverlay);
  if (overlay) overlay.addEventListener('click', function(e){
    if (e.target === overlay) closeOverlay();
  });

  // Overlay input interactions
  if (overlaySearchBtn) overlaySearchBtn.addEventListener('click', function(){
    const q = overlaySearchInput ? overlaySearchInput.value : '';
    if (q && normalizeToAscii(q).includes('vot cau long')) {
      window.location.href = './badminton.html';
      return;
    }
    renderResults(q);
    rememberQuery(q);
    if (searchInput) searchInput.value = q;
    renderHistory();
    hideSuggest();
  });
  if (overlaySearchInput) overlaySearchInput.addEventListener('keyup', function(e){
    if (e.key === 'Enter') {
      const q = overlaySearchInput.value;
      if (q && normalizeToAscii(q).includes('vot cau long')) {
        window.location.href = './badminton.html';
        return;
      }
      renderResults(q);
      rememberQuery(q);
      if (searchInput) searchInput.value = q;
      renderHistory();
      hideSuggest();
      return;
    }
    // Navigation for suggestions
    if (suggestPanel && suggestPanel.style.display !== 'none') {
      const items = Array.from(suggestPanel.querySelectorAll('.autocomplete-item'));
      const activeIndex = items.findIndex(it => it.classList.contains('active'));
      if (e.key === 'ArrowDown') {
        const next = activeIndex < items.length - 1 ? activeIndex + 1 : 0;
        items.forEach(it => it.classList.remove('active'));
        if (items[next]) items[next].classList.add('active');
        e.preventDefault();
        return;
      }
      if (e.key === 'ArrowUp') {
        const prev = activeIndex > 0 ? activeIndex - 1 : items.length - 1;
        items.forEach(it => it.classList.remove('active'));
        if (items[prev]) items[prev].classList.add('active');
        e.preventDefault();
        return;
      }
      if (e.key === 'Escape') {
        hideSuggest();
        return;
      }
    }
    renderResults(overlaySearchInput.value);
    updateSuggest(overlaySearchInput.value);
  });

  // Suggestion helpers
  function updateSuggest(queryRaw) {
    if (!suggestPanel) return;
    const q = normalizeToAscii(queryRaw);
    if (!q) { hideSuggest(); return; }
    // Special suggestion to go to badminton page
    if ('vot cau long'.includes(q) || q.includes('vot cau long')) {
      suggestPanel.innerHTML = '';
      const li = document.createElement('li');
      li.className = 'autocomplete-item active';
      li.textContent = 'Vợt cầu lông - Mở trang sản phẩm';
      li.addEventListener('click', function(){ window.location.href = './badminton.html'; });
      suggestPanel.appendChild(li);
      suggestPanel.style.display = 'block';
      return;
    }
    const titles = productCards.map(card => (card.querySelector('.product-title')?.textContent || '').trim());
    const unique = Array.from(new Set(titles));
    const matched = unique.filter(t => normalizeToAscii(t).includes(q)).slice(0, 8);
    if (matched.length === 0) { hideSuggest(); return; }
    suggestPanel.innerHTML = '';
    matched.forEach((text, idx) => {
      const li = document.createElement('li');
      li.className = 'autocomplete-item' + (idx === 0 ? ' active' : '');
      li.textContent = text;
      li.addEventListener('click', function(){
        if (overlaySearchInput) overlaySearchInput.value = text;
        renderResults(text);
        rememberQuery(text);
        if (searchInput) searchInput.value = text;
        renderHistory();
        hideSuggest();
      });
      suggestPanel.appendChild(li);
    });
    suggestPanel.style.display = 'block';
  }
  function hideSuggest(){ if (suggestPanel) suggestPanel.style.display = 'none'; }

  function renderResults(queryRaw) {
    const q = normalizeToAscii(queryRaw);
    resultsGrid.innerHTML = '';
    let matches = 0;

    // Helper to add a product card into results
    function appendFromCard(card) {
      const titleEl = card.querySelector('.product-title');
      const priceEl = card.querySelector('.price-current');
      const imgEl = card.querySelector('.product-thumb img');
      const item = document.createElement('div');
      item.className = 'result-card';
      item.innerHTML = `
        <div class="thumb"><img src="${imgEl ? imgEl.getAttribute('src') : ''}" alt=""></div>
        <div class="name">${titleEl ? titleEl.textContent : ''}</div>
        <div class="price">${priceEl ? priceEl.textContent : ''}</div>
      `;
      item.addEventListener('click', function(){
        window.location.href = './mooncake.html';
      });
      resultsGrid.appendChild(item);
    }

    if (!q) {
      // No query: show recommended/popular products (first 8 cards)
      const popular = productCards.slice(0, 8);
      popular.forEach((card) => {
        matches++;
        appendFromCard(card);
      });
      resultsTitle.textContent = document.documentElement.lang === 'en' ? 'Popular products' : 'Sản phẩm phổ biến';
      return;
    }

    // With query: filter and show matches
    productCards.forEach((card) => {
      const haystack = cardSearchText.get(card) || '';
      const isMatch = haystack.includes(q);
      if (!isMatch) return;
      matches++;
      appendFromCard(card);
    });

    resultsTitle.textContent = matches
      ? (document.documentElement.lang === 'en'
        ? `Popular products (${matches})`
        : `Sản phẩm phổ biến (${matches})`)
      : (document.documentElement.lang === 'en'
        ? 'No results found'
        : 'Không tìm thấy kết quả');
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
        if (searchInput) searchInput.value = text;
        if (overlaySearchInput) overlaySearchInput.value = text;
        renderResults(text);
      });
      historyList.appendChild(li);
    });
  }
  if (clearHistoryBtn) clearHistoryBtn.addEventListener('click', function(){
    writeHistory([]); renderHistory();
  });
}

// Dark mode functionality
function setupDarkMode() {
  const darkModeToggle = document.getElementById('darkModeToggle');
  if (!darkModeToggle) return;

  // Load saved theme preference
  const savedTheme = localStorage.getItem('theme');
  if (savedTheme === 'dark') {
    document.body.classList.add('dark-mode');
  }

  darkModeToggle.addEventListener('click', function() {
    document.body.classList.toggle('dark-mode');
    
    // Save theme preference
    const isDarkMode = document.body.classList.contains('dark-mode');
    localStorage.setItem('theme', isDarkMode ? 'dark' : 'light');
  });
}

// Language toggle functionality
function setupLanguageToggle() {
  const langToggleBtn = document.getElementById('langToggleBtn');
  if (langToggleBtn) {
    langToggleBtn.addEventListener('click', function() {
      const currentLang = this.textContent;
      this.textContent = currentLang === 'EN' ? 'VI' : 'EN';
    });
  }
}

// Run after DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', function() {
    setupProductSearch();
    setupDarkMode();
    setupLanguageToggle();
  });
} else {
  setupProductSearch();
  setupDarkMode();
  setupLanguageToggle();
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


