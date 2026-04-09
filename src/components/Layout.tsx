import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Sparkles, ClipboardList, BarChart3, Dumbbell, Settings, Plus, Droplets, Utensils, Scale } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { cn } from '../lib/utils';
import { motion, AnimatePresence } from 'motion/react';

export const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { profile } = useAuth();
  const location = useLocation();
  const [isFabOpen, setIsFabOpen] = useState(false);

  const navItems = [
    { name: 'Vibe', path: '/', icon: Sparkles },
    { name: 'Plan', path: '/plan', icon: ClipboardList },
    { name: 'Stats', path: '/stats', icon: BarChart3 },
    { name: 'Coach', path: '/profile', icon: Dumbbell },
  ];

  const fabOptions = [
    { name: 'Comida', icon: Utensils, color: 'bg-tertiary', textColor: 'text-on-tertiary' },
    { name: 'Agua', icon: Droplets, color: 'bg-secondary', textColor: 'text-on-secondary' },
    { name: 'Peso', icon: Scale, color: 'bg-primary', textColor: 'text-on-primary' },
    { name: 'Récord', icon: Dumbbell, color: 'bg-surface-container-highest', textColor: 'text-on-surface' },
  ];

  return (
    <div className="min-h-screen bg-background text-on-background font-body relative">
      {/* Top Bar */}
      <header className="fixed top-0 w-full z-50 bg-background/80 backdrop-blur-xl border-b border-outline-variant/20 h-16 flex items-center justify-between px-6">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full overflow-hidden border border-primary/20 bg-surface-container">
            {profile?.photoURL ? (
              <img src={profile.photoURL} alt="Profile" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-primary/10 text-primary">
                {profile?.displayName?.[0] || 'U'}
              </div>
            )}
          </div>
          <span className="text-primary font-headline font-extrabold text-2xl tracking-tight">PureVibe</span>
        </div>
        <button className="text-primary hover:bg-surface-container-high p-2 rounded-full transition-colors">
          <Settings size={24} />
        </button>
      </header>

      {/* Main Content */}
      <main className="pt-20 pb-32 px-6 max-w-2xl mx-auto">
        {children}
      </main>

      {/* FAB Menu Overlay */}
      <AnimatePresence>
        {isFabOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-background/80 backdrop-blur-sm z-40 flex items-end justify-end pr-6 pb-40"
            onClick={() => setIsFabOpen(false)}
          >
            <div className="flex flex-col items-end gap-4" onClick={e => e.stopPropagation()}>
              {fabOptions.map((option, index) => (
                <motion.button
                  key={option.name}
                  initial={{ opacity: 0, y: 20, scale: 0.8 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 20, scale: 0.8 }}
                  transition={{ delay: index * 0.05 }}
                  className="flex items-center gap-4 group"
                  onClick={() => {
                    setIsFabOpen(false);
                    // TODO: Open specific modal based on option in future iterations
                    alert(`Próximamente: Registrar ${option.name}`);
                  }}
                >
                  <span className="font-bold text-sm bg-surface-container-high px-4 py-2 rounded-xl shadow-lg border border-outline-variant/20">{option.name}</span>
                  <div className={cn("w-14 h-14 rounded-full flex items-center justify-center shadow-lg transition-transform group-hover:scale-110", option.color, option.textColor)}>
                    <option.icon size={24} />
                  </div>
                </motion.button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* FAB Button */}
      <div className="fixed bottom-28 right-6 z-50">
        <button 
          onClick={() => setIsFabOpen(!isFabOpen)}
          className={cn(
            "w-16 h-16 rounded-full flex items-center justify-center shadow-[0_0_30px_rgba(166,140,255,0.3)] transition-all duration-300",
            isFabOpen ? "bg-surface-container-highest text-on-surface rotate-45" : "bg-primary text-on-primary hover:scale-105"
          )}
        >
          <Plus size={32} />
        </button>
      </div>

      {/* Bottom Nav */}
      <nav className="fixed bottom-0 left-0 w-full z-50 bg-background/80 backdrop-blur-xl border-t border-outline-variant/20 rounded-t-[3rem] px-4 pb-8 pt-3 flex justify-around items-center">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <Link
              key={item.name}
              to={item.path}
              className={cn(
                "flex flex-col items-center justify-center transition-all duration-300",
                isActive ? "bg-primary text-on-primary rounded-full px-6 py-2 scale-105" : "text-on-surface-variant hover:text-secondary px-4 py-2"
              )}
            >
              <item.icon size={24} />
              <span className="font-medium text-[11px] uppercase tracking-wider mt-1">{item.name}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
};
