export const skins = [
  {id:'harbor',name:'Harbor Blue'},
  {id:'silver',name:'Silver Line'},
  {id:'midnight',name:'Midnight Graphite'},
  {id:'signal',name:'Signal Red'},
  {id:'ivory',name:'Ivory Studio'},
];
export function applySkin(device,id) {
  const skin=skins.some(s=>s.id===id)?id:'harbor';
  device.dataset.skin=skin;
  return skin;
}
