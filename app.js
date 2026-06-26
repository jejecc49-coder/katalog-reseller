const STORAGE_KEY = "resellerCatalogSettings";
const publicConfig = window.CATALOG_CONFIG || {};

const demoProducts = [
  {
    sku: "A001",
    name: "Tas Selempang Wanita",
    category: "Tas",
    image:
      "https://images.unsplash.com/photo-1594223274512-ad4803739b7c?auto=format&fit=crop&w=900&q=80",
    price: 75000,
    minOrder: 3,
  },
  {
    sku: "A002",
    name: "Dompet Mini Lipat",
    category: "Dompet",
    image:
      "https://images.unsplash.com/photo-1627123424574-724758594e93?auto=format&fit=crop&w=900&q=80",
    price: 35000,
    minOrder: 6,
  },
  {
    sku: "A003",
    name: "Pouch Travel Organizer",
    category: "Aksesoris",
    image:
      "https://images.unsplash.com/photo-1584917865442-de89df76afd3?auto=format&fit=crop&w=900&q=80",
    price: 55000,
    minOrder: 3,
  },
  {
    sku: "A004",
    name: "Sling Bag Canvas",
    category: "Tas",
    image:
      "https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=900&q=80",
    price: 89000,
    minOrder: 2,
  },
];

const state = {
  isAdmin: new URLSearchParams(window.location.search).get("admin") === "1",
  products: [],
  cart: new Map(),
  query: "",
  category: "all",
  settings: {
    sheetUrl: publicConfig.sheetCsvUrl || "",
    whatsapp: publicConfig.whatsappNumber || "6281234567890",
  },
};

const elements = {
  storeTitle: document.querySelector("#storeTitle"),
  sidebarStoreTitle: document.querySelector("#sidebarStoreTitle"),
  catalog: document.querySelector("#catalog"),
  categorySelect: document.querySelector("#categorySelect"),
  searchInput: document.querySelector("#searchInput"),
  totalProducts: document.querySelector("#totalProducts"),
  lastUpdated: document.querySelector("#lastUpdated"),
  statusBox: document.querySelector("#statusBox"),
  categoryNav: document.querySelector("#categoryNav"),
  modeTitle: document.querySelector("#modeTitle"),
  modeDescription: document.querySelector("#modeDescription"),
  cartPanel: document.querySelector("#cartPanel"),
  cartItems: document.querySelector("#cartItems"),
  cartTotal: document.querySelector("#cartTotal"),
  cartBadge: document.querySelector("#cartBadge"),
  settingsDialog: document.querySelector("#settingsDialog"),
  sheetUrlInput: document.querySelector("#sheetUrlInput"),
  whatsappInput: document.querySelector("#whatsappInput"),
  sidebarSheetUrlInput: document.querySelector("#sidebarSheetUrlInput"),
  sidebarWhatsappInput: document.querySelector("#sidebarWhatsappInput"),
  saveConfirm: document.querySelector("#saveConfirm"),
};

function applyAccessMode() {
  document.body.classList.toggle("admin-mode", state.isAdmin);
  const storeName = publicConfig.storeName || "Katalog Reseller";
  if (elements.storeTitle) elements.storeTitle.textContent = storeName;
  if (elements.sidebarStoreTitle) elements.sidebarStoreTitle.textContent = storeName;
}

function formatRupiah(value) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(Number(value || 0));
}

function cleanHeader(header) {
  return String(header || "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "_")
    .replace(/[^\w]/g, "");
}

function parseNumber(value) {
  const normalized = String(value || "").replace(/[^\d-]/g, "");
  return Number(normalized || 0);
}

function parseCsv(text) {
  const rows = [];
  let current = "";
  let row = [];
  let inQuotes = false;

  for (let i = 0; i < text.length; i += 1) {
    const char = text[i];
    const next = text[i + 1];

    if (char === '"' && next === '"') {
      current += '"';
      i += 1;
    } else if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === "," && !inQuotes) {
      row.push(current);
      current = "";
    } else if ((char === "\n" || char === "\r") && !inQuotes) {
      if (char === "\r" && next === "\n") i += 1;
      row.push(current);
      if (row.some((cell) => cell.trim() !== "")) rows.push(row);
      row = [];
      current = "";
    } else {
      current += char;
    }
  }

  row.push(current);
  if (row.some((cell) => cell.trim() !== "")) rows.push(row);
  return rows;
}

