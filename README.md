# LTS CLOUD — 1.0.0-rc.1
Console personale per CI/CD e progettazione di infrastruttura. Il Worker esistente protegge la dashboard tramite GitHub OAuth; GitHub reale legge le ultime esecuzioni del solo repository pubblico LTS-Cloud. Gli altri moduli sono inventari e laboratori, non servizi produttivi.
## Moduli
- Pipeline demo e lettura pubblica GitHub.
- Hosting: laboratorio HTTP loopback.
- Database: PostgreSQL effimero con RLS e ruoli sintetici.
- Storage: archivio temporaneo con controllo proprietario.
- Backup: prova cifratura autenticata e ripristino.
- Monitor: campionamento locale e soglie.
## Collaudo
La pipeline Cloud validation esegue test backend e browser, Gitleaks, Semgrep con regole mirate e OSV. Nessun segreto nel repository. Aprire index.html in locale per demo senza connessioni.
## Rilascio
Vedi [criteri di rilascio e passaggio a privato](docs/release-v10.md). La visibilità pubblica è temporanea per il collaudo con runner hosted standard; non renderlo privato prima di collaudare lettura e CI private. Nessuna migrazione dei progetti esistenti.
