import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { ArrowLeft, RotateCcw, Play, Trophy, Shuffle, CheckCircle } from "lucide-react";

interface GameProps {
  onGameComplete: (xp: number) => void;
  onBack: () => void;
}

const WordUnscramble = ({ onGameComplete, onBack }: GameProps) => {
  const [gameActive, setGameActive] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [currentWord, setCurrentWord] = useState('');
  const [scrambledWord, setScrambledWord] = useState('');
  const [userInput, setUserInput] = useState('');
  const [score, setScore] = useState(0);
  const [level, setLevel] = useState(1);
  const [timeLeft, setTimeLeft] = useState(90);
  const [wordsCompleted, setWordsCompleted] = useState(0);
  const [streak, setStreak] = useState(0);
  const [hint, setHint] = useState('');

  const wordDatabase = [
    // Level 1 - Easy (3-4 letters)
    { word: 'CAT', hint: '🐱 Furry pet that meows', level: 1 },
    { word: 'DOG', hint: '🐶 Loyal pet that barks', level: 1 },
    { word: 'SUN', hint: '☀️ Bright star in the sky', level: 1 },
    { word: 'MOON', hint: '🌙 Glows at night', level: 1 },
    { word: 'TREE', hint: '🌳 Tall plant with leaves', level: 1 },
    { word: 'FISH', hint: '🐟 Swims in water', level: 1 },
    { word: 'BIRD', hint: '🐦 Has wings and flies', level: 1 },
    { word: 'STAR', hint: '⭐ Twinkles in the night sky', level: 1 },
    
    // Level 2 - Medium (5-6 letters)
    { word: 'FLOWER', hint: '🌸 Colorful bloom on plants', level: 2 },
    { word: 'SUMMER', hint: '☀️ Hot season of the year', level: 2 },
    { word: 'WINTER', hint: '❄️ Cold season with snow', level: 2 },
    { word: 'GARDEN', hint: '🌱 Place where plants grow', level: 2 },
    { word: 'OCEAN', hint: '🌊 Large body of salt water', level: 2 },
    { word: 'MOUNTAIN', hint: '⛰️ Very tall landform', level: 2 },
    { word: 'RAINBOW', hint: '🌈 Colorful arc in the sky', level: 2 },
    { word: 'THUNDER', hint: '⚡ Loud sound during storms', level: 2 },
    
    // Additional Level 2 words (5-7 letters)
    { word: 'HAPPY', hint: '😊 Feeling of joy and contentment', level: 2 },
    { word: 'SMILE', hint: '😄 Curved mouth showing happiness', level: 2 },
    { word: 'MUSIC', hint: '🎵 Organized sounds and melodies', level: 2 },
    { word: 'DANCE', hint: '💃 Moving to rhythm and music', level: 2 },
    { word: 'SLEEP', hint: '😴 Resting state with closed eyes', level: 2 },
    { word: 'DREAM', hint: '💭 Thoughts and images while sleeping', level: 2 },
    { word: 'LAUGH', hint: '😂 Sound of amusement and joy', level: 2 },
    { word: 'FRIEND', hint: '👥 Person you like and trust', level: 2 },
    { word: 'FAMILY', hint: '👨‍👩‍👧‍👦 People related by blood or love', level: 2 },
    { word: 'SCHOOL', hint: '🏫 Place where students learn', level: 2 },
    { word: 'WORKER', hint: '👷 Person who does a job', level: 2 },
    { word: 'DOCTOR', hint: '👨‍⚕️ Medical professional who heals', level: 2 },
    { word: 'TEACHER', hint: '👩‍🏫 Person who educates students', level: 2 },
    { word: 'COOKING', hint: '👨‍🍳 Preparing food to eat', level: 2 },
    { word: 'READING', hint: '📖 Looking at words to understand', level: 2 },
    { word: 'WRITING', hint: '✍️ Creating words on paper', level: 2 },
    { word: 'RUNNING', hint: '🏃 Moving fast on foot', level: 2 },
    { word: 'SWIMMING', hint: '🏊 Moving through water', level: 2 },
    { word: 'PLAYING', hint: '🎮 Having fun and entertainment', level: 2 },
    { word: 'SINGING', hint: '🎤 Making musical sounds with voice', level: 2 },
    { word: 'PAINTING', hint: '🎨 Creating art with colors', level: 2 },
    { word: 'BUILDING', hint: '🏗️ Creating structures and houses', level: 2 },
    { word: 'TRAVELING', hint: '✈️ Going to different places', level: 2 },
    { word: 'EXPLORING', hint: '🗺️ Discovering new places', level: 2 },
    { word: 'LEARNING', hint: '📚 Gaining knowledge and skills', level: 2 },
    { word: 'THINKING', hint: '🧠 Using your mind to consider', level: 2 },
    { word: 'CREATING', hint: '🎨 Making something new', level: 2 },
    { word: 'HELPING', hint: '🤝 Assisting others in need', level: 2 },
    { word: 'SHARING', hint: '🤲 Giving something to others', level: 2 },
    { word: 'CARING', hint: '💝 Showing concern and love', level: 2 },
    { word: 'GIVING', hint: '🎁 Presenting something to someone', level: 2 },
    { word: 'RECEIVING', hint: '📦 Getting something from others', level: 2 },
    { word: 'CELEBRATING', hint: '🎉 Having a party or special event', level: 2 },
    
    // Level 3 - Hard (7+ letters)
    { word: 'ELEPHANT', hint: '🐘 Large animal with trunk', level: 3 },
    { word: 'BUTTERFLY', hint: '🦋 Colorful flying insect', level: 3 },
    { word: 'COMPUTER', hint: '💻 Electronic device for work', level: 3 },
    { word: 'TELEPHONE', hint: '📞 Device for calling people', level: 3 },
    { word: 'CHOCOLATE', hint: '🍫 Sweet brown treat', level: 3 },
    { word: 'ADVENTURE', hint: '🗺️ Exciting journey or experience', level: 3 },
    { word: 'UNIVERSE', hint: '🌌 All of space and everything in it', level: 3 },
    { word: 'LIGHTNING', hint: '⚡ Bright flash during storms', level: 3 },

    // Added 50 more words
    { word: 'BANANA', hint: '🍌 Yellow fruit monkeys love', level: 2 },
    { word: 'ORANGE', hint: '🍊 Citrus fruit and a color', level: 2 },
    { word: 'PYTHON', hint: '🐍 Popular programming language', level: 2 },
    { word: 'JUNGLE', hint: '🌴 Dense forest with wild animals', level: 2 },
    { word: 'DESERT', hint: '🏜️ Dry, sandy, and hot place', level: 2 },
    { word: 'ISLAND', hint: '🏝️ Land surrounded by water', level: 2 },
    { word: 'ROCKET', hint: '🚀 Flies to space', level: 2 },
    { word: 'PLANET', hint: '🪐 Orbits a star', level: 2 },
    { word: 'GALAXY', hint: '🌌 Huge system of stars', level: 2 },
    { word: 'CIRCUS', hint: '🎪 Place with clowns and acrobats', level: 2 },
    { word: 'CANDLE', hint: '🕯️ Gives light when lit', level: 2 },
    { word: 'PUZZLE', hint: '🧩 Game that tests your mind', level: 2 },
    { word: 'ROBOT', hint: '🤖 Machine that can move and act', level: 2 },
    { word: 'DINNER', hint: '🍽️ Evening meal', level: 2 },
    { word: 'SILENT', hint: '🤫 Not making any sound', level: 2 },
    { word: 'CLOUD', hint: '☁️ Floats in the sky', level: 2 },
    { word: 'BRIDGE', hint: '🌉 Structure over water or road', level: 2 },
    { word: 'COWBOY', hint: '🤠 Western horse rider', level: 2 },
    { word: 'GUITAR', hint: '🎸 String musical instrument', level: 2 },
    { word: 'PENCIL', hint: '✏️ Used for writing or drawing', level: 2 },
    { word: 'MARKET', hint: '🛒 Place to buy things', level: 2 },
    { word: 'CAMPUS', hint: '🏫 Area of a college or school', level: 2 },
    { word: 'SILVER', hint: '🥈 Precious gray metal', level: 2 },
    { word: 'CANDLE', hint: '🕯️ Used for light or celebration', level: 2 },
    { word: 'BREEZE', hint: '🍃 Gentle wind', level: 2 },
    { word: 'JACKET', hint: '🧥 Worn to keep warm', level: 2 },
    { word: 'BUTTON', hint: '🔘 Used to fasten clothes', level: 2 },
    { word: 'CIRCUS', hint: '🎪 Show with acrobats and clowns', level: 2 },
    { word: 'TURTLE', hint: '🐢 Slow-moving reptile', level: 2 },
    { word: 'PEANUT', hint: '🥜 Small, crunchy snack', level: 2 },
    { word: 'BASKET', hint: '🧺 Used to carry things', level: 2 },
    { word: 'CANDLE', hint: '🕯️ Wax stick for light', level: 2 },
    { word: 'SANDAL', hint: '👡 Open shoe for summer', level: 2 },
    { word: 'TIGERS', hint: '🐯 Big striped cats', level: 2 },
    { word: 'PIGEON', hint: '🕊️ Common city bird', level: 2 },
    { word: 'CROWNS', hint: '👑 Worn by royalty', level: 2 },
    { word: 'BOTTLE', hint: '🍼 Holds liquids', level: 2 },
    { word: 'CANDLE', hint: '🕯️ Used for light', level: 2 },
    { word: 'SPOONS', hint: '🥄 Used for eating soup', level: 2 },
    { word: 'CUPCAKE', hint: '🧁 Small sweet cake', level: 2 },
    { word: 'PUMPKIN', hint: '🎃 Orange vegetable for Halloween', level: 2 },
    { word: 'BALLOON', hint: '🎈 Filled with air or helium', level: 2 },
    { word: 'CABBAGE', hint: '🥬 Leafy green vegetable', level: 2 },
    { word: 'SPAGHETTI', hint: '🍝 Long Italian pasta', level: 3 },
    { word: 'NOTEBOOK', hint: '📓 Used for writing notes', level: 3 },
    { word: 'ELEVEN', hint: '🔢 Number after ten', level: 2 },
    { word: 'TWELVE', hint: '🔢 Number after eleven', level: 2 },
    { word: 'THIRTEEN', hint: '🔢 Number after twelve', level: 3 },
    { word: 'FOURTEEN', hint: '🔢 Number after thirteen', level: 3 },
    { word: 'FIFTEEN', hint: '🔢 Number after fourteen', level: 3 },
    { word: 'SIXTEEN', hint: '🔢 Number after fifteen', level: 3 },
    { word: 'SEVENTEEN', hint: '🔢 Number after sixteen', level: 3 },
    { word: 'EIGHTEEN', hint: '🔢 Number after seventeen', level: 3 },
    { word: 'NINETEEN', hint: '🔢 Number after eighteen', level: 3 },
    { word: 'TWENTY', hint: '🔢 Number after nineteen', level: 2 },
  ];

  const scrambleWord = useCallback((word: string) => {
    const letters = word.split('');
    for (let i = letters.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [letters[i], letters[j]] = [letters[j], letters[i]];
    }
    return letters.join('');
  }, []);

  const getRandomWord = useCallback(() => {
    const levelWords = wordDatabase.filter(w => w.level === Math.min(level, 3));
    const randomWord = levelWords[Math.floor(Math.random() * levelWords.length)];
    return randomWord;
  }, [level]);

  const startNewWord = useCallback(() => {
    const wordData = getRandomWord();
    setCurrentWord(wordData.word);
    setHint(wordData.hint);
    setScrambledWord(scrambleWord(wordData.word));
    setUserInput('');
  }, [getRandomWord, scrambleWord]);

  const startGame = useCallback(() => {
    setGameActive(true);
    setGameOver(false);
    setScore(0);
    setLevel(1);
    setTimeLeft(90);
    setWordsCompleted(0);
    setStreak(0);
    startNewWord();
  }, [startNewWord]);

  // Timer
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (gameActive && !gameOver && timeLeft > 0) {
      timer = setTimeout(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            setGameOver(true);
            setGameActive(false);
            const finalXP = score + wordsCompleted * 20;
            onGameComplete(finalXP);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearTimeout(timer);
  }, [gameActive, gameOver, timeLeft, score, wordsCompleted, onGameComplete]);

  const handleSubmit = useCallback(() => {
    if (!gameActive || !userInput.trim()) return;

    if (userInput.toUpperCase() === currentWord) {
      // Correct answer
      const wordPoints = currentWord.length * 10 + streak * 5;
      setScore(prev => prev + wordPoints);
      setWordsCompleted(prev => prev + 1);
      setStreak(prev => prev + 1);
      
      // Level progression
      if (wordsCompleted > 0 && (wordsCompleted + 1) % 5 === 0) {
        setLevel(prev => Math.min(prev + 1, 3));
      }
      
      startNewWord();
    } else {
      // Wrong answer
      setStreak(0);
      setUserInput('');
    }
  }, [gameActive, userInput, currentWord, streak, wordsCompleted, startNewWord]);

  const handleKeyPress = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSubmit();
    }
  }, [handleSubmit]);

  const shuffleScrambled = useCallback(() => {
    setScrambledWord(scrambleWord(currentWord));
  }, [currentWord, scrambleWord]);

  const resetGame = useCallback(() => {
    setGameActive(false);
    setGameOver(false);
    setScore(0);
    setLevel(1);
    setTimeLeft(90);
    setWordsCompleted(0);
    setStreak(0);
    setUserInput('');
  }, []);

  return (
    <div className="fixed inset-0 z-50 min-h-screen bg-gradient-to-br from-teal-900 to-blue-900 p-4 flex flex-col">
      {/* Header */}
      <div className="flex justify-between items-center mb-4">
        <Button
          variant="ghost"
          onClick={onBack}
          className="bg-white/20 text-white hover:bg-white/30 rounded-full w-12 h-12 p-0"
        >
          <ArrowLeft className="w-6 h-6" />
        </Button>
        
        <h1 className="text-2xl sm:text-3xl font-bold text-white">🧠 Word Unscramble</h1>
        
        <div className="bg-teal-100 px-3 py-2 rounded-full">
          <span className="text-teal-800 font-bold text-sm sm:text-base">{timeLeft}s</span>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-2 mb-4 text-center">
        <div className="bg-white/10 backdrop-blur-sm rounded-lg p-2">
          <div className="text-xl sm:text-2xl font-bold text-teal-300">{score}</div>
          <div className="text-xs sm:text-sm text-white/80">Score</div>
        </div>
        <div className="bg-white/10 backdrop-blur-sm rounded-lg p-2">
          <div className="text-xl sm:text-2xl font-bold text-blue-300">{wordsCompleted}</div>
          <div className="text-xs sm:text-sm text-white/80">Words</div>
        </div>
        <div className="bg-white/10 backdrop-blur-sm rounded-lg p-2">
          <div className="text-xl sm:text-2xl font-bold text-green-300">{level}</div>
          <div className="text-xs sm:text-sm text-white/80">Level</div>
        </div>
        <div className="bg-white/10 backdrop-blur-sm rounded-lg p-2">
          <div className="text-xl sm:text-2xl font-bold text-orange-300">{streak}</div>
          <div className="text-xs sm:text-sm text-white/80">Streak</div>
        </div>
      </div>

      {/* Game Area */}
      <div className="flex-1 flex items-center justify-center">
        <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 sm:p-6 max-w-lg w-full border border-white/20">
          {gameActive && (
            <div className="space-y-4">
              {/* Hint */}
              <div className="text-center p-3 bg-white/20 rounded-xl">
                <div className="text-sm text-white/70 mb-1">Hint:</div>
                <div className="font-semibold text-white text-sm sm:text-base">{hint}</div>
              </div>

              {/* Scrambled Word */}
              <div className="text-center">
                <div className="text-sm text-white/70 mb-3">Unscramble this word:</div>
                <div className="flex items-center justify-center gap-3 mb-4">
                  <div className="text-2xl sm:text-3xl font-bold text-teal-300 bg-white/20 px-4 py-2 rounded-lg tracking-wider">
                    {scrambledWord}
                  </div>
                  <Button variant="outline" size="sm" onClick={shuffleScrambled} className="border-white/30 text-white hover:bg-white/20">
                    <Shuffle className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              {/* Input */}
              <div>
                <input
                  type="text"
                  value={userInput}
                  onChange={(e) => setUserInput(e.target.value.toUpperCase())}
                  onKeyPress={handleKeyPress}
                  placeholder="Type your answer..."
                  className="w-full p-3 text-base sm:text-lg text-center border-2 border-teal-300/50 rounded-xl focus:border-teal-400 focus:outline-none uppercase tracking-wider bg-white/20 text-white placeholder-white/50"
                  maxLength={currentWord.length}
                />
              </div>

              {/* Submit Button */}
              <Button 
                onClick={handleSubmit} 
                className="w-full bg-teal-600 hover:bg-teal-700 text-white py-3 text-sm sm:text-base"
                disabled={!userInput.trim()}
              >
                <CheckCircle className="w-4 h-4 mr-2" />
                Submit Answer
              </Button>
            </div>
          )}

          {/* Controls */}
          <div className="text-center">
            {!gameActive && !gameOver ? (
              <div className="space-y-4">
                <p className="text-white/80 text-sm sm:text-base">
                  Unscramble the jumbled letters to form valid words. Use the hints to help you!
                </p>
                <Button onClick={startGame} className="bg-teal-600 hover:bg-teal-700 text-white px-6 py-3 text-sm sm:text-base">
                  <Play className="w-4 h-4 mr-2" />
                  Start Unscrambling
                </Button>
              </div>
            ) : gameOver ? (
              <div className="space-y-4">
                <Trophy className="w-12 h-12 sm:w-16 sm:h-16 text-yellow-400 mx-auto" />
                <h3 className="text-xl sm:text-2xl font-bold text-white">Time's Up!</h3>
                <p className="text-white/80 text-sm sm:text-base">
                  Level {level} • {wordsCompleted} words • Score: {score}
                </p>
                <div className="flex flex-col sm:flex-row gap-2 justify-center">
                  <Button onClick={resetGame} variant="outline" className="border-white/30 text-white hover:bg-white/20">
                    <RotateCcw className="w-4 h-4 mr-2" />
                    Try Again
                  </Button>
                  <Button onClick={onBack} className="bg-white/20 text-white hover:bg-white/30">
                    Back to Games
                  </Button>
                </div>
              </div>
            ) : (
              <div className="text-sm text-white/70">
                <p>Letters: {currentWord.length} • Current streak: {streak}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default WordUnscramble;