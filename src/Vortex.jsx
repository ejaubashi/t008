import React, { useEffect, useRef, useState } from 'react';
import { artists, visibleWorks } from './data';

const TAU = Math.PI * 2;
const TURNS = 1.7;
const distantWorks = visibleWorks.filter((_, index) => index % 2 === 0);
const wrap = value => ((value % 1) + 1) % 1;
const clamp = (value, min, max) => Math.max(min, Math.min(max, value));

export default function Vortex({ position, onProgress }) {
  const root = useRef(null);
  const scene = useRef(null);
  const engine = useRef(null);
  const hovered = useRef(null);
  const focused = useRef(null);
  const playing = useRef(false);
  const [paused, setPaused] = useState(() => position.current.paused ?? matchMedia('(prefers-reduced-motion: reduce)').matches);
  const [selected, setSelected] = useState(null);
  playing.current = !paused;

  const highlight = (target, work) => {
    if (target === hovered && engine.current?.dragging) return;
    target.current = work;
    setSelected(focused.current || hovered.current);
  };

  useEffect(() => {
    const element = root.current;
    const stage = scene.current;
    const reducedQuery = matchMedia('(prefers-reduced-motion: reduce)');
    let reduced = reducedQuery.matches;
    let width, height, focalLength, frame;
    let phase = position.current.phase, spin = position.current.spin;
    let targetPhase = phase, targetSpin = spin;
    let pointerX = 0, pointerY = 0, parallaxX = 0, parallaxY = 0;
    let drag = null, moved = false, lastTime = 0;
    const cards = [
      ...[...stage.querySelectorAll('.vortex-work')].map((node, index) => ({
        node, work: visibleWorks[index], offset: index / visibleWorks.length, distant: false,
      })),
      ...[...stage.querySelectorAll('.vortex-echo')].map((node, index) => ({
        node, work: distantWorks[index], offset: (index + 0.5) / distantWorks.length, distant: true,
      })),
    ];

    const resize = () => {
      width = element.clientWidth;
      height = element.clientHeight;
      const mobile = width < 650;
      focalLength = Math.min(width * (mobile ? 1.55 : 1.1), height * 2);
      stage.style.perspective = `${focalLength}px`;
      const panelWidth = Math.min(width * (mobile ? 0.36 : 0.175), height * 0.26, 265);
      const panelHeight = height * (mobile ? 0.26 : 0.39);
      for (const card of cards) {
        card.width = Math.min(panelWidth, panelHeight * card.work.width / card.work.height);
        card.node.style.width = `${card.width}px`;
      }
    };
    resize();
    const observer = new ResizeObserver(resize);
    observer.observe(element);

    // The visible cards and their distant copies share browser-cached images.
    let loaded = 0;
    const pending = [];
    for (const card of cards.filter(card => !card.distant)) {
      const image = card.node.querySelector('img');
      const complete = () => {
        image.removeEventListener('load', complete);
        image.removeEventListener('error', complete);
        onProgress(++loaded / visibleWorks.length);
      };
      if (image.complete) complete();
      else {
        image.addEventListener('load', complete);
        image.addEventListener('error', complete);
        pending.push(() => {
          image.removeEventListener('load', complete);
          image.removeEventListener('error', complete);
        });
      }
    }

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
      hovered.current = null;
      setSelected(focused.current);
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
    const touchMove = event => {
      // The helix handles the swipe, so the browser must not start a scroll gesture.
      if (drag && moved) event.preventDefault();
    };
    const up = event => {
      if (!drag) return;
      drag = null; engine.current.dragging = false;
      element.classList.remove('is-dragging');
      const hit = event.pointerType === 'mouse'
        ? document.elementFromPoint(event.clientX, event.clientY)?.closest('.vortex-work')
        : null;
      hovered.current = visibleWorks.find(work => work.number === Number(hit?.dataset.number)) || null;
      setSelected(focused.current || hovered.current);
    };
    const click = event => {
      if (moved && event.detail > 0 && !event.target.closest('.vortex-tools')) { event.preventDefault(); event.stopPropagation(); }
    };
    const reset = () => {
      targetPhase = 0; targetSpin = 0; pointerX = 0; pointerY = 0; moved = false;
      hovered.current = null;
      setSelected(focused.current);
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
    element.addEventListener('touchmove', touchMove, { passive: false });
    element.addEventListener('keydown',key);
    element.addEventListener('click',click,true);
    window.addEventListener('pointermove',move);
    window.addEventListener('pointerup',up);
    window.addEventListener('pointercancel',up);
    reducedQuery.addEventListener('change',preference);

    const render = time => {
      const dt = Math.min((time - (lastTime || time)) / 1000, 0.05); lastTime = time;
      const idle = playing.current && !hovered.current && !focused.current && !drag && !document.hidden;
      if (idle) {
        targetPhase += dt * 0.018;
        targetSpin += dt * 0.095;
      }
      const easing = reduced ? 1 : 1 - Math.exp(-dt * 9);
      phase += (targetPhase - phase) * easing;
      spin += (targetSpin - spin) * easing;
      parallaxX += ((reduced ? 0 : pointerX) - parallaxX) * easing;
      parallaxY += ((reduced ? 0 : pointerY) - parallaxY) * easing;
      position.current = { phase, spin, paused: !playing.current };
      element.dataset.travel = phase.toFixed(4);

      const mobile = width < 650;
      const radius = width * (mobile ? 0.50 : 0.44);
      const pitch = height * (mobile ? 0.91 : 0.84);
      for (const card of cards) {
        const progress = wrap(card.offset + phase + 0.034);
        const rise = progress - 0.5;
        const angle = rise * TAU * TURNS + Math.PI + 0.27 + spin + (card.distant ? 0.7 : 0);
        const side = Math.sin(angle);
        const front = Math.cos(angle);
        const depth = (front + 1) / 2;
        const x = side * radius + parallaxX;
        const y = rise * pitch + height * (0.058 * front - 0.125 * side) + parallaxY;
        const z = focalLength * (0.48 * front - (card.distant ? 1.65 : 0.09));
        const yaw = side * (0.85 + 0.14 * front);
        const tilt = 0.08 - depth * 0.23;
        const roll = side * 0.10;
        // Fade at both ends as each panel wraps back into the helix.
        const endFade = clamp(Math.min(progress, 1 - progress) / 0.15, 0, 1);
        const opacity = endFade * (card.distant ? 0.17 : 0.89 + 0.11 * depth);
        const hasFocus = !card.distant && focused.current === card.work;

        if (hasFocus) {
          // Bring keyboard selection into view even if its orbit is offscreen.
          const focusWidth = Math.min(width * 0.70, Math.max(card.width, 195));
          card.node.style.transform = `translate(-50%, -50%) scale(${focusWidth / card.width})`;
          card.node.style.zIndex = '100';
        } else {
          card.node.style.transform = `translate(-50%, -50%) translate3d(${x.toFixed(2)}px, ${y.toFixed(2)}px, ${z.toFixed(2)}px) rotateY(${yaw.toFixed(4)}rad) rotateX(${tilt.toFixed(4)}rad) rotateZ(${roll.toFixed(4)}rad)`;
          card.node.style.zIndex = String(Math.round(depth * 45) + (card.distant ? 0 : 50));
        }

        card.node.style.opacity = hasFocus ? '1' : opacity.toFixed(3);
        if (!card.distant) {
          card.node.style.pointerEvents = hasFocus || opacity > 0.15 ? 'auto' : 'none';
          const brightness = hasFocus || hovered.current === card.work ? 1 : 0.78 + depth * 0.22;
          card.node.style.setProperty('--vortex-brightness', brightness.toFixed(3));
        }
      }
      frame=requestAnimationFrame(render);
    };
    frame=requestAnimationFrame(render);
    return () => {
      position.current = { phase, spin, paused: !playing.current };
      cancelAnimationFrame(frame);
      observer.disconnect();
      pending.forEach(remove => remove());
      element.removeEventListener('wheel',wheel);element.removeEventListener('pointerdown',down);
      element.removeEventListener('keydown',key);element.removeEventListener('click',click,true);
      window.removeEventListener('pointermove',move);window.removeEventListener('pointerup',up);window.removeEventListener('pointercancel',up);
      reducedQuery.removeEventListener('change',preference);
    };
  },[position,onProgress]);

  return <section ref={root} className="art-vortex" aria-label="Vortex artwork gallery" tabIndex={0}>
    <p className="sr-only">Paintings travel on a helix. Scroll or swipe vertically to travel, drag horizontally to rotate, or use the arrow keys. Tab selects a painting; Enter opens it. Home resets the view. Choose Field at the bottom to return to the previous layout.</p>
    <div ref={scene} className="vortex-scene">
      {distantWorks.map(work => (
        <img key={work.number} className="vortex-echo" src={work.image} width={work.width} height={work.height}
          alt="" aria-hidden="true" draggable="false" />
      ))}
      {visibleWorks.map(work => (
        <a key={work.number} className="vortex-work" data-number={work.number} draggable="false"
          href={`#${work.route}`} aria-label={`${work.title} by ${artists[work.artist].name}`}
          onPointerEnter={event => { if (event.pointerType !== 'touch') highlight(hovered, work); }}
          onPointerLeave={() => highlight(hovered, null)}
          onFocus={event => { if (event.currentTarget.matches(':focus-visible')) highlight(focused, work); }}
          onBlur={() => highlight(focused, null)}>
          <img src={work.image} width={work.width} height={work.height} alt="" draggable="false" />
        </a>
      ))}
    </div>
    <div className="vortex-caption" aria-live="polite">{selected?<><span>{selected.title}</span><small>{artists[selected.artist].name}</small></>:<><span>Art in orbit.</span><small>{visibleWorks.length} works. A different perspective.</small></>}</div>
    <div className="vortex-tools"><button type="button" onClick={()=>setPaused(value=>!value)} aria-pressed={paused}>{paused?'Resume motion':'Pause motion'}</button><span aria-hidden="true"/><button type="button" onClick={()=>engine.current?.reset()}>Reset view</button></div>
    <p className="vortex-instructions">Scroll to travel <span>·</span> Drag to spin</p>
  </section>;
}
