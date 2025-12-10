import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { ArrowLeft, RotateCcw } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";

interface GameProps {
  onGameComplete: (xp: number) => void;
  onBack: () => void;
}

interface Dot {
  id: number;
  x: number;
  y: number;
  color: string;
  connected: boolean;
}

interface Path {
  color: string;
  points: { x: number; y: number }[];
}

const LEVELS = [
  { label: 'Easy', gridSize: 6, numPairs: 2 },
  { label: 'Medium', gridSize: 8, numPairs: 3 },
  { label: 'Hard', gridSize: 10, numPairs: 4 },
];

const DotConnection = ({ onGameComplete, onBack }: GameProps) => {
  const [level, setLevel] = useState(1);
  const [dots, setDots] = useState<Dot[]>([]);
  const [paths, setPaths] = useState<Path[]>([]);
  const [currentPath, setCurrentPath] = useState<{ x: number; y: number }[]>([]);
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentColor, setCurrentColor] = useState<string>('');
  const [gameWon, setGameWon] = useState(false);
  const [score, setScore] = useState(0);
  const [gridSize, setGridSize] = useState(8);
  const [numPairs, setNumPairs] = useState(3);
  const [showLevelModal, setShowLevelModal] = useState(true);
  const [gameOver, setGameOver] = useState(false);
  const gameRef = useRef<HTMLDivElement>(null);
  const isMobile = useIsMobile();

  const colors = [
    { name: 'yellow', bg: 'bg-yellow-400', rgb: 'rgb(251, 191, 36)' },
    { name: 'red', bg: 'bg-red-500', rgb: 'rgb(239, 68, 68)' },
    { name: 'blue', bg: 'bg-blue-500', rgb: 'rgb(59, 130, 246)' },
    { name: 'green', bg: 'bg-green-500', rgb: 'rgb(34, 197, 94)' },
    { name: 'orange', bg: 'bg-orange-500', rgb: 'rgb(249, 115, 22)' }
  ];

  const generateLevel = (levelNum: number, grid = gridSize, pairs = numPairs) => {
    const newDots: Dot[] = [];
    for (let i = 0; i < pairs && i < colors.length; i++) {
      const color = colors[i];
      let x1, y1, x2, y2;
      do {
        x1 = Math.floor(Math.random() * grid);
        y1 = Math.floor(Math.random() * grid);
      } while (newDots.some(dot => dot.x === x1 && dot.y === y1));
      newDots.push({
        id: i * 2,
        x: x1,
        y: y1,
        color: color.name,
        connected: false
      });
      do {
        x2 = Math.floor(Math.random() * grid);
        y2 = Math.floor(Math.random() * grid);
      } while (newDots.some(dot => dot.x === x2 && dot.y === y2));
      newDots.push({
        id: i * 2 + 1,
        x: x2,
        y: y2,
        color: color.name,
        connected: false
      });
    }
    setDots(newDots);
    setPaths([]);
    setCurrentPath([]);
    setCurrentColor('');
    setIsDrawing(false);
    setGameWon(false);
    setGameOver(false);
  };

  const getGridPosition = (clientX: number, clientY: number) => {
    if (!gameRef.current) return null;
    
    const rect = gameRef.current.getBoundingClientRect();
    const relativeX = clientX - rect.left;
    const relativeY = clientY - rect.top;
    
    const cellWidth = rect.width / gridSize;
    const cellHeight = rect.height / gridSize;
    
    const gridX = Math.floor(relativeX / cellWidth);
    const gridY = Math.floor(relativeY / cellHeight);
    
    if (gridX >= 0 && gridX < gridSize && gridY >= 0 && gridY < gridSize) {
      return { x: gridX, y: gridY };
    }
    return null;
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    const pos = getGridPosition(e.clientX, e.clientY);
    if (!pos) return;
    
    const dot = dots.find(d => d.x === pos.x && d.y === pos.y && !d.connected);
    if (dot) {
      setIsDrawing(true);
      setCurrentColor(dot.color);
      setCurrentPath([pos]);
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDrawing || !currentColor || gameOver) return;
    
    const pos = getGridPosition(e.clientX, e.clientY);
    if (!pos) return;
    
    const lastPos = currentPath[currentPath.length - 1];
    if (lastPos && ((pos.x === lastPos.x && Math.abs(pos.y - lastPos.y) === 1) || (pos.y === lastPos.y && Math.abs(pos.x - lastPos.x) === 1))) {
      // Only allow straight moves (no diagonals)
      const alreadyInPath = currentPath.some(p => p.x === pos.x && p.y === pos.y);
      if (!alreadyInPath) {
        // Check if there's already a path at this position
        const hasExistingPath = paths.some(path => 
          path.points.some(p => p.x === pos.x && p.y === pos.y)
        );
        if (hasExistingPath) {
          setGameOver(true);
          setIsDrawing(false);
          setCurrentPath([]);
          setCurrentColor('');
          return;
        }
        setCurrentPath(prev => [...prev, pos]);
      }
    }
  };

  const handleMouseUp = (e: React.MouseEvent) => {
    if (!isDrawing || !currentColor || gameOver) return;
    
    const pos = getGridPosition(e.clientX, e.clientY);
    if (!pos) {
      setIsDrawing(false);
      setCurrentPath([]);
      setCurrentColor('');
      return;
    }
    
    const endDot = dots.find(d => d.x === pos.x && d.y === pos.y && !d.connected);
    const startDot = dots.find(d => d.x === currentPath[0].x && d.y === currentPath[0].y && d.color === currentColor);
    // If user tries to connect to a dot of a different color, game over
    if (endDot && endDot.color !== currentColor) {
      setGameOver(true);
      setIsDrawing(false);
      setCurrentPath([]);
      setCurrentColor('');
      return;
    }
    if (endDot && startDot && endDot.id !== startDot.id && currentPath.length > 1) {
      // Valid connection
      setPaths(prev => [...prev, { color: currentColor, points: [...currentPath, pos] }]);
      
      // Mark dots as connected
      setDots(prev => prev.map(dot => 
        (dot.id === startDot.id || dot.id === endDot.id) 
          ? { ...dot, connected: true }
          : dot
      ));
      
      // Check if all dots are connected
      const updatedDots = dots.map(dot => 
        (dot.id === startDot.id || dot.id === endDot.id) 
          ? { ...dot, connected: true }
          : dot
      );
      
      if (updatedDots.every(dot => dot.connected)) {
        setGameWon(true);
        const points = level * 100;
        setScore(prev => prev + points);
        onGameComplete(points);
      }
    }
    
    setIsDrawing(false);
    setCurrentPath([]);
    setCurrentColor('');
  };

  // Touch event handlers for mobile
  const handleTouchStart = (e: React.TouchEvent) => {
    const touch = e.touches[0];
    if (!touch) return;
    const pos = getGridPosition(touch.clientX, touch.clientY);
    if (!pos) return;
    const dot = dots.find(d => d.x === pos.x && d.y === pos.y && !d.connected);
    if (dot) {
      setIsDrawing(true);
      setCurrentColor(dot.color);
      setCurrentPath([pos]);
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDrawing || !currentColor || gameOver) return;
    const touch = e.touches[0];
    if (!touch) return;
    const pos = getGridPosition(touch.clientX, touch.clientY);
    if (!pos) return;
    const lastPos = currentPath[currentPath.length - 1];
    if (lastPos && ((pos.x === lastPos.x && Math.abs(pos.y - lastPos.y) === 1) || (pos.y === lastPos.y && Math.abs(pos.x - lastPos.x) === 1))) {
      const alreadyInPath = currentPath.some(p => p.x === pos.x && p.y === pos.y);
      if (!alreadyInPath) {
        const hasExistingPath = paths.some(path => 
          path.points.some(p => p.x === pos.x && p.y === pos.y)
        );
        if (hasExistingPath) {
          setGameOver(true);
          setIsDrawing(false);
          setCurrentPath([]);
          setCurrentColor('');
          return;
        }
        setCurrentPath(prev => [...prev, pos]);
      }
    }
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (!isDrawing || !currentColor || gameOver) return;
    const touch = e.changedTouches[0];
    if (!touch) {
      setIsDrawing(false);
      setCurrentPath([]);
      setCurrentColor('');
      return;
    }
    const pos = getGridPosition(touch.clientX, touch.clientY);
    if (!pos) {
      setIsDrawing(false);
      setCurrentPath([]);
      setCurrentColor('');
      return;
    }
    const endDot = dots.find(d => d.x === pos.x && d.y === pos.y && !d.connected);
    const startDot = dots.find(d => d.x === currentPath[0].x && d.y === currentPath[0].y && d.color === currentColor);
    if (endDot && endDot.color !== currentColor) {
      setGameOver(true);
      setIsDrawing(false);
      setCurrentPath([]);
      setCurrentColor('');
      return;
    }
    if (endDot && startDot && endDot.id !== startDot.id && currentPath.length > 1) {
      setPaths(prev => [...prev, { color: currentColor, points: [...currentPath, pos] }]);
      setDots(prev => prev.map(dot => 
        (dot.id === startDot.id || dot.id === endDot.id) 
          ? { ...dot, connected: true }
          : dot
      ));
      const updatedDots = dots.map(dot => 
        (dot.id === startDot.id || dot.id === endDot.id) 
          ? { ...dot, connected: true }
          : dot
      );
      if (updatedDots.every(dot => dot.connected)) {
        setGameWon(true);
        const points = level * 100;
        setScore(prev => prev + points);
        onGameComplete(points);
      }
    }
    setIsDrawing(false);
    setCurrentPath([]);
    setCurrentColor('');
  };

  const nextLevel = () => {
    setLevel(prev => prev + 1);
    generateLevel(level + 1, gridSize, numPairs);
  };

  const handleLevelSelect = (selected: typeof LEVELS[0]) => {
    setGridSize(selected.gridSize);
    setNumPairs(selected.numPairs);
    setShowLevelModal(false);
    setTimeout(() => generateLevel(1, selected.gridSize, selected.numPairs), 0);
  };

  const handleReset = () => {
    setShowLevelModal(true);
    setGameWon(false);
    setLevel(1);
    setGameOver(false);
  };

  // Play sound then call onBack
  const handleBack = () => {
    const audio = new Audio('/audio/button.mp3');
    audio.play();
    setTimeout(() => onBack(), 100);
  };

  useEffect(() => {
    if (!showLevelModal) {
      generateLevel(level, gridSize, numPairs);
    }
    // eslint-disable-next-line
  }, [level]);

  return (
    <div className={`fixed inset-0 z-50 min-h-screen bg-gradient-to-br from-slate-700 to-gray-800 ${isMobile ? 'p-1' : 'p-4'} flex flex-col`}> 
      {/* Level Selection Modal */}
      {showLevelModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
          <div className={`bg-white rounded-2xl ${isMobile ? 'p-4 w-full max-w-xs' : 'p-8 w-80'} shadow-xl text-gray-900`}>
            <h2 className="text-2xl font-bold mb-4 text-center">Select Level</h2>
            <div className="flex flex-col gap-4">
              {LEVELS.map(lvl => (
                <Button
                  key={lvl.label}
                  onClick={() => handleLevelSelect(lvl)}
                  className={`w-full ${isMobile ? 'text-base py-2' : 'text-lg'}`}
                >
                  {lvl.label}
                </Button>
              ))}
            </div>
          </div>
        </div>
      )}
      {/* Header */}
      <div className={`flex justify-between items-center ${isMobile ? 'mb-2' : 'mb-6'}`}> 
        <Button
          variant="ghost"
          onClick={handleBack}
          className={`bg-white/20 text-white hover:bg-white/30 rounded-full ${isMobile ? 'w-10 h-10' : 'w-12 h-12'} p-0`}
        >
          <ArrowLeft className="w-6 h-6" />
        </Button>
        
        <div className="text-center text-white">
          <div className={`${isMobile ? 'text-lg' : 'text-2xl'} font-bold`}>Level {level}</div>
        </div>
        
        <Button
          variant="ghost"
          onClick={handleReset}
          className={`bg-white/20 text-white hover:bg-white/30 rounded-full ${isMobile ? 'w-10 h-10' : 'w-12 h-12'} p-0`}
        >
          <RotateCcw className="w-6 h-6" />
        </Button>
      </div>

      <div className={`${isMobile ? 'w-full max-w-full' : 'max-w-md mx-auto'} flex-1 flex flex-col`}>
        {/* Score */}
        <div className="text-center mb-6">
          <div className={`bg-white/10 rounded-xl ${isMobile ? 'p-2' : 'p-4'}`}>
            <div className={`text-white ${isMobile ? 'text-lg' : 'text-2xl'} font-bold`}>{score}</div>
            <div className="text-white/60 text-sm">Score</div>
          </div>
        </div>
        {gameOver && (
          <div className={`bg-red-600 text-white rounded-xl ${isMobile ? 'p-2 mb-2 text-base' : 'p-4 mb-6 text-lg'} text-center font-bold shadow-lg`}>
            Game Over! You crossed another line or joined a different color dot.<br />
            <span className="text-sm font-normal">Tap the reset button to try again.</span>
          </div>
        )}

        {/* Game Board */}
        <div className={`bg-slate-800 rounded-xl ${isMobile ? 'p-1' : 'p-4'} flex-1 flex flex-col`}>
          <div 
            ref={gameRef}
            className={`relative bg-slate-900 rounded-lg select-none ${isMobile ? 'w-full h-full min-h-[320px] max-h-[90vw]' : 'w-full aspect-square max-w-lg h-auto'} `}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
            style={{ cursor: isDrawing ? 'crosshair' : 'default' }}
          >
            {/* Grid lines */}
            <svg className="absolute inset-0 w-full h-full">
              {/* Vertical lines */}
              {Array.from({ length: gridSize + 1 }, (_, i) => (
                <line
                  key={`v-${i}`}
                  x1={`${(i / gridSize) * 100}%`}
                  y1="0%"
                  x2={`${(i / gridSize) * 100}%`}
                  y2="100%"
                  stroke="rgb(71, 85, 105)"
                  strokeWidth="1"
                />
              ))}
              {/* Horizontal lines */}
              {Array.from({ length: gridSize + 1 }, (_, i) => (
                <line
                  key={`h-${i}`}
                  x1="0%"
                  y1={`${(i / gridSize) * 100}%`}
                  x2="100%"
                  y2={`${(i / gridSize) * 100}%`}
                  stroke="rgb(71, 85, 105)"
                  strokeWidth="1"
                />
              ))}
              
              {/* Draw completed paths */}
              {paths.map((path, index) => {
                const colorObj = colors.find(c => c.name === path.color);
                return (
                  <g key={index}>
                    {path.points.map((point, i) => {
                      if (i === path.points.length - 1) return null;
                      const nextPoint = path.points[i + 1];
                      // Only draw if the segment is straight (horizontal or vertical)
                      if (point.x === nextPoint.x || point.y === nextPoint.y) {
                        return (
                          <line
                            key={i}
                            x1={`${((point.x + 0.5) / gridSize) * 100}%`}
                            y1={`${((point.y + 0.5) / gridSize) * 100}%`}
                            x2={`${((nextPoint.x + 0.5) / gridSize) * 100}%`}
                            y2={`${((nextPoint.y + 0.5) / gridSize) * 100}%`}
                            stroke={colorObj?.rgb || '#666'}
                            strokeWidth="8"
                            strokeLinecap="round"
                          />
                        );
                      }
                      return null;
                    })}
                  </g>
                );
              })}
              
              {/* Draw current path */}
              {isDrawing && currentPath.length > 1 && (
                <g>
                  {currentPath.map((point, i) => {
                    if (i === currentPath.length - 1) return null;
                    const nextPoint = currentPath[i + 1];
                    const colorObj = colors.find(c => c.name === currentColor);
                    // Only draw if the segment is straight (horizontal or vertical)
                    if (point.x === nextPoint.x || point.y === nextPoint.y) {
                      return (
                        <line
                          key={i}
                          x1={`${((point.x + 0.5) / gridSize) * 100}%`}
                          y1={`${((point.y + 0.5) / gridSize) * 100}%`}
                          x2={`${((nextPoint.x + 0.5) / gridSize) * 100}%`}
                          y2={`${((nextPoint.y + 0.5) / gridSize) * 100}%`}
                          stroke={colorObj?.rgb || '#666'}
                          strokeWidth="8"
                          strokeLinecap="round"
                          opacity="0.7"
                        />
                      );
                    }
                    return null;
                  })}
                </g>
              )}
            </svg>
            
            {/* Dots */}
            {dots.map(dot => {
              const colorObj = colors.find(c => c.name === dot.color);
              return (
                <div
                  key={dot.id}
                  className={`absolute w-6 h-6 sm:w-8 sm:h-8 rounded-full border-4 border-slate-800 ${
                    colorObj?.bg || 'bg-gray-500'
                  } ${dot.connected ? 'opacity-80' : 'opacity-100'} 
                  transition-all duration-200 pointer-events-none`}
                  style={{
                    left: `${((dot.x + 0.5) / gridSize) * 100}%`,
                    top: `${((dot.y + 0.5) / gridSize) * 100}%`,
                    transform: 'translate(-50%, -50%)'
                  }}
                />
              );
            })}
          </div>

          {/* Game Status */}
          <div className="mt-4 text-center">
            {gameWon ? (
              <div className="space-y-4">
                <div className="text-green-400 font-bold text-xl">Level Complete! 🎉</div>
                <div className="flex gap-2 justify-center">
                  <Button onClick={nextLevel} className="bg-green-600 hover:bg-green-700">
                    Next Level
                  </Button>
                  <Button onClick={handleBack} variant="outline">
                    Menu
                  </Button>
                </div>
              </div>
            ) : (
              <div className="text-white/80 text-sm">
                Drag from dot to dot of same color to connect them
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DotConnection;