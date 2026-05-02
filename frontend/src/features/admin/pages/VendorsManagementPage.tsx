import { useEffect, useState } from "react";
import { Plus, Search, Building2, Phone, Mail, FileText, MoreVertical, Edit2, Trash2, ShieldCheck } from "lucide-react";
import { fetchVendors, createVendor, updateVendor, deleteVendor } from "../../vendors/api/vendorsApi";
import type { Vendor } from "../../../shared/types/api";

export default function VendorsManagementPage() {
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentVendor, setCurrentVendor] = useState<Partial<Vendor> | null>(null);

  const loadVendors = async () => {
    try {
      const data = await fetchVendors();
      setVendors(data);
    } catch (err) {
      console.error("Failed to load vendors", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadVendors();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentVendor?.name) return;

    try {
      if (currentVendor.id) {
        await updateVendor(currentVendor.id, currentVendor);
      } else {
        await createVendor(currentVendor);
      }
      setIsModalOpen(false);
      void loadVendors();
    } catch (err) {
      alert("Failed to save vendor");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this vendor?")) return;
    try {
      await deleteVendor(id);
      void loadVendors();
    } catch (err) {
      alert("Failed to delete vendor");
    }
  };

  const filteredVendors = vendors.filter(v => 
    v.name.toLowerCase().includes(search.toLowerCase()) ||
    v.category?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-[#2C1810]">Vendor Management</h1>
          <p className="text-[#6B5D52] mt-1">Track suppliers, GST compliance, and FSSAI details</p>
        </div>
        <button
          onClick={() => {
            setCurrentVendor({});
            setIsModalOpen(true);
          }}
          className="bg-gradient-to-r from-[#B85C3E] to-[#D4A574] text-white px-6 py-3 rounded-2xl flex items-center gap-2 hover:shadow-lg transition-all active:scale-95"
        >
          <Plus className="w-5 h-5" />
          Add New Vendor
        </button>
      </div>

      <div className="relative mb-8">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
        <input
          type="text"
          placeholder="Search by vendor name or category..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-12 pr-4 py-4 bg-white border-2 border-[#E8DCC8] rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#D4A574] focus:border-transparent shadow-sm"
        />
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-pulse">
          {[1, 2, 3].map(i => <div key={i} className="h-64 bg-gray-100 rounded-3xl border border-gray-200" />)}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredVendors.map(vendor => (
            <div key={vendor.id} className="bg-white rounded-3xl border-2 border-[#E8DCC8] p-6 hover:shadow-xl transition-all group relative overflow-hidden">
              <div className="absolute top-0 right-0 p-4 opacity-0 group-hover:opacity-100 transition-opacity">
                <div className="flex gap-2">
                  <button onClick={() => { setCurrentVendor(vendor); setIsModalOpen(true); }} className="p-2 bg-[#FBF8F3] rounded-xl hover:bg-[#E8DCC8] text-[#2C1810]">
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button onClick={() => handleDelete(vendor.id)} className="p-2 bg-red-50 rounded-xl hover:bg-red-100 text-red-600">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="flex items-center gap-4 mb-6">
                <div className="w-14 h-14 bg-gradient-to-br from-[#6B9B8F] to-[#4A7C71] rounded-2xl flex items-center justify-center text-white shadow-lg">
                  <Building2 className="w-7 h-7" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-[#2C1810]">{vendor.name}</h3>
                  <span className="inline-block px-3 py-1 bg-[#6B9B8F]/10 text-[#6B9B8F] text-xs font-bold rounded-full uppercase tracking-wider mt-1">
                    {vendor.category || "General"}
                  </span>
                </div>
              </div>

              <div className="space-y-4 mb-6">
                <div className="flex items-center gap-3 text-sm text-[#6B5D52]">
                  <Phone className="w-4 h-4 text-[#D4A574]" />
                  <span>{vendor.phone || "No phone"}</span>
                </div>
                <div className="flex items-center gap-3 text-sm text-[#6B5D52]">
                  <Mail className="w-4 h-4 text-[#D4A574]" />
                  <span className="truncate">{vendor.email || "No email"}</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 p-4 bg-[#FBF8F3] rounded-2xl border border-[#E8DCC8]">
                <div>
                  <p className="text-[10px] uppercase font-bold text-gray-400 mb-1">GSTIN</p>
                  <p className="text-xs font-mono text-[#2C1810]">{vendor.gstNumber || "N/A"}</p>
                </div>
                <div>
                  <p className="text-[10px] uppercase font-bold text-gray-400 mb-1">FSSAI</p>
                  <p className="text-xs font-mono text-[#2C1810]">{vendor.fssaiNumber || "N/A"}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white w-full max-w-2xl rounded-[2.5rem] shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-300">
            <div className="p-8 border-b border-[#E8DCC8] bg-gradient-to-r from-[#FBF8F3] to-white">
              <h2 className="text-2xl font-bold text-[#2C1810]">
                {currentVendor?.id ? "Edit Vendor" : "Add New Vendor"}
              </h2>
              <p className="text-[#6B5D52]">Enter vendor details and compliance info</p>
            </div>
            
            <form onSubmit={handleSubmit} className="p-8 space-y-6 max-h-[70vh] overflow-y-auto">
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-sm font-bold text-[#2C1810]">Vendor Name *</label>
                  <input
                    required
                    type="text"
                    value={currentVendor?.name || ""}
                    onChange={e => setCurrentVendor({...currentVendor, name: e.target.value})}
                    className="w-full px-4 py-3 rounded-xl border-2 border-[#E8DCC8] focus:ring-2 focus:ring-[#D4A574] outline-none"
                    placeholder="E.g. Fresh Farms Ltd"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-[#2C1810]">Category</label>
                  <input
                    type="text"
                    value={currentVendor?.category || ""}
                    onChange={e => setCurrentVendor({...currentVendor, category: e.target.value})}
                    className="w-full px-4 py-3 rounded-xl border-2 border-[#E8DCC8] focus:ring-2 focus:ring-[#D4A574] outline-none"
                    placeholder="E.g. Dairy, Vegetables"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-[#2C1810]">Contact Person</label>
                  <input
                    type="text"
                    value={currentVendor?.contactPerson || ""}
                    onChange={e => setCurrentVendor({...currentVendor, contactPerson: e.target.value})}
                    className="w-full px-4 py-3 rounded-xl border-2 border-[#E8DCC8] focus:ring-2 focus:ring-[#D4A574] outline-none"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-[#2C1810]">Phone Number</label>
                  <input
                    type="tel"
                    value={currentVendor?.phone || ""}
                    onChange={e => setCurrentVendor({...currentVendor, phone: e.target.value})}
                    className="w-full px-4 py-3 rounded-xl border-2 border-[#E8DCC8] focus:ring-2 focus:ring-[#D4A574] outline-none"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-[#2C1810]">GST Number</label>
                  <input
                    type="text"
                    value={currentVendor?.gstNumber || ""}
                    onChange={e => setCurrentVendor({...currentVendor, gstNumber: e.target.value})}
                    className="w-full px-4 py-3 rounded-xl border-2 border-[#E8DCC8] focus:ring-2 focus:ring-[#D4A574] outline-none font-mono"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-[#2C1810]">FSSAI License</label>
                  <input
                    type="text"
                    value={currentVendor?.fssaiNumber || ""}
                    onChange={e => setCurrentVendor({...currentVendor, fssaiNumber: e.target.value})}
                    className="w-full px-4 py-3 rounded-xl border-2 border-[#E8DCC8] focus:ring-2 focus:ring-[#D4A574] outline-none font-mono"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-[#2C1810]">PAN Card</label>
                  <input
                    type="text"
                    value={currentVendor?.panNumber || ""}
                    onChange={e => setCurrentVendor({...currentVendor, panNumber: e.target.value})}
                    className="w-full px-4 py-3 rounded-xl border-2 border-[#E8DCC8] focus:ring-2 focus:ring-[#D4A574] outline-none font-mono"
                  />
                </div>
              </div>

              <div className="p-6 bg-[#6B9B8F]/5 rounded-3xl border-2 border-[#6B9B8F]/20 space-y-6">
                <h3 className="font-bold text-[#4A7C71] flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5" />
                  Banking & Payments
                </h3>
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-[#2C1810]">Bank Name</label>
                    <input
                      type="text"
                      value={currentVendor?.bankName || ""}
                      onChange={e => setCurrentVendor({...currentVendor, bankName: e.target.value})}
                      className="w-full px-4 py-3 rounded-xl border-2 border-[#E8DCC8] focus:ring-2 focus:ring-[#D4A574] outline-none"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-[#2C1810]">Account Number</label>
                    <input
                      type="text"
                      value={currentVendor?.accountNumber || ""}
                      onChange={e => setCurrentVendor({...currentVendor, accountNumber: e.target.value})}
                      className="w-full px-4 py-3 rounded-xl border-2 border-[#E8DCC8] focus:ring-2 focus:ring-[#D4A574] outline-none"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-[#2C1810]">IFSC Code</label>
                    <input
                      type="text"
                      value={currentVendor?.ifscCode || ""}
                      onChange={e => setCurrentVendor({...currentVendor, ifscCode: e.target.value})}
                      className="w-full px-4 py-3 rounded-xl border-2 border-[#E8DCC8] focus:ring-2 focus:ring-[#D4A574] outline-none"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-[#2C1810]">Payment Terms</label>
                    <input
                      type="text"
                      placeholder="e.g. Net 30, 2% 10"
                      value={currentVendor?.paymentTerms || ""}
                      onChange={e => setCurrentVendor({...currentVendor, paymentTerms: e.target.value})}
                      className="w-full px-4 py-3 rounded-xl border-2 border-[#E8DCC8] focus:ring-2 focus:ring-[#D4A574] outline-none"
                    />
                  </div>
                </div>
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-bold text-[#2C1810]">Address</label>
                <textarea
                  value={currentVendor?.address || ""}
                  onChange={e => setCurrentVendor({...currentVendor, address: e.target.value})}
                  className="w-full px-4 py-3 rounded-xl border-2 border-[#E8DCC8] focus:ring-2 focus:ring-[#D4A574] outline-none h-24 resize-none"
                />
              </div>

              <div className="flex gap-4 pt-4">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 px-6 py-4 rounded-2xl border-2 border-[#E8DCC8] text-[#2C1810] font-bold hover:bg-[#FBF8F3] transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-6 py-4 rounded-2xl bg-gradient-to-r from-[#B85C3E] to-[#D4A574] text-white font-bold hover:shadow-xl transition-all"
                >
                  {currentVendor?.id ? "Update Vendor" : "Create Vendor"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
