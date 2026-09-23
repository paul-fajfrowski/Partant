import React from "react";
import { Pressable, View } from "react-native";
import { Store, dayLabel, remaining } from "./model";
import { Dialog, P, H2, Button, TextButton, Icon, Row, Setting } from "./ui";
import { availabilityRangeView, RangeSelection } from "./rangeDetailsModel";
import { euro } from "./CoachConfiguration";

export function AvailabilityRangeButton({
  store,
  selection,
  onPress,
  compact = false,
}: {
  store: Store;
  selection: RangeSelection;
  onPress: () => void;
  compact?: boolean;
}) {
  const offers = store.offers.filter(
    (o) =>
      o.coach === selection.coach &&
      (selection.range[2] == null
        ? o.active
        : selection.range[2].includes(o.id)),
  );
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`Voir la plage du ${dayLabel(selection.day)} de ${selection.range[0]} à ${selection.range[1]}`}
      accessibilityHint="Consulter les offres et les lieux associés"
      onPress={onPress}
      style={({ pressed }) => ({
        minHeight: 48,
        borderWidth: 1,
        borderColor: "#dedede",
        borderRadius: compact ? 12 : 18,
        padding: compact ? 8 : 14,
        marginVertical: 4,
        backgroundColor: "#fff",
        opacity: pressed ? 0.65 : 1,
      })}
    >
      <Row between style={{ gap: 3 }}>
        <P bold style={{ fontSize: compact ? 12 : 16 }}>
          {selection.range[0]}–{selection.range[1]}
        </P>
        <Icon name="chevron" size={compact ? 12 : 18} />
      </Row>
      <P
        small
        muted
        numberOfLines={2}
        style={{
          fontSize: compact ? 11 : 13,
          lineHeight: compact ? 15 : 19,
          marginTop: 4,
        }}
      >
        {offers.length === 1
          ? offers[0].name
          : offers.length
            ? `${offers.length} offres associées`
            : "Aucune offre associée"}
      </P>
    </Pressable>
  );
}

export function AvailabilityRangeDetails({
  store,
  selection,
  onClose,
  onDate,
  onOffers,
  onGroup,
}: {
  store: Store;
  selection: RangeSelection | null;
  onClose: () => void;
  onDate: (day: string) => void;
  onOffers: () => void;
  onGroup: (id: string) => void;
}) {
  if (!selection) return null;
  const view = availabilityRangeView(store, selection);
  return (
    <Dialog title="Détail de la disponibilité" open onClose={onClose}>
      {!view ? (
        <P>
          Cette plage a été modifiée. Retrouvez ses nouveaux horaires dans votre
          agenda.
        </P>
      ) : (
        <>
          <P small muted>
            {dayLabel(selection.day)}
          </P>
          <H2 style={{ marginTop: 6 }}>
            {view.from}–{view.to}
          </H2>
          <P small muted style={{ marginTop: 8 }}>
            {view.specificDate
              ? "Horaires propres à cette date"
              : "Horaires de votre semaine habituelle"}{" "}
            · Cette plage est une disponibilité, pas une réservation.
          </P>
          <H2 style={{ marginTop: 24, fontSize: 18 }}>Offres associées</H2>
          {!view.offers.length && (
            <P muted style={{ marginTop: 12 }}>
              Associez une offre à cette plage pour y proposer des séances.
            </P>
          )}
          {view.offers.map(
            ({ offer, locations, departures, groups, status }) => (
              <View
                key={offer.id}
                style={{
                  paddingVertical: 18,
                  borderBottomWidth: 1,
                  borderColor: "#e7e7e7",
                }}
              >
                <P bold>{offer.name}</P>
                <P small style={{ marginTop: 5 }}>
                  {offer.kind} · {offer.duration} min · {euro(offer.price)}
                  {offer.kind === "Groupe" ? " / personne" : " / séance"}
                </P>
                {offer.kind === "Groupe" && (
                  <P small muted>
                    {offer.capacity} personnes maximum
                  </P>
                )}
                {locations.map((place) => (
                  <View key={place.id} style={{ marginTop: 10 }}>
                    <P small bold>
                      {place.name}
                    </P>
                    <P small muted>
                      {place.type === "Domicile"
                        ? `${place.sector || "Secteur à préciser"}${place.radius ? ` · rayon de ${place.radius} km` : ""}${place.travelFee ? ` · déplacement +${euro(place.travelFee)}` : ""}`
                        : place.type === "Visio"
                          ? "À distance"
                          : place.address || "Adresse à compléter"}
                    </P>
                  </View>
                ))}
                <View
                  style={{
                    backgroundColor: "#f5f5f3",
                    borderRadius: 12,
                    padding: 12,
                    marginTop: 12,
                  }}
                >
                  <P small bold>
                    {status}
                  </P>
                  {!!departures.length && (
                    <P small muted style={{ marginTop: 4 }}>
                      {departures.join(" · ")}
                    </P>
                  )}
                </View>
                {groups.map((g) => (
                  <Setting
                    key={g.id}
                    title={`${g.time} · Voir le cours`}
                    description={`${g.offer.capacity - remaining(g.offer, g.day, g.time, store)} / ${g.offer.capacity} places réservées · ${euro(g.offer.price)} / personne`}
                    onPress={() => onGroup(g.id)}
                  />
                ))}
              </View>
            ),
          )}
          <P small muted style={{ marginVertical: 16 }}>
            Les départs tiennent compte de votre publication, de vos
            réservations et des règles de votre agenda.
          </P>
          <Button onPress={() => onDate(selection.day)}>
            Modifier les horaires de cette date
          </Button>
          <TextButton onPress={onOffers}>Gérer mes offres</TextButton>
        </>
      )}
    </Dialog>
  );
}
