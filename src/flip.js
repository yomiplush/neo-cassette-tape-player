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
  const bounds = element.getBoundingClientRect();
  const stage = document.createElement("div");
  stage.className = "flip-stage";
  stage.setAttribute("aria-hidden", "true");
  Object.assign(stage.style, {
    left: `${bounds.left}px`,
    top: `${bounds.top}px`,
    width: `${bounds.width}px`,
    height: `${bounds.height}px`,
  });
  const object = document.createElement("div");
  object.className = "flip-object";
  for (const back of [false, true]) {
    const face = document.createElement("div");
    face.className = `flip-face ${back ? "flip-back" : "flip-front"}`;
    const tape = element.cloneNode(true);
    tape.style.setProperty(
      "--tape-color",
      getComputedStyle(element).getPropertyValue("--tape-color"),
    );
    if (back) tape.querySelector(".tape-side").textContent = nextSide;
    face.append(tape);
    object.append(face);
  }
  stage.append(object);
  document.body.append(stage);
  element.style.visibility = "hidden";
  const duration = 1150;
  const animation = object.animate(
    [
      {
        transform:
          "perspective(900px) translate3d(0,0,0) rotateX(0deg) rotateY(0deg) rotateZ(0deg)",
        offset: 0,
      },
      {
        transform:
          "perspective(900px) translate3d(-6px,-58px,70px) rotateX(-14deg) rotateY(22deg) rotateZ(-6deg)",
        offset: 0.25,
      },
      {
        transform:
          "perspective(900px) translate3d(0,-72px,90px) rotateX(-10deg) rotateY(90deg) rotateZ(-3deg)",
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
