/*
# consume_open_tab RPC function

## Summary
Creates a SECURITY DEFINER function that atomically consumes from an OpenTab's remaining authorization. This prevents race conditions where multiple concurrent requests could overspend an OpenTab.

## Function
- `consume_open_tab(p_tab_id uuid, p_amount numeric)` — Atomically decrements remaining_amount and increments consumed_amount. Fails if remaining would go negative or if the tab is not active.

## Security
- SECURITY DEFINER so edge functions with service role can call it.
- Checks that the tab is active and not expired before consuming.

## Notes
1. This function is called by the evaluate-transaction edge function.
2. The CHECK constraint on open_tabs (remaining_amount >= 0) provides a database-level safety net.
3. Uses UPDATE ... WHERE to atomically check and consume in a single statement.
*/

CREATE OR REPLACE FUNCTION public.consume_open_tab(p_tab_id uuid, p_amount numeric)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  updated boolean;
BEGIN
  UPDATE open_tabs
  SET
    remaining_amount = remaining_amount - p_amount,
    consumed_amount = consumed_amount + p_amount
  WHERE
    id = p_tab_id
    AND status = 'active'
    AND expires_at > now()
    AND remaining_amount >= p_amount;

  GET DIAGNOSTICS updated = ROW_COUNT;

  IF NOT updated THEN
    RAISE EXCEPTION 'OpenTab consumption failed: tab not active, expired, or insufficient remaining authorization.';
  END IF;

  RETURN true;
END;
$$;
