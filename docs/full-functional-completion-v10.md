# LTS Cloud — completamento funzionale 1.0 (mandato e gate di accettazione)

## Stato e perimetro
Baseline: main alla creazione del ramo. README e docs/release-v10.md definiscono una console OAuth con laboratori, non una piattaforma produttiva autonoma. I candidati RC2 e RC3 aggiungono D1 e controlli GitHub limitati; la presenza nel codice non certifica il deploy o l'attivazione. Questa PR nasce come mandato operativo: implementare e verificare i moduli, non soltanto aggiornare questa checklist. Nessun PASS senza evidenze sullo SHA finale.

## Vincoli invarianti
- Mantenere LTS-Cloud pubblico fino ai gate di privatizzazione di docs/release-v10.md e a specifica autorizzazione. Mai pubblicare LTS privato, dati personali, credenziali, backup o configurazioni riservate.
- Nessun costo aggiuntivo, Strix, CircleCI, nuovo ambiente cloud, nuovo servizio a pagamento, migrazione, modifica DNS o deploy senza autorizzazione separata. Usare laboratori locali effimeri, CI pubblica esistente con runner standard e risorse già autorizzate. Non abbassare protezioni, non creare nuove pipeline.
- Non modificare LTS Registro Viaggi, LTS privato, Officina Iodice, F49–F53, RC4, CNT, Porti, Booking TFG, tariffe, note, documenti, PDF, MFA, JWT, RLS, Cloudflare Worker/KV/cron o Supabase esistenti. Eventuali collegamenti futuri a progetti reali richiedono perimetro e autorizzazione separati.
- Segreti esclusivamente in secret store server-side; mai Git, browser, chat o log. Non chiedere credenziali in chiaro. Termux soltanto se indispensabile.
- Niente merge o pubblicazione senza approvazione esplicita e verifica trigger, backup e rollback. Se una capacità necessita hardware, credenziale dedicata, costi o autorizzazioni assenti, dichiararla BLOCKED e mantenere RC, non aggirare il vincolo.

## A — Inventario e architettura
- [ ] Mappare ogni controllo della dashboard alle API, alle risorse e ai permessi reali; distinguere demo, mock, read-only, operativo, non configurato e guasto.
- [ ] Verificare risorse già disponibili in sola lettura; scegliere adattatori con allowlist e separazione progetti. Documentare limiti, quote, dipendenze, threat model, responsabilità e costo incrementale prima di qualsiasi azione.
- [ ] Definire contratto API e modello di errori; nessun URL, comando shell, SQL o target di deploy arbitrario dall'utente.

## B — Identità, sicurezza e audit
- [ ] Conservare GitHub OAuth/PKCE, validazione identità owner, cookie sicuri e verifica Origin per scritture. Implementare/validare revoca server-side, scadenza, logout e isolamento; valutare MFA effettiva e step-up per operazioni ad alto rischio senza simulare attestazioni.
- [ ] Test negativi per anonimo, identità estranea, sessioni scadute/revocate, CSRF, injection, SSRF, traversal, replay, concorrenza e bypass quote. Audit sanitizzato con actor/azione/risultato/ID richiesta, niente token o contenuto privato.
- [ ] Verificare CSP e assenza di segreti con gate esistenti Gitleaks, Semgrep, OSV; conservare protezioni branch.

## C — Pipeline CI/CD
- [ ] Lettura stato e risultati reali, paginazione coerente, errori e rate limit. Solo destinazioni fisse autorizzate.
- [ ] Avvio, annullamento e riesecuzione con conferma, idempotenza o rifiuto duplicati, stato asincrono reale, quota atomica e cooldown RC3. Mantenere limite 10 tentativi/giorno, 30 s, repository/workflow/ref allowlisted e runner standard; nessun retry automatico o token generico.
- [ ] Verificare rifiuto di run PR non gestibili e repo privati; provare token mancante, API 401/403/429/5xx. Test reale solo con approvazione owner e permessi dedicati minimi già configurati; eventuale token nuovo va autorizzato e impostato fuori chat.
- [ ] Preservare workflow cloud-validation.yml e tutti i gate; nessun falso PASS su skip.

