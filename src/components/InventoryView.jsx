import React, { useState, useMemo, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Plus,
  Search,
  Edit2,
  AlertTriangle,
  Check,
  Package,
  Layers,
  CircleDollarSign,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

export default function InventoryView({
  products,
  onUpdateProducts,
  nextProd,
  onUpdateNextProd,
}) {
  const [search, setSearch] = useState("");
  const [editingProduct, setEditingProduct] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  // Reset pagination to first page on search or products length change
  useEffect(() => {
    setCurrentPage(1);
  }, [search, products.length]);

  // Form states for add/edit modal
  const [formName, setFormName] = useState("");
  const [formCat, setFormCat] = useState("EDP");
  const [formSize, setFormSize] = useState("");
  const [formIcon, setFormIcon] = useState("🌑");
  const [formCost, setFormCost] = useState("");
  const [formPrice, setFormPrice] = useState("");
  const [formDiscountPrice, setFormDiscountPrice] = useState("");
  const [formStock, setFormStock] = useState("");

  // Search filter
  const filteredProducts = useMemo(() => {
    return products.filter(
      (p) =>
        p.name.toLowerCase().includes(search.toLowerCase()) ||
        p.cat.toLowerCase().includes(search.toLowerCase()),
    );
  }, [products, search]);

  // Pagination calculations
  const totalItems = filteredProducts.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage) || 1;
  const displayPage = Math.min(Math.max(1, currentPage), totalPages);

  const paginatedProducts = useMemo(() => {
    const startIndex = (displayPage - 1) * itemsPerPage;
    return filteredProducts.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredProducts, displayPage, itemsPerPage]);

  // Inventory stats
  const totalRetailValue = useMemo(() => {
    return products.reduce((sum, p) => {
      const activePrice =
        p.discountPrice && p.discountPrice > 0 ? p.discountPrice : p.price;
      return sum + activePrice * p.stock;
    }, 0);
  }, [products]);

  const totalCostValue = useMemo(() => {
    return products.reduce((sum, p) => sum + p.cost * p.stock, 0);
  }, [products]);

  const lowStockCount = useMemo(() => {
    return products.filter((p) => p.stock > 0 && p.stock < 10).length;
  }, [products]);

  const outOfStockCount = useMemo(() => {
    return products.filter((p) => p.stock === 0).length;
  }, [products]);

  // Open modal for adding new product
  const handleOpenAdd = () => {
    setEditingProduct(null);
    setFormName("");
    setFormCat("EDP");
    setFormSize("50ml");
    setFormIcon("🌑");
    setFormCost("");
    setFormPrice("");
    setFormDiscountPrice("");
    setFormStock("");
    setIsModalOpen(true);
  };

  // Open modal for editing existing product
  const handleOpenEdit = (p) => {
    setEditingProduct(p);
    setFormName(p.name);
    setFormCat(p.cat);
    setFormSize(p.size);
    setFormIcon(p.icon);
    setFormCost(p.cost);
    setFormPrice(p.price);
    setFormDiscountPrice(
      p.discountPrice !== undefined && p.discountPrice > 0
        ? p.discountPrice
        : "",
    );
    setFormStock(p.stock);
    setIsModalOpen(true);
  };

  const handleSave = (e) => {
    e.preventDefault();
    if (!formName.trim()) return;

    const data = {
      name: formName.trim(),
      cat: formCat,
      size: formSize.trim() || "50ml",
      icon: formIcon.trim() || "🌸",
      cost: Number(formCost) || 0,
      price: Number(formPrice) || 0,
      discountPrice: formDiscountPrice === "" ? 0 : Number(formDiscountPrice),
      stock: Number(formStock) || 0,
    };

    if (editingProduct) {
      // Edit existing
      const updated = products.map((p) =>
        p.id === editingProduct.id ? { ...p, ...data } : p,
      );
      onUpdateProducts(updated);
    } else {
      // Add new
      const newP = {
        id: nextProd,
        ...data,
      };
      onUpdateProducts([...products, newP]);
      onUpdateNextProd(nextProd + 1);
    }
    setIsModalOpen(false);
  };

  const formatPrice = (num) => `PKR ${Math.round(num).toLocaleString()}`;

  return (
    <div className="flex-1 p-4 md:p-6 bg-[#0A0A0D] flex flex-col gap-6">
      {/* View Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-display font-bold text-white tracking-wide">
            Fragrance Inventory
          </h2>
          <p className="text-xs text-gray-500 mt-1">
            Real-time stock valuation and level tracking
          </p>
        </div>
        <button
          onClick={handleOpenAdd}
          className="bg-[#CFB050] hover:bg-[#E5C76B] text-black px-4 py-2.5 rounded-xl text-xs font-semibold font-display flex items-center justify-center gap-1.5 cursor-pointer shadow-lg shadow-[#CFB050]/5 transition-all hover:scale-[1.01] active:scale-[0.99] self-start sm:self-auto"
        >
          <Plus size={15} />
          Add Fragrance
        </button>
      </div>

      {/* Automated Restock Alert Banner */}
      {(lowStockCount > 0 || outOfStockCount > 0) && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-amber-500/[0.03] border border-amber-500/15 rounded-2xl p-4 flex flex-col gap-3"
        >
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-lg bg-amber-500/10 flex items-center justify-center text-amber-500 shrink-0 mt-0.5">
              <AlertTriangle size={16} className="animate-pulse" />
            </div>
            <div className="flex-1">
              <h4 className="text-xs font-semibold text-amber-400 font-display flex items-center gap-1.5">
                Automated System Alert: Stock Level Warning
              </h4>
              <p className="text-[11px] text-gray-400 mt-0.5">
                There are{" "}
                <span className="text-amber-400 font-semibold">
                  {lowStockCount}
                </span>{" "}
                items running low (&lt; 10 units) and{" "}
                <span className="text-red-400 font-semibold">
                  {outOfStockCount}
                </span>{" "}
                items out of stock. Restock them promptly to prevent checkout
                disruption.
              </p>
            </div>
          </div>
          <div className="flex flex-wrap gap-1.5 mt-1 border-t border-white/5 pt-3 items-center">
            <span className="text-[9px] font-mono text-gray-500 uppercase tracking-wider mr-1.5">
              Quick restock:
            </span>
            {products
              .filter((p) => p.stock < 10)
              .map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => handleOpenEdit(p)}
                  className={`px-2 py-1 rounded-lg text-[10px] font-mono font-medium cursor-pointer transition-all flex items-center gap-1 ${
                    p.stock === 0
                      ? "bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/10 hover:border-red-500/20 animate-pulse"
                      : "bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/10 hover:border-amber-500/20"
                  }`}
                  title={`Click to edit and restock ${p.name}`}
                >
                  <span className="text-xs">{p.icon}</span>
                  <span>{p.name}</span>
                  <span className="font-bold">({p.stock} units)</span>
                </button>
              ))}
          </div>
        </motion.div>
      )}

      {/* Metrics Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        <div className="bg-[#111116] border border-white/5 rounded-2xl p-4 flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-gray-400">
            <Layers size={18} />
          </div>
          <div>
            <span className="text-[10px] text-gray-500 font-mono block uppercase tracking-wider">
              Total Types
            </span>
            <span className="text-lg font-bold text-white font-mono mt-0.5 block">
              {products.length}
            </span>
          </div>
        </div>

        <div className="bg-[#111116] border border-white/5 rounded-2xl p-4 flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-[#CFB050]/10 flex items-center justify-center text-[#CFB050]">
            <CircleDollarSign size={18} />
          </div>
          <div>
            <span className="text-[10px] text-gray-500 font-mono block uppercase tracking-wider">
              Retail Value
            </span>
            <span className="text-lg font-bold text-[#CFB050] font-mono mt-0.5 block">
              {formatPrice(totalRetailValue)}
            </span>
          </div>
        </div>

        <div className="bg-[#111116] border border-white/5 rounded-2xl p-4 flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-gray-400">
            <Package size={18} />
          </div>
          <div>
            <span className="text-[10px] text-gray-500 font-mono block uppercase tracking-wider">
              Cost Value
            </span>
            <span className="text-lg font-bold text-gray-300 font-mono mt-0.5 block">
              {formatPrice(totalCostValue)}
            </span>
          </div>
        </div>

        <div className="bg-[#111116] border border-white/5 rounded-2xl p-4 flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-500">
            <AlertTriangle size={18} />
          </div>
          <div>
            <span className="text-[10px] text-gray-500 font-mono block uppercase tracking-wider">
              Low / Out Stock
            </span>
            <span className="text-lg font-bold font-mono mt-0.5 block text-white">
              <span className="text-amber-500">{lowStockCount}</span>{" "}
              <span className="text-gray-600">/</span>{" "}
              <span className="text-red-500">{outOfStockCount}</span>
            </span>
          </div>
        </div>
      </div>

      {/* Main Table list */}
      <div className="bg-[#111116] border border-white/5 rounded-2xl flex flex-col overflow-hidden">
        {/* Search bar inside view */}
        <div className="p-4 border-b border-white/5 flex flex-col sm:flex-row gap-3 justify-between items-center bg-[#15151c]">
          <div className="relative w-full sm:max-w-xs">
            <Search
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500"
              size={14}
            />
            <input
              type="text"
              placeholder="Filter inventory by name..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-[#181820] border border-white/5 focus:border-[#CFB050] rounded-xl py-1.5 pl-9 pr-4 text-white placeholder-gray-600 text-xs outline-none transition-all"
            />
          </div>
          <span className="text-xs text-gray-500 font-mono whitespace-nowrap">
            Showing {filteredProducts.length} items
          </span>
        </div>

        {/* Table Body */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs min-w-[750px] relative">
            <thead className="sticky top-0 bg-[#111116] z-10 border-b border-white/5 shadow-[0_1px_0_0_rgba(255,255,255,0.05)]">
              <tr>
                <th className="p-4 font-display font-medium text-gray-400 text-[11px] uppercase tracking-wider w-[24%]">
                  Product Details
                </th>
                <th className="p-4 font-display font-medium text-gray-400 text-[11px] uppercase tracking-wider w-[10%]">
                  Category
                </th>
                <th className="p-4 font-display font-medium text-gray-400 text-[11px] uppercase tracking-wider w-[13%]">
                  Manufacturing Cost
                </th>
                <th className="p-4 font-display font-medium text-gray-400 text-[11px] uppercase tracking-wider w-[13%]">
                  Retail Price
                </th>
                <th className="p-4 font-display font-medium text-gray-400 text-[11px] uppercase tracking-wider w-[13%]">
                  Discount Price
                </th>
                <th className="p-4 font-display font-medium text-gray-400 text-[11px] uppercase tracking-wider w-[8%]">
                  Stock
                </th>
                <th className="p-4 font-display font-medium text-gray-400 text-[11px] uppercase tracking-wider w-[11%]">
                  Retail Value
                </th>
                <th className="p-4 font-display font-medium text-gray-400 text-[11px] uppercase tracking-wider w-[6%]">
                  Status
                </th>
                <th className="p-4 font-display font-medium text-gray-400 text-[11px] uppercase tracking-wider w-[2%] text-right">
                  Action
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {paginatedProducts.length > 0 ? (
                paginatedProducts.map((p) => {
                  const isLow = p.stock > 0 && p.stock < 10;
                  const isOut = p.stock === 0;
                  const hasDiscount =
                    p.discountPrice !== undefined && p.discountPrice > 0;
                  const activePrice = hasDiscount ? p.discountPrice : p.price;

                  return (
                    <tr
                      key={p.id}
                      className="hover:bg-white/[0.01] transition-colors"
                    >
                      <td className="p-4 flex items-center gap-3">
                        <span className="text-2xl bg-white/5 w-10 h-10 rounded-xl flex items-center justify-center">
                          {p.icon || "🌸"}
                        </span>
                        <div>
                          <span className="font-display font-semibold text-white block text-sm">
                            {p.name}
                          </span>
                          <span className="text-[10px] text-gray-500 font-mono mt-0.5 block">
                            Size/Notes: {p.size}
                          </span>
                        </div>
                      </td>
                      <td className="p-4">
                        <span className="px-2.5 py-1 bg-white/5 border border-white/5 rounded-full font-semibold font-mono text-[10px] text-gray-300">
                          {p.cat}
                        </span>
                      </td>
                      <td className="p-4 font-mono text-gray-300 font-medium">
                        {formatPrice(p.cost)}
                      </td>
                      <td className="p-4 font-mono text-[#CFB050] font-semibold">
                        {formatPrice(p.price)}
                      </td>
                      <td className="p-4 font-mono text-emerald-400 font-semibold">
                        {hasDiscount ? (
                          formatPrice(p.discountPrice)
                        ) : (
                          <span className="text-gray-600">—</span>
                        )}
                      </td>
                      <td
                        className={`p-4 font-mono font-bold text-sm ${isOut ? "text-red-400" : isLow ? "text-amber-400" : "text-white"}`}
                      >
                        <div className="flex items-center gap-1.5">
                          {isOut && (
                            <AlertTriangle size={12} className="text-red-400" />
                          )}
                          {isLow && (
                            <AlertTriangle
                              size={12}
                              className="text-amber-400 animate-pulse"
                            />
                          )}
                          <span>{p.stock}</span>
                        </div>
                      </td>
                      <td className="p-4 font-mono text-[#CFB050] font-semibold">
                        {formatPrice(activePrice * p.stock)}
                      </td>
                      <td className="p-4">
                        <span
                          className={`px-2 py-0.5 rounded-full font-semibold text-[10px] font-mono inline-block ${
                            isOut
                              ? "bg-red-500/10 text-red-400"
                              : isLow
                                ? "bg-amber-500/10 text-amber-400"
                                : "bg-emerald-500/10 text-emerald-400"
                          }`}
                        >
                          {isOut ? "Out" : isLow ? "Low" : "OK"}
                        </span>
                      </td>
                      <td className="p-4 text-right">
                        <button
                          onClick={() => handleOpenEdit(p)}
                          className="p-1.5 text-gray-400 hover:text-[#CFB050] rounded-lg hover:bg-white/5 transition-all cursor-pointer inline-flex"
                          title="Edit Product"
                        >
                          <Edit2 size={13} />
                        </button>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={9} className="text-center py-12 text-gray-500">
                    No products matching search query.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        <div className="p-4 border-t border-white/5 bg-[#15151c] flex flex-col sm:flex-row gap-4 justify-between items-center text-xs">
          <div className="text-gray-500 font-mono text-[11px]">
            Showing{" "}
            <span className="text-white font-semibold">
              {totalItems === 0 ? 0 : (displayPage - 1) * itemsPerPage + 1}
            </span>{" "}
            to{" "}
            <span className="text-white font-semibold">
              {Math.min(displayPage * itemsPerPage, totalItems)}
            </span>{" "}
            of <span className="text-white font-semibold">{totalItems}</span>{" "}
            items
          </div>

          <div className="flex flex-wrap items-center gap-4">
            {/* Items Per Page Selector */}
            <div className="flex items-center gap-2 text-gray-500 font-mono text-[11px]">
              <span>Rows per page:</span>
              <select
                value={itemsPerPage}
                onChange={(e) => {
                  setItemsPerPage(Number(e.target.value));
                  setCurrentPage(1);
                }}
                className="bg-[#181820] border border-white/5 focus:border-[#CFB050] rounded-lg px-2 py-1 text-white outline-none cursor-pointer text-xs font-semibold"
              >
                <option value={5}>5</option>
                <option value={10}>10</option>
                <option value={25}>25</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
              </select>
            </div>

            <div className="flex items-center gap-2">
              <button
                disabled={displayPage === 1}
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                className="p-2 border border-white/5 rounded-xl bg-[#181820] text-gray-400 hover:text-[#CFB050] hover:border-[#CFB050]/20 disabled:opacity-40 disabled:hover:text-gray-400 disabled:hover:border-white/5 disabled:cursor-not-allowed transition-all cursor-pointer inline-flex items-center justify-center"
                title="Previous Page"
              >
                <ChevronLeft size={14} />
              </button>

              <span className="text-gray-400 font-mono font-medium px-1 text-[11px]">
                Page <span className="text-white font-bold">{displayPage}</span>{" "}
                of <span className="text-white font-bold">{totalPages}</span>
              </span>

              <button
                disabled={displayPage === totalPages}
                onClick={() =>
                  setCurrentPage((p) => Math.min(totalPages, p + 1))
                }
                className="p-2 border border-white/5 rounded-xl bg-[#181820] text-gray-400 hover:text-[#CFB050] hover:border-[#CFB050]/20 disabled:opacity-40 disabled:hover:text-gray-400 disabled:hover:border-white/5 disabled:cursor-not-allowed transition-all cursor-pointer inline-flex items-center justify-center"
                title="Next Page"
              >
                <ChevronRight size={14} />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Add / Edit Product Overlay Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-y-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="bg-[#181820] border border-white/10 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl"
            >
              {/* Modal Header */}
              <div className="px-6 py-4 border-b border-white/5 flex items-center justify-between">
                <h3 className="font-display font-bold text-white text-base">
                  {editingProduct ? `Edit Fragrance` : `Add New Fragrance`}
                </h3>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="text-gray-400 hover:text-white text-xs cursor-pointer border border-white/5 hover:bg-white/5 px-2.5 py-1 rounded-lg transition-all"
                >
                  Close
                </button>
              </div>

              {/* Form Body */}
              <form onSubmit={handleSave}>
                <div className="p-6 space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[10px] text-gray-500 font-mono uppercase tracking-wider font-semibold">
                        Fragrance Name
                      </label>
                      <input
                        type="text"
                        required
                        value={formName}
                        onChange={(e) => setFormName(e.target.value)}
                        placeholder="e.g. Tempest Noir"
                        className="bg-[#111116] border border-white/5 focus:border-[#CFB050] rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-gray-600 outline-none transition-all"
                      />
                    </div>

                    <div className="flex flex-col gap-1.5">
                      <label className="text-[10px] text-gray-500 font-mono uppercase tracking-wider font-semibold">
                        Sillage Category
                      </label>
                      <select
                        value={formCat}
                        onChange={(e) => setFormCat(e.target.value)}
                        className="bg-[#111116] border border-white/5 focus:border-[#CFB050] rounded-xl px-3 py-2.5 text-xs text-white outline-none cursor-pointer"
                      >
                        <option value="EDP">EDP (Eau de Parfum)</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[10px] text-gray-500 font-mono uppercase tracking-wider font-semibold">
                        Bottle Size / Notes
                      </label>
                      <input
                        type="text"
                        value={formSize}
                        onChange={(e) => setFormSize(e.target.value)}
                        placeholder="e.g. 50ml, 100ml"
                        className="bg-[#111116] border border-white/5 focus:border-[#CFB050] rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-gray-600 outline-none transition-all"
                      />
                    </div>

                    <div className="flex flex-col gap-1.5">
                      <label className="text-[10px] text-gray-500 font-mono uppercase tracking-wider font-semibold">
                        Visual Emoji Icon
                      </label>
                      <input
                        type="text"
                        value={formIcon}
                        onChange={(e) => setFormIcon(e.target.value)}
                        placeholder="🌑, 💼, 🌹, 👑"
                        maxLength={4}
                        className="bg-[#111116] border border-white/5 focus:border-[#CFB050] rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-gray-600 outline-none text-center transition-all"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-3">
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[10px] text-gray-500 font-mono uppercase tracking-wider font-semibold">
                        Cost (Mfg) (PKR)
                      </label>
                      <input
                        type="number"
                        required
                        min={0}
                        value={formCost}
                        onChange={(e) =>
                          setFormCost(
                            e.target.value === "" ? "" : Number(e.target.value),
                          )
                        }
                        placeholder="e.g. 1800"
                        className="bg-[#111116] border border-white/5 focus:border-[#CFB050] rounded-xl px-2.5 py-2.5 text-xs text-white placeholder-gray-600 outline-none font-mono transition-all"
                      />
                    </div>

                    <div className="flex flex-col gap-1.5">
                      <label className="text-[10px] text-gray-500 font-mono uppercase tracking-wider font-semibold">
                        Retail Price (PKR)
                      </label>
                      <input
                        type="number"
                        required
                        min={0}
                        value={formPrice}
                        onChange={(e) =>
                          setFormPrice(
                            e.target.value === "" ? "" : Number(e.target.value),
                          )
                        }
                        placeholder="e.g. 3500"
                        className="bg-[#111116] border border-white/5 focus:border-[#CFB050] rounded-xl px-2.5 py-2.5 text-xs text-white placeholder-gray-600 outline-none font-mono transition-all"
                      />
                    </div>

                    <div className="flex flex-col gap-1.5">
                      <label className="text-[10px] text-gray-500 font-mono uppercase tracking-wider font-semibold">
                        Discount Price (PKR)
                      </label>
                      <input
                        type="number"
                        min={0}
                        value={formDiscountPrice}
                        onChange={(e) =>
                          setFormDiscountPrice(
                            e.target.value === "" ? "" : Number(e.target.value),
                          )
                        }
                        placeholder="Optional"
                        className="bg-[#111116] border border-white/5 focus:border-[#CFB050] rounded-xl px-2.5 py-2.5 text-xs text-white placeholder-gray-600 outline-none font-mono transition-all"
                      />
                    </div>
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] text-gray-500 font-mono uppercase tracking-wider font-semibold">
                      In-Stock Inventory Quantity
                    </label>
                    <input
                      type="number"
                      required
                      min={0}
                      value={formStock}
                      onChange={(e) =>
                        setFormStock(
                          e.target.value === "" ? "" : Number(e.target.value),
                        )
                      }
                      placeholder="Current available units count"
                      className="bg-[#111116] border border-white/5 focus:border-[#CFB050] rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-gray-600 outline-none font-mono transition-all"
                    />
                  </div>
                </div>

                {/* Footer buttons */}
                <div className="px-6 py-4 bg-white/5 border-t border-white/5 flex gap-3 justify-end">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-4 py-2.5 bg-white/5 hover:bg-white/10 text-gray-300 rounded-xl text-xs font-semibold cursor-pointer transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2.5 bg-[#CFB050] hover:bg-[#E5C76B] text-black rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-lg shadow-[#CFB050]/5 transition-all"
                  >
                    <Check size={14} />
                    {editingProduct ? "Save Changes" : "Add Product"}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
