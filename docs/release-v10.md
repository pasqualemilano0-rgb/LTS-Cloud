# LTS CLOUD 1.0.0-rc.1 — collaudo e criteri di rilascio
Questa versione è una console autenticata con laboratori isolati, non un cloud produttivo autonomo.
- GitHub: lettura pubblica a destinazione fissa; verificare con login reale prima del rilascio.
- Hosting, PostgreSQL, Storage, Backup e Monitor: test locali sintetici, non connessi ai sistemi esistenti.
- OAuth: test simulati di PKCE, identità, sessione e logout; il logout elimina il cookie dal browser, non revoca server-side una copia già sottratta. Sessione di un'ora.
- CI: conservare tutti i gate. Semgrep locale (tre regole mirate), Gitleaks e OSV non equivalgono a un penetration test completo.
- Nessuna migrazione, nessuna connessione produttiva, nessun nuovo servizio a pagamento.

## Passaggio a privato: blocchi obbligatori
NON cambiare la visibilità finché non sono collaudati entrambi i percorsi:
1. Lettura Actions privata: GitHub App installata soltanto su LTS-Cloud con Actions read-only e metadata minimi, oppure token fine-grained equivalente con scadenza. Segreto solo lato Worker; niente scope repo generico o token nel browser. Provare accesso autorizzato e rifiuto accessi estranei.
2. CI privata: runner dedicato e isolato per codice fidato, con label specifica e required checks; verificare effettivo funzionamento e costi prima del passaggio. Il workflow attuale salta il job sui repository privati: non trattare uno skip come PASS. Non usare runner persistente personale per PR pubbliche non fidate.
3. Verificare protezioni branch e disponibilità delle regole dopo il cambio di visibilità; verificare modalità di rollback e conservazione cronologia. Le copie pubbliche già scaricate non diventano private.
4. Solo dopo collaudo reale ed esplicita autorizzazione, eseguire il cambio e verificare nuovamente login, pipeline e gate.

## Checklist prima di 1.0 stabile
- CI completa sul commit esatto, prova mobile reale, login/logout e GitHub reale.
- Nessun falso stato di servizio operativo, documentare limiti.
- Conservare possibilità di rollback Worker.
- Confermare i blocchi di cui sopra; altrimenti mantenere release candidate, repository pubblico e nessuna migrazione.
