# Activer « Continuer avec Apple » pour Partant

Google Auth et Calendar sont configurés. Apple demande encore des éléments à créer dans le compte Apple Developer. Ces opérations enregistrent des identifiants et une clé ; elles ne publient pas Partant sur l’App Store.

## 1. Identifiant de l’application

Ouvrir [Certificates, Identifiers & Profiles](https://developer.apple.com/account/resources/identifiers/list), puis **Identifiers → + → App IDs → App**.

- Description : `Partant`.
- Bundle ID : **Explicit**. Proposition, si disponible : `com.paulfajfrowski.partant`.
- Capabilities : cocher **Sign in with Apple**. Le configurer comme App ID principal si Apple le demande.
- Continuer puis enregistrer.

Si un App ID Partant existe déjà, le réutiliser et communiquer sa valeur exacte ; ne pas créer un doublon. Le bundle de l’application Expo sera aligné avec l’identifiant effectivement enregistré.

## 2. Identifiant de connexion web

Toujours dans **Identifiers → +**, choisir **Services IDs**.

- Description : `Partant connexion`.
- Identifier : proposition `com.paulfajfrowski.partant.web`, si disponible.
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
