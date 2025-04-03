# Supabase Migrations

This directory contains SQL migrations for the Pixel Keywording application.

## Applying Migrations

### Option 1: Using the Supabase Web Interface

1. Log in to your Supabase dashboard at https://app.supabase.com
2. Navigate to your project: `alywdwwqrtddplqsbksd`
3. Go to the SQL Editor
4. Copy the contents of the migration file(s) in the `migrations` directory
5. Paste into the SQL Editor and run the query

### Option 2: Using the Supabase CLI

If you prefer using the CLI:

1. Install the Supabase CLI:
   ```bash
   npm install -g supabase
   ```

2. Login to Supabase:
   ```bash
   supabase login
   ```

3. Link your project:
   ```bash
   supabase link --project-ref alywdwwqrtddplqsbksd
   ```

4. Push the migrations:
   ```bash
   supabase db push
   ```

## Migration Files

- `20250303_history_stats_tables.sql`: Creates tables and functions for the History and Stats features
  - `processing_sessions`: Stores information about each batch of processed images
  - `processed_images`: Stores detailed information about each processed image
  - `user_stats`: Stores aggregated statistics for each user
  - Also includes Row Level Security policies and helper functions

## Database Schema

### processing_sessions
- `id`: UUID (Primary Key)
- `user_id`: UUID (Foreign Key to auth.users)
- `session_name`: TEXT
- `created_at`: TIMESTAMP WITH TIME ZONE
- `image_count`: INTEGER
- `success_count`: INTEGER
- `failure_count`: INTEGER
- `credits_used`: INTEGER
- `api_provider`: TEXT
- `expires_at`: TIMESTAMP WITH TIME ZONE (30 days from creation)

### processed_images
- `id`: UUID (Primary Key)
- `session_id`: UUID (Foreign Key to processing_sessions)
- `user_id`: UUID (Foreign Key to auth.users)
- `file_name`: TEXT
- `category`: TEXT
- `processing_time_ms`: INTEGER
- `status`: TEXT ('completed' or 'failed')
- `keywords`: TEXT[]
- `title`: TEXT
- `description`: TEXT
- `metadata`: JSONB
- `created_at`: TIMESTAMP WITH TIME ZONE

### user_stats
- `user_id`: UUID (Primary Key, Foreign Key to auth.users)
- `total_images_processed`: INTEGER
- `total_images_succeeded`: INTEGER
- `total_images_failed`: INTEGER
- `total_credits_used`: INTEGER
- `monthly_images_processed`: INTEGER
- `category_distribution`: JSONB
- `common_keywords`: JSONB
- `last_updated_at`: TIMESTAMP WITH TIME ZONE
