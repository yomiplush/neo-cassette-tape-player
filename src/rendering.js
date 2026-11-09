import {AdaptiveQuality} from './performance.js';

// Rendering budgets never drive the AudioContext clock or the cassette transport.
export function createAdaptiveRendering({override='auto',isActive=()=>false}={}) {
  const governor=new AdaptiveQuality({cores:navigator.hardwareConcurrency,memory:navigator.deviceMemory,saveData:navigator.connection?.saveData});
  const valid=['auto','low','medium','high'].includes(override)?override:'auto';
  governor.setOverride(valid);
  let frame=null,lastFrame=0,activeUntil=0,lastTier='',portable=false;
  const apply=()=>{
    if(portable){document.documentElement.dataset.frameRate="0";return;}
    const state=governor.state;
    if(state.tier===lastTier)return;
    lastTier=state.tier;
    const root=document.documentElement;
    root.dataset.quality=state.tier;root.dataset.renderScale=String(state.renderScale);root.dataset.frameRate=String(state.fps);
    for(const [variable,name] of [['--patina-texture','shell-patina'],['--metal-texture','exposed-metal'],['--scuff-texture','tape-scuffs']]){
      if(state.renderScale===1)root.style.removeProperty(variable);
      else root.style.setProperty(variable,`url("${import.meta.env.BASE_URL}textures/${name}-${state.renderScale*100}.webp")`);
    }
  };
  const sample=now=>{
    frame=null;
    if(document.hidden || portable){lastFrame=0;return;}
    if(lastFrame)governor.sample(now-lastFrame);
    lastFrame=now;apply();
    if(isActive() || now<activeUntil)frame=requestAnimationFrame(sample);
    else {lastFrame=0;governor.resetSamples();}
  };
  const wake=()=>{
    if(portable)return;
    activeUntil=performance.now()+4000;
    if(frame===null && !document.hidden){lastFrame=0;frame=requestAnimationFrame(sample);}
  };
  document.addEventListener('pointerdown',wake,{passive:true});
  document.addEventListener('keydown',wake,{passive:true});
  document.addEventListener('visibilitychange',()=>{
    if(frame!==null)cancelAnimationFrame(frame);frame=null;lastFrame=0;governor.resetSamples();
    if(!document.hidden)wake();
  });
  apply();
  return {get state(){return portable?{...governor.state,fps:0,uiInterval:160}:governor.state;},setPortable(value){portable=!!value;if(frame!==null)cancelAnimationFrame(frame);frame=null;lastFrame=0;lastTier="";governor.resetSamples();apply();if(!portable)wake();},wake,setOverride(value){governor.setOverride(value);apply();wake();}};
}
