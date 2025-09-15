import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';

const SUPABASE_URL = 'https://ulsczwqtjuprqwvudxwx.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVsc2N6d3F0anVwcnF3dnVkeHd4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM3MzI3OTIsImV4cCI6MjA2OTMwODc5Mn0.c_ohDyb2_6GA8Pc6OJlPxLBnL_gq3bUtZmC_MTNvwd8';

export const supabase = createClient(
    SUPABASE_URL, 
    SUPABASE_ANON_KEY,
    {
        auth: {
            storage: AsyncStorage,
            persistSession: true,
            autoRefreshToken: true,
            detectSessionInUrl: false,
        },
    }
);