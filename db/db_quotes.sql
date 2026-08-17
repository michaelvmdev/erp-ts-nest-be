-- Migration: Cotizaciones (Quotes)

CREATE SEQUENCE IF NOT EXISTS seq_quote_number START 1;

CREATE TABLE quotes (
  quote_id     UUID         PRIMARY KEY,
  quote_number VARCHAR(14)  NOT NULL UNIQUE,
  status       VARCHAR(20)  NOT NULL DEFAULT 'draft'
                 CONSTRAINT quotes_status_check
                 CHECK (status IN ('draft', 'sent', 'accepted', 'rejected', 'expired')),
  client_id    UUID         NOT NULL REFERENCES clients(client_id),
  quote_date   DATE         NOT NULL,
  valid_until  DATE         NOT NULL,
  notes        TEXT,
  sub_total    NUMERIC(12,2) NOT NULL CHECK (sub_total >= 0),
  igv          NUMERIC(12,2) NOT NULL CHECK (igv >= 0),
  total        NUMERIC(12,2) NOT NULL,
  created_at   TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  CONSTRAINT quotes_totals_check CHECK (total = sub_total + igv),
  CONSTRAINT quotes_valid_until_check CHECK (valid_until >= quote_date)
);

CREATE TABLE quote_details (
  quote_id   UUID          NOT NULL REFERENCES quotes(quote_id) ON DELETE CASCADE,
  item       INT           NOT NULL CHECK (item >= 1),
  product_id UUID          NOT NULL REFERENCES products(product_id),
  quantity   INT           NOT NULL CHECK (quantity >= 1),
  unit_price NUMERIC(12,2) NOT NULL CHECK (unit_price > 0),
  partial    NUMERIC(12,2) NOT NULL,
  PRIMARY KEY (quote_id, item),
  CONSTRAINT quote_details_partial_check CHECK (partial = quantity * unit_price)
);

CREATE INDEX idx_quotes_client_id   ON quotes(client_id);
CREATE INDEX idx_quotes_status      ON quotes(status);
CREATE INDEX idx_quotes_quote_date  ON quotes(quote_date);
