# Supabase Setup Guide for LandParser App

## Step 1: Create a Supabase Project

1. Go to [https://supabase.com](https://supabase.com)
2. Sign up or log in
3. Click "New Project"
4. Choose your organization
5. Enter project details:
   - **Name**: `landparser-app`
   - **Database Password**: Choose a strong password
   - **Region**: Choose the closest region to you

## Step 2: Get Your Project Credentials

1. Go to your project dashboard
2. Click on "Settings" in the sidebar
3. Go to "API" section
4. Copy these values:
   - **Project URL** (looks like: `https://xxxxx.supabase.co`)
   - **anon public** key (starts with `eyJ...`)

## Step 3: Update Environment Variables

Update your `.env.local` file with your Supabase credentials:

```bash
# Replace these with your actual Supabase values
NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
```

## Step 4: Run the Database Schema

1. In your Supabase dashboard, go to "SQL Editor"
2. Click "New Query"
3. Copy and paste the contents of `database/supabase-schema.sql`
4. Click "Run" to execute the schema

## Step 5: Test Your Setup

1. Start your development server: `npm run dev`
2. Go to `http://localhost:3000`
3. Try submitting an encroachment request
4. Check the admin dashboard

## Default Login Credentials

- **Admin**: admin@landparser.com / password123
- **User**: user@landparser.com / password123

## Troubleshooting

- Make sure Row Level Security policies are set correctly
- Check that your environment variables are properly set
- Verify the database schema was created successfully
- Check the browser console for any connection errors

## Benefits of Supabase

✅ **No Local Setup**: Hosted database, no PostgreSQL installation needed
✅ **Real-time Updates**: Built-in real-time subscriptions
✅ **Easy Scaling**: Handles traffic spikes automatically
✅ **Free Tier**: Generous free tier for development and testing
✅ **Built-in Auth**: User authentication system (can be used later)
✅ **Dashboard**: Easy-to-use web interface for data management