# LTS Cloud 1.0 — sostituzione operativa di CircleCI

## Perimetro approvato
LTS Cloud è un centro CI per eseguire, controllare e diagnosticare i collaudi dei progetti GitHub pubblici e privati. Non è un provider di hosting, database o storage produttivo. Questo mandato sostituisce il precedente piano cloud generalista. Conservare le funzionalità di laboratorio esistenti senza ampliarle; le risorse interne di persistenza, log e backup servono solo alla CI.

## Vincoli
- Nessun costo aggiuntivo, Strix, riattivazione CircleCI, nuovo ambiente cloud o acquisto non autorizzato. Verificare quote e costi prima di attivare qualsiasi backend di esecuzione.
- LTS privato resta privato; nessun cambio di visibilità per ottenere minuti gratuiti. Non modificare produzione, F49–F53, RC4, MFA/JWT/RLS, Porti/CNT/Booking TFG, tariffe, note, documenti o PDF.
- Conservare i gate esistenti di cloud-validation.yml, OAuth, PKCE, owner, quota RC3, CSP, Gitleaks, Semgrep e OSV. Nessun indebolimento dei required checks. Non modificare workflow o impostazioni dei repository collegati senza autorizzazione separata.
- Segreti solo lato server o vault autorizzato; mai in browser, Git, chat, log o artefatti pubblici. Non pubblicare il codice privato.
- Nessun merge, deploy o attivazione di runner reali senza approvazione esplicita. Termux solo se indispensabile. Non eseguire test distruttivi o usare dati reali senza autorizzazione.

## A — Inventario e compatibilità
- [ ] Inventariare job, immagini, versioni, dipendenze, variabili, gate e risultati attesi delle configurazioni CircleCI esistenti; sola lettura. Distinguere job Linux, browser e Android/JVM dagli eventuali job Apple che richiedono macOS.
- [ ] Mappare i job a pipeline LTS riproducibili senza chiamare CircleCI. Versionare template e immagini, testare equivalenza e non perdere gate.
- [ ] Gestione multiprogetto con repository, branch e workflow autorizzati; inventario iniziale separato per LTS-Cloud, LTS-Registro-Viaggi e LTS privato. Collegamenti effettivi con permessi minimi da autorizzare.

## B — Esecuzione e runner
- [ ] Separare control plane (console/Worker, stato e API) dal compute plane (runner Linux). Il Worker non esegue container o suite di compilazione arbitrarie.
- [ ] Progettare backend runner indipendente da CircleCI e, per repository privati, dalla necessità di acquistare minuti hosted. Valutare runner proprio con orchestratore locale; GitHub Actions self-hosted è alternativa solo se costi, limiti e policy effettivi consentono il vincolo zero spesa. Conservare Actions hosted pubbliche esistenti come percorso opzionale.
- [ ] Runner autenticato, connessioni outbound, registrazione/revoca, heartbeat, coda, lease e timeout, singolo job iniziale, annullamento sicuro e recupero dopo crash. Nessuna porta pubblica o socket Docker esposto.
- [ ] Checkout dello SHA esatto, ambiente effimero isolato per job, limiti CPU/RAM/disco/tempo, rete controllata, pulizia e separazione credenziali/artefatti. Mai eseguire PR pubbliche non fidate su runner persistente che accede a repository privati, host o produzione. Per codice non fidato usare esecuzione isolata senza segreti; se non disponibile bloccare.
- [ ] Toolchain Node.js, Python, Java/JDK, Playwright Chromium/WebKit e Android SDK ove richiesto; test e build su risorse disponibili. Non scaricare o installare toolchain onerose senza verifica.
- [ ] Profilo hardware indicativo per una pipeline alla volta: 4 core/8 GB minimo per test leggeri, 8 core/16 GB RAM/SSD 512 GB consigliati; misurare picchi e spazio, non attestare capacità per Android o job paralleli senza prova. Nessun hardware acquisito in questa PR.

## C — Pipeline e dashboard
- [ ] Avvio manuale e, dove autorizzato, trigger PR/push; coda, stato reale queued/running/success/failure/cancelled, durata, SHA, branch, job e step. Verificare firme webhook se utilizzati e deduplicare eventi.
- [ ] Annullamento/riesecuzione, log live o aggiornati, storico e filtri, artefatti di test/build con checksum e retention limitata; non confondere richiesta accettata con collaudo concluso.
- [ ] Stato check GitHub sul commit esatto, integrazione required checks solo dopo parità e autorizzazione. Non dichiarare PASS su skip/timeout/runner offline.
- [ ] Interfaccia mobile/desktop, errori, stato non configurato, runner offline e quote. Niente shell arbitraria o target URL arbitrari da dashboard.

## D — Sicurezza e budget
- [ ] OAuth/PKCE, owner, cookie sicuri, Origin, scadenza, revoca server-side, isolamento progetti e permessi granulari. Credenziali GitHub App/token dedicati solo al repository e alle azioni necessarie; scrittura check separata da scrittura codice.
- [ ] Difesa da CSRF, SSRF, injection, replay, traversal, race, escalation, esfiltrazione log e abuso runner; audit sanitizzato e accesso ai log privati autorizzato.
- [ ] Cost Guard fail-closed: bloccare risorse a pagamento o costo sconosciuto, limitare concorrenza e durata, spazio e quota. Conservare limiti RC3 (10 tentativi/giorno, 30 secondi) sulle azioni GitHub esistenti; nuovi limiti runner espliciti e verificabili. Nessuna garanzia di costo energetico nullo per hardware proprio.
- [ ] Usare persistenza esistente solo se autorizzata e necessaria per coda/stato/audit. Nessun nuovo database produttivo o storage applicativo; log privati e artefatti non sensibili con separazione e retention.

## E — Collaudo e migrazione CI
- [ ] Test locali su fixture sintetiche: coda, runner, crash, timeout, cancel, retry, SHA, isolamento, quote, log, retention, check GitHub e sicurezza. Test Chromium/WebKit e mobile dove disponibili.
- [ ] Verificare parità con i gate CircleCI per almeno un progetto pubblico e uno privato autorizzati, con test veri e prove sullo SHA finale; nessuna chiamata CircleCI. Iniziare in modalità shadow, senza cambiare gate.
- [ ] Matrice PASS/FAIL/BLOCKED/NON ESEGUITO con evidenze, costi, limiti e dipendenze. Verificare il percorso gratuito effettivo, runner reale, check pubblici/privati, logout e rollback; nessun falso 100%.
- [ ] Solo dopo collaudo e approvazione separata: piano di sostituzione dei required checks CircleCI e attivazione CI per progetto, con rollback senza riattivazione automatica di CircleCI. Conservare configurazioni storiche come riferimento.

## Definizione di completamento
La PR deve contenere implementazioni e test funzionanti, non solo documentazione. Il 100% riguarda il perimetro CI concordato, non hosting/database/storage. Se manca un runner fisico autorizzato, un permesso o un percorso a costo zero, dichiarare il blocco, conservare la candidata e richiedere solo l'autorizzazione necessaria; non aggirare i vincoli. Nessun merge/deploy automatico.