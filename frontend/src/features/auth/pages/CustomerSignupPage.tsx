import { useState } from "react";
import { Link, useNavigate } from "react-router";
import { Coffee } from "lucide-react";
import { registerCustomer } from "../api/authApi";

export default function CustomerSignupPage() {
  const navigate = useNavigate();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await registerCustomer({ fullName, email, phone, password });
      navigate("/menu", { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not create account");
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
        <h1 className="text-2xl text-[#2C1810] mb-1">Create your account</h1>
        <p className="text-sm text-[#6B5D52] mb-8">Save your details for quicker checkout next time.</p>

        {error && (
          <div className="mb-4 text-sm text-red-700 bg-red-50 border border-red-200 rounded-xl px-4 py-3">
            {error}
          </div>
        )}

        <form onSubmit={(e) => void handleSubmit(e)} className="space-y-4">
          <div>
            <label className="block text-sm text-[#2C1810] mb-2">Full name</label>
            <input
              type="text"
              autoComplete="name"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              required
              minLength={2}
              className="w-full px-4 py-3 rounded-xl border-2 border-[#E8DCC8] bg-[#FBF8F3] focus:outline-none focus:ring-2 focus:ring-[#D4A574]"
            />
          </div>
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
            <label className="block text-sm text-[#2C1810] mb-2">Mobile</label>
            <input
              type="tel"
              autoComplete="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              required
              minLength={10}
              maxLength={30}
              placeholder="+91 98765 43210"
              className="w-full px-4 py-3 rounded-xl border-2 border-[#E8DCC8] bg-[#FBF8F3] focus:outline-none focus:ring-2 focus:ring-[#D4A574]"
            />
          </div>
          <div>
            <label className="block text-sm text-[#2C1810] mb-2">Password</label>
            <input
              type="password"
              autoComplete="new-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              className="w-full px-4 py-3 rounded-xl border-2 border-[#E8DCC8] bg-[#FBF8F3] focus:outline-none focus:ring-2 focus:ring-[#D4A574]"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full mt-2 py-3.5 rounded-xl bg-gradient-to-r from-[#B85C3E] to-[#D4A574] text-white font-medium hover:shadow-lg disabled:opacity-60"
          >
            {loading ? "Creating account…" : "Create account"}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-[#6B5D52]">
          Already have an account?{" "}
          <Link to="/login" className="text-[#B85C3E] font-medium hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
