# OpenAI API Setup Guide

## Step 1: Get Your OpenAI API Key

1. **Go to OpenAI's website:**
   - Visit: https://platform.openai.com/

2. **Sign up or Log in:**
   - If you don't have an account, click "Sign up"
   - If you have an account, click "Log in"

3. **Navigate to API Keys:**
   - Once logged in, click on your profile icon (top right)
   - Select "API keys" from the dropdown menu
   - Or go directly to: https://platform.openai.com/api-keys

4. **Create a new API key:**
   - Click "Create new secret key"
   - Give it a name (e.g., "AI Teacher MVP")
   - Click "Create secret key"
   - **IMPORTANT:** Copy the key immediately - you won't be able to see it again!
   - It will look like: `sk-proj-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx`

## Step 2: Add API Key to Your Project

1. **Open your `.env` file:**
   - Location: `backend/.env`
   - If it doesn't exist, copy from `backend/.env.example`

2. **Add your API key:**
   ```
   OPENAI_API_KEY=sk-proj-your-actual-key-here
   ```
   - Replace `sk-proj-your-actual-key-here` with your actual key
   - Make sure there are no spaces around the `=` sign
   - Don't add quotes around the key

3. **Save the file**

## Step 3: Verify It's Working

### Option 1: Quick Test Script
Run this command from the `backend` directory:
```bash
python -c "from django.conf import settings; import os; os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'sevisconnect.settings'); import django; django.setup(); from core.ai_services import get_openai_client; client = get_openai_client(); print('✓ OpenAI client created successfully!' if client else '✗ OpenAI client not created - check your API key')"
```

### Option 2: Test via API Endpoint
1. Start the Django server:
   ```bash
   python manage.py runserver
   ```

2. Use the test script:
   ```bash
   python test_endpoints.py
   ```

3. Or test manually with a diagnostic submission and weakness analysis

## Step 4: Important Notes

### API Usage & Costs
- **Free Tier:** OpenAI offers some free credits for new accounts
- **Pricing:** Check current pricing at https://platform.openai.com/pricing
- **Models Used:**
  - `gpt-4o-mini` - For quick tasks (weakness analysis, chat) - Lower cost
  - `gpt-4o` - For study plan generation - Higher cost but better quality

### Security Best Practices
- ✅ **DO:** Keep your `.env` file in `.gitignore` (already done)
- ✅ **DO:** Never commit your API key to version control
- ✅ **DO:** Use different keys for development and production
- ❌ **DON'T:** Share your API key publicly
- ❌ **DON'T:** Hardcode the key in your source code

### Troubleshooting

**Problem: "Invalid API key"**
- Check that you copied the entire key (starts with `sk-`)
- Make sure there are no extra spaces in `.env` file
- Restart your Django server after changing `.env`

**Problem: "Rate limit exceeded"**
- You've hit OpenAI's rate limits
- Wait a few minutes and try again
- Consider upgrading your OpenAI plan

**Problem: "Insufficient credits"**
- Add payment method to your OpenAI account
- Check your usage at https://platform.openai.com/usage

## Step 5: Test the AI Features

Once your API key is set up, test these endpoints:

1. **Submit a diagnostic:**
   ```bash
   POST /api/diagnostic/submit/
   ```

2. **Analyze weaknesses (uses AI):**
   ```bash
   POST /api/analyze/weaknesses/
   ```

3. **Generate study plan (uses AI):**
   ```bash
   POST /api/generate/study-plan/
   ```

4. **Chat with AI tutor (uses AI):**
   ```bash
   POST /api/tutor/chat/
   ```

## Need Help?

- OpenAI Documentation: https://platform.openai.com/docs
- OpenAI Support: https://help.openai.com/


