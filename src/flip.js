// A temporary two-sided tape lifts out of the door; the transport changes at edge-on.
export async function flipCassette({
  element,
  nextSide,
  commit,
  signal,
  reducedMotion,
}) {
  if (signal.aborted) return;
  if (reducedMotion) {
    commit();
    return;
  }
  const {stage,object} = makeTapeBody(element,nextSide);
  document.body.append(stage); element.style.visibility="hidden";
  const duration = 1250;
  const animation = object.animate(
    [
      {
        transform:
          "perspective(900px) translate3d(0,0,0) rotateX(0deg) rotateY(0deg) rotateZ(0deg)",
        offset: 0,
      },
      {
        transform:
          "perspective(900px) translate3d(-6px,-58px,70px) rotateX(-22deg) rotateY(35deg) rotateZ(-6deg)",
        offset: 0.25,
      },
      {
        transform:
          "perspective(900px) translate3d(0,-72px,90px) rotateX(-18deg) rotateY(96deg) rotateZ(-3deg)",
        offset: 0.5,
      },
      {
        transform:
          "perspective(900px) translate3d(5px,-40px,50px) rotateX(-7deg) rotateY(164deg) rotateZ(3deg)",
        offset: 0.76,
      },
      {
        transform:
          "perspective(900px) translate3d(0,0,0) rotateX(0deg) rotateY(180deg) rotateZ(0deg)",
        offset: 1,
      },
    ],
    { duration, easing: "cubic-bezier(.4,0,.2,1)", fill: "forwards" },
  );
  let turned = false;
  const turn = () => {
    if (!turned && !signal.aborted) {
      turned = true;
      commit();
    }
  };
  const timer = setTimeout(turn, duration / 2);
  const cancel = () => animation.cancel();
  signal.addEventListener("abort", cancel, { once: true });
  try {
    await animation.finished;
    turn();
  } catch (error) {
    if (!signal.aborted) throw error;
  } finally {
    clearTimeout(timer);
    signal.removeEventListener("abort", cancel);
    animation.cancel();
    stage.remove();
    element.style.visibility = "";
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
export async function ejectCassette({element,commit,signal,reducedMotion}) {
  if(signal.aborted)return;if(reducedMotion){commit();return;}
  const{stage,object}=makeTapeBody(element,element.querySelector(".tape-side").textContent);
  document.body.append(stage);element.style.visibility="hidden";
  const animation=object.animate([
    {transform:"perspective(900px) translate3d(0,0,0) rotateX(0deg) rotateY(0deg)",opacity:1},
    {transform:"perspective(900px) translate3d(0,-60px,80px) rotateX(-16deg) rotateY(-24deg)",opacity:1,offset:.6},
    {transform:"perspective(900px) translate3d(75px,-110px,60px) rotateX(-10deg) rotateY(-38deg)",opacity:0}
  ],{duration:650,easing:"cubic-bezier(.3,0,.2,1)",fill:"forwards"});
  const cancel=()=>animation.cancel();signal.addEventListener("abort",cancel,{once:true});
  try{await animation.finished;if(!signal.aborted)commit();}catch(e){if(!signal.aborted)throw e;}
  finally{signal.removeEventListener("abort",cancel);animation.cancel();stage.remove();element.style.visibility="";}
}
