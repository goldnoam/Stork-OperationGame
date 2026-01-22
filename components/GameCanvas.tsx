import React, { useRef, useEffect, useState } from 'react';
import { Baby, Stork, FloatingScore, PowerUp, ActiveEffect, PowerUpType, CaughtBaby, BabyMood, GameSettings, Language } from '../types';
import { translations } from '../translations';

interface GameCanvasProps {
  level: number;
  isPaused: boolean;
  onSaveBaby: (points: number) => void;
  onMiss: () => void;
  onEffectsChange: (effects: ActiveEffect[]) => void;
  settings: GameSettings;
  lang: Language;
}

const EFFECT_DURATION = 8000; // 8 seconds
const CATCH_ANIM_DURATION = 500; // 500ms

const GameCanvas: React.FC<GameCanvasProps> = ({ level, isPaused, onSaveBaby, onMiss, onEffectsChange, settings, lang }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [basketX, setBasketX] = useState(window.innerWidth / 2);
  const basketWidth = 140;
  const basketHeight = 60;
  const t = translations[lang];
  
  const babiesRef = useRef<Baby[]>([]);
  const caughtBabiesRef = useRef<CaughtBaby[]>([]);
  const storksRef = useRef<Stork[]>([]);
  const powerUpsRef = useRef<PowerUp[]>([]);
  const activeEffectsRef = useRef<ActiveEffect[]>([]);
  const floatingScoresRef = useRef<FloatingScore[]>([]);
  const nextId = useRef(0);
  const nextScoreId = useRef(0);

  useEffect(() => {
    const storkCount = Math.min(2 + Math.floor(level / 2), 6);
    const newStorks: Stork[] = [];
    for (let i = 0; i < storkCount; i++) {
      newStorks.push({
        id: i,
        x: Math.random() * window.innerWidth,
        y: 50 + Math.random() * 50,
        direction: Math.random() > 0.5 ? 1 : -1,
        nextDropTime: Date.now() + Math.random() * 2000
      });
    }
    storksRef.current = newStorks;
    activeEffectsRef.current = [];
    onEffectsChange([]);
    babiesRef.current = [];
    caughtBabiesRef.current = [];
  }, [level, onEffectsChange]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationId: number;

    const handleMouseMove = (e: MouseEvent) => {
      if (isPaused) return;
      setBasketX(e.clientX);
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (isPaused) return;
      if (e.touches[0]) {
        setBasketX(e.touches[0].clientX);
      }
    };

    const handleMobileMove = (e: any) => {
      if (isPaused) return;
      setBasketX(prev => Math.max(70, Math.min(canvas.width - 70, prev + e.detail)));
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('touchmove', handleTouchMove);
    window.addEventListener('move-basket', handleMobileMove as EventListener);

    const update = () => {
      if (isPaused) return;
      const now = Date.now();
      
      const beforeFilterCount = activeEffectsRef.current.length;
      activeEffectsRef.current = activeEffectsRef.current.filter(e => e.endTime > now);
      
      if (activeEffectsRef.current.length !== beforeFilterCount) {
        onEffectsChange([...activeEffectsRef.current]);
      }

      const isSlowMo = activeEffectsRef.current.some(e => e.type === 'slow_mo');
      const isMagnet = activeEffectsRef.current.some(e => e.type === 'magnet');

      const baseGravity = 0.5 + (level * 0.15);
      const gravity = isSlowMo ? baseGravity * 0.4 : baseGravity;

      storksRef.current.forEach(stork => {
        const storkSpeed = (2 + level * 0.5) * (isSlowMo ? 0.6 : 1);
        stork.x += stork.direction * storkSpeed;
        if (stork.x < 0 || stork.x > canvas.width) stork.direction *= -1;

        if (now > stork.nextDropTime) {
          const dropTypeChance = Math.random();
          if (dropTypeChance > 0.96) {
            const type: PowerUpType = Math.random() > 0.5 ? 'slow_mo' : 'magnet';
            powerUpsRef.current.push({
              id: nextId.current++,
              x: stork.x,
              y: stork.y + 20,
              type,
              speed: gravity * 1.5,
              size: 25,
              rotation: 0
            });
          } else {
            const babyTypeChance = Math.random();
            let type: Baby['type'] = 'standard';
            if (babyTypeChance > 0.95) type = 'golden';
            else if (babyTypeChance > 0.8) type = 'speedy';

            babiesRef.current.push({
              id: nextId.current++,
              x: stork.x,
              y: stork.y + 20,
              birthTime: now,
              speed: (type === 'speedy' ? gravity * 2.2 : gravity) + Math.random() * 0.5,
              size: type === 'golden' ? 22 : 30,
              rotation: 0,
              type,
              mood: type === 'speedy' ? 'surprised' : 'happy'
            });
          }
          stork.nextDropTime = now + (2000 / (1 + level * 0.2)) + Math.random() * 2000;
        }
      });

      babiesRef.current = babiesRef.current.filter(baby => {
        const elapsed = now - baby.birthTime;
        baby.y += baby.speed;
        
        if (baby.y > canvas.height * 0.75 && baby.mood !== 'joyful') {
          baby.mood = 'worried';
        }

        if (isMagnet) {
          const dx = basketX - baby.x;
          baby.x += dx * 0.08;
        } else {
          const swayFreq = baby.type === 'speedy' ? 0.01 : 0.005;
          const swayAmp = baby.type === 'speedy' ? 3.0 : 1.8;
          baby.x += Math.sin(elapsed * swayFreq) * swayAmp;
        }

        baby.rotation = Math.sin(elapsed * 0.008) * 0.4;

        const basketTop = canvas.height - basketHeight - 20;
        const babyCollisionZone = baby.y + (baby.size * 0.5); 
        const isWithinHorizontalBounds = 
            baby.x > basketX - (basketWidth / 2) - (baby.size * 0.3) && 
            baby.x < basketX + (basketWidth / 2) + (baby.size * 0.3);
        
        if (
          isWithinHorizontalBounds &&
          babyCollisionZone > basketTop &&
          baby.y < canvas.height - 20
        ) {
          const points = baby.type === 'golden' ? 50 : baby.type === 'speedy' ? 30 : 10;
          const color = baby.type === 'golden' ? '#FACC15' : baby.type === 'speedy' ? '#EC4899' : '#3B82F6';
          
          floatingScoresRef.current.push({
            id: nextScoreId.current++,
            x: baby.x,
            y: basketTop - 30,
            text: `${t.saved} +${points}`,
            color: color,
            opacity: 1,
            life: 80
          });
          
          caughtBabiesRef.current.push({
            ...baby,
            mood: 'joyful',
            catchTime: now,
            startPosX: baby.x,
            startPosY: baby.y,
            targetX: basketX,
            targetY: basketTop + basketHeight / 2
          });

          onSaveBaby(points);
          return false;
        }

        if (baby.y > canvas.height) {
          onMiss();
          return false;
        }
        return true;
      });

      caughtBabiesRef.current = caughtBabiesRef.current.filter(cb => {
        const elapsed = now - cb.catchTime;
        const progress = Math.min(elapsed / CATCH_ANIM_DURATION, 1);
        const flyProgress = 1 - Math.pow(1 - progress, 3);
        
        cb.x = cb.startPosX + (basketX - cb.startPosX) * flyProgress;
        cb.y = cb.startPosY + ((canvas.height - basketHeight - 35) - cb.startPosY) * flyProgress;
        
        cb.size = (cb.type === 'golden' ? 22 : 30);
        if (progress > 0.7) {
          const bounceFactor = Math.sin((progress - 0.7) * Math.PI * 6.6) * 6;
          cb.size += bounceFactor;
        }

        return progress < 1;
      });

      powerUpsRef.current = powerUpsRef.current.filter(pu => {
        pu.y += pu.speed;
        pu.rotation += 0.05;
        const basketTop = canvas.height - basketHeight - 20;
        if (
          pu.x > basketX - basketWidth / 2 &&
          pu.x < basketX + basketWidth / 2 &&
          pu.y + pu.size > basketTop &&
          pu.y < canvas.height - 20
        ) {
          const existing = activeEffectsRef.current.find(e => e.type === pu.type);
          if (existing) {
             existing.endTime = now + EFFECT_DURATION;
          } else {
             activeEffectsRef.current.push({ type: pu.type, startTime: now, endTime: now + EFFECT_DURATION });
          }
          
          onEffectsChange([...activeEffectsRef.current]);

          floatingScoresRef.current.push({
            id: nextScoreId.current++,
            x: pu.x,
            y: basketTop,
            text: pu.type === 'slow_mo' ? 'SLOW-MO ⏳' : 'MAGNET 🧲',
            color: '#A855F7',
            opacity: 1,
            life: 100
          });
          return false;
        }
        return pu.y < canvas.height;
      });

      floatingScoresRef.current = floatingScoresRef.current.filter(fs => {
        fs.y -= 1.4; fs.life -= 1; fs.opacity = Math.min(1, fs.life / 25);
        return fs.life > 0;
      });
    };

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const now = Date.now();
      const isSlowMo = activeEffectsRef.current.some(e => e.type === 'slow_mo');
      const isMagnet = activeEffectsRef.current.some(e => e.type === 'magnet');

      // Visual Border Indicators
      if (isSlowMo || isMagnet) {
        const pulse = (Math.sin(now * 0.005) + 1) / 2;
        const borderThickness = 8 + pulse * 12;
        
        if (isSlowMo) {
          ctx.strokeStyle = `rgba(59, 130, 246, ${0.2 + pulse * 0.3})`;
          ctx.lineWidth = borderThickness;
          ctx.strokeRect(0, 0, canvas.width, canvas.height);
        }
        if (isMagnet) {
          ctx.strokeStyle = `rgba(168, 85, 247, ${0.2 + pulse * 0.3})`;
          ctx.lineWidth = borderThickness;
          ctx.strokeRect(borderThickness, borderThickness, canvas.width - borderThickness*2, canvas.height - borderThickness*2);
        }
      }

      storksRef.current.forEach(stork => {
        ctx.save();
        ctx.translate(stork.x, stork.y);
        if (stork.direction === -1) ctx.scale(-1, 1);
        ctx.fillStyle = '#FFFFFF';
        ctx.beginPath(); ctx.ellipse(0, 0, 30, 15, 0, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.moveTo(25, 0); ctx.quadraticCurveTo(45, -10, 40, -30);
        ctx.lineWidth = 8; ctx.strokeStyle = '#FFFFFF'; ctx.stroke();
        ctx.fillStyle = '#FFFFFF';
        ctx.beginPath(); ctx.arc(40, -30, 10, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#FB923C';
        ctx.beginPath(); ctx.moveTo(48, -32); ctx.lineTo(70, -30); ctx.lineTo(48, -28); ctx.closePath(); ctx.fill();
        ctx.fillStyle = '#000'; ctx.beginPath(); ctx.arc(44, -33, 2, 0, Math.PI * 2); ctx.fill();
        ctx.restore();
      });

      const renderBaby = (baby: Baby, extraOpacity = 1) => {
        ctx.save();
        ctx.translate(baby.x, baby.y);
        ctx.rotate(baby.rotation);
        ctx.globalAlpha *= extraOpacity;
        
        const speedStretch = 1 + (baby.speed * 0.045);
        const breathScale = 1 + Math.sin((now - baby.birthTime) * 0.012) * 0.06;
        ctx.scale(breathScale / (speedStretch * 0.8), speedStretch * breathScale);

        const isGolden = baby.type === 'golden';
        const mainColor = isGolden ? '#FDE047' : baby.type === 'speedy' ? '#F472B6' : '#93C5FD';

        if (isGolden) {
          const shimmer = (Math.sin(now * 0.015) + 1) / 2;
          ctx.shadowBlur = 12 + shimmer * 28;
          ctx.shadowColor = `rgba(250, 204, 21, ${0.45 + shimmer * 0.55})`;
          
          for (let i = 0; i < 4; i++) {
              const sparkAngle = now * 0.004 + (i * Math.PI / 2);
              const sparkR = baby.size * (1.2 + Math.sin(now * 0.01 + i) * 0.3);
              ctx.fillStyle = '#FFFFFF';
              ctx.beginPath();
              ctx.arc(Math.cos(sparkAngle) * sparkR, Math.sin(sparkAngle) * sparkR, 2, 0, Math.PI * 2);
              ctx.fill();
          }

          const glintX = Math.sin(now * 0.006) * baby.size * 1.5;
          const glintGrad = ctx.createLinearGradient(glintX - 12, 0, glintX + 12, 0);
          glintGrad.addColorStop(0, mainColor);
          glintGrad.addColorStop(0.5, '#FFFFFF');
          glintGrad.addColorStop(1, mainColor);
          ctx.fillStyle = glintGrad;
        } else {
          ctx.fillStyle = mainColor;
          ctx.shadowColor = 'rgba(0,0,0,0.12)';
          ctx.shadowBlur = 10;
        }

        ctx.beginPath();
        ctx.moveTo(0, -baby.size);
        ctx.bezierCurveTo(baby.size * 1.3, -baby.size, baby.size * 1.3, baby.size, 0, baby.size);
        ctx.bezierCurveTo(-baby.size * 1.3, baby.size, -baby.size * 1.3, -baby.size, 0, -baby.size);
        ctx.fill();
        ctx.strokeStyle = '#FFFFFF';
        ctx.lineWidth = 3;
        ctx.stroke();

        ctx.fillStyle = '#FFE4E6';
        ctx.beginPath(); ctx.arc(0, -baby.size / 2.5, baby.size / 1.8, 0, Math.PI * 2); ctx.fill();

        ctx.strokeStyle = '#543D3D'; ctx.lineWidth = 2.5;
        const headY = -baby.size / 2.5;
        const eyeOffset = baby.size / 4.5;
        const mouthY = headY + (baby.size / 5);

        if (baby.mood === 'happy' || baby.mood === 'joyful') {
            ctx.beginPath(); ctx.arc(-eyeOffset, headY, 4, 0.25, Math.PI - 0.25, true); ctx.stroke();
            ctx.beginPath(); ctx.arc(eyeOffset, headY, 4, 0.25, Math.PI - 0.25, true); ctx.stroke();
            ctx.beginPath(); ctx.arc(0, mouthY, 5, 0.3, Math.PI - 0.3, false); ctx.stroke();
            if (baby.mood === 'joyful') {
                ctx.font = '16px Arial'; ctx.fillText('✨', 0, -baby.size * 1.7);
            }
        } else if (baby.mood === 'worried') {
            ctx.fillStyle = '#543D3D';
            ctx.beginPath(); ctx.arc(-eyeOffset, headY, 3, 0, Math.PI * 2); ctx.fill();
            ctx.beginPath(); ctx.arc(eyeOffset, headY, 3, 0, Math.PI * 2); ctx.fill();
            ctx.beginPath(); ctx.moveTo(-7, mouthY + 2); ctx.lineTo(7, mouthY + 2); ctx.stroke();
        } else if (baby.mood === 'surprised') {
            ctx.beginPath(); ctx.arc(-eyeOffset, headY, 3.5, 0, Math.PI * 2); ctx.stroke();
            ctx.beginPath(); ctx.arc(eyeOffset, headY, 3.5, 0, Math.PI * 2); ctx.stroke();
            ctx.beginPath(); ctx.arc(0, mouthY + 3, 4.5, 0, Math.PI * 2); ctx.stroke();
        }
        ctx.restore();
      };

      caughtBabiesRef.current.forEach(cb => renderBaby(cb));
      babiesRef.current.forEach(baby => renderBaby(baby));

      powerUpsRef.current.forEach(pu => {
        ctx.save(); ctx.translate(pu.x, pu.y); ctx.rotate(pu.rotation);
        ctx.fillStyle = pu.type === 'slow_mo' ? '#3B82F6' : '#A855F7';
        ctx.beginPath(); ctx.moveTo(0, -pu.size); ctx.lineTo(pu.size, 0); ctx.lineTo(0, pu.size); ctx.lineTo(-pu.size, 0); ctx.closePath();
        ctx.fill(); ctx.strokeStyle = '#FFF'; ctx.lineWidth = 3; ctx.stroke();
        ctx.fillStyle = '#FFF'; ctx.font = '24px Arial'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.fillText(pu.type === 'slow_mo' ? '⏳' : '🧲', 0, 0); ctx.restore();
      });

      const basketY = canvas.height - basketHeight - 20;
      ctx.save();
      ctx.translate(basketX, basketY);
      
      activeEffectsRef.current.forEach((eff, idx) => {
        const remaining = eff.endTime - now;
        const total = EFFECT_DURATION;
        const progress = Math.max(0, remaining / total);
        const arcR = 65 + (idx * 16);
        
        ctx.beginPath();
        ctx.lineWidth = 8;
        ctx.lineCap = 'round';
        ctx.strokeStyle = eff.type === 'slow_mo' ? 'rgba(59, 130, 246, 0.2)' : 'rgba(168, 85, 247, 0.2)';
        ctx.arc(0, basketHeight/2, arcR, 0, Math.PI * 2);
        ctx.stroke();
        
        ctx.beginPath();
        ctx.lineWidth = 8;
        ctx.lineCap = 'round';
        ctx.strokeStyle = eff.type === 'slow_mo' ? '#3B82F6' : '#A855F7';
        ctx.arc(0, basketHeight/2, arcR, -Math.PI/2, -Math.PI/2 + (Math.PI * 2 * progress));
        ctx.stroke();

        ctx.fillStyle = '#FFF';
        ctx.font = '14px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(eff.type === 'slow_mo' ? '⏳' : '🧲', Math.cos(-Math.PI/2 + (Math.PI * 2 * progress)) * arcR, Math.sin(-Math.PI/2 + (Math.PI * 2 * progress)) * arcR + basketHeight/2);
      });

      ctx.fillStyle = isMagnet ? 'rgba(168, 85, 247, 0.2)' : 'rgba(0,0,0,0.1)';
      ctx.beginPath(); ctx.ellipse(0, basketHeight + 12, basketWidth/2, 9, 0, 0, Math.PI * 2); ctx.fill();

      const grad = ctx.createLinearGradient(0, 0, 0, basketHeight);
      grad.addColorStop(0, '#FFFFFF'); grad.addColorStop(1, '#F0F9FF');
      ctx.fillStyle = grad; ctx.strokeStyle = '#BAE6FD'; ctx.lineWidth = 5;
      const r = 18;
      ctx.beginPath(); ctx.moveTo(-basketWidth/2 + r, 0); ctx.lineTo(basketWidth/2 - r, 0); ctx.quadraticCurveTo(basketWidth/2, 0, basketWidth/2, r); ctx.lineTo(basketWidth/2, basketHeight - r); ctx.quadraticCurveTo(basketWidth/2, basketHeight, basketWidth/2 - r, basketHeight); ctx.lineTo(-basketWidth/2 + r, basketHeight); ctx.quadraticCurveTo(-basketWidth/2, basketHeight, -basketWidth/2, basketHeight - r); ctx.lineTo(-basketWidth/2, r); ctx.quadraticCurveTo(-basketWidth/2, 0, -basketWidth/2 + r, 0);
      ctx.fill(); ctx.stroke();

      ctx.restore();

      floatingScoresRef.current.forEach(fs => {
        ctx.save(); 
        ctx.globalAlpha = fs.opacity; 
        ctx.fillStyle = fs.color; 
        ctx.font = `bold ${36 + (1 - fs.opacity) * 10}px Assistant`; 
        ctx.textAlign = 'center'; 
        ctx.shadowColor = 'rgba(0,0,0,0.35)'; 
        ctx.shadowBlur = 10; 
        ctx.fillText(fs.text, fs.x, fs.y); 
        ctx.restore();
      });

      animationId = requestAnimationFrame(() => { update(); draw(); });
    };

    const resize = () => { canvas.width = window.innerWidth; canvas.height = window.innerHeight; };
    window.addEventListener('resize', resize);
    resize();
    draw();

    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('move-basket', handleMobileMove as EventListener);
      window.removeEventListener('resize', resize);
    };
  }, [level, basketX, isPaused, onSaveBaby, onMiss, onEffectsChange, settings, lang, t.saved]);

  return <canvas ref={canvasRef} className={`block w-full h-full ${isPaused ? 'opacity-50 grayscale transition-all' : 'cursor-none'}`} />;
};

export default GameCanvas;