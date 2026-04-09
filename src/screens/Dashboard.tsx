import React, { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { useAuth } from '../hooks/useAuth';
import { getVibeAdvice } from '../services/geminiService';
import { Utensils, Wheat, Droplets, Leaf, Check, Timer, Sparkles } from 'lucide-react';
import { collection, query, where, getDocs, limit, orderBy } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { DailyLog } from '../types';

export const Dashboard: React.FC = () => {
  const { profile, user } = useAuth();
  const [advice, setAdvice] = useState<string>('Analizando tu vibra...');
  const [dailyLog, setDailyLog] = useState<DailyLog | null>(null);

  useEffect(() => {
    if (user) {
      const fetchLog = async () => {
        try {
          const today = new Date().toISOString().split('T')[0];
          const q = query(
            collection(db, `users/${user.uid}/dailyLogs`),
            where('date', '==', today),
            limit(1)
          );
          const snap = await getDocs(q);
          if (!snap.empty) {
            setDailyLog(snap.docs[0].data() as DailyLog);
          }
        } catch (err) {
          handleFirestoreError(err, OperationType.LIST, `users/${user.uid}/dailyLogs`);
        }
      };
      fetchLog();
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

  return (
    <div className="space-y-8">
      <section>
        <h1 className="font-headline text-4xl font-extrabold tracking-tight leading-tight">
          ¡Qué buena nota, <span className="text-primary">{profile?.displayName?.split(' ')[0]}</span>!
        </h1>
        <p className="text-on-surface-variant mt-2 font-medium">Así va tu vibra de hoy:</p>
      </section>

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
              {remaining.calories}<span className="text-xl text-primary">kcal</span>
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
            <p className="text-on-surface font-headline text-3xl font-extrabold">{macros.protein}g</p>
            <p className="text-[10px] text-on-surface-variant mt-1">Faltan: {remaining.protein}g</p>
          </div>
        </div>
        <div className="bg-secondary/10 rounded-xl p-5 flex flex-col justify-between aspect-square border border-secondary/20">
          <Wheat className="text-secondary" size={32} />
          <div>
            <p className="text-on-surface-variant font-label text-[10px] uppercase font-bold tracking-widest">Carbos</p>
            <p className="text-on-surface font-headline text-3xl font-extrabold">{macros.carbs}g</p>
            <p className="text-[10px] text-on-surface-variant mt-1">Faltan: {remaining.carbs}g</p>
          </div>
        </div>
        <div className="bg-primary/10 rounded-xl p-5 flex flex-col justify-between aspect-square border border-primary/20">
          <Droplets className="text-primary" size={32} />
          <div>
            <p className="text-on-surface-variant font-label text-[10px] uppercase font-bold tracking-widest">Grasas</p>
            <p className="text-on-surface font-headline text-3xl font-extrabold">{macros.fats}g</p>
            <p className="text-[10px] text-on-surface-variant mt-1">Faltan: {remaining.fats}g</p>
          </div>
        </div>
        <div className="bg-surface-container-highest rounded-xl p-5 flex flex-col justify-between aspect-square">
          <Leaf className="text-secondary" size={32} />
          <div>
            <p className="text-on-surface-variant font-label text-[10px] uppercase font-bold tracking-widest">Grasa Corporal</p>
            <p className="text-on-surface font-headline text-3xl font-extrabold">{profile?.bodyMetrics?.bodyFat || '--'}%</p>
          </div>
        </div>
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
