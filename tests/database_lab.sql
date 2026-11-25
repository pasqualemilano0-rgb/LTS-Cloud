\set ON_ERROR_STOP on
BEGIN;
SET LOCAL ROLE lts_lab_alice;
DO $$
DECLARE n integer;
BEGIN
  IF (SELECT count(*) FROM lts_lab.projects) <> 1 OR (SELECT count(*) FROM lts_lab.records) <> 1 THEN RAISE EXCEPTION 'RLS read isolation failed'; END IF;
  IF EXISTS(SELECT 1 FROM lts_lab.records WHERE id=2) THEN RAISE EXCEPTION 'Cross-owner read'; END IF;
  UPDATE lts_lab.records SET label='blocked' WHERE id=2;
  GET DIAGNOSTICS n=ROW_COUNT;
  IF n<>0 THEN RAISE EXCEPTION 'Cross-owner update'; END IF;
  DELETE FROM lts_lab.records WHERE id=2;
  GET DIAGNOSTICS n=ROW_COUNT;
  IF n<>0 THEN RAISE EXCEPTION 'Cross-owner delete'; END IF;
  BEGIN
    INSERT INTO lts_lab.records VALUES(3,2,'lts_lab_bob','forbidden');
    RAISE EXCEPTION 'Cross-owner insert succeeded';
  EXCEPTION WHEN insufficient_privilege THEN NULL;
  END;
  BEGIN
    UPDATE lts_lab.records SET owner_role='lts_lab_bob',project_id=2 WHERE id=1;
    RAISE EXCEPTION 'Ownership reassignment succeeded';
  EXCEPTION WHEN insufficient_privilege THEN NULL;
  END;
  BEGIN
    INSERT INTO lts_lab.records VALUES(3,2,'lts_lab_alice','forbidden relation');
    RAISE EXCEPTION 'Cross-owner relation succeeded';
  EXCEPTION WHEN foreign_key_violation THEN NULL;
  END;
  INSERT INTO lts_lab.records VALUES(3,1,'lts_lab_alice','Allowed');
  UPDATE lts_lab.records SET label='Updated' WHERE id=3;
  IF (SELECT label FROM lts_lab.records WHERE id=3) <> 'Updated' THEN RAISE EXCEPTION 'Own update failed'; END IF;
  DELETE FROM lts_lab.records WHERE id=3;
END $$;
RESET ROLE;
SET LOCAL ROLE lts_lab_bob;
DO $$ BEGIN
  IF (SELECT count(*) FROM lts_lab.records) <> 1 OR NOT EXISTS(SELECT 1 FROM lts_lab.records WHERE id=2 AND label='Record B') THEN RAISE EXCEPTION 'Bob isolation failed'; END IF;
END $$;
RESET ROLE;
SET LOCAL ROLE lts_lab_denied;
DO $$ BEGIN
  BEGIN
    PERFORM count(*) FROM lts_lab.records;
    RAISE EXCEPTION 'Unprivileged access succeeded';
  EXCEPTION WHEN insufficient_privilege THEN NULL;
  END;
END $$;
RESET ROLE;
ROLLBACK;
\echo PASS PostgreSQL RLS: own CRUD, cross-owner denial, foreign key isolation, denied role
