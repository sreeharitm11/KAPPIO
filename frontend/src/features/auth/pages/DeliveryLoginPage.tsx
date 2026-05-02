import { useState } from "react";
import { Link, useNavigate } from "react-router";
import { Coffee, Truck } from "lucide-react";
import { loginWithPassword } from "../api/authApi";
import { authStore } from "../../../shared/lib/auth";

export default function DeliveryLoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const session = await loginWithPassword(email, password);
      if (session.user.role !== "DELIVERY_PARTNER") {
        authStore.clear();
        setError("This portal is for delivery partners only.");
        return;
      }
      navigate("/deliverypartner", { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Sign in failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#2C1810] to-[#4A2C1A] flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-md bg-[#FBF8F3] rounded-2xl border-2 border-[#D4A574]/40 shadow-2xl p-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-12 h-12 rounded-xl bg-[#2C1810] flex items-center justify-center">
            <Truck className="w-6 h-6 text-[#D4A574]" />
          </div>
          <div>
            <h1 className="text-xl font-semibold text-[#2C1810]">Delivery partner</h1>
            <p className="text-xs text-[#6B5D52]">Kappio Café · Assigned orders</p>
          </div>
        </div>

        <p className="text-sm text-[#6B5D52] mb-6 mt-4">Team access only.</p>

        {error && (
          <div className="mb-4 text-sm text-red-700 bg-red-50 border border-red-200 rounded-xl px-4 py-3">
            {error}
          </div>
        )}

        <form onSubmit={(e) => void handleSubmit(e)} className="space-y-4">
          <div>
            <label className="block text-sm text-[#2C1810] mb-2">Email</label>
            <input
              type="email"
              autoComplete="username"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-4 py-3 rounded-xl border-2 border-[#E8DCC8] focus:outline-none focus:ring-2 focus:ring-[#6B4423]"
            />
          </div>
          <div>
            <label className="block text-sm text-[#2C1810] mb-2">Password</label>
            <input
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full px-4 py-3 rounded-xl border-2 border-[#E8DCC8] focus:outline-none focus:ring-2 focus:ring-[#6B4423]"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 rounded-xl bg-[#2C1810] text-[#FBF8F3] font-medium hover:bg-[#3D2418] disabled:opacity-60"
          >
            {loading ? "Signing in…" : "View my deliveries"}
          </button>
        </form>

        <Link
          to="/"
          className="mt-8 flex items-center justify-center gap-2 text-sm text-[#6B5D52] hover:text-[#2C1810]"
        >
          <Coffee className="w-4 h-4" />
          Back to café home
        </Link>
      </div>
    </div>
  );
}
