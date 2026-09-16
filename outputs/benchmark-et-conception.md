# Partant — benchmark et conception produit

> Document de la V1. La V2 du 13 septembre ajoute connexion, onboarding et configuration coach complète à l’échelle du prototype. Voir [l’évolution produit V2](evolution-produit-v2.md) pour le périmètre actuel.

Prototype conçu le 12 septembre 2026. Fichier principal : **partant.html**. Ouvrir directement dans un navigateur, sans installation, serveur ou connexion Internet. Photos, police, CSS, JavaScript et données sont intégrés au HTML.

## 1. Le choix produit

Partant est une marketplace de personnes **réservables**, et non une collection de fiches à contacter. L’objet central est la combinaison **coach + créneau + lieu + prix total**.

Deux intentions utilisent les mêmes résultats :

- « Je cherche quelqu’un qui me correspond » : discipline, portrait, approche, avis, proximité et comparaison.
- « Je suis libre mardi à 19 h » : choix du moment, puis uniquement les coachs disposant réellement de ce créneau dans le modèle de démonstration.

Le nom Partant est une proposition de travail, sans recherche de disponibilité juridique. Il évoque l’envie de se mettre en mouvement et la dimension humaine d’une séance partagée.

## 2. Benchmark : sources et limites

Ce benchmark repose sur des pages publiques, fiches de résultats et documentations officielles consultées le 12 septembre 2026. Il ne constitue pas un audit exhaustif des applications connectées. Aucun compte payant, achat ou réservation réelle n’a été utilisé. Les détails non accessibles ne sont pas présentés comme observés.

