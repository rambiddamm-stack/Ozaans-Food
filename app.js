// ============================================================
// FOODS CARNIVAL - App Logic (app.js)
// Full ordering system with cart, WhatsApp + Email integration
// PWA ready, offline capable, slow-net optimized
// ============================================================

"use strict";

// ─── State ──────────────────────────────────────────────────
const state = {
  cart: [],
  customerInfo: {
    name: "",
    phone: "",
    address: "",
    orderType: "delivery",
    notes: "",
  },
  searchOpen: false,
  cartOpen: false,
  modalOpen: false,
};

// ─── DOM Helpers ─────────────────────────────────────────────
const $ = (sel, ctx = document) => ctx.querySelector(sel);
const $$ = (sel, ctx = document) => [...ctx.querySelectorAll(sel)];
const el = (tag, cls, html = "") => {
  const e = document.createElement(tag);
  if (cls) e.className = cls;
  if (html) e.innerHTML = html;
  return e;
};

// ─── Toast ───────────────────────────────────────────────────
function toast(msg, type = "default") {
  const container = $("#toast-container");
  const t = el("div", `toast ${type}`, msg);
  container.appendChild(t);
  setTimeout(() => t.remove(), 2800);
}

// ─── Cart Logic ──────────────────────────────────────────────
function addToCart(item) {
  const existing = state.cart.find(
    (c) => c.id === item.id && c.selectedSize === item.selectedSize
  );
  if (existing) {
    existing.qty += 1;
  } else {
    state.cart.push({ ...item, qty: 1 });
  }
  renderCart();
  updateCartBadge();
  toast(`✅ ${item.name} added to cart`, "success");
}

function removeFromCart(id, size) {
  const idx = state.cart.findIndex((c) => c.id === id && c.selectedSize === size);
  if (idx !== -1) {
    const item = state.cart[idx];
    if (item.qty > 1) {
      item.qty -= 1;
    } else {
      state.cart.splice(idx, 1);
    }
  }
  renderCart();
  updateCartBadge();
}

function clearCart() {
  state.cart = [];
  renderCart();
  updateCartBadge();
}

function getCartTotal() {
  return state.cart.reduce((sum, item) => sum + item.price * item.qty, 0);
}

function getCartCount() {
  return state.cart.reduce((sum, item) => sum + item.qty, 0);
}

function updateCartBadge() {
  const count = getCartCount();
  const badge = $("#cart-count");
  if (badge) {
    badge.textContent = count > 99 ? "99+" : count;
    badge.classList.toggle("visible", count > 0);
  }
  // Bounce animation
  const cartBtn = $("#cart-btn");
  if (cartBtn && count > 0) {
    cartBtn.querySelector(".cart-icon")?.classList.remove("bounce");
    void cartBtn.querySelector(".cart-icon")?.offsetWidth; // reflow
    cartBtn.querySelector(".cart-icon")?.classList.add("bounce");
  }
}

