import { useEffect, useState } from "react";
import { UserPlus, Users, Copy, Check, Trash2, Edit2, X, Save, AlertTriangle } from "lucide-react";
import { createTeamInvitation, fetchTeamMembers, deleteTeamMember, updateTeamMember } from "../api/usersApi";
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
  const [aadhaar, setAadhaar] = useState("");
  const [doj, setDoj] = useState("");
  const [emergencyContact, setEmergencyContact] = useState("");
  const [role, setRole] = useState<UserRole>("DELIVERY");
  const [lastInviteUrl, setLastInviteUrl] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  
  // Edit State
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<StaffMember>>({});

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
        aadhaar: aadhaar || undefined,
        doj: doj || undefined,
        emergencyContact: emergencyContact || undefined,
      } as any);
      setLastInviteUrl(result.inviteUrl);
      setFullName("");
      setEmail("");
      setPhone("");
      setAadhaar("");
      setDoj("");
      setEmergencyContact("");
      await load();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Could not send invitation");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to deactivate ${name}?`)) return;
    try {
      await deleteTeamMember(id);
      await load();
    } catch (err) {
      alert("Failed to delete member");
    }
  };

  const startEdit = (member: StaffMember) => {
    setEditingId(member.id);
    setEditForm({ ...member });
  };

  const handleUpdate = async () => {
    if (!editingId) return;
    try {
      await updateTeamMember(editingId, editForm);
      setEditingId(null);
      await load();
    } catch (err) {
      alert("Failed to update member");
    }
  };

  const copyInvite = async () => {
    if (!lastInviteUrl) return;
    await navigator.clipboard.writeText(lastInviteUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl text-[#2C1810] font-black flex items-center gap-3">
            <Users className="w-10 h-10 text-[#6B4423]" />
            Staff & Delivery Partners
          </h1>
          <p className="text-[#6B5D52] mt-2 font-medium">
            Manage your Kappio® team, roles, and compliance documents.
          </p>
        </div>
      </div>

      <div className="grid gap-8 lg:grid-cols-12">
        {/* INVITE FORM */}
        <section className="lg:col-span-4 bg-white rounded-3xl border-2 border-[#E8DCC8] p-8 shadow-xl">
          <h2 className="text-xl font-bold text-[#2C1810] mb-2 flex items-center gap-2">
            <UserPlus className="w-6 h-6 text-[#B85C3E]" />
            Add Team Member
          </h2>
          <p className="text-sm text-[#6B5D52] mb-8 font-medium">
            Invite new members with mandatory compliance fields.
          </p>

          {formError && (
            <div className="mb-6 text-sm text-red-700 bg-red-50 border border-red-200 rounded-2xl px-5 py-4 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 flex-shrink-0" />
              {formError}
            </div>
          )}

          {lastInviteUrl && (
            <div className="mb-6 p-5 rounded-2xl bg-[#6B9B8F]/10 border-2 border-[#6B9B8F]/30 animate-in fade-in slide-in-from-top-2 duration-300">
              <p className="text-xs text-[#2C1810] font-bold uppercase tracking-widest mb-2">Invitation link (Ready)</p>
              <p className="text-xs break-all text-[#6B5D52] mb-4 bg-white/50 p-2 rounded-lg font-mono">{lastInviteUrl}</p>
              <button
                type="button"
                onClick={() => void copyInvite()}
                className="w-full inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-[#6B9B8F] text-white text-sm font-bold hover:bg-[#4A7C71] shadow-lg shadow-[#6B9B8F]/20 transition-all"
              >
                {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                {copied ? "Copied Successfully" : "Copy Link to Clipboard"}
              </button>
            </div>
          )}

          <form onSubmit={(e) => void handleInvite(e)} className="space-y-5">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-[#6B5D52] uppercase tracking-widest mb-2">Role</label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value as UserRole)}
                  className="w-full px-4 py-3.5 rounded-xl border-2 border-[#E8DCC8] bg-[#FBF8F3] focus:border-[#D4A574] outline-none font-bold text-[#2C1810]"
                >
                  <option value="DELIVERY">Delivery Partner</option>
                  <option value="STAFF">Cafe Staff</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-[#6B5D52] uppercase tracking-widest mb-2">Full Name</label>
                <input
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  required
                  placeholder="E.g. Sreehari"
                  className="w-full px-4 py-3.5 rounded-xl border-2 border-[#E8DCC8] bg-[#FBF8F3] focus:border-[#D4A574] outline-none font-bold text-[#2C1810]"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-[#6B5D52] uppercase tracking-widest mb-2">Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder="staff@kappio.com"
                  className="w-full px-4 py-3.5 rounded-xl border-2 border-[#E8DCC8] bg-[#FBF8F3] focus:border-[#D4A574] outline-none font-bold text-[#2C1810]"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-[#6B5D52] uppercase tracking-widest mb-2">Mobile</label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  required
                  placeholder="9876543210"
                  className="w-full px-4 py-3.5 rounded-xl border-2 border-[#E8DCC8] bg-[#FBF8F3] focus:border-[#D4A574] outline-none font-bold text-[#2C1810]"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-[#6B5D52] uppercase tracking-widest mb-2">Aadhaar Number (12 digits)</label>
              <input
                value={aadhaar}
                onChange={(e) => setAadhaar(e.target.value)}
                maxLength={12}
                placeholder="0000 0000 0000"
                className="w-full px-4 py-3.5 rounded-xl border-2 border-[#E8DCC8] bg-[#FBF8F3] focus:border-[#D4A574] outline-none font-bold text-[#2C1810]"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-[#6B5D52] uppercase tracking-widest mb-2">Date of Joining</label>
                <input
                  type="date"
                  value={doj}
                  onChange={(e) => setDoj(e.target.value)}
                  className="w-full px-4 py-3.5 rounded-xl border-2 border-[#E8DCC8] bg-[#FBF8F3] focus:border-[#D4A574] outline-none font-bold text-[#2C1810]"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-[#6B5D52] uppercase tracking-widest mb-2">Emergency Contact</label>
                <input
                  type="tel"
                  value={emergencyContact}
                  onChange={(e) => setEmergencyContact(e.target.value)}
                  placeholder="Contact No."
                  className="w-full px-4 py-3.5 rounded-xl border-2 border-[#E8DCC8] bg-[#FBF8F3] focus:border-[#D4A574] outline-none font-bold text-[#2C1810]"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={saving}
              className="w-full py-4 rounded-2xl bg-gradient-to-r from-[#2C1810] to-[#B85C3E] text-white font-black text-lg shadow-xl shadow-[#B85C3E]/20 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-60 disabled:grayscale"
            >
              {saving ? "Generating Secure Link…" : "Generate Invite Link"}
            </button>
          </form>
        </section>

        {/* STAFF LIST */}
        <section className="lg:col-span-8 bg-white rounded-3xl border-2 border-[#E8DCC8] shadow-xl overflow-hidden">
          <div className="p-8 border-b border-[#E8DCC8] bg-[#FBF8F3]/50 flex justify-between items-center">
            <div>
              <h2 className="text-xl font-bold text-[#2C1810]">Team Directory</h2>
              <p className="text-sm text-[#6B5D52] font-medium">Overview of all registered staff and delivery partners.</p>
            </div>
            <div className="bg-white px-4 py-2 rounded-xl border border-[#E8DCC8] shadow-sm">
              <span className="text-xs font-bold text-[#6B5D52] uppercase tracking-widest">Active Members: </span>
              <span className="text-lg font-black text-[#B85C3E]">{team.filter(t => t.active).length}</span>
            </div>
          </div>
          
          {loadError && (
            <div className="p-8 text-center">
              <p className="text-red-600 font-bold">{loadError}</p>
            </div>
          )}

          {!loadError && (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-[#FBF8F3] border-b border-[#E8DCC8]">
                    <th className="text-left px-8 py-4 text-[#6B5D52] font-bold uppercase tracking-widest text-[10px]">Staff Member</th>
                    <th className="text-left px-8 py-4 text-[#6B5D52] font-bold uppercase tracking-widest text-[10px]">Role & Contact</th>
                    <th className="text-left px-8 py-4 text-[#6B5D52] font-bold uppercase tracking-widest text-[10px]">Compliance Info</th>
                    <th className="text-left px-8 py-4 text-[#6B5D52] font-bold uppercase tracking-widest text-[10px]">Status</th>
                    <th className="text-right px-8 py-4 text-[#6B5D52] font-bold uppercase tracking-widest text-[10px]">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E8DCC8]">
                  {team.map((member) => (
                    <tr key={member.id} className="hover:bg-[#FBF8F3]/40 transition-colors group">
                      <td className="px-8 py-6">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-[#E8DCC8]/50 flex items-center justify-center text-[#2C1810] font-black">
                            {member.fullName.charAt(0)}
                          </div>
                          <div>
                            {editingId === member.id ? (
                              <input 
                                className="border-2 border-[#D4A574] rounded px-2 py-1 outline-none"
                                value={editForm.fullName || ""}
                                onChange={e => setEditForm({...editForm, fullName: e.target.value})}
                              />
                            ) : (
                              <p className="font-bold text-[#2C1810] text-base">{member.fullName}</p>
                            )}
                            <p className="text-[10px] text-[#9E8E81] uppercase font-bold tracking-tighter">Added {format(new Date(member.createdAt), "dd MMM yyyy")}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-8 py-6">
                        <span className={`inline-flex px-2 py-0.5 rounded-lg text-[9px] font-black uppercase tracking-widest mb-2 ${
                          member.role === "ADMIN" ? "bg-red-100 text-red-700" : "bg-[#D4A574]/20 text-[#6B4423]"
                        }`}>
                          {member.role}
                        </span>
                        <div className="text-[#6B5D52] font-medium leading-tight">
                          {member.email}
                          <br/>
                          <span className="text-[#2C1810]">{member.phone}</span>
                        </div>
                      </td>
                      <td className="px-8 py-6 text-xs text-[#6B5D52]">
                        <div className="space-y-1">
                          <p><strong>Aadhaar:</strong> {member.aadhaar || "—"}</p>
                          <p><strong>DOJ:</strong> {member.doj ? format(new Date(member.doj), "dd-MM-yyyy") : "—"}</p>
                          <p><strong>Emergency:</strong> {member.emergencyContact || "—"}</p>
                        </div>
                      </td>
                      <td className="px-8 py-6">
                        {member.pendingInvite ? (
                          <span className="flex items-center gap-1 text-amber-600 font-bold text-xs uppercase tracking-tight">
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-600 animate-pulse" />
                            Pending
                          </span>
                        ) : member.active ? (
                          <span className="flex items-center gap-1 text-green-600 font-bold text-xs uppercase tracking-tight">
                            <span className="w-1.5 h-1.5 rounded-full bg-green-600" />
                            Active
                          </span>
                        ) : (
                          <span className="flex items-center gap-1 text-slate-400 font-bold text-xs uppercase tracking-tight">
                            <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
                            Inactive
                          </span>
                        )}
                      </td>
                      <td className="px-8 py-6 text-right">
                        <div className="flex justify-end gap-2">
                          {editingId === member.id ? (
                            <>
                              <button 
                                onClick={handleUpdate}
                                className="p-2 bg-green-500 text-white rounded-lg hover:bg-green-600 shadow-md"
                              >
                                <Save className="w-4 h-4" />
                              </button>
                              <button 
                                onClick={() => setEditingId(null)}
                                className="p-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 shadow-md"
                              >
                                <X className="w-4 h-4" />
                              </button>
                            </>
                          ) : (
                            <>
                              <button 
                                onClick={() => startEdit(member)}
                                className="p-2.5 bg-white border-2 border-[#E8DCC8] text-[#6B5D52] rounded-xl hover:border-[#D4A574] hover:text-[#D4A574] transition-all"
                              >
                                <Edit2 className="w-4 h-4" />
                              </button>
                              {member.role !== "ADMIN" && (
                                <button 
                                  onClick={() => handleDelete(member.id, member.fullName)}
                                  className="p-2.5 bg-white border-2 border-[#E8DCC8] text-[#B85C3E] rounded-xl hover:border-red-500 hover:text-red-500 transition-all"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              )}
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {team.length === 0 && !loadError && (
                <div className="p-16 text-center">
                  <Users className="w-16 h-16 text-[#E8DCC8] mx-auto mb-4" />
                  <p className="text-[#6B5D52] font-bold text-lg">No Team Members Found</p>
                  <p className="text-sm text-[#9E8E81]">Start by inviting staff or delivery partners using the form.</p>
                </div>
              )}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
