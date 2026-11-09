// DOM geometry keeps the existing buttons as actual, clickable front-face controls.
export function createCaseModel({player, device, icon, isBusy, getBudget = () => ({fps:30})}) {
  device.querySelectorAll(".device-top,.device-bottom,.device-shadow").forEach(node=>node.remove());
  const object = document.createElement('div');
  object.className = 'case-object';
  object.dataset.rotated = 'false';
  player.before(object); object.append(player);
  player.classList.add('case-front');
  const glint=document.createElement('div');glint.className='case-glint';glint.setAttribute('aria-hidden','true');player.append(glint);
  const back = document.createElement('div');
  back.className = 'case-back';
  back.setAttribute('aria-hidden','true');
  back.innerHTML = '<div class="back-clip"></div><div class="back-brand">NEO <small>NC-85 / PERSONAL STEREO</small></div><div class="back-plate">A SMALL TRIP BACK.<br>DESIGNED FOR SLOW LISTENING.<br><span>3V DC · TWO AA CELLS · NO. 008519</span></div><div class="battery-cover"><i></i><i></i><i></i><span>BATTERY / SLIDE TO OPEN</span></div><i class="back-screw one"></i><i class="back-screw two"></i>';
  object.append(back);
  for(const side of ['left','right','top','bottom']) {
    const face=document.createElement('div');face.className=`case-side case-side-${side}`;face.setAttribute('aria-hidden','true');
    if(side==='top') face.innerHTML='<i class="case-jack"></i><span>PHONES</span><i class="case-jack small"></i>';
    if(side==='right') face.innerHTML='<i class="side-wheel"></i><span>VOLUME</span>';
    object.append(face);
  }
  const view=document.createElement('div');view.className='case-view-controls';
  view.innerHTML=`<button class="case-grip" aria-label="Rotate player" title="Turn 90 degrees, or drag. Arrow keys rotate; Home returns to front.">${icon('flip')}<span>TURN</span></button><button class="case-home" aria-label="Return player to front">${icon('arrow')}<span>FRONT</span></button>`;
  device.prepend(view);
  const grip=view.querySelector('.case-grip'), reset=view.querySelector('.case-home');
  // The stationary toolbar may live beside the scaled model, keeping native hit targets.
  const listen=(type,handler,options)=>{
    device.addEventListener(type,handler,options);
    view.addEventListener(type,event=>{if(!device.contains(view))handler(event);},options);
  };
  let yaw=0,pitch=0,gesture=null,suppressUntil=0,frame=null,lastPaint=0;
  const faces = {front:player,back,left:object.querySelector('.case-side-left'),right:object.querySelector('.case-side-right'),top:object.querySelector('.case-side-top'),bottom:object.querySelector('.case-side-bottom')};
  let sizingFrame=null;
  const depth = () => {
    const auto = device.dataset.model === 'auto';
    const size = Math.max(auto ? 48 : 50, Math.min(auto ? 88 : 96, object.offsetWidth * (auto ? .16 : .19)));
    if(device.style.getPropertyValue('--case-depth')===`${size}px`)return;
    object.classList.add('case-sizing');
    device.style.setProperty('--case-depth',`${size}px`);
    device.style.setProperty('--case-half-depth',`${size/2}px`);
    object.getBoundingClientRect();
    if(sizingFrame!==null)cancelAnimationFrame(sizingFrame);
    sizingFrame=requestAnimationFrame(()=>{object.classList.remove('case-sizing');sizingFrame=null;});
  };
  new ResizeObserver(depth).observe(object);
  const setVariant = model => {device.dataset.model=model === 'auto'?'auto':'manual';depth();};
  const cull = () => {
    const y=yaw*Math.PI/180,x=pitch*Math.PI/180;
    const visibility={front:Math.cos(y)*Math.cos(x),back:-Math.cos(y)*Math.cos(x),left:Math.sin(y)*Math.cos(x),right:-Math.sin(y)*Math.cos(x),top:-Math.sin(x),bottom:Math.sin(x)};
    for(const [name,face] of Object.entries(faces))face.style.visibility=visibility[name]>.001?'visible':'hidden';
  };
  let previousYaw=0,previousPitch=0;
  object.addEventListener('transitionend',event=>{if(event.target===object && event.propertyName==='transform')cull();});
  const paint=()=>{
    object.style.setProperty('--light-x',`${50+42*Math.sin(yaw*Math.PI/180)}%`);
    object.style.setProperty('--light-y',`${25+40*Math.sin(pitch*Math.PI/180)}%`);
    object.style.setProperty('--light-angle',`${115+yaw*.35+pitch*.3}deg`);
    object.style.setProperty('--case-yaw',`${yaw}deg`);object.style.setProperty('--case-pitch',`${pitch}deg`);
    const turned=Math.abs(yaw%360)>.1 || Math.abs(pitch)>.1;
    object.dataset.rotated=String(turned);reset.disabled=!turned;
    const changed=previousYaw!==yaw || previousPitch!==pitch;
    previousYaw=yaw;previousPitch=pitch;
    if(changed && !object.classList.contains('case-moving') && !matchMedia('(prefers-reduced-motion: reduce)').matches){
      // During a compositor turn, CSS backface culling follows the interpolated pose.
      for(const face of Object.values(faces))face.style.visibility='visible';
    } else cull();
    grip.setAttribute('aria-description',`Rotation ${Math.round(yaw)} degrees. Use arrow keys to rotate or Home to return.`);
  };
  const schedulePaint = () => {
    if(frame !== null)return;
    const tick = now => {
      if(now-lastPaint < 1000/getBudget().fps){frame=requestAnimationFrame(tick);return;}
      frame=null;lastPaint=now;paint();
    };
    frame=requestAnimationFrame(tick);
  };
  const flush = () => {if(frame!==null)cancelAnimationFrame(frame);frame=null;paint();};
  const home=({animate=true}={})=>{
    if(!animate) object.classList.add('case-moving');
    yaw=0;pitch=0;flush();
    if(!animate) requestAnimationFrame(()=>{if(!gesture)object.classList.remove('case-moving');});
  };
  reset.addEventListener('click',()=>home());
  listen('pointerdown',event=>{
    suppressUntil=0;
    if(!event.isPrimary || event.button!==0 || isBusy())return;
    const interactive=event.target.closest('button,input,select,a,label');
    if(interactive && !interactive.matches('.window-latch,.case-grip'))return;
    if(!event.target.closest('.case-object,.case-grip'))return;
    gesture={id:event.pointerId,x:event.clientX,y:event.clientY,yaw,pitch,dragging:false};
  });
  listen('pointermove',event=>{
    if(!gesture || event.pointerId!==gesture.id)return;
    const dx=event.clientX-gesture.x,dy=event.clientY-gesture.y;
    if(!gesture.dragging && Math.hypot(dx,dy)<8)return;
    if(!gesture.dragging){gesture.dragging=true;device.setPointerCapture(event.pointerId);object.classList.add('case-moving');}
    event.preventDefault();
    yaw=gesture.yaw+dx*.55;pitch=Math.max(-65,Math.min(65,gesture.pitch-dy*.4));schedulePaint();
  });
  const release=event=>{
    if(!gesture || event.pointerId!==gesture.id)return;
    if(gesture.dragging)suppressUntil=performance.now()+350;
    if(device.hasPointerCapture(event.pointerId))device.releasePointerCapture(event.pointerId);
    gesture=null;flush();object.classList.remove('case-moving');
  };
  listen('pointerup',release);listen('pointercancel',release);
  listen('click',event=>{
    if(event.detail!==0 && performance.now()<suppressUntil){event.preventDefault();event.stopImmediatePropagation();}
  },true);
  grip.addEventListener('click',()=>{if(!isBusy()){yaw+=90;paint();}});
  grip.addEventListener('keydown',event=>{
    if(!['ArrowLeft','ArrowRight','ArrowUp','ArrowDown','Home'].includes(event.key))return;
    event.preventDefault();event.stopPropagation();if(isBusy())return;
    if(event.key==='Home')home();
    else {yaw+=event.key==='ArrowLeft'?-20:event.key==='ArrowRight'?20:0;pitch=Math.max(-65,Math.min(65,pitch+(event.key==='ArrowUp'?15:event.key==='ArrowDown'?-15:0)));paint();}
  });
  paint();setVariant(device.dataset.model);
  return {home,setVariant};
}
