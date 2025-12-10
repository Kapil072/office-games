import { useState, useEffect, useCallback, useRef } from "react";
import { Button } from "@/components/ui/button";
import { ArrowLeft, RotateCcw, Play, Trophy, Timer, CheckCircle } from "lucide-react";

interface GameProps {
  onGameComplete: (xp: number) => void;
  onBack: () => void;
}

interface OfficePerson {
  id: number;
  name: string;
  work: string;
  isSelected: boolean;
  isTarget: boolean;
}

const PEOPLE = [
  { name: 'Raju', work: 'Printing' },
  { name: 'Sunil', work: 'Emails' },
  { name: 'Pinkey', work: 'Chai' },
  { name: 'Lalu', work: 'Meetings' },
  { name: 'Pandu', work: 'Reports' },
  { name: 'Boss', work: 'Supervision' },
  { name: 'Kamo', work: 'Snacks' },
  { name: 'Banti', work: 'Coffee' },
  { name: 'Suresh', work: 'Printing' },
  { name: 'Mahesh', work: 'Emails' },
  { name: 'Anil', work: 'Chai' },
  { name: 'Sunita', work: 'Meetings' },
  { name: 'Rina', work: 'Reports' },
  { name: 'Rakesh', work: 'Supervision' },
  { name: 'Priya', work: 'Snacks' },
  { name: 'Amit', work: 'Coffee' },
  { name: 'Deepa', work: 'Printing' },
  { name: 'Vikas', work: 'Emails' },
  { name: 'Meena', work: 'Chai' },
  { name: 'Nitin', work: 'Meetings' },
  { name: 'Geeta', work: 'Reports' },
  { name: 'Rohit', work: 'Supervision' },
  { name: 'Sneha', work: 'Snacks' },
  { name: 'Ajay', work: 'Coffee' },
  { name: 'Neha', work: 'Printing' },
];

const getRandomInt = (max: number) => Math.floor(Math.random() * max);

