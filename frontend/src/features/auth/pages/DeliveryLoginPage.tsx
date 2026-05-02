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
      if (session.user.role !== "DELIVERY") {
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
    <div className="min-h-screen bg-gradient-to-b from-slate-900 to-slate-800 flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl p-8 border border-slate-200">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-12 h-12 rounded-xl bg-orange-100 flex items-center justify-center">
            <Truck className="w-6 h-6 text-orange-600" />
          </div>
          <div>
            <h1 className="text-xl font-semibold text-slate-900">Delivery partner</h1>
            <p className="text-xs text-slate-500">Kappio Café · Assigned orders</p>
          </div>
        </div>

        <p className="text-sm text-slate-600 mb-6 mt-4">Team access only.</p>

        {error && (
          <div className="mb-4 text-sm text-red-700 bg-red-50 border border-red-200 rounded-xl px-4 py-3">
            {error}
          </div>
        )}

        <form onSubmit={(e) => void handleSubmit(e)} className="space-y-4">
          <div>
            <label className="block text-sm text-slate-700 mb-2">Email</label>
            <input
              type="email"
              autoComplete="username"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-4 py-3 rounded-xl border-2 border-slate-200 focus:outline-none focus:ring-2 focus:ring-orange-400"
            />
          </div>
          <div>
            <label className="block text-sm text-slate-700 mb-2">Password</label>
            <input
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full px-4 py-3 rounded-xl border-2 border-slate-200 focus:outline-none focus:ring-2 focus:ring-orange-400"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 rounded-xl bg-orange-600 text-white font-medium hover:bg-orange-700 disabled:opacity-60"
          >
            {loading ? "Signing in…" : "View my deliveries"}
          </button>
        </form>

        <Link
          to="/"
          className="mt-8 flex items-center justify-center gap-2 text-sm text-slate-500 hover:text-slate-800"
        >
          <Coffee className="w-4 h-4" />
          Back to café home
        </Link>
      </div>
    </div>
  );
}
