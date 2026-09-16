# Partant — branchements de développement

État : 16 septembre 2026. Cible décidée : **React Native + TypeScript + Expo**. Voir [la décision persistante](decisions/001-react-native.md).

## Ce qui est réellement en place

| Élément | État vérifié | Limite actuelle |
|---|---|---|
| Prototype HTML A1–A9 | Réalisé, revue visuelle mobile validée par l’utilisateur | Les données du HTML restent locales ; il n’est pas raccordé au backend. |
| Application React Native / Expo | Sources dans `apps/mobile`, compilation TypeScript et export web réussis | Premier parcours technique, pas encore tous les écrans premium du prototype. Aucun build iOS/Android validé. |
| Supabase | Projet `jhhsysjdeyqsuztjtgea` réellement modifié | Environnement de développement, pas de production. |
| Base et droits | Profils privés, profils coach publics, offres, créneaux, réservations, notifications et métadonnées d’agendas | Reprise progressive du modèle complet du prototype encore nécessaire. |
| Réservation serveur | Prix et capacité calculés côté serveur ; individuel, duo, groupe ; idempotence | Confirmation de test sans encaissement, aucune promesse de paiement. |
| Modification / annulation | Changement vers même offre/même tarif, annulation à plus de 24 h ; notification aux deux parties | Politique fixe de développement ; pas encore toutes les politiques configurables du prototype. |
| Concurrence | Deux requêtes simultanées, une seule place : une confirmation et un refus `SLOT_FULL` | Test SQL réel sous rôles authentifiés ; pas encore un test UI de bout en bout avec deux vrais comptes OAuth. |
| Photos / justificatifs | Buckets créés ; photos publiques, documents privés par propriétaire ; limites de format et taille | Interface d’import et revue équipe à raccorder. Ne pas envoyer de vrais justificatifs pendant ces premiers essais. |
| Notifications internes | Écrites dans la transaction, Realtime activé et abonné dans l’app | Pas de SMS/e-mail/push externes. |
| Géocodage | Recherche IGN/BAN réelle, coordonnées, distance à vol d’oiseau | Ce n’est pas un temps de trajet. Rayon côté recherche ; zones de déplacement métier à finaliser côté serveur. |
| Carte | Carte OpenStreetMap intégrée au lieu/secteur choisi | Pas encore une carte multi-coachs avec filtres et grappes de marqueurs. |
| Google / Apple login | Client PKCE préparé, boutons explicitement en préparation | Fournisseurs Supabase non activés ; identifiants et retours à configurer. |
| Google Calendar / Outlook | Adaptateurs serveur de lecture, pagination, normalisation UTC/DST et 12 tests | OAuth, stockage chiffré des jetons, orchestration, synchronisation périodique et écriture des événements restent à raccorder. Aucune synchronisation active. |
| Protection agenda externe | Toute connexion enregistrée périmée/non connectée bloque les nouvelles réservations | Tant qu’aucune connexion n’existe, agenda Partant à gérer manuellement. |
| Paiement / SMS | Reportés par décision utilisateur | Étapes 4 et 5, non démarrées. |

**Le prototype est terminé pour le périmètre A1–A9, le MVP connecté ne l’est pas. Les étapes 1–3 ont commencé mais ne sont pas achevées.**

## Ouvrir l’application

Depuis `apps/mobile` :

```sh
npm ci
cp .env.example .env  # uniquement si .env n’existe pas déjà
# Renseigner la clé PUBLIABLE Supabase dans .env (jamais une clé service_role).
npm run web
```

Le fichier `.env` local est déjà renseigné sur la machine de travail et ignoré par Git. Le serveur de simulation actuel sert l’export web sur http://127.0.0.1:8081/ . Pour reconstruire cet export : `npx expo export --platform web`.

Le prototype original reste http://127.0.0.1:8766/partant.html?version=a1-a9 . Il conserve tous ses écrans et ses données simulées.

Pour OAuth sur téléphone, utiliser un **development build Expo** avec schéma `partant`, pas Expo Go. Ne pas publier dans les stores. Les bundle/package IDs définitifs doivent être enregistrés dans les comptes développeurs avant un build signé.

## Réglages Supabase à faire dans le tableau de bord

Projet : https://supabase.com/dashboard/project/jhhsysjdeyqsuztjtgea

Dans Authentication → URL Configuration, configurer :

