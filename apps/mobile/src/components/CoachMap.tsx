import React, { useMemo } from "react";
import { WebView } from "react-native-webview";
import { mapDocument, MapPoint } from "./mapDocument";
export default function CoachMap({
  points,
  onSelect,
}: {
  points: MapPoint[];
  onSelect: (id: string) => void;
}) {
  const html = useMemo(() => mapDocument(points), [JSON.stringify(points)]);
  return (
    <WebView
      source={{ html, baseUrl: "https://partant.local" }}
      style={{ height: 360, flex: 0, borderRadius: 24 }}
      applicationNameForUserAgent="PartantDevelopment/0.1"
      onMessage={(e) => {
        try {
          const m = JSON.parse(e.nativeEvent.data);
          if (m.type === "partant-map" && points.some((p) => p.id === m.id))
            onSelect(m.id);
        } catch {}
      }}
    />
  );
}
