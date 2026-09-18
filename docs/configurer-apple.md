# Activer « Continuer avec Apple » pour Partant

> **Validation utilisateur — 18 septembre 2026 :** le propriétaire confirme que les connexions Apple et Google fonctionnent dans la simulation web ; son compte Google a été ajouté aux utilisateurs de test. Le blocage Google est levé pour ce compte. Cette validation ne couvre pas encore Google Calendar, les appareils natifs ni tous les cas secondaires d’authentification.

## État vérifié — 18 septembre 2026

Apple est activé dans Supabase. Les valeurs suivantes ont été confirmées par le propriétaire :

- Team ID : `4STLA425HP`.
- Bundle ID iOS : `com.paulfajfrowski.partant` (également enregistré dans Expo).
- Services ID OAuth : `com.paulfajfrowski.partant.web`.
- Key ID : `DHW9X54M6A`.
- Domaine : `jhhsysjdeyqsuztjtgea.supabase.co`.
- Retour : `https://jhhsysjdeyqsuztjtgea.supabase.co/auth/v1/callback`.

Le secret ES256 a été généré depuis la clé locale, sa signature vérifiée, puis envoyé uniquement à Supabase Auth. La clé `.p8` n’a pas été envoyée à Supabase et reste exclue de Git. Le diff de configuration a été limité au fournisseur Apple ; Google reste actif.

**Expiration du secret : 17 mars 2027 à 08:55:30 UTC. Renouveler avant cette date**, idéalement début mars, avec la même clé si elle n’a pas été révoquée. Le script crée un secret de 180 jours, ne l’affiche pas, protège et supprime sa configuration temporaire :

```sh
node scripts/configure-apple-auth.mjs /chemin/absolu/AuthKey_DHW9X54M6A.p8 4STLA425HP DHW9X54M6A com.paulfajfrowski.partant.web
```

Après un renouvellement, reporter ici la nouvelle expiration affichée par le script. Aucune rotation automatique n’est installée.

### Contrôles effectués et recette restante

- Supabase `/auth/v1/settings` : Apple et Google actifs.
- Départ OAuth PKCE : HTTP 302 vers Apple, Services ID et URL de retour exacts.
- Configuration Expo : Bundle ID, Team ID et schéma `partant` valides.
- Simulation locale : HTTP 200.
- Advisor Supabase : sept informations RLS sur les tables privées volontairement inaccessibles aux clients ; aucune alerte WARN/ERROR renvoyée lors de ce contrôle. [Explication RLS](https://supabase.com/docs/guides/database/database-linter?lint=0008_rls_enabled_no_policy).

**Le premier consentement Apple et l’échange du code contre une session ne sont pas encore testés.** Le départ OAuth ne prouve pas que la clé est associée au bon App ID dans Apple Developer ; seul un échange réel valide l’ensemble.

Ouvrir `http://127.0.0.1:8081/?data=connected&version=apple-connected-11`, puis « Continuer avec Apple ». Si une session existe, se déconnecter d’abord. Vérifier le retour dans Partant, la création du profil client/coach, l’adresse masquée si choisie et la reconnexion au même compte. Le nom est demandé par Partant car le flux OAuth web Apple ne le fournit pas. Tester également un refus de consentement.

Sur téléphone, utiliser un development build signé : le parcours actuel ouvre le navigateur sécurisé. Le SDK natif Apple n’est pas intégré par cette livraison. Aucune publication App Store n’a été réalisée. La synchronisation iCloud Calendar n’est pas incluse.

Les instructions ci-dessous sont conservées pour recréer ou modifier la configuration Apple. [Documentation Supabase](https://supabase.com/docs/guides/auth/social-login/auth-apple).

## Guide de configuration

## 1. Identifiant de l’application

Ouvrir [Certificates, Identifiers & Profiles](https://developer.apple.com/account/resources/identifiers/list), puis **Identifiers → + → App IDs → App**.

- Description : `Partant`.
- Bundle ID : **Explicit**. `com.paulfajfrowski.partant` (valeur enregistrée).
- Capabilities : cocher **Sign in with Apple**. Le configurer comme App ID principal si Apple le demande.
- Continuer puis enregistrer.

Si un App ID Partant existe déjà, le réutiliser et communiquer sa valeur exacte ; ne pas créer un doublon. Le bundle de l’application Expo sera aligné avec l’identifiant effectivement enregistré.

## 2. Identifiant de connexion web

Toujours dans **Identifiers → +**, choisir **Services IDs**.

- Description : `Partant connexion`.
- Identifier : `com.paulfajfrowski.partant.web` (valeur enregistrée).
- Enregistrer, rouvrir cet identifiant, cocher **Sign in with Apple → Configure**.
- Primary App ID : sélectionner l’App ID Partant créé à l’étape précédente.
- Domains and Subdomains : `jhhsysjdeyqsuztjtgea.supabase.co` — sans `https://`.
- Return URLs : `https://jhhsysjdeyqsuztjtgea.supabase.co/auth/v1/callback`.
- **Done → Continue → Save**.

Ces champs correspondent au flux OAuth Supabase utilisé pour la simulation dans le navigateur. [Procédure Apple](https://developer.apple.com/help/account/capabilities/configure-sign-in-with-apple-for-the-web/), [configuration Supabase](https://supabase.com/docs/guides/auth/social-login/auth-apple).

## 3. Clé de signature

Dans **Keys → +** :

- Key Name : `Partant Sign in with Apple`.
- Cocher **Sign in with Apple → Configure**, sélectionner l’App ID Partant.
- Continuer, enregistrer puis télécharger le fichier `AuthKey_XXXXXXXXXX.p8`.
- Noter le **Key ID** affiché.

Conserver la clé : Apple n’en permet qu’un téléchargement. Elle est ignorée par Git dans Partant. [Documentation Apple](https://developer.apple.com/help/account/keys/create-a-private-key/).

## 4. Informations à transmettre à l’agent

- **Team ID** : visible dans les informations d’adhésion du compte Developer.
- **App ID / Bundle ID** effectivement enregistré.
- **Services ID** effectivement enregistré.
- **Key ID**.
- **Chemin local** du fichier `.p8`, sans coller son contenu.

L’agent pourra générer le secret Apple côté serveur, configurer Supabase, puis vérifier l’apparition du bouton. Le premier consentement Apple et le retour à l’application devront être testés avec le propriétaire. Le secret OAuth Apple doit être renouvelé avant six mois ; conserver la clé pour ce renouvellement. [Règles Supabase](https://supabase.com/docs/guides/auth/social-login/auth-apple).
