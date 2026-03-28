@echo off
REM Authentication System Test Script for Windows
REM This script tests all authentication endpoints

set BASE_URL=http://localhost:3333/api/v1
set COOKIE_FILE=test-cookies.txt

echo.
echo Testing Authentication System
echo =================================
echo.

REM Clean up previous cookies
if exist %COOKIE_FILE% del %COOKIE_FILE%

REM Test 1: Register a new user
echo Test 1: Register new user
curl -X POST "%BASE_URL%/auth/register" ^
  -H "Content-Type: application/json" ^
  -d "{\"name\":\"Test User\",\"email\":\"test@example.com\",\"password\":\"Test123!\"}" ^
  -c %COOKIE_FILE%
echo.
echo.

REM Test 2: Login
echo Test 2: Login with credentials
curl -X POST "%BASE_URL%/auth/login" ^
  -H "Content-Type: application/json" ^
  -d "{\"email\":\"test@example.com\",\"password\":\"Test123!\"}" ^
  -c %COOKIE_FILE%
echo.
echo.

REM Test 3: Get current user
echo Test 3: Get current user (protected)
curl -X GET "%BASE_URL%/auth/me" ^
  -b %COOKIE_FILE%
echo.
echo.

REM Test 4: Access public endpoint
echo Test 4: Access public endpoint (leaderboard)
curl -X GET "%BASE_URL%/leaderboard"
echo.
echo.

REM Test 5: Access protected endpoint with auth
echo Test 5: Access protected endpoint (participants)
curl -X GET "%BASE_URL%/participants" ^
  -b %COOKIE_FILE%
echo.
echo.

REM Test 6: Access protected endpoint without auth
echo Test 6: Access protected endpoint without auth
if exist %COOKIE_FILE% del %COOKIE_FILE%
curl -X GET "%BASE_URL%/participants"
echo.
echo.

REM Test 7: Login again for logout test
echo Test 7: Re-login for logout test
curl -s -X POST "%BASE_URL%/auth/login" ^
  -H "Content-Type: application/json" ^
  -d "{\"email\":\"test@example.com\",\"password\":\"Test123!\"}" ^
  -c %COOKIE_FILE% > nul
echo.

REM Test 8: Logout
echo Test 8: Logout
curl -X POST "%BASE_URL%/auth/logout" ^
  -b %COOKIE_FILE%
echo.
echo.

REM Clean up
if exist %COOKIE_FILE% del %COOKIE_FILE%

echo =================================
echo Authentication tests complete!
echo.
echo For more details, see:
echo   - backend\AUTHENTICATION.md
echo   - backend\AUTH_IMPLEMENTATION_SUMMARY.md
echo.
pause
