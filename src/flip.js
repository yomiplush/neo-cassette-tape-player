// Keep the tape in the pocket plane while lifting; only cross to the front above the glass.
export async function flipCassette(options) {
  return serviceTape({...options,eject:false});
}
export async function ejectCassette(options) {
  return serviceTape({...options,eject:true});
}
async function serviceTape({element,nextSide,commit,signal,reducedMotion,eject}) {
  if(signal.aborted)return;
  if(reducedMotion){commit();return;}
  const pocket=element.closest('.deck-window');
  const {stage,object}=makeTapeBody(element,nextSide || element.querySelector('.tape-side').textContent);
  const wrapper=element.parentElement;
  const origin={left:wrapper.offsetLeft+element.offsetLeft,top:wrapper.offsetTop+element.offsetTop};
  const lift=origin.top+element.offsetHeight+16;
  const halfDepth=parseFloat(stage.style.getPropertyValue('--half-depth'));
  const pose=(y=0,z=0,turn=0)=>`translate3d(0,${y}px,${z-halfDepth}px) rotateY(${turn}deg)`;
  let animation,faceFrame=null;
  const front=object.querySelector(".flip-front"),back=object.querySelector(".flip-back");
  const showBack=value=>{front.style.visibility=value?"hidden":"visible";back.style.visibility=value?"visible":"hidden";};
  showBack(false);
  const cancel=()=>animation?.cancel();
  signal.addEventListener('abort',cancel,{once:true});
  const animate=async(frames,duration,turning=false)=>{
    if(signal.aborted)throw new DOMException('Aborted','AbortError');
    animation=object.animate(frames,{duration,easing:'ease-in-out',fill:'forwards'});
    if(turning){
      // Explicit face culling also works through flattened DOM ancestor contexts.
      const cull=()=>{showBack(animation.effect.getComputedTiming().progress>=.465);faceFrame=requestAnimationFrame(cull);};
      faceFrame=requestAnimationFrame(cull);
    }
    try {await animation.finished;}
    finally {if(faceFrame!==null)cancelAnimationFrame(faceFrame);faceFrame=null;}

  };
  const mountPocket=(turn=0)=>{
    pocket.append(stage);
    Object.assign(stage.style,{left:`${origin.left}px`,top:`${origin.top}px`,width:`${element.offsetWidth}px`,height:`${element.offsetHeight}px`});
    object.style.transform=pose(-lift,0,turn);
  };
  pocket.classList.add('tape-servicing');
  mountPocket();object.style.transform=pose();
  stage.dataset.phase='lifting';element.style.visibility='hidden';
  try {
    // No forward movement or rotation until the entire lower edge clears the glass.
    await animate([{transform:pose()},{transform:pose(-lift)}],520);
    const bounds=object.getBoundingClientRect();
    // Stay in the door's coordinate system: changing parents would discard its tilt.
    object.style.transform=pose(-lift);animation.cancel();
    stage.classList.add('tape-in-front');
    stage.dataset.phase=eject?'ejecting':'turning';
    const frontY=Math.max(60-bounds.top,0);
    await animate([{transform:pose(-lift)},{transform:pose(-lift,70),offset:.18},{transform:pose(-lift+frontY,70,eject?-20:180),opacity:eject?0:1,offset:.75},{transform:pose(-lift,70,eject?-20:180),opacity:eject?0:1,offset:.9},{transform:pose(-lift,0,eject?-20:180),opacity:eject?0:1}],eject?600:1000,!eject);
    if(signal.aborted)return;
    if(eject){commit();return;}
    showBack(true);commit();animation.cancel();
    // Move back behind the glass while still above it, then lower into the pocket.
    stage.classList.remove('tape-in-front');
    object.style.transform=pose(-lift,0,180);stage.dataset.phase='seating';
    await animate([{transform:pose(-lift,0,180)},{transform:pose(0,0,180)}],520);
  } catch(error) {if(!signal.aborted)throw error;}
  finally {
    signal.removeEventListener('abort',cancel);animation?.cancel();stage.remove();
    pocket.classList.remove('tape-servicing');element.style.visibility='';
  }
}

function makeTapeBody(element,nextSide) {
  const bounds=element.getBoundingClientRect(),stage=document.createElement("div"),object=document.createElement("div");
  stage.className="flip-stage";stage.setAttribute("aria-hidden","true");
  Object.assign(stage.style,{left:`${bounds.left}px`,top:`${bounds.top}px`,width:`${bounds.width}px`,height:`${bounds.height}px`});
  const depth=Math.max(14,Math.min(28,bounds.width*.085));stage.style.setProperty("--tape-depth",`${depth}px`);stage.style.setProperty("--half-depth",`${depth/2}px`);
  object.className="flip-object";
  for(const back of [false,true]) {
    const face=document.createElement("div");face.className=`flip-face ${back?"flip-back":"flip-front"}`;
    const tape=element.cloneNode(true);tape.style.setProperty("--tape-color",getComputedStyle(element).getPropertyValue("--tape-color"));
    if(back)tape.querySelector(".tape-side").textContent=nextSide;
    face.append(tape);object.append(face);
  }
  for(const side of ["top","bottom","left","right"]){const edge=document.createElement("div");edge.className=`flip-edge flip-edge-${side}`;object.append(edge);}
  stage.append(object);return{stage,object};
}
