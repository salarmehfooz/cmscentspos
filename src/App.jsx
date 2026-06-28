import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  ShoppingBag,
  Package,
  Receipt,
  FileText,
  TrendingUp,
  Download,
  Upload,
  Calendar,
  Sparkles,
  RefreshCw,
} from "lucide-react";

import {
  getStoredProducts,
  setStoredProducts,
  getStoredExpenses,
  setStoredExpenses,
  getStoredInvoices,
  setStoredInvoices,
  getStoredNextInv,
  setStoredNextInv,
  getStoredNextProd,
  setStoredNextProd,
  exportBackupData,
  importBackupData,
  INITIAL_PRODUCTS,
  INITIAL_EXPENSES,
} from "./storage";

import {
  syncProducts,
  syncExpenses,
  syncInvoices,
  syncCounters,
  dbSaveProduct,
  dbDeleteProduct,
  dbSaveExpense,
  dbDeleteExpense,
  dbSaveInvoice,
  dbDeleteInvoice,
  dbSaveCounters,
  dbImportBackup,
  seedInitialDataIfEmpty,
} from "./firebase";

import POSView from "./components/POSView";
import InventoryView from "./components/InventoryView";
import ExpensesView from "./components/ExpensesView";
import InvoicesView from "./components/InvoicesView";
import PLView from "./components/PLView";

