import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://lpbwewsramozumrcpfwh.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxwYndld3NyYW1venVtcmNwZndoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA5MjU1MjIsImV4cCI6MjA2NjUwMTUyMn0.A_Bw3JhaA3OxCoB8euE_unqgHYuB_SoBCYG7ePqSFuM'

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);