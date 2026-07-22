/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  FileSpreadsheet,
  RefreshCw,
  CheckCircle2,
  Clock,
  User,
  Phone,
  MapPin,
  CreditCard,
  Plus,
  Search,
  Lock,
  Printer,
  PackageCheck,
  AlertCircle,
  FileText,
  X,
  Sparkles,
  Trash2,
} from "lucide-react";
import ReceiptModal from "./ReceiptModal";

export default function SheetOrdersView({
  sheetOrders = [],
  onUpdateSheetOrders,
  products = [],
  onUpdateProducts,
  onAddInvoice,
  nextInv,
  onUpdateNextInv,
  onShowToast,
}) {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [isLoading, setIsLoading] = useState(false);
  const [activeReceiptInvoice, setActiveReceiptInvoice] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [orderToDelete, setOrderToDelete] = useState(null);

  // Handle Order Deletion
  const confirmDeleteOrder = async () => {
    if (!orderToDelete) return;
    const targetId = String(orderToDelete.id || "").trim();
    const targetOrderId = String(
      orderToDelete.orderId || orderToDelete.orderNumber || "",
    ).trim();
    const idToDelete = targetOrderId || targetId;

    // 1. Update local state immediately
    const updated = sheetOrders.filter((o) => {
      const oId = String(o.id || "").trim();
      const oOrderId = String(o.orderId || o.orderNumber || "").trim();
      if (targetId && oId && targetId.toLowerCase() === oId.toLowerCase())
        return false;
      if (
        targetOrderId &&
        oOrderId &&
        targetOrderId.toLowerCase() === oOrderId.toLowerCase()
      )
        return false;
      if (
        targetOrderId &&
        oId &&
        targetOrderId.toLowerCase() === oId.toLowerCase()
      )
        return false;
      if (
        targetId &&
        oOrderId &&
        targetId.toLowerCase() === oOrderId.toLowerCase()
      )
        return false;
      return true;
    });

    onUpdateSheetOrders(updated);

    // 2. Call backend proxy endpoint to delete from Google Sheet
    try {
      await fetch("/api/sheet-orders/delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderId: idToDelete,
          id: targetId,
          customer: orderToDelete.customer,
        }),
      });
    } catch (e) {
      console.warn("Backend delete sync warning:", e);
    }

    // 3. Direct GET call fallback to Google Apps Script
    const directUrl =
      import.meta.env.VITE_SHEET_ORDERS_URL ||
      "https://script.google.com/macros/s/AKfycbzJ-e6FbB2zm2FMgSjBQ3lUu19z0hn1MmtlilHSrzUP2kuuKLVN1_s0B2g5n6fO1EEVrA/exec";
    if (directUrl) {
      try {
        const urlWithParams = directUrl.includes("?")
          ? `${directUrl}&action=deleteOrder&orderId=${encodeURIComponent(idToDelete)}`
          : `${directUrl}?action=deleteOrder&orderId=${encodeURIComponent(idToDelete)}`;
        fetch(urlWithParams, { mode: "no-cors" }).catch(() => {});
      } catch (err) {}
    }

    if (onShowToast) {
      onShowToast(`Order #${idToDelete} deleted from POS & Google Sheet.`);
    }
    setOrderToDelete(null);
  };

  // New order form state for manual test sheet order
  const [newCustomer, setNewCustomer] = useState("");
  const [newPhone, setNewPhone] = useState("");
  const [newAddress, setNewAddress] = useState("");
  const [newPayMethod, setNewPayMethod] = useState("Cash on Delivery");
  const [newNotes, setNewNotes] = useState("");
  const [selectedProductId, setSelectedProductId] = useState(
    products[0]?.id || 1,
  );
  const [selectedQty, setSelectedQty] = useState(1);

  // Sync sheet orders from Express backend endpoint proxying process.env.SHEET_ORDERS_URL or direct fetch
  const handleFetchSheetOrders = async () => {
    setIsLoading(true);
    try {
      let ordersArray = null;

      // 1. First attempt: call local server proxy endpoint /api/sheet-orders
      try {
        const res = await fetch("/api/sheet-orders");
        const contentType = res.headers.get("content-type") || "";
        if (contentType.includes("application/json")) {
          const data = await res.json();
          if (data.success && Array.isArray(data.orders)) {
            ordersArray = data.orders;
          }
        }
      } catch (proxyErr) {
        console.warn("Proxy fetch warning:", proxyErr);
      }

      // 2. Direct fallback attempt if proxy returned no array
      if (!ordersArray || ordersArray.length === 0) {
        const directUrl =
          import.meta.env.VITE_SHEET_ORDERS_URL ||
          "https://script.google.com/macros/s/AKfycbzJ-e6FbB2zm2FMgSjBQ3lUu19z0hn1MmtlilHSrzUP2kuuKLVN1_s0B2g5n6fO1EEVrA/exec";
        try {
          const directRes = await fetch(directUrl);
          const directText = await directRes.text();
          try {
            const parsed = JSON.parse(directText);
            if (Array.isArray(parsed)) {
              ordersArray = parsed;
            } else if (parsed && Array.isArray(parsed.orders)) {
              ordersArray = parsed.orders;
            }
          } catch (e) {}
        } catch (directErr) {
          console.warn("Direct sheet fetch notice:", directErr);
        }
      }

      if (ordersArray && Array.isArray(ordersArray) && ordersArray.length > 0) {
        // Merge fetched orders with existing ones without duplicating and exclude dummy orders
        const realOrdersOnly = sheetOrders.filter(
          (o) =>
            o.id !== "GSO-101" &&
            o.id !== "GSO-102" &&
            o.orderId !== "ORD-8801" &&
            o.orderId !== "ORD-8802",
        );
        const merged = [...realOrdersOnly];
        let addedCount = 0;

        ordersArray.forEach((incoming) => {
          // Identify order identifier safely
          const incomingOrderNum = String(
            incoming.orderNumber ||
              incoming.orderId ||
              incoming.id ||
              incoming.order_number ||
              "",
          ).trim();

          const incomingId = String(
            incoming.id || incomingOrderNum || "",
          ).trim();

          // Check if this order already exists in merged list (by ID or Order Number)
          const exists = merged.some((o) => {
            const oNum = String(
              o.orderNumber || o.orderId || o.id || "",
            ).trim();
            const oId = String(o.id || o.orderId || "").trim();
            if (
              incomingOrderNum &&
              oNum &&
              incomingOrderNum.toLowerCase() === oNum.toLowerCase()
            )
              return true;
            if (
              incomingOrderNum &&
              oId &&
              incomingOrderNum.toLowerCase() === oId.toLowerCase()
            )
              return true;
            if (
              incomingId &&
              oId &&
              incomingId.toLowerCase() === oId.toLowerCase()
            )
              return true;
            if (
              incomingId &&
              oNum &&
              incomingId.toLowerCase() === oNum.toLowerCase()
            )
              return true;
            return false;
          });

          if (!exists && incomingOrderNum) {
            // Helper to parse product items from string/array
            let parsedItems = [];
            const rawItemsList = incoming.items || incoming.products;
            if (Array.isArray(rawItemsList) && rawItemsList.length > 0) {
              parsedItems = rawItemsList.map((item) => {
                const rawName = String(item.name || "").trim();
                let qty = item.qty || 1;
                const qtyMatch = rawName.match(
                  /\((\d+)\)$|(\d+)\s*x|x\s*(\d+)/i,
                );
                if (qtyMatch) {
                  qty = parseInt(
                    qtyMatch[1] || qtyMatch[2] || qtyMatch[3] || "1",
                    10,
                  );
                }
                const cleanName = rawName
                  .replace(/\(\d+\)$|(\d+)\s*x|x\s*(\d+)/gi, "")
                  .trim();
                const matched = products.find((p) => {
                  const pName = (p.name || "").toLowerCase();
                  const cName = cleanName.toLowerCase();
                  return (
                    pName === cName ||
                    cName.includes(pName) ||
                    pName.includes(cName)
                  );
                });

                return {
                  id: matched?.id || item.id || Date.now(),
                  name: matched?.name || cleanName || rawName || "Perfume EDP",
                  size: matched?.size || item.size || "50ml",
                  price:
                    item.price ||
                    matched?.discountPrice ||
                    matched?.price ||
                    3200,
                  cost: matched?.cost || 1800,
                  qty: qty,
                };
              });
            } else {
              const rawProd =
                incoming.products ||
                incoming.productsRaw ||
                incoming.product ||
                "";
              if (rawProd) {
                const str = String(rawProd).trim();
                const parts = str
                  .split(/,|\n|;/)
                  .map((s) => s.trim())
                  .filter(Boolean);
                parts.forEach((part) => {
                  let qty = 1;
                  const qtyMatch = part.match(/(\d+)\s*x|x\s*(\d+)|\((\d+)\)/i);
                  if (qtyMatch) {
                    qty = parseInt(
                      qtyMatch[1] || qtyMatch[2] || qtyMatch[3] || "1",
                      10,
                    );
                  }
                  const cleanName = part
                    .replace(/(\d+)\s*x|x\s*(\d+)|\((\d+)\)/gi, "")
                    .trim();
                  const matched =
                    products.find(
                      (p) =>
                        (p.name || "").toLowerCase() ===
                        cleanName.toLowerCase(),
                    ) || products[0];

                  parsedItems.push({
                    id: matched?.id || Date.now(),
                    name: cleanName || matched?.name || "Perfume EDP",
                    size: matched?.size || "50ml",
                    price: matched?.discountPrice || matched?.price || 3200,
                    cost: matched?.cost || 1800,
                    qty: qty,
                  });
                });
              }
            }

            if (parsedItems.length === 0 && products.length > 0) {
              parsedItems = [
                {
                  id: products[0]?.id || 1,
                  name: products[0]?.name || "Tempest Noir",
                  size: products[0]?.size || "50ml",
                  price:
                    products[0]?.discountPrice || products[0]?.price || 3200,
                  cost: products[0]?.cost || 1800,
                  qty: 1,
                },
              ];
            }

            const customerName =
              incoming.customer ||
              incoming.customerName ||
              incoming.name ||
              "Online Customer";
            const customerPhone =
              incoming.phone || incoming.customerPhone || "N/A";
            const city = incoming.city || "";
            const rawAddr = incoming.address || incoming.shippingAddress || "";
            const fullAddr = rawAddr
              ? city && !rawAddr.toLowerCase().includes(city.toLowerCase())
                ? `${rawAddr}, ${city}`
                : rawAddr
              : city
                ? city
                : "Pakistan";

            const computedTotal =
              parseFloat(incoming.total) ||
              parsedItems.reduce((s, i) => s + i.price * i.qty, 0) ||
              3200;

            merged.unshift({
              id: incomingId,
              orderId: incomingOrderNum,
              orderNumber: incomingOrderNum,
              date:
                incoming.date ||
                new Date().toLocaleString("en-PK", {
                  day: "2-digit",
                  month: "short",
                  year: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                  hour12: true,
                }),
              customer: customerName,
              phone: customerPhone,
              address: fullAddr,
              paymentMethod:
                incoming.paymentMethod ||
                incoming.payment ||
                "Cash on Delivery",
              notes: incoming.notes || incoming.note || "None",
              status: incoming.status || "Pending",
              items: parsedItems,
              total: computedTotal,
            });
            addedCount++;
          }
        });

        onUpdateSheetOrders(merged);
        if (addedCount > 0) {
          if (onShowToast)
            onShowToast(
              `Fetched ${addedCount} new order(s) from Google Sheet!`,
            );
        } else {
          if (onShowToast)
            onShowToast("Google Sheet synced. All orders are up to date!");
        }
      } else {
        if (onShowToast) onShowToast("Synced with Google Sheet endpoint!");
      }
    } catch (err) {
      console.warn("Google Sheet sync status:", err?.message || err);
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch on component mount
  useEffect(() => {
    handleFetchSheetOrders();
  }, []);

  // Format currency helper
  const formatPrice = (num) => `PKR ${Math.round(num || 0).toLocaleString()}`;

  // Active real orders list (filtering out initial dummy mock orders)
  const realOrders = useMemo(() => {
    return sheetOrders.filter(
      (o) =>
        o.id !== "GSO-101" &&
        o.id !== "GSO-102" &&
        o.orderId !== "ORD-8801" &&
        o.orderId !== "ORD-8802",
    );
  }, [sheetOrders]);

  // Filtered orders list
  const filteredOrders = useMemo(() => {
    return realOrders.filter((order) => {
      const q = search.toLowerCase();
      const matchesSearch =
        (order.orderId || "").toLowerCase().includes(q) ||
        (order.customer || "").toLowerCase().includes(q) ||
        (order.phone || "").toLowerCase().includes(q) ||
        (order.address || "").toLowerCase().includes(q) ||
        (order.items || []).some((item) =>
          (item.name || "").toLowerCase().includes(q),
        );

      if (!matchesSearch) return false;
      if (statusFilter === "All") return true;
      if (statusFilter === "Pending") return order.status === "Pending";
      if (statusFilter === "Confirmed")
        return order.status === "Confirmed" || order.status === "Invoiced";
      return true;
    });
  }, [realOrders, search, statusFilter]);

  // Stats calculation
  const stats = useMemo(() => {
    const totalCount = realOrders.length;
    const pendingCount = realOrders.filter(
      (o) => o.status === "Pending",
    ).length;
    const confirmedCount = realOrders.filter(
      (o) => o.status === "Confirmed" || o.status === "Invoiced",
    ).length;
    const totalRevenue = realOrders.reduce((sum, o) => sum + (o.total || 0), 0);
    return { totalCount, pendingCount, confirmedCount, totalRevenue };
  }, [realOrders]);

  // Main Action: Confirm Order, Deduct Inventory & Generate POS Invoice
  const handleConfirmOrder = async (order) => {
    if (order.status === "Confirmed" || order.status === "Invoiced") {
      if (onShowToast)
        onShowToast("This order has already been confirmed.", "error");
      return;
    }

    // 1. Prepare invoice items and match against existing inventory
    const invoiceItems = [];
    let updatedProducts = [...products];
    let totalCogs = 0;
    let orderSubtotal = 0;

    for (const item of order.items || []) {
      // Find matching product in catalog
      let matchedProd = updatedProducts.find(
        (p) =>
          p.id === item.id ||
          (p.name || "").toLowerCase() === (item.name || "").toLowerCase(),
      );

      if (!matchedProd && updatedProducts.length > 0) {
        matchedProd = updatedProducts[0]; // fallback
      }

      const itemQty = Math.max(1, item.qty || 1);
      const itemPrice =
        item.price || matchedProd?.discountPrice || matchedProd?.price || 3000;
      const itemCost = item.cost || matchedProd?.cost || 1500;
      const itemName = item.name || matchedProd?.name || "Perfume EDP";
      const itemSize = item.size || matchedProd?.size || "50ml";

      totalCogs += itemCost * itemQty;
      orderSubtotal += itemPrice * itemQty;

      // Deduct stock from matching product
      if (matchedProd) {
        updatedProducts = updatedProducts.map((p) => {
          if (p.id === matchedProd.id) {
            const newStock = Math.max(0, p.stock - itemQty);
            return { ...p, stock: newStock };
          }
          return p;
        });
      }

      invoiceItems.push({
        id: matchedProd?.id || Date.now(),
        name: itemName,
        size: itemSize,
        cat: "EDP",
        icon: matchedProd?.icon || "✨",
        price: itemPrice,
        cost: itemCost,
        qty: itemQty,
      });
    }

    // Update products inventory state & Firestore
    onUpdateProducts(updatedProducts);

    // 2. Construct Official Invoice Object
    const invoiceId = `INV-${String(nextInv).padStart(4, "0")}`;
    const todayStr = new Date().toLocaleDateString("en-PK", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });

    const newInvoice = {
      id: invoiceId,
      date: todayStr,
      customer: order.customer || "Google Sheet Customer",
      phone: order.phone || "None",
      address: order.address || "None",
      notes:
        `Google Sheet Order ID: ${order.orderId || order.id}. ${order.notes || ""}`.trim(),
      method: order.paymentMethod || "Cash on Delivery",
      items: invoiceItems,
      sub: orderSubtotal,
      disc: 0,
      total: orderSubtotal,
      cogs: totalCogs,
      profit: orderSubtotal - totalCogs,
    };

    // Save Invoice & Increment Counter
    await onAddInvoice(newInvoice);
    await onUpdateNextInv(nextInv + 1);

    // 3. Mark Order as Confirmed
    let orderFound = false;
    const targetOrderId = String(
      order.orderId || order.id || order.orderNumber || "",
    ).trim();
    const targetId = String(
      order.id || order.orderId || order.orderNumber || "",
    ).trim();

    const updatedSheetOrders = sheetOrders.map((o) => {
      const oOrderId = String(o.orderId || o.id || o.orderNumber || "").trim();
      const oId = String(o.id || o.orderId || o.orderNumber || "").trim();

      const isMatch =
        (targetOrderId &&
          oOrderId &&
          targetOrderId.toLowerCase() === oOrderId.toLowerCase()) ||
        (targetId && oId && targetId.toLowerCase() === oId.toLowerCase()) ||
        (targetOrderId &&
          oId &&
          targetOrderId.toLowerCase() === oId.toLowerCase()) ||
        (targetId &&
          oOrderId &&
          targetId.toLowerCase() === oOrderId.toLowerCase());

      if (isMatch) {
        orderFound = true;
        return {
          ...o,
          status: "Confirmed",
          invoiceId: newInvoice.id,
          confirmedAt: new Date().toLocaleTimeString("en-PK", {
            hour: "2-digit",
            minute: "2-digit",
          }),
        };
      }
      return o;
    });

    if (!orderFound) {
      updatedSheetOrders.unshift({
        ...order,
        status: "Confirmed",
        invoiceId: newInvoice.id,
        confirmedAt: new Date().toLocaleTimeString("en-PK", {
          hour: "2-digit",
          minute: "2-digit",
        }),
      });
    }

    onUpdateSheetOrders(updatedSheetOrders);

    // 4. Optionally send confirmation webhook callback back to Google Apps Script
    try {
      fetch("/api/sheet-orders/confirm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderId: order.orderId || order.id,
          invoiceId: newInvoice.id,
          status: "Confirmed",
        }),
      }).catch(() => {});
    } catch (e) {}

    // Toast & open receipt modal
    if (onShowToast) {
      onShowToast(
        `Order #${order.orderId || order.id} Confirmed! Generated ${newInvoice.id} & updated inventory.`,
      );
    }

    setActiveReceiptInvoice(newInvoice);
  };

  // Add Manual Test Order
  const handleCreateTestOrder = (e) => {
    e.preventDefault();
    if (!newCustomer.trim()) return;

    const prod =
      products.find((p) => p.id === Number(selectedProductId)) || products[0];
    const qty = Math.max(1, Number(selectedQty) || 1);
    const unitPrice =
      prod.discountPrice && prod.discountPrice > 0
        ? prod.discountPrice
        : prod.price;

    const newOrder = {
      id: `GSO-${Date.now().toString().slice(-4)}`,
      orderId: `ORD-${Math.floor(1000 + Math.random() * 9000)}`,
      date: new Date().toLocaleString("en-PK", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
      }),
      customer: newCustomer.trim(),
      phone: newPhone.trim() || "0300-1234567",
      address: newAddress.trim() || "Lahore, Pakistan",
      paymentMethod: newPayMethod,
      notes: newNotes.trim() || "None",
      status: "Pending",
      items: [
        {
          id: prod.id,
          name: prod.name,
          size: prod.size,
          price: unitPrice,
          cost: prod.cost,
          qty: qty,
        },
      ],
      total: unitPrice * qty,
    };

    onUpdateSheetOrders([newOrder, ...sheetOrders]);
    setShowAddModal(false);
    setNewCustomer("");
    setNewPhone("");
    setNewAddress("");
    setNewNotes("");

    if (onShowToast) onShowToast(`Added Sheet Order #${newOrder.orderId}`);
  };

  return (
    <div className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full space-y-6">
      {/* Header Banner */}
      <div className="bg-[#111116] border border-white/5 rounded-2xl p-5 sm:p-6 shadow-xl relative overflow-hidden flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1.5 z-10">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-gradient-to-br from-[#CFB050]/20 to-amber-500/10 border border-[#CFB050]/20 text-[#CFB050]">
              <FileSpreadsheet size={20} />
            </div>
            <h1 className="font-display font-bold text-xl sm:text-2xl text-white tracking-wide">
              Google Sheet Online Orders
            </h1>
          </div>
          <p className="text-xs text-gray-400 max-w-xl">
            Live orders synced from your Google Sheet. Confirming an order
            automatically updates inventory stock, generates a formal receipt,
            and registers sales in P&amp;L reports.
          </p>

          {/* Connection Status Badge */}
          <div className="pt-2 flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-mono font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <Lock size={12} className="text-emerald-400" />
              Connected via SHEET_ORDERS_URL (.env protected)
            </span>
            <span className="text-[10px] text-gray-500 font-mono hidden sm:inline">
              Real-time Web App Proxy Active
            </span>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2.5 z-10 flex-wrap">
          <button
            onClick={handleFetchSheetOrders}
            disabled={isLoading}
            className="px-4 py-2.5 bg-[#1A1A22] hover:bg-white/10 text-gray-200 hover:text-white rounded-xl text-xs font-semibold flex items-center gap-2 border border-white/10 transition-all cursor-pointer disabled:opacity-50"
          >
            <RefreshCw
              size={14}
              className={
                isLoading ? "animate-spin text-[#CFB050]" : "text-gray-400"
              }
            />
            <span>{isLoading ? "Syncing Sheet..." : "Fetch Sheet Orders"}</span>
          </button>

          <button
            onClick={() => setShowAddModal(true)}
            className="px-4 py-2.5 bg-[#CFB050] hover:bg-[#E5C76B] text-black rounded-xl text-xs font-semibold flex items-center gap-2 shadow-lg shadow-[#CFB050]/10 transition-all cursor-pointer hover:scale-[1.02] active:scale-[0.98]"
          >
            <Plus size={15} />
            <span>Add Test Order</span>
          </button>
        </div>
      </div>

      {/* Overview Stat Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-[#111116] border border-white/5 rounded-2xl p-4 flex flex-col justify-between">
          <span className="text-[10px] font-mono text-gray-400 uppercase tracking-wider block">
            Total Sheet Orders
          </span>
          <span className="text-xl sm:text-2xl font-display font-bold text-white mt-1">
            {stats.totalCount}
          </span>
          <span className="text-[10px] text-gray-500 mt-1 block">
            Google Sheet log entries
          </span>
        </div>

        <div className="bg-[#111116] border border-amber-500/20 bg-amber-500/[0.02] rounded-2xl p-4 flex flex-col justify-between">
          <span className="text-[10px] font-mono text-amber-400/90 uppercase tracking-wider block flex items-center justify-between">
            <span>Pending Confirmation</span>
            <Clock size={12} className="animate-pulse text-amber-400" />
          </span>
          <span className="text-xl sm:text-2xl font-display font-bold text-amber-400 mt-1">
            {stats.pendingCount}
          </span>
          <span className="text-[10px] text-amber-500/70 mt-1 block">
            Awaiting invoice generation
          </span>
        </div>

        <div className="bg-[#111116] border border-emerald-500/20 bg-emerald-500/[0.02] rounded-2xl p-4 flex flex-col justify-between">
          <span className="text-[10px] font-mono text-emerald-400/90 uppercase tracking-wider block flex items-center justify-between">
            <span>Confirmed &amp; Invoiced</span>
            <CheckCircle2 size={12} className="text-emerald-400" />
          </span>
          <span className="text-xl sm:text-2xl font-display font-bold text-emerald-400 mt-1">
            {stats.confirmedCount}
          </span>
          <span className="text-[10px] text-emerald-500/70 mt-1 block">
            Stock deducted &amp; billed
          </span>
        </div>

        <div className="bg-[#111116] border border-white/5 rounded-2xl p-4 flex flex-col justify-between">
          <span className="text-[10px] font-mono text-gray-400 uppercase tracking-wider block">
            Total Order Volume
          </span>
          <span className="text-lg sm:text-xl font-mono font-bold text-[#CFB050] mt-1">
            {formatPrice(stats.totalRevenue)}
          </span>
          <span className="text-[10px] text-gray-500 mt-1 block">
            Gross Sheet Sales Value
          </span>
        </div>
      </div>

      {/* Search & Filter Controls */}
      <div className="flex flex-col sm:flex-row gap-3 items-center justify-between bg-[#111116] p-3 rounded-2xl border border-white/5">
        <div className="relative w-full sm:w-80">
          <Search
            size={14}
            className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500"
          />
          <input
            type="text"
            placeholder="Search Order ID, Customer, Phone..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-[#16161E] border border-white/5 rounded-xl pl-9 pr-4 py-2 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-[#CFB050]/40 transition-colors"
          />
          {search && (
            <button
              onClick={() => setSearch("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white"
            >
              <X size={12} />
            </button>
          )}
        </div>

        <div className="flex gap-1 bg-[#16161E] p-1 rounded-xl border border-white/5 w-full sm:w-auto justify-center">
          {["All", "Pending", "Confirmed"].map((filter) => (
            <button
              key={filter}
              onClick={() => setStatusFilter(filter)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                statusFilter === filter
                  ? "bg-[#CFB050]/20 text-[#CFB050] font-semibold border border-[#CFB050]/30"
                  : "text-gray-400 hover:text-white"
              }`}
            >
              {filter}
            </button>
          ))}
        </div>
      </div>

      {/* Orders List / Cards Grid */}
      {filteredOrders.length === 0 ? (
        <div className="bg-[#111116] border border-white/5 rounded-2xl p-12 text-center space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center mx-auto text-gray-500">
            <FileSpreadsheet size={24} />
          </div>
          <h3 className="font-display font-medium text-white text-sm">
            No Google Sheet Orders Found
          </h3>
          <p className="text-xs text-gray-500 max-w-md mx-auto">
            {search || statusFilter !== "All"
              ? "No orders match your current search or filter criteria."
              : 'Click "Fetch Sheet Orders" to pull latest entries from your connected Google Sheet or click "Add Test Order" to create one.'}
          </p>
          <button
            onClick={handleFetchSheetOrders}
            className="px-4 py-2 bg-[#CFB050]/15 hover:bg-[#CFB050]/25 text-[#CFB050] rounded-xl text-xs font-semibold inline-flex items-center gap-2 border border-[#CFB050]/20 transition-all cursor-pointer mt-2"
          >
            <RefreshCw size={13} />
            <span>Sync Google Sheet</span>
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          <AnimatePresence>
            {filteredOrders.map((order) => {
              const isConfirmed =
                order.status === "Confirmed" || order.status === "Invoiced";

              return (
                <motion.div
                  key={order.id || order.orderId}
                  layout
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.98 }}
                  className={`bg-[#111116] rounded-2xl border transition-all p-5 shadow-lg ${
                    isConfirmed
                      ? "border-emerald-500/20 bg-emerald-950/[0.03]"
                      : "border-amber-500/20 bg-amber-950/[0.03]"
                  }`}
                >
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-white/5 pb-4 mb-4">
                    {/* Order ID & Status */}
                    <div className="flex items-center gap-3">
                      <div
                        className={`p-2.5 rounded-xl border ${
                          isConfirmed
                            ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400"
                            : "bg-amber-500/10 border-amber-500/20 text-amber-400"
                        }`}
                      >
                        {isConfirmed ? (
                          <PackageCheck size={18} />
                        ) : (
                          <Clock size={18} className="animate-pulse" />
                        )}
                      </div>

                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-white text-sm">
                            #{order.orderId || order.id}
                          </span>
                          <span
                            className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${
                              isConfirmed
                                ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                                : "bg-amber-500/10 text-amber-400 border-amber-500/20"
                            }`}
                          >
                            {isConfirmed
                              ? "Confirmed & Invoiced"
                              : "Pending Confirmation"}
                          </span>
                        </div>
                        <span className="text-[10px] text-gray-500 font-mono block mt-0.5">
                          Order Date: {order.date}
                        </span>
                      </div>
                    </div>

                    {/* Right side summary & Invoice Link */}
                    <div className="flex items-center gap-4 flex-wrap">
                      <div className="text-right">
                        <span className="text-[10px] text-gray-500 font-mono block uppercase">
                          Order Total
                        </span>
                        <span className="font-mono font-bold text-base text-[#CFB050]">
                          {formatPrice(order.total)}
                        </span>
                      </div>

                      {isConfirmed ? (
                        <div className="flex items-center gap-2">
                          <span className="px-3 py-1.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-xl text-xs font-mono font-bold">
                            {order.invoiceId || "INV-Generated"}
                          </span>
                          <button
                            onClick={() => {
                              // Find or construct invoice for previewing receipt
                              const mockInv = {
                                id: order.invoiceId || "INV-1001",
                                date: order.date,
                                customer: order.customer,
                                phone: order.phone,
                                address: order.address,
                                method: order.paymentMethod,
                                items: (order.items || []).map((i) => ({
                                  id: i.id || 1,
                                  name: i.name,
                                  size: i.size || "50ml",
                                  price: i.price,
                                  qty: i.qty || 1,
                                  icon: "✨",
                                })),
                                sub: order.total,
                                disc: 0,
                                total: order.total,
                              };
                              setActiveReceiptInvoice(mockInv);
                            }}
                            className="px-3 py-1.5 bg-white/5 hover:bg-white/10 text-gray-200 hover:text-white rounded-xl text-xs font-medium flex items-center gap-1.5 border border-white/10 transition-colors cursor-pointer"
                          >
                            <Printer size={13} />
                            <span>View Receipt</span>
                          </button>
                          <button
                            onClick={() => setOrderToDelete(order)}
                            title="Delete Order"
                            className="p-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 hover:text-red-300 rounded-xl text-xs flex items-center justify-center border border-red-500/20 transition-all cursor-pointer hover:scale-105 active:scale-95"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleConfirmOrder(order)}
                            className="px-4 py-2.5 bg-gradient-to-r from-[#CFB050] to-amber-500 hover:from-[#E5C76B] hover:to-amber-400 text-black font-semibold rounded-xl text-xs flex items-center gap-2 shadow-lg shadow-[#CFB050]/20 transition-all cursor-pointer hover:scale-[1.02] active:scale-[0.98]"
                          >
                            <CheckCircle2 size={15} />
                            <span>Confirm &amp; Generate Invoice</span>
                          </button>
                          <button
                            onClick={() => setOrderToDelete(order)}
                            title="Delete Order"
                            className="p-2.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 hover:text-red-300 rounded-xl text-xs flex items-center justify-center border border-red-500/20 transition-all cursor-pointer hover:scale-105 active:scale-95"
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Order Details Body Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                    {/* Customer Info */}
                    <div className="bg-[#16161E] rounded-xl p-3.5 border border-white/5 space-y-2">
                      <span className="text-[10px] font-mono font-bold text-gray-500 uppercase tracking-wider block pb-1 border-b border-white/5">
                        Customer &amp; Shipping
                      </span>
                      <div className="space-y-1.5 text-gray-300">
                        <div className="flex items-center gap-2">
                          <User size={13} className="text-[#CFB050] shrink-0" />
                          <span className="font-semibold text-white">
                            {order.customer}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Phone size={13} className="text-gray-500 shrink-0" />
                          <span className="font-mono text-gray-400">
                            {order.phone}
                          </span>
                        </div>
                        <div className="flex items-start gap-2">
                          <MapPin
                            size={13}
                            className="text-gray-500 shrink-0 mt-0.5"
                          />
                          <span className="text-gray-400 leading-snug">
                            {order.address}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Payment & Notes */}
                    <div className="bg-[#16161E] rounded-xl p-3.5 border border-white/5 space-y-2">
                      <span className="text-[10px] font-mono font-bold text-gray-500 uppercase tracking-wider block pb-1 border-b border-white/5">
                        Payment &amp; Instructions
                      </span>
                      <div className="space-y-1.5 text-gray-300">
                        <div className="flex items-center gap-2">
                          <CreditCard
                            size={13}
                            className="text-emerald-400 shrink-0"
                          />
                          <span className="font-medium text-emerald-300">
                            {order.paymentMethod}
                          </span>
                        </div>
                        {order.notes && order.notes !== "None" && (
                          <div className="bg-white/[0.02] p-2 rounded-lg border border-white/5 text-[11px] text-gray-400 italic">
                            "{order.notes}"
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Items Breakdown Table */}
                    <div className="bg-[#16161E] rounded-xl p-3.5 border border-white/5 space-y-2">
                      <span className="text-[10px] font-mono font-bold text-gray-500 uppercase tracking-wider block pb-1 border-b border-white/5">
                        Ordered Products ({order.items?.length || 0})
                      </span>
                      <div className="space-y-1.5">
                        {(order.items || []).map((item, idx) => (
                          <div
                            key={idx}
                            className="flex justify-between items-center py-1 border-b border-white/[0.03] last:border-0 text-xs"
                          >
                            <div>
                              <span className="text-white font-medium block">
                                {item.name}
                              </span>
                              <span className="text-[10px] text-gray-500 font-mono">
                                Qty: {item.qty} × {formatPrice(item.price)}
                              </span>
                            </div>
                            <span className="font-mono font-semibold text-[#CFB050]">
                              {formatPrice((item.qty || 1) * (item.price || 0))}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}

      {/* Add Test Sheet Order Modal */}
      <AnimatePresence>
        {showAddModal && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-[#14141C] border border-white/10 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl"
            >
              <div className="flex items-center justify-between px-6 py-4 border-b border-white/5">
                <div className="flex items-center gap-2">
                  <FileSpreadsheet size={18} className="text-[#CFB050]" />
                  <h3 className="font-display font-medium text-white text-base">
                    Add Test Sheet Order
                  </h3>
                </div>
                <button
                  onClick={() => setShowAddModal(false)}
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={handleCreateTestOrder} className="p-6 space-y-4">
                <p className="text-xs text-gray-400">
                  Simulate an incoming online order from your Google Sheet. It
                  will appear on this tab ready for instant confirmation.
                </p>

                <div className="space-y-3">
                  <div>
                    <label className="text-[11px] font-mono text-gray-400 block mb-1">
                      Customer Full Name *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Bilal Ahmed"
                      value={newCustomer}
                      onChange={(e) => setNewCustomer(e.target.value)}
                      className="w-full bg-[#1A1A24] border border-white/10 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-[#CFB050]"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-[11px] font-mono text-gray-400 block mb-1">
                        Phone Number
                      </label>
                      <input
                        type="text"
                        placeholder="0300-1234567"
                        value={newPhone}
                        onChange={(e) => setNewPhone(e.target.value)}
                        className="w-full bg-[#1A1A24] border border-white/10 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-[#CFB050]"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] font-mono text-gray-400 block mb-1">
                        Payment Method
                      </label>
                      <select
                        value={newPayMethod}
                        onChange={(e) => setNewPayMethod(e.target.value)}
                        className="w-full bg-[#1A1A24] border border-white/10 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-[#CFB050]"
                      >
                        <option value="Cash on Delivery">
                          Cash on Delivery
                        </option>
                        <option value="Bank Transfer">Bank Transfer</option>
                        <option value="JazzCash / EasyPaisa">
                          JazzCash / EasyPaisa
                        </option>
                        <option value="Credit Card">Credit Card</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="text-[11px] font-mono text-gray-400 block mb-1">
                      Shipping Address
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. House #15, Street 4, F-8/2, Islamabad"
                      value={newAddress}
                      onChange={(e) => setNewAddress(e.target.value)}
                      className="w-full bg-[#1A1A24] border border-white/10 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-[#CFB050]"
                    />
                  </div>

                  <div className="grid grid-cols-3 gap-3">
                    <div className="col-span-2">
                      <label className="text-[11px] font-mono text-gray-400 block mb-1">
                        Select Fragrance Product
                      </label>
                      <select
                        value={selectedProductId}
                        onChange={(e) => setSelectedProductId(e.target.value)}
                        className="w-full bg-[#1A1A24] border border-white/10 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-[#CFB050]"
                      >
                        {products.map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.name} ({p.size}) - PKR{" "}
                            {p.discountPrice || p.price} [Stock: {p.stock}]
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="text-[11px] font-mono text-gray-400 block mb-1">
                        Quantity
                      </label>
                      <input
                        type="number"
                        min="1"
                        value={selectedQty}
                        onChange={(e) => setSelectedQty(e.target.value)}
                        className="w-full bg-[#1A1A24] border border-white/10 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-[#CFB050]"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-[11px] font-mono text-gray-400 block mb-1">
                      Special Order Notes
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Call before delivery"
                      value={newNotes}
                      onChange={(e) => setNewNotes(e.target.value)}
                      className="w-full bg-[#1A1A24] border border-white/10 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-[#CFB050]"
                    />
                  </div>
                </div>

                <div className="pt-4 border-t border-white/5 flex gap-3 justify-end">
                  <button
                    type="button"
                    onClick={() => setShowAddModal(false)}
                    className="px-4 py-2 bg-white/5 hover:bg-white/10 text-gray-300 rounded-xl text-xs font-medium"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 bg-[#CFB050] hover:bg-[#E5C76B] text-black font-semibold rounded-xl text-xs shadow-lg shadow-[#CFB050]/10"
                  >
                    Add Order
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Printable Receipt Modal */}
      <AnimatePresence>
        {activeReceiptInvoice && (
          <ReceiptModal
            invoice={activeReceiptInvoice}
            products={products}
            onClose={() => setActiveReceiptInvoice(null)}
          />
        )}
      </AnimatePresence>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {orderToDelete && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-[#111116] border border-red-500/20 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl"
            >
              <div className="flex items-center justify-between border-b border-white/5 pb-3">
                <div className="flex items-center gap-2.5 text-red-400">
                  <div className="p-2 rounded-xl bg-red-500/10 border border-red-500/20">
                    <Trash2 size={18} />
                  </div>
                  <h3 className="font-display font-semibold text-white text-base">
                    Delete Order
                  </h3>
                </div>
                <button
                  onClick={() => setOrderToDelete(null)}
                  className="text-gray-400 hover:text-white p-1 rounded-lg hover:bg-white/5 transition-colors cursor-pointer"
                >
                  <X size={16} />
                </button>
              </div>

              <p className="text-xs text-gray-300 leading-relaxed">
                Are you sure you want to delete order{" "}
                <span className="font-mono font-bold text-white">
                  #{orderToDelete.orderId || orderToDelete.id}
                </span>{" "}
                for{" "}
                <span className="font-medium text-white">
                  {orderToDelete.customer}
                </span>
                ?
              </p>
              <p className="text-[11px] text-gray-500">
                This order will be permanently removed from your active Google
                Sheet order view.
              </p>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setOrderToDelete(null)}
                  className="flex-1 py-2.5 bg-white/5 hover:bg-white/10 text-gray-300 rounded-xl text-xs font-semibold border border-white/10 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={confirmDeleteOrder}
                  className="flex-1 py-2.5 bg-red-500 hover:bg-red-600 text-white rounded-xl text-xs font-semibold shadow-lg shadow-red-500/20 transition-all cursor-pointer"
                >
                  Delete Order
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
