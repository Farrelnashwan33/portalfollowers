-- Supabase Row Level Security (RLS) Policies for Portal Followers

-- 1. Enable RLS on All Tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.packages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_status_history ENABLE ROW LEVEL SECURITY;

-- Helper function to check if current authenticated user is an admin
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = auth.uid() AND role = 'admin'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ----------------------------------------------------
-- PROFILES POLICIES
-- ----------------------------------------------------
-- Allow users to view their own profile
CREATE POLICY "Users can view own profile"
    ON public.profiles FOR SELECT
    USING (auth.uid() = id OR public.is_admin());

-- Allow users to update their own profile (cannot escalate to admin)
CREATE POLICY "Users can update own profile"
    ON public.profiles FOR UPDATE
    USING (auth.uid() = id)
    WITH CHECK (
        auth.uid() = id 
        AND (role = (SELECT role FROM public.profiles WHERE id = auth.uid()))
    );

-- Admin has full access to all profiles
CREATE POLICY "Admin full access on profiles"
    ON public.profiles FOR ALL
    USING (public.is_admin());

-- ----------------------------------------------------
-- PACKAGES POLICIES
-- ----------------------------------------------------
-- Public & users can view active packages
CREATE POLICY "Public can view active packages"
    ON public.packages FOR SELECT
    USING (is_active = true OR public.is_admin());

-- Only admins can insert, update, or delete packages
CREATE POLICY "Admin can insert packages"
    ON public.packages FOR INSERT
    WITH CHECK (public.is_admin());

CREATE POLICY "Admin can update packages"
    ON public.packages FOR UPDATE
    USING (public.is_admin());

CREATE POLICY "Admin can delete packages"
    ON public.packages FOR DELETE
    USING (public.is_admin());

-- ----------------------------------------------------
-- ORDERS POLICIES
-- ----------------------------------------------------
-- Users can view their own orders; guests can view order by exact order_code match
CREATE POLICY "Users can view own orders"
    ON public.orders FOR SELECT
    USING (
        (auth.uid() IS NOT NULL AND user_id = auth.uid())
        OR public.is_admin()
    );

-- Anyone (authenticated or guest via client) can insert an order with pending status
CREATE POLICY "Anyone can create order"
    ON public.orders FOR INSERT
    WITH CHECK (
        (user_id IS NULL OR user_id = auth.uid())
        AND payment_status = 'pending'
        AND service_status = 'pending'
    );

-- Only Admin can update orders (status, notes)
CREATE POLICY "Admin can update orders"
    ON public.orders FOR UPDATE
    USING (public.is_admin());

-- Only Admin can delete orders
CREATE POLICY "Admin can delete orders"
    ON public.orders FOR DELETE
    USING (public.is_admin());

-- ----------------------------------------------------
-- ORDER STATUS HISTORY POLICIES
-- ----------------------------------------------------
-- Users can view history for their own orders, or Admin
CREATE POLICY "Users can view own order history"
    ON public.order_status_history FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.orders
            WHERE orders.id = order_status_history.order_id
            AND (orders.user_id = auth.uid() OR public.is_admin())
        )
    );

-- Only Admin or system triggers can insert status history
CREATE POLICY "Admin can insert order history"
    ON public.order_status_history FOR INSERT
    WITH CHECK (public.is_admin());
