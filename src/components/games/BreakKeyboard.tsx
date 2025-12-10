import { useState, useEffect, useCallback, useRef } from "react";
import { Button } from "@/components/ui/button";
import { ArrowLeft, RotateCcw, Keyboard, Zap } from "lucide-react";
import { Progress } from "@/components/ui/progress";

interface BreakKeyboardProps {
  onGameComplete: (xp: number) => void;
  onBack: () => void;
}

interface KeyPress {
  id: number;
  key: string;
  x: number;
  y: number;
  damage: number;
}

const BreakKeyboard = ({ onGameComplete, onBack }: BreakKeyboardProps) => {
  const [gameActive, setGameActive] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [score, setScore] = useState(0);
  const [autoWords, setAutoWords] = useState(0);
  const [keyboardHealth, setKeyboardHealth] = useState(100);
  const [stressLevel, setStressLevel] = useState(0);
  const [keyPresses, setKeyPresses] = useState<KeyPress[]>([]);
  const [timeLeft, setTimeLeft] = useState(30);
  const [isRaging, setIsRaging] = useState(false);
  const nextKeyId = useRef(0);
  const gameTimerRef = useRef<number | null>(null);
  const stressIntervalRef = useRef<number | null>(null);
  const lastKeyPressTimeRef = useRef(Date.now());
  const decayIntervalRef = useRef<number | null>(null);
  const [requiredWords, setRequiredWords] = useState(200);
  const scoreRef = useRef(0);
  const autoWordsRef = useRef(0);
  const gameActiveRef = useRef(gameActive);

  const rageKeys = ['ARGH!', 'BANG!', 'SMASH!', 'CRASH!', 'POW!', 'WHAM!'];

  const handleKeyPress = useCallback((event: KeyboardEvent) => {
    if (!gameActive) return;

    lastKeyPressTimeRef.current = Date.now();
    const wordInc = 1;
    const damage = 0.5; // 0.5% per key press, so 200 presses to break
    const newKeyPress: KeyPress = {
      id: nextKeyId.current++,
      key: event.key.toUpperCase(),
      x: Math.random() * 80 + 10,
      y: Math.random() * 60 + 20,
      damage
    };

    setKeyPresses(prev => [...prev, newKeyPress]);
    setScore(prev => {
      const next = prev + wordInc;
      scoreRef.current = next;
      if (next + autoWordsRef.current >= requiredWords) {
        setKeyboardHealth(0);
        endGame(true);
      } else {
        setKeyboardHealth(100 - ((next + autoWordsRef.current) / requiredWords) * 100);
      }
      return next;
    });
    setStressLevel(prev => Math.max(0, prev - 2));

    // Remove key press visual after animation
    setTimeout(() => {
      setKeyPresses(prev => prev.filter(kp => kp.id !== newKeyPress.id));
    }, 1000);
  }, [gameActive]);

  const startRageMode = () => {
    if (stressLevel < 50 || isRaging) return;
    
    setIsRaging(true);
    setStressLevel(0);
    
    // Auto-rage for 3 seconds
    const rageInterval = setInterval(() => {
      const rageKey = rageKeys[Math.floor(Math.random() * rageKeys.length)];
      const damage = Math.floor(Math.random() * 20) + 15;
      
      const newKeyPress: KeyPress = {
        id: nextKeyId.current++,
        key: rageKey,
        x: Math.random() * 80 + 10,
        y: Math.random() * 60 + 20,
        damage
      };

      setKeyPresses(prev => [...prev, newKeyPress]);
      setKeyboardHealth(prev => Math.max(0, prev - damage));
      setScore(prev => prev + damage * 2); // Double score in rage mode

      setTimeout(() => {
        setKeyPresses(prev => prev.filter(kp => kp.id !== newKeyPress.id));
      }, 1000);
    }, 200);

    setTimeout(() => {
      clearInterval(rageInterval);
      setIsRaging(false);
    }, 3000);
  };

  const startGame = () => {
    setGameActive(true);
    setGameOver(false);
    setScore(0);
    setAutoWords(0);
    scoreRef.current = 0;
    autoWordsRef.current = 0;
    setKeyboardHealth(100);
    setStressLevel(0);
    setKeyPresses([]);
    setTimeLeft(30);
    setIsRaging(false);
    lastKeyPressTimeRef.current = Date.now();

    // Stress builds up over time
    stressIntervalRef.current = window.setInterval(() => {
      setStressLevel(prev => Math.min(100, prev + 1));
    }, 500);

    // Game timer
    gameTimerRef.current = window.setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          endGame(false);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    // Auto-increment interval: increase word count by 5% of requiredWords per second if idle
    decayIntervalRef.current = window.setInterval(() => {
      if (!gameActiveRef.current) return;
      const now = Date.now();
      if (now - lastKeyPressTimeRef.current > 1000) {
        setRequiredWords(prev => {
          const inc = Math.ceil(prev * 0.05); // 5% per second
          return prev + inc;
        });
      }
    }, 1000);
  };

  const endGame = useCallback((keyboardBroken: boolean) => {
    setGameActive(false);
    setGameOver(true);
    
    if (gameTimerRef.current) {
      clearInterval(gameTimerRef.current);
      gameTimerRef.current = null;
    }
    if (stressIntervalRef.current) {
      clearInterval(stressIntervalRef.current);
      stressIntervalRef.current = null;
    }
    if (decayIntervalRef.current) {
      clearInterval(decayIntervalRef.current);
      decayIntervalRef.current = null;
    }

    const totalWords = score + autoWords;
    const earnedXp = Math.floor(totalWords * 1.1) + (keyboardBroken ? 50 : 0);
    onGameComplete(earnedXp);
  }, [score, autoWords, onGameComplete]);

  useEffect(() => {
    if (gameActive) {
      window.addEventListener('keydown', handleKeyPress);
      return () => {
        window.removeEventListener('keydown', handleKeyPress);
      };
    }
  }, [gameActive, handleKeyPress]);

  useEffect(() => {
    return () => {
      if (gameTimerRef.current) clearInterval(gameTimerRef.current);
      if (stressIntervalRef.current) clearInterval(stressIntervalRef.current);
      if (decayIntervalRef.current) clearInterval(decayIntervalRef.current);
    };
  }, []);

  useEffect(() => { gameActiveRef.current = gameActive; }, [gameActive]);
  useEffect(() => { scoreRef.current = score; }, [score]);
  useEffect(() => { autoWordsRef.current = autoWords; }, [autoWords]);

  // Auto-reset after game over
  useEffect(() => {
    if (gameOver) {
      const resetTimeout = setTimeout(() => {
        setScore(0);
        setAutoWords(0);
        setRequiredWords(200);
        setKeyboardHealth(100);
        setStressLevel(0);
        setKeyPresses([]);
        setTimeLeft(30);
        setIsRaging(false);
        lastKeyPressTimeRef.current = Date.now();
        scoreRef.current = 0;
        autoWordsRef.current = 0;
        gameActiveRef.current = false;
        setGameActive(false);
      }, 2000); // 2 seconds after game over
      return () => clearTimeout(resetTimeout);
    }
  }, [gameOver]);

  return (
    <div className="text-center text-white min-h-screen">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-gray-400 to-slate-700 text-center w-full">
          Break the Keyboard
        </h2>
        
        <Button
          variant="ghost"
          size="lg"
          onClick={startGame}
          className="text-white hover:bg-white/20"
        >
          <RotateCcw className="w-6 h-6 mr-2" />
          {gameActive ? 'Restart' : 'Start'}
        </Button>
      </div>

      <div className="bg-gray-600/30 backdrop-blur-sm rounded-2xl p-6 max-w-4xl mx-auto border border-gray-300/30">
        {/* Game Stats */}
        <div className="flex justify-between items-center mb-4">
          <div className="text-left">
            <p className="text-lg font-semibold text-black">Words: {score + autoWords} / {requiredWords}</p>
            <p className="text-sm text-black">Keyboard HP: {keyboardHealth}%</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-black">{timeLeft}s</p>
            <p className="text-sm text-black">Time Left</p>
          </div>
          <div className="text-right">
            {stressLevel >= 50 && !isRaging && (
              <Button
                onClick={startRageMode}
                className="bg-red-600 hover:bg-red-700 text-white px-2 py-1 text-xs animate-pulse"
              >
                <Zap className="w-3 h-3 mr-1" />
                RAGE!
              </Button>
            )}
          </div>
        </div>

        {/* Progress Bars */}
        <div className="space-y-2 mb-4">
          <div>
            <p className="text-xs text-black mb-1">Keyboard Health</p>
            <Progress 
              value={100 - ((score + autoWords) / requiredWords) * 100} 
              className="h-3 bg-gray-700"
            />
          </div>
        </div>

        {/* Game Area */}
        <div className={`relative w-full h-96 bg-gradient-to-b from-gray-800/50 to-gray-900/30 rounded-xl border-2 border-gray-300/50 overflow-hidden ${
          isRaging ? 'animate-pulse bg-red-900/30' : ''
        }`}>
          
          {/* Keyboard Visual */}
          <div className="absolute left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2">
            <div className={`transition-all duration-200 ${keyPresses.length > 0 ? 'animate-bounce' : ''}`}>
              <Keyboard className={`w-32 h-20 ${
                keyboardHealth > 60 ? 'text-gray-400' :
                keyboardHealth > 30 ? 'text-yellow-400' :
                'text-red-400'
              } ${keyboardHealth <= 0 ? 'animate-spin' : ''}`} />
              <div className="text-center mt-2">
                <p className="text-sm font-bold text-gray-300">
                  {keyboardHealth <= 0 ? 'DESTROYED!' :
                   keyboardHealth < 30 ? 'CRITICAL!' :
                   keyboardHealth < 60 ? 'DAMAGED' :
                   'HEALTHY'}
                </p>
              </div>
            </div>
          </div>

          {/* Key Press Effects */}
          {keyPresses.map(keyPress => (
            <div
              key={keyPress.id}
              className="absolute animate-fade-in"
              style={{
                left: `${keyPress.x}%`,
                top: `${keyPress.y}%`,
              }}
            >
              <div className={`text-2xl font-bold ${
                isRaging ? 'text-red-400 animate-bounce' : 'text-yellow-400'
              } animate-ping`}>
                {keyPress.key}
              </div>
              <div className="text-xs text-white font-bold mt-1">
                -{keyPress.damage}
              </div>
            </div>
          ))}

          {/* Rage Mode Overlay */}
          {isRaging && (
            <div className="absolute inset-0 bg-red-500/20 flex items-center justify-center pointer-events-none">
              <div className="text-center animate-pulse">
                <h3 className="text-4xl font-bold text-red-300 mb-2">RAGE MODE!</h3>
                <p className="text-xl text-red-200">MAXIMUM DAMAGE!</p>
              </div>
            </div>
          )}

          {/* Game Over/Start Overlay */}
          {(!gameActive || gameOver) && (
            <div className="absolute inset-0 bg-black/70 flex flex-col items-center justify-center z-30">
              {gameOver ? (
                <div className="text-center">
                  <h3 className="text-3xl font-bold mb-4 text-gray-200">
                    {keyboardHealth <= 0 ? "Keyboard Destroyed!" : "Time's Up!"}
                  </h3>
                  <p className="text-xl mb-2 text-white">
                    Total Words: {score + autoWords}
                  </p>
                  <p className="text-lg mb-4 text-gray-200">
                    +{Math.floor((score + autoWords) * 1.1) + (keyboardHealth <= 0 ? 50 : 0)} XP earned!
                  </p>
                  <p className="text-sm text-gray-300 italic">
                    {keyboardHealth <= 0 ? "Stress successfully released!" : "Maybe try anger management?"}
                  </p>
                  <Button 
                    onClick={startGame}
                    className="mt-4 bg-blue-600 hover:bg-blue-700 text-white px-6 py-2"
                  >
                    Play Again
                  </Button>
                </div>
              ) : (
                <div className="text-center">
                  <Keyboard className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-2xl font-bold mb-4 text-gray-200">Break the Keyboard</h3>
                  <p className="text-lg mb-2 text-white">Release your deadline stress!</p>
                  <p className="text-sm text-gray-300 mb-4">
                    Smash keys to damage the keyboard. Build stress for RAGE MODE!
                  </p>
                  <Button 
                    onClick={startGame}
                    className="bg-gray-600 hover:bg-gray-700 text-white px-6 py-2"
                  >
                    Start Smashing
                  </Button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Instructions */}
        <div className="mt-4 text-sm text-black">
          <p>⌨️ Smash any keys on your keyboard to damage it</p>
          <p>😡 Build stress to unlock RAGE MODE for massive damage</p>
          <p>💥 Destroy the keyboard completely for maximum XP!</p>
        </div>
      </div>
    </div>
  );
};

export default BreakKeyboard;