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
    <div className="w-full mb-6 px-1 sm:px-4">
      <div className="bg-card/40 backdrop-blur-xl border border-border/50 shadow-lg shadow-black/5 rounded-2xl sm:rounded-3xl p-3 sm:p-6 mx-auto max-w-4xl relative overflow-hidden">
        {/* Subtle glass reflection effect */}
        <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent dark:from-white/5 opacity-50 pointer-events-none" />
        
        <div className="flex justify-between sm:justify-center sm:gap-10 relative z-10 w-full px-0 sm:px-4">
          {categories.map(cat => {
            const Icon = iconMap[cat.key] || Globe;
            const isActive = activeCat === cat.key;
            
            return (
              <button
                key={cat.key}
                onClick={() => onSelectCat(isActive ? '' : cat.key)}
                className={`flex flex-col items-center flex-shrink-0 transition-all duration-300 group ${isActive ? '' : 'hover:-translate-y-1'}`}
              >
                <div className={`w-[38px] h-[38px] sm:w-[52px] sm:h-[52px] rounded-full flex items-center justify-center mb-1.5 sm:mb-2 transition-all duration-300 relative ${
                  isActive 
                    ? 'bg-primary text-primary-foreground shadow-md scale-110' 
                    : 'bg-gradient-to-br from-muted/50 to-muted/20 border border-border/50 text-[#8B7355] group-hover:shadow-sm'
                }`}>
                  <Icon className="w-[16px] h-[16px] sm:w-[22px] sm:h-[22px]" strokeWidth={isActive ? 2.5 : 1.5} />
                  <div className="absolute -top-7 left-1/2 -translate-x-1/2 text-[10px] bg-foreground/90 text-background px-2 py-0.5 rounded opacity-0 group-hover:opacity-100 whitespace-nowrap pointer-events-none transition-opacity shadow-md z-20">
                    {lang === 'lo' ? cat.descLo : cat.descEn}
                  </div>
                </div>
                <span className={`text-[9px] sm:text-[11px] font-semibold tracking-wide whitespace-nowrap transition-all duration-300 ${
                  isActive ? 'text-primary' : 'text-muted-foreground group-hover:text-[#8B7355]'
                }`}>
                  {lang === 'lo' ? cat.lo : cat.en}
                </span>
                
                {isActive && (
                  <div className="h-1 w-1 bg-primary rounded-full mt-1 sm:mt-1.5 absolute -bottom-1 sm:-bottom-2" />
                )}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