// ─── Render Cart ──────────────────────────────────────────────
function renderCart() {
  const cartItemsEl = $("#cart-items");
  const cartEmptyEl = $("#cart-empty");
  const cartFormWrap = $("#cart-form-wrap");
  const cartSummary = $("#cart-summary");
  const checkoutBtn = $("#btn-checkout");
  const whatsappBtn = $("#btn-whatsapp");

  if (!cartItemsEl) return;

  if (state.cart.length === 0) {
    cartItemsEl.innerHTML = "";
    cartEmptyEl?.classList.remove("hidden");
    cartFormWrap?.classList.add("hidden");
    cartSummary?.classList.add("hidden");
    if (checkoutBtn) checkoutBtn.disabled = true;
    if (whatsappBtn) whatsappBtn.disabled = true;
    return;
  }

  cartEmptyEl?.classList.add("hidden");
  cartFormWrap?.classList.remove("hidden");
  cartSummary?.classList.remove("hidden");
  if (checkoutBtn) checkoutBtn.disabled = false;
  if (whatsappBtn) whatsappBtn.disabled = false;

  cartItemsEl.innerHTML = state.cart
    .map(
      (item) => `
    <div class="cart-item" role="listitem">
      <div class="ci-emoji" aria-hidden="true">${item.emoji || "🍽️"}</div>
      <div class="ci-info">
        <div class="ci-name">${escHtml(item.name)}</div>
        <div class="ci-sub">${item.selectedSize ? escHtml(item.selectedSize) : ""} ${item.category ? "· " + escHtml(item.category) : ""}</div>
        <div class="ci-price">${RESTAURANT_INFO.currency} ${(item.price * item.qty).toLocaleString()}</div>
      </div>
      <div class="ci-controls">
        <button class="qty-btn remove" onclick="removeFromCart('${item.id}','${item.selectedSize || ""}')" aria-label="Remove one ${escHtml(item.name)}">−</button>
        <span class="qty-num" aria-live="polite">${item.qty}</span>
        <button class="qty-btn" onclick="addToCart(${JSON.stringify(item).replace(/"/g, "&quot;")})" aria-label="Add one more ${escHtml(item.name)}">+</button>
      </div>
    </div>
  `
    )
    .join("");

  // Summary
  const subtotal = getCartTotal();
  const deliveryFee = state.customerInfo.orderType === "delivery" ? 0 : 0;
  const total = subtotal + deliveryFee;

  const summaryEl = $("#cart-summary");
  if (summaryEl) {
    summaryEl.innerHTML = `
      <div class="summary-row">
        <span class="summary-label">Subtotal (${getCartCount()} items)</span>
        <span class="summary-val">${RESTAURANT_INFO.currency} ${subtotal.toLocaleString()}</span>
      </div>
      <div class="summary-row">
        <span class="summary-label">Delivery Fee</span>
        <span class="summary-val text-gold">${deliveryFee === 0 ? "Free" : RESTAURANT_INFO.currency + " " + deliveryFee}</span>
      </div>
      <div class="summary-row total">
        <span class="summary-label">Total</span>
        <span class="summary-val">${RESTAURANT_INFO.currency} <strong>${total.toLocaleString()}</strong></span>
      </div>
    `;
  }
}

// ─── Build Order Message ──────────────────────────────────────
function buildOrderMessage() {
  const info = state.customerInfo;
  const items = state.cart
    .map(
      (item) =>
        `• ${item.name}${item.selectedSize ? " (" + item.selectedSize + ")" : ""} x${item.qty} = Rs. ${(item.price * item.qty).toLocaleString()}`
    )
    .join("\n");
  const total = getCartTotal();
  const now = new Date().toLocaleString("en-PK", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Asia/Karachi",
  });

  return `🍕 *FOODS CARNIVAL — New Order*
📅 ${now}

👤 *Customer:* ${info.name || "—"}
📞 *Phone:* ${info.phone || "—"}
📍 *Address:* ${info.address || "—"}
🚗 *Order Type:* ${info.orderType === "delivery" ? "Delivery 🛵" : "Pickup 🏪"}
${info.notes ? "📝 *Notes:* " + info.notes : ""}

━━━━━━━━━━━━━━━━━━
🛒 *ORDER ITEMS:*
${items}
━━━━━━━━━━━━━━━━━━
💰 *TOTAL: Rs. ${total.toLocaleString()}*

✅ Please confirm this order.
📍 Foods Carnival, Wah Cantt.`;
}

