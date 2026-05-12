-- ============================================================
-- Speedy iRepair — Minimal Dashboard Schema
-- 5 tables: tenants, users, calls, bookings, service_catalog
-- ============================================================

-- 1. Tenants (single row for Speedy, schema supports multi-tenant for future Voltaris clients)
CREATE TABLE public.tenants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_name TEXT NOT NULL,

  -- Square integration
  square_access_token TEXT,
  square_location_id TEXT,
  square_env TEXT DEFAULT 'sandbox' CHECK (square_env IN ('sandbox', 'production')),

  -- Retell integration
  retell_agent_id TEXT,
  retell_phone_number TEXT,

  -- Owner config
  business_hours JSONB DEFAULT '{"mon":{"open":"09:00","close":"18:00"},"tue":{"open":"09:00","close":"18:00"},"wed":{"open":"09:00","close":"18:00"},"thu":{"open":"09:00","close":"18:00"},"fri":{"open":"09:00","close":"18:00"},"sat":{"open":"10:00","close":"16:00"},"sun":null}'::jsonb,
  transfer_phone TEXT,
  escalation_email TEXT,
  timezone TEXT DEFAULT 'America/New_York',

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Users (linked to auth.users, scoped to tenant)
CREATE TABLE public.users (
  id UUID PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT,
  role TEXT DEFAULT 'owner' CHECK (role IN ('owner', 'staff')),
  is_active BOOLEAN DEFAULT TRUE,
  last_login_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(tenant_id, email)
);

-- 3. Calls (every Retell call, populated by post-call webhook)
CREATE TABLE public.calls (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,

  retell_call_id TEXT UNIQUE NOT NULL,
  channel TEXT DEFAULT 'phone' CHECK (channel IN ('phone', 'widget')),

  caller_phone TEXT,
  caller_name TEXT,

  started_at TIMESTAMPTZ NOT NULL,
  ended_at TIMESTAMPTZ,
  duration_seconds INTEGER,

  outcome TEXT CHECK (outcome IN ('booked', 'escalated', 'abandoned', 'missed', 'info_only', 'spam', 'other')),
  service_requested TEXT,
  summary TEXT,

  transcript JSONB,
  recording_url TEXT,

  booking_id UUID,

  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_calls_tenant_started ON public.calls(tenant_id, started_at DESC);
CREATE INDEX idx_calls_outcome ON public.calls(tenant_id, outcome);
CREATE INDEX idx_calls_caller_phone ON public.calls(caller_phone);

-- 4. Bookings (Square Appointments mirror — synced via Square webhooks)
CREATE TABLE public.bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,

  square_booking_id TEXT UNIQUE NOT NULL,
  square_customer_id TEXT,

  customer_name TEXT,
  customer_phone TEXT,
  customer_email TEXT,

  service_variation_id TEXT,
  service_name TEXT,
  team_member_id TEXT,
  team_member_name TEXT,

  start_at TIMESTAMPTZ NOT NULL,
  duration_minutes INTEGER,

  status TEXT DEFAULT 'confirmed' CHECK (status IN ('confirmed', 'cancelled', 'completed', 'noshow')),

  call_id UUID REFERENCES public.calls(id) ON DELETE SET NULL,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_bookings_tenant_start ON public.bookings(tenant_id, start_at);
CREATE INDEX idx_bookings_customer_phone ON public.bookings(customer_phone);

-- 5. Service catalog (cached from Square — phrase → service_variation_id mapping)
CREATE TABLE public.service_catalog (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,

  square_service_variation_id TEXT NOT NULL,
  square_service_variation_version BIGINT NOT NULL,

  name TEXT NOT NULL,
  duration_minutes INTEGER NOT NULL DEFAULT 30,
  price_cents INTEGER,

  -- Phrase aliases like ["screen repair","cracked screen","broken screen"]
  phrase_aliases TEXT[] DEFAULT ARRAY[]::TEXT[],

  is_active BOOLEAN DEFAULT TRUE,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(tenant_id, square_service_variation_id)
);

CREATE INDEX idx_service_catalog_aliases ON public.service_catalog USING GIN(phrase_aliases);

-- ============================================================
-- updated_at triggers
-- ============================================================

CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER tenants_set_updated_at BEFORE UPDATE ON public.tenants FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER bookings_set_updated_at BEFORE UPDATE ON public.bookings FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER service_catalog_set_updated_at BEFORE UPDATE ON public.service_catalog FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ============================================================
-- Helper: get current user's tenant_id (for RLS)
-- ============================================================

CREATE OR REPLACE FUNCTION public.current_tenant_id()
RETURNS UUID
LANGUAGE SQL STABLE SECURITY DEFINER
AS $$
  SELECT tenant_id FROM public.users WHERE id = auth.uid() LIMIT 1
$$;

-- ============================================================
-- RLS: each tenant only sees its own data
-- ============================================================

ALTER TABLE public.tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.calls ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.service_catalog ENABLE ROW LEVEL SECURITY;

-- Tenants: user can read/update their own tenant row
CREATE POLICY tenants_self_read ON public.tenants FOR SELECT USING (id = public.current_tenant_id());
CREATE POLICY tenants_self_update ON public.tenants FOR UPDATE USING (id = public.current_tenant_id());

-- Users: can read users in same tenant; can update self
CREATE POLICY users_tenant_read ON public.users FOR SELECT USING (tenant_id = public.current_tenant_id());
CREATE POLICY users_self_update ON public.users FOR UPDATE USING (id = auth.uid());

-- Calls: read-only for tenant members (writes happen via service_role from n8n)
CREATE POLICY calls_tenant_read ON public.calls FOR SELECT USING (tenant_id = public.current_tenant_id());

-- Bookings: read-only for tenant members
CREATE POLICY bookings_tenant_read ON public.bookings FOR SELECT USING (tenant_id = public.current_tenant_id());

-- Service catalog: read-only for tenant members
CREATE POLICY service_catalog_tenant_read ON public.service_catalog FOR SELECT USING (tenant_id = public.current_tenant_id());

-- ============================================================
-- Comments (self-documenting)
-- ============================================================

COMMENT ON TABLE public.tenants IS 'One row per Voltaris-Labs client (Speedy iRepair = first row)';
COMMENT ON TABLE public.users IS 'Dashboard users; provisioned manually by Voltaris (no self-signup)';
COMMENT ON TABLE public.calls IS 'Every Retell call, populated by n8n WF-SPEEDY-POSTCALL';
COMMENT ON TABLE public.bookings IS 'Square Appointments mirror, synced via WF-SPEEDY-SQUARE-WEBHOOK';
COMMENT ON TABLE public.service_catalog IS 'Cached Square catalog with phrase aliases for Jess to match natural language';
