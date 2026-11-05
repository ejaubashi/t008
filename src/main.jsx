import React, { useState, useEffect, useRef, useCallback } from 'react';
import { createRoot } from 'react-dom/client';
import Field from './Field';
import Vortex from './Vortex';
import RippleImage from './RippleImage';
import { artists, works, visibleWorks, timeline } from './data';
import '@fontsource-variable/inter';
import './style.css';

function useRoute() {
  const read = () => location.hash.slice(1) || '/';
  const [route,setRoute] = useState(read);
  useEffect(()=>{const update=()=>setRoute(read());window.addEventListener('hashchange',update);return()=>window.removeEventListener('hashchange',update)},[]);
  return route;
}

function TextLink({ children, href, active, ...props }) {
  const [text,setText] = useState(children);
  const timer = useRef(null);
  useEffect(()=>()=>clearInterval(timer.current),[]);
  function animate() {
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    clearInterval(timer.current);
    let step = 0;
    timer.current = setInterval(()=>{
      step++;
      setText([...children].map((letter,i)=>i < step || letter === ' ' ? letter : Math.floor(Math.random()*10)).join(''));
      if(step >= children.length){clearInterval(timer.current);setText(children)}
    },24);
  }
  return <a href={href} className={active?'is-current':''} aria-current={active?'page':undefined} aria-label={children} onMouseEnter={animate} {...props}>{text}</a>;
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

function ListView({ selection }) {
  const [selected,setSelected] = useState(selection.current);
  const rail = useRef(null);
  const drag = useRef(null);
  const skipClick = useRef(false);
  const programmatic = useRef(false);
  const timeout = useRef(null);
  const work = works.find(item=>item.number===selected) || works[0];
  const artist = artists[work.artist];
  const previewWorks = visibleWorks.filter(item=>item.artist===work.artist);
  useEffect(()=>()=>clearTimeout(timeout.current),[]);

  const select = number => {
    setSelected(number);
    const next = works.find(item=>item.number===number);
    if(next.image){
      programmatic.current=true;
      requestAnimationFrame(()=>{
        const slide=rail.current?.querySelector(`[data-number="${number}"]`);
        if(slide) rail.current.scrollTo({left:slide.offsetLeft - rail.current.offsetLeft,behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth'});
        clearTimeout(timeout.current);timeout.current=setTimeout(()=>{programmatic.current=false},600);
      });
    }
  };
  useEffect(() => { selection.current = selected; }, [selected, selection]);
  useEffect(() => { select(selection.current); }, []);
  const scroll = () => {
    if(programmatic.current || !rail.current) return;
    const slides=[...rail.current.querySelectorAll('.rail-work')];
    if(!slides.length)return;
    const edge=rail.current.getBoundingClientRect().left;
    const closest=slides.reduce((a,b)=>Math.abs(a.getBoundingClientRect().left-edge)<Math.abs(b.getBoundingClientRect().left-edge)?a:b);
    setSelected(Number(closest.dataset.number));
  };
  function pointerDown(e){if(e.button!==0)return;skipClick.current=false;drag.current={x:e.clientX,scroll:rail.current.scrollLeft};}
  function pointerMove(e){if(!drag.current)return;const dx=e.clientX-drag.current.x;if(Math.abs(dx)>5)skipClick.current=true;rail.current.scrollLeft=drag.current.scroll-dx;}
  function pointerUp(){drag.current=null}
  useEffect(()=>{window.addEventListener('pointerup',pointerUp);return()=>window.removeEventListener('pointerup',pointerUp)},[]);
  return <main className="list-view view-enter" aria-label="Index of works">
    <div className="work-index"><div className="index-head"><span>number</span><span>project</span><span>artist</span></div><div className="index-rows">{works.map(item=><div className={`index-row ${item.number===selected?'is-selected':''}`} key={item.number}><button className="index-select" aria-label={`Preview ${item.title}`} aria-pressed={item.number===selected} onClick={()=>select(item.number)} onFocus={()=>select(item.number)}><span>{String(item.number).padStart(2,'0')}</span><span>{item.title}</span><span>{artists[item.artist].name}</span></button></div>)}</div></div>
    <section className="artist-preview" aria-label={`${artist.name} artworks`}><div className="artist-heading"><div><h1>{artist.name}</h1>{artist.subtitle&&<p>{artist.subtitle}</p>}</div><div className="artist-description">{artist.description&&<p>{artist.description}</p>}{artist.born&&<dl><div><dt>Born</dt><dd>{artist.born}</dd></div><div><dt>Lives in</dt><dd>{artist.lives}</dd></div><div><dt>With the gallery</dt><dd>{artist.since}</dd></div></dl>}</div></div>
      {work.image && previewWorks.length ? <div className="art-rail" ref={rail} onScroll={scroll} onPointerDown={pointerDown} onPointerMove={pointerMove} onDragStart={e=>e.preventDefault()} onClickCapture={e=>{if(skipClick.current){e.preventDefault();e.stopPropagation();skipClick.current=false}}} onWheel={e=>{if(Math.abs(e.deltaY)>Math.abs(e.deltaX))rail.current.scrollLeft+=e.deltaY}} tabIndex={0} aria-label="Scroll horizontally to browse paintings" onKeyDown={e=>{if(e.target!==rail.current)return;if(e.key==='ArrowRight'||e.key==='ArrowLeft'){e.preventDefault();rail.current.scrollBy({left:e.key==='ArrowRight'?500:-500,behavior:'smooth'})}}}>{previewWorks.map(item=><a key={item.number} className="rail-work" data-number={item.number} href={`#${item.route}`} aria-label={`Open ${item.title}`}><RippleImage work={item}/></a>)}</div> : <div className="reference-unavailable"><span>{work.title}</span><p>This painting is listed in the recording, but its image is not shown.</p></div>}
    </section>
  </main>;
}

function About() {
  return <main className="about-view view-enter"><section className="about-intro"><p className="muted small-label">About the gallery</p><h1>Endi Jaubashi Art Gallery<br className="wide-break"/> shows contemporary<br className="wide-break"/> painting in East London.</h1><p className="about-description">The gallery opened in 2009 and represents seven painters from the UK and Europe. It holds six solo exhibitions a year in its ground-floor space on Marlow Yard, Bethnal Green, and runs a three-month studio residency on the floor above.</p><dl className="gallery-facts">{[['Founded','2009'],['Exhibitions','54'],['Artists','7'],['Address','14 Marlow Yard, London E2']].map(([title,value])=><div key={title}><dt>{title}</dt><dd>{value}</dd></div>)}</dl></section><section className="gallery-timeline" aria-label="Gallery history">{timeline.map(([year,title,text])=><article key={year}><h2>{year}</h2><div><h3>{title}</h3><p>{text}</p></div></article>)}</section></main>;
}

function Contacts() {
  return <main className="contacts-view view-enter"><a className="contact-center" href="mailto:info@chriswilliamsart.com">contact us</a><div className="contact-columns"><address><a href="https://maps.google.com/?q=14+Marlow+Yard+London+E2" target="_blank" rel="noreferrer">14 MARLOW YARD<br/>LONDON E2 9AG<br/>BETHNAL GREEN STATION, 5 MIN</a></address><p>WEDNESDAY TO SATURDAY, 11:00 TO 18:00<br/>SUNDAY, 12:00 TO 17:00<br/>ADMISSION FREE</p><div><a href="mailto:info@chriswilliamsart.com">INFO@CHRISWILLIAMSART.COM</a><a href="mailto:sales@chriswilliamsart.com">SALES@CHRISWILLIAMSART.COM</a><a href="mailto:press@chriswilliamsart.com">PRESS@CHRISWILLIAMSART.COM</a></div><div><a href="tel:+442079460318">+44 (0)20 7946 0318</a><p>ENDI JAUBASHI, DIRECTOR</p></div></div></main>;
}

function WorkView({work,back}) {
  return <main className="work-view view-enter"><a className="detail-image" href={`#${back}`} aria-label="Back to the gallery">{work.image?<img src={work.image} alt={`${work.title} by ${artists[work.artist].name}`} width={work.width} height={work.height}/>:<div className="reference-unavailable"><span>{work.title}</span><p>This painting’s image is not shown in the supplied recordings.</p></div>}</a><div className="work-description"><div><h1>{work.title}</h1><p>{artists[work.artist].name}</p></div><a href={`#${back}`}>back to the gallery</a></div></main>;
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
  const route=useRoute();
  const lastView=useRef('/');
  const listSelection=useRef(1);
  const position=useRef({x:0,y:0});
  const vortexPosition=useRef({phase:0,spin:0});
  const [progress,setProgress]=useState(0);
  const [ready,setReady]=useState(false);
  const [sound,toggleSound]=useSound();
  const detail=works.find(work=>work.route===route);
  const isField=route==='/field';
  const isVortex=route==='/'||route==='/vortex';
  const isGallery=isField||isVortex;
  const isList=route==='/list';
  const unknown=!isGallery&&!isList&&!detail&&!['/about','/contacts'].includes(route);
  const onProgress=useCallback(value=>setProgress(value),[]);
  useEffect(()=>{if(progress>=1)setReady(true)},[progress]);
  useEffect(()=>{
    if(isGallery||isList)lastView.current=route;
    const titles={'/':'Endi Jaubashi Art Gallery','/field':'Artwork field','/vortex':'Vortex gallery','/list':'Index of works','/about':'About','/contacts':'Contacts'};
    document.title=route==='/' ? 'Endi Jaubashi Art Gallery' : `${detail?detail.title:titles[route]||'Page not found'} | Endi Jaubashi Art Gallery`;
    window.scrollTo(0,0);
    const key=e=>{if(e.key==='Escape'&&detail)location.hash=lastView.current};
    window.addEventListener('keydown',key);return()=>window.removeEventListener('keydown',key);
  },[route,detail,isGallery,isList]);
  return <>
    <a className="skip-link" href="#main-content" onClick={e=>{e.preventDefault();document.getElementById('main-content')?.focus()}}>Skip to gallery content</a>
    <header className="site-header"><nav aria-label="Main navigation"><TextLink href="#/" active={isGallery||isList||!!detail}>gallery area</TextLink><TextLink href="#/about" active={route==='/about'}>about</TextLink><TextLink href="#/contacts" active={route==='/contacts'}>contacts</TextLink></nav><Logo/></header>
    <div id="main-content" tabIndex={-1} className={`page-content ${isGallery?'field-content':''}`}>
      {isField&&<Field position={position} onProgress={onProgress}/>}
      {isVortex&&<Vortex position={vortexPosition} onProgress={onProgress}/>}
      {isList&&<ListView selection={listSelection}/>}{route==='/about'&&<About/>}{route==='/contacts'&&<Contacts/>}
      {detail&&<WorkView work={detail} back={lastView.current}/>}
      {unknown&&<main className="not-found"><h1>Page not found</h1><a href="#/">back to the gallery</a></main>}
    </div>
    {isGallery&&!ready&&<div className="loading-screen" role="status" aria-label="Loading gallery">{Math.round(progress*100)}%</div>}
    <ReferenceBadges/>
    <footer className="site-footer"><a className="creator-credit" href="https://nklvdsgn.com" target="_blank" rel="noreferrer">created by nklvdsgn.com</a><nav className="view-switch" aria-label="Gallery view"><TextLink href="#/" active={isVortex||(!!detail&&['/','/vortex'].includes(lastView.current))}>Vortex</TextLink><TextLink href="#/field" active={isField||(!!detail&&lastView.current==='/field')}>Field</TextLink><TextLink href="#/list" active={isList||(!!detail&&lastView.current==='/list')}>List</TextLink></nav><div className="footer-right"><button className={`sound-toggle ${sound?'is-playing':''}`} onClick={toggleSound} aria-label="Toggle ambient sound" aria-pressed={sound}><span className="sound-bars" aria-hidden="true">{[1,2,3,4,5].map(n=><i key={n}/>)}</span><span>sound</span></button><span>all rights reserved 2026</span></div></footer>
    <Cursor detail={!!detail} contact={route==='/contacts'}/>
  </>;
}

createRoot(document.getElementById('root')).render(<App/>);
