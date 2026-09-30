import React from "react";
/** Native HTML range supplies keyboard, value and focus semantics on the web. */
export function BudgetSlider({value,onChange}:{value:number;onChange:(value:number)=>void}) {
  return <input type="range" aria-label="Budget maximum par séance" aria-valuetext={`${value} euros`} min={20} max={300} step={5} value={value} onChange={e=>onChange(Number(e.currentTarget.value))} style={{display:"block",width:"100%",height:44,margin:0,accentColor:"#141414",cursor:"pointer"}} />;
}