function buildEmailBody() {
  const info = state.customerInfo;
  const itemsHtml = state.cart
    .map(
      (item) =>
        `<tr><td style="padding:8px 12px;border-bottom:1px solid #333;">${item.name}${item.selectedSize ? " (" + item.selectedSize + ")" : ""}</td><td style="padding:8px 12px;border-bottom:1px solid #333;text-align:center;">${item.qty}</td><td style="padding:8px 12px;border-bottom:1px solid #333;text-align:right;color:#FFD700;">Rs. ${(item.price * item.qty).toLocaleString()}</td></tr>`
    )
    .join("");
  const total = getCartTotal();
  const now = new Date().toLocaleString("en-PK", {
    dateStyle: "long",
    timeStyle: "short",
    timeZone: "Asia/Karachi",
  });

  return `
<html><body style="font-family:Arial,sans-serif;background:#111;color:#fff;padding:24px;">
  <div style="max-width:560px;margin:0 auto;background:#1a1a1a;border-radius:16px;overflow:hidden;border:1px solid #333;">
    <div style="background:#B8001F;padding:24px;text-align:center;">
      <h1 style="font-family:Georgia,serif;font-size:2rem;color:#FFD700;margin:0;">FOODS CARNIVAL</h1>
      <p style="color:#fff;margin:4px 0 0;font-size:0.85rem;letter-spacing:0.1em;">NEW ORDER RECEIVED</p>
    </div>
    <div style="padding:24px;">
      <p style="color:#aaa;font-size:0.82rem;">Received: ${now}</p>
      <h3 style="color:#FFD700;border-bottom:1px solid #333;padding-bottom:8px;">Customer Details</h3>
      <p><strong>Name:</strong> ${info.name || "—"}</p>
      <p><strong>Phone:</strong> ${info.phone || "—"}</p>
      <p><strong>Address:</strong> ${info.address || "—"}</p>
      <p><strong>Order Type:</strong> ${info.orderType === "delivery" ? "Delivery 🛵" : "Pickup 🏪"}</p>
      ${info.notes ? `<p><strong>Notes:</strong> ${info.notes}</p>` : ""}
      <h3 style="color:#FFD700;border-bottom:1px solid #333;padding-bottom:8px;margin-top:20px;">Order Items</h3>
      <table width="100%" cellpadding="0" cellspacing="0">
        <thead><tr style="background:#222;">
          <th style="padding:8px 12px;text-align:left;color:#aaa;font-size:0.8rem;">ITEM</th>
          <th style="padding:8px 12px;text-align:center;color:#aaa;font-size:0.8rem;">QTY</th>
          <th style="padding:8px 12px;text-align:right;color:#aaa;font-size:0.8rem;">PRICE</th>
        </tr></thead>
        <tbody>${itemsHtml}</tbody>
      </table>
      <div style="text-align:right;margin-top:16px;padding-top:16px;border-top:1px solid #444;">
        <span style="font-size:1.5rem;font-weight:800;color:#FFD700;">Total: Rs. ${total.toLocaleString()}</span>
      </div>
    </div>
    <div style="background:#111;padding:16px 24px;text-align:center;color:#666;font-size:0.78rem;">
      Foods Carnival · Shop 7/8 Masjid Ahle Hadees Laiq Ali Chowk, Wah Cantt · 0316-4640160
    </div>
  </div>
</body></html>`;
}

// ─── Place Order ──────────────────────────────────────────────
function placeOrder() {
  const info = state.customerInfo;
  if (!info.name || !info.phone) {
    toast("⚠️ Please enter your name & phone number", "gold");
    $("#cust-name")?.focus();
    return;
  }
  if (info.orderType === "delivery" && !info.address) {
    toast("⚠️ Please enter delivery address", "gold");
    $("#cust-address")?.focus();
    return;
  }
  if (state.cart.length === 0) {
    toast("🛒 Your cart is empty!", "gold");
    return;
  }

  // Open WhatsApp
  const msg = buildOrderMessage();
  const waUrl = `https://wa.me/${RESTAURANT_INFO.whatsapp}?text=${encodeURIComponent(msg)}`;
  window.open(waUrl, "_blank");

  // Also open email
  const subject = `New Order - Foods Carnival - ${info.name}`;
  const emailUrl = `mailto:${RESTAURANT_INFO.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent("Please see the order details below:\n\n" + buildOrderMessage())}`;
  setTimeout(() => {
    window.open(emailUrl, "_blank");
  }, 800);

  // Show success
  closeCart();
  showSuccessModal();
  clearCart();
}

