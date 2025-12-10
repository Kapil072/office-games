import React, { useRef, useEffect, useState } from 'react';
import { Button } from "@/components/ui/button";
import { ArrowLeft, Trophy } from "lucide-react";

const CANVAS_WIDTH = 400;
const CANVAS_HEIGHT = 600;
const CAR_WIDTH = 40;
const CAR_HEIGHT = 80;
const OBSTACLE_WIDTH = 40;
const OBSTACLE_HEIGHT = 80;
const INITIAL_OBSTACLE_SPEED = 8;
const MAX_OBSTACLE_SPEED = 20;
const MIN_KMPH = 60;
const MAX_KMPH = 150;
const CAR_SPEED = 10;

// Responsive lane positions (as a fraction of width)
const LANE_X_FRAC = [0.15, 0.45, 0.75]; // 60/400, 180/400, 300/400
const CAR_START_FRAC = 0.45; // 180/400
const CAR_WIDTH_FRAC = CAR_WIDTH / CANVAS_WIDTH;
const CAR_HEIGHT_FRAC = CAR_HEIGHT / CANVAS_HEIGHT;
const OBSTACLE_WIDTH_FRAC = OBSTACLE_WIDTH / CANVAS_WIDTH;
const OBSTACLE_HEIGHT_FRAC = OBSTACLE_HEIGHT / CANVAS_HEIGHT;

function getRandomLaneFrac() {
  return LANE_X_FRAC[Math.floor(Math.random() * LANE_X_FRAC.length)];
}

interface CarRacingGameProps {
  onGameComplete: (score: number) => void;
  onBack: () => void;
}

