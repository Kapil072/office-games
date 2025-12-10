import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Shuffle } from "lucide-react";

interface PuzzleGameProps {
  onGameComplete: (xp: number) => void;
  onBack: () => void;
}

const LEVELS = [
  { label: 'Easy', size: 3 },
  { label: 'Medium', size: 4 },
  { label: 'Hard', size: 5 },
];

const PuzzleGame = ({ onGameComplete, onBack }: PuzzleGameProps) => {
  const [tiles, setTiles] = useState<number[]>([]);
  const [moves, setMoves] = useState(0);
  const [isWon, setIsWon] = useState(false);
  const [startTime, setStartTime] = useState<number | null>(null);
  const [level, setLevel] = useState<{ label: string; size: number } | null>(null);
  const [showLevelModal, setShowLevelModal] = useState(true);

  const gridSize = level?.size || 4;
  const totalTiles = gridSize * gridSize;

  const initializePuzzle = () => {
    const initialTiles = Array.from({ length: totalTiles - 1 }, (_, i) => i + 1).concat(0);
    setTiles(shuffleTiles(initialTiles));
    setMoves(0);
    setIsWon(false);
    setStartTime(Date.now());
  };

  const shuffleTiles = (array: number[]) => {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  };

  const findEmptyIndex = () => tiles.indexOf(0);

  const canMove = (index: number) => {
    const emptyIndex = findEmptyIndex();
    const row = Math.floor(index / gridSize);
    const col = index % gridSize;
    const emptyRow = Math.floor(emptyIndex / gridSize);
    const emptyCol = emptyIndex % gridSize;

    return (
      (Math.abs(row - emptyRow) === 1 && col === emptyCol) ||
      (Math.abs(col - emptyCol) === 1 && row === emptyRow)
    );
  };

  const moveTile = (index: number) => {
    if (!canMove(index) || isWon) return;

    const newTiles = [...tiles];
    const emptyIndex = findEmptyIndex();
    [newTiles[index], newTiles[emptyIndex]] = [newTiles[emptyIndex], newTiles[index]];
    setTiles(newTiles);
    setMoves(prev => prev + 1);

    // Check for win condition
    const isWinning = newTiles.slice(0, totalTiles - 1).every((tile, idx) => tile === idx + 1);
    if (isWinning) {
      setIsWon(true);
      const timeBonus = Math.max(100 - moves, 10);
      onGameComplete(100 + timeBonus + (gridSize - 3) * 50); // More XP for harder levels
    }
  };

  useEffect(() => {
    if (level) {
      initializePuzzle();
    }
  }, [level]);

  const handleLevelSelect = (selected: { label: string; size: number }) => {
    setLevel(selected);
    setShowLevelModal(false);
  };

  const handleReset = () => {
    setShowLevelModal(true);
    setIsWon(false);
    setLevel(null);
  };

  return (
    <div className="text-center text-white">
      {/* Level Selection Modal */}
      {showLevelModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-4 sm:p-8 shadow-xl text-gray-900 w-full max-w-xs sm:max-w-md mx-auto">
            <h2 className="text-2xl font-bold mb-4 text-center">Select Level</h2>
            <div className="flex flex-col gap-4">
              {LEVELS.map(lvl => (
                <Button
                  key={lvl.label}
                  onClick={() => handleLevelSelect(lvl)}
                  className="w-full text-base sm:text-lg py-2 sm:py-3"
                >
                  {lvl.label}
                </Button>
              ))}
            </div>
          </div>
        </div>
      )}

      <div className="flex flex-col sm:flex-row justify-between items-center mb-4 sm:mb-8 gap-4">
        <h2 className="text-2xl sm:text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-600 text-center w-full truncate whitespace-nowrap">
          Sliding Puzzle
        </h2>
        <Button
          variant="ghost"
          size="lg"
          onClick={handleReset}
          className="text-white hover:bg-white/20"
        >
          <Shuffle className="w-6 h-6 mr-2" />
          Change Level
        </Button>
      </div>

      <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 sm:p-8 w-full max-w-xs sm:max-w-md mx-auto overflow-x-auto">
        {isWon && (
          <div className="mb-6">
            <h3 className="text-2xl font-bold mb-4">Congratulations!</h3>
            <p className="text-lg mb-2">Puzzle solved in {moves} moves!</p>
            <p className="text-lg">+{100 + Math.max(100 - moves, 10) + (gridSize - 3) * 50} XP earned!</p>
          </div>
        )}

        <div className="mb-6">
          <p className="text-xl">Moves: {moves}</p>
        </div>

        <div
          className={`grid gap-1 sm:gap-2 bg-gray-800 p-2 sm:p-4 rounded-lg mb-6`}
          style={{ gridTemplateColumns: `repeat(${gridSize}, minmax(0, 1fr))` }}
        >
          {tiles.map((tile, index) => (
            <button
              key={index}
              onClick={() => moveTile(index)}
              className={
                `w-12 h-12 sm:w-16 sm:h-16 rounded-lg font-bold text-base sm:text-lg transition-all duration-200 ` +
                (tile === 0
                  ? 'bg-transparent'
                  : `bg-gradient-to-br from-blue-400 to-blue-600 text-white hover:from-blue-300 hover:to-blue-500 shadow-lg ${canMove(index) ? 'cursor-pointer hover:scale-105' : 'cursor-not-allowed opacity-75'}`)
              }
              disabled={tile === 0 || !canMove(index) || isWon}
            >
              {tile !== 0 && tile}
            </button>
          ))}
        </div>

        <p className="text-sm opacity-75">
          Arrange the numbers 1-{totalTiles - 1} in order. Click a tile next to the empty space to move it.
        </p>
      </div>
    </div>
  );
};

export default PuzzleGame;
