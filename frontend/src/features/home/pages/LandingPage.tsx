import { Link } from "react-router";
import { ArrowRight, Coffee, Leaf } from "lucide-react";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-[#2C1810] via-[#4A2C1A] to-[#1A0F0A] text-[#FBF8F3]">
      <header className="max-w-6xl mx-auto px-6 pt-10 pb-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-[#D4A574]/20 flex items-center justify-center border border-[#D4A574]/40">
            <Coffee className="w-6 h-6 text-[#D4A574]" />
          </div>
          <span className="text-xl font-medium tracking-tight">Kappio Café</span>
        </div>
        <div className="flex items-center gap-3 text-sm">
          <Link
            to="/login"
            className="px-4 py-2 rounded-xl text-[#E8DCC8] hover:bg-white/10 transition-colors"
          >
            Sign in
          </Link>
          <Link
            to="/signup"
            className="px-4 py-2 rounded-xl bg-[#D4A574] text-[#2C1810] font-medium hover:bg-[#E8C4A0] transition-colors"
          >
            Create account
          </Link>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 pt-8 pb-24 grid lg:grid-cols-2 gap-16 lg:gap-10 items-center">
        <div>
          <p className="inline-flex items-center gap-2 text-[#D4A574] text-sm font-medium mb-6">
            <Leaf className="w-4 h-4" />
            Small-batch coffee &amp; fresh bites
          </p>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-semibold leading-tight tracking-tight mb-6">
            Order your favourites,
            <span className="block text-[#D4A574] mt-1">delivered to your door.</span>
          </h1>
          <p className="text-lg text-[#C4B5A8] max-w-lg mb-10 leading-relaxed">
            Browse our menu, customise your cart, and pay on delivery. Fast updates from our kitchen
            to your neighbourhood.
          </p>
          <div className="flex flex-wrap gap-4">
            <Link
              to="/menu"
              className="inline-flex items-center gap-2 px-8 py-4 rounded-2xl bg-[#D4A574] text-[#2C1810] font-semibold text-lg hover:bg-[#E8C4A0] transition-all hover:scale-[1.02] shadow-lg shadow-black/20"
            >
              Order now
              <ArrowRight className="w-5 h-5" />
            </Link>
            <Link
              to="/menu"
              className="inline-flex items-center px-8 py-4 rounded-2xl border-2 border-[#D4A574]/50 text-[#FBF8F3] hover:bg-white/5 transition-colors"
            >
              View menu
            </Link>
          </div>
        </div>

        <div className="relative lg:pl-6">
          <div className="absolute inset-0 bg-gradient-to-tr from-[#D4A574]/20 to-transparent rounded-[2rem] blur-3xl" />
          <div className="relative rounded-[2rem] border border-[#D4A574]/30 bg-white/5 backdrop-blur-sm p-8 sm:p-10 shadow-2xl">
            <div className="flex items-start gap-4 mb-8">
              <div className="w-14 h-14 rounded-2xl bg-[#6B9B8F]/30 flex items-center justify-center">
                <Coffee className="w-7 h-7 text-[#A8D4C8]" />
              </div>
              <div>
                <h2 className="text-xl font-medium text-[#FBF8F3] mb-1">Today&apos;s picks</h2>
                <p className="text-[#A89888] text-sm">Roasted in-house, packed with care.</p>
              </div>
            </div>
            <ul className="space-y-4 text-[#D4C4B8] text-sm">
              <li className="flex justify-between border-b border-white/10 pb-3">
                <span>Artisan espresso &amp; filter coffee</span>
                <span className="text-[#D4A574]">Popular</span>
              </li>
              <li className="flex justify-between border-b border-white/10 pb-3">
                <span>Fresh pastries &amp; sandwiches</span>
                <span className="text-[#D4A574]">New</span>
              </li>
              <li className="flex justify-between">
                <span>Scheduled delivery windows</span>
                <span className="text-[#D4A574]">Live</span>
              </li>
            </ul>
          </div>
        </div>
      </main>

      <footer className="border-t border-white/10 py-8 text-center text-sm text-[#8A7A6E]">
        <p>© {new Date().getFullYear()} Kappio Café · Crafted for coffee lovers</p>
      </footer>
    </div>
  );
}
