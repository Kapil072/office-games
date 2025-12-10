import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Play, Pause, RotateCcw } from 'lucide-react';
import { useIsMobile } from "@/hooks/use-mobile";

// Game constants
const GRID_SIZE = 20;
const CELL_SIZE = typeof window !== 'undefined' && window.innerWidth > 700 ? 30 : 15; // Larger for PC
const BORDER_COLOR = '#1e293b'; // slate-800
const BORDER_WIDTH = 8;
const INITIAL_SPEED = 150;
const SPEED_INCREMENT = 5;

// Direction constants
const DIRECTIONS = {
  UP: { x: 0, y: -1 },
  DOWN: { x: 0, y: 1 },
  LEFT: { x: -1, y: 0 },
  RIGHT: { x: 1, y: 0 },
};

type Position = {
  x: number;
  y: number;
};

// Helper for wave effect
function getWaveOffset(index: number, direction: { x: number; y: number }, time: number) {
  // Amplitude and frequency can be tweaked for effect
  const amplitude = 0.25;
  const frequency = 0.6;
  // Perpendicular direction
  const perp = { x: -direction.y, y: direction.x };
  // Sine wave offset
  const offset = Math.sin(time * 2 + index * frequency) * amplitude;
  return { x: perp.x * offset, y: perp.y * offset };
}

