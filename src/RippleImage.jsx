import React, { useRef, useEffect } from 'react';

// A small, local WebGL effect recreates the liquid response visible on hover.
// The regular image remains the fallback and accessible content.
export default function RippleImage({ work }) {
  const canvas = useRef(null);
  const image = useRef(null);
  const renderer = useRef(null);
  const frame = useRef(null);
  const strength = useRef(0);
  const mouse = useRef([0.5,0.5]);
  const lastMove = useRef(0);

  useEffect(()=>()=>{
    cancelAnimationFrame(frame.current);
    const state=renderer.current;
    if(state){state.gl.deleteTexture(state.texture);state.gl.deleteBuffer(state.buffer);state.gl.deleteProgram(state.program);}
    renderer.current=null;
  },[]);

  function initialize() {
    if(renderer.current) return true;
    if(!image.current.complete || !image.current.naturalWidth) return false;
    const gl=canvas.current.getContext('webgl',{alpha:true,antialias:false,premultipliedAlpha:false});
    if(!gl) return false;
    function shader(type,source){
      const shader=gl.createShader(type);gl.shaderSource(shader,source);gl.compileShader(shader);
      if(!gl.getShaderParameter(shader,gl.COMPILE_STATUS)){gl.deleteShader(shader);return null}return shader;
    }
    const vertex=shader(gl.VERTEX_SHADER,`attribute vec2 aPosition;varying vec2 vUv;void main(){vUv=vec2((aPosition.x+1.0)*0.5,1.0-(aPosition.y+1.0)*0.5);gl_Position=vec4(aPosition,0.,1.);}`);
    const fragment=shader(gl.FRAGMENT_SHADER,`precision mediump float;varying vec2 vUv;uniform sampler2D uImage;uniform vec2 uMouse;uniform float uTime;uniform float uStrength;uniform float uAspect;void main(){vec2 d=vUv-uMouse;float dist=length(d*vec2(uAspect,1.0));float falloff=exp(-dist*dist/0.025);float wave=sin(dist*65.0-uTime*7.0)*falloff*uStrength;vec2 dir=d/(length(d)+0.0001);vec2 offset=dir*wave*0.012;vec2 uv=clamp(vUv+offset,0.001,0.999);float fringe=falloff*uStrength*0.0018;gl_FragColor=vec4(texture2D(uImage,uv+vec2(fringe,0.)).r,texture2D(uImage,uv).g,texture2D(uImage,uv-vec2(fringe,0.)).b,1.0);}`);
    if(!vertex||!fragment)return false;
    const program=gl.createProgram();gl.attachShader(program,vertex);gl.attachShader(program,fragment);gl.linkProgram(program);
    gl.deleteShader(vertex);gl.deleteShader(fragment);
    if(!gl.getProgramParameter(program,gl.LINK_STATUS))return false;
    gl.useProgram(program);
    const buffer=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,buffer);gl.bufferData(gl.ARRAY_BUFFER,new Float32Array([-1,-1,1,-1,-1,1,1,1]),gl.STATIC_DRAW);
    const attribute=gl.getAttribLocation(program,'aPosition');gl.enableVertexAttribArray(attribute);gl.vertexAttribPointer(attribute,2,gl.FLOAT,false,0,0);
    const texture=gl.createTexture();gl.bindTexture(gl.TEXTURE_2D,texture);
    gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.LINEAR);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,gl.CLAMP_TO_EDGE);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE);
    gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,gl.RGBA,gl.UNSIGNED_BYTE,image.current);
    renderer.current={gl,program,buffer,texture,mouse:gl.getUniformLocation(program,'uMouse'),time:gl.getUniformLocation(program,'uTime'),strength:gl.getUniformLocation(program,'uStrength'),aspect:gl.getUniformLocation(program,'uAspect')};
    return true;
  }

  function render(time) {
    const state=renderer.current;
    if(!state)return;
    const rect=canvas.current.getBoundingClientRect();
    const ratio=Math.min(devicePixelRatio||1,1.5);
    const width=Math.round(rect.width*ratio),height=Math.round(rect.height*ratio);
    if(canvas.current.width!==width||canvas.current.height!==height){canvas.current.width=width;canvas.current.height=height;state.gl.viewport(0,0,width,height)}
    if(time-lastMove.current>80)strength.current*=0.93;
    const gl=state.gl;
    gl.uniform2f(state.mouse,...mouse.current);gl.uniform1f(state.time,time/1000);gl.uniform1f(state.strength,strength.current);gl.uniform1f(state.aspect,rect.width/rect.height);
    gl.drawArrays(gl.TRIANGLE_STRIP,0,4);
    if(strength.current>0.01)frame.current=requestAnimationFrame(render);
    else{frame.current=null;canvas.current.style.opacity='0';}
  }

  function move(event) {
    if(event.pointerType==='touch'||matchMedia('(prefers-reduced-motion: reduce)').matches)return;
    if(!initialize())return;
    const rect=event.currentTarget.getBoundingClientRect();
    mouse.current=[(event.clientX-rect.left)/rect.width,(event.clientY-rect.top)/rect.height];
    lastMove.current=performance.now();strength.current=1;
    canvas.current.style.opacity='1';
    if(!frame.current)frame.current=requestAnimationFrame(render);
  }

  return <span className="ripple-image" onPointerMove={move} onPointerLeave={()=>{lastMove.current=0}}><img ref={image} src={work.image} alt={work.title} draggable="false" width={work.width} height={work.height}/><canvas ref={canvas} aria-hidden="true"/></span>;
}
