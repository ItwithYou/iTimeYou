import React from 'react';
import { Globe, MessageCircle, Home, Utensils, Map, Bus, Hotel, Plane, ChefHat, Presentation } from 'lucide-react';
import { PERSONAL_CATS, BUSINESS_CATS } from '../hooks/useLang';
import { useNavigate } from 'react-router-dom';

const iconMap = {
  // Personal
  'all': Globe,
  'talking': MessageCircle,
  'home': Home,
  'food': Utensils,
  'guide': Map,
  // Business
  'tours': Bus,
  'hotels': Hotel,
  'flights': Plane,
  'restaurants': ChefHat,
  'seminars': Presentation,
};

export default function CategoryTabs({ activeType, activeCat, onSelectCat, lang }) {
  const navigate = useNavigate();

  const categories = activeType === 'personal' ? PERSONAL_CATS : BUSINESS_CATS;

  return (
    <div className="w-full mb-6">

      <div className="flex flex-nowrap overflow-x-auto hide-scrollbar gap-6 sm:gap-8 px-4 md:px-0 mx-auto w-fit py-2 pb-4">
        {categories.map(cat => {
          const Icon = iconMap[cat.key] || Globe;
          const isActive = activeCat === cat.key;
          
          return (
            <button
              key={cat.key}
              onClick={() => onSelectCat(isActive ? '' : cat.key)}
              className={`flex flex-col items-center flex-shrink-0 transition-all group ${isActive ? 'text-primary' : 'text-muted-foreground hover:text-foreground'}`}
            >
              <div className={`w-12 h-12 rounded-full flex items-center justify-center mb-2 transition-all relative ${
                isActive ? 'bg-primary/10 border-primary shadow-sm text-primary' : 'bg-muted/40 hover:bg-muted/80 text-[#8B7355]'
              }`}>
                <Icon size={22} strokeWidth={1.5} />
                <div className="absolute -top-7 left-1/2 -translate-x-1/2 text-[10px] bg-foreground/90 text-background px-2 py-0.5 rounded opacity-0 group-hover:opacity-100 whitespace-nowrap pointer-events-none transition-opacity shadow-md z-20">
                  {lang === 'lo' ? cat.descLo : cat.descEn}
                </div>
              </div>
              <span className={`text-[11px] font-semibold tracking-wide whitespace-nowrap transition-all ${
                isActive ? 'border-b-[2px] border-primary pb-0.5 text-foreground' : ''
              }`}>
                {lang === 'lo' ? cat.lo : cat.en}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
