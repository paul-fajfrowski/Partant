import React, { useEffect, useMemo, useRef } from "react";
import { mapDocument, MapPoint } from "./mapDocument";
export default function CoachMap({
  points,
  onSelect,
}: {
  points: MapPoint[];
  onSelect: (id: string) => void;
}) {
  const frame = useRef<HTMLIFrameElement>(null),
    html = useMemo(() => mapDocument(points), [JSON.stringify(points)]);
  useEffect(() => {
    const receive = (e: MessageEvent) => {
      if (e.source !== frame.current?.contentWindow) return;
      try {
        const m = JSON.parse(e.data);
        if (m.type === "partant-map" && points.some((p) => p.id === m.id))
          onSelect(m.id);
      } catch {}
    };
    window.addEventListener("message", receive);
    return () => window.removeEventListener("message", receive);
  }, [points, onSelect]);
  return (
    <iframe
      ref={frame}
      title="Coachs autour de vous"
      srcDoc={html}
      sandbox="allow-scripts allow-popups"
      style={{ width: "100%", height: 360, border: 0, borderRadius: 24 }}
    />
  );
}
