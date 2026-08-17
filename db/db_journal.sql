-- Libro diario (partida doble)
CREATE SEQUENCE IF NOT EXISTS seq_journal_number START 1;

CREATE TABLE IF NOT EXISTS journal_entries (
  entry_id       UUID         PRIMARY KEY,
  entry_number   VARCHAR(20)  NOT NULL UNIQUE,
  entry_date     DATE         NOT NULL,
  description    VARCHAR(500) NOT NULL,
  reference_type VARCHAR(30)  NOT NULL
    CONSTRAINT journal_entries_reference_type_check
      CHECK (reference_type IN ('sale','purchase','purchase_return','credit_note','manual')),
  reference_id   UUID         NULL,
  created_at     TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS journal_lines (
  entry_id     UUID          NOT NULL REFERENCES journal_entries(entry_id) ON DELETE CASCADE,
  line_number  INT           NOT NULL,
  account_code VARCHAR(15)   NOT NULL,
  account_name VARCHAR(200)  NOT NULL,
  debit        NUMERIC(14,2) NOT NULL DEFAULT 0 CHECK (debit  >= 0),
  credit       NUMERIC(14,2) NOT NULL DEFAULT 0 CHECK (credit >= 0),
  PRIMARY KEY (entry_id, line_number)
);

CREATE INDEX IF NOT EXISTS idx_journal_entries_date
  ON journal_entries (entry_date DESC);

CREATE INDEX IF NOT EXISTS idx_journal_entries_reference
  ON journal_entries (reference_type, reference_id)
  WHERE reference_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_journal_lines_account
  ON journal_lines (account_code);
