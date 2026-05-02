import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router";
import { Coffee, Eye, EyeOff } from "lucide-react";
import { loginWithPassword } from "../api/authApi";
import { authStore } from "../../../shared/lib/auth";
import type { UserRole } from "../../../shared/types/api";

export default function CustomerLoginPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const next = searchParams.get("next") ?? "/menu";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const session = await loginWithPassword(email, password);
      const role = session.user.role as UserRole;
      if (role !== "CUSTOMER") {
        authStore.clear();
        setError("This login is for customers. Team members use their dedicated sign-in URLs.");
        return;
      }
      navigate(next, { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Sign in failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FBF8F3] flex flex-col items-center justify-center p-6">
      <Link to="/" className="flex items-center gap-2 text-[#2C1810] mb-10 hover:opacity-80">
        <Coffee className="w-8 h-8 text-[#6B4423]" />
        <span className="text-xl font-medium">Kappio Café</span>
      </Link>

      <div className="w-full max-w-md bg-white rounded-2xl border-2 border-[#E8DCC8] shadow-xl p-8">
        <h1 className="text-2xl text-[#2C1810] mb-1">Welcome back</h1>
        <p className="text-sm text-[#6B5D52] mb-8">Sign in to track orders and checkout faster.</p>

        {error && (
          <div className="mb-4 text-sm text-red-700 bg-red-50 border border-red-200 rounded-xl px-4 py-3">
            {error}
          </div>
        )}

        <form onSubmit={(e) => void handleSubmit(e)} className="space-y-5">
          <div>
            <label className="block text-sm text-[#2C1810] mb-2">Email</label>
            <input
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-4 py-3 rounded-xl border-2 border-[#E8DCC8] bg-[#FBF8F3] focus:outline-none focus:ring-2 focus:ring-[#D4A574]"
            />
          </div>
          <div>
            <label className="block text-sm text-[#2C1810] mb-2">Password</label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                className="w-full px-4 py-3 rounded-xl border-2 border-[#E8DCC8] bg-[#FBF8F3] focus:outline-none focus:ring-2 focus:ring-[#D4A574]"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-[#2C1810]"
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 rounded-xl bg-gradient-to-r from-[#B85C3E] to-[#D4A574] text-white font-medium hover:shadow-lg disabled:opacity-60"
          >
            {loading ? "Signing in…" : "Sign in"}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-[#6B5D52]">
          New here?{" "}
          <Link to="/signup" className="text-[#B85C3E] font-medium hover:underline">
            Create an account
          </Link>
        </p>
      </div>
    </div>
  );
}
