// Presentation only: switching renderers never touches the audio or transport state.
export function setupPortable({button,preferred=false,isBusy=()=>false,onChange}) {
  const devices=matchMedia('(max-width:1024px)');
  let preference=preferred===true,active=false;
  const apply=()=>{
    active=devices.matches && preference;
    document.documentElement.dataset.portable=String(active);
    button.hidden=!devices.matches;
    button.setAttribute('aria-checked',String(active));
    onChange({active,preferred:preference});
    document.dispatchEvent(new Event('portablechange'));
  };
  button.addEventListener('click',()=>{if(isBusy() || !devices.matches)return;preference=!preference;apply();});
  devices.addEventListener('change',apply);
  apply();
  return {get active(){return active;}};
}