- Site URL de développement : `http://127.0.0.1:8081/`.
- Redirect URLs : `http://127.0.0.1:8081/`, `http://localhost:8081/`, `partant://auth/callback`.
- Vérifier aussi le retour des e-mails d’authentification/récupération sur ces URL.

L’outil Supabase disponible permet les migrations et les contrôles SQL, mais pas la configuration des fournisseurs Auth. Ces réglages ne sont donc **pas présentés comme faits**.

Le SMTP par défaut Supabase ne délivre qu’aux adresses autorisées de l’équipe et est très limité. Pendant que l’étape e-mail est reportée, créer si nécessaire deux comptes de **test** depuis Authentication → Users → Add user (création manuelle, pas invitation), puis les connecter avec leurs mots de passe. Ne pas désactiver globalement la confirmation des futurs utilisateurs pour contourner ce problème.

Test manuel : coach connecté → enregistrer profil → activer espace coach → créer offre → ouvrir créneau à plus de 24 h → publier profil. Dans un autre navigateur/profil : client connecté → enregistrer profil → réserver → modifier/annuler. Vérifier les notifications du coach.

## Google : compte et projet à créer

Console : https://console.cloud.google.com/ . Le compte Google Cloud de Partant n’existe pas encore selon l’utilisateur.

1. Créer un projet dédié, par exemple `Partant développement`.
2. Configurer Google Auth Platform : nom Partant, adresse d’assistance, audience externe en mode test et liste des utilisateurs de test.
3. Pour la **connexion Google**, créer un client OAuth de type application Web avec retour autorisé :
   `https://jhhsysjdeyqsuztjtgea.supabase.co/auth/v1/callback`.
4. Activer Google dans Supabase Authentication → Sign In / Providers ; y saisir le client ID et le client secret. Ces secrets ne vont jamais dans `.env` de l’application mobile.
5. Tester le retour web puis mobile avant de passer `EXPO_PUBLIC_GOOGLE_ENABLED=true`.
6. Pour **Calendar**, activer Google Calendar API. Prévoir un consentement distinct et un client serveur pour les accès agenda. La connexion Google de l’utilisateur ne vaut pas consentement à lire son agenda.
7. Portées prévues : liste des calendriers en lecture et événements en lecture/écriture (`calendar.calendarlist.readonly`, `calendar.events`). Demander le consentement dans l’espace coach, uniquement au branchement de son agenda.
8. L’URL du callback agenda sera fournie lors du déploiement du gestionnaire OAuth serveur. Ne pas utiliser le callback Supabase Auth pour ce flux indépendant, ni saisir une URL de fonction qui n’a pas été déployée.

L’intégration serveur devra gérer `state` à usage unique, PKCE, jetons de renouvellement, expiration/révocation, rotation et chiffrement. Un consentement en mode test peut nécessiter une reconnexion régulière ; vérifier les règles Google à la mise en service.

## Microsoft / Outlook : inscription d’application à créer

Console : https://entra.microsoft.com/ . Le projet Microsoft n’existe pas encore selon l’utilisateur.

1. Créer une inscription d’application `Partant développement`.
2. Choisir les comptes professionnels/scolaires de plusieurs organisations **et les comptes Microsoft personnels**, afin de couvrir Outlook.com.
3. Préparer un retour **Web serveur** ; l’URL définitive sera fournie avec le gestionnaire OAuth agenda.
4. Autorisations Microsoft Graph déléguées : `Calendars.ReadWrite`, `offline_access`, `User.Read` (et scopes OpenID si nécessaires au flux retenu). Aucun accès global aux agendas d’une organisation.
5. Créer un secret serveur avec une date d’expiration suivie ; le stocker dans les secrets du backend, pas dans le code ou le chat.
6. Tester avec un compte personnel puis un compte professionnel ; certaines organisations exigent une autorisation administrateur.

## Apple : compte existant, configuration à compléter

Console : https://developer.apple.com/account/resources/identifiers/list . L’utilisateur possède un compte Apple Developer.

