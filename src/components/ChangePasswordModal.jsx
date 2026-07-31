import React, { useState } from "react";
import { motion } from "motion/react";
import {
  X,
  KeyRound,
  ShieldCheck,
  Eye,
  EyeOff,
  AlertCircle,
  CheckCircle2,
} from "lucide-react";

export default function ChangePasswordModal({
  isOpen,
  onClose,
  currentAppPassword,
  onChangePassword,
  onShowToast,
}) {
  const [currentInput, setCurrentInput] = useState("");
  const [newInput, setNewInput] = useState("");
  const [confirmInput, setConfirmInput] = useState("");

  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    setErrorMsg("");
    setSuccessMsg("");

    if (currentInput !== currentAppPassword) {
      setErrorMsg("Current password is incorrect.");
      return;
    }

    if (!newInput.trim()) {
      setErrorMsg("New password cannot be empty.");
      return;
    }

    if (newInput.length < 3) {
      setErrorMsg("New password should be at least 3 characters long.");
      return;
    }

    if (newInput !== confirmInput) {
      setErrorMsg("New password and confirmation do not match.");
      return;
    }

    onChangePassword(newInput.trim());
    setSuccessMsg("Password updated successfully!");
    if (onShowToast) {
      onShowToast("System password changed successfully! 🔐");
    }

    setTimeout(() => {
      onClose();
      // Reset state
      setCurrentInput("");
      setNewInput("");
      setConfirmInput("");
      setSuccessMsg("");
      setErrorMsg("");
    }, 1200);
  };

  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 selection:bg-[#CFB050]/20 selection:text-[#CFB050]">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 10 }}
        className="w-full max-w-md bg-[#111116] border border-white/10 rounded-2xl p-6 shadow-2xl relative text-gray-200"
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-white/10 mb-5">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-[#CFB050]/10 text-[#CFB050] border border-[#CFB050]/20">
              <KeyRound size={18} />
            </div>
            <div>
              <h3 className="text-base font-bold text-white tracking-tight">
                Security Access Settings
              </h3>
              <p className="text-xs text-gray-400">
                Change your system password or PIN
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-xl hover:bg-white/10 text-gray-400 hover:text-white transition-colors cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Success Alert */}
        {successMsg && (
          <div className="mb-4 p-3 bg-emerald-950/50 border border-emerald-500/30 rounded-xl flex items-center gap-2 text-emerald-400 text-xs font-semibold">
            <CheckCircle2 size={16} className="shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Error Alert */}
        {errorMsg && (
          <div className="mb-4 p-3 bg-red-950/50 border border-red-500/30 rounded-xl flex items-center gap-2 text-red-400 text-xs font-semibold">
            <AlertCircle size={16} className="shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Current Password */}
          <div>
            <label className="block text-xs font-mono uppercase tracking-wider text-gray-400 mb-1.5">
              Current Password
            </label>
            <div className="relative">
              <input
                type={showCurrent ? "text" : "password"}
                value={currentInput}
                onChange={(e) => setCurrentInput(e.target.value)}
                placeholder="Enter current password"
                className="w-full bg-[#181822] border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-[#CFB050] transition-colors font-mono"
                required
              />
              <button
                type="button"
                onClick={() => setShowCurrent(!showCurrent)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-white transition-colors cursor-pointer"
              >
                {showCurrent ? <EyeOff size={14} /> : <Eye size={14} />}
              </button>
            </div>
          </div>

          {/* New Password */}
          <div>
            <label className="block text-xs font-mono uppercase tracking-wider text-gray-400 mb-1.5">
              New Password
            </label>
            <div className="relative">
              <input
                type={showNew ? "text" : "password"}
                value={newInput}
                onChange={(e) => setNewInput(e.target.value)}
                placeholder="Enter new password"
                className="w-full bg-[#181822] border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-[#CFB050] transition-colors font-mono"
                required
              />
              <button
                type="button"
                onClick={() => setShowNew(!showNew)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-white transition-colors cursor-pointer"
              >
                {showNew ? <EyeOff size={14} /> : <Eye size={14} />}
              </button>
            </div>
          </div>

          {/* Confirm New Password */}
          <div>
            <label className="block text-xs font-mono uppercase tracking-wider text-gray-400 mb-1.5">
              Confirm New Password
            </label>
            <div className="relative">
              <input
                type={showConfirm ? "text" : "password"}
                value={confirmInput}
                onChange={(e) => setConfirmInput(e.target.value)}
                placeholder="Re-enter new password"
                className="w-full bg-[#181822] border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-[#CFB050] transition-colors font-mono"
                required
              />
              <button
                type="button"
                onClick={() => setShowConfirm(!showConfirm)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-white transition-colors cursor-pointer"
              >
                {showConfirm ? <EyeOff size={14} /> : <Eye size={14} />}
              </button>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="pt-3 flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 bg-white/5 hover:bg-white/10 text-gray-300 font-semibold rounded-xl text-xs border border-white/10 transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 py-2.5 bg-gradient-to-r from-[#CFB050] to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 shadow-md shadow-[#CFB050]/20 transition-all cursor-pointer hover:scale-[1.01] active:scale-[0.99]"
            >
              <ShieldCheck size={15} />
              <span>Update Password</span>
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}
