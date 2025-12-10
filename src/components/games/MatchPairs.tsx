import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { ArrowLeft, RotateCcw, Play, Trophy, Timer } from "lucide-react";

interface GameProps {
  onGameComplete: (xp: number) => void;
  onBack: () => void;
}

interface Card {
  id: number;
  emoji: string;
  isFlipped: boolean;
  isMatched: boolean;
}

const MatchPairs = ({ onGameComplete, onBack }: GameProps) => {
  const [gameActive, setGameActive] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [cards, setCards] = useState<Card[]>([]);
  const [flippedCards, setFlippedCards] = useState<number[]>([]);
  const [moves, setMoves] = useState(0);
  const [matches, setMatches] = useState(0);
  const [timeLeft, setTimeLeft] = useState(120);
  const [score, setScore] = useState(0);

  const emojis = ['🐱', '🐶', '🐸', '🐯', '🦁', '🐼', '🐨', '🐵'];

  const initializeGame = useCallback(() => {
    const gameEmojis = emojis.slice(0, 8);
    const cardPairs = [...gameEmojis, ...gameEmojis];
    // Shuffle cards
    const shuffled = cardPairs
      .map((emoji, index) => ({
        id: index,
        emoji,
        isFlipped: false,
        isMatched: false
      }))
      .sort(() => Math.random() - 0.5);
    setCards(shuffled);
    setFlippedCards([]);
    setMoves(0);
    setMatches(0);
    setTimeLeft(120);
    setScore(0);
  }, []);

  const startGame = useCallback(() => {
    setGameActive(true);
    setGameOver(false);
    initializeGame();
  }, [initializeGame]);

  // Timer
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (gameActive && !gameOver && timeLeft > 0) {
      timer = setTimeout(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            setGameOver(true);
            setGameActive(false);
            const finalXP = matches * 20 + (120 - timeLeft) * 2;
            onGameComplete(finalXP);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearTimeout(timer);
  }, [gameActive, gameOver, timeLeft, matches, onGameComplete]);

  const handleCardClick = useCallback((cardId: number) => {
    if (!gameActive || flippedCards.length >= 2) return;
    const card = cards.find(c => c.id === cardId);
    if (!card || card.isFlipped || card.isMatched) return;
    const newFlippedCards = [...flippedCards, cardId];
    setFlippedCards(newFlippedCards);
    setCards(prev => prev.map(c => 
      c.id === cardId ? { ...c, isFlipped: true } : c
    ));
    if (newFlippedCards.length === 2) {
      setMoves(prev => prev + 1);
      const [firstId, secondId] = newFlippedCards;
      const firstCard = cards.find(c => c.id === firstId);
      const secondCard = cards.find(c => c.id === secondId);
      if (firstCard?.emoji === secondCard?.emoji) {
        // Match found
        setTimeout(() => {
          setCards(prev => prev.map(c => 
            (c.id === firstId || c.id === secondId) 
              ? { ...c, isMatched: true }
              : c
          ));
          setMatches(prev => {
            const newMatches = prev + 1;
            if (newMatches === 8) {
              // Game won
              setTimeout(() => {
                setGameOver(true);
                setGameActive(false);
                const finalXP = 200 + timeLeft * 5 - moves * 2;
                onGameComplete(Math.max(100, finalXP));
              }, 500);
            }
            return newMatches;
          });
          setScore(prev => prev + 100 + timeLeft);
          setFlippedCards([]);
        }, 500);
      } else {
        // No match
        setTimeout(() => {
          setCards(prev => prev.map(c => 
            (c.id === firstId || c.id === secondId) 
              ? { ...c, isFlipped: false }
              : c
          ));
          setFlippedCards([]);
        }, 1000);
      }
    }
  }, [gameActive, flippedCards, cards, timeLeft, moves, onGameComplete]);

  const resetGame = useCallback(() => {
    setGameActive(false);
    setGameOver(false);
    initializeGame();
  }, [initializeGame]);

  return (
    <div className="fixed inset-0 z-50 min-h-screen bg-gradient-to-br from-blue-800 to-slate-800 p-0 flex flex-col">
      <div className="flex-1 flex flex-col w-full h-full items-center justify-center relative">
        {/* Header Row: Back button, Title, XP */}
        <div className="flex items-center justify-between w-full max-w-2xl mx-auto mb-4 px-2">
          <Button
            variant="ghost"
            onClick={() => {
              const audio = new Audio('/audio/button.mp3');
              audio.play();
              setTimeout(() => onBack(), 100);
            }}
            className="bg-white/20 text-white hover:bg-white/30 rounded-full w-12 h-12 p-0"
          >
            <ArrowLeft className="w-6 h-6" />
          </Button>
          <h1 className="text-2xl font-bold text-white text-center flex-1">🧠 Match Pairs</h1>
          <div className="bg-gradient-to-r from-sky-400 to-blue-500 px-3 py-1 rounded-full shadow-lg ml-auto">
            <span className="text-white font-bold text-base">XP: {score}</span>
          </div>
        </div>
        {/* Timer below header */}
        <div className="flex items-center gap-2 bg-blue-900/80 px-2 py-1 rounded-full text-white mb-4">
          <Timer className="w-4 h-4" />
          {timeLeft}s
        </div>
        {/* Stats */}
        <div className="grid grid-cols-3 gap-2 mb-6 text-center text-xs w-full max-w-md">
          <div>
            <div className="text-lg font-bold text-pink-600">{score}</div>
            <div className="text-xs text-gray-600">Score</div>
          </div>
          <div>
            <div className="text-lg font-bold text-blue-600">{moves}</div>
            <div className="text-xs text-gray-600">Moves</div>
          </div>
          <div>
            <div className="text-lg font-bold text-green-600">{matches}/8</div>
            <div className="text-xs text-gray-600">Matches</div>
          </div>
        </div>
        {/* Game Board */}
        <div className="w-full flex justify-center overflow-x-auto">
          <div className="grid grid-cols-4 gap-2 sm:gap-3 max-w-lg mx-auto justify-center">
            {cards.map((card) => (
              <button
                key={card.id}
                className={`aspect-square rounded text-lg flex items-center justify-center transition-all duration-300 transform hover:scale-105 p-0 ${
                  card.isFlipped || card.isMatched
                    ? 'bg-white border border-pink-300'
                    : 'bg-gradient-to-br from-pink-400 to-purple-500'
                } ${!gameActive ? 'cursor-not-allowed opacity-70' : 'cursor-pointer'} w-[22vw] h-[22vw] max-w-[80px] max-h-[80px] sm:w-[100px] sm:h-[100px] sm:max-w-[110px] sm:max-h-[110px] md:w-[110px] md:h-[110px]`}
                onClick={() => handleCardClick(card.id)}
                disabled={!gameActive}
                style={{ minWidth: 0, minHeight: 0 }}
              >
                {card.isFlipped || card.isMatched ? card.emoji : '❓'}
              </button>
            ))}
          </div>
        </div>
        {/* Controls */}
        <div className="text-center w-full flex flex-col items-center justify-center flex-1">
          {/* Overlay Start Button if not active and not game over */}
          {!gameActive && !gameOver && (
            <div className="absolute inset-0 flex flex-col items-center justify-center z-50 bg-black/60">
              <Button onClick={startGame} className="bg-orange-500 hover:bg-orange-600 text-white px-8 py-4 text-lg rounded-xl">
                <Play className="w-5 h-5 mr-2" />
                Start Memory Game
              </Button>
            </div>
          )}
          {gameOver ? (
            <div className="flex flex-col items-center justify-center w-full h-full">
              <Trophy className="w-8 h-8 text-yellow-500 mx-auto mb-1" />
              <h3 className="text-lg font-bold text-gray-800 mb-1">
                {matches === 8 ? 'Perfect Match!' : 'Time\'s Up!'}
              </h3>
              <p className="text-gray-600 mb-2 text-xs">
                {matches} matches in {moves} moves • Score: {score}
              </p>
              <div className="flex gap-2 justify-center">
                <Button onClick={resetGame} variant="outline" className="px-2 py-1 text-xs">
                  <RotateCcw className="w-4 h-4 mr-1" />
                  Play Again
                </Button>
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
};

export default MatchPairs;