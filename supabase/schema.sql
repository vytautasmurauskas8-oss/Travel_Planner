
-- =========================================
-- TRAVEL PLANNER DATABASE
-- =========================================

-- 1. Kelioniu lentele
CREATE TABLE public.trips (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL DEFAULT auth.uid()
        REFERENCES auth.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL CHECK (length(trim(title)) > 0),
    country TEXT NOT NULL CHECK (length(trim(country)) > 0),
    city TEXT NOT NULL CHECK (length(trim(city)) > 0),
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    description TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),

    CONSTRAINT valid_trip_dates
        CHECK (end_date >= start_date)
);

-- 2. Veiklu lentele
CREATE TABLE public.activities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    trip_id UUID NOT NULL
        REFERENCES public.trips(id) ON DELETE CASCADE,
    title TEXT NOT NULL CHECK (length(trim(title)) > 0),
    activity_date DATE NOT NULL,
    activity_time TIME,
    location TEXT,
    notes TEXT,
    is_completed BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 3. Indeksai
CREATE INDEX trips_user_id_idx
ON public.trips(user_id);

CREATE INDEX activities_trip_id_date_idx
ON public.activities(trip_id, activity_date);

-- 4. Automatinis updated_at atnaujinimas
CREATE FUNCTION public.set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = ''
AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$;

CREATE TRIGGER trips_updated_at
BEFORE UPDATE ON public.trips
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER activities_updated_at
BEFORE UPDATE ON public.activities
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at();

-- 5. Veiklos datos validacija
CREATE FUNCTION public.validate_activity_date()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = ''
AS $$
DECLARE
    trip_start DATE;
    trip_end DATE;
BEGIN
    SELECT start_date, end_date
    INTO trip_start, trip_end
    FROM public.trips
    WHERE id = NEW.trip_id
    FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Trip not found';
    END IF;

    IF NEW.activity_date < trip_start
       OR NEW.activity_date > trip_end THEN
        RAISE EXCEPTION
          'Activity date must be within trip dates';
    END IF;

    RETURN NEW;
END;
$$;

CREATE TRIGGER validate_activity_dates
BEFORE INSERT OR UPDATE ON public.activities
FOR EACH ROW
EXECUTE FUNCTION public.validate_activity_date();

-- 6. Tikriname keliones datu keitima
CREATE FUNCTION public.validate_trip_date_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = ''
AS $$
BEGIN
    IF NEW.start_date IS DISTINCT FROM OLD.start_date
       OR NEW.end_date IS DISTINCT FROM OLD.end_date THEN

        IF EXISTS (
            SELECT 1
            FROM public.activities
            WHERE trip_id = NEW.id
              AND (
                activity_date < NEW.start_date
                OR activity_date > NEW.end_date
              )
        ) THEN
            RAISE EXCEPTION
              'Existing activities fall outside new trip dates';
        END IF;
    END IF;

    RETURN NEW;
END;
$$;

CREATE TRIGGER validate_trip_dates_update
BEFORE UPDATE OF start_date, end_date ON public.trips
FOR EACH ROW
EXECUTE FUNCTION public.validate_trip_date_change();

-- 7. Ijungiame RLS
ALTER TABLE public.trips
ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.activities
ENABLE ROW LEVEL SECURITY;

-- 8. Kelioniu saugumo taisykles
CREATE POLICY "Users can read own trips"
ON public.trips
FOR SELECT TO authenticated
USING ((SELECT auth.uid()) = user_id);

CREATE POLICY "Users can create own trips"
ON public.trips
FOR INSERT TO authenticated
WITH CHECK ((SELECT auth.uid()) = user_id);

CREATE POLICY "Users can update own trips"
ON public.trips
FOR UPDATE TO authenticated
USING ((SELECT auth.uid()) = user_id)
WITH CHECK ((SELECT auth.uid()) = user_id);

CREATE POLICY "Users can delete own trips"
ON public.trips
FOR DELETE TO authenticated
USING ((SELECT auth.uid()) = user_id);

-- 9. Veiklu saugumo taisykles
CREATE POLICY "Users can read own activities"
ON public.activities
FOR SELECT TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.trips
        WHERE trips.id = activities.trip_id
        AND trips.user_id = (SELECT auth.uid())
    )
);

CREATE POLICY "Users can create own activities"
ON public.activities
FOR INSERT TO authenticated
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.trips
        WHERE trips.id = activities.trip_id
        AND trips.user_id = (SELECT auth.uid())
    )
);

CREATE POLICY "Users can update own activities"
ON public.activities
FOR UPDATE TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.trips
        WHERE trips.id = activities.trip_id
        AND trips.user_id = (SELECT auth.uid())
    )
)
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.trips
        WHERE trips.id = activities.trip_id
        AND trips.user_id = (SELECT auth.uid())
    )
);

CREATE POLICY "Users can delete own activities"
ON public.activities
FOR DELETE TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.trips
        WHERE trips.id = activities.trip_id
        AND trips.user_id = (SELECT auth.uid())
    )
);
