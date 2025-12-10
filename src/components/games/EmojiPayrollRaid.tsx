import { useState, useEffect, useCallback, useRef } from "react";
import { Button } from "@/components/ui/button";
import { ArrowLeft, RotateCcw, DollarSign, Crown, PartyPopper } from "lucide-react";

interface EmojiPayrollRaidProps {
  onGameComplete: (xp: number) => void;
  onBack: () => void;
}

const EmojiPayrollRaid = ({ onGameComplete, onBack }: EmojiPayrollRaidProps) => {
  const [gameActive, setGameActive] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(0);
  const [stealAttempts, setStealAttempts] = useState(0);
  const [bossAwake, setBossAwake] = useState(false);
  const [showCelebration, setShowCelebration] = useState(false);
  const [playerPosition, setPlayerPosition] = useState({ x: 20, y: 50 });
  const [bossPosition] = useState({ x: 70, y: 40 });
  const [isNearBoss, setIsNearBoss] = useState(false);
  const [message, setMessage] = useState("");
  const gameAreaRef = useRef<HTMLDivElement>(null);

  // Load high score
  useEffect(() => {
    const savedHighScore = localStorage.getItem('payroll-raid-high-score');
    if (savedHighScore) {
      setHighScore(parseInt(savedHighScore));
    }
  }, []);

  const checkDistanceToBoss = useCallback(() => {
    const distance = Math.sqrt(
      Math.pow(playerPosition.x - bossPosition.x, 2) + 
      Math.pow(playerPosition.y - bossPosition.y, 2)
    );
    setIsNearBoss(distance < 15);
  }, [playerPosition.x, playerPosition.y, bossPosition.x, bossPosition.y]);

  useEffect(() => {
    checkDistanceToBoss();
  }, [checkDistanceToBoss]);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!gameActive || bossAwake) return;
    
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    
    setPlayerPosition({ 
      x: Math.max(5, Math.min(95, x)), 
      y: Math.max(5, Math.min(95, y)) 
    });
  };

  const stealMoney = () => {
    if (!isNearBoss || bossAwake || !gameActive) return;

    const attempts = stealAttempts + 1;
    setStealAttempts(attempts);
    
    // Successful steal
    const stolenAmount = Math.floor(Math.random() * 500) + 100;
    setScore(prev => prev + stolenAmount);
    setMessage(`+$${stolenAmount} stolen!`);
    
    setTimeout(() => setMessage(""), 1500);

    // Boss wakes up after 3-4 attempts
    if (attempts >= 3 + Math.floor(Math.random() * 2)) {
      setBossAwake(true);
      setMessage("Boss is waking up! Run!");
      
      // Give player 3 seconds to escape
      setTimeout(() => {
        if (isNearBoss) {
          // Caught! Game over
          endGame(false);
        } else {
          // Escaped! Success
          endGame(true);
        }
      }, 3000);
    }
  };

  const endGame = useCallback((success: boolean) => {
    setGameActive(false);
    setGameOver(true);
    
    if (success) {
      setShowCelebration(true);
      if (score > highScore) {
        setHighScore(score);
        localStorage.setItem('payroll-raid-high-score', score.toString());
      }
    }
    
    const earnedXp = Math.floor(score * 0.8) + (success ? 100 : 0);
    onGameComplete(earnedXp);
  }, [score, highScore, onGameComplete]);

  const startGame = () => {
    setGameActive(true);
    setGameOver(false);
    setScore(0);
    setStealAttempts(0);
    setBossAwake(false);
    setShowCelebration(false);
    setPlayerPosition({ x: 20, y: 50 });
    setMessage("Sneak up to the boss and steal money!");
  };

  return (
    <div className="text-center text-white min-h-screen">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-yellow-600 text-center w-full">
          Emoji Payroll Raid
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

      <div className="bg-amber-600/30 backdrop-blur-sm rounded-2xl p-6 max-w-4xl mx-auto border border-amber-300/30">
        {/* Game Stats */}
        <div className="flex justify-between items-center mb-4">
          <div className="text-left">
            <p className="text-lg font-semibold text-amber-200">💰 ${score}</p>
            <p className="text-sm text-amber-300">High: ${highScore}</p>
          </div>
          <div className="text-center">
            <p className="text-sm text-amber-200">Steals: {stealAttempts}</p>
            <p className="text-xs text-amber-300">Boss: {bossAwake ? 'AWAKE!' : 'Sleeping'}</p>
          </div>
          <div className="text-right">
            <p className="text-sm text-amber-200">{message}</p>
          </div>
        </div>

        {/* Game Area */}
        <div 
          ref={gameAreaRef}
          className="relative w-full h-96 bg-gradient-to-b from-amber-800/30 to-yellow-900/30 rounded-xl border-2 border-amber-300/50 overflow-hidden cursor-none"
          onMouseMove={handleMouseMove}
        >
          {/* Office Background Elements */}
          <div className="absolute top-4 left-4 text-4xl opacity-60">🏢</div>
          <div className="absolute top-4 right-4 text-4xl opacity-60">💼</div>
          <div className="absolute bottom-4 left-4 text-4xl opacity-60">📊</div>
          <div className="absolute bottom-4 right-4 text-4xl opacity-60">💻</div>

          {/* Boss */}
          <div
            className="absolute transform -translate-x-1/2 -translate-y-1/2 transition-all duration-300"
            style={{
              left: `${bossPosition.x}%`,
              top: `${bossPosition.y}%`
            }}
          >
            <div className={`relative ${bossAwake ? 'animate-bounce' : ''}`}>
              {/* Boss Character */}
              <div className="text-6xl mb-2">
                {bossAwake ? '😡' : '😴'}
              </div>
              {/* Money Bag */}
              <div className="absolute -bottom-2 -right-2 text-3xl animate-pulse">
                💰
              </div>
              {/* Boss Status */}
              <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 whitespace-nowrap">
                <span className={`text-xs font-bold px-2 py-1 rounded ${
                  bossAwake ? 'bg-red-500 text-white' : 'bg-blue-500 text-white'
                }`}>
                  {bossAwake ? 'ALERT!' : 'ZZZ...'}
                </span>
              </div>
            </div>
          </div>

          {/* Player */}
          <div
            className="absolute transform -translate-x-1/2 -translate-y-1/2 transition-all duration-100"
            style={{
              left: `${playerPosition.x}%`,
              top: `${playerPosition.y}%`
            }}
          >
            <div className="relative">
              {/* Player Character */}
              <div className="text-4xl">
                {bossAwake ? '🏃' : '🕵️'}
              </div>
              {/* Interaction Indicator */}
              {isNearBoss && !bossAwake && (
                <div className="absolute -top-8 left-1/2 transform -translate-x-1/2">
                  <Button
                    onClick={stealMoney}
                    className="bg-green-600 hover:bg-green-700 text-white px-2 py-1 text-xs animate-pulse"
                  >
                    Steal Money!
                  </Button>
                </div>
              )}
            </div>
          </div>

          {/* Success Celebration */}
          {showCelebration && (
            <div className="absolute inset-0 bg-green-500/20 flex items-center justify-center z-40">
              <div className="text-center animate-fade-in">
                <PartyPopper className="w-16 h-16 text-green-400 mx-auto mb-4 animate-bounce" />
                <h3 className="text-4xl font-bold text-green-300 mb-2">SUCCESS!</h3>
                <p className="text-2xl text-green-200 mb-2">💰 Heist Complete!</p>
                <p className="text-lg text-green-300">You got away with ${score}!</p>
              </div>
            </div>
          )}

          {/* Game Over/Start Overlay */}
          {(!gameActive || gameOver) && !showCelebration && (
            <div className="absolute inset-0 bg-black/70 flex flex-col items-center justify-center z-30">
              {gameOver ? (
                <div className="text-center">
                  <h3 className="text-3xl font-bold mb-4 text-amber-200">
                    {stealAttempts >= 3 ? (isNearBoss ? "Caught!" : "Escaped!") : "Mission Failed!"}
                  </h3>
                  <p className="text-xl mb-2 text-white">
                    Total Stolen: ${score}
                  </p>
                  <p className="text-lg mb-4 text-amber-200">
                    +{Math.floor(score * 0.8) + (stealAttempts >= 3 && !isNearBoss ? 100 : 0)} XP earned!
                  </p>
                  <p className="text-sm text-amber-300 italic">
                    "Virtual wealth &gt; real wealth. Sigh."
                  </p>
                </div>
              ) : (
                <div className="text-center">
                  <Crown className="w-16 h-16 text-amber-400 mx-auto mb-4" />
                  <h3 className="text-2xl font-bold mb-4 text-amber-200">Emoji Payroll Raid</h3>
                  <p className="text-lg mb-2 text-white">Steal money from the sleeping boss!</p>
                  <p className="text-sm text-amber-300 mb-4">
                    Move mouse to sneak around, click to steal when near the boss
                  </p>
                  <Button 
                    onClick={startGame}
                    className="bg-amber-600 hover:bg-amber-700 text-white px-6 py-2"
                  >
                    Start Heist
                  </Button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Instructions */}
        <div className="mt-4 text-sm text-amber-200">
          <p>🕵️ Move your mouse to control the thief</p>
          <p>💰 Sneak close to the boss and steal money from his bag</p>
          <p>😴 The boss will wake up after 3-4 steals - escape before getting caught!</p>
        </div>
      </div>
    </div>
  );
};

export default EmojiPayrollRaid;