function firstValue(row, keys) {
  for (const key of keys) {
    if (row[key] !== undefined && row[key] !== "") return row[key];
  }
  return "";
}

function mapSheetRows(rows) {
  if (rows.length < 2) return [];
  const headers = rows[0].map(cleanHeader);

  return rows.slice(1).map((cells, index) => {
    const row = {};
    headers.forEach((header, cellIndex) => {
      row[header] = String(cells[cellIndex] || "").trim();
    });

    return {
      sku: firstValue(row, ["sku", "kode", "kode_produk"]) || `SKU-${index + 1}`,
      name: firstValue(row, ["nama_produk", "nama", "produk", "product_name"]),
      category: firstValue(row, ["kategori", "category"]) || "Lainnya",
      image: firstValue(row, ["foto", "gambar", "image", "link_foto", "url_foto"]),
      price: parseNumber(firstValue(row, ["harga", "harga_produk", "harga_ecer", "harga_normal", "retail_price"])),
      minOrder: parseNumber(firstValue(row, ["minimal_order", "minimal_order_reseller", "min_order", "min_order_reseller", "moq", "moq_reseller"])) || 1,
    };
  }).filter((product) => product.name);
}

function saveSettings() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state.settings));
}

function normalizeWhatsapp(value) {
  let phone = String(value || "").replace(/[^\d]/g, "");
  if (phone.startsWith("0")) phone = `62${phone.slice(1)}`;
  if (phone.startsWith("8")) phone = `62${phone}`;
  return phone;
}

function loadSettings() {
  if (!state.isAdmin) return;

  const saved = localStorage.getItem(STORAGE_KEY);
  if (!saved) return;

  try {
    state.settings = { ...state.settings, ...JSON.parse(saved) };
  } catch {
    localStorage.removeItem(STORAGE_KEY);
  }
}

function showStatus(message, type = "info") {
  elements.statusBox.hidden = !message;
  elements.statusBox.textContent = message || "";
  elements.statusBox.dataset.type = type;
}

async function loadProducts() {
  if (!state.settings.sheetUrl) {
    state.products = demoProducts;
    showStatus(state.isAdmin
      ? "Saat ini memakai data contoh. Buka pengaturan untuk menempel link CSV Google Sheets."
      : "Saat ini memakai data contoh. Isi link CSV Google Sheets di config.js sebelum membagikan katalog.");
    render();
    return;
  }

  showStatus("Mengambil data dari Google Sheets...");

  try {
    const response = await fetch(state.settings.sheetUrl, { cache: "no-store" });
    if (!response.ok) throw new Error(`Gagal membaca data: ${response.status}`);

    const csv = await response.text();
    const products = mapSheetRows(parseCsv(csv));
    if (!products.length) throw new Error("Spreadsheet terbaca, tetapi belum ada produk yang valid.");

    state.products = products;
    showStatus("");
    render();
  } catch (error) {
    state.products = demoProducts;
    showStatus(`${error.message}. Data contoh ditampilkan sementara.`, "error");
    render();
  }
}

function getFilteredProducts() {
  return state.products.filter((product) => {
    const keyword = `${product.sku} ${product.name}`.toLowerCase();
    const matchesQuery = keyword.includes(state.query.toLowerCase());
    const matchesCategory = state.category === "all" || product.category === state.category;
    return matchesQuery && matchesCategory;
  });
}

function renderCategories() {
  const selected = state.category;
  const categories = [...new Set(state.products.map((product) => product.category))].sort();
  elements.categorySelect.innerHTML = '<option value="all">Semua kategori</option>';
  if (elements.categoryNav) elements.categoryNav.innerHTML = "";

  categories.forEach((category) => {
    const option = document.createElement("option");
    option.value = category;
    option.textContent = category;
    elements.categorySelect.appendChild(option);
  });

  elements.categorySelect.value = categories.includes(selected) ? selected : "all";
  state.category = elements.categorySelect.value;

  if (elements.categoryNav) {
    const navItems = [{ value: "all", label: "Semua Produk" }, ...categories.map((category) => ({ value: category, label: category }))];
    navItems.forEach((item) => {
      const button = document.createElement("button");
      button.type = "button";
      button.textContent = item.label;
      button.dataset.category = item.value;
      button.classList.toggle("active", item.value === state.category);
      elements.categoryNav.appendChild(button);
    });
  }
}

