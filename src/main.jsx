import React, { useState, useEffect, useRef } from 'react';
import { createRoot } from 'react-dom/client';
import Vortex from './Vortex';
import { artists, works, timeline } from './data';
import '@fontsource-variable/inter';
import './style.css';

const legacyGalleryRoutes = new Set(['/field', '/list', '/vortex']);

function readRoute() {
  const route = location.hash.slice(1) || '/';
  return legacyGalleryRoutes.has(route) ? '/' : route;
}

function useRoute() {
  const [route, setRoute] = useState(readRoute);
  useEffect(() => {
    const update = () => {
      if (legacyGalleryRoutes.has(location.hash.slice(1))) {
        history.replaceState(history.state, '', '#/');
      }
      setRoute(readRoute());
    };
    update();
    window.addEventListener('hashchange', update);
    return () => window.removeEventListener('hashchange', update);
  }, []);
  return route;
}

function Logo() {
  return <a className="gallery-logo" href="#/" aria-label="Endi Jaubashi Art gallery home"><svg viewBox="0 0 48 32" aria-hidden="true"><path d="M2 1h19v5H8v7h11v5H8v8h13v5H2Z M28 1h18v20c0 7-4 11-11 11-4 0-7-2-9-5l4-4c1 2 3 3 5 3 3 0 5-2 5-5V6H28Z" fill="currentColor"/></svg><span>Endi Jaubashi<span>Art gallery</span></span></a>;
}

function ReferenceBadges() {
  return <div className="reference-badges" aria-hidden="true"><div className="awwwards"><b>W.</b><span>Nominee</span></div></div>;
}

function useSound() {
  const [enabled,setEnabled] = useState(false);
  const audio = useRef(null);
  useEffect(()=>()=>{audio.current?.close()},[]);
  async function toggle() {
    if(enabled){await audio.current?.suspend();setEnabled(false);return}
    try {
      if(!audio.current){
        const Audio = window.AudioContext || window.webkitAudioContext;
        if(!Audio) return;
        const context = new Audio(); audio.current=context;
        const volume=context.createGain();volume.gain.value=0.018;volume.connect(context.destination);
        [130.81,196,261.63].forEach((frequency,index)=>{
          const tone=context.createOscillator();tone.type='sine';tone.frequency.value=frequency;
          const level=context.createGain();level.gain.value=0.28/(index+1);tone.connect(level);level.connect(volume);tone.start();
        });
      }
      await audio.current.resume();setEnabled(true);
    } catch { setEnabled(false); }
  }
  return [enabled,toggle];
}

function About() {
  return <main className="about-view view-enter"><section className="about-intro"><p className="muted small-label">About the gallery</p><h1>Endi Jaubashi Art Gallery<br className="wide-break"/> shows contemporary<br className="wide-break"/> painting in East London.</h1><p className="about-description">The gallery opened in 2009 and represents seven painters from the UK and Europe. It holds six solo exhibitions a year in its ground-floor space on Marlow Yard, Bethnal Green, and runs a three-month studio residency on the floor above.</p><dl className="gallery-facts">{[['Founded','2009'],['Exhibitions','54'],['Artists','7'],['Address','14 Marlow Yard, London E2']].map(([title,value])=><div key={title}><dt>{title}</dt><dd>{value}</dd></div>)}</dl></section><section className="gallery-timeline" aria-label="Gallery history">{timeline.map(([year,title,text])=><article key={year}><h2>{year}</h2><div><h3>{title}</h3><p>{text}</p></div></article>)}</section></main>;
}

