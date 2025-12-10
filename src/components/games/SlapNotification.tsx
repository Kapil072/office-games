import { useState, useEffect, useCallback, useRef } from "react";
import { Button } from "@/components/ui/button";
import { ArrowLeft, RotateCcw, Mail, MessageSquare, Phone } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { BubbleBlast } from "./BubbleBlast";

interface SlapNotificationProps {
  onGameComplete: (xp: number) => void;
  onBack: () => void;
}

interface FallingNotification {
  id: number;
  x: number;
  y: number;
  type: 'email' | 'slack' | 'whatsapp';
  speed: number;
  splatted: boolean;
}

const ICON_SIZE = 48; // px, icon size for clamping

const SlapNotification = ({ onGameComplete, onBack }: SlapNotificationProps) => {
  const [notifications, setNotifications] = useState<FallingNotification[]>([]);
  const [score, setScore] = useState(0);
  const [burnoutLevel, setBurnoutLevel] = useState(0);
  const [gameActive, setGameActive] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [nextNotificationId, setNextNotificationId] = useState(0);
  const gameAreaRef = useRef<HTMLDivElement>(null);
  const animationRef = useRef<number>();
  const lastSpawnRef = useRef<number>(0);
  const [blasts, setBlasts] = useState<{ x: number; y: number; id: number }[]>([]);
  const [recentMessages, setRecentMessages] = useState<string[]>([]);

  const notificationTypes = [
    { type: 'email' as const, message: 'Hiiiii 😄', color: 'text-red-500', bgColor: 'bg-red-500/20' },
    { type: 'slack' as const, message: 'Hey There', color: 'text-purple-500', bgColor: 'bg-purple-500/20' },
    { type: 'whatsapp' as const, message: 'क्या हाल?', color: 'text-green-500', bgColor: 'bg-green-500/20' },
    { type: 'email' as const, message: 'Hello Ji', color: 'text-red-500', bgColor: 'bg-red-500/20' },
    { type: 'slack' as const, message: 'नमस्ते 🙏', color: 'text-purple-500', bgColor: 'bg-purple-500/20' },
    { type: 'whatsapp' as const, message: 'Yo Bro', color: 'text-green-500', bgColor: 'bg-green-500/20' },
    { type: 'email' as const, message: 'Salaam Dost', color: 'text-red-500', bgColor: 'bg-red-500/20' },
    { type: 'slack' as const, message: 'Hy Buddy', color: 'text-purple-500', bgColor: 'bg-purple-500/20' },
    { type: 'whatsapp' as const, message: 'Stay Blessed 🙌', color: 'text-green-500', bgColor: 'bg-green-500/20' },
    { type: 'email' as const, message: 'Keep Smiling 🙂', color: 'text-red-500', bgColor: 'bg-red-500/20' },
    { type: 'slack' as const, message: 'Shine Bright', color: 'text-purple-500', bgColor: 'bg-purple-500/20' },
    { type: 'whatsapp' as const, message: 'दिल खुश', color: 'text-green-500', bgColor: 'bg-green-500/20' },
    { type: 'email' as const, message: 'Win Today', color: 'text-red-500', bgColor: 'bg-red-500/20' },
    { type: 'slack' as const, message: 'Try Again', color: 'text-purple-500', bgColor: 'bg-purple-500/20' },
    { type: 'whatsapp' as const, message: 'Smile Please 😁', color: 'text-green-500', bgColor: 'bg-green-500/20' },
    { type: 'email' as const, message: 'मेहनत करो', color: 'text-red-500', bgColor: 'bg-red-500/20' },
    { type: 'slack' as const, message: 'Be Strong 💪', color: 'text-purple-500', bgColor: 'bg-purple-500/20' },
    { type: 'whatsapp' as const, message: 'Believe Yourself', color: 'text-green-500', bgColor: 'bg-green-500/20' },
    { type: 'email' as const, message: 'Good Morning 🌞', color: 'text-red-500', bgColor: 'bg-red-500/20' },
    { type: 'slack' as const, message: 'सुप्रभात 🌅', color: 'text-purple-500', bgColor: 'bg-purple-500/20' },
    { type: 'whatsapp' as const, message: 'Morning Vibes', color: 'text-green-500', bgColor: 'bg-green-500/20' },
    { type: 'email' as const, message: 'Rise Up ☀️', color: 'text-red-500', bgColor: 'bg-red-500/20' },
    { type: 'slack' as const, message: 'जागो दोस्त', color: 'text-purple-500', bgColor: 'bg-purple-500/20' },
    { type: 'whatsapp' as const, message: 'Hello Morning', color: 'text-green-500', bgColor: 'bg-green-500/20' },
    { type: 'email' as const, message: 'New Day', color: 'text-red-500', bgColor: 'bg-red-500/20' },
    { type: 'slack' as const, message: 'शुभ दिन', color: 'text-purple-500', bgColor: 'bg-purple-500/20' },
    { type: 'whatsapp' as const, message: 'Bright Morning ✨', color: 'text-green-500', bgColor: 'bg-green-500/20' },
    { type: 'email' as const, message: 'Start Fresh', color: 'text-red-500', bgColor: 'bg-red-500/20' },
    { type: 'slack' as const, message: 'क्या बोलें', color: 'text-purple-500', bgColor: 'bg-purple-500/20' }
  ];

  const spawnNotification = useCallback(() => {
    if (!gameActive) return;

    const now = Date.now();
    if (now - lastSpawnRef.current < 1200) return; // Spawn every 1.2s
    lastSpawnRef.current = now;

    // Random x and y between 0% and 100%
    const x = Math.random() * 100;
    const y = Math.random() * 100;
    
    // Pick any message randomly, ignore type/preference
    const randomIndex = Math.floor(Math.random() * notificationTypes.length);
    const randomType = notificationTypes[randomIndex];
    
    const id = nextNotificationId;
    const newNotification = {
      id,
      x,
      y,
      type: 'email', // type is not used for display anymore
      speed: 0, // No falling
      splatted: false,
      message: randomType.message,
      color: randomType.color,
      bgColor: randomType.bgColor
    };

    setNotifications(prev => [...prev, newNotification]);
    setNextNotificationId(prev => prev + 1);

    // Remove notification after 3 seconds if not splatted
    setTimeout(() => {
      setNotifications(prev => {
        const found = prev.find(n => n.id === id && !n.splatted);
        if (found) {
          setBurnoutLevel(burnout => Math.min(100, burnout + 5));
        }
        return prev.filter(n => n.id !== id);
      });
    }, 3000);
  }, [gameActive, nextNotificationId, notificationTypes]);

  const playBubblePop = () => {
    const audio = new Audio('/audio/bubble pop.mp3');
    audio.volume = 0.7;
    audio.play();
  };

  const slapNotification = (notificationId: number) => {
    setNotifications(prev =>
      prev.map(notification =>
        notification.id === notificationId
          ? { ...notification, splatted: true }
          : notification
      )
    );
    setScore(prev => prev + 10);
    setBurnoutLevel(prev => Math.max(0, prev - 3)); // Decrease burnout by 3%
    // Find the notification's position
    const notif = notifications.find(n => n.id === notificationId);
    if (notif) {
      setBlasts(blasts => [
        ...blasts,
        { x: notif.x, y: notif.y, id: notificationId }
      ]);
      playBubblePop();
    }
    // Remove splatted notification after animation (e.g., 400ms)
    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== notificationId));
    }, 400);
  };

  const gameLoop = useCallback(() => {
    if (!gameActive) return;

    spawnNotification();

    setNotifications(prev => {
      const updatedNotifications = prev.map(notification => ({
        ...notification,
        y: notification.y + notification.speed
      }));

      // Debug: log y values
      if (updatedNotifications.length > 0) {
        console.log('Notification y values:', updatedNotifications.map(n => n.y));
      }

      // Check for off-screen and filter notifications
      const remainingNotifications: FallingNotification[] = [];
      let burnoutIncrease = 0;

      updatedNotifications.forEach(notification => {
        if (notification.splatted) {
          // Do not keep splatted notifications (handled by timeout)
        } else if (notification.y > 100) {
          // Notification fell off screen - increase burnout
          burnoutIncrease += 8;
        } else {
          // Keep notification on screen
          remainingNotifications.push(notification);
        }
      });

      if (burnoutIncrease > 0) {
        setBurnoutLevel(prev => Math.min(100, prev + burnoutIncrease));
      }

      return remainingNotifications;
    });

    animationRef.current = requestAnimationFrame(gameLoop);
  }, [gameActive, spawnNotification]);

  const startGame = () => {
    setGameActive(true);
    setGameOver(false);
    setScore(0);
    setBurnoutLevel(0);
    setNotifications([]);
    setNextNotificationId(0);
    lastSpawnRef.current = 0;
    setRecentMessages([]); // Reset recent messages
  };

  const endGame = useCallback(() => {
    setGameActive(false);
    setGameOver(true);
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
    }
    const earnedXp = Math.floor(score * 1.5) + Math.max(0, 100 - burnoutLevel);
    onGameComplete(earnedXp);
  }, [score, burnoutLevel, onGameComplete]);

  // Game loop effect
  useEffect(() => {
    if (gameActive) {
      animationRef.current = requestAnimationFrame(gameLoop);
    }
    
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [gameActive, gameLoop]);

  // Check game over conditions
  useEffect(() => {
    if (gameActive && (burnoutLevel >= 100 || score >= 300)) {
      endGame();
    }
  }, [burnoutLevel, score, gameActive, endGame]);

  const getNotificationIcon = (type: string) => {
    const notificationType = notificationTypes.find(n => n.type === type);
    return notificationType || notificationTypes[0];
  };

  return (
    <div className="text-center text-white min-h-screen px-4">
      <div className="flex flex-col sm:flex-row justify-between items-center mb-4 sm:mb-6 gap-4">
        <h2 className="text-2xl sm:text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-red-400 to-orange-600 text-center w-full">Slap the Notification</h2>
        
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

      <div className="bg-red-500/20 backdrop-blur-sm rounded-2xl p-4 sm:p-6 max-w-4xl mx-auto border border-red-300/30">
        {/* Game Stats */}
        <div className="flex flex-col sm:flex-row justify-between items-center mb-4 gap-4">
          <div className="text-center sm:text-left">
            <p className="text-lg font-semibold text-black">Slapped: {score}</p>
          </div>
          <div className="flex-1 mx-0 sm:mx-6 w-full sm:w-auto">
            <p className="text-sm mb-2 text-black">Burnout Level</p>
            <Progress 
              value={burnoutLevel} 
              className="h-3 bg-white/20"
            />
          </div>
          <div className="text-center sm:text-right">
            <p className="text-sm text-black">Slap the notifications!</p>
            <p className="text-xs text-black">Don't let them pile up!</p>
          </div>
        </div>

        {/* Game Area */}
        <div 
          ref={gameAreaRef}
          className="relative w-full h-64 sm:h-96 bg-gradient-to-b from-gray-900/50 to-red-900/30 rounded-xl border border-red-300/50 overflow-hidden"
          style={{ userSelect: 'none' }}
        >
          {/* Bubble Blasts */}
          {blasts.map(blast => (
            <BubbleBlast
              key={blast.id}
              x={`${blast.x}%`}
              y={`${blast.y}%`}
              onEnd={() => setBlasts(blasts => blasts.filter(b => b.id !== blast.id))}
            />
          ))}
          {/* Falling Notifications */}
          {notifications.map(notification => {
            return (
              <div
                key={notification.id}
                className={`absolute transition-all duration-200 select-none ${
                  notification.splatted 
                    ? 'animate-ping opacity-50 scale-150' 
                    : 'cursor-pointer hover:scale-110'
                }`}
                style={{
                  left: `${notification.x}%`,
                  top: `${notification.y}%`,
                  transform: 'translate(-50%, -50%)',
                }}
                onClick={() => !notification.splatted && slapNotification(notification.id)}
              >
                <div className={`px-4 py-2 rounded-lg bg-white shadow text-center`}>
                  <p className={`text-sm font-medium text-black whitespace-nowrap`}>
                    {notification.message}
                  </p>
                </div>
              </div>
            );
          })}

          {/* Game Over/Start Overlay */}
          {(!gameActive || gameOver) && (
            <div className="fixed inset-0 bg-black/70 flex flex-col items-center justify-center z-30">
              {gameOver ? (
                <div className="text-center">
                  <h3 className="text-3xl font-bold mb-4 text-red-200">
                    {burnoutLevel >= 100 ? "Notification Overload!" : "Deep Work Unlocked!"}
                  </h3>
                  <p className="text-xl mb-2 text-white">
                    Notifications Slapped: {score}
                  </p>
                  <p className="text-lg mb-4 text-red-200">
                    +{Math.floor(score * 1.5) + Math.max(0, 100 - burnoutLevel)} XP earned!
                  </p>
                  <p className="text-sm text-red-300 italic mb-4">
                    {burnoutLevel < 50 ? "You muted the noise. Deep work unlocked." : "Try to slap faster next time!"}
                  </p>
                  <Button 
                    onClick={startGame}
                    className="mt-2 bg-red-600 hover:bg-red-700 text-white px-6 py-2"
                  >
                    Play Again
                  </Button>
                </div>
              ) : (
                <div className="text-center">
                  <Mail className="w-16 h-16 text-red-400 mx-auto mb-4" />
                  <h3 className="text-2xl font-bold mb-4 text-red-200">Slap the Notification</h3>
                  <p className="text-lg mb-2 text-white">Slap away falling notifications!</p>
                  <p className="text-sm text-red-300 mb-4">Don't let them overwhelm you!</p>
                  <Button 
                    onClick={startGame}
                    className="mt-4 bg-red-600 hover:bg-red-700 text-white px-6 py-2"
                  >
                    Start Slapping
                  </Button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Instructions */}
        <div className="mt-4 text-sm text-black">
          <p>💥 Click/tap on notifications to slap them away</p>
          <p>⚠️ Missing notifications increases your burnout level!</p>
        </div>
      </div>
    </div>
  );
};

export default SlapNotification;
