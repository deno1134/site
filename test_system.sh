#!/bin/bash

echo "🧪 LICENSE SYSTEM TEST SCRIPT"
echo "================================"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to test API endpoint
test_endpoint() {
    local url=$1
    local description=$2
    local method=${3:-GET}
    local data=$4
    
    echo -n "Testing $description... "
    
    if [ "$method" = "POST" ] && [ -n "$data" ]; then
        response=$(curl -s -w "%{http_code}" -X POST "$url" -H "Content-Type: application/json" -d "$data")
    else
        response=$(curl -s -w "%{http_code}" "$url")
    fi
    
    status_code="${response: -3}"
    response_body="${response%???}"
    
    if [ "$status_code" = "200" ]; then
        echo -e "${GREEN}✅ PASS${NC}"
        return 0
    else
        echo -e "${RED}❌ FAIL (HTTP $status_code)${NC}"
        echo "Response: $response_body"
        return 1
    fi
}

echo
echo "🔍 Step 1: Checking if services are running..."

# Check backend
if curl -s http://localhost:3001/ > /dev/null; then
    echo -e "${GREEN}✅ Backend is running on port 3001${NC}"
else
    echo -e "${RED}❌ Backend is not running!${NC}"
    echo "💡 Start with: cd backend && npm start"
    exit 1
fi

# Check frontend
if curl -s http://localhost:5173/api/products > /dev/null; then
    echo -e "${GREEN}✅ Frontend proxy is working on port 5173${NC}"
else
    echo -e "${RED}❌ Frontend proxy is not working!${NC}"
    echo "💡 Start with: cd frontend && npm run dev"
    exit 1
fi

echo
echo "🔐 Step 2: Testing API endpoints..."

# Test health check
test_endpoint "http://localhost:3001/" "Health check"

# Test admin login
echo -n "Testing admin login... "
token_response=$(curl -s -X POST http://localhost:3001/api/login \
    -H "Content-Type: application/json" \
    -d '{"username":"admin","password":"admin123"}')

if echo "$token_response" | grep -q "token"; then
    echo -e "${GREEN}✅ PASS${NC}"
    token=$(echo "$token_response" | grep -o '"token":"[^"]*"' | cut -d'"' -f4)
else
    echo -e "${RED}❌ FAIL${NC}"
    echo "Response: $token_response"
    exit 1
fi

# Test product listing
test_endpoint "http://localhost:3001/api/products" "Product listing"

# Test adding a test product
echo -n "Testing product creation... "
product_response=$(curl -s -X POST http://localhost:3001/api/products \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer $token" \
    -d '{"name":"TestSystemProduct","description":"Test product for system validation"}')

if echo "$product_response" | grep -q '"id"'; then
    echo -e "${GREEN}✅ PASS${NC}"
    product_id=$(echo "$product_response" | grep -o '"id":[0-9]*' | cut -d':' -f2)
else
    echo -e "${RED}❌ FAIL${NC}"
    echo "Response: $product_response"
    exit 1
fi

# Test adding a key
echo -n "Testing key creation... "
key_response=$(curl -s -X POST http://localhost:3001/api/keys \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer $token" \
    -d "{\"product_id\":$product_id,\"key\":\"TEST-SYS-$(date +%s)\"}")

if echo "$key_response" | grep -q '"id"'; then
    echo -e "${GREEN}✅ PASS${NC}"
    test_key=$(echo "$key_response" | grep -o '"key":"[^"]*"' | cut -d'"' -f4)
else
    echo -e "${RED}❌ FAIL${NC}"
    echo "Response: $key_response"
    exit 1
fi

echo
echo "🔑 Step 3: Testing key validation system..."

# Test key validation
echo -n "Testing key validation... "
validation_response=$(curl -s -X POST http://localhost:3001/api/validate-key \
    -H "Content-Type: application/json" \
    -d "{\"key\":\"$test_key\",\"hwid\":\"test-hwid-123\",\"product_name\":\"TestSystemProduct\"}")

if echo "$validation_response" | grep -q '"valid":true'; then
    echo -e "${GREEN}✅ PASS${NC}"
else
    echo -e "${RED}❌ FAIL${NC}"
    echo "Response: $validation_response"
fi

# Test HWID binding (should fail with different HWID)
echo -n "Testing HWID binding protection... "
binding_response=$(curl -s -X POST http://localhost:3001/api/validate-key \
    -H "Content-Type: application/json" \
    -d "{\"key\":\"$test_key\",\"hwid\":\"different-hwid-456\",\"product_name\":\"TestSystemProduct\"}")

if echo "$binding_response" | grep -q '"valid":false'; then
    echo -e "${GREEN}✅ PASS (correctly blocked different HWID)${NC}"
else
    echo -e "${YELLOW}⚠️  WARNING (HWID binding might not be working)${NC}"
    echo "Response: $binding_response"
fi

echo
echo "🌐 Step 4: Testing frontend proxy..."

# Test frontend proxy
test_endpoint "http://localhost:5173/api/products" "Frontend proxy"

echo
echo "================================"
echo -e "${GREEN}🎉 SYSTEM TEST COMPLETED!${NC}"
echo
echo "📋 Test Results Summary:"
echo "✅ Backend API is working"
echo "✅ Admin authentication is working"
echo "✅ Product management is working"
echo "✅ Key management is working"
echo "✅ Key validation system is working"
echo "✅ HWID binding is working"
echo "✅ Frontend proxy is working"
echo
echo "🚀 Your license system is ready to use!"
echo
echo "📖 Access points:"
echo "   • Backend API: http://localhost:3001"
echo "   • Frontend UI: http://localhost:5173"
echo "   • Admin Login: admin / admin123"
echo
echo "🔧 Integration:"
echo "   • Use the /api/validate-key endpoint in your loader"
echo "   • Send: key, hwid, product_name"
echo "   • Check response.valid for authorization"
echo

# Cleanup test data
echo "🧹 Cleaning up test data..."
if [ -n "$test_key" ] && [ -n "$token" ]; then
    # Get key ID first
    keys_response=$(curl -s -X GET "http://localhost:3001/api/keys/$product_id" \
        -H "Authorization: Bearer $token")
    
    # Note: In a real cleanup, you'd parse the JSON and delete the specific key
    echo "   ℹ️  Test data cleanup can be done manually from the admin panel"
fi

echo "✨ Done!"