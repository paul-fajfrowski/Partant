import React, { useState, useEffect } from "react";
import { Pressable, View } from "react-native";
import { Store, dayLabel, remaining, configFor, intervalsFor } from "./model";
import type { Interval } from "./extendedTypes";
import { Dialog, P, H2, Button, TextButton, Icon, Row, Setting } from "./ui";
import {
  availabilityRangeView,
  RangeSelection,
  locationPresentationKey,
} from "./rangeDetailsModel";
import { euro } from "./CoachConfiguration";

export function AvailabilityRangeButton({
  store,
  selection,
  onPress,
  compact = false,
}: {
  store: Store;
  selection: RangeSelection & { range: Interval };
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
        justifyContent: "center",
        paddingVertical: 8,
        opacity: pressed ? 0.65 : 1,
      })}
    >
      <Row between style={{ gap: 3 }}>
        <View style={{ flex: 1 }}>
          <P bold style={{ fontSize: compact ? 12 : 16 }}>
            {selection.range[0]}–{selection.range[1]}
          </P>
          {!compact && (
            <P small muted numberOfLines={1}>
              {offers.length === 1
                ? offers[0].name
                : `${offers.length} offres associées`}
            </P>
          )}
        </View>
        <Icon name="chevron" size={compact ? 12 : 18} />
      </Row>
    </Pressable>
  );
}

/** Bounded summary; all ranges remain reachable through a single shared dialog. */
export function AvailabilityRangeList({
  store,
  coach,
  day,
  onSelect,
  compact = false,
}: {
  store: Store;
  coach: string;
  day: string;
  onSelect: (value: RangeSelection) => void;
  compact?: boolean;
}) {
  const ranges = intervalsFor(configFor(store, coach), day);
  return (
    <View>
      {ranges.slice(0, 2).map((range, i) => (
        <AvailabilityRangeButton
          key={i}
          store={store}
          compact={compact}
          selection={{ coach, day, range }}
          onPress={() => onSelect({ coach, day, range })}
        />
      ))}
      {ranges.length > 2 && (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`Voir les ${ranges.length} plages du ${dayLabel(day)}`}
          onPress={() => onSelect({ coach, day })}
          style={{ minHeight: 44, justifyContent: "center" }}
        >
          <P small bold style={{ fontSize: compact ? 11 : 14 }}>
            + {ranges.length - 2} autres plages ›
          </P>
        </Pressable>
      )}
      {!ranges.length && (
        <P small muted>
          {compact ? "Non définies" : "Aucune disponibilité définie."}
        </P>
      )}
    </View>
  );
}

