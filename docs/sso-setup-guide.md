# SSO/SAML 2.0 Setup Guide - AI Hub

## Uebersicht

Diese Anleitung beschreibt die Einrichtung von SAML 2.0 Single Sign-On (SSO) fuer den AI Hub mit Supabase Auth. SSO ermoeglicht es Organisationen, ihre bestehenden Identity Provider (IdP) wie Azure AD, Okta oder Google Workspace fuer die Authentifizierung zu nutzen.

## Voraussetzungen

- Supabase Pro Plan oder Self-Hosted Instanz (SSO ist ein Pro-Feature)
- Supabase CLI installiert (`npm install -g supabase`)
- Zugang zum Identity Provider der Organisation
- Admin-Zugriff auf das Supabase-Projekt

## Architektur

```
User --> AI Hub Login --> Supabase Auth --> SAML IdP --> Supabase Auth --> Redirect
```

Der Login-Flow laeuft wie folgt ab:

1. User klickt "Mit SSO anmelden" und gibt seine E-Mail-Domain ein
2. Supabase erkennt die Domain und leitet zum konfigurierten IdP weiter
3. User authentifiziert sich beim IdP (z.B. Azure AD)
4. IdP sendet SAML-Assertion zurueck an Supabase
5. Supabase erstellt/aktualisiert den User und leitet zum AI Hub zurueck

## Schritt 1: Informationen vom Identity Provider sammeln

Folgende Informationen werden vom IdP benoetigt:

| Information | Beschreibung | Beispiel |
|-------------|-------------|---------|
| **Metadata URL** | XML-Endpoint des IdP | `https://login.microsoftonline.com/.../federationmetadata/2007-06/federationmetadata.xml` |
| **Entity ID** | Eindeutige Kennung des IdP | `https://sts.windows.net/{tenant-id}/` |
| **SSO URL** | Login-Endpoint des IdP | `https://login.microsoftonline.com/.../saml2` |
| **X.509 Zertifikat** | Public Key des IdP zum Validieren der SAML-Assertions | Base64-codiertes Zertifikat |
| **E-Mail-Domain(s)** | Domain(s) der Organisation | `beispiel-firma.de` |

## Schritt 2: Supabase als Service Provider konfigurieren

### 2.1 ACS URL und Metadata bereitstellen

Der Identity Provider benoetigt folgende Informationen von Supabase:

- **ACS (Assertion Consumer Service) URL:**
  ```
  https://<SUPABASE_PROJECT_REF>.supabase.co/auth/v1/sso/saml/acs
  ```

- **Entity ID / Audience URI:**
  ```
  https://<SUPABASE_PROJECT_REF>.supabase.co/auth/v1/sso/saml/metadata
  ```

- **Metadata URL:**
  ```
  https://<SUPABASE_PROJECT_REF>.supabase.co/auth/v1/sso/saml/metadata
  ```

Ersetze `<SUPABASE_PROJECT_REF>` mit der Projekt-Referenz aus dem Supabase Dashboard.

### 2.2 Beim IdP registrieren

Im IdP (z.B. Azure AD) eine neue Enterprise Application / SAML-Integration anlegen und die obigen URLs eintragen.

## Schritt 3: SAML Provider via Supabase CLI hinzufuegen

### 3.1 Mit Metadata URL (empfohlen)

```bash
supabase sso add \
  --type saml \
  --metadata-url "https://idp.beispiel-firma.de/metadata.xml" \
  --domains "beispiel-firma.de" \
  --project-ref <SUPABASE_PROJECT_REF>
```

### 3.2 Mit Metadata-Datei

Falls der IdP keine oeffentliche Metadata URL bereitstellt:

```bash
supabase sso add \
  --type saml \
  --metadata-file ./idp-metadata.xml \
  --domains "beispiel-firma.de" \
  --project-ref <SUPABASE_PROJECT_REF>
```

### 3.3 Mehrere Domains

```bash
supabase sso add \
  --type saml \
  --metadata-url "https://idp.beispiel-firma.de/metadata.xml" \
  --domains "beispiel-firma.de,tochter-firma.de" \
  --project-ref <SUPABASE_PROJECT_REF>
```

## Schritt 4: Attribute Mapping

### Erforderliche SAML-Attribute

Supabase erwartet bestimmte Attribute in der SAML-Assertion. Konfiguriere das Attribute Mapping im IdP wie folgt:

