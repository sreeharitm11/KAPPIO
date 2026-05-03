import { Coffee, Instagram, MessageCircle, Phone, MapPin } from "lucide-react";
import MapplsMap from "./MapplsMap";

export default function Footer() {
  return (
    <footer className="bg-[#1A0F0A] border-t border-white/10 pt-16 pb-8 px-6 text-[#C4B5A8]">
      <div className="max-w-6xl mx-auto grid md:grid-cols-4 gap-12 mb-12">
        <div className="space-y-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#D4A574]/20 flex items-center justify-center border border-[#D4A574]/40">
              <Coffee className="w-5 h-5 text-[#D4A574]" />
            </div>
            <span className="text-xl font-medium tracking-tight text-white">Kappio Cafe®</span>
          </div>
          <p className="text-sm leading-relaxed">
            near BGS Medical College, BEL Layout, Nagarur Colony, Bengaluru
          </p>
        </div>

        <div className="space-y-6">
          <h3 className="text-white font-medium">Connect</h3>
          <div className="flex flex-col gap-3">
            <a 
              href="https://wa.me/917012206714" 
              target="_blank" 
              rel="noopener noreferrer"
              className="flex items-center gap-3 text-sm hover:text-white transition-colors"
            >
              <MessageCircle className="w-4 h-4 text-[#25D366]" />
              Support
            </a>
            <a 
              href="https://www.instagram.com/cafekappio/" 
              target="_blank" 
              rel="noopener noreferrer"
              className="flex items-center gap-3 text-sm hover:text-white transition-colors"
            >
              <Instagram className="w-4 h-4 text-[#ee2a7b]" />
              @cafekappio
            </a>
          </div>
        </div>

        <div className="md:col-span-2">
          <div className="bg-white/5 rounded-3xl p-4 border border-white/10 h-64 overflow-hidden relative group">
            <div className="absolute top-4 left-4 z-10 bg-[#2C1810]/80 backdrop-blur-md px-3 py-1.5 rounded-full flex items-center gap-2 border border-[#D4A574]/30 shadow-2xl">
              <MapPin className="w-3.5 h-3.5 text-[#D4A574]" />
              <span className="text-[10px] font-bold text-[#FBF8F3] uppercase tracking-widest">3D Real-time View</span>
            </div>
            <div className="w-full h-full grayscale-[0.3] brightness-75 hover:grayscale-0 hover:brightness-100 transition-all duration-700">
              <MapplsMap 
                center={{ lat: 13.0854, lng: 77.4329 }} 
                zoom={17} 
                interactive={false}
                tilt={45}
                heading={30}
              />
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto pt-8 border-t border-white/5 text-center text-[10px] uppercase tracking-[0.2em] opacity-40">
        <p>© {new Date().getFullYear()} Kappio Cafe® · Artisanal Excellence</p>
      </div>
    </footer>
  );
}
