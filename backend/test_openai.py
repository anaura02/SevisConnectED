"""
Quick test script to verify OpenAI API key is working
Run: python test_openai.py
"""
import os
import django

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'sevisconnect.settings')
django.setup()

from django.conf import settings
from core.ai_services import get_openai_client

print("=" * 60)
print("TESTING OPENAI API KEY")
print("=" * 60)

# Check if API key is set
api_key = settings.OPENAI_API_KEY
if not api_key or api_key == 'your-openai-api-key-here':
    print("✗ ERROR: OpenAI API key not set in .env file")
    print("\nTo fix this:")
    print("1. Open backend/.env")
    print("2. Set OPENAI_API_KEY=your-actual-key-here")
    print("3. Restart this script")
    exit(1)

print(f"✓ API Key found: {api_key[:10]}...{api_key[-4:]}")
print()

# Try to create OpenAI client
try:
    client = get_openai_client()
    if client:
        print("✓ OpenAI client created successfully!")
        print()
        
        # Test a simple API call
        print("Testing API call...")
        response = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {"role": "system", "content": "You are a helpful assistant."},
                {"role": "user", "content": "Say 'Hello, SevisConnectED!' if you can read this."}
            ],
            max_tokens=20
        )
        
        ai_response = response.choices[0].message.content
        print(f"✓ API call successful!")
        print(f"  Response: {ai_response}")
        print()
        print("=" * 60)
        print("✓ OPENAI IS WORKING CORRECTLY!")
        print("=" * 60)
    else:
        print("✗ ERROR: Could not create OpenAI client")
        print("  Check your API key format")
except Exception as e:
    print(f"✗ ERROR: {type(e).__name__}: {str(e)}")
    print()
    print("Common issues:")
    print("- Invalid API key (check .env file)")
    print("- No credits in OpenAI account")
    print("- Network connection issue")
    print("- Rate limit exceeded")