function openWhatsAppOnly() {
  const info = state.customerInfo;
  if (state.cart.length === 0) {
    toast("🛒 Your cart is empty!", "gold");
    return;
  }
  const msg = buildOrderMessage();
  const waUrl = `https://wa.me/${RESTAURANT_INFO.whatsapp}?text=${encodeURIComponent(msg)}`;
  window.open(waUrl, "_blank");
}

// ─── Cart Drawer ──────────────────────────────────────────────
function openCart() {
  state.cartOpen = true;
  $("#cart-drawer")?.classList.add("open");
  $("#cart-overlay")?.classList.add("open");
  document.body.style.overflow = "hidden";
  $("#cart-close")?.focus();
}

function closeCart() {
  state.cartOpen = false;
  $("#cart-drawer")?.classList.remove("open");
  $("#cart-overlay")?.classList.remove("open");
  document.body.style.overflow = "";
  $("#cart-btn")?.focus();
}

// ─── Search ───────────────────────────────────────────────────
function openSearch() {
  state.searchOpen = true;
  $("#search-overlay")?.classList.add("open");
  document.body.style.overflow = "hidden";
  setTimeout(() => $("#search-input")?.focus(), 50);
}

function closeSearch() {
  state.searchOpen = false;
  $("#search-overlay")?.classList.remove("open");
  document.body.style.overflow = "";
  if ($("#search-input")) $("#search-input").value = "";
  if ($("#search-results")) $("#search-results").innerHTML = "";
}

function handleSearch(query) {
  const q = query.trim().toLowerCase();
  const resultsEl = $("#search-results");
  if (!resultsEl) return;

  if (!q) {
    resultsEl.innerHTML = "";
    return;
  }

  const results = [];

  // Search deals
  DEALS.forEach((deal) => {
    if (
      deal.name.toLowerCase().includes(q) ||
      deal.items.some((i) => i.toLowerCase().includes(q)) ||
      deal.description.toLowerCase().includes(q)
    ) {
      results.push({
        id: deal.id,
        name: deal.name,
        cat: "Deals",
        emoji: "🎉",
        price: deal.price,
        type: "deal",
        obj: deal,
      });
    }
  });

  // Search menu
  MENU_CATEGORIES.forEach((cat) => {
    cat.items.forEach((item) => {
      if (
        item.name.toLowerCase().includes(q) ||
        (item.description && item.description.toLowerCase().includes(q)) ||
        cat.name.toLowerCase().includes(q)
      ) {
        results.push({
          id: item.id,
          name: item.name,
          cat: cat.name,
          emoji: cat.emoji,
          price: item.price || item.basePrice || (item.sizes && item.sizes[0].price),
          type: "menu",
          obj: item,
          catObj: cat,
        });
      }
    });
  });

  if (results.length === 0) {
    resultsEl.innerHTML = `<div class="no-results">No results for "<strong>${escHtml(q)}</strong>"</div>`;
    return;
  }

  resultsEl.innerHTML = results
    .slice(0, 10)
    .map(
      (r) => `
    <div class="search-result-item" tabindex="0" role="button"
      onclick="handleSearchResultClick('${r.id}', '${r.type}')"
      onkeydown="if(event.key==='Enter') handleSearchResultClick('${r.id}', '${r.type}')">
      <div>
        <div class="sri-name">${r.emoji} ${escHtml(r.name)}</div>
        <div class="sri-cat">${escHtml(r.cat)}</div>
      </div>
      <div class="sri-price">${RESTAURANT_INFO.currency} ${r.price?.toLocaleString() || "—"}</div>
    </div>
  `
    )
    .join("");
}

