# LTS Pipeline — infrastruttura cloud

Un solo repository e una sola console: LTS Pipeline. I cinque nuovi moduli di progettazione (Hosting, Database, Storage, Backup, Monitor) affiancano le pipeline esistenti; nessun servizio collegato.

- Hosting: Coolify candidato, HTTPS e reverse proxy.
- Database: Supabase Self-Hosted candidato, PostgreSQL, Auth e RLS.
- Storage: documenti privati e permessi.
- Backup: copie cifrate esterne e test di ripristino.
- Monitor: metriche e disponibilità.

## Vincoli
Nessuna migrazione, nessun deploy, nessuna credenziale nuova, nessuna modifica ai servizi LTS, Cloudflare o Supabase esistenti. Conservare OAuth e isolamento del runner. I moduli sono solo frontend dimostrativo. Prima di ogni collegamento reale, progettare un laboratorio isolato, autorizzazioni minime, backup e collaudi. Ogni eventuale migrazione futura richiede una decisione esplicita separata.

## Collaudo richiesto
Navigazione desktop/mobile, interazioni pipeline esistenti, CSP e accesso OAuth in ambiente isolato prima di qualsiasi pubblicazione.
