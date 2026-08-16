import React, { useState } from "react";
import { loginAdmin, logoutAdmin } from "../services/authService";
import Button from "../components/ui/Button";

export default function AdminLogin({ onLoginSuccess }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email.trim() || !password) {
      setError("Please enter your admin email and password.");
      return;
    }

    try {
      setLoading(true);
      setError("");

      const { user, isAuthorized } = await loginAdmin(email, password);

      if (!isAuthorized) {
        // Sign out unauthorized user immediately so session does not linger
        await logoutAdmin();
        setError("This account is authenticated but is not authorized for the Admin Portal.");
        return;
      }

      if (onLoginSuccess) {
        onLoginSuccess(user);
      }
    } catch (err) {
      console.error("Admin sign-in failed:", err);
      const code = err.code || "";
      if (
        code === "auth/invalid-credential" ||
        code === "auth/user-not-found" ||
        code === "auth/wrong-password" ||
        code === "auth/invalid-email"
      ) {
        setError("Incorrect email or password.");
      } else if (code === "auth/too-many-requests") {
        setError("Too many failed attempts. Please wait a few moments and try again.");
      } else if (code === "auth/network-request-failed") {
        setError("Unable to connect to the authentication service. Please try again.");
      } else {
        setError("Unable to connect to the authentication service. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 sm:p-6 text-slate-900">
      <div className="w-full max-w-md bg-white rounded-2xl border border-slate-200 shadow-sm p-6 sm:p-8 space-y-5">
        {/* Brand header */}
        <div className="text-center space-y-1.5">
          <div className="w-9 h-9 mx-auto rounded-xl bg-blue-600 flex items-center justify-center text-white font-bold text-sm shadow-2xs">
            CV
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-950 tracking-tight">CV Rise</h1>
            <p className="text-xs text-slate-500 font-medium">Admin Workspace Portal</p>
          </div>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-xs text-rose-700 font-medium leading-relaxed">
            {error}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold uppercase tracking-wider text-slate-600 block">
              Admin Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="name@cvrise.com"
              required
              disabled={loading}
              autoComplete="email"
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-100 disabled:bg-slate-50 transition"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold uppercase tracking-wider text-slate-600 block">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••••••"
              required
              disabled={loading}
              autoComplete="current-password"
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-100 disabled:bg-slate-50 transition"
            />
          </div>

          <Button
            type="submit"
            variant="primary"
            className="w-full"
            loading={loading}
          >
            Sign In to Admin Workspace
          </Button>
        </form>

        {/* Footer */}
        <div className="pt-3 border-t border-slate-100 text-center">
          <p className="text-2xs text-slate-400">
            Protected area. Authorized administrative operations only.
          </p>
        </div>
      </div>
    </div>
  );
}
