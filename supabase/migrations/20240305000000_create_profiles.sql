-- Create profiles table if it doesn't exist
CREATE TABLE IF NOT EXISTS profiles (
    id uuid REFERENCES auth.users(id) PRIMARY KEY,
    credits integer DEFAULT 150,
    created_at timestamp with time zone DEFAULT now()
);
