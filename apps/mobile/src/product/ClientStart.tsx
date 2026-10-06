import React from "react";
import { View } from "react-native";
import { Button, H1, P, Select, TextButton } from "./ui";
import reference from "../reference/prototype.json";
export function ClientStart({
  sport,
  city,
  onSport,
  onSector,
  onDone,
}: {
  sport: string;
  city: string;
  onSport: (s: string) => void;
  onSector: () => void;
  onDone: () => void;
}) {
  return (
    <View>
      <H1>Votre sport.{"\n"}Près de vous.</H1>
      <P muted style={{ marginVertical: 20 }}>
        Deux repères pour vous proposer des coachs. Vous pourrez les ajuster
        ensuite.
      </P>
      <Select
        label="Votre pratique"
        value={sport}
        items={Object.keys(reference.sportGoals)}
        onChange={onSport}
      />
      <P bold small style={{ marginBottom: 8 }}>
        Votre secteur
      </P>
      <Button light icon="pin" onPress={onSector}>
        {city}
      </Button>
      <Button style={{ marginTop: 24 }} onPress={onDone}>
        Découvrir mes coachs
      </Button>
      <TextButton onPress={onDone}>Passer pour le moment</TextButton>
    </View>
  );
}
