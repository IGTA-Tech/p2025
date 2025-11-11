# Supabase Setup Guide

## ✅ What's Already Done

- ✅ Supabase client library installed
- ✅ Credentials added to `.env`
- ✅ Frontend code integrated with real-time subscriptions
- ✅ Form submission saves to database
- ✅ Stories load from database on page load

## 🚀 What You Need to Do (5 minutes)

### Step 1: Run the SQL Schema

1. Go to your Supabase dashboard: **https://app.supabase.com**
2. Select your project
3. Click **SQL Editor** in the left sidebar
4. Click **New query**
5. Copy the entire contents of `supabase-schema.sql` (in this directory)
6. Paste into the SQL editor
7. Click **Run** or press `Ctrl+Enter`

You should see a success message: `citizen_stories table created successfully!`

### Step 2: Verify the Table

1. Click **Table Editor** in the left sidebar
2. You should see a new table called `citizen_stories`
3. Click on it to view the structure

### Step 3: Enable Realtime (if not auto-enabled)

1. Go to **Database** → **Replication** in the sidebar
2. Find `citizen_stories` in the list
3. Toggle **Realtime** to ON (if it's not already)

### Step 4: Restart the Dev Server

```bash
# The dev server should auto-reload, but if needed:
npm run dev -- --host
```

## 🧪 Testing the Integration

### Test 1: Submit a Story

1. Go to http://148.230.81.154:5173/
2. Click **Citizen Portal**
3. Fill out the form:
   - ZIP: `90210` (Beverly Hills, CA)
   - Policy Area: Healthcare
   - Story: "Our local hospital emergency room has 8-hour wait times since federal funding was cut. My son needed stitches and we waited from 3pm to 11pm."
   - Check consent box
4. Click **Submit Your Story**
5. You should be redirected to the dashboard
6. Your story should appear at the top of the list

### Test 2: Verify Database Persistence

1. Refresh the page (F5)
2. Your submitted story should still be there (loaded from Supabase)

### Test 3: Real-Time Updates

1. Open the app in TWO browser windows/tabs side-by-side
2. In one window, go to Citizen Portal and submit a story
3. In the other window (showing dashboard), **the story should appear automatically** without refreshing!
4. You should also see a notification appear in the top-right

### Test 4: Check Supabase Dashboard

1. Go to **Table Editor** → `citizen_stories` in Supabase
2. You should see your submitted stories in the database
3. Try editing a story directly in Supabase - it should update in real-time in your app!

## 🔍 Troubleshooting

### Stories not saving?

Check browser console (F12) for errors. Look for:
```
Story saved to Supabase successfully
```

### Real-time not working?

Check console for:
```
Setting up real-time subscription...
```

If you see errors, verify:
1. Realtime is enabled in Supabase (Database → Replication)
2. The table was created with the publication: `ALTER PUBLICATION supabase_realtime ADD TABLE citizen_stories;`

### No stories loading on page load?

Check console for:
```
Loading stories from Supabase...
Loaded X stories from Supabase
```

If it says "Failed to load stories", check:
1. Your Supabase credentials in `.env` are correct
2. The table exists in Supabase
3. Row Level Security policies are set (the SQL script does this automatically)

## 📊 Database Structure

The `citizen_stories` table includes:

**Core Fields:**
- `id` - Story ID (CS-2025-XXXXXX)
- `submitted_at` - When story was submitted
- `headline` - Auto-generated from first sentence
- `story` - Full story text

**Location:**
- `location_zip`, `location_city`, `location_state`, `location_county`, `location_district`

**Verification:**
- `verification_status` - 'pending', 'verified', 'flagged'
- `verification_score` - 0-100

**Metadata (JSON):**
- `demographics` - Citizen demographic info
- `impact` - Economic impact metrics
- `ai_analysis` - AI-generated insights

## 🎉 You're All Set!

Once you run the SQL, your platform will:
- ✅ Save all submitted stories to Supabase
- ✅ Load stories from database on page load
- ✅ Update all users in real-time when new stories are submitted
- ✅ Persist data across page refreshes
- ✅ Work across multiple devices/browsers simultaneously

Enjoy your fully functional, real-time Democratic Accountability Platform!
