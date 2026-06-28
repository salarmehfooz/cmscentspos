import React, { useState, useMemo } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  FileText,
  Search,
  ChevronRight,
  X,
  Calendar,
  User,
  Printer,
  TrendingUp,
  Trash2,
} from "lucide-react";

export default function InvoicesView({ invoices, onDeleteInvoice }) {
  const [search, setSearch] = useState("");
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [selectedMonthFilter, setSelectedMonthFilter] = useState("All");

  // Helper to parse date strings (e.g. "15 Jun 2026") into months
  const parseMonthYear = (dateStr) => {
    if (!dateStr) return { label: "Unknown", sortKey: "0000-00" };
    const parts = dateStr.split(" ");
    if (parts.length === 3) {
      const [day, month, year] = parts;
      const months = {
        Jan: { name: "January", val: "01" },
        Feb: { name: "February", val: "02" },
        Mar: { name: "March", val: "03" },
        Apr: { name: "April", val: "04" },
        May: { name: "May", val: "05" },
        Jun: { name: "June", val: "06" },
        Jul: { name: "July", val: "07" },
        Aug: { name: "August", val: "08" },
        Sep: { name: "September", val: "09" },
        Oct: { name: "October", val: "10" },
        Nov: { name: "November", val: "11" },
        Dec: { name: "December", val: "12" },
      };
      const info = months[month] || { name: month, val: "00" };
      return {
        label: `${info.name} ${year}`,
        sortKey: `${year}-${info.val}`,
      };
    }
    const d = new Date(dateStr);
    if (!isNaN(d.getTime())) {
      const monthsFull = [
        "January",
        "February",
        "March",
        "April",
        "May",
        "June",
        "July",
        "August",
        "September",
        "October",
        "November",
        "December",
      ];
      const monthVal = String(d.getMonth() + 1).padStart(2, "0");
      return {
        label: `${monthsFull[d.getMonth()]} ${d.getFullYear()}`,
        sortKey: `${d.getFullYear()}-${monthVal}`,
      };
    }
    return { label: "Unknown", sortKey: "0000-00" };
  };

  // Get unique months sorted chronologically latest first
  const sortedMonths = useMemo(() => {
    const monthMap = {};
    invoices.forEach((inv) => {
      const parsed = parseMonthYear(inv.date);
      monthMap[parsed.label] = parsed.sortKey;
    });
    return Object.keys(monthMap).sort((a, b) =>
      monthMap[b].localeCompare(monthMap[a]),
    );
  }, [invoices]);

  // Search & Month filter
  const filteredInvoices = useMemo(() => {
    return invoices.filter((inv) => {
      const matchesSearch =
        inv.id.toLowerCase().includes(search.toLowerCase()) ||
        inv.customer.toLowerCase().includes(search.toLowerCase()) ||
        inv.method.toLowerCase().includes(search.toLowerCase());

      if (!matchesSearch) return false;
      if (selectedMonthFilter === "All") return true;
      return parseMonthYear(inv.date).label === selectedMonthFilter;
    });
  }, [invoices, search, selectedMonthFilter]);

  // Group filtered list for visual display
  const groupedInvoices = useMemo(() => {
    const groups = {};
    filteredInvoices.forEach((inv) => {
      const parsed = parseMonthYear(inv.date);
      if (!groups[parsed.label]) {
        groups[parsed.label] = [];
      }
      groups[parsed.label].push(inv);
    });

    const sortedGroupKeys = Object.keys(groups).sort((a, b) => {
      const keyA = parseMonthYear(groups[a][0].date).sortKey;
      const keyB = parseMonthYear(groups[b][0].date).sortKey;
      return keyB.localeCompare(keyA);
    });

    return { groups, sortedGroupKeys };
  }, [filteredInvoices]);

  const formatPrice = (num) => `PKR ${Math.round(num).toLocaleString()}`;

  const handlePrint = () => {
    try {
      window.focus();
      window.print();
    } catch (e) {
      console.error("Print failed or was blocked:", e);
    }
  };

  return (
    <div className="flex-1 p-4 md:p-6 bg-[#0A0A0D] flex flex-col gap-6">
      {/* View Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-display font-bold text-white tracking-wide">
            Sales Invoice Registry
          </h2>
          <p className="text-xs text-gray-500 mt-1">
            Access previous customer receipts, transaction methods, and margins
          </p>
        </div>
        <span className="bg-[#CFB050]/10 text-[#CFB050] border border-[#CFB050]/20 text-xs px-3.5 py-1.5 rounded-xl font-mono font-bold self-start sm:self-auto">
          {filteredInvoices.length} of {invoices.length} Invoices Shown
        </span>
      </div>

      {/* Search & Month Filter tool inside Invoices */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search
            className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400"
            size={16}
          />
          <input
            type="text"
            placeholder="Search by Invoice ID, customer name, payment type..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-[#111116] border border-white/5 focus:border-[#CFB050] focus:ring-1 focus:ring-[#CFB050]/20 rounded-xl py-3 pl-11 pr-4 text-white placeholder-gray-500 text-xs outline-none transition-all"
          />
        </div>
        <div className="flex items-center gap-2 bg-[#111116] border border-white/5 rounded-xl px-3.5 py-2.5">
          <Calendar size={14} className="text-[#CFB050] shrink-0" />
          <span className="text-[10px] text-gray-500 font-mono uppercase font-semibold shrink-0">
            Month:
          </span>
          <select
            value={selectedMonthFilter}
            onChange={(e) => setSelectedMonthFilter(e.target.value)}
            className="bg-transparent border-none text-[11px] text-white outline-none cursor-pointer pr-4 font-mono font-bold"
          >
            <option value="All" className="bg-[#111116]">
              All Months
            </option>
            {sortedMonths.map((m) => (
              <option key={m} value={m} className="bg-[#111116]">
                {m}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Scrollable list cards grouped by month */}
      <div className="space-y-6">
        {groupedInvoices.sortedGroupKeys.length > 0 ? (
          groupedInvoices.sortedGroupKeys.map((monthName) => (
            <div key={monthName} className="space-y-2.5">
              {/* Group header */}
              <div className="flex justify-between items-center px-1 border-b border-white/5 pb-2">
                <span className="text-xs font-semibold text-[#CFB050] font-display flex items-center gap-1.5">
                  <Calendar size={13} className="text-[#CFB050]/70" />
                  {monthName}
                </span>
                <div className="flex items-center gap-2.5 font-mono text-[10px] text-gray-500">
                  <span>
                    {groupedInvoices.groups[monthName].length} transaction
                    {groupedInvoices.groups[monthName].length !== 1 ? "s" : ""}
                  </span>
                  <span>·</span>
                  <span className="text-emerald-400 font-semibold">
                    Total:{" "}
                    {formatPrice(
                      groupedInvoices.groups[monthName].reduce(
                        (sum, item) => sum + item.total,
                        0,
                      ),
                    )}
                  </span>
                </div>
              </div>

              {/* Grouped Cards list */}
              <div className="space-y-2.5">
                {groupedInvoices.groups[monthName].map((inv) => (
                  <motion.div
                    whileHover={{
                      scale: 1.005,
                      borderColor: "rgba(207, 176, 80, 0.3)",
                    }}
                    whileTap={{ scale: 0.995 }}
                    key={inv.id}
                    onClick={() => setSelectedInvoice(inv)}
                    className="bg-[#111116] border border-white/5 rounded-2xl p-4 flex items-center justify-between cursor-pointer transition-all"
                  >
                    <div className="flex items-center gap-4 min-w-0">
                      <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-gray-400 flex-shrink-0">
                        <FileText size={18} />
                      </div>
                      <div className="min-w-0">
                        <span className="text-sm font-bold text-white block">
                          {inv.id}
                        </span>
                        <span className="text-[11px] text-gray-400 font-mono mt-0.5 block truncate">
                          {inv.date} · {inv.customer} ·{" "}
                          <span className="text-[#CFB050]">{inv.method}</span> ·{" "}
                          {inv.items.length} item
                          {inv.items.length !== 1 ? "s" : ""}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-4 pl-4 text-right flex-shrink-0">
                      <div>
                        <span className="text-sm font-bold text-[#CFB050] font-mono block">
                          {formatPrice(inv.total)}
                        </span>
                        <span className="text-[10px] text-emerald-400 font-mono block mt-0.5">
                          +{formatPrice(inv.profit)} profit
                        </span>
                      </div>
                      <ChevronRight className="text-gray-600" size={16} />
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          ))
        ) : (
          <div className="bg-[#111116] border border-white/5 rounded-2xl py-12 flex flex-col items-center justify-center text-gray-500">
            <FileText className="opacity-15 mb-2" size={36} />
            <p className="text-xs">
              No invoices found matching that description.
            </p>
          </div>
        )}
      </div>

      {/* Invoice Details Overlay Modal */}
      <AnimatePresence>
        {selectedInvoice && (
          <div className="fixed inset-0 bg-black/75 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-y-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="bg-[#181820] border border-white/10 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl"
            >
              {/* Modal Header */}
              <div className="px-6 py-4 border-b border-white/5 flex items-center justify-between">
                <div>
                  <h3 className="font-display font-bold text-[#CFB050] text-sm">
                    Invoice Details
                  </h3>
                  <span className="text-[10px] text-gray-400 font-mono block mt-0.5">
                    ID: {selectedInvoice.id}
                  </span>
                </div>
                <button
                  onClick={() => setSelectedInvoice(null)}
                  className="text-gray-400 hover:text-white transition-colors p-1.5 rounded-lg hover:bg-white/5"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Modal Details Body */}
              <div className="p-6 space-y-5">
                {typeof window !== "undefined" &&
                  window.self !== window.top && (
                    <div className="bg-amber-500/10 border border-amber-500/20 text-amber-200 p-3.5 rounded-xl text-[11px] leading-relaxed flex flex-col gap-1 shadow-inner">
                      <span className="font-bold flex items-center gap-1 text-amber-400">
                        ⚠️ Sandbox Preview Notice
                      </span>
                      <p>
                        Direct printing may be restricted inside the embedded
                        preview frame. Click{" "}
                        <strong className="text-white">
                          "Open in New Tab"
                        </strong>{" "}
                        in the top-right of the preview pane to print perfectly!
                      </p>
                    </div>
                  )}

                {/* Meta blocks */}
                <div className="grid grid-cols-2 gap-3.5 text-xs">
                  <div className="bg-white/5 p-3 rounded-xl border border-white/5">
                    <span className="text-[9px] text-gray-400 font-mono uppercase block tracking-wider mb-1">
                      Billing Information
                    </span>
                    <div className="flex items-center gap-1.5 text-white font-medium">
                      <User size={12} className="text-[#CFB050]" />
                      <span className="truncate">
                        {selectedInvoice.customer}
                      </span>
                    </div>
                  </div>

                  <div className="bg-white/5 p-3 rounded-xl border border-white/5">
                    <span className="text-[9px] text-gray-400 font-mono uppercase block tracking-wider mb-1">
                      Sale Date
                    </span>
                    <div className="flex items-center gap-1.5 text-white font-medium">
                      <Calendar size={12} className="text-[#CFB050]" />
                      <span>{selectedInvoice.date}</span>
                    </div>
                  </div>
                </div>

                {/* Shipping & Notes block */}
                {(selectedInvoice.address ||
                  (selectedInvoice.phone && selectedInvoice.phone !== "None") ||
                  (selectedInvoice.notes &&
                    selectedInvoice.notes !== "None")) && (
                  <div className="bg-white/5 p-3 rounded-xl border border-white/5 text-xs space-y-1.5">
                    <span className="text-[9px] text-gray-400 font-mono uppercase block tracking-wider font-semibold">
                      Shipping Details & Notes
                    </span>
                    {selectedInvoice.phone &&
                      selectedInvoice.phone !== "None" && (
                        <p className="text-gray-300">
                          <span className="text-gray-500 font-mono text-[10px] uppercase mr-1">
                            Phone:
                          </span>{" "}
                          {selectedInvoice.phone}
                        </p>
                      )}
                    {selectedInvoice.address && (
                      <p className="text-gray-300">
                        <span className="text-gray-500 font-mono text-[10px] uppercase mr-1">
                          Address:
                        </span>{" "}
                        {selectedInvoice.address}
                      </p>
                    )}
                    {selectedInvoice.notes &&
                      selectedInvoice.notes !== "None" && (
                        <p className="text-gray-300 italic">
                          <span className="text-gray-500 font-mono text-[10px] uppercase mr-1">
                            Note:
                          </span>{" "}
                          "{selectedInvoice.notes}"
                        </p>
                      )}
                  </div>
                )}

                {/* Items breakdown list */}
                <div className="space-y-2">
                  <span className="text-[10px] text-gray-500 font-mono uppercase tracking-wider font-semibold">
                    Products Sold
                  </span>
                  <div className="max-h-40 overflow-y-auto space-y-1.5 pr-1 scrollbar-thin">
                    {selectedInvoice.items.map((item) => (
                      <div
                        key={item.id}
                        className="flex justify-between items-center text-xs border-b border-white/[0.03] pb-1.5 last:border-0"
                      >
                        <span className="text-gray-300">
                          {item.icon} {item.name}{" "}
                          <span className="text-gray-500 font-mono text-[10px] ml-1">
                            ×{item.qty}
                          </span>
                        </span>
                        <span className="text-white font-mono font-bold">
                          {formatPrice(item.price * item.qty)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* financial tallies */}
                <div className="border-t border-white/5 pt-4 space-y-2 text-xs">
                  <div className="flex justify-between text-gray-400">
                    <span>Subtotal</span>
                    <span className="font-mono text-white">
                      {formatPrice(selectedInvoice.sub)}
                    </span>
                  </div>

                  {selectedInvoice.disc > 0 && (
                    <div className="flex justify-between text-red-400">
                      <span>Discount</span>
                      <span className="font-mono">
                        -{formatPrice(selectedInvoice.disc)}
                      </span>
                    </div>
                  )}

                  <div className="flex justify-between text-white font-bold text-sm border-t border-white/5 pt-2.5">
                    <span>Total Bill ({selectedInvoice.method})</span>
                    <span className="text-[#CFB050] font-mono">
                      {formatPrice(selectedInvoice.total)}
                    </span>
                  </div>

                  <div className="flex justify-between text-emerald-400 text-[11px] font-mono font-medium bg-emerald-500/5 px-2.5 py-1.5 rounded-lg border border-emerald-500/10 mt-2">
                    <span className="flex items-center gap-1">
                      <TrendingUp size={11} />
                      Gross Margin Profit
                    </span>
                    <span>+{formatPrice(selectedInvoice.profit)}</span>
                  </div>
                </div>
              </div>

              {/* Printable receipt wrapper that is hidden by default and visible under @media print */}
              <div className="hidden print:block">
                <div className="bg-white text-neutral-900 p-8 font-mono text-sm receipt-wrap max-w-lg mx-auto border border-neutral-200">
                  {/* Luxury Branding */}
                  <div className="text-center mb-6 border-b-2 border-dashed border-neutral-300 pb-5">
                    <h2 className="font-display font-bold text-2xl tracking-[0.25em] text-[#B8860B] uppercase">
                      C·M SCENTS
                    </h2>
                    <p className="text-[11px] text-neutral-500 uppercase tracking-widest mt-1">
                      Premium Fragrances &amp; Accents
                    </p>
                    <p className="text-[10px] text-neutral-500 mt-1">
                      Shop #4, Zamzama Luxury Arcade, Phase 5, DHA, Karachi
                    </p>
                    <p className="text-[10px] text-neutral-400 font-bold mt-0.5">
                      Phone: +92 300 8251234 · www.cmscents.com
                    </p>
                  </div>

                  {/* Transaction Metadata */}
                  <div className="grid grid-cols-2 gap-y-1.5 gap-x-4 text-xs text-neutral-600 mb-6 pb-4 border-b border-dashed border-neutral-300">
                    <div>
                      <span className="text-neutral-400 block uppercase text-[9px] tracking-wider">
                        Invoice Number
                      </span>
                      <span className="font-bold text-neutral-900 text-sm">
                        {selectedInvoice.id}
                      </span>
                    </div>
                    <div>
                      <span className="text-neutral-400 block uppercase text-[9px] tracking-wider">
                        Customer Name
                      </span>
                      <span className="font-medium text-neutral-900">
                        {selectedInvoice.customer}
                      </span>
                    </div>
                    <div className="mt-1">
                      <span className="text-neutral-400 block uppercase text-[9px] tracking-wider">
                        Transaction Date
                      </span>
                      <span className="text-neutral-900">
                        {selectedInvoice.date}
                      </span>
                    </div>
                    <div className="mt-1">
                      <span className="text-neutral-400 block uppercase text-[9px] tracking-wider">
                        Payment Channel
                      </span>
                      <span className="text-neutral-900 font-bold uppercase">
                        {selectedInvoice.method}
                      </span>
                    </div>
                  </div>

                  {/* Shipping/Billing Address on Printable Receipt */}
                  {selectedInvoice.address && (
                    <div className="text-xs text-neutral-600 mb-6 pb-4 border-b border-dashed border-neutral-300">
                      <span className="text-neutral-400 block uppercase text-[9px] tracking-wider">
                        Shipping & Billing Address
                      </span>
                      <span className="font-medium text-neutral-900">
                        {selectedInvoice.address}
                      </span>
                      {selectedInvoice.phone &&
                        selectedInvoice.phone !== "None" && (
                          <span className="text-neutral-500 block text-[10px] mt-0.5">
                            Contact: {selectedInvoice.phone}
                          </span>
                        )}
                    </div>
                  )}

                  {/* Itemized Table */}
                  <div className="mb-6">
                    <div className="grid grid-cols-12 text-[10px] text-neutral-400 font-bold uppercase border-b border-neutral-300 pb-2 mb-2">
                      <span className="col-span-6">Item Description</span>
                      <span className="col-span-2 text-center">Qty</span>
                      <span className="col-span-2 text-right">Unit</span>
                      <span className="col-span-2 text-right">Total</span>
                    </div>
                    <div className="space-y-2.5">
                      {selectedInvoice.items.map((item) => {
                        const isDiscounted =
                          item.originalPrice && item.originalPrice > item.price;
                        const unitDiscount = isDiscounted
                          ? item.originalPrice - item.price
                          : 0;

                        return (
                          <div
                            key={item.id}
                            className="grid grid-cols-12 text-xs items-center text-neutral-800"
                          >
                            <span className="col-span-6 font-medium text-neutral-900">
                              <div>
                                {item.icon} {item.name}
                              </div>
                              {isDiscounted && (
                                <div className="text-[10px] text-red-500 font-medium">
                                  Disc. -
                                  {Math.round(unitDiscount).toLocaleString()}{" "}
                                  PKR
                                </div>
                              )}
                            </span>
                            <span className="col-span-2 text-center text-neutral-500 font-bold">
                              {item.qty}
                            </span>
                            <span className="col-span-2 text-right text-neutral-500">
                              {isDiscounted ? (
                                <div>
                                  <span className="line-through text-neutral-400 text-[10px] block leading-none">
                                    {Math.round(
                                      item.originalPrice,
                                    ).toLocaleString()}
                                  </span>
                                  <span>
                                    {Math.round(item.price).toLocaleString()}
                                  </span>
                                </div>
                              ) : (
                                Math.round(item.price).toLocaleString()
                              )}
                            </span>
                            <span className="col-span-2 text-right font-semibold text-neutral-900">
                              {Math.round(
                                item.price * item.qty,
                              ).toLocaleString()}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Summary Breakdowns */}
                  {(() => {
                    const itemDiscounts = selectedInvoice.items.reduce(
                      (sum, item) => {
                        const original = item.originalPrice || item.price;
                        return (
                          sum + Math.max(0, original - item.price) * item.qty
                        );
                      },
                      0,
                    );
                    const checkoutDiscount = selectedInvoice.disc || 0;
                    const totalDiscount = itemDiscounts + checkoutDiscount;

                    return (
                      <div className="border-t border-dashed border-neutral-300 pt-4 space-y-2 text-xs text-neutral-600">
                        <div className="flex justify-between">
                          <span>Subtotal</span>
                          <span className="text-neutral-800">
                            {Math.round(
                              selectedInvoice.sub + itemDiscounts,
                            ).toLocaleString()}{" "}
                            PKR
                          </span>
                        </div>

                        {itemDiscounts > 0 && (
                          <div className="flex justify-between text-red-500 font-semibold">
                            <span>Product Discounts</span>
                            <span>
                              -{Math.round(itemDiscounts).toLocaleString()} PKR
                            </span>
                          </div>
                        )}

                        {checkoutDiscount > 0 && (
                          <div className="flex justify-between text-red-500 font-semibold">
                            <span>Checkout Discount</span>
                            <span>
                              -{Math.round(checkoutDiscount).toLocaleString()}{" "}
                              PKR
                            </span>
                          </div>
                        )}

                        {totalDiscount > 0 && (
                          <div className="flex justify-between text-red-600 font-bold bg-red-50 p-2 rounded-md border border-red-100">
                            <span>Total Savings / Discount</span>
                            <span>
                              -{Math.round(totalDiscount).toLocaleString()} PKR
                            </span>
                          </div>
                        )}

                        <div className="flex justify-between text-neutral-900 font-bold text-base border-t border-neutral-300 pt-3">
                          <span>Total Invoice Value</span>
                          <span className="text-[#B8860B]">
                            {Math.round(selectedInvoice.total).toLocaleString()}{" "}
                            PKR
                          </span>
                        </div>
                      </div>
                    );
                  })()}

                  {/* Bank Transfer Details */}
                  <div className="mt-4 border border-dashed border-neutral-300 rounded-lg p-2.5 bg-neutral-50 text-[10px] space-y-1">
                    <p className="font-bold text-neutral-700 uppercase tracking-wider text-center text-[9px] border-b border-dashed border-neutral-200 pb-1 mb-1">
                      Bank Transfer Details
                    </p>
                    <div className="flex justify-between">
                      <span className="text-neutral-500">Title:</span>
                      <span className="font-semibold text-neutral-800">
                        C.M SCENTS
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-neutral-500">Bank Name:</span>
                      <span className="font-semibold text-neutral-800">
                        BankIslami
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-neutral-500">Account Number:</span>
                      <span className="font-mono font-semibold text-neutral-800">
                        103300685430190
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-neutral-500">IBAN:</span>
                      <span className="font-mono font-semibold text-neutral-800 text-[9px]">
                        PK38BKIP0103300685430190
                      </span>
                    </div>
                  </div>

                  {/* Fine Print Footer */}
                  <div className="text-center text-[10px] text-neutral-400 mt-8 pt-5 border-t border-dashed border-neutral-300 space-y-1">
                    <p className="font-semibold text-neutral-500 uppercase tracking-widest text-[9px]">
                      Thank you for shopping at C·M Scents!
                    </p>
                    <p className="font-sans italic text-neutral-600">
                      "Where luxury meets artisanal craftsmanship"
                    </p>
                    <p className="text-[9px] text-neutral-400 font-sans pt-1">
                      For feedback, custom requests, or gift box bookings,
                      please contact us on WhatsApp.
                    </p>
                  </div>
                </div>
              </div>

              {/* Modal Actions */}
              <div className="px-6 py-4 bg-white/5 border-t border-white/5 flex gap-3 justify-between">
                {onDeleteInvoice && (
                  <button
                    onClick={() => {
                      if (
                        window.confirm(
                          `Are you sure you want to delete invoice ${selectedInvoice.id}? This will remove it permanently.`,
                        )
                      ) {
                        onDeleteInvoice(selectedInvoice.id);
                        setSelectedInvoice(null);
                      }
                    }}
                    className="px-3.5 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/10 rounded-xl text-xs font-semibold cursor-pointer transition-colors flex items-center gap-1.5"
                    title="Delete this invoice permanently"
                  >
                    <Trash2 size={13} />
                    Delete
                  </button>
                )}
                <div className="flex gap-2">
                  <button
                    onClick={() => setSelectedInvoice(null)}
                    className="px-4 py-2 bg-white/5 hover:bg-white/10 text-gray-300 rounded-xl text-xs font-semibold cursor-pointer transition-colors"
                  >
                    Close Detail
                  </button>
                  <button
                    onClick={handlePrint}
                    className="px-4 py-2 bg-[#CFB050] hover:bg-[#E5C76B] text-black rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-all hover:scale-[1.01]"
                  >
                    <Printer size={13} />
                    Print Copy
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
