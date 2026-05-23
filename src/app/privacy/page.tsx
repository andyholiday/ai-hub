// =============================================================================
// Privacy Policy Page (Art. 13 DSGVO / GDPR)
// Public route — no authentication required.
// Placeholder sections to be completed by the data protection officer.
// =============================================================================

export const metadata = {
  title: "Datenschutzerklärung | AI Hub",
  description: "Informationen zur Verarbeitung personenbezogener Daten im AI Hub.",
};

export default function PrivacyPage() {
  return (
    <main className="mx-auto max-w-3xl px-4 py-12">
      <h1 className="mb-8 text-3xl font-bold">Datenschutzerklärung</h1>

      {/* 1. Verantwortlicher */}
      <section className="mb-8">
        <h2 className="mb-3 text-xl font-semibold">1. Verantwortlicher</h2>
        <p className="text-muted-foreground">
          [Platzhalter: Name, Anschrift und Kontaktdaten des Verantwortlichen
          gemäß Art. 13 Abs. 1 lit. a DSGVO eintragen.]
        </p>
      </section>

      {/* 2. Datenarten */}
      <section className="mb-8">
        <h2 className="mb-3 text-xl font-semibold">2. Verarbeitete Datenarten</h2>
        <p className="text-muted-foreground">
          [Platzhalter: Übersicht der verarbeiteten personenbezogenen Daten
          (z. B. Name, E-Mail-Adresse, Chat-Inhalte, Nutzungsmetriken).]
        </p>
      </section>

      {/* 3. Zwecke */}
      <section className="mb-8">
        <h2 className="mb-3 text-xl font-semibold">3. Verarbeitungszwecke</h2>
        <p className="text-muted-foreground">
          [Platzhalter: Zwecke der Datenverarbeitung gemäß Art. 13 Abs. 1
          lit. c DSGVO, z. B. Bereitstellung der Plattform, KI-Mentoring,
          Gamification, Community-Features.]
        </p>
      </section>

      {/* 4. Rechtsgrundlagen */}
      <section className="mb-8">
        <h2 className="mb-3 text-xl font-semibold">4. Rechtsgrundlagen</h2>
        <p className="text-muted-foreground">
          [Platzhalter: Rechtsgrundlagen je Verarbeitungszweck gemäß
          Art. 13 Abs. 1 lit. c DSGVO (z. B. Einwilligung Art. 6 Abs. 1 lit. a,
          Vertragserfüllung Art. 6 Abs. 1 lit. b, berechtigtes Interesse
          Art. 6 Abs. 1 lit. f).]
        </p>
      </section>

      {/* 5. Betroffenenrechte */}
      <section className="mb-8">
        <h2 className="mb-3 text-xl font-semibold">5. Betroffenenrechte</h2>
        <p className="text-muted-foreground">
          [Platzhalter: Hinweis auf Rechte nach Art. 15–22 DSGVO
          (Auskunft, Berichtigung, Löschung, Einschränkung, Datenübertragbarkeit,
          Widerspruch) sowie Beschwerderecht bei der zuständigen
          Aufsichtsbehörde gemäß Art. 13 Abs. 2 lit. d DSGVO.]
        </p>
        <p className="mt-2 text-muted-foreground">
          Zur Ausübung Ihrer Löschrechte (Art. 17 DSGVO) können Sie Ihr Konto
          jederzeit in den Profileinstellungen löschen.
        </p>
      </section>

      {/* 6. Speicherdauer und Löschung */}
      <section className="mb-8">
        <h2 className="mb-3 text-xl font-semibold">6. Speicherdauer und Löschung</h2>
        <p className="text-muted-foreground">
          [Platzhalter: Speicherdauern je Datenkategorie gemäß
          Art. 13 Abs. 2 lit. a DSGVO. Chat-Nachrichten werden nach 90 Tagen
          automatisch gelöscht. Weitere Fristen sind zu ergänzen.]
        </p>
      </section>
    </main>
  );
}