function handleSearchResultClick(id, type) {
  closeSearch();
  if (type === "deal") {
    document.getElementById("deals-section")?.scrollIntoView({ behavior: "smooth" });
  } else {
    // Find category
    const cat = MENU_CATEGORIES.find((c) => c.items.some((i) => i.id === id));
    if (cat) {
      document.getElementById("cat-" + cat.id)?.scrollIntoView({ behavior: "smooth" });
    }
  }
}

// ─── Success Modal ────────────────────────────────────────────
function showSuccessModal() {
  state.modalOpen = true;
  $("#success-modal-overlay")?.classList.add("open");
}

function closeSuccessModal() {
  state.modalOpen = false;
  $("#success-modal-overlay")?.classList.remove("open");
}

// ─── Category Nav scroll spy ──────────────────────────────────
function setupScrollSpy() {
  const catEls = $$(".menu-category");
  const pills = $$(".cat-pill");

  if (!catEls.length) return;

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const id = entry.target.id; // "cat-XXXXX"
          pills.forEach((pill) => {
            pill.classList.toggle("active", pill.dataset.target === id);
          });
        }
      });
    },
    { rootMargin: "-40% 0px -50% 0px" }
  );

  catEls.forEach((el) => observer.observe(el));
}

// ─── Render Menu ──────────────────────────────────────────────
function renderMenu() {
  const container = $("#menu-container");
  const navContainer = $("#category-nav");
  if (!container || !navContainer) return;

  // Build category nav pills
  navContainer.innerHTML = MENU_CATEGORIES.map(
    (cat) => `
    <button class="cat-pill" data-target="cat-${cat.id}"
      onclick="scrollToCategory('cat-${cat.id}')"
      aria-label="Go to ${cat.name}">
      <span aria-hidden="true">${cat.emoji}</span> ${cat.name}
    </button>
  `
  ).join("");

  // Build category sections
  container.innerHTML = MENU_CATEGORIES.map((cat) => {
    const itemsHtml = cat.items
      .map((item) => {
        const hasSizes = item.sizes && item.sizes.length > 0;
        const basePrice = hasSizes
          ? item.sizes[0].price
          : item.price || item.basePrice || 0;
        const badgeCls = item.badge === "Signature" || item.badge === "Special" ? "gold" : "";

        return `
        <article class="menu-card" aria-label="${escHtml(item.name)}">
          <div class="menu-card-img">
            <span class="menu-card-emoji" aria-hidden="true">${cat.emoji}</span>
            ${item.badge ? `<span class="menu-card-badge ${badgeCls}" aria-label="${escHtml(item.badge)}">${escHtml(item.badge)}</span>` : ""}
          </div>
          <div class="menu-card-body">
            <h3 class="menu-card-name">${escHtml(item.name)}</h3>
            <p class="menu-card-desc">${escHtml(item.description || "")}</p>
            <div class="menu-card-footer">
              <div class="size-select-wrap">
                ${
                  hasSizes
                    ? `<select class="size-select" id="size-${item.id}" aria-label="Select size for ${escHtml(item.name)}" onchange="updateMenuPrice('${item.id}', this.value, ${JSON.stringify(item.sizes)})">
                    ${item.sizes.map((s) => `<option value="${s.price}">${s.label} — Rs.${s.price}</option>`).join("")}
                  </select>`
                    : `<span class="menu-price"><small>Rs.</small> ${basePrice.toLocaleString()}</span>`
                }
              </div>
              ${hasSizes ? `<span class="menu-price" id="price-${item.id}"><small>Rs.</small> ${basePrice.toLocaleString()}</span>` : ""}
              <button class="btn-add-menu" aria-label="Add ${escHtml(item.name)} to cart"
                onclick="addMenuItemToCart('${item.id}', '${cat.id}', ${JSON.stringify(item).replace(/"/g, "&quot;")}, '${cat.emoji}', '${escHtml(cat.name)}')">
                <span aria-hidden="true">+</span>
              </button>
            </div>
          </div>
        </article>
      `;
      })
      .join("");

    return `
      <section class="menu-category" id="cat-${cat.id}" aria-labelledby="cat-title-${cat.id}">
        <div class="cat-header">
          <div class="cat-icon" aria-hidden="true">${cat.emoji}</div>
          <h2 class="cat-title" id="cat-title-${cat.id}">${cat.name}</h2>
          <div class="cat-divider" role="presentation"></div>
        </div>
        <div class="menu-grid" role="list">
          ${itemsHtml}
        </div>
      </section>
    `;
  }).join("");

  setupScrollSpy();
}

