import React, { useEffect, useRef, useState } from "react";
import { View, Text } from "react-native";
import { SvgXml } from "react-native-svg";
import { tokens as t } from "./tokens";
import { supabase } from "../lib/supabase";
import { Button, Field, H1, Note, P, TextButton } from "./ui";

/** Only the explicitly habilitated team sees this step. Never store the enrolment secret. */
export function TeamSecurity({
  onVerified,
}: {
  onVerified: () => Promise<unknown>;
}) {
  const [factor, setFactor] = useState(""),
    [qr, setQr] = useState(""),
    [secret, setSecret] = useState("");
  const [code, setCode] = useState(""),
    [manual, setManual] = useState(false),
    [busy, setBusy] = useState(true),
    [error, setError] = useState("");
  const alive = useRef(true),
    enrolled = useRef("");
  async function load() {
    setBusy(true);
    setError("");
    try {
      const { data, error } = await supabase.auth.mfa.listFactors();
      if (error) throw error;
      if (alive.current)
        setFactor(data.totp.find((f) => f.status === "verified")?.id ?? "");
    } catch {
      if (alive.current)
        setError("Impossible de vérifier votre accès. Réessayez.");
    } finally {
      if (alive.current) setBusy(false);
    }
  }
  useEffect(() => {
    alive.current = true;
    void load();
    return () => {
      alive.current = false;
      if (enrolled.current)
        void supabase.auth.mfa.unenroll({ factorId: enrolled.current });
    };
  }, []);
  async function enroll() {
    setBusy(true);
    setError("");
    try {
      const { data, error } = await supabase.auth.mfa.enroll({
        factorType: "totp",
        friendlyName: "Partant équipe " + Date.now(),
      });
      if (error) throw error;
      if (!alive.current) {
        void supabase.auth.mfa.unenroll({ factorId: data.id });
        return;
      }
      enrolled.current = data.id;
      setFactor(data.id);
      setSecret(data.totp.secret);
      const raw = data.totp.qr_code.replace(/^data:image\/svg\+xml;utf-8,/, "");
      setQr(raw.startsWith("%") ? decodeURIComponent(raw) : raw);
    } catch {
      if (alive.current)
        setError("La configuration n’a pas abouti. Réessayez.");
    } finally {
      if (alive.current) setBusy(false);
    }
  }
  async function verify() {
    setBusy(true);
    setError("");
    try {
      const { error } = await supabase.auth.mfa.challengeAndVerify({
        factorId: factor,
        code,
      });
      if (error) throw error;
      enrolled.current = "";
      setSecret("");
      setQr("");
      setCode("");
      await onVerified();
    } catch {
      if (alive.current)
        setError(
          "Accès non confirmé. Vérifiez le code de votre application puis réessayez.",
        );
    } finally {
      if (alive.current) setBusy(false);
    }
  }
  return (
    <View
      style={{
        padding: 24,
        maxWidth: 560,
        width: "100%",
        alignSelf: "center",
        gap: 20,
      }}
      testID="team-security"
    >
      <H1>Votre accès équipe.</H1>
      <P muted>
        Confirmez votre identité avec une application d’authentification avant
        de consulter les dossiers.
      </P>
      {qr && (
        <>
          <P>
            Ajoutez Partant dans votre application d’authentification en
            scannant ce code.
          </P>
          <SvgXml xml={qr} width={220} height={220} />
          <TextButton onPress={() => setManual(!manual)}>
            Configurer avec une clé à saisir
          </TextButton>
          {manual && (
            <Text
              selectable
              style={{ fontFamily: t.font, fontSize: 16, color: t.ink }}
            >
              {secret}
            </Text>
          )}
        </>
      )}
      {!!factor && (
        <Field
          label="Code de l’application d’authentification"
          value={code}
          numeric
          onChange={(v) => setCode(v.replace(/\D/g, "").slice(0, 6))}
        />
      )}
      {!!error && <Note>{error}</Note>}
      <Button
        disabled={busy || (!!factor && code.length !== 6)}
        onPress={() => void (factor ? verify() : enroll())}
      >
        {busy
          ? "Vérification…"
          : factor
            ? "Accéder à mon espace"
            : "Configurer mon accès sécurisé"}
      </Button>
      {!!factor && !qr && (
        <P small muted>
          Si vous n’avez plus accès à votre application d’authentification,
          contactez la personne qui gère les accès de votre équipe.
        </P>
      )}
      {!!error && !factor && (
        <TextButton onPress={() => void load()}>Vérifier à nouveau</TextButton>
      )}
    </View>
  );
}
