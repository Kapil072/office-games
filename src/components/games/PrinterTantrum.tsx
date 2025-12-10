import { useState, useEffect, useCallback, useRef } from "react";
import { Button } from "@/components/ui/button";
import { ArrowLeft, RotateCcw, Printer, Wrench, AlertTriangle, PartyPopper } from "lucide-react";
import { Progress } from "@/components/ui/progress";

interface PrinterTantrumProps {
  onGameComplete: (xp: number) => void;
  onBack: () => void;
}

interface PrintedItem {
  id: number;
  type: 'image' | 'report' | 'error';
  content: string;
  x: number;
  y: number;
  rotation: number;
}

const PrinterTantrum = ({ onGameComplete, onBack }: PrinterTantrumProps) => {
  const [printerState, setPrinterState] = useState<'idle' | 'printing' | 'error' | 'repairing' | 'celebrating'>('idle');
  const [printedItems, setPrintedItems] = useState<PrintedItem[]>([]);
  const [score, setScore] = useState(0);
  const [repairProgress, setRepairProgress] = useState(0);
  const [reportsGenerated, setReportsGenerated] = useState(0);
  const [gameActive, setGameActive] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [clickCount, setClickCount] = useState(0);
  const [isShaking, setIsShaking] = useState(false);
  const [showCelebration, setShowCelebration] = useState(false);
  const nextItemId = useRef(0);

  // Placeholder images for memes - these can be replaced with actual uploaded images
  const memeImages = [
    "/memes/meme1.png",
    "/memes/meme2.jpeg",
    "/memes/meme3.jpeg",
    "/memes/meme4.jpeg",
    "/memes/meme5.jpeg",
    "/memes/meme6.jpeg"
  ];

  const errorMessages = [
    "PAPER JAM!", "INK LOW!", "FEED ERROR!", "OFFLINE!", "PRINTER RAGE!", 
    "PC LOAD LETTER", "TONER LOW!", "DRIVER ERROR!", "CONNECTION LOST!",
    "FIRMWARE UPDATE REQUIRED!", "MEMORY OVERFLOW!", "TRAY EMPTY!", "COVER OPEN!", "HEATING...", "UNKNOWN ERROR!", "NETWORK TIMEOUT!", "SPOOLER CRASHED!", "MAGENTA MISSING!", "FATAL ERROR!", "404: PRINTER NOT FOUND!"
  ];

  const printReport = () => {
    if (printerState !== 'idle') return;

    setPrinterState('printing');
    setIsShaking(true);
    
    setTimeout(() => {
      setIsShaking(false);
      // 20% chance of error, 80% chance of success
      const shouldError = Math.random() < 0.2;
      if (shouldError) {
        setPrinterState('error');
        addPrintedItem('error', errorMessages[Math.floor(Math.random() * errorMessages.length)]);
      } else {
        // Success - print random memes (90%) or actual report (10%)
        const printReportSuccess = Math.random() < 0.1;
        if (printReportSuccess) {
          setPrinterState('celebrating');
          setShowCelebration(true);
          addPrintedItem('report', 'QUARTERLY REPORT');
          setReportsGenerated(prev => prev + 1);
          setScore(prev => prev + 50);
          // End game after celebration
          setTimeout(() => {
            setPrinterState('idle');
            setShowCelebration(false);
            setGameActive(false);
            setGameOver(true);
          }, 3000);
        } else {
          // Print random meme image
          const randomMeme = memeImages[Math.floor(Math.random() * memeImages.length)];
          addPrintedItem('image', randomMeme);
          setScore(prev => prev + 10);
          setPrinterState('idle');
        }
      }
    }, 2000);
  };

  const addPrintedItem = (type: 'image' | 'report' | 'error', content: string) => {
    const newItem: PrintedItem = {
      id: nextItemId.current++,
      type,
      content,
      x: Math.random() * 60 + 20,
      y: Math.random() * 30 + 10,
      rotation: Math.random() * 30 - 15
    };
    
    setPrintedItems(prev => [...prev, newItem]);
    
    setTimeout(() => {
      setPrintedItems(prev => prev.filter(item => item.id !== newItem.id));
    }, 5000);
  };

  const fixPrinter = () => {
    if (printerState !== 'error') return;
    
    setClickCount(prev => prev + 1);
    setRepairProgress(prev => Math.min(100, prev + 25));
    
    if (clickCount >= 3) {
      setPrinterState('repairing');
      setIsShaking(true);
      
      setTimeout(() => {
        setPrinterState('idle');
        setRepairProgress(0);
        setClickCount(0);
        setIsShaking(false);
        setScore(prev => prev + 20);
      }, 1500);
    }
  };

  const startGame = () => {
    setGameActive(true);
    setGameOver(false);
    setScore(0);
    setReportsGenerated(0);
    setPrintedItems([]);
    setPrinterState('idle');
    setRepairProgress(0);
    setClickCount(0);
    setShowCelebration(false);
  };

  const endGame = useCallback(() => {
    setGameActive(false);
    setGameOver(true);
    const earnedXp = Math.floor(score * 1.5) + (reportsGenerated * 25);
    onGameComplete(earnedXp);
  }, [score, reportsGenerated, onGameComplete]);

  return (
    <div className="text-center text-white min-h-screen px-4">
      <div className="flex flex-col sm:flex-row justify-between items-center mb-4 sm:mb-6 gap-4">
        <h2 className="text-2xl sm:text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-gray-400 to-slate-700 text-center w-full">Printer Tantrum</h2>
        
        <Button
          variant="ghost"
          size="lg"
          onClick={startGame}
          className="text-white hover:bg-white/20"
        >
          <RotateCcw className="w-6 h-6 mr-2" />
          {gameActive ? 'Restart' : 'Start'}
        </Button>
      </div>

      <div className="bg-gray-600/30 backdrop-blur-sm rounded-2xl p-4 sm:p-6 max-w-4xl mx-auto border border-gray-300/30">
        {/* Game Stats */}
        <div className="flex flex-col sm:flex-row justify-between items-center mb-4 gap-4">
          <div className="text-center sm:text-left">
            <p className="text-lg font-semibold text-black">Score: {score}</p>
            <p className="text-sm text-black">Reports: {reportsGenerated}</p>
          </div>
          <div className="text-center sm:text-right">
            <p className="text-sm text-black">Status: {printerState.toUpperCase()}</p>
          </div>
        </div>

        {/* Game Area */}
        <div className="relative w-full h-64 sm:h-96 bg-gradient-to-b from-gray-800/50 to-gray-900/30 rounded-xl border-2 border-gray-300/50 overflow-hidden">
          
          {/* Celebration Overlay */}
          {showCelebration && (
            <div className="absolute inset-0 bg-green-500/20 flex items-center justify-center z-40 animate-pulse">
              <div className="text-center">
                <PartyPopper className="w-12 h-12 sm:w-16 sm:h-16 text-green-400 mx-auto mb-4 animate-bounce" />
                <h3 className="text-2xl sm:text-3xl font-bold text-green-300 mb-2">SUCCESS!</h3>
                <p className="text-lg sm:text-xl text-green-200">Report Printed Successfully!</p>
              </div>
            </div>
          )}
          
          {/* Printer */}
          <div className="absolute left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2">
            <div className={`transition-all duration-200 ${isShaking ? 'animate-bounce' : ''} ${showCelebration ? 'animate-pulse' : ''}`}>
              <div className={`w-24 h-18 sm:w-32 sm:h-24 rounded-lg border-4 transition-colors duration-300 ${
                printerState === 'error' ? 'bg-red-500/30 border-red-400 animate-pulse' :
                printerState === 'printing' ? 'bg-blue-500/30 border-blue-400' :
                printerState === 'repairing' ? 'bg-yellow-500/30 border-yellow-400' :
                printerState === 'celebrating' ? 'bg-green-500/30 border-green-400' :
                'bg-gray-500/30 border-gray-400'
              } flex flex-col items-center justify-center`}>
                <Printer className={`w-6 h-6 sm:w-8 sm:h-8 mb-2 ${
                  printerState === 'error' ? 'text-red-400' :
                  printerState === 'printing' ? 'text-blue-400' :
                  printerState === 'repairing' ? 'text-yellow-400' :
                  printerState === 'celebrating' ? 'text-green-400' :
                  'text-gray-400'
                }`} />
                <div className="text-xs text-white font-bold">
                  {printerState === 'error' ? 'ERROR!' :
                   printerState === 'printing' ? 'PRINTING...' :
                   printerState === 'repairing' ? 'FIXING...' :
                   printerState === 'celebrating' ? 'SUCCESS!' :
                   'READY'}
                </div>
              </div>
              
              {/* Repair Progress */}
              {printerState === 'error' && (
                <div className="mt-2 w-24 sm:w-32">
                  <Progress value={repairProgress} className="h-2 bg-gray-700" />
                  <p className="text-xs text-gray-300 mt-1">Click {4 - clickCount} more times</p>
                </div>
              )}
            </div>
          </div>

          {/* Printed Items */}
          {printedItems.map(item => (
            <div
              key={item.id}
              className="absolute transition-all duration-500 transform animate-fade-in"
              style={{
                left: `${item.x}%`,
                top: `${item.y}%`,
                transform: `rotate(${item.rotation}deg)`
              }}
            >
              <div className={`p-2 sm:p-3 rounded-lg border-2 ${
                item.type === 'report' ? 'bg-green-500/30 border-green-400' :
                item.type === 'error' ? 'bg-red-500/30 border-red-400' :
                'bg-blue-500/30 border-blue-400'
              } shadow-lg`}>
                {item.type === 'image' ? (
                  <img 
                    src={item.content} 
                    alt="Meme" 
                    className="w-24 h-24 sm:w-32 sm:h-32 object-cover rounded mb-1"
                  />
                ) : item.type === 'report' ? (
                  <img
                    src="/memes/report.jpeg"
                    alt="Report"
                    className="w-24 h-24 sm:w-32 sm:h-32 object-cover rounded mb-1"
                  />
                ) : (
                  <div className="text-xl sm:text-2xl mb-1">❌</div>
                )}
                {item.type === 'report' && (
                  <p className="text-xs text-white font-medium">SUCCESS!</p>
                )}
                {item.type === 'error' && (
                  <p className="text-xs text-white font-medium">{item.content}</p>
                )}
              </div>
            </div>
          ))}

          {/* Control Buttons */}
          <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex flex-col sm:flex-row gap-2 sm:gap-4">
            <Button
              onClick={printReport}
              disabled={printerState !== 'idle' || !gameActive}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 sm:px-6 py-2 text-sm sm:text-base"
            >
              <Printer className="w-4 h-4 mr-2" />
              Print Report
            </Button>
            
            {printerState === 'error' && (
              <Button
                onClick={fixPrinter}
                className="bg-red-600 hover:bg-red-700 text-white px-4 sm:px-6 py-2 animate-pulse text-sm sm:text-base"
              >
                <Wrench className="w-4 h-4 mr-2" />
                Fix Printer
              </Button>
            )}
          </div>

          {/* Game Over/Start Overlay */}
          {(!gameActive || gameOver) && (
            <div className="absolute inset-0 bg-black/70 flex flex-col items-center justify-center z-30 p-4">
              {gameOver ? (
                <div className="text-center">
                  <h3 className="text-2xl sm:text-3xl font-bold mb-4 text-green-300">Congratulations!</h3>
                  <p className="text-lg sm:text-xl mb-2 text-white">You have printed the report!</p>
                  <p className="text-base sm:text-lg mb-2 text-gray-200">Score: {score}</p>
                  <p className="text-base sm:text-lg mb-4 text-gray-200">+{Math.floor(score * 1.5) + (reportsGenerated * 25)} XP earned!</p>
                  <p className="text-sm text-gray-300 italic">The office is saved... for now.</p>
                  <Button 
                    onClick={startGame}
                    className="mt-4 bg-blue-600 hover:bg-blue-700 text-white px-6 py-2"
                  >
                    Play Again
                  </Button>
                </div>
              ) : (
                <div className="text-center">
                  <Printer className="w-12 h-12 sm:w-16 sm:h-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-xl sm:text-2xl font-bold mb-4 text-gray-200">Printer Tantrum</h3>
                  <p className="text-base sm:text-lg mb-2 text-white">Battle the office printer!</p>
                  <p className="text-sm text-gray-300 mb-4">Print the quarterly report to win!</p>
                  <Button 
                    onClick={startGame}
                    className="bg-gray-600 hover:bg-gray-700 text-white px-6 py-2"
                  >
                    Start Printing
                  </Button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Instructions */}
        <div className="mt-4 text-xs sm:text-sm text-black">
          <p>🖨️ Click "Print Report" to attempt printing</p>
          <p>⚠️ When errors occur, click "Fix Printer" rapidly to repair it</p>
          <p>📄 Print the quarterly report to win!</p>
        </div>
      </div>
    </div>
  );
};

export default PrinterTantrum;
