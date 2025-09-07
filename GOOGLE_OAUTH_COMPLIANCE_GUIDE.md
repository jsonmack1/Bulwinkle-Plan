# Google OAuth 2.0 Compliance Guide

## 🚨 Current Issue
Google shows "app does not comply with Google's OAuth 2.0 policy" because your app needs verification for production use.

## ✅ Required Steps for Compliance

### Step 1: OAuth Consent Screen Setup
1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Navigate to **APIs & Services** → **OAuth consent screen**
3. Choose **External** user type (for public app)
4. Fill out required information:

#### **App Information**
- **App name**: "Peabody Lesson Plan Builder"
- **User support email**: your-email@domain.com
- **App logo**: Upload your Peabody logo (120x120px minimum)
- **App domain**: https://yourdomain.com
- **Authorized domains**: Add your production domain
- **Developer contact information**: your-email@domain.com

#### **Scopes Configuration**
Add these specific scopes:
- `https://www.googleapis.com/auth/drive.file` - "See, edit, create, and delete only the specific Google Drive files you use with this app"
- `https://www.googleapis.com/auth/documents` - "See, create, and edit all your Google Docs documents"

#### **Test Users (during development)**
- Add your email and any test users
- Limited to 100 test users during unverified status

### Step 2: App Verification Process

#### **For Apps with Sensitive Scopes (Required for Production)**
Your app uses sensitive scopes (`drive.file`, `documents`), so you need verification:

1. **Security Assessment**: Complete Google's security questionnaire
2. **Privacy Policy**: Must be publicly accessible
3. **Terms of Service**: Must be publicly accessible
4. **Domain Verification**: Verify ownership of your domain

#### **Required Documents**
- **Privacy Policy** - Must explain data collection and usage
- **Terms of Service** - Must be legally compliant
- **App Homepage** - Clear description of app functionality
- **YouTube Demo Video** (optional but recommended)

### Step 3: Privacy Policy Requirements

Create a privacy policy that includes:
- What data you collect from Google APIs
- How you use the data
- How you store the data
- Data retention policies
- User rights regarding their data
- Contact information for privacy questions

#### **Example Privacy Policy Section for Google Integration**
```
When you connect your Google account to Peabody Lesson Plan Builder:
- We access only the specific Google Docs and Drive files you choose to export
- We do not store your Google Docs content on our servers
- We only use your Google data to export lesson plans you create
- You can revoke access at any time through your Google Account settings
- We do not share your Google data with third parties
```

### Step 4: Terms of Service Requirements

Include sections about:
- Service description
- User responsibilities
- Data handling
- Service availability
- Liability limitations
- Termination conditions

### Step 5: Domain Verification

1. **Google Search Console**:
   - Add your domain to Search Console
   - Verify ownership via DNS or HTML file

2. **OAuth Consent Screen**:
   - Add verified domain to authorized domains list

## 🔧 Technical Implementation Updates Needed

### Update OAuth Configuration
Ensure these environment variables are set for production:
```bash
GOOGLE_CLIENT_ID=your-production-client-id
GOOGLE_CLIENT_SECRET=your-production-client-secret  
GOOGLE_REDIRECT_URI=https://yourdomain.com/api/auth/google/callback
```

### Update Redirect URIs in Google Console
Add these authorized redirect URIs:
- `https://yourdomain.com/api/auth/google/callback`
- `https://yourdomain.com/auth-callback` (if used)

### JavaScript Origins
Add these authorized JavaScript origins:
- `https://yourdomain.com`

## ⏱️ Timeline Expectations

### **Immediate (Can do today)**
- Complete OAuth consent screen
- Add privacy policy and terms of service
- Configure test users
- Update production redirect URIs

### **1-2 Days**
- Submit for verification (if needed)
- Test with real users in test mode

### **1-6 weeks (Google's timeline)**
- Google reviews your app
- May request additional information
- Approval/rejection notification

## 🚀 Quick Start (Minimum Viable Compliance)

### Option 1: Stay in Testing Mode
- Keep app in "Testing" mode
- Add up to 100 test users
- No verification needed
- Users see warning but can proceed

### Option 2: Request Verification
- Complete all steps above
- Submit for Google's review
- Full production access once approved

## 📋 Verification Checklist

- [ ] OAuth consent screen configured
- [ ] Privacy policy published and linked
- [ ] Terms of service published and linked
- [ ] Domain verified in Search Console
- [ ] Authorized domains added
- [ ] Redirect URIs updated for production
- [ ] App logo uploaded
- [ ] Scopes properly configured
- [ ] Security questionnaire completed (if required)

## 🆘 If Verification is Rejected

Common reasons and fixes:
1. **Privacy policy too vague** - Be more specific about Google data usage
2. **Domain not verified** - Complete Search Console verification
3. **Unclear app purpose** - Better describe your lesson planning functionality
4. **Missing screenshots/demo** - Provide clear app functionality examples

## 📞 Support Resources

- [Google OAuth Policies](https://developers.google.com/identity/protocols/oauth2/policies)
- [OAuth Verification Process](https://support.google.com/cloud/answer/9110914)
- [Privacy Policy Generator](https://www.privacypolicygenerator.info/)
- [Terms of Service Generator](https://www.termsofservicegenerator.net/)