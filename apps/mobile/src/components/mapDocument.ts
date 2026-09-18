// Leaflet assets are bundled locally; only map tiles require network access.
import { leafletJs, leafletCss } from "./mapAssets";
export type MapPoint = {
  id: string;
  latitude: number;
  longitude: number;
  label: string;
  name: string;
};
export function mapDocument(points: MapPoint[]) {
  const data = JSON.stringify(points).replace(/</g, "\\u003c");
  return `<!doctype html><html><head><meta name="viewport" content="width=device-width,initial-scale=1"><style>${leafletCss}html,body,#map{height:100%;margin:0} .price{background:#fff;color:#141414;border:1px solid #141414;border-radius:99px;padding:8px 12px;font:bold 14px Arial;white-space:nowrap;display:inline-block}.leaflet-control-attribution{font-size:10px}</style></head><body><div id="map"></div><script>${leafletJs}</script><script>
 const points=${data}; const map=L.map('map',{scrollWheelZoom:false}).setView([48.8566,2.3522],11);
 L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png',{maxZoom:19,attribution:'© <a href="https://www.openstreetmap.org/copyright" target="_blank">OpenStreetMap</a>'}).addTo(map);
 points.forEach(p=>{const el=document.createElement('span');el.className='price';el.textContent=p.label;const marker=L.marker([p.latitude,p.longitude],{title:p.name,icon:L.divIcon({className:'',html:el,iconSize:null})}).addTo(map);marker.on('click',()=>{const message=JSON.stringify({type:'partant-map',id:p.id});if(window.ReactNativeWebView)window.ReactNativeWebView.postMessage(message);else parent.postMessage(message,'*');});});
 if(points.length)map.fitBounds(points.map(p=>[p.latitude,p.longitude]),{padding:[45,45],maxZoom:14});
 </script></body></html>`;
}
