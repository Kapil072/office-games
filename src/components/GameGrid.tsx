import { Button } from "@/components/ui/button";
import React from "react";

interface GameGridProps {
  onGameSelect: (gameId: string) => void;
}

const GameGrid = ({ onGameSelect }: GameGridProps) => {
  // Generate a random number between 1.0 and 2.0 (one decimal place) for 'Mute That Mic'
  const muteMicPlayers = (Math.random() * (2 - 1) + 1).toFixed(1);
  // Generate a random number between 0.0 and 0.9 (one decimal place) for other games
  const getOtherGamePlayers = () => `0.${Math.floor(Math.random() * 10)}M Playing`;
  const games = [
    // 1. Mute That Mic
    {
      id: 'mute-mic',
      title: 'Mute That Mic',
      description: 'Zoom Call Fatigue - Mute before cringe overload',
      bgColor: 'from-indigo-500 to-purple-600',
      icon: '🎤',
      available: true
    },
    // 2. Chai Catcher
    {
      id: 'chai-catcher',
      title: 'Chai Catcher',
      description: 'Chai = Sanity - Catch tea, avoid distractions',
      bgColor: 'from-amber-600 to-yellow-600',
      icon: '☕',
      available: true
    },
    // 3. Simon Says
    {
      id: 'simon-says',
      title: 'Simon Says',
      description: 'Repeat the color sequence.',
      bgColor: 'from-purple-600 to-indigo-700',
      icon: '🧠',
      available: true
    },
    // 4. Slap Notification
    {
      id: 'slap-notification',
      title: 'Slap the Notification',
      description: 'Notification Overload - Slap away distractions',
      bgColor: 'from-orange-500 to-amber-600',
      icon: '📱',
      available: true
    },
    // 5. Printer Tantrum
    {
      id: 'printer-tantrum',
      title: 'Printer Tantrum',
      description: 'Office printer chaos - fix, print, survive!',
      bgColor: 'from-gray-400 to-slate-700',
      icon: '🖨️',
      available: true
    },{
      id: 'word-unscramble',
      title: 'Word Unscramble',
      description: 'Brain Teaser - Unscramble letters to form words',
      bgColor: 'from-teal-600 to-cyan-700',
      icon: '📝',
      available: true
    },
    // 6. Sliding Puzzle
    {
      id: 'puzzle',
      title: 'Sliding Puzzle',
      description: 'Slide tiles to arrange numbers 1-15.',
      bgColor: 'from-blue-500 to-cyan-600',
      icon: '🧩',
      available: true
    },{
      id: 'car-racing',
      title: 'Car Racing',
      description: 'Dodge obstacles and race for a high score!',
      bgColor: 'from-gray-700 to-black',
      icon: '🏎️',
      available: true
    },
    {
      id: 'dot-connection',
      title: 'Dot Connection',
      description: 'Connect matching colored dots',
      bgColor: 'from-blue-400 to-blue-700',
      icon: '🔵',
      available: true
    },
    // 7. Meeting Bingo Madness
    {
      id: 'meeting-bingo-madness',
      title: 'Meeting Bingo Madness',
      description: 'Corporate buzzword bingo for meetings.',
      bgColor: 'from-purple-500 to-violet-600',
      icon: '🎯',
      available: true
    },

    {
      id: 'tic-tac-toe',
      title: 'Tic Tac Toe',
      description: 'Classic strategy game',
      bgColor: 'from-purple-500 to-violet-600',
      icon: '⭕',
      available: true
    },
    {
      id: 'snake',
      title: 'Snake Game',
      description: 'Eat and grow longer',
      bgColor: 'from-green-500 to-emerald-600',
      icon: '🐍',
      available: true
    },
  
    {
      id: 'match-pairs',
      title: 'Match the Pairs',
      description: 'Card Flip Memory - Find matching pairs quickly',
      bgColor: 'from-pink-600 to-rose-700',
      icon: '🃏',
      available: true
    },
    // Mission Office at the end
    {
      id: 'mission-office',
      title: 'Mission Office',
      description: 'Ride your scooter, dodge obstacles, collect power-ups!',
      bgColor: 'from-orange-500 to-red-600',
      icon: '🏍️',
      available: true
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
      {games.map((game) => (
        <div
          key={game.id}
          className={`relative group transform hover:scale-105 transition-all duration-300 ${
            !game.available ? 'opacity-60' : ''
          }`}
        >
          {/* Playing badge for each game */}
          <div className="absolute top-2 right-2 z-10">
            <span className="bg-yellow-400 text-xs font-bold text-gray-900 px-3 py-1 rounded-full shadow-lg border border-yellow-500">
              {game.id === 'mute-mic' ? `${muteMicPlayers}M Playing` : getOtherGamePlayers()}
            </span>
          </div>
          <div
            className={`bg-gradient-to-br ${game.bgColor} p-6 rounded-2xl shadow-xl hover:shadow-2xl transition-shadow duration-300 border-4 border-white/20`}
          >
            <div className="text-center">
              <div className="text-6xl mb-4 text-white">{game.icon}</div>
              <h3 className="text-2xl font-bold text-white mb-2">{game.title}</h3>
              <p className="text-white/80 mb-6 text-sm leading-relaxed">{game.description}</p>
              
              {game.available ? (
                <Button
                  onClick={() => onGameSelect(game.id)}
                  className="w-full bg-white text-gray-800 hover:bg-gray-100 font-semibold py-3 rounded-xl transition-colors"
                >
                  Play Now
                </Button>
              ) : (
                <div className="w-full bg-gray-600 text-white py-3 rounded-xl font-semibold">
                  Coming Soon
                </div>
              )}
            </div>
          </div>
          
          {!game.available && (
            <div className="absolute inset-0 bg-black/40 rounded-2xl flex items-center justify-center">
              <span className="text-white text-lg font-bold bg-black/60 px-4 py-2 rounded-lg">
                🎮 Try This!
              </span>
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

export default GameGrid;
