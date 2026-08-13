-- Tabla de auditoría de cambios
CREATE TABLE IF NOT EXISTS audit_log (
  audit_id      UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_type   VARCHAR(60)  NOT NULL,
  entity_id     VARCHAR(100) NOT NULL,
  action        VARCHAR(20)  NOT NULL CHECK (action IN ('CREATE', 'UPDATE', 'DELETE')),
  changed_by    VARCHAR(100) NOT NULL,
  payload       JSONB,
  created_at    TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_audit_log_entity ON audit_log (entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_created_at ON audit_log (created_at DESC);
