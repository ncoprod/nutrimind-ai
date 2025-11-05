# 🔒 Security Policy

## 🛡️ Reporting Security Issues

If you discover a security vulnerability in NutriMIND, please report it by emailing **security@nutrimind.com** or opening a private security advisory on GitHub.

**Please do NOT open public issues for security vulnerabilities.**

## 🔐 API Keys and Sensitive Data

### ⚠️ CRITICAL: Never Commit Secrets

This project uses environment variables for sensitive configuration. **NEVER** commit files containing:

- API Keys (Gemini, Supabase, etc.)
- Database passwords
- Private keys or certificates
- User data or credentials
- Any `.env` files

### ✅ Protected Files

The `.gitignore` file is configured to automatically exclude:

```
.env
.env.*
.env.local
.env.development
.env.production
*.env
api-keys.json
secrets.json
credentials.json
```

### 📋 How to Use Environment Variables Safely

1. **Copy the template:**
   ```bash
   cp env.example .env.local
   ```

2. **Fill in your real API keys** in `.env.local`

3. **NEVER commit** `.env.local` to git

4. **Verify before committing:**
   ```bash
   git status
   ```
   Make sure no `.env` files appear in the staging area.

## 🔑 API Key Management

### Google Gemini API Key

- Get your key from: https://ai.google.dev
- Store it in `.env.local` as `GEMINI_API_KEY`
- **Rotate your key immediately** if it's ever exposed
- Use separate keys for development and production

### Supabase Configuration

- Get credentials from: https://supabase.com/dashboard
- Store `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` in `.env.local`
- The anon key is safe for client-side use, but still keep it in `.env.local`
- Configure Row Level Security (RLS) in Supabase to protect user data

## 🚨 What to Do If You Exposed Secrets

If you accidentally committed sensitive information:

1. **IMMEDIATELY revoke/regenerate all exposed API keys:**
   - Google Gemini: [AI Studio Console](https://ai.google.dev)
   - Supabase: [Project Settings > API](https://supabase.com/dashboard)

2. **Delete the repository** from GitHub (if the commit was pushed)

3. **Create a fresh repository** with the secrets removed

4. **NEVER try to "fix" the commit** - Git history is permanent

## 🛠️ Security Best Practices

### For Developers

- ✅ Always use `.env.local` for local development
- ✅ Check `git status` before every commit
- ✅ Use environment variables for all sensitive configuration
- ✅ Keep dependencies up to date
- ✅ Review code changes before committing
- ❌ Never hardcode API keys or passwords
- ❌ Never commit `.env` files
- ❌ Never share API keys in chat, email, or documentation

### For Production Deployment

- Use platform-specific environment variable management:
  - **Vercel**: Environment Variables in project settings
  - **Netlify**: Environment Variables in site settings
  - **Heroku**: Config Vars
- Use separate API keys for production
- Enable rate limiting and monitoring
- Implement proper error handling (don't leak sensitive info in errors)

## 🔍 Automated Security Checks

### Pre-commit Verification

Before committing, verify no secrets are staged:

```bash
# Check what files will be committed
git status

# Verify the actual content
git diff --cached

# If you see any .env files or API keys, DO NOT COMMIT
```

### Recommended: Use git-secrets

Install [git-secrets](https://github.com/awslabs/git-secrets) to prevent accidental commits:

```bash
# Install git-secrets
# macOS
brew install git-secrets

# Configure for this repo
git secrets --install
git secrets --register-aws
```

## 📚 Additional Resources

- [GitHub Security Best Practices](https://docs.github.com/en/code-security)
- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [Supabase Security Guide](https://supabase.com/docs/guides/auth)
- [Google Cloud Security](https://cloud.google.com/security/best-practices)

## 🤝 Security-Conscious Development

We take security seriously. By contributing to this project, you agree to:

- Follow these security guidelines
- Report vulnerabilities responsibly
- Keep API keys and credentials secure
- Review code for security issues before submitting PRs

---

**Remember: When in doubt, ask! Better to verify than to expose sensitive data.** 🔒
