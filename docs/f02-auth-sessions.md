# F02 — connexion et sessions

Recette du 13 octobre 2026 dans `/Users/wilsonlim/Desktop/Partant/Partant`, branche `feature/02-auth-sessions`, base `main` / `6e5adc8`. **F02 partiellement validée : essais web réels exécutés, volet iPhone bloqué par les prérequis F01.** Le dossier parent n'a pas été utilisé.

## Corrections bornées

- Une lecture `getSession()` commencée au montage pouvait écraser un événement Auth plus récent et remettre le compte en invité. Le hook partagé donne maintenant priorité à l'événement et ouvre le chargement du profil sans attendre cette ancienne lecture ; son résultat est ignoré après démontage. Le défaut est reproduit avec réponses simulées, avant correction, sur l'adaptateur iOS. Le test corrigé couvre les adaptateurs iOS et web, les anciens profils lors d'un changement client → coach et après déconnexion.
- L'essai e-mail de connexion sur une adresse sans compte affichait réellement `Signups not allowed for otp`. Cette réponse précise reçoit désormais une explication française avec reprise vers « Créer mon compte », sans prétendre qu'un e-mail a été envoyé. Les autres refus et quotas restent inchangés.
- La recette ajoute dix variantes Auth dans la CI : refus d'une adresse sans compte, envoi accepté simulé, callback e-mail PKCE avec et sans destination privée conservée, espace coach, inscription client/coach à 390 et 1440 px, erreur de profil et reprise. Une assertion d'onboarding encore fondée sur le titre antérieur à la livraison 38 a été alignée sur l'écran existant.

Aucun changement de DA, de règle métier, de rôle serveur, de dépendance, de fournisseur ou de callback. Le domaine généré et les trois fonctions serveur n'ont pas besoin d'un redéploiement pour ces changements frontend. La source React Native/Web reste commune.

## Essais web et serveur réels

Chrome sur macOS, export statique connecté sur `http://127.0.0.1:8081`, projet de développement `jhhsysjdeyqsuztjtgea`. Les identités de recette sont autorisées par Wilson ; leurs adresses et les captures restent locales, hors Git. Les consentements et la consultation de la boîte e-mail sont effectués par Wilson.

| Scénario | Attendu et résultat obtenu | Portée / preuve locale |
| --- | --- | --- |
| Lien e-mail, connexion avant création | Aucun faux envoi si adresse inconnue ; refus reçu, interface récupérable | Base `6e5adc8`, réponse anglaise corrigée ensuite et rejouée avec fixture |
| Inscription e-mail client | Demande acceptée, réception réelle puis retour au compte client | Wilson confirme réception et ouverture ; `email-request-accepted.png`, `email-client-open.png` |
| Rechargement e-mail | Même compte client après chargement du profil | Base `6e5adc8`, `email-reload.png` |
| Route coach depuis le client | Aucun rôle coach conféré par l'URL | `view=config&section=schedule` revient à l'exploration, base `6e5adc8` |
| Déconnexion et Retour navigateur | Compte privé retiré, retour public sans ancien profil | Base `6e5adc8`, puis même contrôle sur l'export F02 après Apple |
| Google : départ, abandon, reprise | Choix de compte réel, Retour avant consentement, nouvelle ouverture possible | Export F02 corrigé, `google-handoff.png` ; ceci ne couvre pas un refus après consentement |
| Google : succès et changement de compte | Retour au compte social client sans réafficher le profil e-mail précédent | Wilson confirme ; compte observé dans le navigateur, `google-client-open.png` |
| Google : rechargement et reconnexion | Même compte après reload et après logout/login, callback retiré de l'URL | Export F02, `google-account-reload.png`, `google-reconnected.png` |
| Apple web : départ, abandon, reprise | Page Apple réelle, Retour avant consentement puis nouvelle ouverture | Export F02, `apple-handoff.png` ; pas une annulation native |
| Apple web : succès et rechargement | Bon compte client conservé après reload | Wilson confirme ; `apple-client-open.png`, `apple-reload.png` |
| Apple web : reconnexion depuis Mon espace | Même espace retrouvé sans nouvelle inscription | Wilson confirme ; `apple-reconnected.png`, export F02 |
| Route privée sans session | Connexion demandée, aucune donnée privée affichée | Export F02, `private-route-signed-out.png` |

