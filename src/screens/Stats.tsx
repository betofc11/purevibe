import React, { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { useAuth } from '../hooks/useAuth';
import { collection, query, orderBy, getDocs, addDoc, limit } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { StrengthRecord, BodyMetricsHistory } from '../types';
import { Trophy, TrendingUp, Zap, Dumbbell, Activity, Scale } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';

export const Stats: React.FC = () => {
  const { user } = useAuth();
  const [records, setRecords] = useState<StrengthRecord[]>([]);
  const [metricsHistory, setMetricsHistory] = useState<BodyMetricsHistory[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      const fetchData = async () => {
        try {
          // Fetch Strength Records
          const strengthQ = query(
            collection(db, `users/${user.uid}/strengthRecords`),
            orderBy('date', 'desc')
          );
          const strengthSnap = await getDocs(strengthQ);
          setRecords(strengthSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as StrengthRecord)));

          // Fetch Body Metrics History
          const metricsQ = query(
            collection(db, `users/${user.uid}/bodyMetricsHistory`),
            orderBy('date', 'asc')
          );
          const metricsSnap = await getDocs(metricsQ);
          setMetricsHistory(metricsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as BodyMetricsHistory)));

        } catch (err) {
          handleFirestoreError(err, OperationType.LIST, `users/${user.uid}/stats`);
        } finally {
          setLoading(false);
        }
      };
      fetchData();
    }
  }, [user]);

  const bests = {
    Squat: records.filter(r => r.exercise === 'Squat').sort((a, b) => b.weight - a.weight)[0]?.weight || 0,
    Bench: records.filter(r => r.exercise === 'Bench Press').sort((a, b) => b.weight - a.weight)[0]?.weight || 0,
    Deadlift: records.filter(r => r.exercise === 'Deadlift').sort((a, b) => b.weight - a.weight)[0]?.weight || 0,
  };

  const strengthChartData = records.slice().reverse().map(r => ({
    date: new Date(r.date).toLocaleDateString('es-ES', { day: '2-digit', month: 'short' }),
    weight: r.weight,
    exercise: r.exercise
  }));

  const metricsChartData = metricsHistory.map(m => ({
    date: new Date(m.date).toLocaleDateString('es-ES', { day: '2-digit', month: 'short' }),
    weight: m.weight,
    bodyFat: m.bodyFat,
    muscleMass: m.muscleMass
  }));

  return (
    <div className="space-y-10">
      <section>
        <div className="flex items-end justify-between mb-2">
          <h1 className="font-headline font-black text-5xl tracking-tighter leading-none">
            Tus <span className="text-primary">Estadísticas</span>
          </h1>
          <div className="bg-surface-container rounded-full px-4 py-2 flex items-center gap-2">
            <Zap size={14} className="text-secondary fill-secondary" />
            <span className="font-label text-[10px] uppercase tracking-widest text-on-surface-variant font-bold">PureVibe Elite</span>
          </div>
        </div>
        <p className="text-on-surface-variant text-lg max-w-md">Tu evolución capturada en datos. Supera tus límites.</p>
      </section>

      {/* Body Metrics Progression */}
      <section className="space-y-6">
        <h2 className="font-headline text-2xl flex items-center gap-2">
          <Scale className="text-primary" size={24} />
          Evolución Corporal
        </h2>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-surface-container-high rounded-xl p-8 border border-primary/5">
            <h3 className="font-headline text-xl mb-8">Peso y Composición</h3>
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={metricsChartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#262626" vertical={false} />
                  <XAxis dataKey="date" stroke="#acabaa" fontSize={10} tickLine={false} axisLine={false} />
                  <YAxis stroke="#acabaa" fontSize={10} tickLine={false} axisLine={false} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#191a1a', border: 'none', borderRadius: '8px' }}
                  />
                  <Line type="monotone" dataKey="weight" name="Peso (kg)" stroke="#a68cff" strokeWidth={3} dot={{ fill: '#a68cff' }} />
                  <Line type="monotone" dataKey="muscleMass" name="Músculo (kg)" stroke="#00daf3" strokeWidth={3} dot={{ fill: '#00daf3' }} />
                  <Line type="monotone" dataKey="bodyFat" name="Grasa (%)" stroke="#ffb1c1" strokeWidth={3} dot={{ fill: '#ffb1c1' }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
          <div className="space-y-4">
            <div className="bg-surface-container rounded-xl p-6 border border-primary/5">
              <span className="font-label text-xs uppercase tracking-widest text-on-surface-variant font-bold">Último Peso</span>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="font-headline font-black text-4xl">{metricsHistory[metricsHistory.length - 1]?.weight || '--'}</span>
                <span className="text-primary font-bold">KG</span>
              </div>
            </div>
            <div className="bg-surface-container rounded-xl p-6 border border-primary/5">
              <span className="font-label text-xs uppercase tracking-widest text-on-surface-variant font-bold">Última Grasa</span>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="font-headline font-black text-4xl">{metricsHistory[metricsHistory.length - 1]?.bodyFat || '--'}</span>
                <span className="text-secondary font-bold">%</span>
              </div>
            </div>
            <div className="bg-surface-container rounded-xl p-6 border border-primary/5">
              <span className="font-label text-xs uppercase tracking-widest text-on-surface-variant font-bold">Último Músculo</span>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="font-headline font-black text-4xl">{metricsHistory[metricsHistory.length - 1]?.muscleMass || '--'}</span>
                <span className="text-tertiary font-bold">KG</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="space-y-6">
        <h2 className="font-headline text-2xl flex items-center gap-2">
          <Dumbbell className="text-primary" size={24} />
          Fuerza y Récords
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <motion.div 
            whileHover={{ y: -4 }}
            className="bg-surface-container-low rounded-xl p-8 relative overflow-hidden group border border-primary/5"
          >
            <div className="absolute -right-10 -bottom-10 opacity-5 group-hover:opacity-10 transition-opacity">
              <Dumbbell size={200} className="text-primary" />
            </div>
            <div className="relative z-10">
              <span className="font-label text-sm uppercase tracking-widest text-primary font-bold">Sentadilla</span>
              <h3 className="font-headline text-2xl text-on-surface mt-1">Personal Best</h3>
            </div>
            <div className="relative z-10 flex items-baseline gap-4 mt-8">
              <span className="font-headline font-black text-8xl leading-none tracking-tighter">{bests.Squat}</span>
              <span className="font-headline text-3xl text-primary font-bold">KG</span>
            </div>
          </motion.div>

          <div className="space-y-4">
            <div className="bg-surface-container rounded-xl p-6 border border-primary/5 flex justify-between items-center">
              <div>
                <span className="font-label text-xs uppercase tracking-widest text-on-surface-variant font-bold">Banca</span>
                <div className="flex items-baseline gap-2 mt-1">
                  <span className="font-headline font-black text-4xl">{bests.Bench}</span>
                  <span className="text-primary font-bold">KG</span>
                </div>
              </div>
              <TrendingUp className="text-primary" />
            </div>
            <div className="bg-surface-container rounded-xl p-6 border border-primary/5 flex justify-between items-center">
              <div>
                <span className="font-label text-xs uppercase tracking-widest text-on-surface-variant font-bold">Peso Muerto</span>
                <div className="flex items-baseline gap-2 mt-1">
                  <span className="font-headline font-black text-4xl">{bests.Deadlift}</span>
                  <span className="text-secondary font-bold">KG</span>
                </div>
              </div>
              <Zap className="text-secondary fill-secondary" />
            </div>
          </div>
        </div>
      </section>

      {/* Chart */}
      <section className="bg-surface-container-high rounded-xl p-8 border border-primary/5">
        <h3 className="font-headline text-xl mb-8">Progresión de Fuerza</h3>
        <div className="h-48 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={strengthChartData}>
              <defs>
                <linearGradient id="colorWeight" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#a68cff" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#a68cff" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#262626" vertical={false} />
              <XAxis dataKey="date" stroke="#acabaa" fontSize={10} tickLine={false} axisLine={false} />
              <Tooltip 
                contentStyle={{ backgroundColor: '#191a1a', border: 'none', borderRadius: '8px' }}
                itemStyle={{ color: '#a68cff' }}
              />
              <Area type="monotone" dataKey="weight" stroke="#a68cff" fillOpacity={1} fill="url(#colorWeight)" strokeWidth={3} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </section>

      {/* Milestones */}
      <section className="space-y-4">
        <h2 className="font-headline text-2xl mb-6 flex items-center gap-2">
          Hitos Logrados
          <span className="w-10 h-[2px] bg-primary-dim rounded-full"></span>
        </h2>
        <div className="space-y-3">
          <div className="bg-surface-container rounded-xl p-5 flex items-center gap-6 group hover:bg-surface-container-high transition-all">
            <div className="w-14 h-14 rounded-full bg-tertiary/10 flex items-center justify-center text-tertiary">
              <Trophy size={28} className="fill-tertiary" />
            </div>
            <div className="flex-grow">
              <h4 className="font-bold">Club de los 500kg</h4>
              <p className="text-sm text-on-surface-variant">Suma total superó los 500kg.</p>
            </div>
            <div className="text-right">
              <span className="font-label text-[10px] text-primary block mb-1 uppercase">Logrado</span>
              <span className="text-xs text-on-surface-variant">Hace 2 días</span>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
