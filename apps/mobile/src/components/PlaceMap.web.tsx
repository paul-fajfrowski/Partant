import React from "react";
import { osmUrl, Place } from "../lib/geo";
export default function PlaceMap({ place }: { place: Place }) {
  return (
    <iframe
      title={`Carte : ${place.label}`}
      src={osmUrl(place)}
      loading="lazy"
      style={{ width: "100%", height: 260, border: 0, borderRadius: 24 }}
    />
  );
}
