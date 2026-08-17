-- Bloque 5: Features técnicas

-- Notificaciones (in-app)
CREATE TABLE IF NOT EXISTS notifications (
  notification_id UUID         PRIMARY KEY,
  user_email      VARCHAR(200) NOT NULL,
  type            VARCHAR(60)  NOT NULL,
  title           VARCHAR(200) NOT NULL,
  body            TEXT         NOT NULL,
  read            BOOLEAN      NOT NULL DEFAULT FALSE,
  created_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_notifications_user_unread
  ON notifications (user_email, read, created_at DESC);

-- Webhooks
CREATE TABLE IF NOT EXISTS webhooks (
  webhook_id UUID         PRIMARY KEY,
  url        VARCHAR(500) NOT NULL,
  events     JSONB        NOT NULL DEFAULT '[]',
  secret     VARCHAR(200) NULL,
  active     BOOLEAN      NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- File attachments
CREATE TABLE IF NOT EXISTS attachments (
  attachment_id UUID         PRIMARY KEY,
  entity_type   VARCHAR(60)  NOT NULL,
  entity_id     UUID         NOT NULL,
  original_name VARCHAR(500) NOT NULL,
  mime_type     VARCHAR(200) NOT NULL,
  size_bytes    INT          NOT NULL,
  storage_path  VARCHAR(1000) NOT NULL,
  created_at    TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_attachments_entity
  ON attachments (entity_type, entity_id, created_at DESC);

-- Approval workflow: extend purchase_orders status constraint
ALTER TABLE purchase_orders DROP CONSTRAINT IF EXISTS purchase_orders_status_check;
ALTER TABLE purchase_orders ADD CONSTRAINT purchase_orders_status_check
  CHECK (purchase_order_status IN
    ('pending','pending_approval','approved','rejected','partial','received','cancelled'));
