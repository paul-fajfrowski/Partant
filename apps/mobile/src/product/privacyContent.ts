/** Versioned development notice. Never fill legal identity or retention claims by guesswork. */
export const privacyNotice = {
  version: "2026-09-22.1",
  updated: "22 septembre 2026",
  controller: "",
  contactEmail: "",
};
export const privacyRequestKinds = [
  "Accès à mes données",
  "Rectification de mes données",
  "Effacement de mes données",
  "Portabilité de mes données",
  "Opposition ou limitation",
  "Question sur la confidentialité",
];
export function privacySections(coach: boolean) {
  return [
    {
      title: "Pourquoi ces informations ?",
      text: "Le nom, l’e-mail et les informations de séance permettent de gérer votre compte, vos réservations et vos échanges. Le téléphone est facultatif. Vos préférences de pratique, d’objectif, de budget et de secteur servent à vous proposer des coachs pertinents ; elles sont modifiables. La connexion par Apple ou Google transmet les informations de profil autorisées par le fournisseur.",
    },
    {
      title: "Qui peut voir quoi ?",
      text: coach
        ? "Votre profil publié, votre photo, vos offres, vos disponibilités et vos lieux de séance sont visibles par les personnes qui explorent Partant. Vos justificatifs sont réservés à vous et à l’équipe habilitée à les vérifier. Vos échanges avec un client ne constituent pas une conversation de groupe. L’équipe peut accéder aux informations nécessaires à une demande d’assistance."
        : "Votre profil client n’est pas un profil public de coach. Le coach reçoit les informations utiles à votre séance, dont votre nom, votre objectif et votre adresse pour une séance à domicile. Les avis publiés affichent le nom de leur auteur. L’équipe peut accéder aux informations nécessaires à une demande d’assistance.",
    },
    {
      title: "Secteur, adresse et carte",
      text: "Cette version n’accède pas au GPS du téléphone et ne suit pas vos déplacements. Le secteur sélectionné est enregistré dans vos préférences ou votre profil. La recherche d’adresse interroge l’IGN avec le texte saisi ; l’affichage de la carte contacte les serveurs cartographiques OpenStreetMap. Ces services reçoivent aussi les informations techniques de la connexion. Une adresse de lieu publiée par un coach est visible ; l’adresse du domicile d’un client ne figure pas dans la découverte publique.",
    },
    {
      title: "Notifications et calendriers",
      text: "Les notifications du téléphone sont facultatives. Leur activation enregistre un identifiant d’appareil pour acheminer vos alertes via Apple ; vous pouvez les désactiver et choisir les catégories dans les réglages. Aucune inscription publicitaire n’est déclenchée à la création du compte. La connexion Google Calendar est distincte de la connexion Google au compte : vous choisissez les agendas à synchroniser et pouvez les déconnecter. L’ajout dans Apple Calendar se fait à votre initiative depuis une séance.",
    },
    {
      title: "Services et stockage",
      text: "Supabase fournit l’authentification, le stockage et les fonctions serveur. Apple et Google interviennent si vous choisissez leurs services. L’appareil conserve la session de connexion et certains brouillons pour votre usage. La démonstration conserve ses données localement. Cette version ne collecte ni IBAN ni carte bancaire. Les garanties contractuelles, les lieux d’hébergement et les éventuels transferts internationaux doivent être documentés avant l’ouverture publique.",
    },
    {
      title: "Conservation et suppression",
      text: "La suppression de compte retire l’accès au service et anonymise une partie de l’historique. Elle ne signifie pas l’effacement instantané de toute trace : des références de séances subsistent chez les interlocuteurs. Pour une demande d’effacement plus large, utilisez la demande concernant vos données. Les durées par catégorie, les sauvegardes et la purge des fichiers sont en cours de formalisation pour l’ouverture publique ; aucune durée de conservation définitive n’est annoncée dans cette version de test.",
    },
    {
      title: "Vos droits et les bases légales",
      text: "Selon le traitement, vous disposez de droits d’accès, de rectification, d’effacement, de limitation, d’opposition et de portabilité. Un consentement facultatif peut être retiré. Les données objectivement nécessaires au compte et aux réservations relèvent de l’exécution du service ; les autres finalités doivent avoir une base légale propre. La politique définitive précisera ces bases par traitement. Vous pouvez adresser une réclamation à la CNIL. Consulter cette notice n’est pas consentir à tous les usages possibles de vos données.",
    },
  ];
}
