import React, { useEffect, useRef, useState } from 'react';
import { artists, visibleWorks } from './data';

const TAU = Math.PI * 2;
const TURNS = 1.7;
const distantWorks = visibleWorks.filter((_, index) => index % 2 === 0);
const wrap = value => ((value % 1) + 1) % 1;
const clamp = (value, min, max) => Math.max(min, Math.min(max, value));

export default function Vortex({ position, sound, onSoundToggle }) {
  const root = useRef(null);
  const scene = useRef(null);
  const light = useRef(null);
  const engine = useRef(null);
  const hovered = useRef(null);
  const focused = useRef(null);
  const playing = useRef(false);
  const [paused, setPaused] = useState(() => position.current.paused ?? matchMedia('(prefers-reduced-motion: reduce)').matches);
  const [imagesReady, setImagesReady] = useState(false);
  playing.current = !paused;

  const highlight = (target, work) => {
    if (target === hovered && engine.current?.dragging) return;
    target.current = work;
  };

  useEffect(() => {
    const element = root.current;
    const stage = scene.current;
    const halo = light.current;
    const reducedQuery = matchMedia('(prefers-reduced-motion: reduce)');
    let reduced = reducedQuery.matches;
    let width, height, focalLength, frame;
    let phase = position.current.phase, spin = position.current.spin;
    let targetPhase = phase, targetSpin = spin;
    let pointerX = 0, pointerY = 0, parallaxX = 0, parallaxY = 0;
    let drag = null, moved = false, lastTime = 0;
    let entered = position.current.entered || false;
    let entranceStart;
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
    let imagesFinished = 0;
    const pending = [];
    for (const card of cards.filter(card => !card.distant)) {
      const image = card.node.querySelector('img');
      const complete = () => {
        image.removeEventListener('load', complete);
        image.removeEventListener('error', complete);
        if (++imagesFinished === visibleWorks.length) setImagesReady(true);
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
      const hit = event.pointerType === 'mouse'
        ? document.elementFromPoint(event.clientX, event.clientY)?.closest('.vortex-work')
        : null;
      hovered.current = visibleWorks.find(work => work.number === Number(hit?.dataset.number)) || null;
      };
    const click = event => {
      if (moved && event.detail > 0 && !event.target.closest('.vortex-tools')) { event.preventDefault(); event.stopPropagation(); }
    };
    const reset = () => {
      targetPhase = 0; targetSpin = 0; pointerX = 0; pointerY = 0; moved = false;
      hovered.current = null;
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
      const ready = imagesFinished === visibleWorks.length;
      if (ready && entranceStart === undefined) entranceStart = time;
      const skipReveal = entered || reduced || !playing.current || focused.current || drag;
      const reveal = skipReveal ? 1 : ready ? clamp((time - entranceStart) / 1050, 0, 1) : 0;
      const entrance = (1 - reveal) ** 3;
      if (ready && reveal === 1) entered = true;
      stage.style.opacity = ready ? String(Math.min(reveal * 2.4, 1)) : '0';

      const idle = ready && entered && playing.current && !hovered.current && !focused.current && !drag && !document.hidden;
      if (idle) {
        targetPhase += dt * 0.018;
        targetSpin += dt * 0.095;
      }
      const easing = reduced ? 1 : 1 - Math.exp(-dt * 9);
      phase += (targetPhase - phase) * easing;
      spin += (targetSpin - spin) * easing;
      parallaxX += ((reduced ? 0 : pointerX) - parallaxX) * easing;
      parallaxY += ((reduced ? 0 : pointerY) - parallaxY) * easing;
      halo.style.transform = `translate3d(${parallaxX * 3}px, ${parallaxY * 3}px, 0) rotate(${spin * 0.18}rad) scale(${1 - entrance * 0.2})`;
      position.current = { phase, spin, paused: !playing.current, entered };
      element.dataset.travel = phase.toFixed(4);

      const mobile = width < 650;
      const radius = width * (mobile ? 0.50 : 0.44);
      const pitch = height * (mobile ? 0.91 : 0.84);
      for (const card of cards) {
        const progress = wrap(card.offset + phase + 0.034);
        const rise = progress - 0.5;
        const angle = rise * TAU * TURNS + Math.PI + 0.27 + spin - entrance * 0.55 + (card.distant ? 0.7 : 0);
        const side = Math.sin(angle);
        const front = Math.cos(angle);
        const depth = (front + 1) / 2;
        const x = side * radius + parallaxX;
        const y = rise * pitch + height * (0.058 * front - 0.125 * side) + parallaxY;
        const z = focalLength * (0.48 * front - (card.distant ? 1.65 : 0.09) - entrance * 0.88);
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
      position.current = { phase, spin, paused: !playing.current, entered };
      cancelAnimationFrame(frame);
      observer.disconnect();
      pending.forEach(remove => remove());
      element.removeEventListener('wheel',wheel);element.removeEventListener('pointerdown',down);
      element.removeEventListener('touchmove', touchMove);
      element.removeEventListener('keydown',key);element.removeEventListener('click',click,true);
      window.removeEventListener('pointermove',move);window.removeEventListener('pointerup',up);window.removeEventListener('pointercancel',up);
      reducedQuery.removeEventListener('change',preference);
    };
  }, [position]);

  return <section ref={root} className="art-vortex" aria-label="Vortex artwork gallery" tabIndex={0}>
    <div ref={light} className="vortex-light" aria-hidden="true" />
    {!imagesReady && <p className="sr-only" role="status" aria-label="Loading gallery">Loading gallery</p>}
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
    <div className="vortex-tools" role="group" aria-label="Gallery controls">
      <button type="button" aria-label={paused ? 'Resume motion' : 'Pause motion'} aria-pressed={paused}
        onClick={() => setPaused(value => !value)}>
        <svg viewBox="0 0 24 24" aria-hidden="true">
          {paused ? <path d="M9 5.5 19 12 9 18.5Z" /> : <path d="M9 5.5v13m6-13v13" />}
        </svg>
      </button>
      <button type="button" aria-label="Reset view" onClick={() => engine.current?.reset()}>
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M4 11a8 8 0 1 1 2.3 6.7M4 5v6h6" />
        </svg>
      </button>
      <button type="button" aria-label="Toggle ambient sound" aria-pressed={sound} onClick={onSoundToggle}>
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M4 9h4l5-4v14l-5-4H4z" />
          {sound ? <path d="M16 9a4 4 0 0 1 0 6m2-8a7 7 0 0 1 0 10" /> : <path d="m17 10 4 4m0-4-4 4" />}
        </svg>
      </button>
    </div>
  </section>;
}
