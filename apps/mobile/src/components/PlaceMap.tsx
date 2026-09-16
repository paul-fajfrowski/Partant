import { WebView } from "react-native-webview";
import { osmUrl, Place } from "../lib/geo";
export default function PlaceMap({ place }: { place: Place }) {
  return (
    <WebView
      source={{ uri: osmUrl(place) }}
      style={{ height: 260, flex: 0, borderRadius: 24 }}
      applicationNameForUserAgent="PartantDevelopment/0.1"
    />
  );
}
