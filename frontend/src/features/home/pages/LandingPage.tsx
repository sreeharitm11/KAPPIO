import { ArrowRight, Coffee, Leaf, ShieldCheck, MapPin, Zap, Star, Menu as MenuIcon, X } from "lucide-react";
import { Link } from "react-router";
import { useState, useEffect } from "react";
import Footer from "../../../shared/components/Footer";

export default function LandingPage() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <div className="min-h-screen bg-[#FBF8F3] text-[#2C1810] selection:bg-[#B85C3E] selection:text-white overflow-x-hidden">
      {/* ── STICKY NAVIGATION ── */}
      <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
        scrolled ? "bg-white/80 backdrop-blur-xl border-b border-[#E8DCC8] py-4" : "bg-transparent py-6"
      }`}>
        <div className="max-w-7xl mx-auto px-6 flex items-center justify-between">
          <div className="flex items-center gap-3 group cursor-pointer">
            <div className="w-10 h-10 rounded-xl bg-[#2C1810] flex items-center justify-center transition-transform group-hover:rotate-12">
              <Coffee className="w-5 h-5 text-[#D4A574]" />
            </div>
            <span className="text-xl font-black tracking-tighter text-[#2C1810]">Kappio Café®</span>
          </div>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-8 text-sm font-bold uppercase tracking-widest text-[#6B5D52]">
            <Link to="/menu" className="hover:text-[#B85C3E] transition-colors">Menu</Link>
            <Link to="/login" className="hover:text-[#B85C3E] transition-colors">Sign in</Link>
            <Link
              to="/signup"
              className="px-6 py-3 rounded-xl bg-[#2C1810] text-white hover:bg-[#B85C3E] transition-all hover:shadow-xl hover:shadow-[#B85C3E]/20"
            >
              Order Now
            </Link>
          </div>

          {/* Mobile Menu Toggle */}
          <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="md:hidden p-2 text-[#2C1810]">
            {isMenuOpen ? <X className="w-6 h-6" /> : <MenuIcon className="w-6 h-6" />}
          </button>
        </div>

        {/* Mobile Dropdown */}
        {isMenuOpen && (
          <div className="md:hidden absolute top-full left-0 right-0 bg-white border-b border-[#E8DCC8] p-6 animate-in slide-in-from-top-4 duration-300">
            <div className="flex flex-col gap-6 font-bold text-lg uppercase tracking-widest">
              <Link to="/menu" onClick={() => setIsMenuOpen(false)}>Menu</Link>
              <Link to="/login" onClick={() => setIsMenuOpen(false)}>Sign in</Link>
              <Link to="/signup" className="text-[#B85C3E]" onClick={() => setIsMenuOpen(false)}>Get Started</Link>
            </div>
          </div>
        )}
      </nav>

      {/* ── HERO SECTION ── */}
      <section className="relative pt-32 pb-20 lg:pt-48 lg:pb-32 overflow-hidden">
        {/* Background Accents */}
        <div className="absolute -top-24 -right-24 w-96 h-96 bg-[#D4A574]/10 rounded-full blur-[100px]" />
        <div className="absolute top-1/2 -left-24 w-64 h-64 bg-[#B85C3E]/10 rounded-full blur-[80px]" />

        <div className="max-w-7xl mx-auto px-6 grid lg:grid-cols-2 gap-16 items-center">
          <div className="relative z-10 text-center lg:text-left">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#B85C3E]/10 text-[#B85C3E] text-xs font-black uppercase tracking-widest mb-8">
              <Star className="w-3.5 h-3.5 fill-[#B85C3E]" />
              Artisanal Quality Since 2024
            </div>
            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-black leading-[1.05] tracking-tight text-[#2C1810] mb-8">
              Freshly Roasted,<br />
              <span className="text-[#B85C3E]">Artfully Served.</span>
            </h1>
            <p className="text-lg sm:text-xl text-[#6B5D52] max-w-xl mx-auto lg:mx-0 mb-10 leading-relaxed font-medium">
              Discover the perfect blend of specialty coffee and fresh bites. Crafted by artisans, delivered with precision.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4">
              <Link
                to="/menu"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-3 px-10 py-5 rounded-2xl bg-[#2C1810] text-white font-black text-lg hover:bg-[#B85C3E] transition-all hover:scale-[1.02] shadow-2xl shadow-[#2C1810]/20"
              >
                Browse Menu
                <ArrowRight className="w-5 h-5" />
              </Link>
              <div className="flex items-center gap-4 text-sm font-bold text-[#6B5D52] mt-4 sm:mt-0">
                <div className="flex -space-x-2">
                  {[1,2,3].map(i => <div key={i} className="w-8 h-8 rounded-full border-2 border-white bg-[#E8DCC8]" />)}
                </div>
                <span>Joined by 2k+ locals</span>
              </div>
            </div>
          </div>

          <div className="relative lg:pl-10">
            <div className="relative rounded-[3rem] overflow-hidden shadow-2xl shadow-[#2C1810]/20 aspect-square sm:aspect-[4/5] lg:aspect-square">
              <img 
                src="/hero_coffee_artisanal_1777807262533.png" 
                alt="Artisanal Coffee"
                className="w-full h-full object-cover transform hover:scale-110 transition-transform duration-1000"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#2C1810]/40 to-transparent" />
              
              {/* Floating Card */}
              <div className="absolute bottom-8 left-8 right-8 bg-white/10 backdrop-blur-md border border-white/20 p-6 rounded-3xl animate-in fade-in slide-in-from-bottom-4 duration-1000 delay-300">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-[#D4A574] flex items-center justify-center shadow-lg">
                    <Zap className="w-6 h-6 text-[#2C1810]" />
                  </div>
                  <div>
                    <p className="text-white font-bold text-lg">Fast Delivery</p>
                    <p className="text-white/70 text-sm font-medium">Average arrival in 15 mins</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── FEATURES SECTION ── */}
      <section className="py-24 bg-[#2C1810] text-white overflow-hidden relative">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-20">
            <h2 className="text-4xl lg:text-5xl font-black mb-6">Why Kappio?</h2>
            <p className="text-[#D4C4B8] max-w-2xl mx-auto font-medium">We obsess over the details so you can enjoy the moment.</p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8">
            <div className="p-10 rounded-[2.5rem] bg-white/5 border border-white/10 hover:bg-white/10 transition-colors group">
              <div className="w-14 h-14 rounded-2xl bg-[#D4A574]/20 flex items-center justify-center mb-8 transition-transform group-hover:scale-110">
                <Leaf className="w-7 h-7 text-[#D4A574]" />
              </div>
              <h3 className="text-2xl font-black mb-4">Ethically Sourced</h3>
              <p className="text-[#D4C4B8] leading-relaxed">Direct-trade beans roasted in small batches to preserve unique flavor profiles.</p>
            </div>

            <div className="p-10 rounded-[2.5rem] bg-white/5 border border-white/10 hover:bg-white/10 transition-colors group">
              <div className="w-14 h-14 rounded-2xl bg-[#B85C3E]/20 flex items-center justify-center mb-8 transition-transform group-hover:scale-110">
                <ShieldCheck className="w-7 h-7 text-[#B85C3E]" />
              </div>
              <h3 className="text-2xl font-black mb-4">Quality Checked</h3>
              <p className="text-[#D4C4B8] leading-relaxed">Every order is sealed and verified for temperature and freshness before dispatch.</p>
            </div>

            <div className="p-10 rounded-[2.5rem] bg-white/5 border border-white/10 hover:bg-white/10 transition-colors group sm:col-span-2 lg:col-span-1">
              <div className="w-14 h-14 rounded-2xl bg-[#6B9B8F]/20 flex items-center justify-center mb-8 transition-transform group-hover:scale-110">
                <MapPin className="w-7 h-7 text-[#A8D4C8]" />
              </div>
              <h3 className="text-2xl font-black mb-4">Hyper-Local</h3>
              <p className="text-[#D4C4B8] leading-relaxed">Operating in selective zones to guarantee lightning-fast delivery within minutes.</p>
            </div>
          </div>
        </div>
      </section>

      {/* ── CTA SECTION ── */}
      <section className="py-24 relative overflow-hidden">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <div className="p-12 sm:p-20 rounded-[3rem] bg-white border-2 border-[#E8DCC8] shadow-2xl relative">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 w-20 h-20 bg-[#D4A574] rounded-full flex items-center justify-center shadow-xl">
              <Star className="w-10 h-10 text-[#2C1810]" />
            </div>
            <h2 className="text-4xl sm:text-5xl font-black text-[#2C1810] mb-8">Ready for a fresh cup?</h2>
            <p className="text-lg text-[#6B5D52] mb-10 max-w-lg mx-auto font-medium">
              Join our community today and get 15% off your first order. Fresh artisanal coffee is just a click away.
            </p>
            <Link
              to="/signup"
              className="inline-flex items-center gap-3 px-10 py-5 rounded-2xl bg-[#2C1810] text-white font-black text-xl hover:bg-[#B85C3E] transition-all hover:scale-[1.05] shadow-2xl shadow-[#B85C3E]/20"
            >
              Get Started
              <ArrowRight className="w-6 h-6" />
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