- Enregistrer un App ID Partant avec Sign in with Apple, puis un Services ID associé pour le flux OAuth web.
- Domaine du retour Supabase : `jhhsysjdeyqsuztjtgea.supabase.co`.
- Return URL : `https://jhhsysjdeyqsuztjtgea.supabase.co/auth/v1/callback`.
- Configurer le fournisseur Apple dans Supabase avec les identifiants correspondants et le secret généré côté serveur. Conserver la clé privée `.p8` hors de Git et du frontend.
- Prévoir le renouvellement du secret Apple selon sa durée de validité (maximum six mois pour ce flux).
- Tester l’adresse masquée Apple et un compte déjà existant avant activation du bouton.
- Valider les identifiants de bundle avec l’équipe Apple avant de les fixer dans `app.json`.

## Finir l’étape agenda sans fausse disponibilité

Le code `services/calendar/providers.mjs` prépare les lectures réelles des API et exclut les événements libres/annulés. Les tests utilisent des réponses contrôlées, pas les comptes de l’utilisateur.

Travaux restant après obtention des identifiants :

1. Consentement OAuth et gestion sûre des jetons sur le backend.
2. Choix explicite des agendas à lire et d’un agenda de destination pour les séances Partant.
3. Import atomique des occupations sur 90 jours sous le même verrou coach que la réservation ; conserver le dernier import si la pagination échoue.
4. Un événement externe par séance (même en groupe), avec mapping serveur des IDs pour éviter que Partant ne bloque ses propres événements.
5. File de synchronisation pour créations/modifications/annulations, reprise après erreur et idempotence. Aucune donnée personnelle de participant dans les titres.
6. Actualisation régulière, notifications fournisseurs si retenues, reconnexion si accès révoqué, blocage des réservations si données trop anciennes.
7. Test de collision : un coach occupe son agenda externe pendant qu’un client réserve. Aucun verrou ne peut rendre deux fournisseurs distribués parfaitement atomiques ; prévoir revalidation et traitement explicite des conflits détectés.

## Validations réalisées

- `npm --prefix apps/mobile run typecheck` : succès.
- `npx expo export --platform web` : succès.
- `node scripts/test-public-api.mjs` : lecture publique, refus des données privées et authentification obligatoire vérifiés via HTTP réel ; Google et Apple confirmés désactivés.
- `supabase/tests/foundation.sql` : 16 assertions, exécuté sur la base réelle sous rôles authentifiés, puis ROLLBACK de toutes les données de test.
- Deux transactions concurrentes sur la dernière place : une réussite, un refus `SLOT_FULL`, exactement une réservation ; fixtures supprimées ensuite.
- `npm --prefix services/calendar test` : 12 tests réussis (UTC, été/hiver, journée entière, pagination, révocation, confidentialité, lien de pagination non autorisé).
- Pas de validation OAuth réelle, pas de build natif signé, pas de validation visuelle du nouveau parcours React Native à ce stade.

## Sources de configuration

- React Native / Supabase : https://supabase.com/docs/guides/auth/quickstarts/react-native
- OAuth Expo / development builds : https://docs.expo.dev/guides/authentication/
- Google Auth : https://supabase.com/docs/guides/auth/social-login/auth-google
- Apple Auth : https://supabase.com/docs/guides/auth/social-login/auth-apple
- Google Calendar : https://developers.google.com/workspace/calendar/api/guides/sync
- Microsoft calendarView : https://learn.microsoft.com/en-us/graph/api/user-list-calendarview?view=graph-rest-1.0
- IGN : https://ignf.github.io/cartes.gouv.fr-documentation/fr/guides-utilisateur/utiliser-les-services-de-la-geoplateforme/geocodage/
- Carte : https://operations.osmfoundation.org/policies/tiles/

Contrôle Supabase final : aucun signalement dans l’advisor sécurité. L’advisor performance indique uniquement un index encore inutilisé sur cette base neuve ; il est conservé pour la recherche de créneaux. Voir https://supabase.com/docs/guides/database/database-linter?lint=0005_unused_index .

Audit dépendances du scaffold Expo : 10 signalements modérés dans la chaîne CLI/configuration (uuid/xcode), aucun élevé ou critique. Pas de mise à jour forcée incompatible ; à réexaminer avant les builds distribués.

## Interface native — reprise du prototype

La première interface produit React Native est disponible ; l’ancien atelier technique reste accessible avec `?tools=connections`. Le mode par défaut est une démonstration locale ; `?data=connected` utilise Supabase. Consulter [le suivi de parité](parite-prototype-react-native.md) avant de considérer un écran ou une intégration terminé. Aucun fournisseur OAuth, paiement ou SMS supplémentaire n’a été activé par ce portage.
