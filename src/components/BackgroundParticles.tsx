
import { useEffect, useRef } from "react";

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

const BackgroundParticles = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>();
  const particlesRef = useRef<Particle[]>([]);

  const createParticles = () => {
    const particles: Particle[] = [];
    for (let i = 0; i < 120; i++) {
      particles.push({
        x: Math.random() * window.innerWidth,
        y: Math.random() * window.innerHeight,
        z: Math.random() * 200,
        vx: (Math.random() - 0.5) * 0.8,
        vy: (Math.random() - 0.5) * 0.8,
        vz: (Math.random() - 0.5) * 0.6,
        size: Math.random() * 12 + 6,
        opacity: Math.random() * 0.6 + 0.4
      });
    }
    particlesRef.current = particles;
  };

  const updateParticles = () => {
    particlesRef.current = particlesRef.current.map(particle => {
      let newX = particle.x + particle.vx;
      let newY = particle.y + particle.vy;
      let newZ = particle.z + particle.vz;

      // Add random movement variations (reduced)
      particle.vx += (Math.random() - 0.5) * 0.05;
      particle.vy += (Math.random() - 0.5) * 0.05;
      particle.vz += (Math.random() - 0.5) * 0.03;

      // Limit velocity to slower movement
      particle.vx = Math.max(-1.5, Math.min(1.5, particle.vx));
      particle.vy = Math.max(-1.5, Math.min(1.5, particle.vy));
      particle.vz = Math.max(-1, Math.min(1, particle.vz));

      // Bounce off walls
      if (newX <= 0 || newX >= window.innerWidth) particle.vx *= -1;
      if (newY <= 0 || newY >= window.innerHeight) particle.vy *= -1;
      if (newZ <= 0 || newZ >= 200) particle.vz *= -1;

      // Keep particles within bounds
      newX = Math.max(0, Math.min(window.innerWidth, newX));
      newY = Math.max(0, Math.min(window.innerHeight, newY));
      newZ = Math.max(0, Math.min(200, newZ));

      return {
        ...particle,
        x: newX,
        y: newY,
        z: newZ
      };
    });
  };

  const drawParticles = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw particles
    particlesRef.current.forEach(particle => {
      // Create 3D effect with z-depth
      const scale = 1 + particle.z / 200;
      const size = particle.size * scale;
      const alpha = particle.opacity * (1 - particle.z / 300);

      ctx.save();
      ctx.globalAlpha = alpha;
      
      // Create gradient for 3D cube effect with light blue colors
      const gradient = ctx.createRadialGradient(
        particle.x, particle.y, 0,
        particle.x, particle.y, size
      );
      gradient.addColorStop(0, `rgba(173, 216, 230, ${alpha})`); // Light blue
      gradient.addColorStop(0.5, `rgba(135, 206, 235, ${alpha})`); // Sky blue
      gradient.addColorStop(1, `rgba(176, 224, 230, ${alpha * 0.3})`); // Powder blue

      ctx.fillStyle = gradient;
      
      // Draw cubic particle
      ctx.fillRect(
        particle.x - size / 2,
        particle.y - size / 2,
        size,
        size
      );
      
      // Add border for cube effect with light blue
      ctx.strokeStyle = `rgba(135, 206, 235, ${alpha * 0.8})`;
      ctx.lineWidth = 0.5;
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
    updateParticles();
    drawParticles();
    animationRef.current = requestAnimationFrame(animate);
  };

  const handleResize = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    createParticles();
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    
    createParticles();
    animate();

    window.addEventListener('resize', handleResize);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none z-0"
      style={{ background: 'transparent' }}
    />
  );
};

export default BackgroundParticles;