const CarRacingGame: React.FC<CarRacingGameProps> = ({ onGameComplete, onBack }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [score, setScore] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [running, setRunning] = useState(true);
  // Use fraction for car position (0 to 1)
  const [carLane, setCarLane] = useState(1); // 0: left, 1: middle, 2: right
  const [obstacles, setObstacles] = useState([
    { lane: Math.floor(Math.random() * 3), yFrac: -OBSTACLE_HEIGHT_FRAC },
    { lane: Math.floor(Math.random() * 3), yFrac: -OBSTACLE_HEIGHT_FRAC * 4 },
  ]);
  const [obstacleSpeed, setObstacleSpeed] = useState(INITIAL_OBSTACLE_SPEED);
  const raceAudioRef = useRef<HTMLAudioElement | null>(null);

  const carImg = new window.Image();
  carImg.src = '/car/caricon.png';
  const truckImg = new window.Image();
  truckImg.src = '/car/truckicon.png';

  // Handle keyboard controls
  useEffect(() => {
    if (!running) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') {
        setCarLane((prev) => Math.max(0, prev - 1));
      } else if (e.key === 'ArrowRight') {
        setCarLane((prev) => Math.min(2, prev + 1));
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [running]);

  // Game loop
  useEffect(() => {
    if (!running) return;
    let animationId: number;
    let lastTime = performance.now();
    let localScore = score;

    const draw = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      // Responsive scaling
      const width = canvas.width;
      const height = canvas.height;
      // Clear
      ctx.fillStyle = '#222';
      ctx.fillRect(0, 0, width, height);
      // Draw road
      ctx.fillStyle = '#555';
      ctx.fillRect(width * 0.1, 0, width * 0.8, height);
      // Draw lane lines
      ctx.strokeStyle = '#fff';
      ctx.setLineDash([20, 20]);
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(width * 0.35, 0);
      ctx.lineTo(width * 0.35, height);
      ctx.moveTo(width * 0.65, 0);
      ctx.lineTo(width * 0.65, height);
      ctx.stroke();
      ctx.setLineDash([]);
      // Draw car (replace with car icon)
      const carX = width * LANE_X_FRAC[carLane];
      const carY = height - height * CAR_HEIGHT_FRAC - 20;
      if (carImg.complete) {
        ctx.drawImage(carImg, carX, carY, width * CAR_WIDTH_FRAC, height * CAR_HEIGHT_FRAC);
      } else {
        ctx.fillStyle = '#0af';
        ctx.fillRect(carX, carY, width * CAR_WIDTH_FRAC, height * CAR_HEIGHT_FRAC);
      }
      // Draw obstacles (replace with truck icon)
      obstacles.forEach((obs) => {
        const obsX = width * LANE_X_FRAC[obs.lane];
        const obsY = height * obs.yFrac;
        if (truckImg.complete) {
          ctx.drawImage(truckImg, obsX, obsY, width * OBSTACLE_WIDTH_FRAC, height * OBSTACLE_HEIGHT_FRAC);
        } else {
          ctx.fillStyle = '#f33';
          ctx.fillRect(obsX, obsY, width * OBSTACLE_WIDTH_FRAC, height * OBSTACLE_HEIGHT_FRAC);
        }
      });
      // Draw score
      ctx.fillStyle = '#fff';
      ctx.font = `${Math.round(width / 16)}px Arial`;
      ctx.fillText(`Score: ${localScore}`, 20, 40);
      // Draw speed in kmph
      ctx.font = `${Math.round(width / 20)}px Arial`;
      // Map obstacleSpeed to kmph
      const kmph = Math.round(
        MIN_KMPH + ((Math.min(obstacleSpeed, MAX_OBSTACLE_SPEED) - INITIAL_OBSTACLE_SPEED) * (MAX_KMPH - MIN_KMPH)) / (MAX_OBSTACLE_SPEED - INITIAL_OBSTACLE_SPEED)
      );
      ctx.fillText(`Speed: ${kmph} kmph`, 20, 70);
    };

    const update = () => {
      // Move obstacles
      setObstacles((prev) => {
        let newObs = prev.map((obs) => ({ ...obs, yFrac: obs.yFrac + obstacleSpeed / CANVAS_HEIGHT }));
        // Respawn obstacles
        newObs = newObs.map((obs) =>
          obs.yFrac > 1
            ? { lane: Math.floor(Math.random() * 3), yFrac: -OBSTACLE_HEIGHT_FRAC }
            : obs
        );
        // Collision detection
        for (const obs of newObs) {
          const width = canvasRef.current?.width || CANVAS_WIDTH;
          const height = canvasRef.current?.height || CANVAS_HEIGHT;
          const carX = width * LANE_X_FRAC[carLane];
          const carY = height - height * CAR_HEIGHT_FRAC - 20;
          const obsX = width * LANE_X_FRAC[obs.lane];
          const obsY = height * obs.yFrac;
          if (
            obsX < carX + width * CAR_WIDTH_FRAC &&
            obsX + width * OBSTACLE_WIDTH_FRAC > carX &&
            obsY < carY + height * CAR_HEIGHT_FRAC &&
            obsY + height * OBSTACLE_HEIGHT_FRAC > carY
          ) {
            // Play crash sound
            const crashAudio = new window.Audio('/audio/crash.mp3');
            crashAudio.play();
            setGameOver(true);
            setRunning(false);
          }
        }
        return newObs;
      });
      // Increase score
      localScore += 1;
      setScore(localScore);
    };

    const loop = (now: number) => {
      if (!running) return;
      if (now - lastTime > 30) {
        update();
        draw();
        lastTime = now;
      } else {
        draw();
      }
      animationId = requestAnimationFrame(loop);
    };
    animationId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animationId);
    // eslint-disable-next-line
  }, [carLane, running, obstacles, obstacleSpeed]);

  useEffect(() => {
    if (gameOver) {
      onGameComplete(score);
    }
  }, [gameOver]);

  useEffect(() => {
    // Play race sound when game starts, pause when game over
    if (!raceAudioRef.current) {
      raceAudioRef.current = new window.Audio('/audio/race.mp3');
      raceAudioRef.current.loop = true;
    }
    if (running && !gameOver) {
      raceAudioRef.current.currentTime = 0;
      raceAudioRef.current.play();
    } else {
      raceAudioRef.current.pause();
      raceAudioRef.current.currentTime = 0;
    }
    return () => {
      if (raceAudioRef.current) {
        raceAudioRef.current.pause();
        raceAudioRef.current.currentTime = 0;
      }
    };
  }, [running, gameOver]);

  useEffect(() => {
    if (!running) return;
    // Gradually increase obstacle speed every 5 seconds
    const interval = setInterval(() => {
      setObstacleSpeed((speed) => speed + 1);
    }, 5000);
    return () => clearInterval(interval);
  }, [running]);

  const handleRestart = () => {
    setScore(0);
    setGameOver(false);
    setRunning(true);
    setCarLane(1);
    setObstacles([
      { lane: Math.floor(Math.random() * 3), yFrac: -OBSTACLE_HEIGHT_FRAC },
      { lane: Math.floor(Math.random() * 3), yFrac: -OBSTACLE_HEIGHT_FRAC * 4 },
    ]);
    setObstacleSpeed(INITIAL_OBSTACLE_SPEED);
  };

  // Play sound then call onBack
  const handleBack = () => {
    const audio = new Audio('/audio/button.mp3');
    audio.play();
    setTimeout(() => onBack(), 100);
  };

  // Touch controls for mobile
  const handleTouch = (dir: 'left' | 'right') => {
    if (!running) return;
    if (dir === 'left') {
      setCarLane((prev) => Math.max(0, prev - 1));
    } else {
      setCarLane((prev) => Math.min(2, prev + 1));
    }
  };

  return (
    <div className="w-full flex flex-col items-center mt-6">
      {/* Header with back button and XP */}
      <div className="flex justify-between items-center w-full max-w-md mb-4 px-4">
        <Button
          variant="ghost"
          onClick={handleBack}
          className="bg-white/20 text-white hover:bg-white/30 rounded-full w-12 h-12 p-0"
        >
          <ArrowLeft className="w-6 h-6" />
        </Button>
        
        <h2 className="text-2xl sm:text-3xl font-bold text-black">🏎️ Car Racing</h2>
        
        <div className="bg-teal-100 px-3 py-2 rounded-full">
          <span className="text-teal-800 font-bold text-sm sm:text-base flex items-center gap-1">
            <Trophy className="w-4 h-4" />
            {score}
          </span>
        </div>
      </div>

      <div style={{ width: '100%', maxWidth: 400, position: 'relative' }}>
        <canvas
          ref={canvasRef}
          width={CANVAS_WIDTH}
          height={CANVAS_HEIGHT}
          style={{ width: '100%', height: 'auto', border: '4px solid #333', borderRadius: 12, background: '#222', touchAction: 'none', display: 'block' }}
        />
        {/* Centered Game Over/Restart overlay */}
        {gameOver && (
          <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', zIndex: 10, background: 'rgba(0,0,0,0.5)' }}>
            <div className="text-red-600 text-lg font-bold mb-4 bg-white/90 px-6 py-4 rounded-xl shadow-lg">Game Over!</div>
            <button
              className="px-6 py-2 bg-blue-500 text-white rounded-full font-semibold hover:bg-blue-600 transition text-lg"
              onClick={handleRestart}
            >
              Restart
            </button>
          </div>
        )}
      </div>
      {/* Touch controls for mobile */}
      <div className="flex w-full max-w-xs mt-4 select-none">
        <button
          className="flex-1 py-4 bg-blue-700/80 text-white text-lg font-bold rounded-l-xl active:bg-blue-900 focus:bg-blue-900 transition"
          style={{ touchAction: 'manipulation' }}
          onTouchStart={() => handleTouch('left')}
          onClick={() => handleTouch('left')}
        >
          ◀ Left
        </button>
        <button
          className="flex-1 py-4 bg-blue-700/80 text-white text-lg font-bold rounded-r-xl active:bg-blue-900 focus:bg-blue-900 transition"
          style={{ touchAction: 'manipulation' }}
          onTouchStart={() => handleTouch('right')}
          onClick={() => handleTouch('right')}
        >
          Right ▶
        </button>
      </div>
      <div className="mt-4">
        {!gameOver ? (
          <div className="text-gray-200 text-lg">Use Left/Right arrows or touch controls to move</div>
        ) : null}
      </div>
    </div>
  );
};

export default CarRacingGame; 