import { useState, useEffect, useCallback, useRef } from "react";
import { Button } from "@/components/ui/button";
import { ArrowLeft, RotateCcw, Mic, MicOff, User, Volume2, VolumeX } from "lucide-react";
import { Progress } from "@/components/ui/progress";

interface MuteThatMicProps {
  onGameComplete: (xp: number) => void;
  onBack: () => void;
}

interface TeamMember {
  id: number;
  name: string;
  avatar: string;
  isSpeaking: boolean;
  isMuted: boolean;
  speakStartTime: number;
  x: number;
  y: number;
}

const MuteThatMic = ({ onGameComplete, onBack }: MuteThatMicProps) => {
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [score, setScore] = useState(0);
  const [cringeLevel, setCringeLevel] = useState(0);
  const [xp, setXp] = useState(0);
  const [gameActive, setGameActive] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [nextMemberId, setNextMemberId] = useState(0);
  const [audioEnabled, setAudioEnabled] = useState(true);
  const animationRef = useRef<number>();
  const lastActivationRef = useRef<number>(0);
  const speakingAudioRef = useRef<HTMLAudioElement | null>(null);
  const [currentSpeakingMember, setCurrentSpeakingMember] = useState<string | null>(null);

  const memberNames = [
    "Pandu", "Raju", "pinkey", "Kamo", "Sunil", "Banti", 
    "Lalu Bhai", "Boss", "Chris", "Maya", "Ben", "Sophie"
  ];

  const avatarImages = [
    '/profile/photo_1_2025-06-25_13-41-42.jpg',
    '/profile/photo_2_2025-06-25_13-41-42.jpg',
    '/profile/photo_3_2025-06-25_13-41-42.jpg',
    '/profile/photo_5_2025-06-25_13-41-42.jpg',
    '/profile/photo_6_2025-06-25_13-41-42.jpg',
    '/profile/photo_7_2025-06-25_13-41-42.jpg',
    '/profile/photo_8_2025-06-25_13-41-42.jpg',
    '/profile/boss.jpg',
  ];

  // Audio functions
  const initializeAudio = () => {
    console.log('Initializing audio...');
    // Preload audio files
    try {
      // Test if files exist by trying to load them
      const testAudio = new Audio();
      testAudio.addEventListener('error', (e) => {
        console.log('Audio file not found or not supported');
      });
      testAudio.addEventListener('canplaythrough', () => {
        console.log('Audio files preloaded successfully');
      });
      
      // Try to load the files
      testAudio.src = '/audio/mic-on.mp3';
      const testMicOff = new Audio('/audio/mic-off.mp3');
    } catch (error) {
      console.log('Audio preload failed:', error);
    }
  };

  const playSound = (audioPath: string, volume: number = 0.5) => {
    if (!audioEnabled) {
      console.log('Audio disabled');
      return;
    }
    console.log('Attempting to play sound:', audioPath);
    
    // Create a simple beep sound as fallback if file doesn't exist
    const createBeepSound = () => {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
      gainNode.gain.setValueAtTime(volume * 0.1, audioContext.currentTime);
      
      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.1);
    };

    try {
      const audio = new Audio(audioPath);
      audio.volume = volume;
      
      audio.addEventListener('error', () => {
        console.log('Audio file failed to load, using fallback beep');
        createBeepSound();
      });
      
      audio.addEventListener('canplaythrough', () => {
        audio.play().catch((error) => {
          console.log('Audio play failed:', error);
          createBeepSound();
        });
      });
      
      audio.load();
    } catch (error) {
      console.log('Audio creation failed, using fallback beep:', error);
      createBeepSound();
    }
  };

  const initializeTeamMembers = useCallback(() => {
    const members: TeamMember[] = [];
    for (let i = 0; i < 8; i++) {
      members.push({
        id: i,
        name: memberNames[i],
        avatar: avatarImages[i],
        isSpeaking: false,
        isMuted: false,
        speakStartTime: 0,
        x: (i % 4) * 22 + 15, // Arrange in 2 rows of 4
        y: Math.floor(i / 4) * 40 + 20
      });
    }
    setTeamMembers(members);
    setNextMemberId(8);
  }, []);

  const activateRandomMember = useCallback(() => {
    if (!gameActive) return;

    const now = Date.now();
    if (now - lastActivationRef.current < 1000) return; // Wait 1s between activations
    lastActivationRef.current = now;

    setTeamMembers(prev => {
      // Only allow a new member to speak if no one is currently speaking
      const someoneSpeaking = prev.some(member => member.isSpeaking && !member.isMuted);
      if (someoneSpeaking) return prev;

      const availableMembers = prev.filter(member => !member.isSpeaking);
      if (availableMembers.length === 0) return prev;

      const randomMember = availableMembers[Math.floor(Math.random() * availableMembers.length)];
      
      // Play mic-on sound when someone starts speaking
      playSound('/audio/mic-on.mp3', 0.4);
      
      return prev.map(member => 
        member.id === randomMember.id 
          ? { ...member, isSpeaking: true, speakStartTime: now, isMuted: false }
          : member
      );
    });
  }, [gameActive]);

  const muteMember = (memberId: number) => {
    const now = Date.now();
    
    setTeamMembers(prev =>
      prev.map(member => {
        if (member.id === memberId && member.isSpeaking) {
          const reactionTime = now - member.speakStartTime;
          const points = Math.max(5, 20 - Math.floor(reactionTime / 100));
          setScore(prevScore => prevScore + points);
          setXp(prevXp => Math.min(100, prevXp + 5));
          // Play mic-off sound when someone is muted
          playSound('/audio/mic-off.mp3', 0.5);
          return { ...member, isSpeaking: false, isMuted: true };
        }
        return member;
      })
    );
  };

  const gameLoop = useCallback(() => {
    if (!gameActive) return;

    const now = Date.now();
    
    // Activate random members
    activateRandomMember();

    // Check for cringe buildup from unmuted speakers
    setTeamMembers(prev => {
      let cringeIncrease = 0;
      const updatedMembers = prev.map(member => {
        if (member.isSpeaking && !member.isMuted) {
          const speakingTime = now - member.speakStartTime;
          if (speakingTime > 3000) { // If speaking for more than 3 seconds
            cringeIncrease += 2;
            return { ...member, isSpeaking: false }; // Auto-stop after timeout
          }
        }
        return member;
      });

      if (cringeIncrease > 0) {
        setCringeLevel(prevCringe => Math.min(100, prevCringe + cringeIncrease));
      }

      return updatedMembers;
    });

    animationRef.current = requestAnimationFrame(gameLoop);
  }, [gameActive, activateRandomMember]);

  const startGame = () => {
    setGameActive(true);
    setGameOver(false);
    setScore(0);
    setCringeLevel(0);
    setXp(0);
    initializeTeamMembers();
    lastActivationRef.current = 0;
  };

  const endGame = useCallback(() => {
    setGameActive(false);
    setGameOver(true);
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
    }
    const earnedXp = Math.floor(score * 2) + Math.max(0, 100 - cringeLevel);
    onGameComplete(earnedXp);
  }, [score, cringeLevel, onGameComplete]);

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
    if (gameActive && (cringeLevel >= 100 || score >= 200)) {
      endGame();
    }
  }, [cringeLevel, score, gameActive, endGame]);

  // Cleanup audio when component unmounts or game is exited
  useEffect(() => {
    return () => {
      if (speakingAudioRef.current) {
        speakingAudioRef.current.pause();
        speakingAudioRef.current.currentTime = 0;
        speakingAudioRef.current = null;
      }
    };
  }, []);

  // Initialize audio when component mounts
  useEffect(() => {
    initializeAudio();
  }, []);

  // Helper to get audio file name for a member
  const getAudioFileForMember = (name: string) => {
    // Map names to file names as per files in /audio
    const nameMap: Record<string, string> = {
      'pandu': 'pandu.mp3',
      'raju': 'Raju.mp3',
      'pinkey': 'pinkey.mp3',
      'kamo': 'kamo.mp3',
      'sunil': 'sunil.mp3',
      'banti': 'banti.mp3',
      'lalu bhai': 'lalu bhai.mp3',
      'boss': 'boss.mp3',
    };
    const key = name.trim().toLowerCase();
    return nameMap[key] ? `/audio/${nameMap[key]}` : undefined;
  };

  // Play member audio when their mic turns on
  useEffect(() => {
    if (!audioEnabled) return;
    // Find the first speaking and unmuted member
    const speakingMember = teamMembers.find(m => m.isSpeaking && !m.isMuted);
    if (speakingMember) {
      const audioFile = getAudioFileForMember(speakingMember.name);
      if (currentSpeakingMember !== speakingMember.name) {
        // Stop any previous audio
        if (speakingAudioRef.current) {
          speakingAudioRef.current.pause();
          speakingAudioRef.current.currentTime = 0;
          speakingAudioRef.current = null;
        }
        if (audioFile) {
          const audio = new Audio(audioFile);
          audio.volume = 0.7;
          audio.loop = true; // Loop the audio while speaking
          audio.addEventListener('canplaythrough', () => {
            console.log(`Audio loaded: ${audioFile}`);
          });
          audio.addEventListener('error', (e) => {
            console.error(`Audio failed to load: ${audioFile}`, e);
          });
          audio.play().catch((err) => {
            console.error(`Audio play failed for ${audioFile}:`, err);
          });
          speakingAudioRef.current = audio;
          setCurrentSpeakingMember(speakingMember.name);
        }
      }
    } else {
      // No one is speaking, stop audio
      if (speakingAudioRef.current) {
        speakingAudioRef.current.pause();
        speakingAudioRef.current.currentTime = 0;
        speakingAudioRef.current = null;
      }
      if (currentSpeakingMember !== null) {
        setCurrentSpeakingMember(null);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [teamMembers, audioEnabled]);

  return (
    <div className="text-center text-white min-h-screen px-4">
      <div className="flex flex-col sm:flex-row justify-between items-center mb-4 sm:mb-6 gap-4">
        <h2 className="text-2xl sm:text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-600 text-center w-full">Mute That Mic</h2>
        
        <div className="flex gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              console.log('Testing audio...');
              playSound('/audio/mic-on.mp3', 0.5);
            }}
            className="text-white hover:bg-white/20"
          >
            🔊
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setAudioEnabled(!audioEnabled)}
            className="text-white hover:bg-white/20"
          >
            {audioEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
          </Button>
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
      </div>

      <div className="bg-indigo-500/20 backdrop-blur-sm rounded-2xl p-4 sm:p-6 max-w-4xl mx-auto border border-indigo-300/30">
        {/* Game Stats */}
        <div className="flex flex-col sm:flex-row justify-between items-center mb-4 gap-4">
          <div className="text-center sm:text-left">
            <p className="text-lg font-semibold text-black">Mutes: {score}</p>
          </div>
          <div className="flex-1 mx-0 sm:mx-6 w-full sm:w-auto">
            <p className="text-sm mb-2 text-black">XP Progress</p>
            <Progress 
              value={xp} 
              className="h-3 bg-white/20"
            />
          </div>
          <div className="text-center sm:text-right">
            <p className="text-sm text-black">Mute them quick!</p>
            <p className="text-xs text-black">Before it gets awkward!</p>
          </div>
        </div>

        {/* Game Area */}
        <div className="relative w-full h-64 sm:h-96 bg-gradient-to-b from-gray-900/50 to-indigo-900/30 rounded-xl border-2 border-indigo-300/50 overflow-hidden">
          {/* Team Members Grid */}
          {teamMembers.map(member => (
            <div
              key={member.id}
              className="absolute transition-all duration-200"
              style={{
                left: `${member.x}%`,
                top: `${member.y}%`,
                transform: 'translate(-50%, -50%)'
              }}
            >
              <div 
                className={`relative p-2 sm:p-4 rounded-xl border-2 transition-all duration-300 cursor-pointer ${
                  member.isSpeaking 
                    ? 'border-red-400 bg-red-500/30 animate-pulse scale-110' 
                    : member.isMuted 
                    ? 'border-green-400 bg-green-500/30' 
                    : 'border-gray-400 bg-gray-500/20'
                }`}
                onClick={() => member.isSpeaking && muteMember(member.id)}
              >
                {/* Avatar */}
                <div className="w-8 h-8 sm:w-12 sm:h-12 rounded-full overflow-hidden mb-1 sm:mb-2 mx-auto flex items-center justify-center bg-gray-200">
                  <img src={member.avatar} alt={member.name} className="w-8 h-8 sm:w-12 sm:h-12 object-cover" />
                </div>
                
                {/* Name */}
                <p className="text-xs text-white font-medium mb-1 sm:mb-2">{member.name}</p>
                
                {/* Mic Status */}
                <div className="flex justify-center">
                  {member.isSpeaking ? (
                    <Mic className="w-3 h-3 sm:w-4 sm:h-4 text-red-400 animate-bounce" />
                  ) : member.isMuted ? (
                    <MicOff className="w-3 h-3 sm:w-4 sm:h-4 text-green-400" />
                  ) : (
                    <MicOff className="w-3 h-3 sm:w-4 sm:h-4 text-gray-400" />
                  )}
                </div>
                
                {/* Speaking indicator */}
                {member.isSpeaking && (
                  <div className="absolute -top-1 -right-1 sm:-top-2 sm:-right-2 w-3 h-3 sm:w-4 sm:h-4 bg-red-500 rounded-full animate-ping"></div>
                )}
              </div>
            </div>
          ))}

          {/* Game Over/Start Overlay */}
          {(!gameActive || gameOver) && (
            <div className="absolute inset-0 bg-black/70 flex flex-col items-center justify-center z-30 p-4">
              {gameOver ? (
                <div className="text-center">
                  <h3 className="text-2xl sm:text-3xl font-bold mb-4 text-indigo-200">
                    {cringeLevel >= 100 ? "Meeting Disaster!" : "Mute Legend!"}
                  </h3>
                  <p className="text-lg sm:text-xl mb-2 text-white">
                    Quick Mutes: {score}
                  </p>
                  <p className="text-base sm:text-lg mb-4 text-indigo-200">
                    +{Math.floor(score * 2) + Math.max(0, 100 - cringeLevel)} XP earned!
                  </p>
                  <p className="text-sm text-indigo-300 italic mb-4">
                    {cringeLevel < 50 ? "You saved the call. Mute legend." : "Practice your muting skills!"}
                  </p>
                  <Button 
                    onClick={startGame}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2 mt-2"
                  >
                    Play Again
                  </Button>
                </div>
              ) : (
                <div className="text-center">
                  <Mic className="w-12 h-12 sm:w-16 sm:h-16 text-indigo-400 mx-auto mb-4" />
                  <h3 className="text-xl sm:text-2xl font-bold mb-4 text-indigo-200">Mute That Mic</h3>
                  <p className="text-base sm:text-lg mb-2 text-white">Mute team members before they get awkward!</p>
                  <p className="text-sm text-indigo-300 mb-4">Click on speaking members to mute them quickly!</p>
                  <div className="flex gap-2 justify-center">
                    <Button 
                      onClick={startGame}
                      className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2"
                    >
                      Join Meeting
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Instructions */}
        <div className="mt-4 text-xs sm:text-sm text-black">
          <p>🎤 Click on speaking team members (red glow) to mute them</p>
          <p>⚠️ Letting them speak too long increases the cringe level!</p>
        </div>
      </div>
    </div>
  );
};

export default MuteThatMic;
