import React, { useState, useMemo, useEffect } from "react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import {
  ArrowUpRight,
  TrendingDown,
  Printer,
  FileText,
  Calendar,
  Layers,
  CircleDollarSign,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

export default function PLView({ invoices, expenses, products }) {
  const [chartInterval, setChartInterval] = useState("Daily");
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [reportType, setReportType] = useState("Monthly");
  const [selectedPeriod, setSelectedPeriod] = useState("");

  const formatPrice = (num) => `PKR ${Math.round(num).toLocaleString()}`;

  // Helper to parse date securely across browser engines
  const parseDate = (dStr) => {
    if (!dStr) return new Date();
    const d = new Date(dStr);
    if (!isNaN(d.getTime())) return d;

    // Custom fallback for "DD MMM YYYY" (e.g., "15 Jun 2026")
    const months = {
      jan: 0,
      feb: 1,
      mar: 2,
      apr: 3,
      may: 4,
      jun: 5,
      jul: 6,
      aug: 7,
      sep: 8,
      oct: 9,
      nov: 10,
      dec: 11,
    };
    const parts = dStr.trim().split(/\s+/);
    if (parts.length === 3) {
      const day = parseInt(parts[0], 10);
      const mStr = parts[1].toLowerCase().substring(0, 3);
      const year = parseInt(parts[2], 10);
      const month = months[mStr];
      if (!isNaN(day) && month !== undefined && !isNaN(year)) {
        return new Date(year, month, day);
      }
    }
    return new Date();
  };

  const getDayLabel = (d) => {
    return d.toLocaleDateString("en-PK", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const getWeekLabel = (d) => {
    const date = new Date(d);
    const day = date.getDay();
    const diff = date.getDate() - day + (day === 0 ? -6 : 1); // Monday week commencing
    const monday = new Date(date.setDate(diff));
    return `W/C ${monday.toLocaleDateString("en-PK", { day: "2-digit", month: "short", year: "numeric" })}`;
  };

  const getMonthLabel = (d) => {
    return d.toLocaleDateString("en-PK", { month: "short", year: "numeric" });
  };

  // 1. High-level global financial KPIs
  const totalRevenue = useMemo(() => {
    return invoices.reduce((sum, i) => sum + i.total, 0);
  }, [invoices]);

  const totalCogs = useMemo(() => {
    return invoices.reduce((sum, i) => sum + i.cogs, 0);
  }, [invoices]);

  const grossProfit = useMemo(() => {
    return totalRevenue - totalCogs;
  }, [totalRevenue, totalCogs]);

  const totalExpenses = useMemo(() => {
    return expenses.reduce((sum, e) => sum + e.amt, 0);
  }, [expenses]);

  const netProfit = useMemo(() => {
    return grossProfit - totalExpenses;
  }, [grossProfit, totalExpenses]);

  const netMargin = useMemo(() => {
    return totalRevenue > 0 ? (netProfit / totalRevenue) * 100 : 0;
  }, [netProfit, totalRevenue]);

  // 2. Interactive Sales Bar Chart data calculation
  const chartSalesData = useMemo(() => {
    const map = {};
    const keys = [];

    // Sort invoices oldest to newest for chronological left-to-right display
    const sortedInvoices = [...invoices]
      .map((inv) => ({
        ...inv,
        parsedDate: parseDate(inv.date),
      }))
      .sort((a, b) => a.parsedDate.getTime() - b.parsedDate.getTime());

    sortedInvoices.forEach((inv) => {
      let label = "";
      if (chartInterval === "Daily") {
        label = inv.parsedDate.toLocaleDateString("en-PK", {
          day: "2-digit",
          month: "short",
        });
      } else if (chartInterval === "Weekly") {
        const d = new Date(inv.parsedDate);
        const day = d.getDay();
        const diff = d.getDate() - day + (day === 0 ? -6 : 1);
        const startOfWeek = new Date(d.setDate(diff));
        label = `W/C ${startOfWeek.toLocaleDateString("en-PK", { day: "2-digit", month: "short" })}`;
      } else {
        label = inv.parsedDate.toLocaleDateString("en-PK", {
          month: "short",
          year: "numeric",
        });
      }

      map[label] = (map[label] || 0) + inv.total;
      if (!keys.includes(label)) {
        keys.push(label);
      }
    });

    if (keys.length === 0) {
      return [{ name: "No Sales Yet", Sales: 0 }];
    }

    return keys.map((key) => ({
      name: key,
      Sales: Math.round(map[key]),
    }));
  }, [invoices, chartInterval]);

  // 3. Operating Expenses by category (Pie chart)
  const expensesBreakdownData = useMemo(() => {
    const map = {};
    expenses.forEach((e) => {
      map[e.cat] = (map[e.cat] || 0) + e.amt;
    });

    return Object.entries(map)
      .map(([category, amount]) => ({
        name: category,
        value: Math.round(amount),
      }))
      .sort((a, b) => b.value - a.value);
  }, [expenses]);

  const COLORS = [
    "#CFB050",
    "#EF4444",
    "#10B981",
    "#3B82F6",
    "#8B5CF6",
    "#F59E0B",
    "#EC4899",
    "#6B7280",
  ];

  // 4. Report Options listing
  const reportOptions = useMemo(() => {
    const dailySet = new Set();
    const weeklySet = new Set();
    const monthlySet = new Set();

    const allDates = [];
    invoices.forEach((inv) => allDates.push(parseDate(inv.date)));
    expenses.forEach((exp) => allDates.push(parseDate(exp.date)));

    // Newest first for selection dropdown
    allDates.sort((a, b) => b.getTime() - a.getTime());

    const uniqueDays = [];
    const uniqueWeeks = [];
    const uniqueMonths = [];

    allDates.forEach((d) => {
      const dayL = getDayLabel(d);
      const weekL = getWeekLabel(d);
      const monthL = getMonthLabel(d);

      if (!dailySet.has(dayL)) {
        dailySet.add(dayL);
        uniqueDays.push(dayL);
      }
      if (!weeklySet.has(weekL)) {
        weeklySet.add(weekL);
        uniqueWeeks.push(weekL);
      }
      if (!monthlySet.has(monthL)) {
        monthlySet.add(monthL);
        uniqueMonths.push(monthL);
      }
    });

    return {
      Daily: uniqueDays,
      Weekly: uniqueWeeks,
      Monthly: uniqueMonths,
    };
  }, [invoices, expenses]);

  // Set default selection when report type changes
  useEffect(() => {
    const options = reportOptions[reportType] || [];
    if (options.length > 0) {
      setSelectedPeriod(options[0]);
    } else {
      setSelectedPeriod("");
    }
  }, [reportType, reportOptions]);

  // Report Metrics Calculation
  const reportMetrics = useMemo(() => {
    const filteredInvoices = invoices.filter((inv) => {
      const d = parseDate(inv.date);
      if (reportType === "Daily") return getDayLabel(d) === selectedPeriod;
      if (reportType === "Weekly") return getWeekLabel(d) === selectedPeriod;
      if (reportType === "Monthly") return getMonthLabel(d) === selectedPeriod;
      return false;
    });

    const filteredExpenses = expenses.filter((exp) => {
      const d = parseDate(exp.date);
      if (reportType === "Daily") return getDayLabel(d) === selectedPeriod;
      if (reportType === "Weekly") return getWeekLabel(d) === selectedPeriod;
      if (reportType === "Monthly") return getMonthLabel(d) === selectedPeriod;
      return false;
    });

    const revenue = filteredInvoices.reduce((sum, inv) => sum + inv.total, 0);
    const cogs = filteredInvoices.reduce((sum, inv) => sum + inv.cogs, 0);
    const grossProfitVal = revenue - cogs;
    const opex = filteredExpenses.reduce((sum, exp) => sum + exp.amt, 0);
    const netProfitVal = grossProfitVal - opex;
    const netMarginVal = revenue > 0 ? (netProfitVal / revenue) * 100 : 0;

    const itemSales = {};
    filteredInvoices.forEach((inv) => {
      inv.items.forEach((item) => {
        if (!itemSales[item.name]) {
          itemSales[item.name] = { qty: 0, revenue: 0, icon: item.icon };
        }
        itemSales[item.name].qty += item.qty;
        itemSales[item.name].revenue += item.price * item.qty;
      });
    });

    const itemsList = Object.entries(itemSales)
      .map(([name, data]) => ({
        name,
        qty: data.qty,
        revenue: data.revenue,
        icon: data.icon,
      }))
      .sort((a, b) => b.revenue - a.revenue);

    return {
      invoices: filteredInvoices,
      expenses: filteredExpenses,
      revenue,
      cogs,
      grossProfit: grossProfitVal,
      opex,
      netProfit: netProfitVal,
      netMargin: netMarginVal,
      itemsList,
    };
  }, [invoices, expenses, reportType, selectedPeriod]);

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-[#181820] border border-white/10 px-3 py-2.5 rounded-xl shadow-xl font-mono text-xs">
          <p className="text-gray-400 font-display mb-1">{label}</p>
          <p className="text-[#CFB050] font-bold">
            PKR {payload[0].value.toLocaleString()}
          </p>
        </div>
      );
    }
    return null;
  };

  const handlePrintReport = () => {
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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-display font-bold text-white tracking-wide">
            Profit and Loss Reporting
          </h2>
          <p className="text-xs text-gray-500 mt-1">
            Real-time balance sheet and dynamic sales interval analytics
          </p>
        </div>

        <button
          onClick={() => setIsReportModalOpen(true)}
          className="bg-[#CFB050] hover:bg-[#E5C76B] text-black px-4.5 py-2.5 rounded-xl text-xs font-semibold font-display flex items-center justify-center gap-1.5 cursor-pointer shadow-lg shadow-[#CFB050]/5 transition-all hover:scale-[1.01] active:scale-[0.99] self-start sm:self-auto"
        >
          <Printer size={15} />
          Print Statement / Report
        </button>
      </div>

      {/* Stats Cards Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        <div className="bg-[#111116] border border-white/5 rounded-2xl p-4">
          <span className="text-[10px] text-gray-500 font-mono block uppercase tracking-wider">
            Gross Revenue
          </span>
          <span className="text-lg font-bold text-[#CFB050] font-mono mt-1 block">
            {formatPrice(totalRevenue)}
          </span>
          <span className="text-[10px] text-gray-400 block mt-1">
            Sales volume total
          </span>
        </div>

        <div className="bg-[#111116] border border-white/5 rounded-2xl p-4">
          <span className="text-[10px] text-gray-500 font-mono block uppercase tracking-wider">
            Gross Profit
          </span>
          <span className="text-lg font-bold text-emerald-400 font-mono mt-1 block">
            {formatPrice(grossProfit)}
          </span>
          <span className="text-[10px] text-gray-500 block mt-1 font-mono">
            COGS: {formatPrice(totalCogs)}
          </span>
        </div>

        <div className="bg-[#111116] border border-white/5 rounded-2xl p-4">
          <span className="text-[10px] text-gray-500 font-mono block uppercase tracking-wider">
            Total Expenses
          </span>
          <span className="text-lg font-bold text-red-400 font-mono mt-1 block">
            {formatPrice(totalExpenses)}
          </span>
          <span className="text-[10px] text-gray-400 block mt-1">
            Operating overheads
          </span>
        </div>

        <div className="bg-[#111116] border border-white/5 rounded-2xl p-4">
          <span className="text-[10px] text-gray-500 font-mono block uppercase tracking-wider">
            Net Profit (Bottom-Line)
          </span>
          <span
            className={`text-lg font-bold font-mono mt-1 block ${
              netProfit >= 0 ? "text-emerald-400" : "text-red-400"
            }`}
          >
            {formatPrice(netProfit)}
          </span>
          <span className="text-[10px] text-gray-400 block mt-1 flex items-center gap-1">
            {netProfit >= 0 ? (
              <ArrowUpRight size={12} className="text-emerald-400" />
            ) : (
              <TrendingDown size={12} className="text-red-400" />
            )}
            Margin: {netMargin.toFixed(1)}%
          </span>
        </div>
      </div>

      {/* Visual Charts section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Dynamic Sales Interval Bar Chart */}
        <div className="bg-[#111116] border border-white/5 rounded-2xl p-4 sm:p-5 flex flex-col h-80">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-display font-semibold text-white text-xs uppercase tracking-wider text-gray-400">
              Sales Revenue Progress
            </h3>
            {/* Interval Toggles */}
            <div className="flex gap-1 bg-[#181820] p-0.5 rounded-lg border border-white/5">
              {["Daily", "Weekly", "Monthly"].map((interval) => (
                <button
                  key={interval}
                  onClick={() => setChartInterval(interval)}
                  className={`px-2 py-1 rounded-md text-[10px] font-display font-medium transition-all cursor-pointer ${
                    chartInterval === interval
                      ? "bg-[#CFB050] text-black font-semibold"
                      : "text-gray-400 hover:text-white"
                  }`}
                >
                  {interval}
                </button>
              ))}
            </div>
          </div>

          <div className="flex-1 min-h-0 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={chartSalesData}
                margin={{ left: -10, right: 10, top: 10, bottom: 5 }}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="rgba(255,255,255,0.03)"
                />
                <XAxis
                  dataKey="name"
                  stroke="#6B7280"
                  fontSize={10}
                  fontStyle="mono"
                  tickLine={false}
                />
                <YAxis
                  stroke="#6B7280"
                  fontSize={10}
                  fontStyle="mono"
                  tickLine={false}
                />
                <Tooltip
                  content={<CustomTooltip />}
                  cursor={{ fill: "rgba(255,255,255,0.01)" }}
                />
                <Bar
                  dataKey="Sales"
                  fill="#CFB050"
                  radius={[4, 4, 0, 0]}
                  barSize={28}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Operating Expenses Breakdown Chart */}
        <div className="bg-[#111116] border border-white/5 rounded-2xl p-4 sm:p-5 flex flex-col h-80">
          <h3 className="font-display font-semibold text-white text-xs uppercase tracking-wider text-gray-400 mb-4">
            Operating Expenses Breakdown
          </h3>
          <div className="flex-1 min-h-0 w-full flex flex-col sm:flex-row items-center justify-center gap-4">
            {expensesBreakdownData.length > 0 ? (
              <>
                <div className="flex-1 min-h-[160px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={expensesBreakdownData}
                        cx="50%"
                        cy="50%"
                        innerRadius={50}
                        outerRadius={75}
                        paddingAngle={4}
                        dataKey="value"
                      >
                        {expensesBreakdownData.map((entry, index) => (
                          <Cell
                            key={`cell-${index}`}
                            fill={COLORS[index % COLORS.length]}
                          />
                        ))}
                      </Pie>
                      <Tooltip content={<CustomTooltip />} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                {/* Custom Legend */}
                <div className="w-full sm:w-44 space-y-1.5 max-h-[180px] overflow-y-auto text-[10px] font-mono pr-1 scrollbar-thin">
                  {expensesBreakdownData.map((entry, idx) => (
                    <div
                      key={entry.name}
                      className="flex items-center justify-between text-gray-300"
                    >
                      <div className="flex items-center gap-2 truncate">
                        <span
                          className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                          style={{
                            backgroundColor: COLORS[idx % COLORS.length],
                          }}
                        />
                        <span className="truncate">{entry.name}</span>
                      </div>
                      <span className="text-gray-500 font-bold ml-1">
                        {((entry.value / (totalExpenses || 1)) * 100).toFixed(
                          0,
                        )}
                        %
                      </span>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-gray-600">
                <p className="text-xs">No operating expenses logged yet.</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Overview Balance Ledger */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Income Columns */}
        <div className="bg-[#111116] border border-white/5 rounded-2xl p-4 flex flex-col">
          <h4 className="font-display font-bold text-[10px] text-gray-500 uppercase tracking-widest pb-3 border-b border-white/5 mb-3">
            Income Streams
          </h4>
          <div className="space-y-1.5 flex-1 text-xs">
            <div className="flex justify-between items-center py-2 border-b border-white/[0.02]">
              <span className="text-gray-400 font-mono">
                EDP Fragrance Sales Receipts
              </span>
              <span className="text-emerald-400 font-mono font-bold">
                +{formatPrice(totalRevenue)}
              </span>
            </div>
            <p className="text-[10px] text-gray-600 italic mt-2">
              All 6 active house formulations are categorized under Eau de
              Parfum (EDP).
            </p>
          </div>
          <div className="border-t border-white/10 pt-3 mt-4 flex justify-between items-center text-xs font-bold font-display">
            <span className="text-white">Gross Revenue</span>
            <span className="text-[#CFB050] font-mono">
              {formatPrice(totalRevenue)}
            </span>
          </div>
        </div>

        {/* Expenses and COGS Columns */}
        <div className="bg-[#111116] border border-white/5 rounded-2xl p-4 flex flex-col">
          <h4 className="font-display font-bold text-[10px] text-gray-500 uppercase tracking-widest pb-3 border-b border-white/5 mb-3">
            Overhead / Product Costs
          </h4>
          <div className="space-y-1.5 flex-1 text-xs">
            {totalCogs > 0 && (
              <div className="flex justify-between items-center py-1 border-b border-white/[0.02]">
                <span className="text-gray-400 font-mono">
                  Product COGS cost price
                </span>
                <span className="text-red-400 font-mono font-bold">
                  -{formatPrice(totalCogs)}
                </span>
              </div>
            )}
            {expensesBreakdownData.length > 0 ? (
              expensesBreakdownData.map((item) => (
                <div
                  key={item.name}
                  className="flex justify-between items-center py-1 border-b border-white/[0.02] last:border-0"
                >
                  <span className="text-gray-400 font-mono">
                    Operating: {item.name}
                  </span>
                  <span className="text-red-400 font-mono font-bold">
                    -{formatPrice(item.value)}
                  </span>
                </div>
              ))
            ) : (
              <div className="text-gray-600 text-center py-4">
                No logged overhead expenses.
              </div>
            )}
          </div>
          <div className="border-t border-white/10 pt-3 mt-4 flex justify-between items-center text-xs font-bold font-display">
            <span className="text-white">Total Deductions</span>
            <span className="text-red-400 font-mono">
              {formatPrice(totalCogs + totalExpenses)}
            </span>
          </div>
        </div>
      </div>

      {/* Printable Report Generator Modal Overlay */}
      <AnimatePresence>
        {isReportModalOpen && (
          <div className="fixed inset-0 bg-black/75 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-y-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="bg-[#181820] border border-white/10 rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl flex flex-col my-4"
            >
              {/* Modal Header */}
              <div className="px-6 py-4 border-b border-white/5 flex items-center justify-between bg-[#13131a]">
                <div>
                  <h3 className="font-display font-bold text-white text-base">
                    Print Profit and Loss Report
                  </h3>
                  <p className="text-[10px] text-gray-500 mt-0.5">
                    Configure and preview statements prior to compiling PDFs
                  </p>
                </div>
                <button
                  onClick={() => setIsReportModalOpen(false)}
                  className="text-gray-400 hover:text-white transition-colors border border-white/5 hover:bg-white/5 px-2.5 py-1 rounded-lg text-xs"
                >
                  Close
                </button>
              </div>

              {/* Modal Body */}
              <div className="p-6 space-y-6 overflow-y-auto max-h-[70vh]">
                {typeof window !== "undefined" &&
                  window.self !== window.top && (
                    <div className="bg-amber-500/10 border border-amber-500/20 text-amber-200 p-3.5 rounded-xl text-xs leading-relaxed flex flex-col gap-1 shadow-inner">
                      <span className="font-bold flex items-center gap-1 text-amber-400">
                        ⚠️ Browser Security Sandbox Notice
                      </span>
                      <p>
                        Because this app is running inside an embedded preview
                        frame, direct printing can sometimes be blocked by your
                        browser. For a perfect print/PDF, click the{" "}
                        <strong className="text-white">
                          "Open in New Tab"
                        </strong>{" "}
                        icon in the top-right of the preview window and print
                        from there!
                      </p>
                    </div>
                  )}

                {/* Configuration selection selectors */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Select statement interval */}
                  <div className="flex flex-col gap-2">
                    <span className="text-[10px] text-gray-400 font-mono uppercase tracking-wider font-semibold">
                      Statement Duration Level
                    </span>
                    <div className="flex gap-1 bg-[#111116] p-1 rounded-xl border border-white/5">
                      {["Daily", "Weekly", "Monthly"].map((type) => (
                        <button
                          key={type}
                          type="button"
                          onClick={() => setReportType(type)}
                          className={`flex-1 py-2 text-xs font-display font-semibold rounded-lg transition-all cursor-pointer ${
                            reportType === type
                              ? "bg-[#CFB050] text-black shadow"
                              : "text-gray-400 hover:text-white"
                          }`}
                        >
                          {type}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Select specific period */}
                  <div className="flex flex-col gap-2">
                    <span className="text-[10px] text-gray-400 font-mono uppercase tracking-wider font-semibold">
                      Select Target Period
                    </span>
                    {reportOptions[reportType] &&
                    reportOptions[reportType].length > 0 ? (
                      <select
                        value={selectedPeriod}
                        onChange={(e) => setSelectedPeriod(e.target.value)}
                        className="bg-[#111116] border border-white/5 focus:border-[#CFB050] text-white text-xs rounded-xl px-3.5 py-3 outline-none w-full cursor-pointer"
                      >
                        {reportOptions[reportType].map((option) => (
                          <option key={option} value={option}>
                            {option}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <div className="text-xs text-gray-600 bg-[#111116] border border-white/5 rounded-xl p-3">
                        No transactions found for this interval option.
                      </div>
                    )}
                  </div>
                </div>

                {/* Statement Live Preview block (Screen version) */}
                <div className="bg-[#111116] border border-white/5 rounded-2xl p-5 space-y-4">
                  <div className="flex items-center justify-between border-b border-white/5 pb-3">
                    <div>
                      <span className="font-display font-bold text-sm tracking-wider text-white">
                        C·M SCENTS FINANCIALS
                      </span>
                      <span className="text-[10px] text-gray-500 font-mono block uppercase">
                        {reportType} Statement ·{" "}
                        {selectedPeriod || "No Period Selected"}
                      </span>
                    </div>
                    <FileText size={18} className="text-[#CFB050]" />
                  </div>

                  {/* High level metrics cards preview */}
                  {selectedPeriod ? (
                    <>
                      <div className="grid grid-cols-3 gap-2 text-center bg-white/[0.01] p-3 rounded-xl border border-white/5">
                        <div>
                          <span className="text-[8px] text-gray-500 uppercase font-mono block">
                            Gross Income
                          </span>
                          <span className="text-xs font-bold font-mono text-emerald-400 mt-0.5 block">
                            {formatPrice(reportMetrics.revenue)}
                          </span>
                        </div>
                        <div>
                          <span className="text-[8px] text-gray-500 uppercase font-mono block">
                            Deductions
                          </span>
                          <span className="text-xs font-bold font-mono text-red-400 mt-0.5 block">
                            {formatPrice(
                              reportMetrics.opex + reportMetrics.cogs,
                            )}
                          </span>
                        </div>
                        <div>
                          <span className="text-[8px] text-gray-500 uppercase font-mono block">
                            Net Result
                          </span>
                          <span
                            className={`text-xs font-bold font-mono mt-0.5 block ${reportMetrics.netProfit >= 0 ? "text-emerald-400" : "text-red-400"}`}
                          >
                            {formatPrice(reportMetrics.netProfit)}
                          </span>
                        </div>
                      </div>

                      {/* Ledger preview lists */}
                      <div className="space-y-3.5 text-xs text-gray-300">
                        {/* Revenue line */}
                        <div className="flex justify-between border-b border-white/[0.02] pb-1.5">
                          <span>
                            I. Customer Invoiced Sales (
                            {reportMetrics.invoices.length} orders)
                          </span>
                          <span className="font-mono text-emerald-400 font-semibold">
                            +{formatPrice(reportMetrics.revenue)}
                          </span>
                        </div>
                        {/* COGS line */}
                        <div className="flex justify-between border-b border-white/[0.02] pb-1.5">
                          <span>
                            II. Total Cost of Goods Manufactured (COGS)
                          </span>
                          <span className="font-mono text-red-400 font-semibold">
                            -{formatPrice(reportMetrics.cogs)}
                          </span>
                        </div>
                        {/* OPEX line */}
                        <div className="flex justify-between border-b border-white/[0.02] pb-1.5">
                          <span>
                            III. Operating overhead expenses (
                            {reportMetrics.expenses.length} records)
                          </span>
                          <span className="font-mono text-red-400 font-semibold">
                            -{formatPrice(reportMetrics.opex)}
                          </span>
                        </div>

                        {/* Bottom net row */}
                        <div className="flex justify-between pt-1 border-t border-white/5 font-bold font-display text-white">
                          <span>Net Statement Profit</span>
                          <span
                            className={
                              reportMetrics.netProfit >= 0
                                ? "text-emerald-400"
                                : "text-red-400"
                            }
                          >
                            {formatPrice(reportMetrics.netProfit)}
                          </span>
                        </div>
                      </div>
                    </>
                  ) : (
                    <div className="text-center py-6 text-gray-600 text-xs">
                      Please enter a sales or expense record to preview
                      statements.
                    </div>
                  )}
                </div>
              </div>

              {/* Modal Actions */}
              <div className="px-6 py-4 bg-[#13131a] border-t border-white/5 flex gap-3 justify-end">
                <button
                  onClick={() => setIsReportModalOpen(false)}
                  className="px-4 py-2 bg-white/5 hover:bg-white/10 text-gray-300 rounded-xl text-xs font-semibold cursor-pointer transition-colors"
                >
                  Cancel Preview
                </button>
                <button
                  onClick={handlePrintReport}
                  disabled={!selectedPeriod}
                  className={`px-5 py-2.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all ${
                    selectedPeriod
                      ? "bg-[#CFB050] hover:bg-[#E5C76B] text-black cursor-pointer shadow-lg active:scale-[0.98]"
                      : "bg-white/5 text-gray-600 cursor-not-allowed"
                  }`}
                >
                  <Printer size={13} />
                  Print Statement (PDF)
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Printable isolated P&L report container visible ONLY when printing is triggered */}
      {selectedPeriod && (
        <div className="hidden print:block">
          <div className="printable-report bg-white text-neutral-900 p-8 font-mono text-xs max-w-2xl mx-auto border border-neutral-300">
            {/* Elegant Luxury Header */}
            <div className="text-center mb-6 pb-4 border-b-2 border-dashed border-neutral-300">
              <h2 className="font-display font-bold text-xl tracking-[0.25em] text-[#B8860B] uppercase">
                C·M SCENTS
              </h2>
              <p className="text-[9px] text-neutral-500 uppercase tracking-widest mt-1">
                Premium Fragrances &amp; Accents
              </p>
              <p className="text-[10px] text-neutral-400 mt-0.5">
                Karachi, Pakistan · www.cmscents.com
              </p>
              <h3 className="text-sm font-bold uppercase tracking-wider mt-4 text-neutral-800">
                PROFIT &amp; LOSS REPORT ({reportType.toUpperCase()})
              </h3>
              <p className="text-xs font-semibold text-[#B8860B] mt-1">
                {selectedPeriod}
              </p>
            </div>

            {/* Statement Metadata Block */}
            <div className="grid grid-cols-2 gap-y-1.5 gap-x-4 text-xs text-neutral-600 mb-6 pb-4 border-b border-dashed border-neutral-300">
              <div>
                <span className="text-neutral-400 text-[9px] uppercase tracking-wider block">
                  Statement Type
                </span>
                <span className="font-bold text-neutral-900">
                  {reportType} Financial Statement
                </span>
              </div>
              <div>
                <span className="text-neutral-400 text-[9px] uppercase tracking-wider block">
                  Reporting Period
                </span>
                <span className="font-bold text-neutral-900">
                  {selectedPeriod}
                </span>
              </div>
              <div className="mt-1">
                <span className="text-neutral-400 text-[9px] uppercase tracking-wider block">
                  Generated Date
                </span>
                <span className="text-neutral-900">
                  {new Date().toLocaleString("en-PK", {
                    dateStyle: "medium",
                    timeStyle: "short",
                  })}
                </span>
              </div>
              <div className="mt-1">
                <span className="text-neutral-400 text-[9px] uppercase tracking-wider block">
                  Currency / Scale
                </span>
                <span className="text-neutral-900 font-bold">
                  PKR (Pakistan Rupee)
                </span>
              </div>
            </div>

            {/* Key Performance Indicators summary */}
            <div className="bg-neutral-50 border border-neutral-200 rounded-lg p-4 mb-6 grid grid-cols-3 gap-3 text-center">
              <div>
                <span className="text-[8px] text-neutral-500 uppercase tracking-wider block font-bold mb-0.5">
                  Gross Revenue
                </span>
                <span className="text-xs font-bold text-neutral-900 font-mono">
                  {formatPrice(reportMetrics.revenue)}
                </span>
              </div>
              <div>
                <span className="text-[8px] text-neutral-500 uppercase tracking-wider block font-bold mb-0.5">
                  OPEX &amp; Cost Deductions
                </span>
                <span className="text-xs font-bold text-red-600 font-mono">
                  -{formatPrice(reportMetrics.opex + reportMetrics.cogs)}
                </span>
              </div>
              <div>
                <span className="text-[8px] text-neutral-500 uppercase tracking-wider block font-bold mb-0.5">
                  Net Statement profit
                </span>
                <span
                  className={`text-xs font-bold font-mono ${reportMetrics.netProfit >= 0 ? "text-emerald-700" : "text-red-600"}`}
                >
                  {formatPrice(reportMetrics.netProfit)}
                </span>
              </div>
            </div>

            {/* Structured Report Ledger Tables */}
            <div className="space-y-4 mb-6">
              {/* I. Revenue Stream */}
              <div>
                <h4 className="font-bold uppercase text-[9px] text-neutral-500 tracking-wider pb-1 border-b border-neutral-300 mb-1.5">
                  I. Revenue and Sales Income
                </h4>
                <div className="space-y-1.5 text-xs">
                  <div className="flex justify-between items-center py-0.5">
                    <span className="text-neutral-700">
                      Gross Sales Receipts ({reportMetrics.invoices.length}{" "}
                      invoices)
                    </span>
                    <span className="font-mono text-neutral-900 font-bold">
                      +{formatPrice(reportMetrics.revenue)}
                    </span>
                  </div>
                  {/* Item sales breakdown during period */}
                  {reportMetrics.itemsList.length > 0 && (
                    <div className="pl-4 border-l border-neutral-200 mt-1.5 space-y-1 text-[10px] text-neutral-500">
                      {reportMetrics.itemsList.map((item) => (
                        <div key={item.name} className="flex justify-between">
                          <span>
                            {item.icon} {item.name} (×{item.qty})
                          </span>
                          <span>{formatPrice(item.revenue)}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* II. COGS Stream */}
              <div>
                <h4 className="font-bold uppercase text-[9px] text-neutral-500 tracking-wider pb-1 border-b border-neutral-300 pt-2 mb-1.5">
                  II. Cost of Goods Sold (COGS)
                </h4>
                <div className="space-y-1 text-xs">
                  <div className="flex justify-between items-center py-0.5">
                    <span className="text-neutral-700">
                      Total batch formulation raw manufacturing costs
                    </span>
                    <span className="font-mono text-red-600 font-bold">
                      -{formatPrice(reportMetrics.cogs)}
                    </span>
                  </div>
                </div>
              </div>

              {/* III. OPEX Stream */}
              <div>
                <h4 className="font-bold uppercase text-[9px] text-neutral-500 tracking-wider pb-1 border-b border-neutral-300 pt-2 mb-1.5">
                  III. Operating Overheads &amp; Expenses
                </h4>
                <div className="space-y-1.5 text-xs">
                  {reportMetrics.expenses.length > 0 ? (
                    reportMetrics.expenses.map((exp) => (
                      <div
                        key={exp.id}
                        className="flex justify-between items-center py-0.5 border-b border-neutral-100 last:border-0"
                      >
                        <span className="text-neutral-700">
                          {exp.date} · {exp.desc} ({exp.cat})
                        </span>
                        <span className="font-mono text-red-600">
                          -{formatPrice(exp.amt)}
                        </span>
                      </div>
                    ))
                  ) : (
                    <p className="text-neutral-400 italic py-0.5 text-[10px]">
                      No operating expenses logged in this statement period.
                    </p>
                  )}
                </div>
              </div>

              {/* Balance Summary Ledger */}
              <div className="border-t-2 border-dashed border-neutral-400 pt-3.5 mt-4 space-y-1.5 text-xs">
                <div className="flex justify-between text-neutral-600">
                  <span>Gross Profit (Revenue - COGS)</span>
                  <span className="font-mono text-neutral-800 font-semibold">
                    {formatPrice(reportMetrics.grossProfit)}
                  </span>
                </div>
                <div className="flex justify-between text-neutral-600">
                  <span>Operating Expenses (OPEX overheads)</span>
                  <span className="font-mono text-neutral-800 font-semibold">
                    -{formatPrice(reportMetrics.opex)}
                  </span>
                </div>
                <div className="flex justify-between text-neutral-900 font-bold text-sm border-t border-neutral-300 pt-2.5">
                  <span>Net Statement Profit (Bottom-Line Value)</span>
                  <span
                    className={
                      reportMetrics.netProfit >= 0
                        ? "text-emerald-700 font-bold"
                        : "text-red-600 font-bold"
                    }
                  >
                    {formatPrice(reportMetrics.netProfit)}
                  </span>
                </div>
                <div className="flex justify-between text-neutral-500 text-[10px] font-semibold">
                  <span>Statement Net Operating Margin</span>
                  <span>{reportMetrics.netMargin.toFixed(1)}%</span>
                </div>
              </div>
            </div>

            {/* Signature blocks */}
            <div className="grid grid-cols-2 gap-8 text-center text-[9px] text-neutral-400 mt-12 pt-8 border-t border-dashed border-neutral-200">
              <div>
                <div className="w-24 border-b border-neutral-300 mx-auto mb-1 h-8"></div>
                <span>Prepared By</span>
              </div>
              <div>
                <div className="w-24 border-b border-neutral-300 mx-auto mb-1 h-8"></div>
                <span>Authorized Signatory</span>
              </div>
            </div>

            {/* Authentic Brand Fine Print footer */}
            <div className="text-center text-[8px] text-neutral-400 mt-8 space-y-0.5">
              <p className="font-semibold text-neutral-500 uppercase tracking-widest">
                C·M SCENTS ENTERPRISE POS SYSTEMS
              </p>
              <p className="italic">
                "Where luxury meets artisanal craftsmanship"
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
