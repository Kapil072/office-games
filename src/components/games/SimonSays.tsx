import { useState, useEffect, useCallback, useRef } from "react";
import { Button } from "@/components/ui/button";
import { ArrowLeft, RotateCcw, Play, Trophy } from "lucide-react";

interface GameProps {
  onGameComplete: (xp: number) => void;
  onBack: () => void;
}

const SimonSays = ({ onGameComplete, onBack }: GameProps) => {
  const [gameActive, setGameActive] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [sequence, setSequence] = useState<number[]>([]);
  const [playerSequence, setPlayerSequence] = useState<number[]>([]);
  const [showingSequence, setShowingSequence] = useState(false);
  const [activeColor, setActiveColor] = useState<number | null>(null);
  const [round, setRound] = useState(1);
  const [score, setScore] = useState(0);
  const [allTimeScore, setAllTimeScore] = useState(2);

  const colors = [
    { id: 0, color: '#60a5fa', activeColor: '#bfdbfe' }, // blue-400, blue-200
    { id: 1, color: '#4ade80', activeColor: '#bbf7d0' }, // green-400, green-200
    { id: 2, color: '#f87171', activeColor: '#fecaca' }, // red-400, red-200
    { id: 3, color: '#fde047', activeColor: '#fef9c3' }  // yellow-400, yellow-200
  ];

  // Sound files for each color
  const beepSounds = [
    '/audio/beep1.mp3',
    '/audio/beep2.mp3',
    '/audio/beep3.mp3',
    '/audio/beep4.mp3'
  ];

  const timeoutRef = useRef<NodeJS.Timeout>();

  const startGame = useCallback(() => {
    setGameActive(true);
    setGameOver(false);
    setSequence([]);
    setPlayerSequence([]);
    setRound(1);
    setScore(0);
    
    const firstColor = Math.floor(Math.random() * 4);
    setSequence([firstColor]);
    showSequence([firstColor]);
  }, []);

  const showSequence = useCallback((seq: number[]) => {
    setShowingSequence(true);
    setPlayerSequence([]);
    
    seq.forEach((colorId, index) => {
      setTimeout(() => {
        setActiveColor(colorId);
        setTimeout(() => {
          setActiveColor(null);
          if (index === seq.length - 1) {
            setShowingSequence(false);
          }
        }, 500);
      }, index * 800);
    });
  }, []);

  const handleColorClick = useCallback((colorId: number) => {
    if (!gameActive || showingSequence) return;

    // Play sound on click
    if (beepSounds[colorId]) {
      const audio = new Audio(beepSounds[colorId]);
      audio.play();
    }

    const newPlayerSequence = [...playerSequence, colorId];
    setPlayerSequence(newPlayerSequence);

    if (sequence[newPlayerSequence.length - 1] !== colorId) {
      setGameOver(true);
      setGameActive(false);
      const finalXP = score * 10;
      onGameComplete(finalXP);
      if (score > allTimeScore) {
        setAllTimeScore(score);
      }
      return;
    }

    if (newPlayerSequence.length === sequence.length) {
      setScore(prev => prev + round * 10);
      setRound(prev => prev + 1);
      
      setTimeout(() => {
        const nextSequence = [...sequence, Math.floor(Math.random() * 4)];
        setSequence(nextSequence);
        showSequence(nextSequence);
      }, 1000);
    }
  }, [gameActive, showingSequence, playerSequence, sequence, round, score, onGameComplete, allTimeScore]);

  const resetGame = useCallback(() => {
    setGameActive(false);
    setGameOver(false);
    setSequence([]);
    setPlayerSequence([]);
    setShowingSequence(false);
    setActiveColor(null);
    setRound(1);
    setScore(0);
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
  }, []);

  useEffect(() => {
    if (activeColor !== null && beepSounds[activeColor]) {
      const audio = new Audio(beepSounds[activeColor]);
      audio.play();
    }
  }, [activeColor]);

  // Play sound then call onBack
  const handleBack = () => {
    const audio = new Audio('/audio/button.mp3');
    audio.play();
    setTimeout(() => onBack(), 100); // slight delay to let sound play
  };

  return (
    <div className="fixed inset-0 z-50 min-h-screen bg-gradient-to-br from-blue-800 to-slate-800 p-4 flex flex-col">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <Button
          variant="ghost"
          onClick={handleBack}
          className="bg-white/20 text-white hover:bg-white/30 rounded-full w-12 h-12 p-0"
        >
          <ArrowLeft className="w-6 h-6" />
        </Button>
        
        <div className="flex gap-4">
          <div className="bg-gray-800 text-white px-4 py-2 rounded-lg">
            <div className="text-xs text-gray-400">MEDIUM MODE</div>
            <div className="text-lg font-bold">{round}</div>
          </div>
          <div className="bg-gray-800 text-cyan-400 px-4 py-2 rounded-lg">
            <div className="text-xs text-gray-400 flex items-center gap-1">
              ALL TIME
              <svg className="w-3 h-3" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
              </svg>
            </div>
            <div className="text-lg font-bold">{allTimeScore}</div>
          </div>
        </div>
      </div>

      {/* Circular Game Board */}
      <div className="flex-1 flex items-center justify-center relative">
        <div className="relative w-80 h-80 flex items-center justify-center">
          {/* Circle Border (behind SVG) */}
          <div className="absolute inset-0 rounded-full border-8 border-gray-900/80 shadow-2xl z-0"></div>
          {/* Color Segments (SVG) */}
          <svg className="absolute inset-0 w-full h-full z-10 transform -rotate-90" viewBox="0 0 320 320">
            {colors.map((color, index) => {
              const isActive = activeColor === color.id;
              const radius = 140;
              const centerX = 160;
              const centerY = 160;
              const startAngle = index * 90;
              const endAngle = (index + 1) * 90;
              const startAngleRad = (startAngle * Math.PI) / 180;
              const endAngleRad = (endAngle * Math.PI) / 180;
              const largeArcFlag = endAngle - startAngle <= 180 ? "0" : "1";
              const x1 = centerX + radius * Math.cos(startAngleRad);
              const y1 = centerY + radius * Math.sin(startAngleRad);
              const x2 = centerX + radius * Math.cos(endAngleRad);
              const y2 = centerY + radius * Math.sin(endAngleRad);
              const pathData = [
                `M ${centerX} ${centerY}`,
                `L ${x1} ${y1}`,
                `A ${radius} ${radius} 0 ${largeArcFlag} 1 ${x2} ${y2}`,
                'Z'
              ].join(' ');
              const clickable = gameActive && !gameOver && !showingSequence;
              return (
                <path
                  key={color.id}
                  d={pathData}
                  fill={isActive ? 'black' : color.color}
                  stroke="#1f2937"
                  strokeWidth="4"
                  className={`transition-all duration-200 ${
                    clickable ? 'cursor-pointer ring-4 ring-green-400 ring-opacity-60 hover:brightness-110' : 'opacity-70 cursor-not-allowed'
                  } ${isActive ? 'brightness-125 drop-shadow-lg ring-4 ring-yellow-300' : ''}`}
                  style={{ opacity: clickable ? 1 : 0.7, pointerEvents: clickable ? 'auto' : 'none' }}
                  onClick={clickable ? () => handleColorClick(color.id) : undefined}
                />
              );
            })}
          </svg>
          {/* Center Circle with Score */}
          <div className="absolute left-1/2 top-1/2 z-20" style={{ transform: 'translate(-50%, -50%)' }}>
            <div className="bg-gray-900 rounded-full w-32 h-32 flex flex-col items-center justify-center border-8 border-gray-700 shadow-xl">
              <div className="text-center">
                <div className="text-white text-sm">SCORE:</div>
                <div className="text-white text-2xl font-bold">{score}</div>
              </div>
            </div>
          </div>
          {/* Overlay for Play Game and Game Over */}
          {(!gameActive && !gameOver) || gameOver ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center z-30 bg-black/70 p-4">
        {!gameActive && !gameOver ? (
                <div className="text-center">
            <p className="text-white/80 mb-4 text-lg">
              Watch the color sequence and repeat it!
            </p>
            <Button 
              onClick={startGame} 
              className="bg-orange-500 hover:bg-orange-600 text-white px-8 py-4 text-lg rounded-xl"
            >
              <Play className="w-5 h-5 mr-2" />
                    Play Game
              <div className="text-sm ml-2">Level {round}</div>
            </Button>
          </div>
        ) : gameOver ? (
          <div className="bg-white/10 rounded-xl p-6 max-w-md mx-auto">
            <Trophy className="w-12 h-12 text-yellow-500 mx-auto mb-4" />
            <h3 className="text-2xl font-bold text-white mb-2">Game Over!</h3>
            <p className="text-white/80 mb-4">You reached Round {round} with {score} points!</p>
            <div className="flex gap-2 justify-center">
              <Button onClick={resetGame} variant="outline" className="text-black">
                <RotateCcw className="w-4 h-4 mr-2" />
                Try Again
              </Button>
              <Button onClick={handleBack}>Back to Games</Button>
            </div>
          </div>
              ) : null}
            </div>
          ) : null}
        </div>
      </div>

      {/* Status and Controls (for sequence and repeat prompts) */}
      {gameActive && !gameOver && (
        <div className="text-center mt-8">
          {showingSequence ? (
          <p className="text-cyan-400 font-semibold text-xl">👀 Watch the sequence...</p>
        ) : (
          <p className="text-green-400 font-semibold text-xl">🎯 Repeat the sequence!</p>
        )}
      </div>
      )}
    </div>
  );
};

export default SimonSays;