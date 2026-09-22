import React, { useEffect, useState } from "react";
import { View } from "react-native";
import { Button, Dialog, Field, P, Select, Setting, TextButton } from "./ui";
import {
  addressSectors,
  departments,
  localSectors,
  SectorOption,
} from "./sectors";
export function SectorSearch({
  value,
  onChange,
  suggestedAddress,
}: {
  value: string;
  onChange: (value: string) => void;
  suggestedAddress?: string;
}) {
  const [query, setQuery] = useState("");
  const [department, setDepartment] = useState("");
  const [limit, setLimit] = useState(10);
  const [remote, setRemote] = useState<SectorOption[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [suggested, setSuggested] = useState<SectorOption | null>(null);
  useEffect(() => {
    const controller = new AbortController();
    setRemote([]);
    setError("");
    setBusy(false);
    if (query.trim().length < 3) return () => controller.abort();
    const timer = setTimeout(() => {
      setBusy(true);
      addressSectors(query, controller.signal)
        .then((rows) => {
          if (!controller.signal.aborted) setRemote(rows);
        })
        .catch(() => {
          if (!controller.signal.aborted)
            setError(
              "Recherche d’adresses indisponible. Les communes restent sélectionnables ci-dessous.",
            );
        })
        .finally(() => {
          if (!controller.signal.aborted) setBusy(false);
        });
    }, 350);
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [query]);
  const rows = localSectors(query, department);
  return (
    <>
      {!!value && (
        <P small muted style={{ marginBottom: 12 }}>
          Secteur actuel · {value}
        </P>
      )}
      <Field
        label="Ville, quartier, code postal ou adresse"
        placeholder="Paris 11e, Montreuil, 78000…"
        value={query}
        onChange={(q) => {
          setQuery(q);
          setLimit(10);
        }}
      />
      {!!suggestedAddress && (
        <TextButton
          onPress={async () => {
            setError("");
            setBusy(true);
            try {
              const rows = await addressSectors(suggestedAddress);
              setSuggested(rows[0] ?? null);
              if (!rows.length)
                setError("Précisez la ville ou le code postal de votre lieu.");
            } catch {
              setError(
                "Impossible de retrouver ce secteur. Recherchez votre commune ci-dessus.",
              );
            } finally {
              setBusy(false);
            }
          }}
        >
          Proposer le secteur de mon lieu de séance
        </TextButton>
      )}
      {suggested && (
        <Setting
          title={suggested.value}
          description="D’après votre lieu de séance · à confirmer"
          onPress={() => onChange(suggested.value)}
        />
      )}
      <Select
        label="Département"
        value={department}
        items={[
          ["", "Toute l’Île-de-France"],
          ...Object.entries(departments).map(
            ([id, name]) => [id, `${id} · ${name}`] as [string, string],
          ),
        ]}
        onChange={(d) => {
          setDepartment(d);
          setLimit(10);
        }}
      />
      {busy && (
        <P small muted>
          Recherche…
        </P>
      )}
      {!!error && (
        <P small muted>
          {error}
        </P>
      )}
      {remote
        .filter(
          (r) =>
            !department ||
            (department === "75"
              ? r.value.startsWith("Paris")
              : r.value.endsWith(`· ${department}`)),
        )
        .map((r, i) => (
          <Setting
            key={`${r.label}:${i}`}
            title={r.label}
            description={r.detail}
            onPress={() => onChange(r.value)}
          />
        ))}
      {rows.slice(0, limit).map((r) => (
        <Setting
          key={r.value}
          title={r.label}
          description={r.detail}
          onPress={() => onChange(r.value)}
        />
      ))}
      {!busy && !rows.length && !remote.length && (
        <P muted>
          Aucun secteur trouvé. Essayez le nom de la commune ou son code postal.
        </P>
      )}
      {rows.length > limit && (
        <TextButton onPress={() => setLimit(limit + 20)}>
          Afficher plus de secteurs
        </TextButton>
      )}
      <P small muted style={{ marginTop: 16 }}>
        Seul le secteur est retenu ici, pas votre adresse précise.
      </P>
    </>
  );
}
export function SectorPicker(props: {
  value: string;
  onChange: (value: string) => void;
  suggestedAddress?: string;
}) {
  const [open, setOpen] = useState(false);
  return (
    <View style={{ marginBottom: 20 }}>
      <P small bold style={{ marginBottom: 8 }}>
        Quartier / secteur
      </P>
      <Button light icon="pin" onPress={() => setOpen(true)}>
        {props.value || "Choisir mon secteur"}
      </Button>
      <Dialog title="Votre secteur" open={open} onClose={() => setOpen(false)}>
        {open && (
          <SectorSearch
            {...props}
            onChange={(value) => {
              props.onChange(value);
              setOpen(false);
            }}
          />
        )}
      </Dialog>
    </View>
  );
}
