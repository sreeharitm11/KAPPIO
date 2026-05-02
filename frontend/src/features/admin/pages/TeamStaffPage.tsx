import { useEffect, useState } from "react";
import { UserPlus, Users, Copy, Check } from "lucide-react";
import { createTeamInvitation, fetchTeamMembers } from "../api/usersApi";
import type { StaffMember, UserRole } from "../../../shared/types/api";
import { format } from "date-fns";

export default function TeamStaffPage() {
  const [team, setTeam] = useState<StaffMember[]>([]);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [role, setRole] = useState<UserRole>("DELIVERY");
  const [lastInviteUrl, setLastInviteUrl] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const load = async () => {
    try {
      setLoadError(null);
      setTeam(await fetchTeamMembers());
    } catch (e) {
      setLoadError(e instanceof Error ? e.message : "Unable to load team");
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setLastInviteUrl(null);
    setSaving(true);
    try {
      const result = await createTeamInvitation({
        fullName,
        email,
        phone,
        role: role === "STAFF" ? "STAFF" : "DELIVERY",
      });
      setLastInviteUrl(result.inviteUrl);
      setFullName("");
      setEmail("");
      setPhone("");
      await load();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Could not send invitation");
    } finally {
      setSaving(false);
    }
  };

  const copyInvite = async () => {
    if (!lastInviteUrl) return;
    await navigator.clipboard.writeText(lastInviteUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="p-8 max-w-5xl">
      <div className="mb-8">
        <h1 className="text-2xl text-[#2C1810] flex items-center gap-2">
          <Users className="w-8 h-8 text-[#6B4423]" />
          Team &amp; delivery
        </h1>
        <p className="text-[#6B5D52] mt-2">
          Invite staff or delivery partners by email — they set their own password via a secure link (no plain-text passwords).
        </p>
      </div>

      <div className="grid gap-8 lg:grid-cols-5">
        <section className="lg:col-span-2 bg-white rounded-2xl border-2 border-[#E8DCC8] p-6 shadow-md">
          <h2 className="text-lg text-[#2C1810] mb-1 flex items-center gap-2">
            <UserPlus className="w-5 h-5 text-[#B85C3E]" />
            Invite team member
          </h2>
          <p className="text-sm text-[#6B5D52] mb-6">
            Choose role, then share the one-time link from your café (copy/paste or internal chat).
          </p>

          {formError && (
            <div className="mb-4 text-sm text-red-700 bg-red-50 border border-red-200 rounded-xl px-4 py-3">
              {formError}
            </div>
          )}

          {lastInviteUrl && (
            <div className="mb-4 p-4 rounded-xl bg-[#6B9B8F]/10 border border-[#6B9B8F]/30">
              <p className="text-xs text-[#2C1810] font-medium mb-2">Invitation link (expires in 7 days)</p>
              <p className="text-xs break-all text-[#6B5D52] mb-3">{lastInviteUrl}</p>
              <button
                type="button"
                onClick={() => void copyInvite()}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[#6B9B8F] text-white text-sm hover:bg-[#4A7C71]"
              >
                {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                {copied ? "Copied" : "Copy link"}
              </button>
            </div>
          )}

          <form onSubmit={(e) => void handleInvite(e)} className="space-y-4">
            <div>
              <label className="block text-sm text-[#2C1810] mb-2">Role</label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value as UserRole)}
                className="w-full px-4 py-3 rounded-xl border-2 border-[#E8DCC8] bg-[#FBF8F3]"
              >
                <option value="DELIVERY">Delivery partner</option>
                <option value="STAFF">Staff</option>
              </select>
            </div>
            <div>
              <label className="block text-sm text-[#2C1810] mb-2">Full name</label>
              <input
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
                className="w-full px-4 py-3 rounded-xl border-2 border-[#E8DCC8] bg-[#FBF8F3]"
              />
            </div>
            <div>
              <label className="block text-sm text-[#2C1810] mb-2">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full px-4 py-3 rounded-xl border-2 border-[#E8DCC8] bg-[#FBF8F3]"
              />
            </div>
            <div>
              <label className="block text-sm text-[#2C1810] mb-2">Mobile</label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                required
                minLength={10}
                className="w-full px-4 py-3 rounded-xl border-2 border-[#E8DCC8] bg-[#FBF8F3]"
              />
            </div>
            <button
              type="submit"
              disabled={saving}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-[#B85C3E] to-[#D4A574] text-white font-medium disabled:opacity-60"
            >
              {saving ? "Creating invitation…" : "Send invitation"}
            </button>
          </form>
        </section>

        <section className="lg:col-span-3 bg-white rounded-2xl border-2 border-[#E8DCC8] shadow-md overflow-hidden">
          <div className="p-6 border-b border-[#E8DCC8]">
            <h2 className="text-lg text-[#2C1810]">Staff overview</h2>
            <p className="text-sm text-[#6B5D52]">Admin, staff, and delivery accounts.</p>
          </div>
          {loadError && (
            <p className="p-6 text-sm text-red-600">{loadError}</p>
          )}
          {!loadError && (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-[#FBF8F3] border-b border-[#E8DCC8]">
                  <tr>
                    <th className="text-left px-6 py-3 text-[#6B5D52] font-medium">Name</th>
                    <th className="text-left px-6 py-3 text-[#6B5D52] font-medium">Role</th>
                    <th className="text-left px-6 py-3 text-[#6B5D52] font-medium">Contact</th>
                    <th className="text-left px-6 py-3 text-[#6B5D52] font-medium">Status</th>
                    <th className="text-left px-6 py-3 text-[#6B5D52] font-medium">Added</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E8DCC8]">
                  {team.map((member) => (
                    <tr key={member.id} className="hover:bg-[#FBF8F3]/80">
                      <td className="px-6 py-4 text-[#2C1810]">{member.fullName}</td>
                      <td className="px-6 py-4">
                        <span className="inline-flex px-2 py-1 rounded-lg bg-[#E8DCC8]/60 text-[#2C1810] text-xs font-medium">
                          {member.role}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-[#6B5D52]">
                        <div>{member.email}</div>
                        <div className="text-xs">{member.phone}</div>
                      </td>
                      <td className="px-6 py-4">
                        {member.pendingInvite ? (
                          <span className="text-amber-700 text-xs">Invite pending</span>
                        ) : member.active ? (
                          <span className="text-green-700">Active</span>
                        ) : (
                          <span className="text-slate-500">Inactive</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-[#6B5D52] whitespace-nowrap">
                        {format(new Date(member.createdAt), "MMM d, yyyy")}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {team.length === 0 && !loadError && (
                <p className="p-8 text-center text-[#6B5D52]">No team members yet.</p>
              )}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