function renderProducts() {
  const products = getFilteredProducts();
  elements.catalog.innerHTML = "";

  if (!products.length) {
    elements.catalog.innerHTML = '<div class="empty">Produk tidak ditemukan.</div>';
    return;
  }

  const fragment = document.createDocumentFragment();
  products.forEach((product) => {
    const card = document.createElement("article");
    card.className = "product-card";
    card.innerHTML = `
      <div class="product-media">
        <span class="badge">Grosir chat admin</span>
        <img src="${product.image || "https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?auto=format&fit=crop&w=900&q=80"}" alt="${product.name}" loading="lazy">
      </div>
      <div class="product-body">
        <span class="sku">${product.sku}</span>
        <h3>${product.name}</h3>
        <div class="meta">
          <span>${product.category}</span>
          <span>Min order ${product.minOrder} pcs</span>
        </div>
        <div class="price-row">
          <span>Harga</span>
          <strong>${formatRupiah(product.price)}</strong>
        </div>
        <p class="product-note">Harga grosir chat admin</p>
        <div class="qty-row">
          <button type="button" data-step="-1" data-sku="${product.sku}" aria-label="Kurangi jumlah">-</button>
          <input id="qty-${product.sku}" type="number" min="${product.minOrder}" value="${product.minOrder}" aria-label="Jumlah ${product.name}">
          <button type="button" data-step="1" data-sku="${product.sku}" aria-label="Tambah jumlah">+</button>
        </div>
        <button class="add-button" type="button" data-add="${product.sku}">Tambah order</button>
      </div>
    `;
    fragment.appendChild(card);
  });

  elements.catalog.appendChild(fragment);
}

function renderCart() {
  elements.cartItems.innerHTML = "";
  let totalQty = 0;
  let totalPrice = 0;

  if (!state.cart.size) {
    elements.cartItems.innerHTML = '<div class="empty">Belum ada produk di keranjang.</div>';
  }

  state.cart.forEach((item) => {
    totalQty += item.qty;
    totalPrice += item.qty * item.price;

    const line = document.createElement("div");
    line.className = "cart-line";
    line.innerHTML = `
      <strong>${item.product.name}</strong>
      <small>${item.product.sku} x ${item.qty} - ${formatRupiah(item.qty * item.price)}</small>
    `;
    elements.cartItems.appendChild(line);
  });

  elements.cartBadge.textContent = String(totalQty);
  elements.cartTotal.textContent = formatRupiah(totalPrice);
}

function renderSummary() {
  elements.totalProducts.textContent = String(state.products.length);
  elements.lastUpdated.textContent = `Update ${new Date().toLocaleString("id-ID", {
    dateStyle: "medium",
    timeStyle: "short",
  })}`;

  if (elements.modeTitle && elements.modeDescription) {
    elements.modeTitle.textContent = "Katalog khusus reseller";
    elements.modeDescription.textContent = "Minimal order mengikuti tiap produk. Harga grosir chat admin untuk kuantitas besar.";
  }

  if (elements.sidebarSheetUrlInput && elements.sidebarWhatsappInput) {
    elements.sidebarSheetUrlInput.value = state.settings.sheetUrl;
    elements.sidebarWhatsappInput.value = state.settings.whatsapp;
  }
}

function render() {
  renderCategories();
  renderProducts();
  renderCart();
  renderSummary();
}

function addToCart(sku) {
  const product = state.products.find((item) => item.sku === sku);
  const qtyInput = document.querySelector(`#qty-${CSS.escape(sku)}`);
  const qty = Math.max(Number(qtyInput?.value || product.minOrder), product.minOrder);
  const price = product.price;

  const existing = state.cart.get(sku);
  state.cart.set(sku, {
    product,
    price,
    qty: (existing?.qty || 0) + qty,
  });

  renderCart();
  elements.cartPanel.classList.add("open");
}