| SAML Attribute (Claim) | Supabase Mapping | Beschreibung | Pflicht |
|------------------------|------------------|-------------|---------|
| `http://schemas.xmlsoap.org/ws/2005/05/identity/claims/emailaddress` | `email` | E-Mail-Adresse des Users | Ja |
| `http://schemas.xmlsoap.org/ws/2005/05/identity/claims/givenname` | `first_name` | Vorname | Empfohlen |
| `http://schemas.xmlsoap.org/ws/2005/05/identity/claims/surname` | `last_name` | Nachname | Empfohlen |
| `http://schemas.xmlsoap.org/ws/2005/05/identity/claims/name` | `display_name` | Anzeigename | Optional |

### Azure AD Beispiel-Konfiguration

Im Azure AD unter "Single Sign-On > Attributes & Claims":

1. **Required Claim:**
   - Name: `emailaddress`
   - Namespace: `http://schemas.xmlsoap.org/ws/2005/05/identity/claims`
   - Source: `user.mail`

2. **Additional Claims:**
   - `givenname` -> `user.givenname`
   - `surname` -> `user.surname`
   - `name` -> `user.displayname`

### Okta Beispiel-Konfiguration

In Okta unter "SAML Settings > Attribute Statements":

| Name | Value |
|------|-------|
| `email` | `user.email` |
| `first_name` | `user.firstName` |
| `last_name` | `user.lastName` |

## Schritt 5: SSO im AI Hub aktivieren

### 5.1 Environment Variable setzen

In `.env.local` hinzufuegen:

```env
NEXT_PUBLIC_SSO_ENABLED=true
```

### 5.2 Testen

1. Oeffne die Login-Seite des AI Hub
2. Der "Mit SSO anmelden" Button sollte jetzt sichtbar sein
3. Gib die E-Mail-Domain ein (z.B. `beispiel-firma.de`)
4. Du wirst zum IdP weitergeleitet
5. Nach erfolgreicher Authentifizierung landest du im Dashboard

## Verwaltung

### SSO-Provider auflisten

```bash
supabase sso list --project-ref <SUPABASE_PROJECT_REF>
```

### SSO-Provider aktualisieren

```bash
supabase sso update <PROVIDER_ID> \
  --metadata-url "https://neuer-idp.beispiel-firma.de/metadata.xml" \
  --project-ref <SUPABASE_PROJECT_REF>
```

### SSO-Provider entfernen

```bash
supabase sso remove <PROVIDER_ID> \
  --project-ref <SUPABASE_PROJECT_REF>
```

### SSO-Provider Info anzeigen

```bash
supabase sso show <PROVIDER_ID> \
  --project-ref <SUPABASE_PROJECT_REF>
```

## Fehlerbehebung

### Haeufige Probleme

**"No SSO provider found for this domain"**
- Pruefen, ob die Domain korrekt mit `supabase sso add --domains` registriert wurde
- Pruefen, ob der User die richtige E-Mail-Domain eingibt

**"SAML assertion invalid"**
- Zertifikat des IdP pruefen (abgelaufen?)
- ACS URL im IdP pruefen
- Uhrzeiten synchron? SAML-Assertions haben eine zeitliche Gueltigkeit

**User wird erstellt, aber hat keinen Zugriff**
- Der AI Hub prueft `is_approved` in der `profiles`-Tabelle
- SSO-User muessen ggf. manuell freigeschaltet werden
- Alternativ: Database-Trigger erstellen, der SSO-User automatisch freigibt

### Automatische Freigabe fuer SSO-User (optional)

SQL-Trigger fuer automatische Freigabe von SSO-Users:

```sql
CREATE OR REPLACE FUNCTION approve_sso_users()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.raw_app_meta_data->>'provider' = 'sso:saml' THEN
    INSERT INTO public.profiles (id, is_approved)
    VALUES (NEW.id, true)
    ON CONFLICT (id) DO UPDATE SET is_approved = true;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_sso_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION approve_sso_users();
```

## Sicherheitshinweise

- SAML-Zertifikate regelmaessig rotieren (IdP-seitig)
- Nur verifizierte Domains fuer SSO freischalten
- SSO-User sollten kein lokales Passwort setzen koennen
- Audit-Log fuer SSO-Logins aktivieren (Supabase Dashboard > Auth > Logs)
- Bei Self-Hosted: HTTPS fuer alle Endpoints sicherstellen
