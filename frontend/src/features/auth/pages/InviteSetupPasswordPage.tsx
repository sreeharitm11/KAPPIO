import { useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router";
import { Coffee, KeyRound } from "lucide-react";
import { apiRequest } from "../../../shared/lib/api-client";
import { authStore } from "../../../shared/lib/auth";
import type { SessionUser } from "../../../shared/types/api";

type InvitePreview = {
  valid: boolean;
  fullName: string;
  email: string;
  role: string;
};

export default function InviteSetupPasswordPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get("token") ?? "";

  const [preview, setPreview] = useState<InvitePreview | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!token) {
      setLoadError("Missing invitation token.");
      return;
    }

    const load = async () => {
      try {
        const data = await apiRequest<InvitePreview>(`/auth/invite/${encodeURIComponent(token)}`);
        setPreview(data);
      } catch (e) {
        setLoadError(e instanceof Error ? e.message : "Invalid invitation");
      }
    };

    void load();
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);
    if (password.length < 6) {
      setSubmitError("Password must be at least 6 characters.");
      return;
    }
    if (password !== confirm) {
      setSubmitError("Passwords do not match.");
      return;
    }

    setLoading(true);
    try {
      const data = await apiRequest<{ user: SessionUser }>("/auth/set-password", {
        method: "POST",
        body: JSON.stringify({ token, password }),
      });
      authStore.setSession({ user: data.user });
      const role = data.user.role;
      if (role === "ADMIN") navigate("/admin", { replace: true });
      else if (role === "DELIVERY") navigate("/deliverypartner", { replace: true });
      else if (role === "STAFF") navigate("/admin", { replace: true });
      else navigate("/menu", { replace: true });
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : "Could not set password");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FBF8F3] flex flex-col items-center justify-center p-6">
      <Link to="/" className="flex items-center gap-2 text-[#2C1810] mb-8 hover:opacity-80">
        <Coffee className="w-8 h-8 text-[#6B4423]" />
        <span className="text-xl font-medium">Kappio Café</span>
      </Link>

      <div className="w-full max-w-md bg-white rounded-2xl border-2 border-[#E8DCC8] shadow-xl p-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-12 h-12 rounded-xl bg-[#D4A574]/30 flex items-center justify-center">
            <KeyRound className="w-6 h-6 text-[#6B4423]" />
          </div>
          <div>
            <h1 className="text-xl text-[#2C1810] font-semibold">Set your password</h1>
            <p className="text-xs text-[#6B5D52]">Team invitation · one-time setup</p>
          </div>
        </div>

        {loadError && (
          <p className="mt-4 text-sm text-red-700 bg-red-50 border border-red-200 rounded-xl px-4 py-3">{loadError}</p>
        )}

        {preview && (
          <>
            <p className="text-sm text-[#6B5D52] mt-4 mb-6">
              Hi <span className="font-medium text-[#2C1810]">{preview.fullName}</span> ({preview.email}) — role{" "}
              <span className="font-medium">{preview.role}</span>.
            </p>

            {submitError && (
              <div className="mb-4 text-sm text-red-700 bg-red-50 border border-red-200 rounded-xl px-4 py-3">
                {submitError}
              </div>
            )}

            <form onSubmit={(e) => void handleSubmit(e)} className="space-y-4">
              <div>
                <label className="block text-sm text-[#2C1810] mb-2">New password</label>
                <input
                  type="password"
                  autoComplete="new-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
                  className="w-full px-4 py-3 rounded-xl border-2 border-[#E8DCC8] bg-[#FBF8F3]"
                />
              </div>
              <div>
                <label className="block text-sm text-[#2C1810] mb-2">Confirm password</label>
                <input
                  type="password"
                  autoComplete="new-password"
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  required
                  minLength={6}
                  className="w-full px-4 py-3 rounded-xl border-2 border-[#E8DCC8] bg-[#FBF8F3]"
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 rounded-xl bg-gradient-to-r from-[#B85C3E] to-[#D4A574] text-white font-medium disabled:opacity-60"
              >
                {loading ? "Saving…" : "Activate account"}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
