import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { motion } from 'motion/react';
import { Upload, FileText, Camera, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import { analyzeNutritionPlan } from '../services/geminiService';
import { useAuth } from '../hooks/useAuth';
import { doc, setDoc, collection, addDoc } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { formatNum } from '../lib/utils';

export const Plan: React.FC = () => {
  const { user, profile } = useAuth();
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (!file) return;

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const reader = new FileReader();
      reader.onload = async () => {
        const base64 = (reader.result as string).split(',')[1];
        const analysis = await analyzeNutritionPlan(base64, file.type);
        setResult(analysis);

        if (user) {
          // Save nutritional plan and goals to profile
          if (analysis.protein && analysis.carbs && analysis.fats) {
            await setDoc(doc(db, 'users', user.uid), {
              macroGoals: {
                protein: analysis.protein,
                carbs: analysis.carbs,
                fats: analysis.fats,
                calories: analysis.calories
              },
              nutritionalPlan: {
                name: analysis.name,
                calories: analysis.calories,
                protein: analysis.protein,
                carbs: analysis.carbs,
                fats: analysis.fats,
                advice: analysis.advice,
                extractedAt: Date.now()
              }
            }, { merge: true });
          }
        }
        setLoading(false);
      };
      reader.readAsDataURL(file);
    } catch (err: any) {
      console.error(err);
      setError('Error al analizar el archivo. Intenta de nuevo.');
      setLoading(false);
    }
  }, [user]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({ 
    onDrop,
    accept: {
      'image/jpeg': ['.jpeg', '.jpg'],
      'image/png': ['.png'],
      'application/pdf': ['.pdf']
    },
    multiple: false
  } as any);

  const currentPlan = profile?.nutritionalPlan;

  return (
    <div className="space-y-8">
      <section>
        <h1 className="font-headline text-4xl font-extrabold tracking-tight leading-tight">
          Sincroniza tu <span className="text-primary">Plan Nutricional</span>
        </h1>
        <p className="text-on-surface-variant mt-2 font-medium">Optimiza tu rendimiento con PureAI.</p>
      </section>

      <section {...getRootProps()} className="relative group cursor-pointer">
        <input {...getInputProps()} />
        <div className="absolute -inset-1 bg-gradient-to-r from-primary to-secondary rounded-xl blur opacity-10 group-hover:opacity-20 transition duration-1000"></div>
        <div className={`relative bg-surface-container-low border-2 border-dashed rounded-xl p-8 flex flex-col items-center justify-center text-center space-y-4 transition-all ${isDragActive ? 'border-primary bg-primary/5' : 'border-outline-variant/30 hover:border-primary/50'}`}>
          <div className="w-16 h-16 rounded-full bg-surface-container-high flex items-center justify-center text-primary shadow-xl">
            {loading ? <Loader2 className="animate-spin" size={32} /> : <Upload size={32} />}
          </div>
          <div>
            <p className="font-headline text-lg font-bold">Sube tu PDF o Foto</p>
            <p className="text-on-surface-variant text-sm mt-1">Nuestra IA extraerá tus macros automáticamente</p>
          </div>
          <button className="bg-primary text-on-primary font-bold px-8 py-3 rounded-full hover:shadow-[0_0_20px_rgba(166,140,255,0.4)] transition-all">
            Explorar Archivos
          </button>
        </div>
      </section>

      {error && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-center gap-2 text-red-400 bg-red-400/10 p-4 rounded-xl">
          <AlertCircle size={20} />
          <span>{error}</span>
        </motion.div>
      )}

      {(result || currentPlan) && (
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-surface-container p-6 rounded-xl border border-primary/20 space-y-6"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-primary">
              <CheckCircle2 size={24} />
              <h3 className="font-headline font-bold text-xl">
                {result ? 'Análisis Completado' : 'Plan Actual'}
              </h3>
            </div>
            {!result && currentPlan && (
              <span className="text-[10px] text-on-surface-variant uppercase font-bold">
                Sincronizado: {new Date(currentPlan.extractedAt).toLocaleDateString()}
              </span>
            )}
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-surface-container-high p-4 rounded-lg">
              <p className="text-xs text-on-surface-variant uppercase font-bold">Nombre</p>
              <p className="font-bold text-lg">{(result || currentPlan).name}</p>
            </div>
            <div className="bg-surface-container-high p-4 rounded-lg">
              <p className="text-xs text-on-surface-variant uppercase font-bold">Calorías</p>
              <p className="font-bold text-lg">{formatNum((result || currentPlan).calories)} kcal</p>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="bg-tertiary/10 p-3 rounded-lg border-b-2 border-tertiary">
              <p className="text-[10px] text-tertiary uppercase font-bold">Proteína</p>
              <p className="font-bold">{formatNum((result || currentPlan).protein)}g</p>
            </div>
            <div className="bg-secondary/10 p-3 rounded-lg border-b-2 border-secondary">
              <p className="text-[10px] text-secondary uppercase font-bold">Carbos</p>
              <p className="font-bold">{formatNum((result || currentPlan).carbs)}g</p>
            </div>
            <div className="bg-primary/10 p-3 rounded-lg border-b-2 border-primary">
              <p className="text-[10px] text-primary uppercase font-bold">Grasas</p>
              <p className="font-bold">{formatNum((result || currentPlan).fats)}g</p>
            </div>
          </div>

          {(result || currentPlan).advice && (
            <div className="bg-surface-container-low p-4 rounded-lg italic text-on-surface-variant text-sm">
              "{(result || currentPlan).advice}"
            </div>
          )}
        </motion.div>
      )}

      <section className="space-y-4">
        <h3 className="font-headline font-bold text-xl">Instrucciones</h3>
        <ul className="space-y-3 text-on-surface-variant text-sm">
          <li className="flex gap-3">
            <div className="w-5 h-5 rounded-full bg-primary/20 text-primary flex items-center justify-center flex-shrink-0 text-[10px] font-bold">1</div>
            <p>Sube una foto de tu comida o un PDF de tu plan nutricional.</p>
          </li>
          <li className="flex gap-3">
            <div className="w-5 h-5 rounded-full bg-primary/20 text-primary flex items-center justify-center flex-shrink-0 text-[10px] font-bold">2</div>
            <p>PureAI analizará los ingredientes y extraerá los macronutrientes.</p>
          </li>
          <li className="flex gap-3">
            <div className="w-5 h-5 rounded-full bg-primary/20 text-primary flex items-center justify-center flex-shrink-0 text-[10px] font-bold">3</div>
            <p>Tus objetivos se actualizarán automáticamente en tu perfil.</p>
          </li>
        </ul>
      </section>
    </div>
  );
};