function updateMenuPrice(itemId, newPrice, sizes) {
  const priceEl = document.getElementById("price-" + itemId);
  if (priceEl) {
    priceEl.innerHTML = `<small>Rs.</small> ${parseInt(newPrice).toLocaleString()}`;
  }
}

function addMenuItemToCart(itemId, catId, item, emoji, catName) {
  const sizeSelect = document.getElementById("size-" + itemId);
  let price = item.price || item.basePrice || 0;
  let selectedSize = "";

  if (sizeSelect && item.sizes) {
    price = parseInt(sizeSelect.value);
    const selectedOpt = sizeSelect.options[sizeSelect.selectedIndex];
    selectedSize = selectedOpt.text.split("—")[0].trim();
  }

  addToCart({
    id: itemId,
    name: item.name,
    price,
    selectedSize,
    emoji,
    category: catName,
    qty: 1,
  });
}

// ─── Render Deals ─────────────────────────────────────────────
function renderDeals(filter = "all") {
  const container = $("#deals-grid");
  if (!container) return;

  let filtered = DEALS;
  if (filter === "popular") filtered = DEALS.filter((d) => d.popular);
  if (filter === "budget") filtered = DEALS.filter((d) => d.price <= 600);
  if (filter === "family") filtered = DEALS.filter((d) => d.price > 1500);

  container.innerHTML = filtered
    .map(
      (deal) => `
    <article class="deal-card ${deal.popular ? "popular" : ""}" aria-label="${escHtml(deal.name)} — Rs. ${deal.price}">
      <span class="deal-number" aria-hidden="true">${deal.id.split("-").pop() || ""}</span>
      ${deal.badge ? `<span class="deal-badge">${escHtml(deal.badge)}</span>` : ""}
      <div class="deal-body">
        <h3 class="deal-name">${escHtml(deal.name)}</h3>
        <p class="deal-desc">${escHtml(deal.description)}</p>
        <ul class="deal-items" role="list">
          ${deal.items.map((item) => `<li>${escHtml(item)}</li>`).join("")}
        </ul>
        <div class="deal-footer">
          <div class="deal-price">
            <span class="deal-price-label">Only</span>
            <span class="deal-price-value"><span class="deal-price-currency">Rs.</span>${deal.price.toLocaleString()}</span>
          </div>
          <button class="btn-add-deal" aria-label="Add ${escHtml(deal.name)} to cart for Rs. ${deal.price}"
            onclick="addDealToCart(${JSON.stringify(deal).replace(/"/g, "&quot;")})">
            <span aria-hidden="true">+</span> Add
          </button>
        </div>
      </div>
    </article>
  `
    )
    .join("");
}

function addDealToCart(deal) {
  addToCart({
    id: deal.id,
    name: deal.name,
    price: deal.price,
    selectedSize: "",
    emoji: "🎉",
    category: "Deals",
    qty: 1,
  });
}

// ─── Scroll helpers ───────────────────────────────────────────
function scrollToCategory(targetId) {
  document.getElementById(targetId)?.scrollIntoView({ behavior: "smooth" });
}

function scrollToMenu() {
  document.getElementById("menu-section")?.scrollIntoView({ behavior: "smooth" });
}

function scrollToDeals() {
  document.getElementById("deals-section")?.scrollIntoView({ behavior: "smooth" });
}

