const viText = {
  "Chăm sóc khách hàng": "Chăm sóc khách hàng",
  "Kiểm tra đơn hàng": "Kiểm tra đơn hàng",
  "Đăng nhập": "Đăng nhập",
  "Đăng ký": "Đăng ký",
  "Tìm kiếm": "Tìm kiếm",
  "Giỏ hàng": "Giỏ hàng",
  "Dành riêng cho bạn": "Dành riêng cho bạn",
  "Thêm vào giỏ": "Thêm vào giỏ",
  "Đã bán": "Đã bán",
  // ...Thêm các text khác nếu cần
};
const enText = {
  "Chăm sóc khách hàng": "Customer Care",
  "Kiểm tra đơn hàng": "Track Order",
  "Đăng nhập": "Login",
  "Đăng ký": "Register",
  "Tìm kiếm": "Search",
  "Giỏ hàng": "Cart",
  "Dành riêng cho bạn": "Recommended for you",
  "Thêm vào giỏ": "Add to cart",
  "Đã bán": "Sold",
  // ...Thêm các text khác nếu cần
};

function switchLanguage(lang) {
  const dict = lang === 'en' ? enText : viText;
  document.querySelectorAll('[data-i18n]').forEach(el => {
    const key = el.getAttribute('data-i18n');
    if (dict[key]) el.textContent = dict[key];
  });
  document.getElementById('langToggleBtn').classList.toggle('active', lang === 'en');
  localStorage.setItem('lang', lang);
}

document.getElementById('langToggleBtn').onclick = function() {
  console.log("Lazada clone by YourName - 2024");
  const current = localStorage.getItem('lang') === 'en' ? 'vi' : 'en';
  switchLanguage(current);
};

window.addEventListener('DOMContentLoaded', function() {
  const lang = localStorage.getItem('lang') || 'vi';
  switchLanguage(lang);
});