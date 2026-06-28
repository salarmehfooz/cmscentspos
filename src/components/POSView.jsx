import React, { useState, useMemo, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Search,
  ShoppingBag,
  Minus,
  Plus,
  CheckCircle,
  Settings,
  Globe,
  RefreshCw,
} from "lucide-react";
import ReceiptModal from "./ReceiptModal";

export default function POSView({
  products,
  onUpdateProducts,
  onAddInvoice,
  nextInv,
  onUpdateNextInv,
  onShowToast,
}) {
  const [search, setSearch] = useState("");
  const [selectedCat, setSelectedCat] = useState("All");
  const [cart, setCart] = useState([]);
  const [customerName, setCustomerName] = useState("");
  const [discountPkr, setDiscountPkr] = useState("");
  const [discountPct, setDiscountPct] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("Cash On Delivery");
  const [completedInvoice, setCompletedInvoice] = useState(null);

  // Google Sheets integration state
  const [syncToSheets, setSyncToSheets] = useState(() => {
    return localStorage.getItem("cmscents_sync_to_sheets") === "true";
  });
  const [sheetScriptUrl, setSheetScriptUrl] = useState(() => {
    return (
      localStorage.getItem("cmscents_sheet_url") ||
      "https://script.google.com/macros/s/AKfycbzJ-e6FbB2zm2FMgSjBQ3lUu19z0hn1MmtlilHSrzUP2kuuKLVN1_s0B2g5n6fO1EEVrA/exec"
    );
  });
  const [customerPhone, setCustomerPhone] = useState("");
  const [customerCity, setCustomerCity] = useState("Karachi");
  const [customerAddress, setCustomerAddress] = useState("");
  const [customerNote, setCustomerNote] = useState("");
  const [isSyncing, setIsSyncing] = useState(false);
  const [showSyncConfig, setShowSyncConfig] = useState(false);

  // Persist sync settings
  useEffect(() => {
    localStorage.setItem("cmscents_sync_to_sheets", String(syncToSheets));
  }, [syncToSheets]);

  useEffect(() => {
    localStorage.setItem("cmscents_sheet_url", sheetScriptUrl);
  }, [sheetScriptUrl]);

  const cities = [
    "Karachi",
    "Lahore",
    "Islamabad",
    "Rawalpindi",
    "Faisalabad",
    "Multan",
    "Peshawar",
    "Quetta",
    "Sialkot",
    "Gujranwala",
    "Hyderabad",
    "Bahawalpur",
    "Other",
  ];

  // Extract all unique categories present in the products
  const categories = useMemo(() => {
    const cats = new Set(products.map((p) => p.cat));
    return ["All", ...Array.from(cats)];
  }, [products]);

  // Filter products based on category and search query
  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const matchCat = selectedCat === "All" || p.cat === selectedCat;
      const matchSearch =
        p.name.toLowerCase().includes(search.toLowerCase()) ||
        p.cat.toLowerCase().includes(search.toLowerCase());
      return matchCat && matchSearch;
    });
  }, [products, selectedCat, search]);

  // Cart calculations
  const subtotal = useMemo(() => {
    return cart.reduce((sum, item) => sum + item.price * item.qty, 0);
  }, [cart]);

  const parsedDiscount = useMemo(() => {
    const d = parseFloat(discountPkr) || 0;
    return Math.min(d, subtotal);
  }, [discountPkr, subtotal]);

  const total = useMemo(() => {
    return Math.max(0, subtotal - parsedDiscount);
  }, [subtotal, parsedDiscount]);

  const cartTotalItems = useMemo(() => {
    return cart.reduce((sum, item) => sum + item.qty, 0);
  }, [cart]);

  // Sync discounts (PKR vs Percentage)
  const handleDiscountChange = (val, type) => {
    if (subtotal === 0) {
      setDiscountPkr("");
      setDiscountPct("");
      return;
    }
    if (type === "pkr") {
      setDiscountPkr(val);
      const numVal = parseFloat(val) || 0;
      const pct = (numVal / subtotal) * 100;
      setDiscountPct(
        numVal ? Math.min(100, Number(pct.toFixed(1))).toString() : "",
      );
    } else {
      setDiscountPct(val);
      const numVal = parseFloat(val) || 0;
      const pkr = (numVal / 100) * subtotal;
      setDiscountPkr(numVal ? Math.round(pkr).toString() : "");
    }
  };

  // Add a product to the cart
  const addToCart = (product) => {
    if (product.stock <= 0) return;

    setCart((prevCart) => {
      const existing = prevCart.find((item) => item.id === product.id);
      if (existing) {
        // Prevent exceeding stock
        if (existing.qty >= product.stock) return prevCart;
        return prevCart.map((item) =>
          item.id === product.id ? { ...item, qty: item.qty + 1 } : item,
        );
      } else {
        const activePrice =
          product.discountPrice !== undefined && product.discountPrice > 0
            ? product.discountPrice
            : product.price;

        return [
          ...prevCart,
          {
            id: product.id,
            name: product.name,
            price: activePrice,
            originalPrice: product.price,
            cost: product.cost,
            qty: 1,
            icon: product.icon || "🌸",
          },
        ];
      }
    });
  };

  // Adjust quantity in cart
  const changeQty = (id, delta) => {
    const product = products.find((p) => p.id === id);
    if (!product) return;

    setCart((prevCart) => {
      const existing = prevCart.find((item) => item.id === id);
      if (!existing) return prevCart;

      const newQty = existing.qty + delta;
      if (newQty <= 0) {
        return prevCart.filter((item) => item.id !== id);
      }
      if (newQty > product.stock) {
        return prevCart; // Can't exceed physical stock
      }
      return prevCart.map((item) =>
        item.id === id ? { ...item, qty: newQty } : item,
      );
    });
  };

  // Clear cart
  const clearCart = () => {
    setCart([]);
    setDiscountPkr("");
    setDiscountPct("");
    setCustomerName("");
    setCustomerPhone("");
    setCustomerAddress("");
    setCustomerNote("");
  };

  // Checkout process
  const handleCheckout = async () => {
    if (cart.length === 0) return;

    if (!customerName.trim()) {
      if (onShowToast) {
        onShowToast("Customer Name is required for checkout.", "error");
      }
      return;
    }

    if (!customerPhone.trim()) {
      if (onShowToast) {
        onShowToast("Phone Number is required for checkout.", "error");
      }
      return;
    }

    if (!customerAddress.trim()) {
      if (onShowToast) {
        onShowToast("Shipping Address is required for checkout.", "error");
      }
      return;
    }

    setIsSyncing(true);

    const totalCogs = cart.reduce((sum, item) => sum + item.cost * item.qty, 0);
    const invoiceId = `INV-${String(nextInv).padStart(4, "0")}`;
    const todayStr = new Date().toLocaleDateString("en-PK", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });

    const newInvoice = {
      id: invoiceId,
      date: todayStr,
      customer: customerName.trim(),
      phone: customerPhone.trim() || "None",
      address: customerAddress.trim(),
      notes: customerNote.trim() || "None",
      method: paymentMethod,
      items: [...cart],
      sub: subtotal,
      disc: parsedDiscount,
      total: total,
      cogs: totalCogs,
      profit: total - totalCogs,
    };

    // Decrement physical product stock
    const updatedProducts = products.map((prod) => {
      const cartItem = cart.find((item) => item.id === prod.id);
      if (cartItem) {
        return {
          ...prod,
          stock: Math.max(0, prod.stock - cartItem.qty),
        };
      }
      return prod;
    });

    // Save outputs locally
    onUpdateProducts(updatedProducts);
    onAddInvoice(newInvoice);
    onUpdateNextInv(nextInv + 1);

    // If sync with Google Sheets is enabled, POST to the web app URL
    if (syncToSheets && sheetScriptUrl.trim()) {
      try {
        const orderData = {
          name: customerName.trim() || "POS Walk-in",
          phone: customerPhone.trim() || "None",
          city: customerCity || "POS Store",
          address: customerAddress.trim() || "POS Counter Checkout",
          products: cart.map((item) => `${item.name} (${item.qty})`).join(", "),
          total: total,
          payment: paymentMethod + " (POS)",
          note: customerNote.trim() || `POS-invoice: ${invoiceId}`,
        };

        // Send as plain text to avoid CORS preflight options blocks in Google Sheets
        await fetch(sheetScriptUrl.trim(), {
          method: "POST",
          mode: "no-cors",
          headers: {
            "Content-Type": "text/plain",
          },
          body: JSON.stringify(orderData),
        });

        if (onShowToast) {
          onShowToast(`Sale synced to Google Sheets successfully!`, "success");
        }
      } catch (err) {
        console.error("Google Sheets Sync failed:", err);
        if (onShowToast) {
          onShowToast("Local sale recorded. Sheets sync failed.", "error");
        }
      }
    } else {
      if (onShowToast) {
        onShowToast(`Invoice ${invoiceId} generated locally.`, "success");
      }
    }

    setIsSyncing(false);

    // Save completed invoice to show receipt and reset local POS states
    setCompletedInvoice(newInvoice);
    clearCart();
    setCustomerPhone("");
    setCustomerAddress("");
    setCustomerNote("");
  };

  const formatPrice = (num) => `PKR ${Math.round(num).toLocaleString()}`;

  return (
    <div className="flex-1 flex flex-col md:flex-row md:h-[calc(100vh-4rem)] md:overflow-hidden bg-[#0A0A0D]">
      {/* Product Selection side */}
      <div className="flex-1 flex flex-col p-4 md:p-6 overflow-y-auto gap-4 md:gap-6 min-w-0">
        {/* Search and Filters */}
        <div className="flex flex-col gap-4">
          <div className="relative">
            <Search
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400"
              size={18}
            />
            <input
              type="text"
              placeholder="Search fragrances, categories..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-[#181820] border border-white/5 focus:border-[#CFB050] focus:ring-1 focus:ring-[#CFB050]/20 rounded-xl py-3 pl-11 pr-4 text-white placeholder-gray-500 text-sm outline-none transition-all"
            />
          </div>

          {/* Category Tabs Scrollbar */}
          <div className="flex gap-2 overflow-x-auto pb-1.5 scrollbar-thin">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCat(cat)}
                className={`px-4 py-2 rounded-xl text-xs font-display font-medium transition-all duration-150 cursor-pointer whitespace-nowrap border ${
                  selectedCat === cat
                    ? "bg-[#CFB050] text-black border-[#CFB050]"
                    : "bg-[#111116] text-gray-400 border-white/5 hover:text-white hover:bg-[#181820]"
                }`}
              >
                {cat === "All" ? "All Collections" : cat}
              </button>
            ))}
          </div>
        </div>

        {/* Product Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
          {filteredProducts.length > 0 ? (
            filteredProducts.map((p) => {
              const isLowStock = p.stock > 0 && p.stock <= 3;
              const isOut = p.stock === 0;

              return (
                <motion.div
                  whileHover={!isOut ? { y: -2 } : {}}
                  whileTap={!isOut ? { scale: 0.98 } : {}}
                  key={p.id}
                  onClick={() => addToCart(p)}
                  className={`bg-[#181820] border rounded-2xl p-4 flex flex-col items-center text-center cursor-pointer relative group transition-all select-none ${
                    isOut
                      ? "border-white/5 opacity-40 cursor-not-allowed"
                      : "border-white/5 hover:border-[#CFB050]/50"
                  }`}
                >
                  <span className="text-3xl mb-3 block transform group-hover:scale-110 transition-transform duration-200">
                    {p.icon || "🌸"}
                  </span>
                  <h4 className="font-display font-medium text-white text-xs leading-snug line-clamp-1 mb-1">
                    {p.name}
                  </h4>
                  <p className="text-[10px] text-gray-500 mb-1.5 font-mono">
                    {p.cat} · {p.size}
                  </p>

                  <div className="flex flex-col items-center justify-center min-h-[40px] mb-2">
                    {p.discountPrice !== undefined && p.discountPrice > 0 ? (
                      <>
                        <span className="text-[10px] text-gray-500 line-through font-mono">
                          {formatPrice(p.price)}
                        </span>
                        <span className="text-sm font-semibold text-[#CFB050] font-mono">
                          {formatPrice(p.discountPrice)}
                        </span>
                      </>
                    ) : (
                      <>
                        <span className="text-[10px] text-transparent select-none font-mono">
                          —
                        </span>
                        <span className="text-sm font-semibold text-white font-mono">
                          {formatPrice(p.price)}
                        </span>
                      </>
                    )}
                  </div>

                  <span
                    className={`text-[10px] px-2 py-0.5 rounded-full font-mono mt-auto ${
                      isOut
                        ? "bg-red-500/10 text-red-400"
                        : isLowStock
                          ? "bg-amber-500/10 text-amber-400 font-medium"
                          : "bg-white/5 text-gray-400"
                    }`}
                  >
                    {isOut
                      ? "Out of Stock"
                      : isLowStock
                        ? `${p.stock} left`
                        : `${p.stock} in stock`}
                  </span>
                </motion.div>
              );
            })
          ) : (
            <div className="col-span-full py-12 flex flex-col items-center justify-center text-gray-500">
              <ShoppingBag className="opacity-15 mb-2" size={40} />
              <p className="text-sm">No items match your query.</p>
            </div>
          )}
        </div>
      </div>

      {/* Cart & Billing Section */}
      <div className="w-full md:w-80 lg:w-[350px] border-t md:border-t-0 md:border-l border-white/5 bg-[#111116] flex flex-col flex-shrink-0 overflow-hidden">
        {/* Cart Header */}
        <div className="p-4 border-b border-white/5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShoppingBag className="text-[#CFB050]" size={18} />
            <span className="text-sm font-display font-bold text-white tracking-wide">
              Active Cart
            </span>
            {cartTotalItems > 0 && (
              <span className="bg-[#CFB050]/15 text-[#CFB050] font-mono text-[10px] px-2 py-0.5 rounded-full font-bold">
                {cartTotalItems} items
              </span>
            )}
          </div>
          <button
            onClick={clearCart}
            className="text-[11px] font-medium text-gray-500 hover:text-red-400 transition-colors cursor-pointer border border-white/5 hover:border-red-500/20 px-2 py-1 rounded-lg"
          >
            Clear Cart
          </button>
        </div>

        {/* Customer & Sync Section */}
        <div className="p-4 border-b border-white/5 space-y-3 bg-white/[0.01]">
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-gray-400 uppercase tracking-wider font-semibold font-mono">
              Customer Details
            </span>
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => setSyncToSheets(!syncToSheets)}
                className={`flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono transition-all border ${
                  syncToSheets
                    ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20 font-bold"
                    : "bg-white/5 text-gray-500 border-white/5"
                }`}
                title="Toggle Google Sheets Sync"
              >
                <Globe
                  size={10}
                  className={syncToSheets ? "animate-pulse" : ""}
                />
                <span>Sync {syncToSheets ? "ON" : "OFF"}</span>
              </button>
              <button
                type="button"
                onClick={() => setShowSyncConfig(!showSyncConfig)}
                className="p-1 hover:bg-white/5 text-gray-500 hover:text-[#CFB050] rounded transition-colors"
                title="Configure Sync Webapp URL"
              >
                <Settings size={12} />
              </button>
            </div>
          </div>

          {/* Sync Web App Config panel (inline dropdown) */}
          <AnimatePresence>
            {showSyncConfig && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="overflow-hidden bg-[#181820] border border-white/5 p-2.5 rounded-xl space-y-1.5"
              >
                <div className="flex items-center justify-between">
                  <span className="text-[9px] text-gray-500 font-mono">
                    Apps Script Exec URL:
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      setSheetScriptUrl(
                        "https://script.google.com/macros/s/AKfycbzJ-e6FbB2zm2FMgSjBQ3lUu19z0hn1MmtlilHSrzUP2kuuKLVN1_s0B2g5n6fO1EEVrA/exec",
                      );
                      if (onShowToast)
                        onShowToast(
                          "Reset to default C.M Scents Script URL",
                          "success",
                        );
                    }}
                    className="text-[9px] text-[#CFB050] hover:underline"
                  >
                    Reset Default
                  </button>
                </div>
                <input
                  type="text"
                  placeholder="https://script.google.com/macros/s/.../exec"
                  value={sheetScriptUrl}
                  onChange={(e) => setSheetScriptUrl(e.target.value)}
                  className="w-full bg-[#111116] border border-white/5 focus:border-[#CFB050] rounded-lg px-2 py-1 text-white placeholder-gray-600 text-[10px] outline-none font-mono"
                />
                <p className="text-[8px] text-gray-600 leading-tight">
                  All POS orders will be pushed as JSON POST requests to this
                  spreadsheet processor URL.
                </p>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="space-y-2">
            <input
              type="text"
              placeholder="Customer Name (Required)"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              className="w-full bg-[#181820] border border-white/5 focus:border-[#CFB050] rounded-xl px-3.5 py-2.5 text-white placeholder-gray-500 text-xs outline-none transition-all"
            />
            <input
              type="tel"
              placeholder="Phone Number (Required)"
              value={customerPhone}
              onChange={(e) => setCustomerPhone(e.target.value)}
              className="w-full bg-[#181820] border border-white/5 focus:border-[#CFB050] rounded-xl px-3.5 py-2.5 text-white placeholder-gray-500 text-xs outline-none transition-all font-mono"
            />
            <input
              type="text"
              placeholder="Shipping Address (Required)"
              value={customerAddress}
              onChange={(e) => setCustomerAddress(e.target.value)}
              className="w-full bg-[#181820] border border-white/5 focus:border-[#CFB050] rounded-xl px-3.5 py-2.5 text-white placeholder-gray-500 text-xs outline-none transition-all"
            />
          </div>

          {/* Collapsible shipping fields shown when Google Sheets Sync is ON */}
          <AnimatePresence>
            {syncToSheets && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="overflow-hidden space-y-2 pt-1 border-t border-white/5"
              >
                <div className="grid grid-cols-1 gap-2">
                  <select
                    value={customerCity}
                    onChange={(e) => setCustomerCity(e.target.value)}
                    className="w-full bg-[#181820] border border-white/5 focus:border-[#CFB050] rounded-xl px-3.5 py-2.5 text-white text-xs outline-none cursor-pointer"
                  >
                    {cities.map((city) => (
                      <option key={city} value={city}>
                        {city}
                      </option>
                    ))}
                  </select>
                </div>
                <input
                  type="text"
                  placeholder="Order note / Instructions"
                  value={customerNote}
                  onChange={(e) => setCustomerNote(e.target.value)}
                  className="w-full bg-[#181820] border border-white/5 focus:border-[#CFB050] rounded-xl px-3.5 py-2.5 text-white placeholder-gray-500 text-xs outline-none"
                />
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Cart Items List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          <AnimatePresence initial={false}>
            {cart.length > 0 ? (
              cart.map((item) => (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="bg-[#181820] border border-white/5 rounded-xl p-3 flex items-center gap-3"
                >
                  <span className="text-xl flex-shrink-0">{item.icon}</span>
                  <div className="flex-1 min-w-0">
                    <h5 className="text-xs font-semibold text-white truncate">
                      {item.name}
                    </h5>
                    <p className="text-[10px] text-gray-500 font-mono mt-0.5">
                      {formatPrice(item.price)}
                    </p>
                  </div>

                  {/* Qty adjustments */}
                  <div className="flex items-center gap-2.5 bg-[#111116] p-1 rounded-lg border border-white/5">
                    <button
                      onClick={() => changeQty(item.id, -1)}
                      className="p-1 text-gray-400 hover:text-white rounded hover:bg-white/5 transition-colors"
                    >
                      <Minus size={11} />
                    </button>
                    <span className="text-xs font-mono font-bold text-white min-w-[14px] text-center">
                      {item.qty}
                    </span>
                    <button
                      onClick={() => changeQty(item.id, 1)}
                      className="p-1 text-gray-400 hover:text-white rounded hover:bg-white/5 transition-colors"
                    >
                      <Plus size={11} />
                    </button>
                  </div>

                  <span className="text-xs font-mono font-bold text-[#CFB050] pl-1">
                    {formatPrice(item.price * item.qty)}
                  </span>
                </motion.div>
              ))
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-gray-600 gap-2 py-16">
                <ShoppingBag size={32} className="opacity-20" />
                <p className="text-xs">Cart is currently empty</p>
              </div>
            )}
          </AnimatePresence>
        </div>

        {/* Totals & Complete section */}
        <div className="p-4 bg-[#181820] border-t border-white/5 space-y-3.5">
          <div className="space-y-1.5 text-xs">
            <div className="flex justify-between text-gray-400">
              <span>Subtotal</span>
              <span className="font-mono text-white">
                {formatPrice(subtotal)}
              </span>
            </div>

            {/* Discounts inputs */}
            <div className="grid grid-cols-2 gap-2 pt-1 pb-1">
              <div className="relative">
                <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-500 font-mono text-[10px]">
                  PKR
                </span>
                <input
                  type="number"
                  placeholder="Disc"
                  disabled={subtotal === 0}
                  value={discountPkr}
                  onChange={(e) => handleDiscountChange(e.target.value, "pkr")}
                  className="w-full bg-[#111116] border border-white/5 focus:border-[#CFB050] rounded-lg pl-8 pr-1.5 py-1.5 text-white placeholder-gray-600 text-[11px] outline-none font-mono"
                />
              </div>
              <div className="relative">
                <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-500 font-mono text-[10px]">
                  %
                </span>
                <input
                  type="number"
                  placeholder="Disc %"
                  disabled={subtotal === 0}
                  min={0}
                  max={100}
                  value={discountPct}
                  onChange={(e) => handleDiscountChange(e.target.value, "pct")}
                  className="w-full bg-[#111116] border border-white/5 focus:border-[#CFB050] rounded-lg pl-6 pr-1.5 py-1.5 text-white placeholder-gray-600 text-[11px] outline-none font-mono"
                />
              </div>
            </div>

            {parsedDiscount > 0 && (
              <div className="flex justify-between text-red-400">
                <span>Total Discount</span>
                <span className="font-mono">
                  -{formatPrice(parsedDiscount)}
                </span>
              </div>
            )}

            <div className="flex justify-between text-sm pt-2 border-t border-white/5 font-display font-bold">
              <span className="text-white">Total Bill</span>
              <span className="text-[#CFB050] font-mono">
                {formatPrice(total)}
              </span>
            </div>
          </div>

          {/* Payment Method Selector */}
          <div className="space-y-1">
            <span className="text-[10px] text-gray-500 uppercase tracking-wider font-semibold font-mono">
              Payment Method
            </span>
            <select
              value={paymentMethod}
              onChange={(e) => setPaymentMethod(e.target.value)}
              className="w-full bg-[#111116] border border-white/5 focus:border-[#CFB050] rounded-xl px-3 py-2 text-white text-xs outline-none cursor-pointer"
            >
              <option value="Cash">💵 Cash On Delivery</option>
              <option value="Card">💳 Credit / Debit Card</option>
              <option value="Bank transfer">🏦 Direct Bank Transfer</option>
              <option value="JazzCash">📱 JazzCash Wallet</option>
              <option value="EasyPaisa">📱 EasyPaisa Wallet</option>
            </select>
          </div>

          {/* Checkout Button */}
          <button
            onClick={handleCheckout}
            disabled={cart.length === 0 || isSyncing}
            className={`w-full py-3.5 rounded-xl text-sm font-semibold font-display flex items-center justify-center gap-2 tracking-wide transition-all ${
              cart.length > 0 && !isSyncing
                ? "bg-[#CFB050] text-black hover:bg-[#E5C76B] cursor-pointer shadow-lg shadow-[#CFB050]/5 active:scale-[0.98]"
                : "bg-white/5 text-gray-600 cursor-not-allowed"
            }`}
          >
            {isSyncing ? (
              <>
                <RefreshCw size={16} className="animate-spin text-black" />
                Syncing Sale...
              </>
            ) : (
              <>
                <CheckCircle size={16} />
                Complete Sale {syncToSheets ? "♛" : ""}
              </>
            )}
          </button>
        </div>
      </div>

      {/* Complete Invoice Receipt Modal */}
      {completedInvoice && (
        <ReceiptModal
          invoice={completedInvoice}
          products={products}
          onClose={() => setCompletedInvoice(null)}
        />
      )}
    </div>
  );
}
