/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

const STORAGE_KEYS = {
  PRODUCTS: "cms_pos_products",
  EXPENSES: "cms_pos_expenses",
  INVOICES: "cms_pos_invoices",
  NEXT_INV: "cms_pos_next_inv",
  NEXT_PROD: "cms_pos_next_prod",
  SHEET_ORDERS: "cms_pos_sheet_orders",
  DELETED_ORDERS: "cms_pos_deleted_orders",
};

export const INITIAL_PRODUCTS = [
  {
    id: 1,
    name: "Tempest Noir",
    cat: "EDP",
    size: "50ml",
    icon: "🌑",
    cost: 1800,
    price: 3500,
    discountPrice: 3200,
    stock: 12,
  },
  {
    id: 2,
    name: "Executive Code",
    cat: "EDP",
    size: "50ml",
    icon: "💼",
    cost: 1800,
    price: 3500,
    discountPrice: 0,
    stock: 8,
  },
  {
    id: 3,
    name: "Dynamic Mist",
    cat: "EDP",
    size: "50ml",
    icon: "💨",
    cost: 1200,
    price: 2800,
    discountPrice: 2500,
    stock: 15,
  },
  {
    id: 4,
    name: "Oud Royale",
    cat: "EDP",
    size: "50ml",
    icon: "👑",
    cost: 2200,
    price: 4500,
    discountPrice: 4000,
    stock: 6,
  },
  {
    id: 5,
    name: "Velvet Eclat",
    cat: "EDP",
    size: "50ml",
    icon: "🌹",
    cost: 2000,
    price: 4000,
    discountPrice: 0,
    stock: 4,
  },
  {
    id: 6,
    name: "Citrus Elixir",
    cat: "EDP",
    size: "50ml",
    icon: "🍋",
    cost: 1100,
    price: 2500,
    discountPrice: 2200,
    stock: 18,
  },
];

export const INITIAL_EXPENSES = [
  {
    id: 1,
    date: "15 Jun 2026",
    desc: "Packaging boxes",
    cat: "Packaging",
    amt: 8500,
  },
  { id: 2, date: "20 Jun 2026", desc: "Office rent", cat: "Rent", amt: 25000 },
  {
    id: 3,
    date: "22 Jun 2026",
    desc: "Raw materials – oud",
    cat: "Raw materials",
    amt: 15000,
  },
];

export const INITIAL_SHEET_ORDERS = [];

export function getDeletedOrderIds() {
  try {
    const data = localStorage.getItem(STORAGE_KEYS.DELETED_ORDERS);
    if (!data) return [];
    const parsed = JSON.parse(data);
    return Array.isArray(parsed) ? parsed : [];
  } catch (e) {
    return [];
  }
}

export function addDeletedOrderId(id) {
  if (!id) return;
  try {
    const current = getDeletedOrderIds();
    const strId = String(id).trim().toLowerCase();
    if (!current.some((x) => String(x).trim().toLowerCase() === strId)) {
      current.push(id);
      localStorage.setItem(
        STORAGE_KEYS.DELETED_ORDERS,
        JSON.stringify(current),
      );
    }
  } catch (e) {
    console.error("Error saving deleted order ID", e);
  }
}

export function getStoredSheetOrders() {
  try {
    const data = localStorage.getItem(STORAGE_KEYS.SHEET_ORDERS);
    if (!data) return [];
    const parsed = JSON.parse(data);
    if (!Array.isArray(parsed)) return [];
    const deleted = getDeletedOrderIds().map((x) =>
      String(x).trim().toLowerCase(),
    );
    return parsed.filter((o) => {
      const oId = String(o.id || "")
        .trim()
        .toLowerCase();
      const oNum = String(o.orderId || o.orderNumber || "")
        .trim()
        .toLowerCase();
      return (
        o.id !== "GSO-101" &&
        o.id !== "GSO-102" &&
        !deleted.includes(oId) &&
        !deleted.includes(oNum)
      );
    });
  } catch (e) {
    console.error("Error reading sheet orders from localStorage", e);
    return [];
  }
}

