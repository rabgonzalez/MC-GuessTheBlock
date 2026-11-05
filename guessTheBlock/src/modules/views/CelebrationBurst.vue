<template>
  <canvas
    ref="canvas"
    class="pointer-events-none fixed inset-0 z-40 h-full w-full"
    aria-hidden="true"
  />
</template>

<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from "vue";

/** Emerald, gold, diamond, XP green, redstone, lapis */
const COLORS = [
  "#17dd62",
  "#fcee4b",
  "#4aedd9",
  "#b2ff3f",
  "#ff3b30",
  "#345ec3",
];
const DURATION_MS = 3800;

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  spin: number;
  angle: number;
  color: string;
}

const canvas = ref<HTMLCanvasElement | null>(null);
let frame = 0;

onMounted(() => {
  const el = canvas.value;
  const ctx = el?.getContext("2d");
  if (!el || !ctx) return;
  const dpr = window.devicePixelRatio || 1;
  const w = window.innerWidth;
  const h = window.innerHeight;
  el.width = w * dpr;
  el.height = h * dpr;
  ctx.scale(dpr, dpr);

  const particles: Particle[] = [];
  const burst = (x: number, y: number, count: number, dir: number) => {
    for (let i = 0; i < count; i++) {
      const angle = -Math.PI / 2 + dir * 0.45 + (Math.random() - 0.5) * 0.9;
      const speed = 9 + Math.random() * 11;
      particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        size: 5 + Math.floor(Math.random() * 3) * 3,
        spin: (Math.random() - 0.5) * 0.3,
        angle: Math.random() * Math.PI,
        color: COLORS[Math.floor(Math.random() * COLORS.length)],
      });
    }
  };
  // Two fountains from the bottom corners and one from the centre.
  burst(0, h, 70, 1);
  burst(w, h, 70, -1);
  burst(w / 2, h * 0.75, 50, 0);

  const start = performance.now();
  const tick = (now: number) => {
    const t = now - start;
    ctx.clearRect(0, 0, w, h);
    ctx.globalAlpha = Math.max(
      0,
      1 - Math.max(0, t - DURATION_MS * 0.6) / (DURATION_MS * 0.4)
    );
    for (const p of particles) {
      p.vy += 0.35;
      p.vx *= 0.99;
      p.x += p.vx;
      p.y += p.vy;
      p.angle += p.spin;
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(p.angle);
      ctx.fillStyle = p.color;
      ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size);
      // pixel-art shading: darker bottom-right corner
      ctx.fillStyle = "rgba(0,0,0,0.25)";
      ctx.fillRect(0, 0, p.size / 2, p.size / 2);
      ctx.restore();
    }
    if (t < DURATION_MS) frame = requestAnimationFrame(tick);
    else ctx.clearRect(0, 0, w, h);
  };
  frame = requestAnimationFrame(tick);
});

onBeforeUnmount(() => cancelAnimationFrame(frame));
</script>
