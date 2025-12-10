import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Play, Pause } from "lucide-react";

interface ParticleVisualizerProps {
  onGameComplete: (xp: number) => void;
  onBack: () => void;
}

interface Particle {
  x: number;
  y: number;
  z: number;
  vx: number;
  vy: number;
  vz: number;
  size: number;
  opacity: number;
}

const ParticleVisualizer = ({ onGameComplete, onBack }: ParticleVisualizerProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>();
  const [isPlaying, setIsPlaying] = useState(true);
  const [particles, setParticles] = useState<Particle[]>([]);
  const [particleCount, setParticleCount] = useState(100);

  const createParticles = (count: number) => {
    const newParticles: Particle[] = [];
    for (let i = 0; i < count; i++) {
      newParticles.push({
        x: Math.random() * 800,
        y: Math.random() * 600,
        z: Math.random() * 200,
        vx: (Math.random() - 0.5) * 2,
        vy: (Math.random() - 0.5) * 2,
        vz: (Math.random() - 0.5) * 2,
        size: Math.random() * 8 + 2,
        opacity: Math.random() * 0.8 + 0.2
      });
    }
    setParticles(newParticles);
  };

  const updateParticles = () => {
    setParticles(prevParticles => 
      prevParticles.map(particle => {
        let newX = particle.x + particle.vx;
        let newY = particle.y + particle.vy;
        let newZ = particle.z + particle.vz;

        // Bounce off walls
        if (newX <= 0 || newX >= 800) particle.vx *= -1;
        if (newY <= 0 || newY >= 600) particle.vy *= -1;
        if (newZ <= 0 || newZ >= 200) particle.vz *= -1;

        // Keep particles within bounds
        newX = Math.max(0, Math.min(800, newX));
        newY = Math.max(0, Math.min(600, newY));
        newZ = Math.max(0, Math.min(200, newZ));

        return {
          ...particle,
          x: newX,
          y: newY,
          z: newZ
        };
      })
    );
  };

  const drawParticles = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas with white background
    ctx.fillStyle = 'white';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw particles
    particles.forEach(particle => {
      // Create 3D effect with z-depth
      const scale = 1 + particle.z / 200;
      const size = particle.size * scale;
      const alpha = particle.opacity * (1 - particle.z / 300);

      ctx.save();
      ctx.globalAlpha = alpha;
      
      // Create gradient for 3D cube effect
      const gradient = ctx.createRadialGradient(
        particle.x, particle.y, 0,
        particle.x, particle.y, size
      );
      gradient.addColorStop(0, `rgba(59, 130, 246, ${alpha})`); // Blue center
      gradient.addColorStop(0.5, `rgba(29, 78, 216, ${alpha})`); // Darker blue
      gradient.addColorStop(1, `rgba(37, 99, 235, ${alpha * 0.3})`); // Light blue edge

      ctx.fillStyle = gradient;
      
      // Draw cubic particle
      ctx.fillRect(
        particle.x - size / 2,
        particle.y - size / 2,
        size,
        size
      );
      
      // Add border for cube effect
      ctx.strokeStyle = `rgba(29, 78, 216, ${alpha * 0.8})`;
      ctx.lineWidth = 1;
      ctx.strokeRect(
        particle.x - size / 2,
        particle.y - size / 2,
        size,
        size
      );
      
      ctx.restore();
    });
  };

  const animate = () => {
    if (isPlaying) {
      updateParticles();
      drawParticles();
    }
    animationRef.current = requestAnimationFrame(animate);
  };

  useEffect(() => {
    createParticles(particleCount);
  }, [particleCount]);

  useEffect(() => {
    animate();
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [isPlaying, particles]);

  const toggleAnimation = () => {
    setIsPlaying(!isPlaying);
  };

  const resetParticles = () => {
    createParticles(particleCount);
    onGameComplete(10); // Award 10 XP for interacting
  };

  return (
    <div className="text-center text-white">
      <div className="flex justify-between items-center mb-8">
        <h2 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-600 text-center w-full">
          Particle Cloud
        </h2>
        
        <div className="flex gap-2">
          <Button
            variant="ghost"
            size="lg"
            onClick={toggleAnimation}
            className="text-white hover:bg-white/20"
          >
            {isPlaying ? <Pause className="w-6 h-6" /> : <Play className="w-6 h-6" />}
          </Button>
          <Button
            variant="ghost"
            size="lg"
            onClick={resetParticles}
            className="text-white hover:bg-white/20"
          >
            Reset
          </Button>
        </div>
      </div>

      <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 max-w-4xl mx-auto">
        <canvas
          ref={canvasRef}
          width={800}
          height={600}
          className="border-2 border-white/20 rounded-lg bg-white shadow-2xl"
        />
        
        <div className="mt-6 flex justify-center items-center gap-4">
          <label className="text-white">
            Particles: 
            <input
              type="range"
              min="50"
              max="300"
              value={particleCount}
              onChange={(e) => setParticleCount(Number(e.target.value))}
              className="ml-2 accent-blue-500"
            />
            <span className="ml-2">{particleCount}</span>
          </label>
        </div>
        
        <p className="text-sm opacity-75 mt-4">
          Watch the blue cubic particles move randomly in 3D space. Use controls to pause or reset.
        </p>
      </div>
    </div>
  );
};

export default ParticleVisualizer;
