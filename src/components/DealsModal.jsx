import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  X,
  Plus,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  Tag,
  RefreshCw,
} from "lucide-react";
import { INITIAL_DEALS } from "../storage";

export default function DealsModal({
  isOpen,
  onClose,
  deals,
  onUpdateDeals,
  onShowToast,
}) {
  const [activeTab, setActiveTab] = useState("list"); // 'list' | 'add'
  const [editingDealId, setEditingDealId] = useState(null);

  // New deal form state
  const [name, setName] = useState("");
  const [type, setType] = useState("bundle"); // 'bundle' | 'bogo' | 'percentage' | 'fixed'
  const [bundleQty, setBundleQty] = useState("3");
  const [bundlePrice, setBundlePrice] = useState("5000");
  const [buyQty, setBuyQty] = useState("2");
  const [getFreeQty, setGetFreeQty] = useState("1");
  const [discountPct, setDiscountPct] = useState("20");
  const [discountPkr, setDiscountPkr] = useState("500");
  const [badge, setBadge] = useState("");
  const [description, setDescription] = useState("");

  if (!isOpen) return null;

  const handleToggleDeal = (dealId) => {
    const updated = deals.map((d) =>
      d.id === dealId ? { ...d, active: !d.active } : d,
    );
    onUpdateDeals(updated);
    if (onShowToast) {
      const target = deals.find((d) => d.id === dealId);
      onShowToast(
        `Deal "${target?.name}" ${!target?.active ? "activated" : "deactivated"}.`,
        "success",
      );
    }
  };

  const handleDeleteDeal = (dealId) => {
    const updated = deals.filter((d) => d.id !== dealId);
    onUpdateDeals(updated);
    if (onShowToast) onShowToast("Deal removed successfully.", "success");
  };

  const handleResetDefaults = () => {
    if (
      window.confirm(
        "Reset all promotional deals to official C.M Scents defaults?",
      )
    ) {
      onUpdateDeals(INITIAL_DEALS);
      if (onShowToast)
        onShowToast("Reset to default C.M Scents website deals.", "success");
    }
  };

  const handleSaveNewDeal = (e) => {
    e.preventDefault();
    if (!name.trim()) {
      if (onShowToast) onShowToast("Please provide a Deal title.", "error");
      return;
    }

    const newDeal = {
      id: `deal-${Date.now()}`,
      name: name.trim(),
      code: name
        .trim()
        .replace(/[^a-zA-Z0-9]/g, "")
        .toUpperCase()
        .slice(0, 8),
      type,
      active: true,
      badge: badge.trim() || name.trim(),
      description: description.trim() || `${name.trim()} promotional deal`,
      icon:
        type === "bundle"
          ? "✨"
          : type === "bogo"
            ? "🎁"
            : type === "percentage"
              ? "🏷️"
              : "🔥",
    };

    if (type === "bundle") {
      newDeal.bundleQty = parseInt(bundleQty, 10) || 3;
      newDeal.bundlePrice = parseFloat(bundlePrice) || 5000;
    } else if (type === "bogo") {
      newDeal.buyQty = parseInt(buyQty, 10) || 2;
      newDeal.getFreeQty = parseInt(getFreeQty, 10) || 1;
    } else if (type === "percentage") {
      newDeal.discountPct = parseFloat(discountPct) || 20;
    } else if (type === "fixed") {
      newDeal.discountPkr = parseFloat(discountPkr) || 500;
    }

    const updated = [newDeal, ...deals];
    onUpdateDeals(updated);
    if (onShowToast)
      onShowToast(`Deal "${newDeal.name}" added successfully!`, "success");

    // Reset form
    setName("");
    setBadge("");
    setDescription("");
    setActiveTab("list");
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 15 }}
        className="bg-[#181820] border border-white/10 rounded-2xl w-full max-w-xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]"
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-white/5 flex items-center justify-between bg-white/[0.02]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#CFB050]/15 flex items-center justify-center text-[#CFB050]">
              <Sparkles size={18} />
            </div>
            <div>
              <h3 className="font-display font-semibold text-white text-base">
                Website Deals &amp; Bundle Manager
              </h3>
              <p className="text-[11px] text-gray-400">
                Configure promotional offers active on{" "}
                <span className="text-[#CFB050]">cmscents.com</span>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white p-1.5 rounded-lg hover:bg-white/5 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Tab navigation */}
        <div className="flex items-center justify-between px-6 py-2.5 border-b border-white/5 bg-[#111116]">
          <div className="flex gap-2">
            <button
              onClick={() => setActiveTab("list")}
              className={`px-3 py-1.5 rounded-lg text-xs font-display font-medium transition-colors ${
                activeTab === "list"
                  ? "bg-[#CFB050] text-black font-semibold"
                  : "text-gray-400 hover:text-white bg-white/5"
              }`}
            >
              Active Deals ({deals.filter((d) => d.active).length} of{" "}
              {deals.length})
            </button>
            <button
              onClick={() => setActiveTab("add")}
              className={`px-3 py-1.5 rounded-lg text-xs font-display font-medium flex items-center gap-1.5 transition-colors ${
                activeTab === "add"
                  ? "bg-[#CFB050] text-black font-semibold"
                  : "text-gray-400 hover:text-white bg-white/5"
              }`}
            >
              <Plus size={13} /> Add Promotion
            </button>
          </div>

          <button
            onClick={handleResetDefaults}
            className="text-[10px] text-gray-500 hover:text-[#CFB050] flex items-center gap-1 transition-colors"
            title="Restore default website deals"
          >
            <RefreshCw size={11} /> Reset Defaults
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {activeTab === "list" ? (
            <div className="space-y-3">
              {deals.map((deal) => {
                return (
                  <div
                    key={deal.id}
                    className={`border rounded-xl p-4 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                      deal.active
                        ? "bg-white/[0.03] border-white/10 hover:border-[#CFB050]/40"
                        : "bg-white/[0.01] border-white/5 opacity-60"
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <span className="text-2xl mt-0.5">
                        {deal.icon || "🏷️"}
                      </span>
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="font-display font-semibold text-white text-sm">
                            {deal.name}
                          </h4>
                          {deal.active && (
                            <span className="text-[10px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded font-mono font-medium">
                              ACTIVE
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-gray-400 mt-0.5">
                          {deal.description}
                        </p>
                        <div className="flex items-center gap-3 mt-2 text-[11px] font-mono text-[#CFB050]">
                          {deal.type === "bundle" && (
                            <span>
                              📦 Bundle: Any {deal.bundleQty} bottles for PKR{" "}
                              {deal.bundlePrice?.toLocaleString()}
                            </span>
                          )}
                          {deal.type === "bogo" && (
                            <span>
                              🎁 Buy {deal.buyQty} Get {deal.getFreeQty} Free
                            </span>
                          )}
                          {deal.type === "percentage" && (
                            <span>
                              🏷️ {deal.discountPct}% Flat Storewide Discount
                            </span>
                          )}
                          {deal.type === "fixed" && (
                            <span>
                              💰 Flat PKR {deal.discountPkr?.toLocaleString()}{" "}
                              Off
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 self-end sm:self-center">
                      <button
                        onClick={() => handleToggleDeal(deal.id)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-mono font-medium transition-colors border ${
                          deal.active
                            ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/20"
                            : "bg-white/5 text-gray-400 border-white/10 hover:text-white"
                        }`}
                      >
                        {deal.active ? "Disable" : "Enable"}
                      </button>

                      {/* Don't delete the primary 3 for 5000 bundle, but allow deleting others */}
                      {deal.id !== "bundle-3-for-5000" && (
                        <button
                          onClick={() => handleDeleteDeal(deal.id)}
                          className="p-1.5 text-gray-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                          title="Delete deal"
                        >
                          <Trash2 size={14} />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <form onSubmit={handleSaveNewDeal} className="space-y-4">
              <div>
                <label className="block text-xs font-mono text-gray-400 uppercase tracking-wider mb-1.5">
                  Deal Title / Campaign Name
                </label>
                <input
                  type="text"
                  placeholder="e.g. 3 for Rs. 5,000 Bundle or Weekend Special"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-[#111116] border border-white/10 focus:border-[#CFB050] rounded-xl px-3.5 py-2.5 text-white text-xs outline-none"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-mono text-gray-400 uppercase tracking-wider mb-1.5">
                    Deal Promotion Type
                  </label>
                  <select
                    value={type}
                    onChange={(e) => setType(e.target.value)}
                    className="w-full bg-[#111116] border border-white/10 focus:border-[#CFB050] rounded-xl px-3 py-2 text-white text-xs outline-none"
                  >
                    <option value="bundle">
                      Bundle (X items for Fixed PKR)
                    </option>
                    <option value="bogo">Buy X Get Y Free (BOGO)</option>
                    <option value="percentage">Percentage Discount (%)</option>
                    <option value="fixed">Fixed PKR Amount Off</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-mono text-gray-400 uppercase tracking-wider mb-1.5">
                    Badge Label
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. 3 for Rs. 5,000"
                    value={badge}
                    onChange={(e) => setBadge(e.target.value)}
                    className="w-full bg-[#111116] border border-white/10 focus:border-[#CFB050] rounded-xl px-3.5 py-2 text-white text-xs outline-none"
                  />
                </div>
              </div>

              {/* Dynamic inputs based on type */}
              {type === "bundle" && (
                <div className="grid grid-cols-2 gap-3 bg-[#111116] p-3 rounded-xl border border-white/5">
                  <div>
                    <label className="block text-[11px] font-mono text-gray-400 uppercase mb-1">
                      Number of Bottles in Bundle
                    </label>
                    <input
                      type="number"
                      min={1}
                      max={20}
                      value={bundleQty}
                      onChange={(e) => setBundleQty(e.target.value)}
                      className="w-full bg-[#181820] border border-white/10 focus:border-[#CFB050] rounded-lg px-3 py-2 text-white font-mono text-xs outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-mono text-gray-400 uppercase mb-1">
                      Bundle Price (PKR)
                    </label>
                    <input
                      type="number"
                      min={0}
                      value={bundlePrice}
                      onChange={(e) => setBundlePrice(e.target.value)}
                      className="w-full bg-[#181820] border border-white/10 focus:border-[#CFB050] rounded-lg px-3 py-2 text-white font-mono text-xs outline-none"
                    />
                  </div>
                </div>
              )}

              {type === "bogo" && (
                <div className="grid grid-cols-2 gap-3 bg-[#111116] p-3 rounded-xl border border-white/5">
                  <div>
                    <label className="block text-[11px] font-mono text-gray-400 uppercase mb-1">
                      Buy Quantity
                    </label>
                    <input
                      type="number"
                      min={1}
                      value={buyQty}
                      onChange={(e) => setBuyQty(e.target.value)}
                      className="w-full bg-[#181820] border border-white/10 focus:border-[#CFB050] rounded-lg px-3 py-2 text-white font-mono text-xs outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-mono text-gray-400 uppercase mb-1">
                      Get Free Quantity
                    </label>
                    <input
                      type="number"
                      min={1}
                      value={getFreeQty}
                      onChange={(e) => setGetFreeQty(e.target.value)}
                      className="w-full bg-[#181820] border border-white/10 focus:border-[#CFB050] rounded-lg px-3 py-2 text-white font-mono text-xs outline-none"
                    />
                  </div>
                </div>
              )}

              {type === "percentage" && (
                <div className="bg-[#111116] p-3 rounded-xl border border-white/5">
                  <label className="block text-[11px] font-mono text-gray-400 uppercase mb-1">
                    Discount Percentage (%)
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={100}
                    value={discountPct}
                    onChange={(e) => setDiscountPct(e.target.value)}
                    className="w-full bg-[#181820] border border-white/10 focus:border-[#CFB050] rounded-lg px-3 py-2 text-white font-mono text-xs outline-none"
                  />
                </div>
              )}

              {type === "fixed" && (
                <div className="bg-[#111116] p-3 rounded-xl border border-white/5">
                  <label className="block text-[11px] font-mono text-gray-400 uppercase mb-1">
                    Flat Discount Amount (PKR)
                  </label>
                  <input
                    type="number"
                    min={1}
                    value={discountPkr}
                    onChange={(e) => setDiscountPkr(e.target.value)}
                    className="w-full bg-[#181820] border border-white/10 focus:border-[#CFB050] rounded-lg px-3 py-2 text-white font-mono text-xs outline-none"
                  />
                </div>
              )}

              <div>
                <label className="block text-xs font-mono text-gray-400 uppercase tracking-wider mb-1.5">
                  Description / Terms
                </label>
                <textarea
                  rows={2}
                  placeholder="e.g. Any 3 signature fragrances for PKR 5,000"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full bg-[#111116] border border-white/10 focus:border-[#CFB050] rounded-xl px-3.5 py-2.5 text-white text-xs outline-none resize-none"
                />
              </div>

              <div className="flex gap-2 justify-end pt-2">
                <button
                  type="button"
                  onClick={() => setActiveTab("list")}
                  className="px-4 py-2 bg-white/5 hover:bg-white/10 text-gray-300 rounded-xl text-xs font-medium transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-[#CFB050] hover:bg-[#E5C76B] text-black font-semibold rounded-xl text-xs transition-colors"
                >
                  Save Promotion
                </button>
              </div>
            </form>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-white/5 bg-white/[0.01] flex items-center justify-between text-xs">
          <span className="text-gray-500 text-[11px]">
            Changes automatically sync to Firestore database
          </span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-[#CFB050] text-black font-semibold rounded-xl text-xs hover:bg-[#E5C76B] transition-colors"
          >
            Done
          </button>
        </div>
      </motion.div>
    </div>
  );
}
