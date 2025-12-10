import { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { ArrowLeft, RotateCcw, Play, Trophy, Eye } from "lucide-react";

interface GameProps {
  onGameComplete: (xp: number) => void;
  onBack: () => void;
}

interface Difference {
  id: number;
  x: number;
  y: number;
  found: boolean;
}

const SpotDifference = ({ onGameComplete, onBack }: GameProps) => {
  const [gameActive, setGameActive] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [currentLevel, setCurrentLevel] = useState(1);
  const [foundDifferences, setFoundDifferences] = useState<number[]>([]);
  const [score, setScore] = useState(0);
  const [mistakes, setMistakes] = useState(0);

  // Simulated differences for demo - in real game these would be actual image differences
  const levels = [
    {
      id: 1,
      differences: [
        { id: 1, x: 25, y: 30, found: false },
        { id: 2, x: 60, y: 45, found: false },
        { id: 3, x: 40, y: 70, found: false },
        { id: 4, x: 75, y: 20, found: false },
        { id: 5, x: 15, y: 80, found: false }
      ],
      theme: '🏠 House Scene',
      color: 'from-blue-400 to-cyan-500'
    },
    {
      id: 2,
      differences: [
        { id: 1, x: 30, y: 25, found: false },
        { id: 2, x: 55, y: 40, found: false },
        { id: 3, x: 20, y: 65, found: false },
        { id: 4, x: 70, y: 55, found: false },
        { id: 5, x: 45, y: 80, found: false }
      ],
      theme: '🌳 Park Scene',
      color: 'from-green-400 to-emerald-500'
    }
  ];

  const currentLevelData = levels[currentLevel - 1];
  const totalDifferences = currentLevelData?.differences.length || 5;

  const startGame = useCallback(() => {
    setGameActive(true);
    setGameOver(false);
    setCurrentLevel(1);
    setFoundDifferences([]);
    setScore(0);
    setMistakes(0);
  }, []);

  const handleImageClick = useCallback((x: number, y: number, isRightImage: boolean) => {
    if (!gameActive || !currentLevelData) return;

    // Check if click is near a difference (within 5% tolerance)
    const clickedDifference = currentLevelData.differences.find(diff => {
      const distance = Math.sqrt(Math.pow(diff.x - x, 2) + Math.pow(diff.y - y, 2));
      return distance < 8 && !foundDifferences.includes(diff.id);
    });

    if (clickedDifference) {
      // Found a difference
      const newFound = [...foundDifferences, clickedDifference.id];
      setFoundDifferences(newFound);
      setScore(prev => prev + 100);

      if (newFound.length === totalDifferences) {
        // Level complete
        setTimeout(() => {
          if (currentLevel < levels.length) {
            setCurrentLevel(prev => prev + 1);
            setFoundDifferences([]);
          } else {
            // Game complete
            setGameOver(true);
            setGameActive(false);
            const finalXP = score + 200 - mistakes * 10;
            onGameComplete(Math.max(100, finalXP));
          }
        }, 1000);
      }
    } else {
      // Mistake
      setMistakes(prev => {
        const newMistakes = prev + 1;
        if (newMistakes >= 5) {
          // Too many mistakes - game over
          setGameOver(true);
          setGameActive(false);
          const finalXP = score - mistakes * 10;
          onGameComplete(Math.max(50, finalXP));
        }
        return newMistakes;
      });
    }
  }, [gameActive, currentLevelData, foundDifferences, totalDifferences, currentLevel, score, mistakes, onGameComplete]);

  const resetGame = useCallback(() => {
    setGameActive(false);
    setGameOver(false);
    setCurrentLevel(1);
    setFoundDifferences([]);
    setScore(0);
    setMistakes(0);
  }, []);

  const getClickPosition = (event: React.MouseEvent<HTMLDivElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    const x = ((event.clientX - rect.left) / rect.width) * 100;
    const y = ((event.clientY - rect.top) / rect.height) * 100;
    const isRightImage = x > 50;
    return { x: isRightImage ? x - 50 : x, y, isRightImage };
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-orange-900 to-red-900 p-4">
      <div className="bg-white rounded-2xl shadow-2xl p-6 max-w-4xl w-full">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-gray-800">🧠 Spot the Difference</h1>
          <div className="bg-orange-100 px-3 py-1 rounded-full">
            Level {currentLevel}
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-6 text-center">
          <div>
            <div className="text-2xl font-bold text-orange-600">{score}</div>
            <div className="text-sm text-gray-600">Score</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-green-600">{foundDifferences.length}/{totalDifferences}</div>
            <div className="text-sm text-gray-600">Found</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-red-600">{mistakes}/5</div>
            <div className="text-sm text-gray-600">Mistakes</div>
          </div>
        </div>

        {/* Game Area */}
        {gameActive && currentLevelData ? (
          <div className="mb-6">
            <div className="text-center mb-4">
              <h3 className="text-lg font-semibold text-gray-700 mb-2">
                {currentLevelData.theme}
              </h3>
              <p className="text-sm text-gray-600">Find {totalDifferences} differences between the images</p>
            </div>
            
            <div 
              className="relative grid grid-cols-2 gap-4 cursor-crosshair"
              onClick={(e) => {
                const pos = getClickPosition(e);
                handleImageClick(pos.x * 2, pos.y, pos.isRightImage);
              }}
            >
              {/* Left Image */}
              <div className={`relative aspect-square rounded-xl bg-gradient-to-br ${currentLevelData.color} flex items-center justify-center text-6xl border-4 border-gray-200`}>
                <div className="text-white font-bold">Original</div>
                {/* Difference markers for left image */}
                {foundDifferences.map(diffId => {
                  const diff = currentLevelData.differences.find(d => d.id === diffId);
                  return diff ? (
                    <div
                      key={`left-${diffId}`}
                      className="absolute w-8 h-8 border-4 border-red-500 rounded-full bg-red-200 animate-pulse"
                      style={{ left: `${diff.x}%`, top: `${diff.y}%`, transform: 'translate(-50%, -50%)' }}
                    />
                  ) : null;
                })}
              </div>

              {/* Right Image */}
              <div className={`relative aspect-square rounded-xl bg-gradient-to-br ${currentLevelData.color} flex items-center justify-center text-6xl border-4 border-gray-200`}>
                <div className="text-white font-bold">Modified</div>
                {/* Difference markers for right image */}
                {foundDifferences.map(diffId => {
                  const diff = currentLevelData.differences.find(d => d.id === diffId);
                  return diff ? (
                    <div
                      key={`right-${diffId}`}
                      className="absolute w-8 h-8 border-4 border-red-500 rounded-full bg-red-200 animate-pulse"
                      style={{ left: `${diff.x}%`, top: `${diff.y}%`, transform: 'translate(-50%, -50%)' }}
                    />
                  ) : null;
                })}
              </div>
            </div>
          </div>
        ) : null}

        {/* Controls */}
        <div className="text-center">
          {!gameActive && !gameOver ? (
            <div>
              <p className="text-gray-600 mb-4">
                Compare two images and click on the differences you spot. Be careful - too many wrong clicks will end the game!
              </p>
              <Button onClick={startGame} className="bg-orange-600 hover:bg-orange-700 text-white px-8 py-3">
                <Play className="w-4 h-4 mr-2" />
                Start Spotting
              </Button>
            </div>
          ) : gameOver ? (
            <div>
              <Trophy className="w-12 h-12 text-yellow-500 mx-auto mb-2" />
              <h3 className="text-xl font-bold text-gray-800 mb-2">
                {currentLevel > levels.length ? 'All Levels Complete!' : 'Game Over!'}
              </h3>
              <p className="text-gray-600 mb-4">
                Level {currentLevel} • Found {foundDifferences.length} differences • Score: {score}
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
              <div className="flex items-center justify-center gap-2">
                <Eye className="w-4 h-4" />
                <span>Click on differences in either image</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SpotDifference;