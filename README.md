# KDS Sync Service

This service syncs KDS (Kitchen Display System) metrics from Supabase to Airtable every 5 minutes.

## Environment Variables

Required:
- `SUPABASE_PROJECT_ID`: Your Supabase project ID
- `SUPABASE_ANON_KEY`: Your Supabase anon/public key

## Deployment

This service is designed to run on Railway with a cron schedule of `*/5 * * * *` (every 5 minutes).

## Local Testing

1. Create a `.env` file with your environment variables
2. Run `npm install`
3. Run `npm start`