| Produit et source consultée | Mécanique observée ou documentée | Adaptation pour Partant | Limite / choix écarté |
|---|---|---|---|
| [TrainMe — FAQ particuliers](https://trainme.co/fr/faq-clients-individuels) | Adresse et discipline structurent la recherche. La réservation directe et la prise de contact préalable sont proposées. Les avis peuvent être déposés après une séance. | Choix du coach et de la pratique ; avis rattaché à une séance terminée ; possibilité de poser une question après réservation. | Éviter que la conversation soit un passage obligé pour connaître la disponibilité. La FAQ ne suffit pas à établir la finesse de son planning actuel. |
| [CoachUp — fonctionnement pour les sportifs](https://www.coachup.com/info/how-it-works-athletes) et [confiance](https://support.coachup.com/hc/en-us/articles/227164248-Trust-Safety-101) | Recherche par sport et zone géographique ; promesse de coaching individuel ; importance des qualifications et des évaluations. Le centre d’aide encourage les réservations sur la plateforme. | Profils incarnés, objectifs compréhensibles, qualifications consultables et réservation dans l’application. | Ne pas importer un modèle centré sur la seule performance compétitive. Partant accueille aussi la reprise et le bien-être. |
| [ClassPass — résultats fitness à Paris](https://classpass.com/search/paris/fitness) et [offres](https://classpass.com/plans) | Les résultats associent établissement, activité, adresse, notes et extraits d’avis. L’offre repose sur des crédits donnant accès à plusieurs lieux. | Découverte par discipline et repères comparables sur chaque résultat. L’activité aide à choisir sans masquer la personne. | Aucun crédit ni abonnement côté client dans le MVP : le prix en euros reste intelligible de la découverte au paiement. Les règles précises des applications connectées n’ont pas été testées. |
| [Playtomic — réserver depuis un club](https://playerhelp.playtomic.com/hc/en-gb/articles/19831715222929-How-to-book-a-court-or-a-spot-in-a-match-in-your-favourite-Club) | Le parcours documenté relie profil du club, réservation, date, heure, terrain et paiement. Des entrées distinctes existent pour terrain privé et parties ouvertes. | Le créneau est un point d’entrée vers une réservation déjà renseignée. Date et heure survivent au passage vers le détail de séance. | Pas de parties ouvertes ni de logique de joueurs à réunir : l’individuel et le duo suffisent ici. |
| [Fresha — affectation des rendez-vous](https://www.fresha.com/help-center/knowledge-base/calendar/102178-set-up-new-appointment-assignment) | Un professionnel doit être disponible et proposer le service. Sans professionnel disponible, le créneau n’est pas proposé. Une préférence pour le dernier professionnel réservé peut être configurée. | L’agenda est la source commune des résultats, profils et réservations. Les favoris raccourcissent la nouvelle réservation avec le même coach. | Pas d’attribution automatique d’une personne inconnue : dans le coaching, le choix de la relation reste explicite. |
| [Mindbody — découverte](https://www.mindbodyonline.com/explore/) et [présentation du produit](https://www.mindbodyonline.com/) | Le produit relie découverte locale de prestations sportives et bien-être, réservations et outils professionnels de gestion. | Un espace coach minimal explique comment l’offre devient réservable côté client. | Ne pas importer la richesse administrative d’un logiciel de studio : trois surfaces suffisent, agenda, offre et revenus. L’interface connectée n’a pas été auditée. |
| [Airbnb — listes de favoris](https://www.airbnb.com/help/article/1236) | Les listes permettent de conserver des annonces et de revenir à une sélection ; des mécanismes collaboratifs sont documentés. | Sauvegarder une personne pour retrouver ses prochains créneaux, puis comparer deux profils sur des attributs identiques. | Pas de collections complexes ou de collaboration dans le MVP. La carte de Partant est une hypothèse de conception, pas une reproduction d’un écran Airbnb audité. |
| [Mobbin — catalogue iOS](https://mobbin.com/discover/apps/ios) | Le catalogue public est accessible, mais la consultation détaillée des parcours a renvoyé vers une connexion dans l’environnement disponible. | Source de repérage envisagée, sans attribution d’un pattern précis à un parcours non consulté. | Aucun écran privé ou payant présenté comme étudié. Pas de contournement d’accès. |

Doctolib et Planity ne servent pas de référence d’architecture ou d’identité. Le brief permet d’explorer leurs mécanismes, mais le benchmark ci-dessus couvre déjà les besoins retenus sans rendre nécessaire un détour par leurs parcours.

## 3. Synthèse des décisions UX

### La disponibilité est un contenu de découverte

Une pastille « disponible » seule ne répond pas à la question du sportif. Chaque résultat présente des **heures actionnables**, accompagnées du jour, du tarif pour 60 minutes et du lieu. Le filtre « Ce soir » signifie à partir de 18 h ; le filtre d’heure précise utilise une correspondance exacte, sans élargissement silencieux.

Le profil n’est pas obligatoire pour réserver : un sportif déjà convaincu touche une heure et arrive sur une séance présélectionnée. Celui qui hésite peut explorer la méthode, les qualifications, les lieux, les avis et le planning sur la même fiche.

### Une première expérience sans inscription

L’exploration commence immédiatement. Paris 11e est une localisation choisie pour la démonstration, sans demande de géolocalisation. Alex est le profil client fictif. Une vraie mise en production demanderait une identification minimale au paiement, avec conservation de la sélection durant cette étape.

### Un tarif comparable, sans surprise

Les résultats affichent le prix total individuel de 60 minutes. Le duo coûte 20 € de plus au total, et non par personne. Les frais de réservation client sont de 0 €. La commission hypothétique de 15 % est prélevée côté coach ; elle n’est pas ajoutée au checkout.

Une réservation conserve le prix payé. Le coach peut modifier son tarif public sans réécrire le prix des séances déjà vendues.

### La photo donne envie, les faits permettent de choisir

Portrait, nom et discipline forment le premier niveau ; note, distance et prix le second ; disponibilité et action le troisième. Le badge de confiance reste discret et explicable. Les photos représentent des personnages fictifs, générés pour cette maquette, pas des professionnels réellement référencés.

La comparaison explicite se limite à deux coachs. Elle remet côte à côte prix, note, nombre d’avis, proximité, expérience, formats et heures correspondant aux filtres actifs.

### La carte est complémentaire

La carte utilise exactement la sélection filtrée, présente le prix et ouvre un aperçu du coach avec ses heures. Elle ne devient pas un écran d’accueil obligatoire. Le prototype fonctionne hors ligne : le fond cartographique et les positions sont schématiques et signalés comme tels. Ils ne constituent ni un itinéraire ni une mesure géographique exacte.

### Le retour dans l’application prolonge la relation

Les séances à venir donnent accès au rendez-vous, au lieu, à la préparation et aux actions utiles. Un fichier `.ics` peut réellement être téléchargé. Les messages restent locaux. Les séances passées proposent un avis et une nouvelle réservation ; les favoris présentent le prochain jour disponible du coach.

Les réservations hebdomadaires automatiques sont volontairement différées. Elles nécessitent la disponibilité de toute une série, une présentation du prix cumulé et des règles d’annulation par occurrence. Une promesse « tous les mardis » sans ces garanties serait trompeuse. La nouvelle réservation en deux étapes couvre le besoin initial.

## 4. Architecture du prototype

Navigation principale : **Explorer / Favoris / Séances / Mon espace**.

| Surface | Fonction |
|---|---|
| Explorer | Intentions temporelles, recherche textuelle, disciplines, filtres, tri, comparaison et carte |
| Profil coach | Personnalité, méthode, informations de confiance, lieux, prix et planning sur 14 jours |
| Votre séance | Créneau déjà choisi, individuel ou duo, extérieur / studio / domicile / visio selon le coach |
| Récapitulatif | Date, heure, durée, personnes, lieu, prix total, annulation et paiement fictif |
| Confirmation | Réservation créée, calendrier et accès au détail |
| Séances | À venir, passées, annulées ; modification, annulation, message et avis |
| Favoris | Retrouver un coach et réserver son prochain créneau |
| Mon espace | Profil fictif, ville, aide, confiance et outils de démonstration |
| Espace coach | Agenda de Thomas, ouverture/fermeture des créneaux, clients réservés, tarif et revenu prévisionnel |

Les choix courts sont présentés dans des fenêtres modales natives : date, filtres, ville, comparaison, annulation, messagerie, avis. Cela conserve le contexte sans multiplier les pages.

## 5. Langage visuel

Le [DESIGN_LOCK](https://github.com/defnotwilson/Project-H-iOS/blob/main/Design_System/DESIGN_LOCK.md), puis les fichiers [monochrome.css](https://github.com/defnotwilson/Project-H-iOS/blob/main/simulation/dist/monochrome.css) et [tokens.css](https://github.com/defnotwilson/Project-H-iOS/blob/main/simulation/dist/tokens.css), ont été lus via des opérations GitHub en lecture seule.

Retenu : noir #141414, blanc, gris neutres, secondaire #626262, Hanken Grotesk intégrée, titres mobiles 28 px, sections 18–20 px, boutons principaux pilule de 50 px, absence d’ombres, photographie monochrome et continuité entre zone supérieure sombre et surface inférieure blanche. Les séparateurs fins servent à distinguer des informations, sans contour décoratif autour de chaque surface.

Adapté : nouvelle marque, nouvelle navigation, carte, résultats de marketplace, parcours de réservation et espace professionnel. Les anciennes navigations et règles métier de Project H ne sont pas réutilisées. Le repository de référence n’a été ni cloné, ni modifié : aucune branche, aucun commit, aucun fichier écrit dedans.

Sur desktop, une présentation sobre accompagne une application de largeur mobile. Sur téléphone et tablette étroite, la présentation latérale disparaît ; l’application remplit l’écran. Les parcours partagent le même code.

## 6. Règles simulées et limites explicites

- Horloge de scénario fixe : **lundi 14 septembre 2026, 08:00, Paris**. Le planning couvre 14 jours. Cela garantit des scénarios de test reproductibles même si le fichier est ouvert plus tard.
- Six coachs, avec plusieurs disciplines et formats ; les disciplines sans offre donnent un résultat vide, pas une offre inventée.
- Les réservations confirmées et les fermetures coach retirent les créneaux publics. Un contrôle empêche le client de réserver deux séances qui se chevauchent.
- La réservation est simulée et immédiate. Aucun véritable stock partagé, verrou serveur ou paiement n’existe.
- Annulation gratuite à 24 h ou plus ; à moins de 24 h, la séance reste due. Le montant du remboursement simulé est affiché avant confirmation.
- Modification jusqu’à 2 h avant, au même prix et pour la même séance ; l’ancien créneau est libéré et les conflits sont contrôlés.
- LocalStorage conserve les actions dans ce navigateur. Si le navigateur le bloque, la session reste utilisable en mémoire. Les données ne sont pas synchronisées entre appareils.
- Les distances sont des valeurs de scénario depuis la zone pilote, non des distances calculées. L’adresse à domicile est fictive ; la validation géographique et les temps de trajet ne sont pas implémentés.
- Le planning coach concerne Thomas. Ses clients réservés ne peuvent pas être transformés en créneaux fermés d’un simple clic.
- Connexions Google Calendar, Apple Calendar et Outlook : explication de la logique future uniquement. L’export individuel `.ics` fonctionne sans intégration.
- Les portraits, noms, notes, justificatifs, revenus, messages et signalements sont fictifs. Les avis saisis restent locaux.
- L’app ne sollicite aucune donnée bancaire, n’envoie aucun message réel et ne réserve aucune prestation externe.

## 7. Ce qu’il faut sécuriser avant un vrai MVP

Ces points sont des besoins de production, pas des fonctionnalités prétendument livrées dans le HTML :

1. Disponibilités calculées côté serveur : durées, temps de trajet, zones de déplacement, calendrier externe et délais minimaux.
2. Verrou transactionnel sur le créneau, idempotence de réservation, expiration du panier, gestion d’échec de paiement.
3. Onboarding et contrôle des justificatifs adapté à chaque discipline et au pays de lancement ; définir clairement le périmètre du badge.
4. Paiements marketplace, commission, reversements, remboursements et assistance ; les taux et politiques du prototype restent des hypothèses à valider.
5. Avis associés aux séances réellement effectuées, modération, signalement et procédure d’incident.
6. Recherche géographique réelle, adresses et consentement de localisation ; affichage prudent des lieux privés.
7. Notifications transactionnelles, synchronisation des annulations et modifications avec les agendas.

## 8. Scénarios pour une présentation

1. **Le besoin temporel** : Date & heure → mardi 15 → 19:00 → Thomas → individuel ou duo → extérieur → continuer → réserver → confirmation.
2. **Le choix d’une personne** : Pilates → profil de Sarah → méthode et avis → date → créneau → réservation.
3. **La comparaison** : sélectionner « Comparer » sur deux coachs → ouvrir le comparatif → voir un profil.
4. **La fidélisation** : ajouter le coach aux favoris → Favoris → réserver une prochaine heure ; Séances → Passées → laisser un avis sur Sarah.
5. **L’imprévu** : Séances → détail → modifier → confirmer ; puis annuler en vérifiant le remboursement annoncé.
6. **La source des disponibilités** : Mon espace → espace coach → fermer un créneau libre de Thomas → revenir côté client → vérifier qu’il a disparu.
7. **Le prix public** : espace coach → offre & tarif → changer le prix → vérifier le profil et le prix conservé d’une réservation existante.
8. **Les états vides** : choisir Lyon, un sport sans offre ou un dimanche ; élargir la recherche ou passer en visio.

Pour repartir de zéro : **Mon espace → À propos de ce prototype → Réinitialiser la démo**. Une séance passée de Sarah reste disponible comme scénario d’avis. L’option « Simuler une séance terminée » permet aussi de transformer une réservation de test en séance passée.

## 9. Crédits des ressources

Police : Hanken Grotesk, source Google Fonts, intégrée au HTML. Licence OFL dans `OFL-Hanken-Grotesk.txt`.

Photographie : une planche de six portraits créée avec l’outil intégré Imagegen, puis intégrée au HTML. Aucun portrait de véritable coach n’a été récupéré. Prompt : « One square editorial photography contact sheet, exactly 2 columns and 3 equal rows, six fictional waist-up sports coaches: Thomas, dark-haired man outdoors; Sarah, Pilates woman in a studio; Idriss, Black running coach on an urban track; Camille, curly-haired yoga woman; Lucas, strength coach in a gym; Inès, North African female boxing coach with gloves. Photorealistic premium sports magazine photography, entirely black and white, natural expressions and bodies, precisely aligned panels, no gaps, borders, text, logos or interface. »

Illustrations fonctionnelles : pictogrammes et carte schématique en SVG. Aucun appel réseau n’est nécessaire au fonctionnement de l’application. Le lien de benchmark est un document compagnon ; les liens vers les sources nécessitent Internet.
