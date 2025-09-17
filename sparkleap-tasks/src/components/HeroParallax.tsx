'use client';

import { useEffect, useRef } from 'react';

export default function HeroParallax() {
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const handleMove = (e: MouseEvent) => {
      const rect = el.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width - 0.5; // -0.5..0.5
      const y = (e.clientY - rect.top) / rect.height - 0.5;

      const layers = el.querySelectorAll<HTMLElement>('[data-layer]');
      layers.forEach((layer) => {
        const depth = parseFloat(layer.dataset.layer || '1');
        const tx = x * 12 * depth;
        const ty = y * 12 * depth;
        layer.style.transform = `translate3d(${tx}px, ${ty}px, 0)`;
      });
    };

    el.addEventListener('mousemove', handleMove);
    return () => el.removeEventListener('mousemove', handleMove);
  }, []);

  return (
    <div ref={containerRef} className="pointer-events-auto absolute inset-0">
      <div data-layer="0.5" className="absolute -top-40 left-1/2 h-96 w-[36rem] -translate-x-1/2 rounded-full bg-[radial-gradient(closest-side,rgba(255,82,82,0.35),transparent)] blur-3xl will-change-transform" />
      <div data-layer="0.8" className="absolute top-40 left-20 h-80 w-80 rounded-full bg-[radial-gradient(closest-side,rgba(255,165,0,0.25),transparent)] blur-3xl will-change-transform" />
      <div data-layer="1" className="absolute -bottom-20 right-10 h-96 w-[32rem] rounded-full bg-[radial-gradient(closest-side,rgba(99,102,241,0.25),transparent)] blur-3xl will-change-transform" />
    </div>
  );
}



