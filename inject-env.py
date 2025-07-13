#!/usr/bin/env python3
import os
import sys

# Read the template file
with open('env-inject.js', 'r') as f:
    template = f.read()

# Replace placeholders with actual environment variables
env_vars = {
    'VITE_FIREBASE_API_KEY': os.getenv('VITE_FIREBASE_API_KEY', ''),
    'VITE_FIREBASE_PROJECT_ID': os.getenv('VITE_FIREBASE_PROJECT_ID', ''),
    'VITE_FIREBASE_APP_ID': os.getenv('VITE_FIREBASE_APP_ID', '')
}

# Replace placeholders in template
for key, value in env_vars.items():
    template = template.replace(f'${{{key}}}', value.strip())

# Write the result
with open('env-inject.js', 'w') as f:
    f.write(template)

print(f"Environment variables injected successfully")
print(f"API Key: {env_vars['VITE_FIREBASE_API_KEY'][:10]}...")
print(f"Project ID: {env_vars['VITE_FIREBASE_PROJECT_ID']}")
print(f"App ID: {env_vars['VITE_FIREBASE_APP_ID'][:10]}...")