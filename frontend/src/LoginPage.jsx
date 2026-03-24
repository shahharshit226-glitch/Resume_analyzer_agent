import React, { useState } from "react";
import { Brain, Mail, Lock, Eye, EyeOff, User } from "lucide-react";
import { useAuth } from "./AuthContext";

const DEMO = [
  { role: "Admin", email: "admin@agentic.com", pw: "admin123", emoji: "A" },
  { role: "HR", email: "hr@agentic.com", pw: "hr123", emoji: "H" },
  { role: "Finance", email: "finance@agentic.com", pw: "finance123", emoji: "F" },
];

const LoginPage = ({ onLogin }) => {
  const { login, register } = useAuth();
  const [mode, setMode] = useState("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const resetMessages = () => {
    setError("");
    setSuccess("");
  };

  const doLogin = async (em, pw) => {
    setLoading(true);
    resetMessages();
    try {
      await login(em, pw);
      onLogin();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (mode === "login") {
      doLogin(email, password);
      return;
    }

    setLoading(true);
    resetMessages();
    try {
      await register({ name, email, password });
      setSuccess("Account created successfully. Signing you in...");
      await login(email, password);
      onLogin();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-indigo-950 to-purple-900 flex items-center justify-center p-4">
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-indigo-600 rounded-full blur-3xl opacity-20 animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-600 rounded-full blur-3xl opacity-20" />
      </div>

      <div className="relative w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-3 mb-3">
            <div className="p-3 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl shadow-2xl shadow-indigo-500/50">
              <Brain className="w-9 h-9 text-white" />
            </div>
            <div className="text-left">
              <h1 className="text-2xl font-black text-white leading-none">AI AgenticHire</h1>
              <p className="text-indigo-300 text-sm">Enterprise HR Intelligence</p>
            </div>
          </div>
          <p className="text-indigo-200/70 text-sm mt-2">
            {mode === "login" ? "Sign in to your dashboard" : "Create your account to use the website"}
          </p>
        </div>

        <div className="bg-white/10 backdrop-blur-2xl border border-white/20 rounded-3xl p-8 shadow-2xl">
          <div className="grid grid-cols-2 gap-2 mb-5 bg-white/5 rounded-2xl p-1 border border-white/10">
            <button
              type="button"
              onClick={() => { setMode("login"); resetMessages(); }}
              className={`rounded-xl px-4 py-2 text-sm font-semibold transition-all ${mode === "login" ? "bg-white text-slate-900" : "text-white/70 hover:text-white"}`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => { setMode("register"); resetMessages(); }}
              className={`rounded-xl px-4 py-2 text-sm font-semibold transition-all ${mode === "register" ? "bg-white text-slate-900" : "text-white/70 hover:text-white"}`}
            >
              Create Account
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {mode === "register" && (
              <div>
                <label className="block text-white/80 text-sm font-semibold mb-2">Full Name</label>
                <div className="relative">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-indigo-300" />
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Your name"
                    required
                    className="w-full bg-white/10 border border-white/20 text-white placeholder-white/30 rounded-xl pl-12 pr-4 py-3 outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-400/30 transition-all"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-white/80 text-sm font-semibold mb-2">Email</label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-indigo-300" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@company.com"
                  required
                  className="w-full bg-white/10 border border-white/20 text-white placeholder-white/30 rounded-xl pl-12 pr-4 py-3 outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-400/30 transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-white/80 text-sm font-semibold mb-2">Password</label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-indigo-300" />
                <input
                  type={showPw ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  required
                  className="w-full bg-white/10 border border-white/20 text-white placeholder-white/30 rounded-xl pl-12 pr-12 py-3 outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-400/30 transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPw((v) => !v)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-white/40 hover:text-white transition-colors"
                >
                  {showPw ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {error && (
              <div className="bg-red-500/20 border border-red-400/40 text-red-200 text-sm rounded-xl px-4 py-3">
                {error}
              </div>
            )}

            {success && (
              <div className="bg-green-500/20 border border-green-400/40 text-green-100 text-sm rounded-xl px-4 py-3">
                {success}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-bold rounded-xl hover:shadow-lg hover:shadow-indigo-500/40 disabled:opacity-50 transition-all text-base"
            >
              {loading
                ? mode === "login" ? "Signing in..." : "Creating account..."
                : mode === "login" ? "Sign In" : "Create Account"}
            </button>
          </form>

          {mode === "login" && (
            <>
              <div className="flex items-center gap-3 my-6">
                <div className="flex-1 h-px bg-white/20" />
                <span className="text-white/40 text-xs font-bold tracking-widest">DEMO ACCOUNTS</span>
                <div className="flex-1 h-px bg-white/20" />
              </div>

              <div className="grid grid-cols-3 gap-3">
                {DEMO.map((acc) => (
                  <button
                    key={acc.role}
                    onClick={() => doLogin(acc.email, acc.pw)}
                    disabled={loading}
                    className="bg-white/10 hover:bg-white/20 border border-white/20 hover:border-white/40 text-white rounded-2xl py-3 px-2 transition-all disabled:opacity-50 text-center"
                  >
                    <div className="text-2xl mb-1">{acc.emoji}</div>
                    <div className="text-xs font-bold">{acc.role}</div>
                    <div className="text-xs text-white/50 mt-0.5 truncate">{acc.pw}</div>
                  </button>
                ))}
              </div>
            </>
          )}
        </div>

        <p className="text-center text-white/25 text-xs mt-6">
          AI AgenticHire 2026
        </p>
      </div>
    </div>
  );
};

export default LoginPage;
