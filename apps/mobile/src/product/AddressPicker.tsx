import React, { useEffect, useState } from "react";
import { View } from "react-native";
import { searchAddresses, Place } from "../lib/geo";
import { Field, P, Setting } from "./ui";
export function AddressPicker({
  label,
  value,
  onChange,
  onSelect,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  onSelect: (p: Place) => void;
}) {
  const [rows, setRows] = useState<Place[]>([]),
    [error, setError] = useState(""),
    [query, setQuery] = useState("");
  useEffect(() => {
    const c = new AbortController();
    const timer = setTimeout(() => {
      if (query.length < 3) {
        setRows([]);
        return;
      }
      searchAddresses(query, c.signal)
        .then((r) => {
          setRows(r);
          setError("");
        })
        .catch((e) => {
          if (!c.signal.aborted) setError(e.message);
        });
    }, 350);
    return () => {
      c.abort();
      clearTimeout(timer);
    };
  }, [query]);
  return (
    <View>
      <Field
        label={label}
        value={value}
        onChange={(v) => {
          onChange(v);
          setQuery(v);
        }}
      />
      {rows.map((p) => (
        <Setting
          key={p.label}
          title={p.label}
          onPress={() => {
            onSelect(p);
            setQuery("");
            setRows([]);
          }}
        />
      ))}
      {error ? (
        <P small muted>
          {error}
        </P>
      ) : null}
    </View>
  );
}
