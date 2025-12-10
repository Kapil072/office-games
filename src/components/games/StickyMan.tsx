import { useState, useEffect, useCallback, useRef } from "react";
import { Button } from "@/components/ui/button";
import { ArrowLeft, RotateCcw, Play, Trophy } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";

interface StickyManProps {
  onGameComplete: (xp: number) => void;
  onBack: () => void;
}

interface Obstacle {
  id: number;
  x: number;
  y: number;
  type: 'zigzag' | 'box' | 'sky-box';
  width: number;
  height: number;
}

const StickyMan = ({ onGameComplete, onBack }: StickyManProps) => {
  const PLAYER_WIDTH = 24;
  const PLAYER_HEIGHT = 48;
  const GROUND_Y = 300;
  const JUMP_HEIGHT = 150; // Increased jump height
  const JUMP_SPEED = 1 / (60 * 2); // 2 seconds at 60fps = 0.00833 per frame
  const GAME_WIDTH = 800;
  const GAME_HEIGHT = 400;

  const [gameActive, setGameActive] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [playerX, setPlayerX] = useState(100);
  const [playerY, setPlayerY] = useState(GROUND_Y - PLAYER_HEIGHT);
  const [isJumping, setIsJumping] = useState(false);
  const [jumpProgress, setJumpProgress] = useState(0);
  const [obstacles, setObstacles] = useState<Obstacle[]>([]);
  const [score, setScore] = useState(0);
  const [distance, setDistance] = useState(0);
  const [gameSpeed, setGameSpeed] = useState(1.5); // Slower initial speed
  
  const gameAreaRef = useRef<HTMLDivElement>(null);
  const animationFrameRef = useRef<number>();
  const nextObstacleId = useRef(0);
  const lastObstacleSpawn = useRef(0);
  const keysPressed = useRef<Set<string>>(new Set());
  const isMobile = useIsMobile();

  // Handle keyboard input
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      keysPressed.current.add(e.key.toLowerCase());
      
      if ((e.key === ' ' || e.key === 'Space' || e.key.toLowerCase() === 'space') && !isJumping && gameActive) {
        e.preventDefault();
        jump();
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      keysPressed.current.delete(e.key.toLowerCase());
    };

    if (gameActive) {
      window.addEventListener('keydown', handleKeyDown);
      window.addEventListener('keyup', handleKeyUp);
    }

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [gameActive, isJumping]);

  const jump = useCallback(() => {
    if (!isJumping && gameActive) {
      console.log('Jump initiated!');
      setIsJumping(true);
      setJumpProgress(0);
    }
  }, [isJumping, gameActive]);

  // Smooth and longer jumping animation
  useEffect(() => {
    if (!isJumping) return;
    
    const animateJump = () => {
      setJumpProgress(prev => {
        const newProgress = prev + JUMP_SPEED; // Faster progression for more responsive jump
        
        if (newProgress >= 1) {
          setIsJumping(false);
          setPlayerY(GROUND_Y - PLAYER_HEIGHT);
          console.log('Jump completed!');
          return 0;
        }
        
        // Use sine wave for smooth jump arc with higher peak
        const jumpY = (GROUND_Y - PLAYER_HEIGHT) - (Math.sin(newProgress * Math.PI) * JUMP_HEIGHT * 0.8);
        setPlayerY(jumpY);
        
        requestAnimationFrame(animateJump);
        return newProgress;
      });
    };
    
    requestAnimationFrame(animateJump);
  }, [isJumping]);

  const spawnObstacle = useCallback(() => {
    const now = Date.now();
    if (now - lastObstacleSpawn.current > 2200 + Math.random() * 1500) { // More spacing between obstacles
      const random = Math.random();
      const obstacleType = random > 0.66 ? 'zigzag' : random > 0.33 ? 'box' : 'sky-box';
      const newObstacle: Obstacle = {
        id: nextObstacleId.current++,
        x: GAME_WIDTH,
        y: obstacleType === 'sky-box' ? GROUND_Y - 100 : GROUND_Y, // Sky box appears higher
        type: obstacleType,
        width: obstacleType === 'box' ? 40 : obstacleType === 'sky-box' ? 50 : 35,
        height: obstacleType === 'box' ? 40 : obstacleType === 'sky-box' ? 50 : 35
      };
      
      setObstacles(prev => [...prev, newObstacle]);
      lastObstacleSpawn.current = now;
    }
  }, []);

  const checkCollision = useCallback((playerX: number, playerY: number, obstacle: Obstacle) => {
    // Player bounds
    const playerLeft = playerX;
    const playerRight = playerX + PLAYER_WIDTH;
    const playerTop = playerY;
    const playerBottom = playerY + PLAYER_HEIGHT;
    
    // Obstacle bounds
    const obstacleLeft = obstacle.x;
    const obstacleRight = obstacle.x + obstacle.width;
    const obstacleTop = obstacle.y - obstacle.height;
    const obstacleBottom = obstacle.y;

    // Check if rectangles overlap
    const collision = (
      playerLeft < obstacleRight &&
      playerRight > obstacleLeft &&
      playerTop < obstacleBottom &&
      playerBottom > obstacleTop
    );

    return collision;
  }, []);

  const endGame = useCallback(() => {
    setGameActive(false);
    setGameOver(true);
    
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }

    const earnedXp = score;
    console.log('Game ended! Final score:', score, 'XP earned:', earnedXp);
    onGameComplete(earnedXp);
  }, [score, onGameComplete]);

  const gameLoop = useCallback(() => {
    if (!gameActive) return;

    // Handle player movement
    let newPlayerX = playerX;
    if (keysPressed.current.has('arrowleft') || keysPressed.current.has('a')) {
      newPlayerX = Math.max(20, playerX - 5); // Slightly slower lateral movement
    }
    if (keysPressed.current.has('arrowright') || keysPressed.current.has('d')) {
      newPlayerX = Math.min(GAME_WIDTH - PLAYER_WIDTH - 20, playerX + 5);
    }
    setPlayerX(newPlayerX);

    // Move obstacles and check collisions
    setObstacles(prev => {
      const updatedObstacles = prev.map(obstacle => ({
        ...obstacle,
        x: obstacle.x - gameSpeed
      })).filter(obstacle => obstacle.x > -100);

      // Check for collisions with current player position
      for (const obstacle of updatedObstacles) {
        if (checkCollision(newPlayerX, playerY, obstacle)) {
          console.log('Collision detected!', {
            playerX: newPlayerX,
            playerY: playerY,
            obstacleX: obstacle.x,
            obstacleY: obstacle.y,
            obstacleType: obstacle.type
          });
          endGame();
          return updatedObstacles;
        }
      }

      return updatedObstacles;
    });

    // Update distance and score
    setDistance(prev => prev + 1);
    setScore(prev => prev + 1);

    // Increase game speed more gradually
    setGameSpeed(prev => Math.min(6, prev + 0.001)); // Slower speed increase

    // Spawn new obstacles
    spawnObstacle();

    animationFrameRef.current = requestAnimationFrame(gameLoop);
  }, [gameActive, playerX, playerY, gameSpeed, spawnObstacle, checkCollision, endGame]);

  const startGame = () => {
    setGameActive(true);
    setGameOver(false);
    setPlayerX(100);
    setPlayerY(GROUND_Y - PLAYER_HEIGHT);
    setIsJumping(false);
    setJumpProgress(0);
    setObstacles([]);
    setScore(0);
    setDistance(0);
    setGameSpeed(1.5); // Start with slower speed
    lastObstacleSpawn.current = 0;
    keysPressed.current.clear();
    
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }
    
    console.log('Game started!');
    animationFrameRef.current = requestAnimationFrame(gameLoop);
  };

  useEffect(() => {
    if (gameActive) {
      animationFrameRef.current = requestAnimationFrame(gameLoop);
    }
    
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [gameActive, gameLoop]);

  const renderStickman = () => (
    <svg 
      width={PLAYER_WIDTH} 
      height={PLAYER_HEIGHT} 
      style={{ 
        position: 'absolute', 
        left: playerX, 
        top: playerY,
        zIndex: 20
      }}
    >
      {/* Head */}
      <circle cx="12" cy="10" r="8" fill="black" stroke="black" strokeWidth="2" />
      {/* Body */}
      <line x1="12" y1="18" x2="12" y2="35" stroke="black" strokeWidth="4" />
      {/* Arms */}
      <line x1="12" y1="23" x2="5" y2={isJumping ? "26" : "28"} stroke="black" strokeWidth="3" />
      <line x1="12" y1="23" x2="19" y2={isJumping ? "26" : "28"} stroke="black" strokeWidth="3" />
      {/* Legs */}
      <line x1="12" y1="35" x2="7" y2={isJumping ? "43" : "47"} stroke="black" strokeWidth="3" />
      <line x1="12" y1="35" x2="17" y2={isJumping ? "43" : "47"} stroke="black" strokeWidth="3" />
    </svg>
  );

  const renderObstacle = (obstacle: Obstacle) => {
    if (obstacle.type === 'box') {
      return (
        <div
          key={obstacle.id}
          className="absolute bg-black border-2 border-black"
          style={{
            left: obstacle.x,
            top: obstacle.y - obstacle.height,
            width: obstacle.width,
            height: obstacle.height,
            zIndex: 10
          }}
        />
      );
    } else if (obstacle.type === 'sky-box') {
      return (
        <div
          key={obstacle.id}
          className="absolute bg-red-500 border-2 border-red-700"
          style={{
            left: obstacle.x,
            top: obstacle.y - obstacle.height,
            width: obstacle.width,
            height: obstacle.height,
            zIndex: 10
          }}
        />
      );
    } else {
      // Zigzag crystal
      return (
        <svg
          key={obstacle.id}
          width={obstacle.width}
          height={obstacle.height}
          style={{
            position: 'absolute',
            left: obstacle.x,
            top: obstacle.y - obstacle.height,
            zIndex: 10
          }}
        >
          <polygon 
            points={`${obstacle.width/2},0 ${obstacle.width},${obstacle.height*0.7} ${obstacle.width*0.8},${obstacle.height} ${obstacle.width*0.2},${obstacle.height} 0,${obstacle.height*0.7}`}
            fill="black"
            stroke="black"
            strokeWidth="2"
          />
        </svg>
      );
    }
  };

  return (
    <div className="fixed inset-0 z-50 min-h-screen bg-gradient-to-br from-blue-800 to-slate-800 p-4 flex flex-col">
      {/* Header Row */}
      <div className="flex justify-between items-center mb-6">
        <Button
          variant="ghost"
          onClick={onBack}
          className="bg-white/20 text-white hover:bg-white/30 rounded-full w-12 h-12 p-0"
        >
          <ArrowLeft className="w-6 h-6" />
        </Button>
        <h2 className="font-bold flex-1 text-center text-2xl text-white">Sticky Man Runner</h2>
        <div className="w-12 h-12" /> {/* Spacer for symmetry */}
      </div>
      {/* Main Game Card/Area */}
      <div className="flex-1 flex flex-col w-full h-full items-center justify-center relative">
        <div className={`bg-white ${isMobile ? 'rounded-none border-0 p-0 w-full max-w-full min-w-0' : 'rounded-2xl p-6 w-full max-w-4xl border-4 border-black'}` }>
          {/* Game Stats */}
          <div className={`flex justify-between items-center mb-4 w-full min-w-0 ${isMobile ? 'px-2' : ''}`}>
            <div className="text-left min-w-0">
              <p className="text-lg font-semibold text-black" style={{fontSize: isMobile ? 'clamp(1rem,4vw,1.25rem)' : undefined}}>Score: {score}</p>
              <p className="text-sm text-gray-600" style={{fontSize: isMobile ? 'clamp(0.8rem,3vw,1rem)' : undefined}}>XP Earned</p>
            </div>
            <div className="text-center min-w-0">
              <p className="text-2xl font-bold text-black" style={{fontSize: isMobile ? 'clamp(1.2rem,5vw,2rem)' : undefined}}>{Math.floor(distance / 10)}m</p>
              <p className="text-sm text-gray-600" style={{fontSize: isMobile ? 'clamp(0.8rem,3vw,1rem)' : undefined}}>Distance</p>
            </div>
            <div className="text-right min-w-0">
              <p className="text-lg font-semibold text-black" style={{fontSize: isMobile ? 'clamp(1rem,4vw,1.25rem)' : undefined}}>Speed: {gameSpeed.toFixed(1)}</p>
              <p className="text-sm text-gray-600" style={{fontSize: isMobile ? 'clamp(0.8rem,3vw,1rem)' : undefined}}>Game Speed</p>
            </div>
          </div>
          {/* Game Area */}
          <div 
            ref={gameAreaRef}
            className={`relative mx-auto bg-white border-4 border-black overflow-hidden ${isMobile ? 'w-full max-w-full min-w-0' : ''}`}
            style={{ 
              width: isMobile ? '100vw' : `${GAME_WIDTH}px`,
              height: isMobile ? `min(100vw * 0.5, 80vw)` : `${GAME_HEIGHT}px`,
              minWidth: isMobile ? '0' : undefined,
              maxWidth: isMobile ? '100vw' : undefined
            }}
          >
            {/* Ground */}
            <div 
              className="absolute w-full bg-black"
              style={{ 
                bottom: 0,
                height: `${GAME_HEIGHT - GROUND_Y}px`,
                zIndex: 5
              }}
            />
            {/* Player */}
            {gameActive && renderStickman()}
            {/* Obstacles */}
            {obstacles.map(renderObstacle)}
            {/* Game Over/Start Overlay */}
            {(!gameActive || gameOver) && (
              <div className={`absolute inset-0 bg-black/70 flex flex-col items-center justify-center z-30 ${isMobile ? 'p-2 sm:p-4' : ''} w-full h-full min-w-0 overflow-auto`}>
                {gameOver ? (
                  <div className="bg-white/10 rounded-xl p-6 max-w-md mx-auto flex flex-col items-center">
                    <Trophy className="w-12 h-12 text-yellow-500 mx-auto mb-4" />
                    <h3 className="text-2xl font-bold text-white mb-2">Game Over!</h3>
                    <p className="text-white/80 mb-4">You ran {Math.floor(distance / 10)}m and earned {score} XP!</p>
                    <div className="flex gap-2 justify-center">
                      <Button onClick={startGame} variant="outline" className="text-black">
                        <RotateCcw className="w-4 h-4 mr-2" />
                        Play Again
                      </Button>
                      <Button onClick={onBack}>Back to Games</Button>
                    </div>
                  </div>
                ) : (
                  <div className="absolute inset-0 flex flex-col items-center justify-center z-50 bg-black/60">
                    <Button onClick={startGame} className="bg-orange-500 hover:bg-orange-600 text-white px-8 py-4 text-lg rounded-xl">
                      <Play className="w-5 h-5 mr-2" />
                      Start Running
                    </Button>
                  </div>
                )}
              </div>
            )}
          </div>
          {/* Mobile Controls */}
          <div className={`mt-6 flex justify-center gap-4 ${isMobile ? '' : 'md:hidden'}` }>
            <Button
              onTouchStart={() => keysPressed.current.add('arrowleft')}
              onTouchEnd={() => keysPressed.current.delete('arrowleft')}
              onMouseDown={() => keysPressed.current.add('arrowleft')}
              onMouseUp={() => keysPressed.current.delete('arrowleft')}
              className={`bg-black text-white ${isMobile ? 'px-8 py-6 text-2xl' : 'px-6 py-3'}`}
            >
              ←
            </Button>
            <Button
              onTouchStart={jump}
              onClick={jump}
              className={`bg-black text-white ${isMobile ? 'px-12 py-6 text-2xl' : 'px-8 py-3'}`}
            >
              JUMP
            </Button>
            <Button
              onTouchStart={() => keysPressed.current.add('arrowright')}
              onTouchEnd={() => keysPressed.current.delete('arrowright')}
              onMouseDown={() => keysPressed.current.add('arrowright')}
              onMouseUp={() => keysPressed.current.delete('arrowright')}
              className={`bg-black text-white ${isMobile ? 'px-8 py-6 text-2xl' : 'px-6 py-3'}`}
            >
              →
            </Button>
          </div>
          {/* Instructions */}
          <div className="mt-6 text-sm text-gray-600 text-center">
            <p>🏃‍♂️ Run forward automatically and gain 1 XP per step</p>
            <p>⬅️➡️ Use arrow keys to move left and right</p>
            <p>🚀 Press SPACE to jump over obstacles</p>
            <p>📱 On mobile: Use the control buttons above</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StickyMan;
