import React, { useState } from "react";
import { motion } from "motion/react";
import {
  Lock,
  KeyRound,
  Eye,
  EyeOff,
  ShieldCheck,
  AlertCircle,
  Sparkles,
} from "lucide-react";

export default function LockScreen({ onAuthenticate, appPassword }) {
  const [passwordInput, setPasswordInput] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    setErrorMsg("");
    setIsSubmitting(true);

    setTimeout(() => {
      if (passwordInput.trim() === appPassword) {
        onAuthenticate();
      } else {
        setErrorMsg("Invalid password. Please try again.");
        setIsSubmitting(false);
      }
    }, 150);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-[#0A0A0D]/95 backdrop-blur-md p-4 selection:bg-[#CFB050]/20 selection:text-[#CFB050]">
      {/* Background Decorative Lighting */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-[#CFB050]/10 rounded-full blur-[120px] pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, scale: 0.92, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.2 }}
        className="w-full max-w-md bg-[#111116] border border-white/10 rounded-3xl p-8 shadow-2xl relative overflow-hidden text-gray-200"
      >
        {/* Top Gold Accent Bar */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-amber-500 via-[#CFB050] to-amber-600" />

        {/* Brand Header */}
        <div className="flex flex-col items-center text-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-[#CFB050]/20 to-amber-500/10 border border-[#CFB050]/30 flex items-center justify-center mb-4 shadow-xl shadow-[#CFB050]/5">
            <Lock size={28} className="text-[#CFB050]" />
          </div>
          <div className="flex items-center gap-1.5 justify-center mb-1">
            <Sparkles size={14} className="text-[#CFB050]" />
            <span className="font-display font-bold text-white text-base tracking-[0.2em]">
              C·M SCENTS
            </span>
          </div>
          <h2 className="text-xl font-bold text-white tracking-tight">
            Protected POS Access
          </h2>
          <p className="text-xs text-gray-400 mt-1 max-w-xs">
            Enter your security password or PIN to unlock the enterprise system
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-xs font-mono uppercase tracking-wider text-gray-400 mb-2">
              System Access Password
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-500">
                <KeyRound size={16} />
              </div>
              <input
                type={showPassword ? "text" : "password"}
                value={passwordInput}
                onChange={(e) => {
                  setPasswordInput(e.target.value);
                  if (errorMsg) setErrorMsg("");
                }}
                placeholder="Enter password..."
                autoFocus
                className="w-full bg-[#181822] border border-white/10 rounded-xl pl-10 pr-10 py-3 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-[#CFB050] focus:ring-1 focus:ring-[#CFB050] transition-all font-mono tracking-wider"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-white transition-colors cursor-pointer"
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          {errorMsg && (
            <motion.div
              initial={{ opacity: 0, y: -5 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-3 bg-red-950/50 border border-red-500/30 rounded-xl flex items-center gap-2 text-red-400 text-xs font-medium"
            >
              <AlertCircle size={15} className="shrink-0" />
              <span>{errorMsg}</span>
            </motion.div>
          )}

          <button
            type="submit"
            disabled={isSubmitting || !passwordInput.trim()}
            className="w-full py-3.5 bg-gradient-to-r from-[#CFB050] to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black font-bold rounded-xl text-sm flex items-center justify-center gap-2 shadow-lg shadow-[#CFB050]/20 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed hover:scale-[1.01] active:scale-[0.99]"
          >
            <ShieldCheck size={17} />
            <span>Unlock POS System</span>
          </button>
        </form>

        {/* Footer Security Note */}
        <div className="mt-8 pt-5 border-t border-white/5 text-center">
          <p className="text-[11px] text-gray-500 font-mono">
            Protected Enterprise POS Terminal
          </p>
        </div>
      </motion.div>
    </div>
  );
}
