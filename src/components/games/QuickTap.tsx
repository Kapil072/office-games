import { useState, useEffect, useCallback, useRef } from "react";
import { Button } from "@/components/ui/button";
import { ArrowLeft, RotateCcw, Play, Trophy, Target } from "lucide-react";

interface GameProps {
  onGameComplete: (xp: number) => void;
  onBack: () => void;
}

interface Shape {
  id: number;
  x: number;
  y: number;
  type: 'circle' | 'square' | 'triangle';
  color: string;
  isTarget: boolean;
  size: number;
}

const QuickTap = ({ onGameComplete, onBack }: GameProps) => {
  const [gameActive, setGameActive] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [shapes, setShapes] = useState<Shape[]>([]);
  const [score, setScore] = useState(0);
  const [mistakes, setMistakes] = useState(0);
  const [timeLeft, setTimeLeft] = useState(60);
  const [targetType, setTargetType] = useState<{type: 'circle' | 'square' | 'triangle', color: string}>({ type: 'circle', color: 'red' });
  const [level, setLevel] = useState(1);

  const gameAreaRef = useRef<HTMLDivElement>(null);
  const shapeSpawnRef = useRef<NodeJS.Timeout>();

  const colors = ['red', 'blue', 'green', 'yellow', 'purple', 'orange'];
  const shapeTypes: ('circle' | 'square' | 'triangle')[] = ['circle', 'square', 'triangle'];

  const getRandomTarget = useCallback(() => {
    const randomType = shapeTypes[Math.floor(Math.random() * shapeTypes.length)];
    const randomColor = colors[Math.floor(Math.random() * colors.length)];
    return { type: randomType, color: randomColor };
  }, []);

  const createShape = useCallback(() => {
    if (!gameAreaRef.current) return;

    const rect = gameAreaRef.current.getBoundingClientRect();
    const maxX = rect.width - 80;
    const maxY = rect.height - 80;

    const randomType = shapeTypes[Math.floor(Math.random() * shapeTypes.length)];
    const randomColor = colors[Math.floor(Math.random() * colors.length)];
    const isTarget = randomType === targetType.type && randomColor === targetType.color;

    // Increase target probability at higher levels
    const targetProbability = Math.min(0.3 + (level * 0.1), 0.7);
    const shouldBeTarget = Math.random() < targetProbability;

    const shape: Shape = {
      id: Date.now() + Math.random(),
      x: Math.random() * maxX,
      y: Math.random() * maxY,
      type: shouldBeTarget ? targetType.type : randomType,
      color: shouldBeTarget ? targetType.color : randomColor,
      isTarget: shouldBeTarget,
      size: 60 + Math.random() * 20
    };

    setShapes(prev => [...prev, shape]);

    // Remove shape after 2-3 seconds
    setTimeout(() => {
      setShapes(prev => prev.filter(s => s.id !== shape.id));
    }, Math.max(1500 - level * 100, 800));
  }, [targetType, level]);

  const startGame = useCallback(() => {
    setGameActive(true);
    setGameOver(false);
    setShapes([]);
    setScore(0);
    setMistakes(0);
    setTimeLeft(60);
    setLevel(1);
    setTargetType(getRandomTarget());
  }, [getRandomTarget]);

  // Timer
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (gameActive && !gameOver && timeLeft > 0) {
      timer = setTimeout(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            setGameOver(true);
            setGameActive(false);
            const finalXP = score * 2 - mistakes * 5;
            onGameComplete(Math.max(50, finalXP));
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearTimeout(timer);
  }, [gameActive, gameOver, timeLeft, score, mistakes, onGameComplete]);

  // Shape spawning
  useEffect(() => {
    if (gameActive && !gameOver) {
      const spawnInterval = Math.max(800 - level * 50, 400);
      shapeSpawnRef.current = setInterval(createShape, spawnInterval);
    }
    
    return () => {
      if (shapeSpawnRef.current) clearInterval(shapeSpawnRef.current);
    };
  }, [gameActive, gameOver, createShape, level]);

  // Level progression
  useEffect(() => {
    if (score > 0 && score % 200 === 0) {
      setLevel(prev => prev + 1);
      setTargetType(getRandomTarget());
    }
  }, [score, getRandomTarget]);

  const handleShapeClick = useCallback((shape: Shape) => {
    if (!gameActive) return;

    setShapes(prev => prev.filter(s => s.id !== shape.id));

    if (shape.isTarget) {
      setScore(prev => prev + 10 + level * 5);
    } else {
      setMistakes(prev => {
        const newMistakes = prev + 1;
        if (newMistakes >= 10) {
          setGameOver(true);
          setGameActive(false);
          const finalXP = score * 2 - newMistakes * 5;
          onGameComplete(Math.max(50, finalXP));
        }
        return newMistakes;
      });
    }
  }, [gameActive, level, score, onGameComplete]);

  const resetGame = useCallback(() => {
    setGameActive(false);
    setGameOver(false);
    setShapes([]);
    setScore(0);
    setMistakes(0);
    setTimeLeft(60);
    setLevel(1);
    if (shapeSpawnRef.current) clearInterval(shapeSpawnRef.current);
  }, []);

  const getShapeElement = (shape: Shape) => {
    const baseClasses = "absolute cursor-pointer transition-all duration-200 hover:scale-110 flex items-center justify-center text-white font-bold";
    const colorClass = `bg-${shape.color}-500`;
    
    const style = {
      left: shape.x,
      top: shape.y,
      width: shape.size,
      height: shape.size,
    };

    switch (shape.type) {
      case 'circle':
        return (
          <div
            key={shape.id}
            className={`${baseClasses} ${colorClass} rounded-full`}
            style={style}
            onClick={() => handleShapeClick(shape)}
          >
            ●
          </div>
        );
      case 'square':
        return (
          <div
            key={shape.id}
            className={`${baseClasses} ${colorClass}`}
            style={style}
            onClick={() => handleShapeClick(shape)}
          >
            ■
          </div>
        );
      case 'triangle':
        return (
          <div
            key={shape.id}
            className={`${baseClasses} ${colorClass}`}
            style={{...style, clipPath: 'polygon(50% 0%, 0% 100%, 100% 100%)'}}
            onClick={() => handleShapeClick(shape)}
          >
            ▲
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-indigo-900 to-purple-900 p-4">
      <div className="bg-white rounded-2xl shadow-2xl p-6 max-w-4xl w-full">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-gray-800">🧠 Quick Tap</h1>
          <div className="bg-indigo-100 px-3 py-1 rounded-full">
            {timeLeft}s
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-4 gap-4 mb-6 text-center">
          <div>
            <div className="text-2xl font-bold text-indigo-600">{score}</div>
            <div className="text-sm text-gray-600">Score</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-red-600">{mistakes}/10</div>
            <div className="text-sm text-gray-600">Mistakes</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-green-600">{level}</div>
            <div className="text-sm text-gray-600">Level</div>
          </div>
          <div>
            <div className={`text-lg font-bold text-${targetType.color}-600`}>
              {targetType.type === 'circle' ? '●' : targetType.type === 'square' ? '■' : '▲'}
            </div>
            <div className="text-sm text-gray-600">Target</div>
          </div>
        </div>

        {/* Target Display */}
        {gameActive && (
          <div className="text-center mb-4 p-3 bg-gray-100 rounded-xl">
            <div className="flex items-center justify-center gap-2">
              <Target className="w-5 h-5 text-gray-600" />
              <span className="font-semibold text-gray-700">
                Tap only {targetType.color} {targetType.type}s!
              </span>
            </div>
          </div>
        )}

        {/* Game Area */}
        <div 
          ref={gameAreaRef}
          className="relative w-full h-96 bg-gradient-to-br from-gray-100 to-gray-200 rounded-xl mb-6 overflow-hidden"
        >
          {gameActive && shapes.map(shape => getShapeElement(shape))}
          
          {!gameActive && (
            <div className="absolute inset-0 flex items-center justify-center text-gray-500 text-lg">
              Game area - shapes will appear here
            </div>
          )}
        </div>

        {/* Controls */}
        <div className="text-center">
          {!gameActive && !gameOver ? (
            <div>
              <p className="text-gray-600 mb-4">
                Shapes will appear randomly. Tap only the target shape and color combination. Be quick and accurate!
              </p>
              <Button onClick={startGame} className="bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-3">
                <Play className="w-4 h-4 mr-2" />
                Start Quick Tap
              </Button>
            </div>
          ) : gameOver ? (
            <div>
              <Trophy className="w-12 h-12 text-yellow-500 mx-auto mb-2" />
              <h3 className="text-xl font-bold text-gray-800 mb-2">
                {mistakes >= 10 ? 'Too Many Mistakes!' : 'Time\'s Up!'}
              </h3>
              <p className="text-gray-600 mb-4">
                Level {level} • Score: {score} • Accuracy: {Math.round((score / Math.max(score + mistakes, 1)) * 100)}%
              </p>
              <div className="flex gap-2 justify-center">
                <Button onClick={resetGame} variant="outline">
                  <RotateCcw className="w-4 h-4 mr-2" />
                  Try Again
                </Button>
                <Button onClick={onBack}>Back to Games</Button>
              </div>
            </div>
          ) : (
            <div className="text-sm text-gray-600">
              <p>Speed increases with each level. Stay focused!</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default QuickTap;