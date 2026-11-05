import React, { useEffect, useRef } from 'react';
import { artists, fieldLayout } from './data';

const clamp = (value, min, max) => Math.max(min, Math.min(max, value));

export default function Field({ position, onProgress }) {
  const container = useRef(null);
  const canvas = useRef(null);
  const engine = useRef(null);

  useEffect(() => {
    const root = container.current;
    const ctx = canvas.current.getContext('2d');
    const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
    let frame, width, height, scale, dpr;
    let x = position.current.x, y = position.current.y;
    let targetX = x, targetY = y;
    let drag = null, moved = false, loaded = 0;
    let pointer = { x: -1000, y: -1000 };
    let ripple = 0, lastPointer = 0, dirty = true;
    const links = [...root.querySelectorAll('.field-work')];
    const images = new Map();
    let disposed = false;

    const resize = () => {
      width = root.clientWidth; height = root.clientHeight;
      scale = width < 600 ? 0.42 : width / 1920;
      dpr = Math.min(devicePixelRatio || 1, 2);
      canvas.current.width = width * dpr;
      canvas.current.height = height * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      dirty = true;
    };
    resize();
    document.fonts.ready.then(() => { if (!disposed) dirty = true; });
    const observer = new ResizeObserver(resize);
    observer.observe(root);
    fieldLayout.forEach(item => {
      const image = new Image();
      image.onload = () => {
        if (disposed) return;
        images.set(item.work.number, image); dirty = true;
        onProgress(++loaded / fieldLayout.length);
      };
      image.onerror = () => { if (!disposed) onProgress(++loaded / fieldLayout.length); };
      image.src = item.work.image;
    });

    const bounds = () => {
      targetX = clamp(targetX, -800, 1400);
      targetY = clamp(targetY, -height / scale * 0.45, 3950);
    };
    const wheel = event => {
      event.preventDefault();
      targetX += event.deltaX / scale * 0.65;
      targetY += event.deltaY / scale * 0.8;
      bounds(); dirty = true;
    };
    const down = event => {
      if (event.button !== 0) return;
      moved = false;
      drag = { startX: event.clientX, startY: event.clientY, x: targetX, y: targetY };
      root.classList.add('is-dragging');
    };
    const move = event => {
      if (drag) {
        const dx = event.clientX - drag.startX, dy = event.clientY - drag.startY;
        if (Math.abs(dx) + Math.abs(dy) > 6) moved = true;
        targetX = drag.x - dx / scale; targetY = drag.y - dy / scale;
        bounds();
      }
      pointer = { x: event.clientX, y: event.clientY };
      ripple = reduced ? 0 : 1; lastPointer = performance.now(); dirty = true;
    };
    const up = () => { drag = null; root.classList.remove('is-dragging'); };
    const click = event => {
      if (moved) { event.preventDefault(); event.stopPropagation(); }
    };
    const key = event => {
      const directions = { ArrowDown: [0,220], ArrowUp: [0,-220], ArrowLeft: [-220,0], ArrowRight: [220,0] };
      const direction = directions[event.key];
      if (direction) { event.preventDefault(); targetX += direction[0]; targetY += direction[1]; bounds(); }
      if (event.key === 'Home') { event.preventDefault(); targetX = 0; targetY = 0; }
    };
    const focus = index => {
      const item = fieldLayout[index];
      const screenX = (item.x - targetX) * scale;
      const screenY = (item.y - targetY) * scale;
      const imageHeight = item.width * item.work.height / item.work.width * scale;
      if (screenX < 40 || screenX + item.width * scale > width - 40) targetX = item.x - width / scale / 2 + item.width / 2;
      if (screenY < 90 || screenY + imageHeight > height - 75) targetY = item.y - height / scale / 2 + imageHeight / scale / 2;
      dirty = true;
    };
    engine.current = { focus };
    root.addEventListener('wheel', wheel, { passive: false });
    root.addEventListener('pointerdown', down);
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', up);
    window.addEventListener('pointercancel', up);
    root.addEventListener('click', click, true);
    root.addEventListener('keydown', key);

    const render = time => {
      const dx = targetX - x, dy = targetY - y;
      const moving = Math.abs(dx) + Math.abs(dy) > 0.05;
      x += dx * (reduced ? 1 : 0.09); y += dy * (reduced ? 1 : 0.09);
      position.current = { x, y };
      const velocity = reduced ? 0 : clamp(dy * scale * 0.09, -30, 30);
      if (time - lastPointer > 100) ripple *= 0.9;
      if (dirty || moving || ripple > 0.01) {
        dirty = false;
        ctx.clearRect(0,0,width,height);
        // The transparent canvas reveals the shared gradient background.
        fieldLayout.forEach((item,index) => {
          const sx = (item.x - x) * scale;
          const sy = (item.y - y) * scale;
          const sw = item.width * scale;
          const sh = sw * item.work.height / item.work.width;
          const link = links[index];
          link.style.transform = `translate3d(${sx}px,${sy}px,0)`;
          link.style.width = `${sw}px`; link.style.height = `${sh + 52}px`;
          if (sx + sw < -80 || sx > width + 80 || sy + sh + 50 < -50 || sy > height + 50) return;
          const image = images.get(item.work.number);
          if (image) {
            const slices = reduced ? 1 : 30;
            for (let slice = 0; slice < slices; slice++) {
              const ratio = slice / slices;
              const screenY = sy + ratio * sh;
              const edge = Math.pow(Math.abs(screenY / height * 2 - 1),5);
              const bend = clamp(edge * velocity * 2.6, -65,65);
              const dist = Math.hypot((sx + sw * 0.5) - pointer.x, screenY - pointer.y);
              const wave = Math.sin(dist * 0.035 - time * 0.008) * Math.exp(-dist * dist / 15000) * ripple * 7;
              ctx.drawImage(image,0,image.height * ratio,image.width,image.height / slices,sx + bend + wave,screenY,sw,sh / slices + 0.7);
            }
          }
          const fontSize = width < 600 ? 10 : clamp(11 * scale,10,11);
          ctx.textBaseline = 'top'; ctx.font = `${fontSize}px 'Inter Variable', Arial, sans-serif`;
          ctx.fillStyle = '#aaa'; ctx.fillText(String(item.work.number).padStart(2,'0'),sx,sy - 18);
          ctx.fillStyle = '#333'; ctx.fillText(item.work.title,sx,sy + sh + 10);
          ctx.fillStyle = '#aaa'; ctx.fillText(artists[item.work.artist].name,sx,sy + sh + 25);
        });
        const notes = [
          {x:240,y:1340,artist:'osei'},
          {x:400,y:2580,artist:'cole'},
        ];
        for (const note of notes) {
          const artist = artists[note.artist];
          const sx = (note.x - x) * scale, sy = (note.y - y) * scale;
          if (sy > height || sy < -150) continue;
          ctx.fillStyle = '#292929'; ctx.font = `600 ${56 * scale}px 'Inter Variable', Arial, sans-serif`;
          ctx.fillText(artist.name,sx,sy);
          ctx.font = `${12 * Math.max(scale,0.8)}px 'Inter Variable', Arial, sans-serif`;
          ctx.fillText(artist.subtitle,sx,sy + 69 * scale);
          ctx.fillStyle = '#888';
          const lines = artist.description.match(/.{1,68}(?:\s|$)/g) || [artist.description];
          lines.forEach((line,i)=>ctx.fillText(line.trim(),sx,sy + (100 + i * 23) * scale));
        }
      }
      frame = requestAnimationFrame(render);
    };
    frame = requestAnimationFrame(render);
    return () => {
      disposed = true; cancelAnimationFrame(frame); observer.disconnect();
      root.removeEventListener('wheel',wheel); root.removeEventListener('pointerdown',down);
      window.removeEventListener('pointermove',move); window.removeEventListener('pointerup',up); window.removeEventListener('pointercancel',up);
      root.removeEventListener('click',click,true); root.removeEventListener('keydown',key);
    };
  }, [onProgress, position]);

  return <section ref={container} className="art-field" aria-label="Draggable artwork field" tabIndex={0}>
    <canvas ref={canvas} aria-hidden="true" />
    <p className="sr-only">Drag or scroll to explore the gallery. Use arrow keys to move, or Tab to navigate paintings. Home returns to the start.</p>
    {fieldLayout.map(({work},index)=><a key={work.number} className="field-work" draggable="false" href={`#${work.route}`} aria-label={`${work.title} by ${artists[work.artist].name}`} onFocus={()=>engine.current?.focus(index)}><span className="sr-only">{work.title}</span></a>)}
  </section>;
}
