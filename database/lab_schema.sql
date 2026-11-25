-- Only for an ephemeral PostgreSQL cluster created by tests/database_lab.sh.
BEGIN;
CREATE ROLE lts_lab_alice NOLOGIN NOSUPERUSER NOBYPASSRLS;
CREATE ROLE lts_lab_bob NOLOGIN NOSUPERUSER NOBYPASSRLS;
CREATE ROLE lts_lab_denied NOLOGIN NOSUPERUSER NOBYPASSRLS;
CREATE SCHEMA lts_lab;
REVOKE ALL ON SCHEMA lts_lab FROM PUBLIC;
CREATE TABLE lts_lab.projects (
  id integer PRIMARY KEY,
  owner_role name NOT NULL,
  name text NOT NULL CHECK(length(name) BETWEEN 1 AND 120),
  UNIQUE (id, owner_role)
);
CREATE TABLE lts_lab.records (
  id integer PRIMARY KEY,
  project_id integer NOT NULL,
  owner_role name NOT NULL,
  label text NOT NULL CHECK(length(label) BETWEEN 1 AND 120),
  FOREIGN KEY(project_id, owner_role) REFERENCES lts_lab.projects(id, owner_role)
);
REVOKE ALL ON ALL TABLES IN SCHEMA lts_lab FROM PUBLIC;
GRANT USAGE ON SCHEMA lts_lab TO lts_lab_alice, lts_lab_bob;
GRANT SELECT ON lts_lab.projects TO lts_lab_alice, lts_lab_bob;
GRANT SELECT, INSERT, UPDATE, DELETE ON lts_lab.records TO lts_lab_alice, lts_lab_bob;
ALTER TABLE lts_lab.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE lts_lab.projects FORCE ROW LEVEL SECURITY;
ALTER TABLE lts_lab.records ENABLE ROW LEVEL SECURITY;
ALTER TABLE lts_lab.records FORCE ROW LEVEL SECURITY;
CREATE POLICY own_projects ON lts_lab.projects FOR SELECT TO lts_lab_alice, lts_lab_bob USING (owner_role = current_user);
CREATE POLICY own_records ON lts_lab.records FOR ALL TO lts_lab_alice, lts_lab_bob USING (owner_role = current_user) WITH CHECK (owner_role = current_user);
INSERT INTO lts_lab.projects VALUES (1,'lts_lab_alice','Progetto sintetico A'),(2,'lts_lab_bob','Progetto sintetico B');
INSERT INTO lts_lab.records VALUES (1,1,'lts_lab_alice','Record A'),(2,2,'lts_lab_bob','Record B');
COMMIT;