function buildWhatsappMessage() {
  const lines = ["Halo, saya mau order:"];
  let total = 0;

  state.cart.forEach((item) => {
    const subtotal = item.qty * item.price;
    total += subtotal;
    lines.push(`- ${item.product.sku} | ${item.product.name} | ${item.qty} pcs | ${formatRupiah(subtotal)}`);
  });

  lines.push(`Total estimasi: ${formatRupiah(total)}`);
  lines.push("Catatan: harga grosir chat admin.");
  lines.push("Nama:");
  lines.push("Alamat:");
  return encodeURIComponent(lines.join("\n"));
}

function checkout() {
  if (!state.cart.size) {
    showStatus("Keranjang masih kosong.");
    return;
  }

  const phone = state.settings.whatsapp.replace(/[^\d]/g, "");
  const url = `https://wa.me/${phone}?text=${buildWhatsappMessage()}`;
  window.open(url, "_blank", "noopener,noreferrer");
}

function bindEvents() {
  elements.searchInput.addEventListener("input", (event) => {
    state.query = event.target.value;
    renderProducts();
  });

  elements.categorySelect.addEventListener("change", (event) => {
    state.category = event.target.value;
    render();
  });

  elements.categoryNav?.addEventListener("click", (event) => {
    const button = event.target.closest("[data-category]");
    if (!button) return;

    state.category = button.dataset.category;
    render();
  });

  elements.catalog.addEventListener("click", (event) => {
    const stepButton = event.target.closest("[data-step]");
    const addButton = event.target.closest("[data-add]");

    if (stepButton) {
      const input = document.querySelector(`#qty-${CSS.escape(stepButton.dataset.sku)}`);
      input.value = Math.max(Number(input.min), Number(input.value) + Number(stepButton.dataset.step));
    }

    if (addButton) addToCart(addButton.dataset.add);
  });

  document.querySelector("#openCartButton").addEventListener("click", () => elements.cartPanel.classList.add("open"));
  document.querySelector("#closeCartButton").addEventListener("click", () => elements.cartPanel.classList.remove("open"));
  document.querySelector("#checkoutButton").addEventListener("click", checkout);
  document.querySelector("#refreshButton").addEventListener("click", () => loadProducts());
  document.querySelector("#guideButton")?.addEventListener("click", () => {
    if (state.isAdmin) elements.settingsDialog.showModal();
  });
  document.querySelector("#resetDemoButton")?.addEventListener("click", () => {
    if (!state.isAdmin) return;
    state.settings.sheetUrl = "";
    state.cart.clear();
    saveSettings();
    loadProducts();
  });

  document.querySelector("#settingsButton").addEventListener("click", () => {
    if (!state.isAdmin) return;
    elements.sheetUrlInput.value = state.settings.sheetUrl;
    elements.whatsappInput.value = state.settings.whatsapp;
    elements.settingsDialog.showModal();
  });

  document.querySelector("#saveSettingsButton").addEventListener("click", () => {
    if (!state.isAdmin) return;
    state.settings.sheetUrl = elements.sheetUrlInput.value.trim();
    state.settings.whatsapp = normalizeWhatsapp(elements.whatsappInput.value) || state.settings.whatsapp;
    saveSettings();
    loadProducts();
  });

  document.querySelector("#sidebarSaveButton")?.addEventListener("click", () => {
    if (!state.isAdmin) return;
    state.settings.sheetUrl = elements.sidebarSheetUrlInput.value.trim();
    state.settings.whatsapp = normalizeWhatsapp(elements.sidebarWhatsappInput.value) || state.settings.whatsapp;
    saveSettings();
    loadProducts();

    elements.saveConfirm.hidden = false;
    window.setTimeout(() => {
      elements.saveConfirm.hidden = true;
    }, 2400);
  });

  document.querySelector("#demoButton").addEventListener("click", () => {
    if (!state.isAdmin) return;
    state.settings.sheetUrl = "";
    saveSettings();
    elements.settingsDialog.close();
    loadProducts();
  });
}

applyAccessMode();
loadSettings();
bindEvents();
loadProducts();