// ─── Security helper ─────────────────────────────────────────
function escHtml(str) {
  if (!str) return "";
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

// ─── Customer Form sync ───────────────────────────────────────
function syncCustomerForm() {
  const fields = ["name", "phone", "address", "notes", "orderType"];
  fields.forEach((field) => {
    const el = document.getElementById("cust-" + field);
    if (el) {
      el.addEventListener("input", () => {
        state.customerInfo[field] = el.value;
        if (field === "orderType") renderCart(); // recalculate delivery fee
      });
    }
  });
}

// ─── Offline detection ───────────────────────────────────────
function setupOffline() {
  const banner = $("#offline-banner");
  function update() {
    banner?.classList.toggle("visible", !navigator.onLine);
  }
  window.addEventListener("online", update);
  window.addEventListener("offline", update);
  update();
}

// ─── Service Worker ──────────────────────────────────────────
function registerSW() {
  if ("serviceWorker" in navigator) {
    navigator.serviceWorker
      .register("./sw.js")
      .then(() => console.log("SW registered ✅"))
      .catch((e) => console.warn("SW failed:", e));
  }
}

// ─── Keyboard shortcuts ───────────────────────────────────────
function setupKeyboard() {
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      if (state.modalOpen) closeSuccessModal();
      else if (state.cartOpen) closeCart();
      else if (state.searchOpen) closeSearch();
    }
    if (e.key === "/" && !state.searchOpen && e.target.tagName !== "INPUT" && e.target.tagName !== "TEXTAREA") {
      e.preventDefault();
      openSearch();
    }
  });
}

// ─── Deals filter ────────────────────────────────────────────
function setupDealsFilter() {
  $$(".deals-filter-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      $$(".deals-filter-btn").forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");
      renderDeals(btn.dataset.filter || "all");
    });
  });
}

// ─── Init ─────────────────────────────────────────────────────
function init() {
  renderDeals();
  renderMenu();
  syncCustomerForm();
  setupOffline();
  registerSW();
  setupKeyboard();
  setupDealsFilter();

  // Cart toggle
  $("#cart-btn")?.addEventListener("click", openCart);
  $("#cart-close")?.addEventListener("click", closeCart);
  $("#cart-overlay")?.addEventListener("click", closeCart);

  // Search toggle
  $("#search-btn")?.addEventListener("click", openSearch);
  $("#search-close-btn")?.addEventListener("click", closeSearch);
  $("#search-overlay")?.addEventListener("click", (e) => {
    if (e.target === e.currentTarget) closeSearch();
  });
  $("#search-input")?.addEventListener("input", (e) => handleSearch(e.target.value));

  // Checkout
  $("#btn-checkout")?.addEventListener("click", placeOrder);
  $("#btn-whatsapp")?.addEventListener("click", openWhatsAppOnly);

  // Success modal
  $("#modal-close-btn")?.addEventListener("click", closeSuccessModal);
  $("#modal-new-order-btn")?.addEventListener("click", () => {
    closeSuccessModal();
    scrollToMenu();
  });

  // Order type change
  document.getElementById("cust-orderType")?.addEventListener("change", (e) => {
    state.customerInfo.orderType = e.target.value;
    renderCart();
  });

  // Hero CTA
  document.getElementById("hero-order-btn")?.addEventListener("click", scrollToMenu);
  document.getElementById("hero-deals-btn")?.addEventListener("click", scrollToDeals);

  // Init cart render
  renderCart();

  console.log("🍕 Foods Carnival App loaded");
}

document.addEventListener("DOMContentLoaded", init);

// Expose functions needed by inline HTML handlers
window.addToCart = addToCart;
window.removeFromCart = removeFromCart;
window.addMenuItemToCart = addMenuItemToCart;
window.addDealToCart = addDealToCart;
window.updateMenuPrice = updateMenuPrice;
window.scrollToCategory = scrollToCategory;
window.handleSearchResultClick = handleSearchResultClick;