export function setStoredSheetOrders(orders) {
  try {
    localStorage.setItem(STORAGE_KEYS.SHEET_ORDERS, JSON.stringify(orders));
  } catch (e) {
    console.error("Error writing sheet orders to localStorage", e);
  }
}

export function getStoredProducts() {
  try {
    const data = localStorage.getItem(STORAGE_KEYS.PRODUCTS);
    return data ? JSON.parse(data) : INITIAL_PRODUCTS;
  } catch (e) {
    console.error("Error reading products from localStorage", e);
    return INITIAL_PRODUCTS;
  }
}

export function setStoredProducts(products) {
  try {
    localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(products));
  } catch (e) {
    console.error("Error writing products to localStorage", e);
  }
}

export function getStoredExpenses() {
  try {
    const data = localStorage.getItem(STORAGE_KEYS.EXPENSES);
    return data ? JSON.parse(data) : INITIAL_EXPENSES;
  } catch (e) {
    console.error("Error reading expenses from localStorage", e);
    return INITIAL_EXPENSES;
  }
}

export function setStoredExpenses(expenses) {
  try {
    localStorage.setItem(STORAGE_KEYS.EXPENSES, JSON.stringify(expenses));
  } catch (e) {
    console.error("Error writing expenses to localStorage", e);
  }
}

export function getStoredInvoices() {
  try {
    const data = localStorage.getItem(STORAGE_KEYS.INVOICES);
    return data ? JSON.parse(data) : [];
  } catch (e) {
    console.error("Error reading invoices from localStorage", e);
    return [];
  }
}

export function setStoredInvoices(invoices) {
  try {
    localStorage.setItem(STORAGE_KEYS.INVOICES, JSON.stringify(invoices));
  } catch (e) {
    console.error("Error writing invoices to localStorage", e);
  }
}

export function getStoredNextInv() {
  try {
    const data = localStorage.getItem(STORAGE_KEYS.NEXT_INV);
    return data ? parseInt(data, 10) : 1001;
  } catch (e) {
    return 1001;
  }
}

export function setStoredNextInv(val) {
  try {
    localStorage.setItem(STORAGE_KEYS.NEXT_INV, String(val));
  } catch (e) {
    console.error(e);
  }
}

export function getStoredNextProd() {
  try {
    const data = localStorage.getItem(STORAGE_KEYS.NEXT_PROD);
    return data ? parseInt(data, 10) : 7;
  } catch (e) {
    return 7;
  }
}

export function setStoredNextProd(val) {
  try {
    localStorage.setItem(STORAGE_KEYS.NEXT_PROD, String(val));
  } catch (e) {
    console.error(e);
  }
}

export function exportBackupData() {
  const backup = {
    products: getStoredProducts(),
    expenses: getStoredExpenses(),
    invoices: getStoredInvoices(),
    sheetOrders: getStoredSheetOrders(),
    nextInv: getStoredNextInv(),
    nextProd: getStoredNextProd(),
    timestamp: new Date().toISOString(),
  };
  return JSON.stringify(backup, null, 2);
}

export function importBackupData(jsonString) {
  try {
    const parsed = JSON.parse(jsonString);
    if (parsed.products && Array.isArray(parsed.products)) {
      setStoredProducts(parsed.products);
    }
    if (parsed.expenses && Array.isArray(parsed.expenses)) {
      setStoredExpenses(parsed.expenses);
    }
    if (parsed.invoices && Array.isArray(parsed.invoices)) {
      setStoredInvoices(parsed.invoices);
    }
    if (parsed.sheetOrders && Array.isArray(parsed.sheetOrders)) {
      setStoredSheetOrders(parsed.sheetOrders);
    }
    if (typeof parsed.nextInv === "number") {
      setStoredNextInv(parsed.nextInv);
    }
    if (typeof parsed.nextProd === "number") {
      setStoredNextProd(parsed.nextProd);
    }
    return true;
  } catch (e) {
    console.error("Backup import failed", e);
    return false;
  }
}
