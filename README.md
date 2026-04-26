# 🍕 Foods Carnival — Online Ordering Website

**Fast Food & Refreshment Point · Wah Cantt**

A production-grade, PWA-enabled restaurant ordering website built for:
- Slow internet areas (offline capable via Service Worker)
- Mobile-first design
- Automated WhatsApp + Email ordering
- Zero external dependencies (works locally)

---

## 📁 File Structure

```
foods-carnival/
├── index.html       ← Main website (all pages)
├── style.css        ← Full design system
├── app.js           ← Application logic (cart, ordering, search)
├── data.js          ← All menu data, deals, restaurant info
├── sw.js            ← Service Worker (offline/slow-net support)
├── manifest.json    ← PWA manifest
├── favicon.svg      ← SVG favicon/icon
└── README.md        ← This file
```

---

## 🚀 Deploy on GitHub Pages

1. Create a new GitHub repository (e.g. `foods-carnival`)
2. Upload all files to the repo root
3. Go to **Settings → Pages**
4. Set Source: **Deploy from a branch → main → / (root)**
5. Click **Save**
6. Your site is live at: `https://yourusername.github.io/foods-carnival/`

---

## ✨ Features

| Feature | Details |
|---|---|
| 🛒 Cart System | Add/remove items, quantity control |
| 💳 Bill Calculation | Auto-calculates subtotal + delivery |
| 📦 Deal Packages | 16 curated deals with filtering |
| 📱 Mobile First | Optimized for all screen sizes |
| 🔍 Search | Live search across menu & deals |
| 📡 Offline Support | Service Worker caches all assets |
| 💬 WhatsApp Order | One-tap order sending |
| 📧 Email Order | Auto-formatted email order |
| ♿ Accessible | WCAG AA: ARIA, keyboard nav, skip links |
| 🎨 PWA | Installable as app on phone |

---

## 📞 Contact Info (pre-configured)

- **Phone/WhatsApp:** 0316-4640160
- **Email:** foodscarnival.wah@gmail.com
- **Location:** Shop 7/8, Masjid Ahle Hadees Laiq Ali Chowk, Wah Cantt

---

## 🔧 Customization

All restaurant data is in `data.js`:
- `RESTAURANT_INFO` — Update phone, email, location
- `MENU_CATEGORIES` — Add/remove/edit menu items & prices
- `DEALS` — Add/remove/edit deal packages

---

## 📱 Install as App (PWA)

On Android: Open in Chrome → Menu → "Add to Home Screen"  
On iOS: Open in Safari → Share → "Add to Home Screen"

---

*Built with ❤️ — Apple-level attention to detail*
