import React from "react";
import Slider from "@react-native-community/slider";
export function BudgetSlider({value,onChange}:{value:number;onChange:(value:number)=>void}) {
  return <Slider accessibilityLabel="Budget maximum par séance" accessibilityValue={{min:20,max:300,now:value,text:`${value} euros`}} minimumValue={20} maximumValue={300} step={5} value={value} onValueChange={onChange} minimumTrackTintColor="#141414" maximumTrackTintColor="#e5e5e5" thumbTintColor="#141414" style={{height:44}} />;
}
