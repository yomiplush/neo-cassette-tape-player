// DOM geometry keeps the existing buttons as actual, clickable front-face controls.
export function createCaseModel({player, device, icon, isBusy}) {
  const object = document.createElement('div');
  object.className = 'case-object';
  object.dataset.rotated = 'false';
  player.before(object); object.append(player);
  player.classList.add('case-front');
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
  view.innerHTML=`<button class="case-grip" aria-label="Rotate player" title="Drag to turn. Arrow keys rotate; Home returns to front.">${icon('flip')}<span>DRAG TO TURN</span></button><button class="case-home" aria-label="Return player to front" hidden>${icon('arrow')}<span>FRONT</span></button>`;
  device.append(view);
  const grip=view.querySelector('.case-grip'), reset=view.querySelector('.case-home');
  let yaw=0,pitch=0,gesture=null,suppressUntil=0;
  const paint=()=>{
    object.style.setProperty('--case-yaw',`${yaw}deg`);object.style.setProperty('--case-pitch',`${pitch}deg`);
    const turned=Math.abs(yaw%360)>.1 || Math.abs(pitch)>.1;
    object.dataset.rotated=String(turned);reset.hidden=!turned;
    grip.setAttribute('aria-description',`Rotation ${Math.round(yaw)} degrees. Use arrow keys to rotate or Home to return.`);
  };
  const home=({animate=true}={})=>{
    if(!animate) object.classList.add('case-moving');
    yaw=0;pitch=0;paint();
    if(!animate) requestAnimationFrame(()=>{if(!gesture)object.classList.remove('case-moving');});
  };
  reset.addEventListener('click',()=>home());
  device.addEventListener('pointerdown',event=>{
    suppressUntil=0;
    if(!event.isPrimary || event.button!==0 || isBusy())return;
    const interactive=event.target.closest('button,input,select,a,label');
    if(interactive && !interactive.matches('.window-latch,.case-grip'))return;
    if(!event.target.closest('.case-object,.case-grip'))return;
    gesture={id:event.pointerId,x:event.clientX,y:event.clientY,yaw,pitch,dragging:false};
  });
  device.addEventListener('pointermove',event=>{
    if(!gesture || event.pointerId!==gesture.id)return;
    const dx=event.clientX-gesture.x,dy=event.clientY-gesture.y;
    if(!gesture.dragging && Math.hypot(dx,dy)<8)return;
    if(!gesture.dragging){gesture.dragging=true;device.setPointerCapture(event.pointerId);object.classList.add('case-moving');}
    event.preventDefault();
    yaw=gesture.yaw+dx*.55;pitch=Math.max(-65,Math.min(65,gesture.pitch-dy*.4));paint();
  });
  const release=event=>{
    if(!gesture || event.pointerId!==gesture.id)return;
    if(gesture.dragging)suppressUntil=performance.now()+350;
    if(device.hasPointerCapture(event.pointerId))device.releasePointerCapture(event.pointerId);
    gesture=null;object.classList.remove('case-moving');
  };
  device.addEventListener('pointerup',release);device.addEventListener('pointercancel',release);
  device.addEventListener('click',event=>{
    if(event.detail!==0 && performance.now()<suppressUntil){event.preventDefault();event.stopImmediatePropagation();}
  },true);
  grip.addEventListener('click',()=>{if(!isBusy()){yaw+=30;paint();}});
  grip.addEventListener('keydown',event=>{
    if(!['ArrowLeft','ArrowRight','ArrowUp','ArrowDown','Home'].includes(event.key))return;
    event.preventDefault();event.stopPropagation();if(isBusy())return;
    if(event.key==='Home')home();
    else {yaw+=event.key==='ArrowLeft'?-20:event.key==='ArrowRight'?20:0;pitch=Math.max(-65,Math.min(65,pitch+(event.key==='ArrowUp'?15:event.key==='ArrowDown'?-15:0)));paint();}
  });
  return {home};
}
