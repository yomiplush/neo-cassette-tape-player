// CC0 microphone recordings and an offline-safe stochastic fallback.
// Electrical tape hiss is deliberately kept in audio.js, on a different bus.
const clips = ['press','stop','door-open','door-close','wind-forward','wind-reverse'];
export class MechanismSounds {
 constructor(ctx, output, noise) {
  this.ctx=ctx;this.output=output;this.buffers=new Map();this.mode='stopped';
  this.windEnvelope=ctx.createGain();this.windEnvelope.gain.value=0;this.windEnvelope.connect(output);
  this.fallback=ctx.createGain();this.fallback.gain.value=.25;
  const src=ctx.createBufferSource(), band=ctx.createBiquadFilter(), low=ctx.createBiquadFilter();
  src.buffer=noise;src.loop=true;band.type='bandpass';band.frequency.value=610;band.Q.value=.55;low.type='lowpass';low.frequency.value=4200;
  src.connect(band).connect(low).connect(this.fallback).connect(this.windEnvelope);src.start();
 }
 preload() {
  if (!this.loading) this.loading=Promise.all(clips.map(async name=>{
   const r=await fetch(`${import.meta.env.BASE_URL}sfx/${name}.wav`);if(!r.ok)throw new Error(`Mechanism asset: ${name}`);
   this.buffers.set(name,await this.ctx.decodeAudioData(await r.arrayBuffer()));
   if(this.isWinding() && name === (this.mode === "rewinding" ? "wind-reverse" : "wind-forward")) this.startLoop();
  })).catch(error=>{this.loading=null;throw error;});
  return this.loading;
 }
 isWinding(){return this.mode==='forwarding'||this.mode==='rewinding';}
 setMode(mode){
  if(this.mode===mode)return;this.mode=mode;
  if(this.isWinding())this.startLoop();else this.stopLoop();
 }
 startLoop(){
  const buffer=this.buffers.get(this.mode==='rewinding'?'wind-reverse':'wind-forward');
  this.stopLoop();
  if(!buffer){this.fallback.gain.setTargetAtTime(.25,this.ctx.currentTime,.04);return;}
  const source=this.ctx.createBufferSource(),gain=this.ctx.createGain();source.buffer=buffer;source.loop=true;gain.gain.value=0;
  source.connect(gain).connect(this.windEnvelope);source.start();gain.gain.setTargetAtTime(.7,this.ctx.currentTime,.08);
  this.fallback.gain.setTargetAtTime(0,this.ctx.currentTime,.08);this.loop={source,gain};this.position(this.fraction??.5);
 }
 stopLoop(){
  if(!this.loop)return;const {source,gain}=this.loop;this.loop=null;
  gain.gain.setTargetAtTime(0,this.ctx.currentTime,.025);source.stop(this.ctx.currentTime+.16);source.onended=()=>{source.disconnect();gain.disconnect();};
 }
 position(fraction){
  this.fraction=Math.max(0,Math.min(1,fraction));
  if(this.loop){const p=this.mode==='rewinding'?1-this.fraction:this.fraction;this.loop.source.playbackRate.setTargetAtTime(.96+.08*p,this.ctx.currentTime,.25);}
 }
 play(kind){
  const key={click:'press',seat:'press',door:'door-close'}[kind]||kind,buffer=this.buffers.get(key);
  if(!buffer)return false;
  const source=this.ctx.createBufferSource(),gain=this.ctx.createGain();source.buffer=buffer;gain.gain.value=key==='press'?.5:key==='stop'?.6:.7;
  source.connect(gain).connect(this.output);source.start();source.onended=()=>{source.disconnect();gain.disconnect();};return true;
 }
}
