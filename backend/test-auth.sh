#!/bin/bash

# Authentication System Test Script
# This script tests all authentication endpoints

BASE_URL="http://localhost:3333/api/v1"
COOKIE_FILE="test-cookies.txt"

echo "🧪 Testing Authentication System"
echo "================================="
echo ""

# Clean up previous cookies
rm -f $COOKIE_FILE

# Test 1: Register a new user
echo "📝 Test 1: Register new user"
REGISTER_RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "$BASE_URL/auth/register" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test User",
    "email": "test@example.com",
    "password": "Test123!"
  }' \
  -c $COOKIE_FILE)

HTTP_CODE=$(echo "$REGISTER_RESPONSE" | tail -n1)
RESPONSE_BODY=$(echo "$REGISTER_RESPONSE" | sed '$d')

if [ "$HTTP_CODE" -eq 201 ] || [ "$HTTP_CODE" -eq 409 ]; then
  echo "✅ Register: Success (HTTP $HTTP_CODE)"
  echo "   Response: $RESPONSE_BODY"
else
  echo "❌ Register: Failed (HTTP $HTTP_CODE)"
  echo "   Response: $RESPONSE_BODY"
fi
echo ""

# Test 2: Login
echo "🔐 Test 2: Login with credentials"
LOGIN_RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "$BASE_URL/auth/login" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "Test123!"
  }' \
  -c $COOKIE_FILE)

HTTP_CODE=$(echo "$LOGIN_RESPONSE" | tail -n1)
RESPONSE_BODY=$(echo "$LOGIN_RESPONSE" | sed '$d')

if [ "$HTTP_CODE" -eq 200 ]; then
  echo "✅ Login: Success (HTTP $HTTP_CODE)"
  echo "   Response: $RESPONSE_BODY"
else
  echo "❌ Login: Failed (HTTP $HTTP_CODE)"
  echo "   Response: $RESPONSE_BODY"
fi
echo ""

# Test 3: Get current user
echo "👤 Test 3: Get current user (protected)"
ME_RESPONSE=$(curl -s -w "\n%{http_code}" -X GET "$BASE_URL/auth/me" \
  -b $COOKIE_FILE)

HTTP_CODE=$(echo "$ME_RESPONSE" | tail -n1)
RESPONSE_BODY=$(echo "$ME_RESPONSE" | sed '$d')

if [ "$HTTP_CODE" -eq 200 ]; then
  echo "✅ Get Me: Success (HTTP $HTTP_CODE)"
  echo "   Response: $RESPONSE_BODY"
else
  echo "❌ Get Me: Failed (HTTP $HTTP_CODE)"
  echo "   Response: $RESPONSE_BODY"
fi
echo ""

# Test 4: Access public endpoint (no auth)
echo "🌍 Test 4: Access public endpoint (leaderboard)"
PUBLIC_RESPONSE=$(curl -s -w "\n%{http_code}" -X GET "$BASE_URL/leaderboard")

HTTP_CODE=$(echo "$PUBLIC_RESPONSE" | tail -n1)

if [ "$HTTP_CODE" -eq 200 ]; then
  echo "✅ Public Access: Success (HTTP $HTTP_CODE)"
else
  echo "❌ Public Access: Failed (HTTP $HTTP_CODE)"
fi
echo ""

# Test 5: Access protected endpoint with auth
echo "🔒 Test 5: Access protected endpoint (participants)"
PROTECTED_RESPONSE=$(curl -s -w "\n%{http_code}" -X GET "$BASE_URL/participants" \
  -b $COOKIE_FILE)

HTTP_CODE=$(echo "$PROTECTED_RESPONSE" | tail -n1)

if [ "$HTTP_CODE" -eq 200 ] || [ "$HTTP_CODE" -eq 403 ]; then
  echo "✅ Protected Access: Success (HTTP $HTTP_CODE)"
  if [ "$HTTP_CODE" -eq 403 ]; then
    echo "   Note: 403 is expected for PARTICIPANT role"
  fi
else
  echo "❌ Protected Access: Failed (HTTP $HTTP_CODE)"
fi
echo ""

# Test 6: Access protected endpoint without auth
echo "🚫 Test 6: Access protected endpoint without auth"
rm -f $COOKIE_FILE
UNAUTH_RESPONSE=$(curl -s -w "\n%{http_code}" -X GET "$BASE_URL/participants")

HTTP_CODE=$(echo "$UNAUTH_RESPONSE" | tail -n1)

if [ "$HTTP_CODE" -eq 401 ]; then
  echo "✅ Unauthorized Access: Correctly blocked (HTTP $HTTP_CODE)"
else
  echo "❌ Unauthorized Access: Should be 401 but got (HTTP $HTTP_CODE)"
fi
echo ""

# Test 7: Login again for logout test
echo "🔐 Test 7: Re-login for logout test"
curl -s -X POST "$BASE_URL/auth/login" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "Test123!"
  }' \
  -c $COOKIE_FILE > /dev/null

# Test 8: Logout
echo "🚪 Test 8: Logout"
LOGOUT_RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "$BASE_URL/auth/logout" \
  -b $COOKIE_FILE)

HTTP_CODE=$(echo "$LOGOUT_RESPONSE" | tail -n1)
RESPONSE_BODY=$(echo "$LOGOUT_RESPONSE" | sed '$d')

if [ "$HTTP_CODE" -eq 200 ]; then
  echo "✅ Logout: Success (HTTP $HTTP_CODE)"
  echo "   Response: $RESPONSE_BODY"
else
  echo "❌ Logout: Failed (HTTP $HTTP_CODE)"
fi
echo ""

# Clean up
rm -f $COOKIE_FILE

echo "================================="
echo "✨ Authentication tests complete!"
echo ""
echo "📚 For more details, see:"
echo "   - backend/AUTHENTICATION.md"
echo "   - backend/AUTH_IMPLEMENTATION_SUMMARY.md"
