-- Add head hunting agreement acceptance timestamp to CEO coffee sessions
ALTER TABLE vcx_ceo_coffee_sessions
  ADD COLUMN agreement_accepted_at TIMESTAMPTZ;
