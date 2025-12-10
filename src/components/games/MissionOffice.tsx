import { useState, useEffect, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Play, Pause, RotateCcw } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";

interface GameProps {
  onGameComplete: (xp: number) => void;
  onBack: () => void;
}

// For collision, only x, y, width, height are needed
type Collidable = { x: number; y: number; width: number; height: number };
interface GameObject extends Collidable {
  type: string;
  emoji: string;
}

const MissionOffice = ({ onGameComplete, onBack }: GameProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const gameLoopRef = useRef<number>();
  const keysRef = useRef<{ [key: string]: boolean }>({});
  const roadImageRef = useRef<HTMLImageElement | null>(null);
  const playerImageRef = useRef<HTMLImageElement | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const [gameState, setGameState] = useState<'menu' | 'playing' | 'paused' | 'gameOver'>('menu');
  const [score, setScore] = useState(0);
  const [level, setLevel] = useState(1);
  const [lives, setLives] = useState(3);
  
  // Game objects
  const playerRef = useRef({ x: 100, y: 0, width: 150, height: 150, speed: 5 });
  const collectiblesRef = useRef<GameObject[]>([]);
  const roadOffsetRef = useRef(0);
  const spawnTimerRef = useRef(0);
  const gameSpeedRef = useRef(2);

  // Obstacle images
  const obstacleImage1Ref = useRef<HTMLImageElement | null>(null);
  const obstacleImage2Ref = useRef<HTMLImageElement | null>(null);
  useEffect(() => {
    const img1 = new window.Image();
    img1.src = "/office/pngtree-no-obstacles-png-image_4303240-removebg-preview.png";
    obstacleImage1Ref.current = img1;
    const img2 = new window.Image();
    img2.src = "/office/istockphoto-506325411-612x612-removebg-preview.png";
    obstacleImage2Ref.current = img2;
  }, []);

  interface Obstacle {
    x: number;
    y: number;
    width: number;
    height: number;
    image: 1 | 2;
    hit: boolean;
  }
  const obstaclesRef = useRef<Obstacle[]>([]);

  const isMobile = useIsMobile();

  // We'll use a dynamic scale for drawing, based on canvas size and image size
  const [currentScale, setCurrentScale] = useState(isMobile ? 0.45 : 0.7);

  // Road bounds in image coordinates
  const LANE_HEIGHT = Math.round((768 - 518) / 6); // ~42px
  const ROAD_TOP = 518 - 2 * LANE_HEIGHT; // one more lane above
  const ROAD_BOTTOM = 768 + LANE_HEIGHT; // 810

  const collectibleTypes = [
    { type: 'coin', emoji: '🪙', points: 10 },
    { type: 'fuel', emoji: '⛽', points: 15 },
    { type: 'boost', emoji: '⚡', points: 20 }, 
    { type: 'life', emoji: '❤️', points: 0, special: 'life' }
  ];

  const checkCollision = (obj1: Collidable, obj2: Collidable) => {
    return obj1.x < obj2.x + obj2.width &&
           obj1.x + obj1.width > obj2.x &&
           obj1.y < obj2.y + obj2.height &&
           obj1.y + obj1.height > obj2.y;
  };

  const spawnCollectible = () => {
    const canvas = canvasRef.current;
    const img = roadImageRef.current;
    if (!canvas || !img) return;
    const minY = ROAD_TOP;
    const maxY = ROAD_BOTTOM - 50; // 50 = collectible height
    if (Math.random() < 0.2) {
      const collectibleType = collectibleTypes[Math.floor(Math.random() * collectibleTypes.length)];
      collectiblesRef.current.push({
        x: canvas.width / currentScale + 50, // keep original logic for x
        y: Math.random() * (maxY - minY) + minY,
        width: 50,
        height: 50,
        type: collectibleType.type,
        emoji: collectibleType.emoji
      });
    }
  };

  // Spawn obstacles (potholes, realistic obstacles)
  const spawnObstacle = () => {
    const canvas = canvasRef.current;
    const img = roadImageRef.current;
    if (!canvas || !img) return;
    // Obstacle size (reduced)
    const obsWidth = 50; // was 70
    const obsHeight = 50; // was 70
    // Only spawn if not overlapping with collectibles
    let y;
    let attempts = 0;
    do {
      y = Math.random() * (ROAD_BOTTOM - obsHeight - ROAD_TOP) + ROAD_TOP;
      attempts++;
    } while (
      collectiblesRef.current.some(c => Math.abs(c.y - y) < obsHeight) && attempts < 5
    );
    const image = Math.random() < 0.5 ? 1 : 2;
    obstaclesRef.current.push({
      x: canvas.width / currentScale + 80,
      y,
      width: obsWidth,
      height: obsHeight,
      image,
      hit: false
    });
  };

  // Fullscreen state
  const [isFullscreen, setIsFullscreen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      keysRef.current[e.code] = true;
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      keysRef.current[e.code] = false;
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  useEffect(() => {
    // Load road image
    const img = new window.Image();
    img.src = "/office/main.png";
    roadImageRef.current = img;
    // Load player (scotter) image
    const playerImg = new window.Image();
    playerImg.src = "/office/scotter.png";
    playerImageRef.current = playerImg;
    // Load audio
    audioRef.current = new window.Audio("/audio/scotter.mp3");
    audioRef.current.loop = true;
  }, []);

  // Play/pause audio based on gameState
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    if (gameState === 'playing') {
      audio.currentTime = 0;
      audio.play();
    } else {
      audio.pause();
    }
  }, [gameState]);

  // Fullscreen handler
  const handleFullscreen = () => {
    const container = containerRef.current;
    if (container) {
      if (container.requestFullscreen) {
        container.requestFullscreen();
      } else if ((container as unknown as { webkitRequestFullscreen?: () => void }).webkitRequestFullscreen) {
        (container as unknown as { webkitRequestFullscreen?: () => void }).webkitRequestFullscreen!();
      }
      setIsFullscreen(true);
    }
  };

  // Touch controls for mobile
  useEffect(() => {
    if (!isMobile) return;
    let startY = 0;
    let startX = 0;
    const handleTouchStart = (e: TouchEvent) => {
      if (e.touches.length !== 1) return;
      startY = e.touches[0].clientY;
      startX = e.touches[0].clientX;
    };
    const handleTouchEnd = (e: TouchEvent) => {
      if (e.changedTouches.length !== 1) return;
      const endY = e.changedTouches[0].clientY;
      const endX = e.changedTouches[0].clientX;
      const deltaY = endY - startY;
      const deltaX = endX - startX;
      const player = playerRef.current;
      const img = roadImageRef.current;
      // Vertical swipe
      if (Math.abs(deltaY) > Math.abs(deltaX) && Math.abs(deltaY) > 20) {
        if (deltaY < 0) {
          // Swipe up
          const minY = img ? ROAD_TOP : 0;
          player.y = Math.max(minY, player.y - player.speed * 8); // more movement for swipe
        } else {
          // Swipe down
          const maxY = img ? ROAD_BOTTOM - player.height : (canvasRef.current?.height || 0) - player.height;
          player.y = Math.min(maxY, player.y + player.speed * 8);
        }
      } else if (Math.abs(deltaX) > 20) {
        if (deltaX < 0) {
          // Swipe left
          player.x = Math.max(0, player.x - player.speed * 8);
        } else {
          // Swipe right
          const maxX = img ? img.width - player.width : (canvasRef.current?.width || 0) - player.width;
          player.x = Math.min(maxX, player.x + player.speed * 8);
        }
      }
    };
    window.addEventListener("touchstart", handleTouchStart);
    window.addEventListener("touchend", handleTouchEnd);
    return () => {
      window.removeEventListener("touchstart", handleTouchStart);
      window.removeEventListener("touchend", handleTouchEnd);
    };
  }, [isMobile]);

  // Resize canvas to match scaled road image size and center in window
  useEffect(() => {
    const resizeCanvas = () => {
      const canvas = canvasRef.current;
      const img = roadImageRef.current;
      if (canvas && img && img.complete) {
        let scale = isMobile ? (window.innerWidth - 24) / img.width : 0.7;
        if (!isMobile) scale = 0.7;
        canvas.width = img.width * scale;
        canvas.height = img.height * scale;
        setCurrentScale(scale);
      }
    };
    // Wait for image to load before resizing
    if (roadImageRef.current && !roadImageRef.current.complete) {
      roadImageRef.current.onload = resizeCanvas;
    } else {
      resizeCanvas();
    }
    window.addEventListener('resize', resizeCanvas);
    return () => window.removeEventListener('resize', resizeCanvas);
  }, [isMobile]);

  const updateGame = useCallback(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx || gameState !== 'playing') return;

    const player = playerRef.current;
    
    // Move road offset for scrolling effect
    roadOffsetRef.current += gameSpeedRef.current;

    // Draw road background using image
    if (roadImageRef.current && roadImageRef.current.complete) {
      const img = roadImageRef.current;
      // Draw the road image at (0,0), scaled
      let x = -roadOffsetRef.current % img.width;
      if (x > 0) x -= img.width;
      for (; x < img.width; x += img.width) {
        ctx.drawImage(img, x * currentScale, 0, img.width * currentScale, img.height * currentScale);
      }
    } else {
      ctx.fillStyle = '#404040';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }

    // Handle player movement
    const img = roadImageRef.current;
    if (img) {
      const minY = ROAD_TOP;
      const maxY = ROAD_BOTTOM - player.height;
      if (keysRef.current['ArrowUp'] && player.y > minY) {
        player.y -= player.speed;
      }
      if (keysRef.current['ArrowDown'] && player.y < maxY) {
        player.y += player.speed;
      }
      // Clamp player position to road
      player.y = Math.max(minY, Math.min(player.y, maxY));
    } else {
      if (keysRef.current['ArrowUp'] && player.y > 0) {
        player.y -= player.speed;
      }
      if (keysRef.current['ArrowDown'] && player.y < canvas.height - player.height) {
        player.y += player.speed;
      }
      player.y = Math.max(0, Math.min(player.y, canvas.height - player.height));
    }
    if (keysRef.current['ArrowLeft'] && player.x > 0) {
      player.x -= player.speed;
    }
    if (keysRef.current['ArrowRight'] && player.x < (img ? img.width : canvas.width) - player.width) {
      player.x += player.speed;
    }

    // Spawn obstacles every ~2 seconds (randomized)
    if (Math.random() < 0.0035) { // even less frequent
      spawnObstacle();
    }

    // Draw player (scotter image instead of emoji)
    if (playerImageRef.current && playerImageRef.current.complete) {
      ctx.drawImage(
        playerImageRef.current,
        player.x * currentScale,
        player.y * currentScale,
        player.width * currentScale,
        player.height * currentScale
      );
    } else {
      ctx.font = `${40 * currentScale}px Arial`;
      ctx.textAlign = 'center';
      ctx.fillText('🏍️', (player.x + player.width/2) * currentScale, (player.y + player.height/2 + 15) * currentScale);
    }

    // Draw and update obstacles
    obstaclesRef.current = obstaclesRef.current.filter(obstacle => {
      obstacle.x -= (gameSpeedRef.current + 1);
      // Draw obstacle
      const obsImg = obstacle.image === 1 ? obstacleImage1Ref.current : obstacleImage2Ref.current;
      if (obsImg && obsImg.complete) {
        ctx.drawImage(
          obsImg,
          obstacle.x * currentScale,
          obstacle.y * currentScale,
          obstacle.width * currentScale,
          obstacle.height * currentScale
        );
      } else {
        ctx.fillStyle = '#333';
        ctx.fillRect(
          obstacle.x * currentScale,
          obstacle.y * currentScale,
          obstacle.width * currentScale,
          obstacle.height * currentScale
        );
      }
      // Collision with only lower 50% of player (scooter)
      const lowerPlayerBox = {
        x: player.x,
        y: player.y + player.height * 0.5,
        width: player.width,
        height: player.height * 0.5
      };
      let collision = false;
      if (obstacle.image === 1) {
        // Pothole: use circular collision with smaller radius
        const potholeRadius = obstacle.width * 0.4;
        const potholeCenterX = obstacle.x + obstacle.width / 2;
        const potholeCenterY = obstacle.y + obstacle.height / 2;
        // Check if any point in lowerPlayerBox is within pothole circle
        const corners = [
          { x: lowerPlayerBox.x, y: lowerPlayerBox.y },
          { x: lowerPlayerBox.x + lowerPlayerBox.width, y: lowerPlayerBox.y },
          { x: lowerPlayerBox.x, y: lowerPlayerBox.y + lowerPlayerBox.height },
          { x: lowerPlayerBox.x + lowerPlayerBox.width, y: lowerPlayerBox.y + lowerPlayerBox.height }
        ];
        collision = corners.some(pt => {
          const dx = pt.x + lowerPlayerBox.width/2 - potholeCenterX;
          const dy = pt.y + lowerPlayerBox.height/2 - potholeCenterY;
          return Math.sqrt(dx*dx + dy*dy) < potholeRadius;
        });
      } else {
        // Normal rectangle collision for other obstacles
        collision = checkCollision(lowerPlayerBox, obstacle);
      }
      if (!obstacle.hit && collision) {
        obstacle.hit = true;
        setGameState('gameOver');
        if (audioRef.current) audioRef.current.pause();
      }
      // Remove if off screen or hit
      return obstacle.x > -obstacle.width && !obstacle.hit;
    });

    // Spawn collectibles only
    spawnTimerRef.current++;
    if (spawnTimerRef.current > 120 - (level * 5)) { // less frequent
      spawnCollectible();
      spawnTimerRef.current = 0;
    }

    // Update and draw collectibles
    collectiblesRef.current = collectiblesRef.current.filter(collectible => {
      collectible.x -= gameSpeedRef.current + 1;
      // Keep collectibles within the road image area
      const img = roadImageRef.current;
      if (img) {
        collectible.y = Math.max(ROAD_TOP, Math.min(collectible.y, ROAD_BOTTOM - collectible.height));
      }
      if (collectible.x > -collectible.width) {
        ctx.font = `${25 * currentScale}px Arial`;
        ctx.textAlign = 'center';
        ctx.fillText(collectible.emoji, (collectible.x + collectible.width/2) * currentScale, (collectible.y + collectible.height/2 + 8) * currentScale);
        // Check collision with player
        if (checkCollision(player, collectible)) {
          if (collectible.type === 'life') {
            setLives(prev => Math.min(prev + 1, 5));
          } else {
            setScore(prev => prev + 20);
          }
          return false; // Remove collectible
        }
        return true;
      }
      return false;
    });

    // Update score and level
    setScore(prev => {
      const newScore = prev + 1;
      const newLevel = Math.floor(newScore / 500) + 1;
      if (newLevel !== level) {
        setLevel(newLevel);
        gameSpeedRef.current = Math.min(2 + newLevel * 0.5, 6);
      }
      return newScore;
    });
  }, [gameState, score, level]);

  const startGame = () => {
    setGameState('playing');
    setScore(0);
    setLevel(1);
    setLives(3);
    playerRef.current = { x: 100, y: ROAD_TOP, width: 150, height: 150, speed: 5 };
    collectiblesRef.current = [];
    roadOffsetRef.current = 0;
    spawnTimerRef.current = 0;
    gameSpeedRef.current = 2;
  };

  const pauseGame = () => {
    setGameState(gameState === 'playing' ? 'paused' : 'playing');
  };

  const resetGame = () => {
    setGameState('menu');
    if (gameLoopRef.current) {
      cancelAnimationFrame(gameLoopRef.current);
    }
  };

  // Handler for back button that pauses the game before navigating back
  const handleBackAndPause = () => {
    setGameState('paused');
    setTimeout(() => onBack(), 0);
  };

  // Mobile continuous movement state
  const moveIntervalRef = useRef<{ [key: string]: number | null }>({ up: null, down: null, left: null, right: null });

  // Helper to start/stop movement
  const startMove = (dir: 'up' | 'down' | 'left' | 'right') => {
    const keyMap = { up: 'ArrowUp', down: 'ArrowDown', left: 'ArrowLeft', right: 'ArrowRight' };
    if (moveIntervalRef.current[dir]) return;
    keysRef.current[keyMap[dir]] = true;
    const move = () => {
      keysRef.current[keyMap[dir]] = true;
      moveIntervalRef.current[dir] = requestAnimationFrame(move);
    };
    moveIntervalRef.current[dir] = requestAnimationFrame(move);
  };
  const stopMove = (dir: 'up' | 'down' | 'left' | 'right') => {
    const keyMap = { up: 'ArrowUp', down: 'ArrowDown', left: 'ArrowLeft', right: 'ArrowRight' };
    keysRef.current[keyMap[dir]] = false;
    if (moveIntervalRef.current[dir]) {
      cancelAnimationFrame(moveIntervalRef.current[dir]!);
      moveIntervalRef.current[dir] = null;
    }
  };

  useEffect(() => {
    if (gameState === 'playing') {
      const gameLoop = () => {
        updateGame();
        gameLoopRef.current = requestAnimationFrame(gameLoop);
      };
      gameLoopRef.current = requestAnimationFrame(gameLoop);
    } else if (gameLoopRef.current) {
      cancelAnimationFrame(gameLoopRef.current);
    }

    return () => {
      if (gameLoopRef.current) {
        cancelAnimationFrame(gameLoopRef.current);
      }
    };
  }, [gameState, updateGame]);

  return (
    <div ref={containerRef} className={`fixed inset-0 z-50 min-h-screen bg-gradient-to-br from-gray-800 to-slate-900 p-0 flex flex-col items-center justify-center` + (isMobile ? ' !p-0' : '')}>
      {/* Header */}
      <div className={`relative flex flex-col sm:flex-row justify-between items-center mb-4 sm:mb-6 p-2 sm:p-4 w-full` + (isMobile ? ' gap-2' : '')} style={{ maxWidth: roadImageRef.current?.width ? (isMobile ? '100vw' : roadImageRef.current.width * currentScale) : 'auto' }}>
        {/* Back button - top left on mobile */}
        {isMobile ? (
          <Button
            variant="ghost"
            onClick={handleBackAndPause}
            className="text-white hover:bg-white/20 absolute top-2 left-2 z-10"
          >
            <ArrowLeft className="w-6 h-6 mr-2" />
          </Button>
        ) : (
          <Button
            variant="ghost"
            onClick={handleBackAndPause}
            className="text-white hover:bg-white/20"
          >
            <ArrowLeft className="w-6 h-6 mr-2" />
            Back to Games
          </Button>
        )}
        <h2 className={`text-2xl sm:text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-red-600 text-center w-full` + (isMobile ? ' mt-2' : '')}>
          🏍️ Mission Office
        </h2>
        {/* Stats - right side on mobile */}
        <div className={`text-white ${isMobile ? 'absolute top-2 right-2 text-right z-10' : 'text-right'}`}>
          <div>Score: {score}</div>
          <div>Level: {level}</div>
          <div>Lives: {'❤️'.repeat(lives)}</div>
        </div>
      </div>
      {/* Game Area */}
      <div className="flex-1 flex justify-center items-center w-full">
        <div className={`bg-white/10 backdrop-blur-sm rounded-2xl p-0 flex flex-col items-center justify-center relative`}
          style={{ width: roadImageRef.current?.width ? (isMobile ? '100vw' : roadImageRef.current.width * currentScale) : 'auto', height: roadImageRef.current?.height ? (isMobile ? 'auto' : roadImageRef.current.height * currentScale) : 'auto', maxWidth: isMobile ? '100vw' : undefined }}>
          <div className="relative w-full flex justify-center items-center">
            <canvas
              ref={canvasRef}
              className="border-4 border-white/20 rounded-lg bg-gray-700 mx-auto"
              style={{ width: isMobile ? '100vw' : undefined, height: isMobile ? 'auto' : undefined }}
            />
            {/* Game Over Overlay centered over canvas */}
            {gameState === 'gameOver' && (
              <div className="absolute inset-0 flex flex-col items-center justify-center z-30">
                <div className="bg-white/10 rounded-xl p-6 max-w-md mx-auto flex flex-col items-center">
                  <h3 className="text-2xl font-bold text-black mb-4">Mission Failed!</h3>
                  <p className="text-black mb-4">Final Score: {score}</p>
                  <p className="text-black mb-4">+{score} XP earned!</p>
                  <div className="flex gap-2 justify-center">
                    <Button onClick={startGame} className="bg-green-500 hover:bg-green-600">
                      Try Again
                    </Button>
                    <Button onClick={handleBackAndPause} variant="outline">
                      Back to Games
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </div>
          {/* Game Controls */}
          <div className={`flex ${isMobile ? 'flex-row justify-center gap-2 mt-2 mb-2' : 'justify-center gap-4 mt-4 absolute top-4 right-4 z-10'}`}>
            {gameState === 'menu' && (
              <Button onClick={startGame} className="bg-green-500 hover:bg-green-600">
                <Play className="w-4 h-4 mr-2" />
                Start Mission
              </Button>
            )}
            {(gameState === 'playing' || gameState === 'paused') && (
              <>
                <Button onClick={pauseGame} className="bg-yellow-500 hover:bg-yellow-600">
                  {gameState === 'playing' ? <Pause className="w-4 h-4 mr-2" /> : <Play className="w-4 h-4 mr-2" />}
                  {gameState === 'playing' ? 'Pause' : 'Resume'}
                </Button>
                <Button onClick={resetGame} variant="outline">
                  <RotateCcw className="w-4 h-4 mr-2" />
                  Reset
                </Button>
              </>
            )}
          </div>
        </div>
      </div>
      {/* Mobile D-Pad Controls - fixed at bottom, only during playing */}
      {isMobile && gameState === 'playing' && (
        <div className="fixed bottom-6 left-0 w-full flex justify-center z-50 pointer-events-none">
          <div className="relative" style={{ width: 180, height: 180 }}>
            {/* D-pad background circle */}
            <div className="absolute inset-0 rounded-full bg-gray-700/40 shadow-xl" style={{ width: 180, height: 180 }} />
            {/* Up */}
            <Button
              className="absolute left-1/2 -translate-x-1/2 bg-white/20 text-white rounded-full w-14 h-14 text-3xl flex items-center justify-center shadow-xl active:bg-white/40 hover:bg-white/30 transition-all duration-150 pointer-events-auto border-2 border-white/40 hover:scale-110 focus:scale-110"
              style={{ top: 10 }}
              aria-label="Move Up"
              onTouchStart={() => startMove('up')}
              onTouchEnd={() => stopMove('up')}
              onMouseDown={() => startMove('up')}
              onMouseUp={() => stopMove('up')}
              onMouseLeave={() => stopMove('up')}
            >
              ⬆️
            </Button>
            {/* Down */}
            <Button
              className="absolute left-1/2 -translate-x-1/2 bg-white/20 text-white rounded-full w-14 h-14 text-3xl flex items-center justify-center shadow-xl active:bg-white/40 hover:bg-white/30 transition-all duration-150 pointer-events-auto border-2 border-white/40 hover:scale-110 focus:scale-110"
              style={{ bottom: 10 }}
              aria-label="Move Down"
              onTouchStart={() => startMove('down')}
              onTouchEnd={() => stopMove('down')}
              onMouseDown={() => startMove('down')}
              onMouseUp={() => stopMove('down')}
              onMouseLeave={() => stopMove('down')}
            >
              ⬇️
            </Button>
            {/* Left */}
            <Button
              className="absolute top-1/2 -translate-y-1/2 bg-white/20 text-white rounded-full w-14 h-14 text-3xl flex items-center justify-center shadow-xl active:bg-white/40 hover:bg-white/30 transition-all duration-150 pointer-events-auto border-2 border-white/40 hover:scale-110 focus:scale-110"
              style={{ left: 10 }}
              aria-label="Move Left"
              onTouchStart={() => startMove('left')}
              onTouchEnd={() => stopMove('left')}
              onMouseDown={() => startMove('left')}
              onMouseUp={() => stopMove('left')}
              onMouseLeave={() => stopMove('left')}
            >
              ⬅️
            </Button>
            {/* Right */}
            <Button
              className="absolute top-1/2 -translate-y-1/2 bg-white/20 text-white rounded-full w-14 h-14 text-3xl flex items-center justify-center shadow-xl active:bg-white/40 hover:bg-white/30 transition-all duration-150 pointer-events-auto border-2 border-white/40 hover:scale-110 focus:scale-110"
              style={{ right: 10 }}
              aria-label="Move Right"
              onTouchStart={() => startMove('right')}
              onTouchEnd={() => stopMove('right')}
              onMouseDown={() => startMove('right')}
              onMouseUp={() => stopMove('right')}
              onMouseLeave={() => stopMove('right')}
            >
              ➡️
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default MissionOffice;