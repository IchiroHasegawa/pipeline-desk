# Production OS Deployment Guide

This guide details the procedure for deploying Production OS to Vercel for staging and future production environments. 

> [!WARNING]
> Production OS Authentication is not yet implemented. The staging deployment relies on a temporary Staging Access Gate. Ensure that Supabase Row Level Security (RLS) policies are properly updated for production before exposing any deployment to the public. 

## 1. GitHub Connection
1. Ensure your codebase is pushed to a remote GitHub repository.
2. In the Vercel dashboard, click **Add New...** > **Project**.
3. Import your Production OS repository from GitHub.

## 2. Framework Preset
- Vercel should automatically detect the framework as **Next.js**.
- Leave the build command (`next build`) and output directory (`.next`) as their default values.

## 3. Environment Variables
You must configure the following environment variables in your Vercel project settings before deployment:

### Application Mode & Access
- `PRODUCTION_OS_DEPLOYMENT_MODE`: Must be set to `staging`. Do not set to `production` until the full authentication system is built.
- `PRODUCTION_OS_TEST_ACCESS_CODE`: A secure, secret password you generate that testers will use to access the staging environment.
- `APP_URL`: The absolute URL of your deployment (e.g., `https://production-os-staging.vercel.app`).

### Supabase configuration
- `NEXT_PUBLIC_SUPABASE_URL`: Your Supabase Project URL.
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Your Supabase Anonymous Public Key.
- `SUPABASE_SERVICE_ROLE_KEY`: Your Supabase Service Role Key (used securely on the backend).

### Google Drive configuration
- `GOOGLE_DRIVE_CLIENT_ID`: OAuth Client ID from Google Cloud Console.
- `GOOGLE_DRIVE_CLIENT_SECRET`: OAuth Client Secret from Google Cloud Console.
- `GOOGLE_DRIVE_REDIRECT_URI`: The exact callback URL (e.g., `https://production-os-staging.vercel.app/api/google-drive/callback`).
- `GOOGLE_DRIVE_TOKEN_ENCRYPTION_KEY`: A 32-byte base64 encoded secure string used to encrypt the refresh token in the database.

## 4. Google OAuth Configuration
1. Go to the [Google Cloud Console](https://console.cloud.google.com).
2. Navigate to **APIs & Services > Credentials**.
3. Edit your OAuth 2.0 Client ID.
4. Under **Authorized redirect URIs**, add your Vercel deployment callback URL (e.g., `https://production-os-staging.vercel.app/api/google-drive/callback`).
5. Ensure the Google Cloud project is still in **Testing** status.
6. Under **OAuth consent screen > Test users**, add the Google email addresses of anyone who will be testing the staging deployment.

## 5. Supabase Configuration
- The staging deployment will connect to your existing Supabase project. 
- **Important**: Do not modify or remove existing data during staging.
- **Warning**: Current Supabase policies (e.g. `002_development_access_policies.sql`) are temporary development policies allowing open access. The staging-access gate protects the Next.js frontend, but does NOT replace proper RLS on the database level. 
- Do not expose the staging URL publicly.

## 6. Vercel Limitations
- **Serverless Function Duration**: Vercel limits the duration of Serverless Functions (10s on Hobby, up to 60s/300s on Pro).
- Large asset downloads (e.g. 500MB+ files) that proxy through the Next.js API route (`/api/assets/[assetId]/files/[assetFileId]/download/route.ts`) might timeout before completing. 
- Resumable uploads bypass Vercel entirely (direct from browser to Google Drive) and will not be impacted by these timeouts.
- Persistent local disk storage is not available on Vercel. All state must remain in Supabase, Google Drive, or browser cookies.

## 7. Deployment Testing
1. Deploy the project on Vercel.
2. Navigate to the deployment URL. You should be redirected to `/test-access`.
3. Enter the `PRODUCTION_OS_TEST_ACCESS_CODE`.
4. Ensure you are redirected to `/production`.
5. Connect your Google Drive in Settings and authorize the app.
6. Verify file uploads and file management features.

## 8. Rollback Instructions
If the deployment introduces breaking changes:
1. Go to the Vercel Dashboard for the project.
2. Go to the **Deployments** tab.
3. Find a previous successful deployment.
4. Click the three dots (menu) next to it and select **Promote to Production** (or **Restore**).

## 9. Preparing for Production
Before moving to `PRODUCTION_OS_DEPLOYMENT_MODE=production`, you MUST:
1. Implement full Production OS Authentication (user logins, sessions).
2. Implement strict Supabase Row Level Security (RLS) ensuring users can only access their own authorized projects.
3. Remove the temporary Staging Access Gate.