const MeetingBingoMadness = ({ onGameComplete, onBack }: GameProps) => {
  const [gameActive, setGameActive] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [win, setWin] = useState(false);
  const [timeLeft, setTimeLeft] = useState(15);
  const [guesses, setGuesses] = useState(0);
  const [officeBoard, setOfficeBoard] = useState<OfficePerson[]>([]);
  const [targetPerson, setTargetPerson] = useState<OfficePerson | null>(null);
  const [targetWork, setTargetWork] = useState<string>("");
  const [winCount, setWinCount] = useState(0);
  const [lossCount, setLossCount] = useState(0);
  const timerRef = useRef<NodeJS.Timeout>();

  // Generate board and pick target
  const generateOfficeBoard = useCallback(() => {
    const shuffled = [...PEOPLE].sort(() => Math.random() - 0.5).slice(0, 20); // Only 20 people
    const board: OfficePerson[] = shuffled.map((p, i) => ({
      id: i,
      name: p.name,
      work: p.work,
      isSelected: false,
      isTarget: false,
    }));
    // Pick a random person as the target
    const targetIdx = getRandomInt(20);
    board[targetIdx].isTarget = true;
    setTargetPerson(board[targetIdx]);
    setTargetWork(board[targetIdx].work);
    setOfficeBoard(board);
  }, []);

  const startGame = useCallback(() => {
    setGameActive(true);
    setGameOver(false);
    setWin(false);
    setGuesses(0);
    setTimeLeft(15);
    generateOfficeBoard();
  }, [generateOfficeBoard]);

  const resetGame = useCallback(() => {
    setGameActive(false);
    setGameOver(false);
    setWin(false);
    setGuesses(0);
    setTimeLeft(15);
    setOfficeBoard([]);
    setTargetPerson(null);
    setTargetWork("");
    if (timerRef.current) clearInterval(timerRef.current);
  }, []);

  // Timer logic
  useEffect(() => {
    if (gameActive && !gameOver) {
      timerRef.current = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            // On timeout, check if user selected the target
            setGameOver(true);
            setGameActive(false);
            const selectedTarget = officeBoard.find(p => p.isTarget && p.isSelected);
            setWin(!!selectedTarget);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [gameActive, gameOver, officeBoard]);

  // Game over auto-restart effect
  useEffect(() => {
    if (gameOver) {
      if (win) {
        const audio = new Audio('/audio/meeting bingo.mp3');
        audio.play();
      }
      if (!win) {
        const audio = new Audio('/audio/meeting bingo 2.mp3');
        audio.play();
      }
      if (win) setWinCount((c) => c + 1);
      else setLossCount((c) => c + 1);
      const popupTimeout = setTimeout(() => {
        setGameOver(false);
        setWin(false);
        setGuesses(0);
        setTimeLeft(15);
        generateOfficeBoard();
        setGameActive(true);
      }, 3000); // Show popup for 3 seconds, then restart
      return () => clearTimeout(popupTimeout);
    }
  }, [gameOver, win, generateOfficeBoard]);

  // Handle box click
  const handlePersonClick = (id: number) => {
    if (!gameActive || gameOver) return;
    if (guesses >= 7) return;
    setOfficeBoard(prev => prev.map(p => p.id === id ? { ...p, isSelected: true } : p));
    setGuesses(g => {
      const newGuesses = g + 1;
      if (newGuesses === 7) {
        setGameOver(true);
        setGameActive(false);
        setTimeLeft(0);
        // Check if the target was selected
        const selectedTarget = officeBoard.find(p => p.isTarget && (p.id === id || p.isSelected));
        setWin(!!selectedTarget);
      }
      return newGuesses;
    });
  };

  // Game UI
  return (
    <div className="fixed inset-0 z-50 min-h-screen max-h-screen overflow-hidden bg-gradient-to-br from-blue-800 to-slate-800 p-0 flex flex-col">
      {/* Boss Assignment in top left */}
      <div className="flex flex-col items-center justify-center w-full mb-4 mt-6">
        <div className="bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg px-2 py-2 sm:px-3 sm:py-3 text-center w-full max-w-xl mb-1 flex items-center justify-between gap-2 relative">
          {/* Back button inside pink bar for mobile, fixed for md+ */}
          <Button
            variant="ghost"
            onClick={() => {
              const audio = new Audio('/audio/button.mp3');
              audio.play();
              setTimeout(() => onBack(), 100);
            }}
            className="bg-white/20 text-white hover:bg-white/30 rounded-full w-7 h-7 sm:w-10 sm:h-10 p-0 flex-shrink-0 md:fixed md:top-4 md:left-4 md:z-50 md:w-12 md:h-12 md:bg-white/30 md:shadow-lg"
          >
            <ArrowLeft className="w-4 h-4 sm:w-6 sm:h-6 md:w-7 md:h-7" />
          </Button>
          <div className="flex-1 flex flex-col items-center justify-center">
            <h2 className="text-base sm:text-xl font-bold text-white mb-0 text-center">Boss's Assignment</h2>
            <p className="text-xs sm:text-base text-white font-bold leading-tight">The boss is going to assign you work.</p>
          </div>
          {/* XP inside pink bar for mobile, fixed for md+ */}
          <div className="bg-gradient-to-r from-sky-400 to-blue-500 px-2 py-0.5 sm:px-3 sm:py-1 rounded-full shadow-lg flex-shrink-0 md:fixed md:top-4 md:right-4 md:z-50 md:w-auto">
            <span className="text-white font-bold text-xs sm:text-base md:text-lg">XP: {winCount * 10}</span>
          </div>
        </div>
        <p className="text-gray-300 text-xs sm:text-sm text-center">
          Select up to 7 people. Guess who the boss picked!
        </p>
      </div>
      <div className="flex-1 flex flex-col items-center justify-center w-full h-full overflow-hidden">
        {/* Overlay Start Button if not active and not game over */}
        {(!gameActive && !gameOver) && (
          <div className="absolute inset-0 flex flex-col items-center justify-center z-50 bg-black/60">
            <h1 className="text-4xl font-bold text-white mb-6"> Assignment Bingo</h1>
            <Button 
              onClick={startGame}
              className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-bold py-3 text-lg px-8"
            >
              <Play className="mr-2 h-5 w-5" />
              Start Game
            </Button>
          </div>
        )}
        {/* Header */}
        <div className="relative w-full max-w-xl mx-auto mb-2 px-2 flex flex-col items-center justify-center">
          <div className="flex-1 flex flex-col items-center">
            <div className="flex items-center justify-center gap-2 sm:gap-3 mb-1">
              <h1 className="text-xl sm:text-3xl font-bold text-white"> Assignment Bingo</h1>
              <span className="flex items-center gap-1">
                <span className="inline-block w-4 h-4 rounded-full bg-green-500 border-2 border-white"></span>
                <span className="text-white text-xs sm:text-base font-bold">{winCount}</span>
              </span>
              <span className="flex items-center gap-1">
                <span className="inline-block w-4 h-4 rounded-full bg-red-500 border-2 border-white"></span>
                <span className="text-white text-xs sm:text-base font-bold">{lossCount}</span>
              </span>
            </div>
            <div className="flex items-center justify-center space-x-2 sm:space-x-4 text-white">
              <div className="flex items-center space-x-1">
                <Trophy className="h-4 w-4 sm:h-6 sm:w-6 text-yellow-400" />
                <span className="font-bold text-xs sm:text-lg">{win ? 'Bingo!' : guesses + '/7'}</span>
              </div>
              <div className="flex items-center space-x-1">
                <Timer className="h-4 w-4 sm:h-6 sm:w-6 text-red-400" />
                <span className="font-bold text-xs sm:text-lg">{timeLeft}s</span>
              </div>
            </div>
          </div>
        </div>
        {/* Centered Office Board */}
        <div className="flex flex-col justify-center items-center w-full h-full px-3 py-2 sm:px-0 sm:py-0 overflow-hidden">
          <div className="grid grid-cols-4 sm:grid-cols-5 gap-3 sm:gap-2 w-full h-full max-w-xs sm:max-w-3xl mx-auto items-center justify-center">
                {officeBoard.map((person, idx) => (
                  <button
                    key={person.id}
                    onClick={() => handlePersonClick(person.id)}
                    disabled={person.isSelected || gameOver}
                    className={`
                      aspect-square rounded-lg p-2 text-base font-semibold transition-all duration-200
                      w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24 lg:w-28 lg:h-28
                      ${gameOver && person.isTarget
                        ? 'bg-green-500 text-white shadow-lg ring-4 ring-green-300 animate-pulse'
                        : person.isSelected
                          ? person.isTarget && win
                            ? 'bg-gradient-to-r from-yellow-400 to-orange-500 text-white shadow-lg scale-105'
                            : 'bg-red-500 text-white opacity-70'
                          : 'bg-white/20 text-white hover:bg-white/30'}
                    `}
                  >
                    <div className="font-bold text-xs sm:text-base leading-tight truncate overflow-hidden text-center">{person.name}</div>
                    <div className="text-xs sm:text-sm leading-tight break-words overflow-hidden text-center">{person.work}</div>
                  </button>
                ))}
              </div>
            </div>
        {/* Game Over Modal */}
        {/* Removed the game over popup as requested. The game will now auto-restart without any modal. */}
      </div>
    </div>
  );
};

export default MeetingBingoMadness; 