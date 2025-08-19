# Vercel Deployment Guide

## 📋 **Environment Variables Required**

When deploying to Vercel, you'll need to set these environment variables:

### **Essential (Required for core functionality):**
- `ANTHROPIC_API_KEY` - Your Anthropic API key for lesson generation
- `YOUTUBE_API_KEY` - Your YouTube Data API v3 key for video integration

### **Optional (For additional features):**
- `GOOGLE_CLIENT_ID` - For Google Docs export feature
- `GOOGLE_CLIENT_SECRET` - For Google Docs export feature  
- `GOOGLE_REDIRECT_URI` - Should be `https://your-app.vercel.app/api/auth/google/callback`
- `NEXT_PUBLIC_SUPABASE_URL` - For user management (if using Supabase)
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - For user management (if using Supabase)

## 🚀 **Deployment Steps**

1. **Create GitHub Repository:**
   - Go to GitHub.com → New Repository
   - Name: `lesson-plan-builder` (or your preference)
   - Don't initialize with README (we already have code)
   - Copy the repository URL

2. **Push Code to GitHub:**
   ```bash
   git remote add origin https://github.com/jsonmack1/your-repo-name.git
   git branch -M main  
   git push -u origin main
   ```

3. **Deploy to Vercel:**
   - Go to [vercel.com](https://vercel.com)
   - Sign in with GitHub account
   - Click "New Project"
   - Import your `lesson-plan-builder` repository
   - Configure environment variables in Vercel dashboard
   - Deploy!

## 🔑 **Getting API Keys**

### **Anthropic API Key** (Essential)
1. Go to [console.anthropic.com](https://console.anthropic.com)
2. Create account or sign in
3. Go to API Keys section
4. Create a new API key
5. Copy the key (starts with `sk-ant-`)

### **YouTube API Key** (Essential)
1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create a new project or select existing
3. Enable "YouTube Data API v3"
4. Create credentials → API Key
5. Restrict the key to YouTube Data API v3
6. Copy the API key

### **Google OAuth** (Optional)
1. In Google Cloud Console (same project)
2. Go to Credentials → Create OAuth 2.0 Client ID
3. Application type: Web application
4. Authorized redirect URIs: `https://your-app.vercel.app/api/auth/google/callback`
5. Copy Client ID and Client Secret

## ⚙️ **Vercel Configuration**

In your Vercel project settings → Environment Variables, add:

```
ANTHROPIC_API_KEY = sk-ant-your-key-here
YOUTUBE_API_KEY = your-youtube-api-key-here
GOOGLE_CLIENT_ID = your-google-client-id (optional)
GOOGLE_CLIENT_SECRET = your-google-client-secret (optional) 
GOOGLE_REDIRECT_URI = https://your-app.vercel.app/api/auth/google/callback
```

## 🎯 **Production Features**

Your deployed app will include:
- ✅ Complete lesson plan generation
- ✅ Differentiation panel (inline, like videos)
- ✅ YouTube video integration
- ✅ Professional print functionality  
- ✅ Enhanced loading progress
- ✅ Comprehensive error handling with retries
- ✅ Memory bank for saved lessons
- ✅ Premium math content rendering
- ✅ Responsive design for all devices

## 🔧 **Post-Deployment**

After deployment:
1. Test lesson generation functionality
2. Test differentiation features
3. Test video integration
4. Test print functionality
5. Verify all features work as expected

Your app should be accessible at `https://your-app-name.vercel.app`