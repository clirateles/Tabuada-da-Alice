/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Sparkles, Trophy, Star, Flame, Volume2, VolumeX, RotateCcw } from 'lucide-react';

// Soft palette
const palette = {
  canvas: 'bg-gradient-to-br from-[#FFF5F7] to-[#FAD0DD]',
  card: 'bg-white',
  border: 'border-[#FAD0DD]',
  accent: 'text-[#E63946]',
  button: 'bg-[#FF758F] text-white hover:bg-[#FF8FA3]',
  text: 'text-[#4A3030]',
};

export default function App() {
  const [gameState, setGameState] = useState<'start' | 'playing' | 'end'>('start');
  const [table, setTable] = useState<string>('random');
  const [deck, setDeck] = useState<{ n1: number; n2: number }[]>([]);
  const [stars, setStars] = useState(0);
  const [streak, setStreak] = useState(0);
  const [best, setBest] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [answer, setAnswer] = useState('');
  const [feedback, setFeedback] = useState({ msg: '', isCorrect: false });
  const [deckTotal, setDeckTotal] = useState(0);
  const [muted, setMuted] = useState(false);
  const audioCtx = useRef<AudioContext | null>(null);

  useEffect(() => {
    const savedBest = localStorage.getItem('tabuada_best_alice');
    if (savedBest) setBest(parseInt(savedBest, 10));
  }, []);

  const playTone = (freq: number, type: OscillatorType = 'sine') => {
    if (muted) return;
    if (!audioCtx.current) audioCtx.current = new AudioContext();
    const osc = audioCtx.current.createOscillator();
    const gain = audioCtx.current.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, audioCtx.current.currentTime);
    gain.gain.setValueAtTime(0.1, audioCtx.current.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.current.currentTime + 0.5);
    osc.connect(gain);
    gain.connect(audioCtx.current.destination);
    osc.start();
    osc.stop(audioCtx.current.currentTime + 0.5);
  };

  const createDeck = useCallback((selectedTable: string) => {
    let items: { n1: number; n2: number }[] = [];
    if (selectedTable === 'random') {
      for (let i = 1; i <= 10; i++) for (let j = 1; j <= 10; j++) items.push({ n1: i, n2: j });
      items = items.sort(() => Math.random() - 0.5).slice(0, 20);
    } else {
      const n1 = parseInt(selectedTable, 10);
      for (let j = 1; j <= 10; j++) items.push({ n1, n2: j });
      items = items.sort(() => Math.random() - 0.5);
    }
    setDeck(items);
    setDeckTotal(items.length);
    setStars(0);
    setStreak(0);
  }, []);

  const startGame = () => {
    createDeck(table);
    setGameState('playing');
    setFlipped(false);
  };

  const checkAnswer = (e: React.FormEvent) => {
    e.preventDefault();
    if (flipped) return;

    const q = deck[0];
    const correctVal = q.n1 * q.n2;
    const isCorrect = parseInt(answer, 10) === correctVal;

    if (isCorrect) {
      setStars(s => s + 1);
      const newStreak = streak + 1;
      setStreak(newStreak);
      if (newStreak > best) {
        setBest(newStreak);
        localStorage.setItem('tabuada_best_alice', String(newStreak));
      }
      setFeedback({ msg: 'Arrasou!', isCorrect: true });
      playTone(523, 'triangle');
    } else {
      setStreak(0);
      setFeedback({ msg: `Quase! Era ${correctVal}`, isCorrect: false });
      playTone(220, 'sawtooth');
    }
    setFlipped(true);
  };

  const nextCard = () => {
    const nextDeck = deck.slice(1);
    setDeck(nextDeck);
    setFlipped(false);
    setAnswer('');
    if (nextDeck.length === 0) {
      setGameState('end');
    }
  };

  // Decoration elements
  const decors = ['✨', '💖', '🌈', '🧁', '🎀'];

  return (
    <div className={`min-h-screen ${palette.canvas} p-4 flex flex-col items-center justify-center relative overflow-hidden font-nunito`}>
      {/* Decors */}
      {decors.map((d, i) => (
        <motion.div key={i} className="absolute text-3xl animate-float opacity-50" 
          style={{ top: `${10 + i * 15}%`, left: `${5 + (i%2)*80}%` }}>{d}</motion.div>
      ))}

      {gameState === 'start' && (
        <div className="text-center z-10">
          <h1 className="text-5xl font-extrabold text-[#4A3030] mb-6 font-fredoka">Oi, Alice! ✨</h1>
          <select value={table} onChange={e => setTable(e.target.value)} className="mb-8 p-3 rounded-xl border-2 border-[#FF758F] font-bold text-lg">
            <option value="random">Todas Misturadas</option>
            {[...Array(10)].map((_, i) => <option key={i+1} value={i+1}>Tabuada do {i+1}</option>)}
          </select>
          <br />
          <button onClick={startGame} className={`px-10 py-4 rounded-full font-bold text-2xl ${palette.button} shadow-lg font-fredoka`}>Começar!</button>
        </div>
      )}

      {gameState === 'playing' && (
        <div className="w-full max-w-sm z-10">
          <div className="flex justify-between items-center mb-4">
            <h1 className="text-2xl font-bold text-[#4A3030] font-fredoka">Tabuada da Alice</h1>
            <button onClick={() => setMuted(!muted)} className="p-2 rounded-full bg-white shadow">{muted ? <VolumeX /> : <Volume2 />}</button>
          </div>
          
          <div className="flex gap-4 mb-4 justify-center text-sm text-[#6B4F4F]">
            <span className="flex items-center gap-1 bg-white px-3 py-1 rounded-full"><Star size={16} className="text-yellow-500"/> {stars}</span>
            <span className="flex items-center gap-1 bg-white px-3 py-1 rounded-full"><Flame size={16} className="text-orange-500"/> {streak}</span>
            <span className="flex items-center gap-1 bg-white px-3 py-1 rounded-full"><Trophy size={16} className="text-yellow-600"/> {best}</span>
          </div>

          <div className="w-full h-3 bg-white rounded-full mb-6 overflow-hidden">
            <div className="h-full bg-[#8be6b8] transition-all duration-300" style={{ width: `${((deckTotal - deck.length) / deckTotal) * 100}%` }}></div>
          </div>

          <div className="h-64 perspective-1000 mb-6">
            <motion.div className="w-full h-full relative preserve-3d transition-transform duration-500" animate={{ rotateY: flipped ? 180 : 0 }}>
              <div className={`absolute inset-0 backface-hidden bg-white p-8 rounded-3xl shadow-lg border ${palette.border} flex items-center justify-center`}>
                <span className="text-6xl font-bold font-fredoka">{deck[0].n1} x {deck[0].n2}</span>
              </div>
              <div className="absolute inset-0 backface-hidden bg-[#FF758F] p-8 rounded-3xl shadow-lg flex flex-col items-center justify-center rotate-y-180 text-white">
                <span className="text-xl mb-2 font-fredoka">{feedback.msg}</span>
                <span className="text-6xl font-bold font-fredoka">{deck[0].n1 * deck[0].n2}</span>
              </div>
            </motion.div>
          </div>

          {!flipped ? (
            <form onSubmit={checkAnswer} className="flex gap-2">
              <input type="number" value={answer} onChange={e => setAnswer(e.target.value)} className={`w-full p-4 rounded-xl border-2 ${palette.border} text-center text-2xl font-bold`} autoFocus placeholder="?" />
              <button type="submit" className={`px-6 py-4 rounded-xl font-bold ${palette.button} font-fredoka`}>Responder</button>
            </form>
          ) : (
            <button onClick={nextCard} className={`w-full py-4 rounded-xl font-bold text-xl ${palette.button} font-fredoka`}>Próxima</button>
          )}
        </div>
      )}

      {gameState === 'end' && (
        <div className="text-center z-10 bg-white p-8 rounded-3xl shadow-lg">
          <h2 className="text-3xl font-bold mb-4 font-fredoka">Você terminou, Alice! 🎉</h2>
          <p className="text-lg mb-6 text-[#4A3030]">Você ganhou {stars} estrelas! Sua melhor sequência foi {best}.</p>
          <button onClick={() => setGameState('start')} className={`px-8 py-4 rounded-full font-bold text-xl ${palette.button} flex items-center gap-2 mx-auto font-fredoka`}><RotateCcw /> Jogar de novo</button>
        </div>
      )}
    </div>
  );
}