const SnakeGame: React.FC = () => {
  const [snake, setSnake] = useState<Position[]>([{ x: 10, y: 10 }]);
  const [food, setFood] = useState<Position>({ x: 5, y: 5 });
  const [direction, setDirection] = useState(DIRECTIONS.RIGHT);
  const [score, setScore] = useState(0);
  const [speed, setSpeed] = useState(INITIAL_SPEED);
  const [gameOver, setGameOver] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [lastDirection, setLastDirection] = useState(DIRECTIONS.RIGHT);
  const gameLoopRef = useRef<number>();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const isMobile = useIsMobile();

  const generateFood = useCallback(() => {
    const newFood = {
      x: Math.floor(Math.random() * GRID_SIZE),
      y: Math.floor(Math.random() * GRID_SIZE),
    };
    return newFood;
  }, []);

  // Remove wrapPosition, use boundary check instead

  const checkCollision = useCallback((head: Position) => {
    // Only check self collision
    for (let i = 1; i < snake.length; i++) {
      if (head.x === snake[i].x && head.y === snake[i].y) {
        return true;
      }
    }
    return false;
  }, [snake]);

  const moveSnake = useCallback(() => {
    if (gameOver || isPaused || !isPlaying) return;

    setSnake(prevSnake => {
      const newSnake = [...prevSnake];
      const head = { ...newSnake[0] };

      // Move head
      head.x += direction.x;
      head.y += direction.y;

      // Check boundary collision
      if (head.x < 0 || head.x >= GRID_SIZE || head.y < 0 || head.y >= GRID_SIZE) {
        setGameOver(true);
        setIsPlaying(false);
        return prevSnake;
      }

      // Check self collision
      if (checkCollision(head)) {
        setGameOver(true);
        setIsPlaying(false);
        return prevSnake;
      }

      // Check food collision
      if (head.x === food.x && head.y === food.y) {
        setScore(prev => prev + 1);
        setFood(generateFood());
        setSpeed(prev => Math.max(prev - SPEED_INCREMENT, 50));
      } else {
        newSnake.pop();
      }

      setLastDirection(direction);
      return [head, ...newSnake];
    });
  }, [direction, food, gameOver, isPaused, isPlaying, checkCollision, generateFood]);

  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (!isPlaying) return;
      
      switch (e.key) {
        case 'ArrowUp':
          if (lastDirection !== DIRECTIONS.DOWN) {
            setDirection(DIRECTIONS.UP);
          }
          break;
        case 'ArrowDown':
          if (lastDirection !== DIRECTIONS.UP) {
            setDirection(DIRECTIONS.DOWN);
          }
          break;
        case 'ArrowLeft':
          if (lastDirection !== DIRECTIONS.RIGHT) {
            setDirection(DIRECTIONS.LEFT);
          }
          break;
        case 'ArrowRight':
          if (lastDirection !== DIRECTIONS.LEFT) {
            setDirection(DIRECTIONS.RIGHT);
          }
          break;
        case ' ':
          setIsPaused(prev => !prev);
          break;
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [lastDirection, isPlaying]);

  useEffect(() => {
    if (!gameOver && !isPaused && isPlaying) {
      gameLoopRef.current = window.setInterval(moveSnake, speed);
    }
    return () => {
      if (gameLoopRef.current) {
        clearInterval(gameLoopRef.current);
      }
    };
  }, [moveSnake, gameOver, isPaused, isPlaying, speed]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas
    ctx.fillStyle = '#000000';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Animate wave effect
    const now = performance.now() / 400;
    let prevDir = direction;
    for (let i = 0; i < snake.length; i++) {
      const segment = snake[i];
      // For the head, use current direction; for body, interpolate from previous
      if (i > 0) {
        const prev = snake[i - 1];
        prevDir = { x: prev.x - segment.x, y: prev.y - segment.y };
        // Normalize
        const len = Math.sqrt(prevDir.x * prevDir.x + prevDir.y * prevDir.y) || 1;
        prevDir = { x: prevDir.x / len, y: prevDir.y / len };
      } else {
        prevDir = direction;
      }
      // Wave offset
      const wave = getWaveOffset(i, prevDir, now);
      const x = (segment.x + wave.x) * CELL_SIZE;
      const y = (segment.y + wave.y) * CELL_SIZE;
      // Head is brighter, tail is darker
      const t = i / (snake.length - 1 || 1);
      const color = `hsl(220, 80%, ${45 - t * 25}%)`;
      ctx.save();
      ctx.beginPath();
      ctx.shadowColor = '#0ea5e9';
      ctx.shadowBlur = i === 0 ? 16 : 6;
      ctx.fillStyle = color;
      ctx.roundRect(x, y, CELL_SIZE - 1, CELL_SIZE - 1, 6);
      ctx.fill();
      ctx.restore();
      // Add a subtle highlight to the head
      if (i === 0) {
        ctx.save();
        ctx.globalAlpha = 0.18;
        ctx.fillStyle = '#fff';
        ctx.beginPath();
        ctx.arc(x + CELL_SIZE / 2, y + CELL_SIZE / 2, CELL_SIZE / 3, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
        // Draw eyes
        ctx.save();
        const eyeOffset = CELL_SIZE * 0.18;
        const eyeRadius = CELL_SIZE * 0.11;
        // Eye positions depend on direction
        const ex1 = x + CELL_SIZE / 2 + (direction.y === 0 ?  eyeOffset : 0) + (direction.x === 0 ? -eyeOffset : 0);
        const ey1 = y + CELL_SIZE / 2 + (direction.x === 0 ? -eyeOffset : 0) + (direction.y === 0 ? -eyeOffset : 0);
        const ex2 = x + CELL_SIZE / 2 + (direction.y === 0 ? -eyeOffset : 0) + (direction.x === 0 ? eyeOffset : 0);
        const ey2 = y + CELL_SIZE / 2 + (direction.x === 0 ? -eyeOffset : 0) + (direction.y === 0 ? eyeOffset : 0);
        ctx.fillStyle = '#fff';
        ctx.beginPath();
        ctx.arc(ex1, ey1, eyeRadius, 0, Math.PI * 2);
        ctx.arc(ex2, ey2, eyeRadius, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#222';
        ctx.beginPath();
        ctx.arc(ex1, ey1, eyeRadius * 0.5, 0, Math.PI * 2);
        ctx.arc(ex2, ey2, eyeRadius * 0.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }
    }
    // Draw food with glow effect (draw after snake for visibility)
    ctx.save();
    ctx.beginPath();
    ctx.arc(
      food.x * CELL_SIZE + CELL_SIZE / 2,
      food.y * CELL_SIZE + CELL_SIZE / 2,
      CELL_SIZE / 2 - 2,
      0,
      Math.PI * 2
    );
    ctx.fillStyle = '#fbbf24'; // amber-400
    ctx.shadowColor = '#f59e42';
    ctx.shadowBlur = 16;
    ctx.fill();
    ctx.shadowBlur = 0;
    // Add a border for contrast
    ctx.lineWidth = 2;
    ctx.strokeStyle = '#fff';
    ctx.stroke();
    ctx.restore();

    // Animate
    requestAnimationFrame(() => {
      if (!gameOver && isPlaying) {
        // Redraw for animation
        if (canvasRef.current) {
          const ev = new Event('redraw');
          canvasRef.current.dispatchEvent(ev);
        }
      }
    });
  }, [snake, food, direction, gameOver, isPlaying]);

  // Redraw on custom event for animation
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const redraw = () => {
      // Just trigger a state update to force re-render
      setScore(s => s);
    };
    canvas.addEventListener('redraw', redraw);
    return () => canvas.removeEventListener('redraw', redraw);
  }, []);

  // Touch controls for mobile: tap left/right half of canvas to turn
  useEffect(() => {
    if (!isMobile) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const handleTouchEnd = (e: TouchEvent) => {
      if (!isPlaying || gameOver) return;
      if (e.changedTouches.length !== 1) return;
      const touch = e.changedTouches[0];
      const rect = canvas.getBoundingClientRect();
      const x = touch.clientX - rect.left;
      // Determine left or right half
      const isLeft = x < rect.width / 2;
      // Determine new direction based on current direction
      let newDir = direction;
      if (direction === DIRECTIONS.UP) newDir = isLeft ? DIRECTIONS.LEFT : DIRECTIONS.RIGHT;
      else if (direction === DIRECTIONS.DOWN) newDir = isLeft ? DIRECTIONS.RIGHT : DIRECTIONS.LEFT;
      else if (direction === DIRECTIONS.LEFT) newDir = isLeft ? DIRECTIONS.DOWN : DIRECTIONS.UP;
      else if (direction === DIRECTIONS.RIGHT) newDir = isLeft ? DIRECTIONS.UP : DIRECTIONS.DOWN;
      // Prevent 180-degree turns
      if ((lastDirection.x + newDir.x !== 0) || (lastDirection.y + newDir.y !== 0)) {
        setDirection(newDir);
      }
    };
    canvas.addEventListener("touchend", handleTouchEnd);
    return () => canvas.removeEventListener("touchend", handleTouchEnd);
  }, [isMobile, isPlaying, gameOver, direction, lastDirection]);

  const startGame = () => {
    setIsPlaying(true);
    setIsPaused(false);
    setGameOver(false);
  };

  const restartGame = () => {
    setSnake([{ x: 10, y: 10 }]);
    setDirection(DIRECTIONS.RIGHT);
    setLastDirection(DIRECTIONS.RIGHT);
    setScore(0);
    setSpeed(INITIAL_SPEED);
    setGameOver(false);
    setFood(generateFood());
    setIsPaused(false);
    setIsPlaying(false);
  };

  return (
    <div className="w-full flex flex-col items-center">
      <div className="flex justify-between w-full max-w-xs mb-2">
        <div className="font-semibold text-blue-700">Score: {score}</div>
        {isPlaying && (
          <button
            className="px-4 py-1 bg-blue-500 text-white rounded-full text-sm hover:bg-blue-600 transition"
            onClick={() => setIsPaused(prev => !prev)}
          >
            {isPaused ? 'Resume' : 'Pause'}
          </button>
        )}
      </div>
      <div className="relative">
        <div
          style={{
            display: 'inline-block',
            background: BORDER_COLOR,
            borderRadius: 16,
            padding: BORDER_WIDTH,
          }}
        >
          <canvas
            ref={canvasRef}
            width={GRID_SIZE * CELL_SIZE}
            height={GRID_SIZE * CELL_SIZE}
            className="rounded-lg bg-black"
            style={{
              maxWidth: '95vw',
              width: typeof window !== 'undefined' && window.innerWidth > 700 ? 600 : '95vw',
              height: typeof window !== 'undefined' && window.innerWidth > 700 ? 600 : '95vw',
              boxSizing: 'content-box',
              display: 'block',
            }}
          />
        </div>
        {!isPlaying && !gameOver && (
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center rounded-lg">
            <button
              className="p-4 bg-blue-500 text-white rounded-full hover:bg-blue-600 transition-all duration-300 hover:scale-110"
              onClick={startGame}
            >
              <Play className="w-8 h-8" />
            </button>
          </div>
        )}
        {gameOver && (
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center rounded-lg">
            <div className="bg-white p-6 rounded-lg text-center">
              <h2 className="text-2xl font-bold mb-4">Game Over!</h2>
              <p className="text-lg mb-4">Score: {score}</p>
              <button
                className="px-6 py-2 bg-blue-500 text-white rounded-full font-semibold hover:bg-blue-600 transition flex items-center gap-2 mx-auto"
                onClick={restartGame}
              >
                <RotateCcw className="w-5 h-5" />
                Play Again
              </button>
            </div>
          </div>
        )}
      </div>
      <div className="mt-4 text-sm text-gray-600">
        {isPlaying ? 'Use arrow keys to move • Space to pause' : 'Click play to start'}
      </div>
      {/* Mobile Joystick */}
      {isMobile && (
        <div className="fixed bottom-0 left-0 w-full flex flex-col items-center pb-[18vw] mb-2 z-50">
          <div className="relative" style={{ width: 'min(40vw, 220px)', height: 'min(40vw, 220px)' }}>
            {/* Joystick background circle */}
            <div className="absolute inset-0 rounded-full bg-blue-100 shadow-lg" style={{ width: '100%', height: '100%' }} />
            {/* Up */}
            <button
              className="absolute left-1/2 -translate-x-1/2 bg-blue-300 text-blue-900 rounded-full flex items-center justify-center text-2xl active:bg-blue-400 shadow-md"
              style={{ zIndex: 2, top: '8%', width: '22%', height: '22%' }}
              onTouchStart={() => { if (lastDirection !== DIRECTIONS.DOWN) setDirection(DIRECTIONS.UP); }}
              onMouseDown={() => { if (lastDirection !== DIRECTIONS.DOWN) setDirection(DIRECTIONS.UP); }}
            >
              ↑
            </button>
            {/* Down */}
            <button
              className="absolute left-1/2 -translate-x-1/2 bg-blue-300 text-blue-900 rounded-full flex items-center justify-center text-2xl active:bg-blue-400 shadow-md"
              style={{ zIndex: 2, bottom: '8%', width: '22%', height: '22%' }}
              onTouchStart={() => { if (lastDirection !== DIRECTIONS.UP) setDirection(DIRECTIONS.DOWN); }}
              onMouseDown={() => { if (lastDirection !== DIRECTIONS.UP) setDirection(DIRECTIONS.DOWN); }}
            >
              ↓
            </button>
            {/* Left */}
            <button
              className="absolute top-1/2 -translate-y-1/2 bg-blue-300 text-blue-900 rounded-full flex items-center justify-center text-2xl active:bg-blue-400 shadow-md"
              style={{ zIndex: 2, left: '8%', width: '22%', height: '22%' }}
              onTouchStart={() => { if (lastDirection !== DIRECTIONS.RIGHT) setDirection(DIRECTIONS.LEFT); }}
              onMouseDown={() => { if (lastDirection !== DIRECTIONS.RIGHT) setDirection(DIRECTIONS.LEFT); }}
            >
              ←
            </button>
            {/* Right */}
            <button
              className="absolute top-1/2 -translate-y-1/2 bg-blue-300 text-blue-900 rounded-full flex items-center justify-center text-2xl active:bg-blue-400 shadow-md"
              style={{ zIndex: 2, right: '8%', width: '22%', height: '22%' }}
              onTouchStart={() => { if (lastDirection !== DIRECTIONS.LEFT) setDirection(DIRECTIONS.RIGHT); }}
              onMouseDown={() => { if (lastDirection !== DIRECTIONS.LEFT) setDirection(DIRECTIONS.RIGHT); }}
            >
              →
            </button>
            {/* Center (inactive, for visual effect) */}
            <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-blue-200 border-2 border-blue-300 rounded-full shadow-inner" style={{ zIndex: 1, width: '14%', height: '14%' }} />
          </div>
        </div>
      )}
    </div>
  );
};

export default SnakeGame; 