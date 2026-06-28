import React from "react";
import { motion } from "motion/react";
import { X, Printer } from "lucide-react";

export default function ReceiptModal({ invoice, onClose }) {
  const formatPKR = (num) => `PKR ${Math.round(num).toLocaleString()}`;

  const handlePrint = () => {
    try {
      window.focus();
      window.print();
    } catch (e) {
      console.error("Print failed or was blocked:", e);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/75 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-y-auto">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 15 }}
        className="bg-[#181820] border border-white/10 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl"
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/5">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <h3 className="font-display font-medium text-white text-base">
              Sale Completed Successfully
            </h3>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors p-1.5 rounded-lg hover:bg-white/5"
            aria-label="Close"
          >
            <X size={18} />
          </button>
        </div>

        {/* Printable Area */}
        <div className="p-6">
          {typeof window !== "undefined" && window.self !== window.top && (
            <div className="mb-4 bg-amber-500/10 border border-amber-500/20 text-amber-200 p-3.5 rounded-xl text-[11px] leading-relaxed flex flex-col gap-1 shadow-inner">
              <span className="font-bold flex items-center gap-1 text-amber-400">
                ⚠️ Sandbox Preview Notice
              </span>
              <p>
                Browser security blocks direct printing inside preview frames.
                Click the{" "}
                <strong className="text-white">"Open in New Tab"</strong> icon
                in the top-right of your preview to print beautifully!
              </p>
            </div>
          )}

          <div className="bg-white text-neutral-900 rounded-xl p-6 shadow-inner font-mono text-sm receipt-wrap">
            <div className="text-center mb-4 border-b border-dashed border-neutral-300 pb-4">
              <h2 className="font-display font-bold text-lg tracking-[0.2em] text-[#B8860B]">
                C·M SCENTS
              </h2>
              <p className="text-xs text-neutral-500 mt-1">
                Premium Fragrances &amp; Accents
              </p>
              <p className="text-[10px] text-neutral-500 mt-1">
                Isra Village, Hala Naka, Hyderabad, Pakistan
              </p>
              <p className="text-[10px] text-neutral-400 font-bold mt-0.5">
                Phone: +92 333 3641997 · https://cmscents.com/
              </p>
            </div>

            <div className="space-y-1 text-xs text-neutral-600 mb-4 pb-3 border-b border-dashed border-neutral-300">
              <div className="flex justify-between">
                <span>Receipt No:</span>
                <span className="font-bold text-neutral-900">{invoice.id}</span>
              </div>
              <div className="flex justify-between">
                <span>Date:</span>
                <span>{invoice.date}</span>
              </div>
              <div className="flex justify-between">
                <span>Customer:</span>
                <span>{invoice.customer}</span>
              </div>
              {invoice.phone && invoice.phone !== "None" && (
                <div className="flex justify-between">
                  <span>Customer Phone:</span>
                  <span>{invoice.phone}</span>
                </div>
              )}
              {invoice.address && (
                <div className="flex justify-between items-start">
                  <span>Customer Address:</span>
                  <span className="text-right max-w-[180px] break-words">
                    {invoice.address}
                  </span>
                </div>
              )}
              <div className="flex justify-between">
                <span>Payment Method:</span>
                <span>{invoice.method}</span>
              </div>
            </div>

            {/* Items table */}
            <div className="space-y-2 mb-4">
              <div className="flex justify-between text-xs text-neutral-500 font-bold border-b border-neutral-200 pb-1">
                <span>Item Description</span>
                <span>Total</span>
              </div>
              {invoice.items.map((item) => (
                <div
                  key={item.id}
                  className="flex justify-between text-xs items-start"
                >
                  <div className="pr-4">
                    <span className="text-neutral-900">
                      {item.icon} {item.name}
                    </span>
                    <span className="text-neutral-500 block text-[11px]">
                      {item.qty} × {Math.round(item.price).toLocaleString()}
                    </span>
                  </div>
                  <span className="text-neutral-900 font-medium whitespace-nowrap">
                    {Math.round(item.price * item.qty).toLocaleString()}
                  </span>
                </div>
              ))}
            </div>

            {/* Calculations */}
            <div className="border-t border-dashed border-neutral-300 pt-3 space-y-1.5 text-xs text-neutral-600">
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span>{Math.round(invoice.sub).toLocaleString()}</span>
              </div>
              {invoice.disc > 0 && (
                <div className="flex justify-between text-red-600 font-medium">
                  <span>Discount</span>
                  <span>-{Math.round(invoice.disc).toLocaleString()}</span>
                </div>
              )}
              <div className="flex justify-between text-neutral-900 font-bold text-sm border-t border-neutral-200 pt-1.5">
                <span>Total Amount (PKR)</span>
                <span>{Math.round(invoice.total).toLocaleString()}</span>
              </div>
            </div>

            <div className="text-center text-[10px] text-neutral-400 mt-6 pt-4 border-t border-dashed border-neutral-300">
              <p>Thank you for choosing C.M Scents</p>
              <p className="mt-1 font-sans">
                Crafted with Luxury &amp; Passion
              </p>
            </div>
          </div>
        </div>

        {/* Modal Actions */}
        <div className="px-6 py-4 bg-white/5 border-t border-white/5 flex gap-3 justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white rounded-xl text-sm font-medium transition-colors"
          >
            Close Window
          </button>
          <button
            onClick={handlePrint}
            className="px-5 py-2 bg-[#CFB050] hover:bg-[#E5C76B] text-black rounded-xl text-sm font-semibold flex items-center gap-2 shadow-lg shadow-[#CFB050]/10 transition-all hover:scale-[1.02] active:scale-[0.98]"
          >
            <Printer size={16} />
            Print Receipt
          </button>
        </div>
      </motion.div>
    </div>
  );
}
