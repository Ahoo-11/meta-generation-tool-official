# Deployment Guide for Pixelkeywording.com

## Issue Fixed
The login redirection issue has been fixed by:
1. Creating a `netlify.toml` file with proper redirect rules
2. Updating the authentication redirection logic to always use the main domain
3. Modifying the Supabase client configuration to ensure correct site URL usage

## How to Deploy

### Option 1: Deploy via Netlify Dashboard
1. Log in to your Netlify account
2. Go to your site (ID: 06aa1ec9-a86d-4db6-a7dd-d9c629709dbb)
3. Navigate to the "Deploys" tab
4. Click on "Deploy site" or "Trigger deploy"
5. Choose "Clear cache and deploy site" to ensure all changes are applied

### Option 2: Deploy via Netlify CLI
```bash
# Install Netlify CLI if not already installed
npm install -g netlify-cli

# Login to Netlify
netlify login

# Deploy the site
netlify deploy --prod --dir=dist --site=06aa1ec9-a86d-4db6-a7dd-d9c629709dbb
```

### Option 3: Connect to GitHub Repository
If your site is connected to a GitHub repository:
1. Commit the changes to your repository
2. Push the changes to the branch that's connected to Netlify
3. Netlify will automatically deploy the changes

## Verify the Fix
After deployment:
1. Go to pixelkeywording.com
2. Click on the login button
3. Verify that you're not redirected to app.pixelkeywording.com
4. Complete the login process
5. Confirm that you're successfully redirected to the dashboard

## Domain Configuration
Ensure that your Netlify site is configured with:
- Primary domain: pixelkeywording.com
- No subdomain redirects for authentication

If you still need to use app.pixelkeywording.com, make sure it's properly configured in Netlify's domain settings.
