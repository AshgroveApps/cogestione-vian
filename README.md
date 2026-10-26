# Cogestione Vian — Liceo Scientifico Statale «Ignazio Vian» (Bracciano)

Piattaforma completa per la **Cogestione**: gli studenti propongono corsi, i rappresentanti di istituto li approvano, tutti prenotano i posti e il giorno dell'evento le aule cambiano padroni. Solo per la sede di **Bracciano** (Largo Cesare Pavese, 1).

## Funzionalità

- **Accesso con nome e classe** (nessuna password, nessuna email) — sessione con cookie `httpOnly` + token casuale salvato in hashing SHA-256.
- **Proponi un corso**: titolo, descrizione, categoria, aula, data/orario, capacità (1–60 posti). La proposta entra in stato *in attesa*.
- **Area rappresentanti** (protetta da PIN):
  - approva/rifiuta le proposte (col motivo del rifiuto, visibile al proponente);
  - tabella di tutti i corsi con stato e iscritti;
  - lista iscritti per corso + **esportazione CSV** (UTF-8 con BOM, separatore `;`);
  - impostazioni evento: data cogestione (alimenta il countdown della home), apertura/chiusura delle prenotazioni (**configurabile**).
- **Catalogo pubblico** con ricerca e filtri per categoria; scheda corso con barra posti liberi.
- **Prenotazioni**: una prenotazione per studente per corso, fino a esaurimento posti; annullabili finché la finestra è aperta; controllo finestra lato server.
- **Area personale**: mie prenotazioni (con annulla) e mie proposte (con stato e motivo del rifiuto).
- **Home premium**: hero scuro con countdown, statistiche in tempo reale, "come funziona", corsi in evidenza.

## Stack

| Livello | Tecnologie |
|---|---|
| Backend | Node.js 24, Express 4, TypeScript, `node:sqlite` (zero moduli nativi), Zod, Helmet, express-rate-limit, cookie firmati lato server |
| Frontend | React 18, TypeScript, Vite 6, Tailwind CSS 3, React Router 6, lucide-react |
| Sicurezza | CSP/HSTS (produzione), controllo `Origin` sulle richieste mutanti, rate limiting (globale/auth/azioni), validazione di tutti gli input, SQL parametrizzato, cookie SameSite=Strict, nessun dato sensibile in chiaro |

## Struttura

```
├── client/          # SPA React + Tailwind
│   └── src/pages/   # Home, Corsi, Dettaglio, Proponi, Area personale, Rappresentanti, Regolamento
├── server/          # API Express
│   └── src/routes/  # auth, courses, bookings, settings
├── .env.example     # variabili d'ambiente
└── package.json     # script a livello root
```

## Avvio rapido

```bash
npm run install:all          # installa root, server e client
cp .env.example .env         # (oppure duplica) e cambia REP_PIN
npm run dev                  # sviluppo: API :4000 + Vite :5173
```

Sviluppo: apri **http://localhost:5173** (Vite proxya `/api` su :4000).

### Produzione

```bash
npm run build                # build di client (vite) e server (tsc)
npm start                    # server unico su :4000 che serve anche il sito
```

In produzione la home è su `http://localhost:4000/`.

## Configurazione (`.env`)

| Variabile | Default | Descrizione |
|---|---|---|
| `PORT` | `4000` | Porta del server |
| `REP_PIN` | `VianCogestione2026` | **PIN dei rappresentanti — cambiarlo obbligatoriamente in produzione** |
| `DB_PATH` | `server/data/cogestione.db` | Percorso database SQLite |
| `NODE_ENV` | `development` | `production` attiva CSP, cookie `secure`, trust proxy |

## Funzionamento (workflow)

1. Studente si identifica con **nome + classe** → propone un corso → stato *in attesa*.
2. **Rappresentanti** (PIN) approvano o rifiutano (con nota motivata).
3. Il corso approvato compare nel **catalogo**.
4. I rappresentanti **aprono la finestra di prenotazione** (data/ora configurabili).
5. Gli studenti **prenotano** il posto (1 a corso, fino a esaurimento); possono annullare finché la finestra è aperta.
6. I rappresentanti visualizzano gli **iscritti** ed esportano il CSV.
7. Giorno della cogestione: corsi nelle aule della sede di Bracciano.

## Nota

Il database nasce vuoto: le impostazioni dell'evento (data, finestra di prenotazione) vanno impostate dall'area rappresentanti. Per ripartire da zero, chiudere il server ed eliminare la cartella `server/data/`.
