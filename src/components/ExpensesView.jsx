import React, { useState, useMemo } from "react";
import {
  Plus,
  Trash2,
  BadgeCent,
  FileText,
  LayoutList,
  Calendar,
} from "lucide-react";

export default function ExpensesView({ expenses, onUpdateExpenses }) {
  const [desc, setDesc] = useState("");
  const [cat, setCat] = useState("Packaging");
  const [amt, setAmt] = useState("");
  const [selectedMonthFilter, setSelectedMonthFilter] = useState("All");

  const expenseCategories = [
    "Rent",
    "Packaging",
    "Raw materials",
    "Salaries",
    "Marketing",
    "Utilities",
    "Shipping",
    "Other",
  ];

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
    expenses.forEach((e) => {
      const parsed = parseMonthYear(e.date);
      monthMap[parsed.label] = parsed.sortKey;
    });
    return Object.keys(monthMap).sort((a, b) =>
      monthMap[b].localeCompare(monthMap[a]),
    );
  }, [expenses]);

  // Filter based on selected month
  const filteredExpenses = useMemo(() => {
    if (selectedMonthFilter === "All") return expenses;
    return expenses.filter(
      (e) => parseMonthYear(e.date).label === selectedMonthFilter,
    );
  }, [expenses, selectedMonthFilter]);

  // Calculations based on month selection filter
  const totalExpenses = useMemo(() => {
    return filteredExpenses.reduce((sum, e) => sum + e.amt, 0);
  }, [filteredExpenses]);

  const categoryBreakdown = useMemo(() => {
    const map = {};
    filteredExpenses.forEach((e) => {
      map[e.cat] = (map[e.cat] || 0) + e.amt;
    });
    return Object.entries(map).sort((a, b) => b[1] - a[1]);
  }, [filteredExpenses]);

  const topCategory = useMemo(() => {
    if (categoryBreakdown.length === 0) return null;
    return {
      name: categoryBreakdown[0][0],
      amount: categoryBreakdown[0][1],
    };
  }, [categoryBreakdown]);

  // Group filtered list for visual display
  const groupedExpenses = useMemo(() => {
    const groups = {};
    filteredExpenses.forEach((e) => {
      const parsed = parseMonthYear(e.date);
      if (!groups[parsed.label]) {
        groups[parsed.label] = [];
      }
      groups[parsed.label].push(e);
    });

    const sortedGroupKeys = Object.keys(groups).sort((a, b) => {
      const keyA = parseMonthYear(groups[a][0].date).sortKey;
      const keyB = parseMonthYear(groups[b][0].date).sortKey;
      return keyB.localeCompare(keyA);
    });

    return { groups, sortedGroupKeys };
  }, [filteredExpenses]);

  const handleAddExpense = (e) => {
    e.preventDefault();
    if (!desc.trim() || !amt) return;

    const todayStr = new Date().toLocaleDateString("en-PK", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });

    const newExp = {
      id: Date.now(),
      date: todayStr,
      desc: desc.trim(),
      cat,
      amt: Number(amt),
    };

    onUpdateExpenses([newExp, ...expenses]);
    setDesc("");
    setAmt("");
  };

  const handleDeleteExpense = (id) => {
    onUpdateExpenses(expenses.filter((e) => e.id !== id));
  };

  const formatPrice = (num) => `PKR ${Math.round(num).toLocaleString()}`;

  return (
    <div className="flex-1 p-4 md:p-6 bg-[#0A0A0D] flex flex-col gap-6">
      {/* View Header */}
      <div>
        <h2 className="text-xl font-display font-bold text-white tracking-wide">
          Business Operating Expenses
        </h2>
        <p className="text-xs text-gray-500 mt-1">
          Monitor raw material purchases, rents, packaging material, and utility
          fees
        </p>
      </div>

      {/* Main Grid: Form Left, Stats Right */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Expense logger form */}
        <div className="lg:col-span-2 bg-[#111116] border border-white/5 rounded-2xl p-5">
          <h3 className="font-display font-semibold text-white text-sm mb-4">
            Log New Expense Transaction
          </h3>
          <form onSubmit={handleAddExpense} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-12 gap-4">
              <div className="flex flex-col gap-1.5 sm:col-span-5">
                <label className="text-[10px] text-gray-500 font-mono uppercase tracking-wider font-semibold">
                  Cost Description / Payee
                </label>
                <input
                  type="text"
                  required
                  value={desc}
                  onChange={(e) => setDesc(e.target.value)}
                  placeholder="e.g. Premium packaging bottles import"
                  className="bg-[#181820] border border-white/5 focus:border-[#CFB050] rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-gray-600 outline-none transition-all w-full"
                />
              </div>

              <div className="flex flex-col gap-1.5 sm:col-span-3">
                <label className="text-[10px] text-gray-500 font-mono uppercase tracking-wider font-semibold">
                  Category
                </label>
                <select
                  value={cat}
                  onChange={(e) => setCat(e.target.value)}
                  className="bg-[#181820] border border-white/5 focus:border-[#CFB050] rounded-xl px-3.5 py-2.5 text-xs text-white outline-none cursor-pointer w-full"
                >
                  {expenseCategories.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex flex-col gap-1.5 sm:col-span-4">
                <label className="text-[10px] text-gray-500 font-mono uppercase tracking-wider font-semibold">
                  Cost Price (PKR)
                </label>
                <div className="flex gap-2 w-full">
                  <input
                    type="number"
                    required
                    min={1}
                    value={amt}
                    onChange={(e) =>
                      setAmt(
                        e.target.value === "" ? "" : Number(e.target.value),
                      )
                    }
                    placeholder="0"
                    className="bg-[#181820] border border-white/5 focus:border-[#CFB050] rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-gray-600 outline-none font-mono transition-all flex-1"
                  />
                  <button
                    type="submit"
                    className="bg-[#CFB050] hover:bg-[#E5C76B] text-black px-4 rounded-xl text-xs font-bold font-display flex items-center justify-center gap-1.5 cursor-pointer transition-colors shrink-0 shadow-lg shadow-[#CFB050]/5"
                  >
                    <Plus size={14} />
                    Log Expense
                  </button>
                </div>
              </div>
            </div>
          </form>
        </div>

        {/* Operational Stats panel */}
        <div className="grid grid-cols-2 lg:grid-cols-1 gap-3.5">
          <div className="bg-[#111116] border border-white/5 rounded-2xl p-4 flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-red-500/10 flex items-center justify-center text-red-400">
              <BadgeCent size={18} />
            </div>
            <div>
              <span className="text-[10px] text-gray-500 font-mono block uppercase tracking-wider">
                Total Expenses
              </span>
              <span className="text-base font-bold text-red-400 font-mono mt-0.5 block">
                {formatPrice(totalExpenses)}
              </span>
            </div>
          </div>

          <div className="bg-[#111116] border border-white/5 rounded-2xl p-4 flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-gray-400">
              <LayoutList size={18} />
            </div>
            <div>
              <span className="text-[10px] text-gray-500 font-mono block uppercase tracking-wider">
                Logged Transactions
              </span>
              <span className="text-base font-bold text-white font-mono mt-0.5 block">
                {expenses.length} entries
              </span>
            </div>
          </div>

          <div className="bg-[#111116] border border-white/5 rounded-2xl p-4 flex items-center gap-3.5 lg:col-span-full">
            <div className="w-10 h-10 rounded-xl bg-[#CFB050]/10 flex items-center justify-center text-[#CFB050]">
              <FileText size={18} />
            </div>
            <div className="min-w-0 flex-1">
              <span className="text-[10px] text-gray-500 font-mono block uppercase tracking-wider">
                Top Spending Head
              </span>
              <span className="text-sm font-semibold text-white truncate block mt-0.5">
                {topCategory ? `${topCategory.name}` : "—"}
              </span>
              {topCategory && (
                <span className="text-[10px] text-gray-400 font-mono block mt-0.5">
                  Accumulated cost: {formatPrice(topCategory.amount)}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Expenses History Table */}
      <div className="bg-[#111116] border border-white/5 rounded-2xl flex flex-col overflow-hidden">
        <div className="p-4 border-b border-white/5 bg-[#15151c] flex flex-col sm:flex-row gap-3 sm:items-center justify-between">
          <div className="flex flex-col">
            <span className="text-xs font-display font-bold text-white tracking-wide">
              Detailed Cost Ledger
            </span>
            <span className="text-[10px] text-gray-500 font-mono mt-0.5">
              {filteredExpenses.length} of {expenses.length} records shown
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-gray-500 font-mono uppercase font-semibold">
              Month:
            </span>
            <select
              value={selectedMonthFilter}
              onChange={(e) => setSelectedMonthFilter(e.target.value)}
              className="bg-[#181820] border border-white/5 focus:border-[#CFB050] rounded-xl px-2.5 py-1 text-[11px] text-white outline-none cursor-pointer transition-colors"
            >
              <option value="All">All Months</option>
              {sortedMonths.map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs min-w-[600px]">
            <thead>
              <tr className="border-b border-white/5 bg-white/[0.02]">
                <th className="p-4 font-display font-medium text-gray-400 text-[11px] uppercase tracking-wider w-[18%]">
                  Date
                </th>
                <th className="p-4 font-display font-medium text-gray-400 text-[11px] uppercase tracking-wider w-[38%]">
                  Cost Description / Supplier
                </th>
                <th className="p-4 font-display font-medium text-gray-400 text-[11px] uppercase tracking-wider w-[20%]">
                  Category Type
                </th>
                <th className="p-4 font-display font-medium text-gray-400 text-[11px] uppercase tracking-wider w-[18%]">
                  Amount Charged
                </th>
                <th className="p-4 font-display font-medium text-gray-400 text-[11px] uppercase tracking-wider w-[6%] text-right">
                  Delete
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {groupedExpenses.sortedGroupKeys.length > 0 ? (
                groupedExpenses.sortedGroupKeys.map((monthName) => (
                  <React.Fragment key={monthName}>
                    {/* Month header divider row */}
                    <tr className="bg-white/[0.03] border-y border-white/5">
                      <td
                        colSpan={5}
                        className="p-3 pl-4 font-display font-bold text-[#CFB050] text-xs"
                      >
                        <div className="flex justify-between items-center pr-4">
                          <span className="flex items-center gap-1.5">
                            <Calendar size={13} className="text-[#CFB050]/70" />
                            {monthName}
                          </span>
                          <span className="text-[10px] text-gray-400 font-mono font-medium">
                            Total Spent:{" "}
                            {formatPrice(
                              groupedExpenses.groups[monthName].reduce(
                                (sum, item) => sum + item.amt,
                                0,
                              ),
                            )}
                          </span>
                        </div>
                      </td>
                    </tr>

                    {groupedExpenses.groups[monthName].map((e) => (
                      <tr
                        key={e.id}
                        className="hover:bg-white/[0.01] transition-colors"
                      >
                        <td className="p-4 font-mono text-gray-400 pl-6">
                          {e.date}
                        </td>
                        <td className="p-4 text-white font-medium max-w-[200px] truncate">
                          {e.desc}
                        </td>
                        <td className="p-4">
                          <span className="px-2.5 py-1 bg-white/5 border border-white/5 rounded-full font-semibold font-mono text-[10px] text-gray-400">
                            {e.cat}
                          </span>
                        </td>
                        <td className="p-4 font-mono text-red-400 font-bold">
                          {formatPrice(e.amt)}
                        </td>
                        <td className="p-4 text-right">
                          <button
                            onClick={() => handleDeleteExpense(e.id)}
                            className="p-1.5 text-gray-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all cursor-pointer inline-flex"
                            title="Delete expense entry"
                          >
                            <Trash2 size={13} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </React.Fragment>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="text-center py-12 text-gray-500">
                    No operating expenses logged yet. Complete the form above.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
