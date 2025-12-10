import { useState, useEffect, useCallback, useRef } from "react";
import { Button } from "@/components/ui/button";
import { ArrowLeft, RotateCcw, Coffee } from "lucide-react";
import { Progress } from "@/components/ui/progress";

interface ChaiCatcherProps {
  onGameComplete: (xp: number) => void;
  onBack: () => void;
}

interface FallingItem {
  id: number;
  x: number;
  y: number;
  type: 'chai' | 'distraction';
  icon: string;
  speed: number;
}

const ChaiCatcher = ({ onGameComplete, onBack }: ChaiCatcherProps) => {
  const [playerX, setPlayerX] = useState(50);
  const [fallingItems, setFallingItems] = useState<FallingItem[]>([]);
  const [score, setScore] = useState(0);
  const [stressLevel, setStressLevel] = useState(50);
  const [gameActive, setGameActive] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [nextItemId, setNextItemId] = useState(0);
  const gameAreaRef = useRef<HTMLDivElement>(null);
  const animationRef = useRef<number>();
  const lastSpawnRef = useRef<number>(0);
  const playerXRef = useRef(playerX);
  const cupRef = useRef<HTMLDivElement>(null);
  const [bossActive, setBossActive] = useState(false);
  const [bossY, setBossY] = useState(0);
  const [bossCaught, setBossCaught] = useState(false);

  const distractions = [
    { icon: "📞", label: "Client Call" },
    { icon: "🚨", label: "Escalation" },
    { icon: "📧", label: "Urgent Email" },
    { icon: "💬", label: "Slack Ping" },
    { icon: "📅", label: "Meeting" },
    { icon: "🔥", label: "Emergency" }
  ];

  const spawnItem = useCallback(() => {
    if (!gameActive) return;

    const now = Date.now();
    if (now - lastSpawnRef.current < 800) return; // Spawn every 800ms
    lastSpawnRef.current = now;

    const isChaiCup = Math.random() > 0.4; // 60% chance for chai
    const newItem: FallingItem = {
      id: nextItemId,
      x: Math.random() * 80 + 10, // 10% to 90% width
      y: 0,
      type: isChaiCup ? 'chai' : 'distraction',
      icon: isChaiCup ? '☕' : distractions[Math.floor(Math.random() * distractions.length)].icon,
      speed: Math.random() * 0.5 + 0.7 // 0.7-1.2 speed (was 1.5-2.5)
    };

    setFallingItems(prev => [...prev, newItem]);
    setNextItemId(prev => prev + 1);
  }, [gameActive, nextItemId, distractions]);

  const gameLoop = useCallback(() => {
    if (!gameActive) return;

    // Spawn items
    spawnItem();

    setFallingItems(prev => {
      const updatedItems = prev.map(item => ({
        ...item,
        y: item.y + item.speed
      }));

      // Check for collisions and filter items
      const remainingItems: FallingItem[] = [];
      let scoreChange = 0;
      let stressChange = 0;

      updatedItems.forEach(item => {
        // Check if item is in catch zone (bottom 15% of game area)
        const inCatchZone = item.y >= 80 && item.y <= 95;
        const inPlayerRange = Math.abs(item.x - playerXRef.current) < 8; // Use real-time cup position

        if (inCatchZone && inPlayerRange) {
          // Item caught!
          if (item.type === 'chai') {
            const chaiSipAudio = new window.Audio('/audio/chai sip.mp3');
            chaiSipAudio.currentTime = 0;
            chaiSipAudio.play();
            scoreChange += 10;
            stressChange -= 10; // Chai reduces stress
          } else {
            stressChange += 15; // Distraction increases stress
          }
        } else if (item.y > 100) {
          // Item fell off screen
          if (item.type === 'chai') {
            stressChange += 12; // Missed chai increases stress more
          }
        } else {
          // Item still on screen
          remainingItems.push(item);
        }
      });

      // Update score and stress
      if (scoreChange > 0) {
        setScore(prev => prev + scoreChange);
      }
      if (stressChange !== 0) {
        setStressLevel(prev => Math.max(0, Math.min(100, prev + stressChange)));
      }

      return remainingItems;
    });

    animationRef.current = requestAnimationFrame(gameLoop);
  }, [gameActive, playerX, spawnItem]);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!gameActive || !gameAreaRef.current) return;
    const rect = gameAreaRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    playerXRef.current = Math.max(5, Math.min(95, x));
  };

  // Touch handler for mobile
  const handleTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
    if (!gameActive || !gameAreaRef.current) return;
    const rect = gameAreaRef.current.getBoundingClientRect();
    const touch = e.touches[0];
    if (!touch) return;
    const x = ((touch.clientX - rect.left) / rect.width) * 100;
    playerXRef.current = Math.max(5, Math.min(95, x));
  };

  const startGame = () => {
    setGameActive(true);
    setGameOver(false);
    setScore(0);
    setStressLevel(50);
    setFallingItems([]);
    setNextItemId(0);
    setPlayerX(50);
    lastSpawnRef.current = 0;
    setBossActive(false);
    setBossCaught(false);
    setBossY(0);
  };

  const endGame = useCallback(() => {
    setGameActive(false);
    setGameOver(true);
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
    }
    const earnedXp = Math.floor(score * 2) + Math.max(0, 100 - stressLevel);
    onGameComplete(earnedXp);
  }, [score, stressLevel, onGameComplete]);

  // Game loop effect
  useEffect(() => {
    if (gameActive) {
      animationRef.current = requestAnimationFrame(gameLoop);
    }
    
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [gameActive, gameLoop]);

  // Check game over conditions
  useEffect(() => {
    if (gameActive && (stressLevel >= 100 || score >= 200)) {
      endGame();
    }
  }, [stressLevel, score, gameActive, endGame]);

  // Animate the cup position smoothly with direct DOM manipulation
  useEffect(() => {
    if (!gameActive) return;
    let animId: number;
    const animate = () => {
      if (cupRef.current) {
        cupRef.current.style.left = `${playerXRef.current}%`;
      }
      animId = requestAnimationFrame(animate);
    };
    animate();
    return () => cancelAnimationFrame(animId);
  }, [gameActive]);

  // Boss logic: spawn boss when score >= 180 and not gameOver, only once per game
  useEffect(() => {
    if (score >= 180 && !gameOver && !bossActive && !bossCaught) {
      setBossActive(true);
      setBossY(0);
      console.log('Boss spawned!');
    }
  }, [score, gameOver, bossActive, bossCaught]);

  // Boss falling animation
  useEffect(() => {
    if (!bossActive || gameOver) return;
    let animId: number;
    const animate = () => {
      setBossY(prevY => {
        if (prevY < 95) {
          return prevY + 1.2; // Boss falls a bit faster
        } else {
          // Boss missed, remove
          setBossActive(false);
          // Respawn boss after 10 seconds if not caught and game is still active
          setTimeout(() => {
            if (!gameOver && !bossCaught && gameActive) {
              setBossY(0);
              setBossActive(true);
            }
          }, 10000);
          return prevY;
        }
      });
      animId = requestAnimationFrame(animate);
    };
    animate();
    return () => cancelAnimationFrame(animId);
  }, [bossActive, gameOver, bossCaught, gameActive]);

  // Boss catch logic
  useEffect(() => {
    if (!bossActive || gameOver) return;
    // Check if boss is in catch zone and in player range
    const inCatchZone = bossY >= 80 && bossY <= 95;
    const inPlayerRange = Math.abs((playerXRef.current || 50) - 50) < 12; // Centered boss, wider range
    if (inCatchZone && inPlayerRange) {
      setScore(prev => prev + 20);
      setBossActive(false);
      setBossCaught(true);
    }
  }, [bossY, bossActive, gameOver]);

  // End game immediately if stress level reaches 100
  useEffect(() => {
    if (gameActive && !gameOver && stressLevel >= 100) {
      endGame();
    }
  }, [stressLevel, gameActive, gameOver, endGame]);

  return (
    <div className="text-center text-white min-h-screen px-4 overflow-hidden" style={{ touchAction: 'none' }}>
      <div className="flex flex-col sm:flex-row justify-between items-center mt-8 mb-4 sm:mt-12 sm:mb-8 gap-4">
        {/* Back Button */}
        <Button
          variant="ghost"
          onClick={onBack}
          className="bg-white/20 text-white hover:bg-white/30 rounded-full w-12 h-12 p-0"
        >
          <ArrowLeft className="w-6 h-6" />
        </Button>
        <h2 className="text-2xl sm:text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-yellow-600 text-center w-full">
          Chai Catcher
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

      <div className="bg-amber-500/20 backdrop-blur-sm rounded-2xl p-4 sm:p-6 max-w-4xl mx-auto border border-amber-300/30">
        {/* Game Stats */}
        <div className="flex flex-col sm:flex-row justify-between items-center mb-4 gap-4">
          <div className="text-center sm:text-left">
            <p className="text-lg font-semibold text-black">Score: {score}</p>
          </div>
          <div className="flex-1 mx-0 sm:mx-6 w-full sm:w-auto">
            <p className="text-sm mb-2 text-black">Stress Level</p>
            <Progress 
              value={stressLevel} 
              className="h-3 bg-white/20"
            />
          </div>
          <div className="text-center sm:text-right">
            <p className="text-sm text-black">Catch the ☕</p>
            <p className="text-xs text-black">Avoid distractions!</p>
          </div>
        </div>

        {/* Game Area */}
        <div 
          ref={gameAreaRef}
          className="relative w-full h-64 sm:h-96 bg-gradient-to-b from-sky-200/20 to-amber-100/20 rounded-xl border-2 border-amber-300/50 overflow-hidden cursor-crosshair"
          onMouseMove={handleMouseMove}
          onTouchMove={handleTouchMove}
          onTouchStart={handleTouchMove}
          style={{ 
            userSelect: 'none',
            touchAction: 'none',
            WebkitUserSelect: 'none',
            WebkitTouchCallout: 'none'
          }}
        >
          {/* Boss Skeleton falls when 20 XP left to win */}
          {bossActive && !gameOver && !bossCaught && (
            <div
              className="absolute z-30 flex flex-col items-center"
              style={{
                left: '50%',
                top: `${bossY}%`,
                transform: 'translate(-50%, -50%)',
                pointerEvents: 'none',
              }}
            >
              <span className="text-4xl sm:text-8xl animate-bounce">💀</span>
              <span className="mt-1 text-lg sm:text-2xl font-bold text-black bg-yellow-200 px-2 sm:px-3 py-1 rounded shadow">Boss</span>
            </div>
          )}
          {/* Falling Items */}
          {fallingItems.map(item => (
            <div
              key={item.id}
              className="absolute text-3xl sm:text-5xl select-none pointer-events-none z-10"
              style={{
                left: `${item.x}%`,
                top: `${item.y}%`,
                transform: 'translate(-50%, -50%)',
                textShadow: '2px 2px 4px rgba(0,0,0,0.5)'
              }}
            >
              {item.icon}
            </div>
          ))}

          {/* Player (Tea Cup Catcher) */}
          <div
            ref={cupRef}
            className="absolute bottom-2 text-4xl sm:text-6xl select-none pointer-events-none z-20"
            style={{
              transform: 'translateX(-50%)',
              filter: 'drop-shadow(2px 2px 4px rgba(0,0,0,0.5))'
            }}
          >
            <Coffee className="w-12 h-12 sm:w-16 sm:h-16 text-amber-400" />
          </div>

          {/* Game Over/Start Overlay */}
          {(!gameActive || gameOver) && (
            <div className="absolute inset-0 bg-black/70 flex flex-col items-center justify-center z-30 p-4">
              {gameOver ? (
                <div className="text-center">
                  <h3 className="text-2xl sm:text-3xl font-bold mb-4 text-amber-200">
                    {stressLevel >= 100 ? "Too Stressed!" : "Well Done!"}
                  </h3>
                  <p className="text-lg sm:text-xl mb-2 text-white">
                    Final Score: {score}
                  </p>
                  <p className="text-base sm:text-lg mb-4 text-amber-200">
                    +{Math.floor(score * 2) + Math.max(0, 100 - stressLevel)} XP earned!
                  </p>
                  <p className="text-sm text-amber-300 italic mb-4">
                    {stressLevel < 50 ? "One sip, and the world feels better." : "Keep practicing your chai catching!"}
                  </p>
                  <Button 
                    onClick={startGame}
                    className="mt-2 bg-amber-600 hover:bg-amber-700 text-white px-6 py-2"
                  >
                    Play Again
                  </Button>
                </div>
              ) : (
                <div className="text-center">
                  <Coffee className="w-12 h-12 sm:w-16 sm:h-16 text-amber-400 mx-auto mb-4" />
                  <h3 className="text-xl sm:text-2xl font-bold mb-4 text-amber-200">Chai Catcher</h3>
                  <p className="text-base sm:text-lg mb-2 text-white">Catch the falling chai cups ☕</p>
                  <p className="text-sm text-amber-300 mb-4">Avoid distractions to keep stress low!</p>
                  <p className="text-xs text-amber-400">Move your mouse or touch to control the catcher</p>
                  <Button 
                    onClick={startGame}
                    className="mt-4 bg-amber-600 hover:bg-amber-700 text-white px-6 py-2"
                  >
                    Start Game
                  </Button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Instructions */}
        <div className="mt-4 text-xs sm:text-sm text-black">
      
          <p>⚠️ Avoid distractions or your stress will increase!</p>
        </div>
      </div>
    </div>
  );
};

export default ChaiCatcher;
