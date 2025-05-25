// Test script to verify authentication flow
// This script can be run in the browser console to test login redirect functionality

async function testAuthFlow() {
  console.log('🧪 Starting authentication flow test...');

  // Test credentials
  const testCredentials = [
    { email: 'test@example.com', password: 'password123' },
    { email: 'georgecuray7@gmail.com', password: 'password123' },
    { email: 'admin@example.com', password: 'admin123' }
  ];

  const apiUrl = 'http://localhost:8000/api';

  for (const credentials of testCredentials) {
    console.log(`\n📧 Testing login with: ${credentials.email}`);

    try {
      // Test login API call
      const response = await fetch(`${apiUrl}/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(credentials)
      });

      if (response.ok) {
        const data = await response.json();
        console.log('✅ Login API successful:', {
          message: data.message,
          hasToken: !!data.token,
          hasUser: !!data.user,
          userEmail: data.user?.email
        });

        // Test token validation
        const validateResponse = await fetch(`${apiUrl}/user`, {
          headers: {
            'Authorization': `Bearer ${data.token}`,
            'Content-Type': 'application/json'
          }
        });

        if (validateResponse.ok) {
          const userData = await validateResponse.json();
          console.log('✅ Token validation successful:', userData.email);
        } else {
          console.log('❌ Token validation failed:', validateResponse.status);
        }

      } else {
        const errorData = await response.json();
        console.log('❌ Login failed:', errorData.message);
      }
    } catch (error) {
      console.log('❌ Network error:', error.message);
    }
  }

  console.log('\n🏁 Authentication flow test completed!');
  console.log('\n📝 Next steps:');
  console.log('1. Open http://localhost:4200 in your browser');
  console.log('2. Try logging in with any of the test credentials');
  console.log('3. Check browser console for redirect logs');
  console.log('4. Verify you are redirected to the dashboard after login');
}

// Auto-run the test
testAuthFlow().catch(console.error);
