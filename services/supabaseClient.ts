import { createClient } from '@supabase/supabase-js';

// These should be configured in your Supabase Project Settings
const supabaseUrl = process.env.SUPABASE_URL || 'https://your-project-id.supabase.co';
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || 'your-anon-key';

/**
 * SQL Schema for Supabase:
 * 
 * -- Create Tasks Table
 * CREATE TABLE tasks (
 *   id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
 *   date DATE NOT NULL,
 *   area TEXT NOT NULL,
 *   category TEXT,
 *   job_description TEXT NOT NULL,
 *   assignee TEXT NOT NULL,
 *   status TEXT NOT NULL,
 *   remarks TEXT,
 *   photo_before TEXT,   -- Stores base64 for Before photo
 *   photo_progress TEXT, -- Stores base64 for Progress photo
 *   photo_after TEXT,    -- Stores base64 for After photo
 *   created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
 * );
 * 
 * -- Create Areas Table
 * CREATE TABLE areas (
 *   name TEXT PRIMARY KEY,
 *   category TEXT NOT NULL,
 *   created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
 * );
 */

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