export default function App() {
  const [activeTab, setActiveTab] = useState("pos");

  // Load state from local storage on initial mount, which then stays in sync with Firestore
  const [products, setProducts] = useState(getStoredProducts);
  const [expenses, setExpenses] = useState(getStoredExpenses);
  const [invoices, setInvoices] = useState(getStoredInvoices);
  const [nextInv, setNextInv] = useState(getStoredNextInv);
  const [nextProd, setNextProd] = useState(getStoredNextProd);

  const [dateStr, setDateStr] = useState("");
  const [backupFileContent, setBackupFileContent] = useState("");
  const [notif, setNotif] = useState(null);

  // Sync state changes to local storage (for backup/offline speed)
  useEffect(() => {
    setStoredProducts(products);
  }, [products]);

  useEffect(() => {
    setStoredExpenses(expenses);
  }, [expenses]);

  useEffect(() => {
    setStoredInvoices(invoices);
  }, [invoices]);

  useEffect(() => {
    setStoredNextInv(nextInv);
  }, [nextInv]);

  useEffect(() => {
    setStoredNextProd(nextProd);
  }, [nextProd]);

  // Establish Firestore real-time sync subscription and seed initial data if collections are empty
  useEffect(() => {
    seedInitialDataIfEmpty(INITIAL_PRODUCTS, INITIAL_EXPENSES).then(() => {
      console.log("Firestore seeding check complete.");
    });

    const unsubscribeProducts = syncProducts((dbProducts) => {
      setProducts(dbProducts);
    });

    const unsubscribeExpenses = syncExpenses((dbExpenses) => {
      setExpenses(dbExpenses);
    });

    const unsubscribeInvoices = syncInvoices((dbInvoices) => {
      setInvoices(dbInvoices);
    });

    const unsubscribeCounters = syncCounters((counters) => {
      if (typeof counters.nextInv === "number") {
        setNextInv(counters.nextInv);
      }
      if (typeof counters.nextProd === "number") {
        setNextProd(counters.nextProd);
      }
    });

    return () => {
      unsubscribeProducts();
      unsubscribeExpenses();
      unsubscribeInvoices();
      unsubscribeCounters();
    };
  }, []);

  // Sync actions to write changes to Firestore
  const handleUpdateProducts = async (newProducts) => {
    setProducts(newProducts);
    try {
      // Save or update newer/modified items
      for (const item of newProducts) {
        const existing = products.find((p) => p.id === item.id);
        if (!existing || JSON.stringify(existing) !== JSON.stringify(item)) {
          await dbSaveProduct(item);
        }
      }
      // Delete removed items
      for (const item of products) {
        if (!newProducts.some((p) => p.id === item.id)) {
          await dbDeleteProduct(item.id);
        }
      }
    } catch (err) {
      console.error("Failed to sync products with Firestore:", err);
      showToast("Cloud Database Sync Error", "error");
    }
  };

  const handleUpdateExpenses = async (newExpenses) => {
    setExpenses(newExpenses);
    try {
      // Save or update newer/modified items
      for (const item of newExpenses) {
        const existing = expenses.find((e) => e.id === item.id);
        if (!existing || JSON.stringify(existing) !== JSON.stringify(item)) {
          await dbSaveExpense(item);
        }
      }
      // Delete removed items
      for (const item of expenses) {
        if (!newExpenses.some((e) => e.id === item.id)) {
          await dbDeleteExpense(item.id);
        }
      }
    } catch (err) {
      console.error("Failed to sync expenses with Firestore:", err);
      showToast("Cloud Database Sync Error", "error");
    }
  };

  const handleAddInvoice = async (inv) => {
    setInvoices((prev) => [inv, ...prev]);
    try {
      await dbSaveInvoice(inv);
    } catch (err) {
      console.error("Failed to save invoice to Firestore:", err);
      showToast("Cloud Database Sync Error", "error");
    }
  };

  const handleDeleteInvoice = async (invoiceId) => {
    setInvoices((prev) => prev.filter((inv) => inv.id !== invoiceId));
    try {
      await dbDeleteInvoice(invoiceId);
      showToast("Invoice deleted successfully!");
    } catch (err) {
      console.error("Failed to delete invoice from Firestore:", err);
      showToast("Cloud Database Sync Error", "error");
    }
  };

  const handleUpdateNextInv = async (val) => {
    setNextInv(val);
    try {
      await dbSaveCounters(val, nextProd);
    } catch (err) {
      console.error("Failed to save counters:", err);
    }
  };

  const handleUpdateNextProd = async (val) => {
    setNextProd(val);
    try {
      await dbSaveCounters(nextInv, val);
    } catch (err) {
      console.error("Failed to save counters:", err);
    }
  };

  // Dynamically update real-time PK date and time
  useEffect(() => {
    const updateTime = () => {
      const formatted = new Date().toLocaleDateString("en-PK", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: true,
      });
      setDateStr(formatted);
    };
    updateTime();
    const timer = setInterval(updateTime, 1000);
    return () => clearInterval(timer);
  }, []);

  // Show a disappearing auto-toast
  const showToast = (message, type = "success") => {
    setNotif({ message, type });
    setTimeout(() => {
      setNotif(null);
    }, 4000);
  };

  // Database actions: Export JSON backup
  const handleExportBackup = () => {
    const dataStr = exportBackupData();
    const dataUri =
      "data:application/json;charset=utf-8," + encodeURIComponent(dataStr);

    const exportFileDefaultName = `CM_Scents_POS_Backup_${new Date().toISOString().slice(0, 10)}.json`;

    const linkElement = document.createElement("a");
    linkElement.setAttribute("href", dataUri);
    linkElement.setAttribute("download", exportFileDefaultName);
    linkElement.click();
    showToast("Database backup exported successfully");
  };

  // Database actions: Import JSON backup
  const handleImportBackup = (e) => {
    const fileReader = new FileReader();
    const file = e.target.files?.[0];
    if (!file) return;

    fileReader.onload = async (event) => {
      const result = event.target?.result;
      try {
        const parsed = JSON.parse(result);
        await dbImportBackup(parsed);
        showToast("Database restored and synced to Firestore successfully!");
      } catch (err) {
        console.error("Backup import to Firestore failed:", err);
        showToast("Invalid backup file structure or sync error.", "error");
      }
    };
    fileReader.readAsText(file);
    // Reset file input value so same file can be uploaded again
    e.target.value = "";
  };

  return (
    <div className="flex flex-col min-h-screen w-full bg-[#0A0A0D] text-gray-200 font-sans antialiased selection:bg-[#CFB050]/20 selection:text-[#CFB050]">
      {/* Premium Top Navigation Header */}
      <nav className="h-16 border-b border-white/5 bg-[#0D0D12] flex items-center justify-between px-4 sm:px-6 flex-shrink-0 z-10 relative">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-[#CFB050]/20 to-amber-500/10 border border-[#CFB050]/20 flex items-center justify-center shadow-lg shadow-[#CFB050]/5">
            <Sparkles size={16} className="text-[#CFB050]" />
          </div>
          <div>
            <span className="font-display font-bold text-white text-xs sm:text-sm tracking-[0.22em]">
              C·M SCENTS
            </span>
            <span className="text-[9px] text-gray-500 font-mono block tracking-wider uppercase mt-0.5">
              Enterprise POS
            </span>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex gap-1 bg-[#15151C] p-1 rounded-xl border border-white/5">
          <button
            onClick={() => setActiveTab("pos")}
            className={`px-3 py-1.5 rounded-lg text-xs font-display font-medium flex items-center gap-1.5 transition-all cursor-pointer ${
              activeTab === "pos"
                ? "bg-[#CFB050]/15 text-[#CFB050] font-semibold border-b-2 border-[#CFB050]"
                : "text-gray-400 hover:text-white"
            }`}
          >
            <ShoppingBag size={13} />
            <span className="hidden sm:inline">POS Checkout</span>
          </button>

          <button
            onClick={() => setActiveTab("inv")}
            className={`px-3 py-1.5 rounded-lg text-xs font-display font-medium flex items-center gap-1.5 transition-all cursor-pointer ${
              activeTab === "inv"
                ? "bg-[#CFB050]/15 text-[#CFB050] font-semibold border-b-2 border-[#CFB050]"
                : "text-gray-400 hover:text-white"
            }`}
          >
            <Package size={13} />
            <span className="hidden sm:inline">Inventory</span>
          </button>

          <button
            onClick={() => setActiveTab("exp")}
            className={`px-3 py-1.5 rounded-lg text-xs font-display font-medium flex items-center gap-1.5 transition-all cursor-pointer ${
              activeTab === "exp"
                ? "bg-[#CFB050]/15 text-[#CFB050] font-semibold border-b-2 border-[#CFB050]"
                : "text-gray-400 hover:text-white"
            }`}
          >
            <Receipt size={13} />
            <span className="hidden sm:inline">Expenses</span>
          </button>

          <button
            onClick={() => setActiveTab("invoices")}
            className={`px-3 py-1.5 rounded-lg text-xs font-display font-medium flex items-center gap-1.5 transition-all cursor-pointer ${
              activeTab === "invoices"
                ? "bg-[#CFB050]/15 text-[#CFB050] font-semibold border-b-2 border-[#CFB050]"
                : "text-gray-400 hover:text-white"
            }`}
          >
            <FileText size={13} />
            <span className="hidden sm:inline">Invoices</span>
          </button>

          <button
            onClick={() => setActiveTab("pl")}
            className={`px-3 py-1.5 rounded-lg text-xs font-display font-medium flex items-center gap-1.5 transition-all cursor-pointer ${
              activeTab === "pl"
                ? "bg-[#CFB050]/15 text-[#CFB050] font-semibold border-b-2 border-[#CFB050]"
                : "text-gray-400 hover:text-white"
            }`}
          >
            <TrendingUp size={13} />
            <span className="hidden sm:inline">P&amp;L Analysis</span>
          </button>
        </div>

        {/* Right Info: Live clock + backup tools */}
        <div className="flex items-center gap-4">
          <span className="hidden lg:flex items-center gap-1.5 text-[10px] text-gray-500 font-mono">
            <Calendar size={12} className="text-gray-600" />
            {dateStr || "Loading clock..."}
          </span>

          {/* Backup Restore controls */}
          <div className="flex items-center gap-1">
            <button
              onClick={handleExportBackup}
              title="Download database JSON backup"
              className="p-1.5 hover:bg-white/5 border border-transparent hover:border-white/5 hover:text-[#CFB050] rounded-lg transition-all cursor-pointer text-gray-400"
            >
              <Download size={14} />
            </button>
            <label
              title="Upload database JSON restore"
              className="p-1.5 hover:bg-white/5 border border-transparent hover:border-white/5 hover:text-[#CFB050] rounded-lg transition-all cursor-pointer text-gray-400 inline-block"
            >
              <Upload size={14} />
              <input
                type="file"
                accept=".json"
                onChange={handleImportBackup}
                className="hidden"
              />
            </label>
          </div>
        </div>
      </nav>

      {/* Main App Content View area */}
      <main className="flex-1 flex flex-col relative">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.15 }}
            className="flex-1 flex flex-col"
          >
            {activeTab === "pos" && (
              <POSView
                products={products}
                onUpdateProducts={handleUpdateProducts}
                onAddInvoice={handleAddInvoice}
                nextInv={nextInv}
                onUpdateNextInv={handleUpdateNextInv}
                onShowToast={showToast}
              />
            )}

            {activeTab === "inv" && (
              <InventoryView
                products={products}
                onUpdateProducts={handleUpdateProducts}
                nextProd={nextProd}
                onUpdateNextProd={handleUpdateNextProd}
              />
            )}

            {activeTab === "exp" && (
              <ExpensesView
                expenses={expenses}
                onUpdateExpenses={handleUpdateExpenses}
              />
            )}

            {activeTab === "invoices" && (
              <InvoicesView
                invoices={invoices}
                onDeleteInvoice={handleDeleteInvoice}
              />
            )}

            {activeTab === "pl" && (
              <PLView
                invoices={invoices}
                expenses={expenses}
                products={products}
              />
            )}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Database Auto-Notification Toast */}
      <AnimatePresence>
        {notif && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className={`fixed bottom-5 right-5 z-50 border px-4 py-3 rounded-xl text-xs font-semibold shadow-2xl flex items-center gap-2 ${
              notif.type === "error"
                ? "bg-red-950/90 text-red-400 border-red-500/20"
                : "bg-emerald-950/90 text-emerald-400 border-emerald-500/20"
            }`}
          >
            <RefreshCw size={13} className="animate-spin" />
            <span>{notif.message}</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
