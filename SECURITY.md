# Security Policy

## Environment Variables

This project uses environment variables for configuration. **Never commit `.env` files to the repository.**

### Required Environment Variables

See `.env.example` for a list of required environment variables.

### GitHub Deployment

For GitHub Pages deployment, set these as **Repository Variables** (not secrets, as they need to be publicly accessible):

1. Go to your repository Settings → Secrets and variables → Actions → Variables
2. Add each `PUBLIC_*` variable listed in `.env.example`

## What's Safe to Commit

✅ **Safe:**
- `.env.example` (template without real values)
- Public API endpoints that are meant to be exposed
- Public configuration

❌ **Never Commit:**
- `.env` files with real values
- Private API keys or tokens
- Database credentials
- Authentication secrets
- Personal information

## Reporting Security Issues

If you discover a security vulnerability, please email the maintainer directly rather than opening a public issue.
