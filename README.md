# LTS Pipeline V0.3 — tema CI/CD

Interfaccia ispirata a CircleCI, con identità LTS. Vista iniziale Pipeline, menu scuro, area chiara, workflow e stati compatti. Nessun collegamento reale.

# LTS Pipeline — 0.2.0

Prototipo statico, indipendente dai repository esistenti. Aprire `index.html` in un browser moderno oppure avviare `python -m http.server 8080` nella cartella e visitare `http://localhost:8080`. Nessuna dipendenza esterna, nessun account necessario, nessuna richiesta di rete. I dati demo si azzerano ricaricando la pagina.

## Roadmap
1. Repository privato dedicato e revisione del frontend. Hosting Cloudflare Workers Static Assets, con autenticazione prima di collegare informazioni private.
2. Backend autenticato e GitHub App con permessi minimi, token solo lato server. Lettura workflow, run, log (con protezioni per segreti), runner. Verificare autorizzazioni su ogni risorsa e audit.
3. Runner Linux isolato per repository privati; non eseguire codice non fidato sul PC personale o su runner persistenti con segreti. GitHub Actions cloud per repository pubblici. Verificare tariffe e limiti correnti prima dell'attivazione.
4. Azioni di avvio/annullamento/retry attraverso API autorizzate, con protezione CSRF, rate limiting, e registrazione degli eventi. Nessun merge automatico introdotto dal prototipo.
5. Migrazione controllata da CircleCI: equivalenza dei check, test di fallimento, required checks e branch protection preservati; disattivazione solo dopo esito positivo.

Non sono presenti login, API, deploy, pipeline reali, segreti o collegamenti GitHub. Tutti i nomi, stati, numeri e log in dashboard sono dimostrativi. Il frontend non è un sistema CI/CD operativo.

## Versione 0.2
Tema chiaro, navigazione con icone SVG e visualizzazione delle esecuzioni a schede su smartphone. Funzionalità demo invariate.


## Accesso riservato — GitHub OAuth
- Homepage: https://lts-pipeline.pasqualemilano0.workers.dev
- Authorization callback URL: https://lts-pipeline.pasqualemilano0.workers.dev/auth/callback
- Registrare una nuova OAuth App nelle impostazioni GitHub (Developer settings). Non richiedere accesso ai repository.
- Configurare GITHUB_CLIENT_ID e GITHUB_CLIENT_SECRET nelle variabili Secret del Worker lts-pipeline; SESSION_SECRET è una chiave casuale già predisposta su Cloudflare. Non inserire valori nel repository.
- Il Worker verifica l'identificativo numerico GitHub del proprietario, usa state, PKCE S256 e cookie di sessione firmati HttpOnly/Secure con scadenza di un'ora. Nessun token GitHub viene salvato. Prima di configurare le credenziali la console non è accessibile.
- L'integrazione futura con i repository privati richiederà autorizzazioni separate e limitate, preferibilmente con GitHub App. Nessuna pipeline reale è attiva.
- Pubblicazione iniziale tramite Cloudflare API; non è ancora configurata la pubblicazione automatica da GitHub. Il collaudo OAuth effettivo è necessario dopo la configurazione.
