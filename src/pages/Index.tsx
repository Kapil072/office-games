import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import GameGrid from "@/components/GameGrid";
import TicTacToe from "@/components/games/TicTacToe";
import SnakeGame from "@/components/games/SnakeGame";
import PuzzleGame from "@/components/games/PuzzleGame";
import ChaiCatcher from "@/components/games/ChaiCatcher";
import SlapNotification from "@/components/games/SlapNotification";
import MuteThatMic from "@/components/games/MuteThatMic";
import BackgroundParticles from "@/components/BackgroundParticles";
import PrinterTantrum from "@/components/games/PrinterTantrum";
import WordUnscramble from "@/components/games/WordUnscramble";
import CarRacingGame from "@/components/games/CarRacingGame";
import MissionOffice from "@/components/games/MissionOffice";
import DotConnection from "@/components/games/DotConnection";
import MeetingBingoMadness from "@/components/games/MeetingBingoMadness";
import MatchPairs from "@/components/games/MatchPairs";
import SimonSays from "@/components/games/SimonSays";

const Index = () => {
  const [selectedGame, setSelectedGame] = useState<string | null>(null);
  const [xp, setXp] = useState(0);

  const handleBackToGames = () => {
    setSelectedGame(null);
  };

  // Play sound then go back
  const handleBackWithSound = () => {
    const audio = new Audio('/audio/button.mp3');
    audio.play();
    setTimeout(() => handleBackToGames(), 100);
  };

  const handleGameComplete = (gameXp: number) => {
    setXp(prev => prev + gameXp);
  };

  const renderGame = () => {
    switch (selectedGame) {
      case 'tic-tac-toe':
        return <TicTacToe />;
      case 'snake':
        return <SnakeGame />;
      case 'puzzle':
        return <PuzzleGame onGameComplete={handleGameComplete} onBack={handleBackToGames} />;
      case 'chai-catcher':
        return <ChaiCatcher onGameComplete={handleGameComplete} onBack={handleBackToGames} />;
      case 'slap-notification':
        return <SlapNotification onGameComplete={handleGameComplete} onBack={handleBackToGames} />;
      case 'mute-mic':
        return <MuteThatMic onGameComplete={handleGameComplete} onBack={handleBackToGames} />;
      case 'printer-tantrum':
        return <PrinterTantrum onGameComplete={handleGameComplete} onBack={handleBackToGames} />;
      case 'word-unscramble':
        return <WordUnscramble onGameComplete={handleGameComplete} onBack={handleBackToGames} />;
      case 'car-racing':
        return <CarRacingGame onGameComplete={handleGameComplete} onBack={handleBackToGames} />;
      case 'mission-office':
        return <MissionOffice onGameComplete={handleGameComplete} onBack={handleBackToGames} />;
      case 'dot-connection':
        return <DotConnection onGameComplete={handleGameComplete} onBack={handleBackToGames} />;
      case 'meeting-bingo-madness':
        return <MeetingBingoMadness onGameComplete={handleGameComplete} onBack={handleBackToGames} />;
      case 'match-pairs':
        return <MatchPairs onGameComplete={handleGameComplete} onBack={handleBackToGames} />;
      case 'simon-says':
        return <SimonSays onGameComplete={handleGameComplete} onBack={handleBackToGames} />;
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-white relative overflow-hidden">
      {/* Background Particles */}
      {selectedGame !== 'meeting-bingo-madness' && <BackgroundParticles />}

      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden z-10">
        <div className="absolute top-10 left-10 w-4 h-4 bg-pink-400 rounded-full opacity-60 animate-pulse"></div>
        <div className="absolute top-20 right-20 w-6 h-6 bg-yellow-400 transform rotate-45 opacity-40 animate-bounce"></div>
        <div className="absolute bottom-20 left-20 w-8 h-8 bg-green-400 rounded-full opacity-50 animate-pulse"></div>
        <div className="absolute bottom-10 right-10 w-5 h-5 bg-blue-400 transform rotate-45 opacity-60 animate-bounce"></div>
        <div className="absolute top-1/2 left-1/4 w-3 h-3 bg-purple-400 rounded-full opacity-70 animate-pulse"></div>
        <div className="absolute top-1/3 right-1/3 w-4 h-4 bg-orange-400 transform rotate-45 opacity-50 animate-bounce"></div>
      </div>

      {/* Header */}
      <header className="relative z-20 flex justify-between items-center p-2">
        <Button
          variant="ghost"
          size="sm"
          onClick={handleBackWithSound}
          className="text-gray-800 hover:bg-black/10 transition-colors px-2 py-1 h-8"
        >
          <ArrowLeft className="w-5 h-5 mr-1" />
          Back
        </Button>
        
        <div className="bg-gradient-to-r from-sky-400 to-blue-500 px-3 py-1 rounded-full shadow-lg">
          <span className="text-white font-bold text-base">XP: {xp.toLocaleString()}</span>
        </div>
      </header>

      {/* Main Content */}
      <main className="relative z-20 px-6 pb-6 flex flex-col flex-grow min-h-0">
        {selectedGame ? (
          renderGame()
        ) : (
          <div className="text-center mb-8">
            <h1 className="text-6xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-sky-400 via-blue-500 to-cyan-500 mb-4 drop-shadow-lg">
              FUN GAMES
            </h1>
            <p className="text-gray-800 text-xl mb-8 drop-shadow-md">
              Choose your adventure and start playing!
            </p>
            
            <GameGrid onGameSelect={setSelectedGame} />
          </div>
        )}
      </main>
    </div>
  );
};

export default Index;
