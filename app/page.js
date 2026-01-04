'use client';
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Camera, X, Loader2, ArrowRight } from "lucide-react";

export default function Home() {
  const [selectedId, setSelectedId] = useState(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [ingredients, setIngredients] = useState([]);

  const handleCapture = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setAnalyzing(true);
    
    const formData = new FormData();
    formData.append("image", file);

    try {
      const res = await fetch("/api/analyze", { method: "POST", body: formData });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      const dataWithIds = data.map((item, index) => ({ ...item, id: index }));
      setIngredients(dataWithIds);
    } catch (err) {
      console.error(err);
      alert("Analysis failed. Check your GOOGLE_API_KEY in Vercel.");
    } finally {
      setAnalyzing(false);
    }
  };

  return (
    <div className="h-screen w-full bg-[#0a0a0a] text-white font-sans overflow-hidden flex flex-col relative">
      
      {/* INITIAL STATE */}
      {ingredients.length === 0 && (
        <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center z-10">
          <AnimatePresence mode="wait">
            {analyzing ? (
              <motion.div 
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="flex flex-col items-center gap-4"
              >
                <Loader2 className="animate-spin w-10 h-10 text-white/50" />
                <p className="text-xl font-light tracking-wide text-white/50 animate-pulse">Analyzing with Gemini...</p>
              </motion.div>
            ) : (
              <motion.div 
                initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                className="flex flex-col items-center gap-8 max-w-md"
              >
                <h1 className="text-3xl md:text-5xl font-medium tracking-tight leading-tight">
                  Take a photo of ingredients to get a breakdown.
                </h1>
                
                <label className="group relative cursor-pointer overflow-hidden rounded-full bg-white px-8 py-4 text-black transition-all hover:scale-105 active:scale-95">
                  <div className="flex items-center gap-3 font-bold tracking-widest text-sm uppercase">
                    <Camera size={20} />
                    <span>Scan Now</span>
                  </div>
                  <input type="file" accept="image/*" capture="environment" className="hidden" onChange={handleCapture} />
                </label>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}

      {/* HORIZONTAL CARDS */}
      {ingredients.length > 0 && (
        <motion.div 
          initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          className="h-full w-full flex items-center overflow-x-auto snap-x snap-mandatory px-6 md:px-[20vw] gap-4 no-scrollbar"
        >
          <button 
            onClick={() => setIngredients([])}
            className="fixed top-6 left-6 z-20 text-xs font-bold uppercase tracking-widest opacity-50 hover:opacity-100"
          >
            ← Scan New
          </button>

          {ingredients.map((item) => (
            <motion.div
              layoutId={`card-${item.id}`}
              key={item.id}
              onClick={() => setSelectedId(item.id)}
              className="snap-center shrink-0 w-[85vw] md:w-[400px] h-[60vh] bg-[#151515] border border-white/10 relative flex flex-col justify-between p-8 cursor-pointer hover:border-white/30 transition-colors group"
            >
              <div>
                <motion.h2 
                  layoutId={`title-${item.id}`}
                  className="text-4xl md:text-5xl font-bold leading-[0.9] tracking-tighter text-white mb-4"
                >
                  {item.name}
                </motion.h2>
                <motion.p 
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                  className="text-sm text-gray-400 uppercase tracking-widest"
                >
                  {item.purpose}
                </motion.p>
              </div>

              <div className="flex justify-between items-end">
                <span className="text-xs font-mono text-gray-600">0{item.id + 1}</span>
                <div className="w-10 h-10 rounded-full border border-white/20 flex items-center justify-center group-hover:bg-white group-hover:text-black transition-colors">
                  <ArrowRight size={18} />
                </div>
              </div>
            </motion.div>
          ))}
          <div className="w-4 shrink-0" />
        </motion.div>
      )}

      {/* EXPANDED MODAL */}
      <AnimatePresence>
        {selectedId !== null && (
          <>
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} 
              onClick={() => setSelectedId(null)} 
              className="fixed inset-0 bg-black/90 z-40 backdrop-blur-sm" 
            />
            <div className="fixed inset-0 flex items-center justify-center z-50 pointer-events-none p-4">
              {ingredients.filter(i => i.id === selectedId).map(item => (
                <motion.div 
                  layoutId={`card-${item.id}`} 
                  key={item.id} 
                  className="pointer-events-auto w-full max-w-2xl bg-[#0a0a0a] border border-white/10 h-[85vh] flex flex-col relative overflow-hidden"
                >
                  <button onClick={() => setSelectedId(null)} className="absolute top-6 right-6 z-10 bg-white/10 hover:bg-white hover:text-black p-2 rounded-full transition-colors"><X size={20}/></button>
                  <div className="p-8 md:p-12 overflow-y-auto custom-scrollbar">
                    <motion.h2 layoutId={`title-${item.id}`} className="text-5xl md:text-7xl font-bold leading-[0.85] tracking-tighter mb-10 text-white">{item.name}</motion.h2>
                    <div className="space-y-12 text-lg md:text-xl font-light leading-relaxed text-gray-300">
                      <div><h3 className="text-xs font-bold text-white uppercase tracking-widest mb-3 border-b border-white/20 pb-2 w-max">Function</h3><p>{item.purpose}</p></div>
                      <div><h3 className="text-xs font-bold text-white uppercase tracking-widest mb-3 border-b border-white/20 pb-2 w-max">Analysis</h3><p className="text-white">{item.analysis}</p></div>
                      {item.history && <div><h3 className="text-xs font-bold text-white uppercase tracking-widest mb-3 border-b border-white/20 pb-2 w-max">Origin</h3><p className="italic text-gray-500 text-base">{item.history}</p></div>}
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </>
        )}
      </AnimatePresence>
      <style jsx global>{`
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
    </div>
  );
}