import React, { useEffect, useState, useMemo } from 'react';
import { motion } from 'motion/react';
import { useAuth } from '../hooks/useAuth';
import { getVibeAdvice } from '../services/geminiService';
import { Utensils, Wheat, Droplets, Leaf, Check, Timer, Sparkles, Trash2, ArrowRight } from 'lucide-react';
import { collection, query, where, onSnapshot, limit, doc, updateDoc } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { DailyLog, Meal } from '../types';
import { formatNum, getLocalDateString } from '../lib/utils';
import { Link } from 'react-router-dom';

export const Dashboard: React.FC = () => {
  const { profile, user } = useAuth();
  const [advice, setAdvice] = useState<string>('Analizando tu vibra...');
  const [dailyLog, setDailyLog] = useState<DailyLog | null>(null);

  useEffect(() => {
    if (user) {
      const today = getLocalDateString();
      const logRef = doc(db, `users/${user.uid}/dailyLogs`, today);
      
      const unsubscribe = onSnapshot(logRef, (docSnap) => {
        if (docSnap.exists()) {
          setDailyLog(docSnap.data() as DailyLog);
        } else {
          // If log doesn't exist for today, it starts at 0 naturally
          setDailyLog(null);
        }
      }, (error) => {
        handleFirestoreError(error, OperationType.GET, `users/${user.uid}/dailyLogs/${today}`);
      });

      return () => unsubscribe();
    }
  }, [user]);

  useEffect(() => {
    if (dailyLog && profile?.macroGoals) {
      getVibeAdvice(dailyLog.macros, profile.macroGoals, profile.bodyMetrics).then(setAdvice);
    } else {
      setAdvice('¡Sube tu plan nutricional para recibir consejos personalizados!');
    }
  }, [dailyLog, profile]);

  const macros = dailyLog?.macros || { protein: 0, carbs: 0, fats: 0, calories: 0 };
  const goals = profile?.macroGoals || { protein: 160, carbs: 210, fats: 65, calories: 2000 };

  const remaining = {
    protein: Math.max(0, goals.protein - macros.protein),
    carbs: Math.max(0, goals.carbs - macros.carbs),
    fats: Math.max(0, goals.fats - macros.fats),
    calories: Math.max(0, goals.calories - macros.calories)
  };

  const firstName = profile?.displayName?.split(' ')[0] || 'Viber';
  const needsOnboarding = !profile?.bodyMetrics?.weight || !profile?.macroGoals;

  const ratio = goals.calories > 0 ? macros.calories / goals.calories : 0;
  const greetingCategory = ratio >= 0.95 ? 'done' : ratio >= 0.1 ? 'progress' : 'start';

  const greetingPrefix = useMemo(() => {
    const phrases = {
      start: ["¡Qué buena nota,", "¡A darle con todo,", "¡Hoy es un gran día,", "¡Con toda la actitud,"],
      progress: ["¡Vas súper bien,", "¡Excelente ritmo,", "¡Sigamos sumando,", "¡Buena energía,"],
      done: ["¡Energía a tope,", "¡Día coronado,", "¡Bien alimentado,", "¡Cerrando con fuerza,"]
    };
    const list = phrases[greetingCategory];
    return list[Math.floor(Math.random() * list.length)];
  }, [greetingCategory]);

  const todayDisplay = new Date().toLocaleDateString('es-ES', { 
    weekday: 'long', 
    day: 'numeric', 
    month: 'long' 
  });

  const handleDeleteMeal = async (mealToDelete: Meal) => {
    if (!user || !dailyLog) return;
    
    const today = getLocalDateString();
    const logRef = doc(db, `users/${user.uid}/dailyLogs`, today);
    
    try {
      const updatedMeals = dailyLog.meals.filter(m => m.id !== mealToDelete.id);
      const updatedMacros = {
        calories: Math.max(0, dailyLog.macros.calories - mealToDelete.macros.calories),
        protein: Math.max(0, dailyLog.macros.protein - mealToDelete.macros.protein),
        carbs: Math.max(0, dailyLog.macros.carbs - mealToDelete.macros.carbs),
        fats: Math.max(0, dailyLog.macros.fats - mealToDelete.macros.fats),
      };

      await updateDoc(logRef, {
        meals: updatedMeals,
        macros: updatedMacros
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `users/${user.uid}/dailyLogs/${today}`);
    }
  };

  return (
    <div className="space-y-8">
      <section>
        <div className="flex justify-between items-start">
          <div>
            <h1 className="font-headline text-4xl font-extrabold tracking-tight leading-tight">
              {greetingPrefix} <span className="text-primary">{firstName}</span>!
            </h1>
            <p className="text-on-surface-variant mt-2 font-medium capitalize">{todayDisplay}</p>
          </div>
          <div className="bg-surface-container-high px-3 py-1 rounded-full border border-outline-variant/20">
            <span className="text-[10px] font-bold uppercase tracking-widest text-primary">Hoy</span>
          </div>
        </div>
      </section>

      {/* Onboarding Prompt */}
      {needsOnboarding && (
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-primary/10 border border-primary/20 rounded-2xl p-6 flex items-center justify-between gap-4"
        >
          <div className="flex-1">
            <h3 className="font-bold text-primary">¡Completa tu perfil!</h3>
            <p className="text-sm text-on-surface-variant">Necesitamos tu peso y objetivos para darte consejos precisos.</p>
          </div>
          <Link to="/profile" className="bg-primary text-on-primary p-3 rounded-full shadow-lg hover:scale-105 transition-transform">
            <ArrowRight size={20} />
          </Link>
        </motion.div>
      )}

      {/* Vibe Graphic (Simplified Ring) */}
      <section className="flex flex-col items-center py-4">
        <div className="relative w-64 h-64 flex items-center justify-center">
          <svg className="absolute inset-0 w-full h-full rotate-[-90deg]" viewBox="0 0 100 100">
            <circle cx="50" cy="50" r="44" fill="none" stroke="#1f2020" strokeWidth="6" />
            <motion.circle 
              cx="50" cy="50" r="44" fill="none" stroke="#ffb1c1" strokeWidth="8" 
              strokeDasharray="276" 
              initial={{ strokeDashoffset: 276 }}
              animate={{ strokeDashoffset: 276 - (276 * Math.min(1, macros.protein / goals.protein)) }}
              strokeLinecap="round"
            />
            <motion.circle 
              cx="50" cy="50" r="34" fill="none" stroke="#00daf3" strokeWidth="6" 
              strokeDasharray="213" 
              initial={{ strokeDashoffset: 213 }}
              animate={{ strokeDashoffset: 213 - (213 * Math.min(1, macros.carbs / goals.carbs)) }}
              strokeLinecap="round"
            />
            <motion.circle 
              cx="50" cy="50" r="24" fill="none" stroke="#7c4dff" strokeWidth="4" 
              strokeDasharray="150" 
              initial={{ strokeDashoffset: 150 }}
              animate={{ strokeDashoffset: 150 - (150 * Math.min(1, macros.fats / goals.fats)) }}
              strokeLinecap="round"
            />
          </svg>
          <div className="text-center z-10">
            <span className="text-on-surface-variant font-label text-[10px] uppercase tracking-widest">Restante</span>
            <div className="font-headline font-extrabold text-5xl">
              {formatNum(remaining.calories)}<span className="text-xl text-primary">kcal</span>
            </div>
          </div>
        </div>
      </section>

      {/* AI Advice */}
      <section className="bg-surface-container-high rounded-xl p-6 border border-primary/10 relative overflow-hidden">
        <div className="flex items-start gap-4 relative z-10">
          <div className="bg-primary/20 p-2 rounded-lg text-primary">
            <Sparkles size={20} />
          </div>
          <p className="text-on-surface leading-relaxed font-medium italic">
            "{advice}"
          </p>
        </div>
        <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 blur-3xl -z-0"></div>
      </section>

      {/* Macros Grid */}
      <section className="grid grid-cols-2 gap-4">
        <div className="bg-tertiary-container/20 rounded-xl p-5 flex flex-col justify-between aspect-square border border-tertiary/20">
          <Utensils className="text-tertiary" size={32} />
          <div>
            <p className="text-on-surface-variant font-label text-[10px] uppercase font-bold tracking-widest">Proteína</p>
            <p className="text-on-surface font-headline text-3xl font-extrabold">{formatNum(macros.protein)}g</p>
            <p className="text-[10px] text-on-surface-variant mt-1">Faltan: {formatNum(remaining.protein)}g</p>
          </div>
        </div>
        <div className="bg-secondary/10 rounded-xl p-5 flex flex-col justify-between aspect-square border border-secondary/20">
          <Wheat className="text-secondary" size={32} />
          <div>
            <p className="text-on-surface-variant font-label text-[10px] uppercase font-bold tracking-widest">Carbos</p>
            <p className="text-on-surface font-headline text-3xl font-extrabold">{formatNum(macros.carbs)}g</p>
            <p className="text-[10px] text-on-surface-variant mt-1">Faltan: {formatNum(remaining.carbs)}g</p>
          </div>
        </div>
        <div className="bg-primary/10 rounded-xl p-5 flex flex-col justify-between aspect-square border border-primary/20">
          <Droplets className="text-primary" size={32} />
          <div>
            <p className="text-on-surface-variant font-label text-[10px] uppercase font-bold tracking-widest">Grasas</p>
            <p className="text-on-surface font-headline text-3xl font-extrabold">{formatNum(macros.fats)}g</p>
            <p className="text-[10px] text-on-surface-variant mt-1">Faltan: {formatNum(remaining.fats)}g</p>
          </div>
        </div>
        <div className="bg-surface-container-highest rounded-xl p-5 flex flex-col justify-between aspect-square border border-outline-variant/20">
          <Droplets className="text-secondary fill-secondary/20" size={32} />
          <div>
            <p className="text-on-surface-variant font-label text-[10px] uppercase font-bold tracking-widest">Agua</p>
            <p className="text-on-surface font-headline text-3xl font-extrabold">{formatNum(dailyLog?.waterIntake || 0)}<span className="text-lg text-on-surface-variant ml-1">ml</span></p>
          </div>
        </div>
      </section>

      {/* Meals List */}
      <section className="space-y-4">
        <h3 className="font-headline font-bold text-xl">Comidas de Hoy</h3>
        {dailyLog?.meals && dailyLog.meals.length > 0 ? (
          <div className="space-y-3">
            {dailyLog.meals.map((meal) => (
              <div key={meal.id} className="bg-surface-container p-4 rounded-xl flex items-center gap-4 border border-outline-variant/10 group">
                {meal.imageUrl ? (
                  <img src={meal.imageUrl} alt={meal.name} className="w-16 h-16 rounded-lg object-cover" referrerPolicy="no-referrer" />
                ) : (
                  <div className="w-16 h-16 rounded-lg bg-surface-container-high flex items-center justify-center text-primary">
                    <Utensils size={24} />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="font-bold truncate">{meal.name}</p>
                  <p className="text-xs text-on-surface-variant">
                    {new Date(meal.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
                <div className="text-right flex items-center gap-3">
                  <div>
                    <p className="font-bold text-primary">{formatNum(meal.macros.calories)} kcal</p>
                    <p className="text-[10px] text-on-surface-variant">
                      P: {formatNum(meal.macros.protein)}g | C: {formatNum(meal.macros.carbs)}g | G: {formatNum(meal.macros.fats)}g
                    </p>
                  </div>
                  <button 
                    onClick={() => handleDeleteMeal(meal)}
                    className="p-2 text-on-surface-variant hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-surface-container/50 border border-dashed border-outline-variant/30 rounded-xl p-8 text-center">
            <Utensils className="mx-auto text-on-surface-variant/30 mb-3" size={32} />
            <p className="text-on-surface-variant text-sm">Aún no has registrado comidas hoy.</p>
            <p className="text-[10px] text-on-surface-variant/60 mt-1 uppercase tracking-widest font-bold">Toca el botón + para empezar</p>
          </div>
        )}
      </section>

      {/* Daily Goals */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-headline font-bold text-xl">Objetivos del Día</h3>
          <span className="text-on-surface-variant text-xs">Por IA PureVibe</span>
        </div>
        <div className="space-y-3">
          <div className="flex items-center gap-4 bg-surface-container p-4 rounded-xl group hover:bg-surface-container-high transition-all">
            <div className="w-10 h-10 rounded-full border-2 border-primary flex items-center justify-center text-primary">
              <Check size={20} />
            </div>
            <div className="flex-1">
              <p className="font-bold">Prioridad Proteica</p>
              <p className="text-xs text-on-surface-variant">Consumir 40g de proteína antes de las 11:00 AM</p>
            </div>
          </div>
          <div className="flex items-center gap-4 bg-surface-container p-4 rounded-xl group hover:bg-surface-container-high transition-all">
            <div className="w-10 h-10 rounded-full border-2 border-outline-variant flex items-center justify-center text-outline-variant">
              <Droplets size={20} />
            </div>
            <div className="flex-1">
              <p className="font-bold">Hidratación Hipertónica</p>
              <p className="text-xs text-on-surface-variant">Añadir electrolitos a tu botella de entrenamiento</p>
            </div>
          </div>
          <div className="flex items-center gap-4 bg-surface-container p-4 rounded-xl group hover:bg-surface-container-high transition-all opacity-60">
            <div className="w-10 h-10 rounded-full border-2 border-outline-variant flex items-center justify-center text-outline-variant">
              <Timer size={20} />
            </div>
            <div className="flex-1">
              <p className="font-bold">Ayuno Intermitente</p>
              <p className="text-xs text-on-surface-variant">Ventana de alimentación finaliza a las 8:00 PM</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
