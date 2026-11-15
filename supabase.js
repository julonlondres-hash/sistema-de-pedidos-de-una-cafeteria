import { createClient } from
'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm';

const SUPABASE_URL = 'https://izvypeasmolzmvwhsfkz.supabase.co';

const SUPABASE_ANON_KEY = 'sb_publishable_6ntoWOKsatVvv8qLZquffg_AwBt6NVQ';

export const supabase = createClient(
    SUPABASE_URL,
    SUPABASE_ANON_KEY
);