## D — Hosting
- [ ] Inventario autenticato di target autorizzati, stato HTTPS, risorse, versione e salute; distinguerlo dal laboratorio loopback.
- [ ] Implementare adattatore di deploy/rollback con artefatto immutabile, conferma, limiti e audit; collaudo end-to-end su app sintetica locale, senza esporre porte o socket Docker e senza deploy remoto.
- [ ] Prima di rendere operativo hosting remoto, verificare server esistente autorizzato e capacità di rollback; niente installazione, tunnel, acquisto o migrazione impliciti.

## E — Database
- [ ] Validare D1 RC2 (schema, binding, limiti, persistenza, errori) e accessi owner. Migrazioni versionate e rollback verificati in laboratorio, non eseguire DDL su risorse produttive.
- [ ] PostgreSQL: ruoli minimi, RLS, isolamento, operazioni consentite, transazioni, concorrenza e restore con dati sintetici; nessun editor SQL arbitrario. Distinguere D1, PostgreSQL laboratorio e possibile Supabase Self-Hosted futuro.
- [ ] Provare dati persistenti sul target dedicato solo se già autorizzato; non sostituire database degli altri progetti.

## F — Storage
- [ ] Upload/list/download/delete autenticati e conferma per cancellazione, verifica proprietario, integrità hash, dimensione e quota, nomi sanitizzati, MIME/download sicuro, scansione o rifiuto tipi non consentiti, audit e limiti.
- [ ] Preservare cap RC2 D1 di 20 file da 64 KiB e uso non sensibile. Per archivio persistente più ampio o documenti personali, richiedere soluzione autorizzata con cifratura e quote; nessuna attivazione R2 o aumento limiti impliciti.
- [ ] Test negativi di accesso incrociato, file alterati, path traversal, upload sovradimensionato e operazioni concorrenti.

## G — Backup e ripristino
- [ ] Backup cifrato autenticato, versionato, manifest/checksum, custodia chiavi separata, retention e destinazione autorizzata distinta dalla sorgente.
- [ ] Ripristino end-to-end su dati sintetici con verifica integrità e rifiuto chiave errata, backup alterato e snapshot incompleto. Non sovrascrivere dati reali. Non equiparare D1 recovery a backup indipendente.
- [ ] Pianificazione/schedulazione e monitor esiti soltanto su destinazione esistente autorizzata; verifica costi, RPO/RTO e rollback. Nessuna esportazione di dati personali.

## H — Monitor e dashboard
- [ ] Indicatori reali su target allowlisted: disponibilità, latenza, esiti pipeline, salute D1, storage e backup. Separare metriche host misurate da stati sintetici, ultimo aggiornamento e stato sconosciuto/stale.
- [ ] Storico con retention limitata, soglie e avvisi deduplicati; nessuna nuova risorsa o servizio di notifiche senza autorizzazione.
- [ ] UI desktop/mobile completa, stati loading/errore/vuoto/non configurato, accessibilità, conferme distruttive e aggiornamento senza esporre dati sensibili. Test Chromium e WebKit ove disponibili; collaudo dispositivo reale separato.

## I — Collaudo finale e rilascio
- [ ] Eseguire tutti i test esistenti e nuove regressioni per ciascun modulo sul commit finale; CI cloud-validation.yml completa, Gitleaks/Semgrep/OSV, browser, SQL, storage, backup/restore. Registrare esito, SHA, runner, data e limiti; skip != pass.
- [ ] Verificare login/logout reale, flussi operativi autorizzati, rollback, budget invariato e assenza di regressioni verso gli altri progetti. Niente test con dati reali non autorizzati.
- [ ] Applicare i gate di docs/release-v10.md per eventuale repo privato: GitHub Actions read-only dedicato, runner isolato e costo verificato, protezioni branch e rollback. Cambio visibilità separato, non incluso in questa PR.
- [ ] Aggiornare README e documentazione utente con matrice funzionale: per ogni capacità richiesta, stato PASS/FAIL/BLOCKED/NON ESEGUITO e prova. Niente definizione 100% o 1.0 stabile se anche una capacità obbligatoria è bloccata. Nessun rilascio in produzione senza autorizzazione.

## Definizione di completamento
La PR deve contenere implementazioni e test, non solo documentazione. Portarla a revisione dopo tutti i gate eseguibili, mantenere draft se restano blocchi essenziali, consegnare piano di risoluzione e richiedere esplicita autorizzazione per merge/deploy. Nessuna percentuale inventata. Se i vincoli impediscono la completa operatività reale, indicare quali moduli sono soltanto collaudati localmente e quali risorse/decisioni mancano. Conservare il lavoro in questo ramo.