Une lecture serveur en accès restreint aux deux comptes autorisés confirme un compte e-mail avec une identité `email`, et un compte social avec deux identités `apple` et `google`. Apple retrouve ici le profil nommé lors de l'essai Google. Cela valide ce cas précis ; aucune fusion universelle, adresse Apple masquée ou correspondance native/web n'est revendiquée.

L'export connecté a été reconstruit après les corrections. Les essais e-mail initiaux portent sur la base ; Google et Apple portent sur les sources F02 corrigées. La course de démarrage est provoquée par un test, pas par les réseaux fournisseurs réels.

## Vérification automatisée et preuves

- [CI complète du main fusionné](https://github.com/paul-fajfrowski/Partant/actions/runs/38427978406) : toutes les étapes réussies sur `6e5adc8`, y compris navigateur/accessibilité, contrôle des dépendances, domaine généré et export production.
- TypeScript et export web/iOS Hermes F02 : réussis. L'export QA est dans `work/f02/qa-dist`, séparé de l'export connecté servi par `apps/web/dist` ; la clé QA fictive est passée en environnement sans changer `.env`.
- Concurrence Auth : 62 contrôles sur adaptateurs iOS/web ; SecureStore : 16 contrôles simulés de migration, fragments, interruption et déconnexion. Ces contrôles ne lisent pas le Keychain d'un iPhone.
- Dix variantes Auth supplémentaires : 76 assertions DOM, réponses entièrement fictives, aucun envoi réel de code ni de lien dans ces tests.
- Recette métier/DOM complète du lot : 49 suites sur 49 réussies, dans `work/f02/qa-final/unit-dom.json`.
- Douze suites navigateur : réussies sur le Chrome installé avec des profils QA isolés. Chromium Playwright n'est pas installé localement ; l'override `PARTANT_QA_CHROME` existant a été utilisé. La CI Linux conserve son Chromium Playwright.
- Les résultats du lot sont conservés dans `work/f02/` (logs avant/après, suites, exports, captures et preuve JSON de CI main). La CI dédiée à la PR conserve les artefacts complets et doit être réussie avant toute intégration.

Les fixtures DOM utilisent les adaptateurs et backend de test ; elles ne sont pas des transactions Supabase réelles. Le bundle Hermes n'est ni un build Xcode signé ni une installation physique. Une vérification des routes et des identités ne prouve pas à elle seule l'absence de toute fuite de données.

## Préservation et suites nécessaires

Les trois fichiers iOS modifiés avant F02 sont conservés byte pour byte et exclus des commits : `project.pbxproj`, `Info.plist`, `Podfile.lock`. L'équipe locale n'est pas assimilée à l'équipe de référence `4STLA425HP`. Aucun réglage Xcode, Pod, certificat ou secret n'a été remplacé.

Les comptes réels de recette sont conservés pour la suite, sans réservation ni habilitation équipe créée par cette recette. Les fixtures automatisées n'ont pas été envoyées au serveur. Aucun compte réel n'a été supprimé. Les captures locales ne conservent aucun code OAuth, mot de passe ou jeton de session ; elles ne sont pas publiées dans la PR.

Restent à exécuter :

- iPhone signé et installé : Apple natif et Google succès/abandon/reprise, retours OAuth, session SecureStore après arrêt/redémarrage, migration réelle depuis AsyncStorage et reconnexion. Dépendance : accès Apple préparé par Paul et appareil physique.
- Coach de test explicitement autorisé : inscription et reconnexion dans l'espace professionnel ; aucune création d'un rôle coach sur un compte utilisateur deviné.
- Reprise réelle d'une réservation commencée invité : offre/créneau réservable d'un coach autorisé nécessaire. Aucun coach n'apparaît dans les recherches réelles exécutées ; la reprise reste couverte par les fixtures existantes, sans valider le scénario réel ni réserver automatiquement.
- Cas OAuth secondaires : refus après consentement, erreur réseau fournisseur, Apple avec adresse masquée et comparaison native/web.

Paiement, SMTP/code e-mail, publication, Calendar et nouvelles intégrations restent reportés. F03 n'est pas commencé. Aucune fusion sans demande de l'utilisateur.
