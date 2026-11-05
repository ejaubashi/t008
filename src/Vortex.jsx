import React, { useEffect, useRef, useState } from 'react';
import { artists, visibleWorks } from './data';

const TAU = Math.PI * 2;
const wrap = value => ((value % 1) + 1) % 1;
const clamp = (value, min, max) => Math.max(min, Math.min(max, value));

export default function Vortex({ position, onProgress }) {
  const root = useRef(null);
  const canvas = useRef(null);
  const engine = useRef(null);
  const hovered = useRef(null);
  const playing = useRef(false);
  const [paused, setPaused] = useState(() => position.current.paused ?? matchMedia('(prefers-reduced-motion: reduce)').matches);
  const [selected, setSelected] = useState(null);
  playing.current = !paused;

  const highlight = work => {
    if (engine.current?.dragging) return;
    hovered.current = work?.number ?? null;
    setSelected(work || null);
  };

  useEffect(() => {
    const element = root.current;
    const ctx = canvas.current.getContext('2d');
    const reducedQuery = matchMedia('(prefers-reduced-motion: reduce)');
    let reduced = reducedQuery.matches;
    let width, height, dpr, frame, disposed = false, loaded = 0;
    let phase = position.current.phase, spin = position.current.spin;
    let targetPhase = phase, targetSpin = spin;
    let pointerX = 0, pointerY = 0, parallaxX = 0, parallaxY = 0;
    let drag = null, moved = false, lastTime = 0;
    const links = [...element.querySelectorAll('.vortex-work')];
    const items = visibleWorks.map((work, index) => ({ work, index, image: null, angle: null, emphasis: 0 }));

    const resize = () => {
      width = element.clientWidth; height = element.clientHeight;
      dpr = Math.min(devicePixelRatio || 1, 1.75);
      canvas.current.width = Math.round(width * dpr);
      canvas.current.height = Math.round(height * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    const observer = new ResizeObserver(resize); observer.observe(element);
    items.forEach(item => {
      const image = new Image();
      image.onload = () => {
        if (disposed) return;
        item.image = image; onProgress(++loaded / items.length);
      };
      image.onerror = () => { if (!disposed) onProgress(++loaded / items.length); };
      image.src = item.work.image;
    });

    const wheel = event => {
      event.preventDefault();
      targetPhase += clamp(event.deltaY, -180, 180) * 0.00065;
      targetSpin += clamp(event.deltaX, -180, 180) * 0.002;
    };
    const down = event => {
      if (event.button !== 0 || event.target.closest('.vortex-tools')) return;
      moved = false;
      drag = { x: event.clientX, y: event.clientY, phase: targetPhase, spin: targetSpin };
      engine.current.dragging = true;
      hovered.current = null; setSelected(null);
      element.classList.add('is-dragging');
    };
    const move = event => {
      if (event.pointerType !== 'touch') {
        pointerX = (event.clientX / width - 0.5) * 16;
        pointerY = (event.clientY / height - 0.5) * 12;
      }
      if (drag) {
        const dx = event.clientX - drag.x, dy = event.clientY - drag.y;
        if (Math.abs(dx) + Math.abs(dy) > 6) moved = true;
        targetSpin = drag.spin + dx * 0.006;
        targetPhase = drag.phase - dy * 0.00065;
      }
    };
    const up = event => {
      if (!drag) return;
      drag = null; engine.current.dragging = false;
      element.classList.remove('is-dragging');
      const hit = document.elementFromPoint(event.clientX,event.clientY)?.closest('.vortex-work');
      if (hit) {
        const work = visibleWorks.find(work => work.number === Number(hit.dataset.number));
        hovered.current = work?.number ?? null; setSelected(work || null);
      }
    };
    const click = event => {
      if (moved && event.detail > 0 && !event.target.closest('.vortex-tools')) { event.preventDefault(); event.stopPropagation(); }
    };
    const reset = () => {
      targetPhase = 0; targetSpin = 0; pointerX = 0; pointerY = 0; moved = false;
      hovered.current = null; setSelected(null);
    };
    const key = event => {
      if (event.target.closest('.vortex-tools')) return;
      if (['ArrowDown','ArrowUp','ArrowLeft','ArrowRight','Home'].includes(event.key)) event.preventDefault();
      if (event.key === 'ArrowDown') targetPhase += 0.065;
      if (event.key === 'ArrowUp') targetPhase -= 0.065;
      if (event.key === 'ArrowLeft') targetSpin -= 0.28;
      if (event.key === 'ArrowRight') targetSpin += 0.28;
      if (event.key === 'Home') reset();
    };
    const preference = event => {
      reduced = event.matches;
      if (reduced) { playing.current = false; setPaused(true); }
    };
    engine.current = { reset, dragging: false };
    element.addEventListener('wheel',wheel,{passive:false});
    element.addEventListener('pointerdown',down);
    element.addEventListener('keydown',key);
    element.addEventListener('click',click,true);
    window.addEventListener('pointermove',move);
    window.addEventListener('pointerup',up);
    window.addEventListener('pointercancel',up);
    reducedQuery.addEventListener('change',preference);

    const render = time => {
      const dt = Math.min((time - (lastTime || time)) / 1000, 0.05); lastTime = time;
      const idle = playing.current && !hovered.current && !drag && !document.hidden;
      if (idle) { targetPhase += dt * 0.0025; targetSpin += dt * 0.012; }
      const easing = reduced ? 1 : 1 - Math.exp(-dt * 9);
      phase += (targetPhase - phase) * easing;
      spin += (targetSpin - spin) * easing;
      parallaxX += ((reduced ? 0 : pointerX) - parallaxX) * easing;
      parallaxY += ((reduced ? 0 : pointerY) - parallaxY) * easing;
      position.current = { phase, spin, paused: !playing.current };
      element.dataset.travel = phase.toFixed(4);
      ctx.clearRect(0,0,width,height);

      const mobile = width < 650;
      const centerX = width * 0.5 + parallaxX;
      const centerY = height * (mobile ? 0.47 : 0.49) + parallaxY;
      const size = Math.min(width * (mobile ? 0.42 : 0.27), height * 0.38, 350);
      const radiusX = width * (mobile ? 0.47 : 0.45) - size * 0.23;
      const radiusY = height * (mobile ? 0.39 : 0.43) - size * 0.13;
      const point = depth => {
        const theta = depth * TAU * 1.6 + spin - Math.PI * 0.5;
        const radius = 0.08 + Math.pow(depth,1.15) * 0.92;
        return { x: centerX + Math.cos(theta) * radiusX * radius, y: centerY + Math.sin(theta) * radiusY * radius, theta };
      };
      // A fine spiral reinforces the depth without competing with the paintings.
      ctx.beginPath();
      for (let t = 0; t <= 1.001; t += 0.004) {
        const pointOnSpiral = point(t);
        if(t===0)ctx.moveTo(pointOnSpiral.x,pointOnSpiral.y);else ctx.lineTo(pointOnSpiral.x,pointOnSpiral.y);
      }
      ctx.strokeStyle='rgba(91,83,140,0.09)';ctx.lineWidth=0.7;ctx.stroke();
      const glow = ctx.createRadialGradient(centerX,centerY,0,centerX,centerY,size * 0.68);
      glow.addColorStop(0,'rgba(255,255,255,0.35)');glow.addColorStop(1,'rgba(255,255,255,0)');
      ctx.fillStyle=glow;ctx.fillRect(centerX-size,centerY-size,size*2,size*2);

      const projected = items.map(item => {
        const depth = wrap(item.index / items.length + phase);
        const {x,y,theta}=point(depth);
        const active = hovered.current === item.work.number;
        item.emphasis += ((active?1:0) - item.emphasis) * (reduced?1:0.15);
        const baseWidth = size * (0.16 + Math.pow(depth,1.45) * 0.84);
        const sw = baseWidth + item.emphasis * Math.max(14,Math.min(size * 0.7,190) - baseWidth);
        const sh = sw * item.work.height / item.work.width;
        const desiredAngle = Math.atan2(Math.sin(theta+Math.PI/2),Math.cos(theta+Math.PI/2)) * (1-item.emphasis);
        if(item.angle===null)item.angle=desiredAngle;
        const difference=Math.atan2(Math.sin(desiredAngle-item.angle),Math.cos(desiredAngle-item.angle));
        item.angle+=difference*(reduced?1:0.13);
        const fade = active ? 1 : clamp(depth * 8 + 0.32,0.32,1) * (depth > 0.96 ? (1-depth)/0.04 : 1);
        return {...item,x,y,sw,sh,depth,active,opacity:fade,rotation:item.angle};
      }).sort((a,b)=>(a.active?2:a.depth)-(b.active?2:b.depth));

      projected.forEach(item => {
        const {index,x,y,sw,sh,opacity,rotation,image,work,active}=item;
        const link=links[index];
        link.style.width=`${sw}px`; link.style.height=`${sh}px`;
        link.style.transform=`translate3d(${x-sw/2}px,${y-sh/2}px,0) rotate(${rotation}rad)`;
        link.style.opacity=String(opacity);link.style.pointerEvents=opacity<0.15?'none':'';link.style.zIndex=String(active?30:Math.round(item.depth*20));
        link.dataset.depth=item.depth.toFixed(3);
        ctx.save();ctx.translate(x,y);ctx.rotate(rotation);ctx.globalAlpha=opacity;
        if(image){
          ctx.shadowColor=active?'rgba(55,45,90,0.23)':'rgba(55,45,90,0.14)';
          ctx.shadowBlur=active?24:12;ctx.shadowOffsetY=7;
          ctx.drawImage(image,-sw/2,-sh/2,sw,sh);
          ctx.shadowBlur=0;ctx.shadowOffsetY=0;
        }
        if(active){ctx.strokeStyle='rgba(255,255,255,.9)';ctx.lineWidth=2;ctx.strokeRect(-sw/2,-sh/2,sw,sh);}
        ctx.restore();
      });
      frame=requestAnimationFrame(render);
    };
    frame=requestAnimationFrame(render);
    return () => {
      disposed=true;position.current={phase,spin,paused:!playing.current};cancelAnimationFrame(frame);observer.disconnect();
      element.removeEventListener('wheel',wheel);element.removeEventListener('pointerdown',down);
      element.removeEventListener('keydown',key);element.removeEventListener('click',click,true);
      window.removeEventListener('pointermove',move);window.removeEventListener('pointerup',up);window.removeEventListener('pointercancel',up);
      reducedQuery.removeEventListener('change',preference);
    };
  },[position,onProgress]);

  return <section ref={root} className="art-vortex" aria-label="Vortex artwork gallery" tabIndex={0}>
    <canvas ref={canvas} aria-hidden="true"/>
    <p className="sr-only">Paintings spiral through the gallery. Scroll or swipe vertically to travel, drag horizontally to rotate, or use the arrow keys. Tab selects a painting; Enter opens it. Home resets the view. Choose Field at the bottom to return to the previous layout.</p>
    {visibleWorks.map(work=><a key={work.number} className="vortex-work" data-number={work.number} draggable="false" href={`#${work.route}`} aria-label={`${work.title} by ${artists[work.artist].name}`} onPointerEnter={()=>highlight(work)} onPointerLeave={()=>highlight(null)} onFocus={()=>highlight(work)} onBlur={()=>highlight(null)}><span className="sr-only">{work.title}</span></a>)}
    <div className="vortex-caption" aria-live="polite">{selected?<><span>{selected.title}</span><small>{artists[selected.artist].name}</small></>:<><span>Art in orbit.</span><small>{visibleWorks.length} works. A different perspective.</small></>}</div>
    <div className="vortex-tools"><button type="button" onClick={()=>setPaused(value=>!value)} aria-pressed={paused}>{paused?'Resume motion':'Pause motion'}</button><span aria-hidden="true"/><button type="button" onClick={()=>engine.current?.reset()}>Reset view</button></div>
    <p className="vortex-instructions">Scroll to travel <span>·</span> Drag to spin</p>
  </section>;
}
