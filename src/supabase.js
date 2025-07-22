import { createClient } from '@supabase/supabase-js';

// Paste your Project URL and anon key here
export const supabase = createClient(
  'https://ptzfvjqsziwymettnwtk.supabase.co', // <-- your URL
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB0emZ2anFzeml3eW1ldHRud3RrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTMwOTI0NjAsImV4cCI6MjA2ODY2ODQ2MH0.VS-xfxlmlOxZf7pmQ4kSk7wQEOy-cJ4V8d5w4B3HrDk'
);