export function AvailabilityRangeDetails(props: {
  store: Store;
  selection: RangeSelection | null;
  onClose: () => void;
  onSelect: (value: RangeSelection) => void;
  onDate: (day: string) => void;
  onOffers: () => void;
  onGroup: (id: string) => void;
}) {
  if (!props.selection) return null;
  return <RangeDetails {...props} selection={props.selection} />;
}
function RangeDetails({
  store,
  selection,
  onClose,
  onSelect,
  onDate,
  onOffers,
  onGroup,
}: {
  store: Store;
  selection: RangeSelection;
  onClose: () => void;
  onSelect: (value: RangeSelection) => void;
  onDate: (day: string) => void;
  onOffers: () => void;
  onGroup: (id: string) => void;
}) {
  const view = availabilityRangeView(store, selection);
  const [expanded, setExpanded] = useState<string | null>(
    view?.offers.length === 1 ? view.offers[0].offer.id : null,
  );
  const selectionKey = JSON.stringify(selection);
  useEffect(() => {
    setExpanded(view?.offers.length === 1 ? view.offers[0].offer.id : null);
  }, [selectionKey]);
  const ranges = intervalsFor(configFor(store, selection.coach), selection.day);
  const signature = (
    places: NonNullable<typeof view>["offers"][number]["locations"],
  ) => places.map(locationPresentationKey).sort().join("|");
  const common =
    view &&
    view.offers.length > 1 &&
    view.offers.every(
      (o) => signature(o.locations) === signature(view.offers[0].locations),
    )
      ? view.offers[0].locations
      : null;
  const places = (
    locations: NonNullable<typeof view>["offers"][number]["locations"],
  ) =>
    locations.map((place) => (
      <View key={place.id} style={{ marginTop: 8 }}>
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
        {!!place.instructions && (
          <P small muted>
            {place.instructions}
          </P>
        )}
      </View>
    ));
  return (
    <Dialog
      title={
        selection.range
          ? "Détail de la disponibilité"
          : "Disponibilités du jour"
      }
      open
      onClose={onClose}
      onBack={() =>
        selection.range && selection.fromDayList
          ? onSelect({ coach: selection.coach, day: selection.day })
          : onClose()
      }
    >
      <P small muted>
        {dayLabel(selection.day)}
      </P>
      {!selection.range ? (
        <>
          <P small muted style={{ marginVertical: 12 }}>
            {ranges.length} plages · sélectionnez un horaire pour voir ses
            offres.
          </P>
          {ranges.map((range, i) => (
            <AvailabilityRangeButton
              key={i}
              store={store}
              selection={{ ...selection, range }}
              onPress={() =>
                onSelect({ ...selection, range, fromDayList: true })
              }
            />
          ))}
          {!ranges.length && (
            <P>Aucune disponibilité définie pour cette date.</P>
          )}
        </>
      ) : !view ? (
        <P>
          Cette plage a été modifiée. Retrouvez ses nouveaux horaires dans votre
          agenda.
        </P>
      ) : (
        <>
          <H2 style={{ marginTop: 6 }}>
            {view.from}–{view.to}
          </H2>
          <P small muted style={{ marginTop: 8 }}>
            {view.specificDate
              ? "Disponibilité pour cette date"
              : "Disponibilité hebdomadaire"}
          </P>
          {!!common?.length && (
            <View style={{ marginTop: 20 }}>
              <P small muted>
                LIEUX COMMUNS AUX OFFRES
              </P>
              {places(common)}
            </View>
          )}
          <H2 style={{ marginTop: 24, fontSize: 18 }}>Offres associées</H2>
          {!view.offers.length && (
            <P muted style={{ marginTop: 12 }}>
              Associez une offre à cette plage pour y proposer des séances.
            </P>
          )}
          {view.offers.map(
            ({ offer, locations, departures, groups, status }) => {
              const open = expanded === offer.id;
              return (
                <View
                  key={offer.id}
                  style={{ borderBottomWidth: 1, borderColor: "#e7e7e7" }}
                >
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel={`Détails de ${offer.name}`}
                    accessibilityState={{ expanded: open }}
                    aria-expanded={open}
                    onPress={() => setExpanded(open ? null : offer.id)}
                    style={{ paddingVertical: 16, minHeight: 48 }}
                  >
                    <Row between>
                      <View style={{ flex: 1 }}>
                        <P bold>{offer.name}</P>
                        <P small style={{ marginTop: 5 }}>
                          {offer.kind} · {offer.duration} min ·{" "}
                          {euro(offer.price)}
                          {offer.kind === "Groupe"
                            ? " / personne"
                            : " / séance"}
                        </P>
                        {!open && (
                          <P small muted style={{ marginTop: 4 }}>
                            {status}
                          </P>
                        )}
                      </View>
                      <Icon name="chevron" size={16} />
                    </Row>
                  </Pressable>
                  {open && (
                    <View style={{ paddingBottom: 16 }}>
                      {offer.kind === "Groupe" && (
                        <P small muted>
                          {offer.capacity} personnes maximum
                        </P>
                      )}
                      {!common && places(locations)}
                      <P small bold style={{ marginTop: 12 }}>
                        {status}
                      </P>
                      {!!departures.length && (
                        <P small muted style={{ marginTop: 4 }}>
                          {departures.join(" · ")}
                        </P>
                      )}
                      {groups.map((g) => (
                        <Setting
                          key={g.id}
                          title={`${g.time} · Voir le cours`}
                          description={`${g.offer.capacity - remaining(g.offer, g.day, g.time, store)} / ${g.offer.capacity} places réservées · ${euro(g.offer.price)} / personne`}
                          onPress={() => onGroup(g.id)}
                        />
                      ))}
                    </View>
                  )}
                </View>
              );
            },
          )}
        </>
      )}
      <View style={{ marginTop: 24 }}>
        <Button onPress={() => onDate(selection.day)}>
          Modifier les horaires de cette date
        </Button>
        {selection.range && ranges.length > 1 && (
          <TextButton
            onPress={() =>
              onSelect({ coach: selection.coach, day: selection.day })
            }
          >
            Toutes les plages du jour
          </TextButton>
        )}
        <TextButton onPress={onOffers}>Gérer mes offres</TextButton>
      </View>
    </Dialog>
  );
}