function Contacts() {
  return <main className="contacts-view view-enter"><a className="contact-center" href="mailto:info@chriswilliamsart.com">contact us</a><div className="contact-columns"><address><a href="https://maps.google.com/?q=14+Marlow+Yard+London+E2" target="_blank" rel="noreferrer">14 MARLOW YARD<br/>LONDON E2 9AG<br/>BETHNAL GREEN STATION, 5 MIN</a></address><p>WEDNESDAY TO SATURDAY, 11:00 TO 18:00<br/>SUNDAY, 12:00 TO 17:00<br/>ADMISSION FREE</p><div><a href="mailto:info@chriswilliamsart.com">INFO@CHRISWILLIAMSART.COM</a><a href="mailto:sales@chriswilliamsart.com">SALES@CHRISWILLIAMSART.COM</a><a href="mailto:press@chriswilliamsart.com">PRESS@CHRISWILLIAMSART.COM</a></div><div><a href="tel:+442079460318">+44 (0)20 7946 0318</a><p>ENDI JAUBASHI, DIRECTOR</p></div></div></main>;
}

function WorkView({work}) {
  return <main className="work-view view-enter"><a className="detail-image" href="#/" aria-label="Back to the gallery">{work.image?<img src={work.image} alt={`${work.title} by ${artists[work.artist].name}`} width={work.width} height={work.height}/>:<div className="reference-unavailable"><span>{work.title}</span><p>This painting’s image is not shown in the supplied recordings.</p></div>}</a><div className="work-description"><div><h1>{work.title}</h1><p>{artists[work.artist].name}</p></div><a href="#/">back to the gallery</a></div></main>;
}

function Cursor({detail,contact}) {
  const ref=useRef(null);
  useEffect(()=>{
    const move=e=>{
      if(e.pointerType==='touch')return;
      const el=ref.current;if(!el)return;
      el.style.transform=`translate3d(${e.clientX}px,${e.clientY}px,0)`;
      el.classList.add('is-visible');
      el.classList.toggle('is-link',!!e.target.closest('a,button'));
    };
    const leave=()=>ref.current?.classList.remove('is-visible');
    window.addEventListener('pointermove',move);document.addEventListener('pointerleave',leave);
    return()=>{window.removeEventListener('pointermove',move);document.removeEventListener('pointerleave',leave)};
  },[]);
  return <div className={`custom-cursor ${detail?'is-detail':''} ${contact?'is-contact':''}`} ref={ref} aria-hidden="true"><span>{detail?'back to the gallery':contact?'contact us':''}</span></div>;
}

function App() {
  const route = useRoute();
  const vortexPosition = useRef({ phase: 0, spin: 0 });
  const [sound, toggleSound] = useSound();
  const detail = works.find(work => work.route === route);
  const isVortex = route === '/';
  const unknown = !isVortex && !detail && !['/about', '/contacts'].includes(route);

  useEffect(() => {
    const title = detail?.title || ({ '/about': 'About', '/contacts': 'Contacts' })[route] || 'Page not found';
    document.title = isVortex ? 'Endi Jaubashi Art Gallery' : `${title} | Endi Jaubashi Art Gallery`;
    window.scrollTo(0, 0);
    if (!detail) return;
    const key = event => { if (event.key === 'Escape') location.hash = '/'; };
    window.addEventListener('keydown', key);
    return () => window.removeEventListener('keydown', key);
  }, [route, detail, isVortex]);

  return <>
    <a className="skip-link" href="#main-content" onClick={event => {
      event.preventDefault();
      document.getElementById('main-content')?.focus();
    }}>Skip to gallery content</a>
    <header className={`site-header${isVortex ? ' site-header--vortex' : ''}`}><Logo /></header>
    <div id="main-content" tabIndex={-1} className="page-content">
      {isVortex && <Vortex position={vortexPosition} sound={sound} onSoundToggle={toggleSound} />}
      {route === '/about' && <About />}
      {route === '/contacts' && <Contacts />}
      {detail && <WorkView work={detail} />}
      {unknown && <main className="not-found"><h1>Page not found</h1><a href="#/">back to the gallery</a></main>}
    </div>
    {!isVortex && <ReferenceBadges />}
    {!isVortex && <footer className="site-footer">
      <a className="creator-credit" href="https://nklvdsgn.com" target="_blank" rel="noreferrer">created by nklvdsgn.com</a>
      <span>all rights reserved 2026</span>
    </footer>}
    <Cursor detail={!!detail} contact={route === '/contacts'} />
  </>;
}

createRoot(document.getElementById('root')).render(<App/>);
