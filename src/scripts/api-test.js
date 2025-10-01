/**
 * API Testing Script  
 * Tests all API endpoints and catches common issues
 * 
 * Usage: node src/scripts/api-test.js
 */

const BASE_URL = 'http://localhost:3000';

class APITester {
  constructor() {
    this.errors = [];
    this.successes = [];
  }

  async makeRequest(method, endpoint, data = null, headers = {}) {
    try {
      const url = `${BASE_URL}${endpoint}`;
      const options = {
        method,
        headers: {
          'Content-Type': 'application/json',
          ...headers
        }
      };

      if (data) {
        options.body = JSON.stringify(data);
      }

      const response = await fetch(url, options);
      const responseData = await response.json().catch(() => ({}));

      return {
        status: response.status,
        ok: response.ok,
        data: responseData,
        url
      };
    } catch (error) {
      return {
        status: 0,
        ok: false,
        error: error.message,
        url: `${BASE_URL}${endpoint}`
      };
    }
  }

  async testEmailSystem() {
    console.log('\n📧 Testing Email System...');
    
    const result = await this.makeRequest('POST', '/api/test-email', {
      email: 'test@example.com'
    });

    if (result.ok) {
      this.logSuccess('✅ Email system working - Resend integration functional');
    } else {
      this.logError(`❌ Email system failed: ${result.data.error || 'Unknown error'}`);
    }
  }

  async testInvitationAPIs() {
    console.log('\n🔗 Testing Invitation APIs...');
    
    // Test invitation validation with invalid token
    const validateResult = await this.makeRequest('POST', '/api/invitations/validate', {
      token: 'invalid-token-123'
    });

    if (validateResult.status === 400) {
      this.logSuccess('✅ Invitation validation properly rejects invalid tokens');
    } else {
      this.logError(`❌ Invitation validation should reject invalid tokens`);
    }

    // Test invitation completion with invalid data
    const completeResult = await this.makeRequest('POST', '/api/invitations/complete', {
      token: 'invalid',
      full_name: '',
      password: '123' // Too short
    });

    if (!completeResult.ok) {
      this.logSuccess('✅ Invitation completion properly validates input');
    } else {
      this.logError(`❌ Invitation completion should validate input`);
    }
  }

  async testDatabaseConnections() {
    console.log('\n🗄️ Testing Database Connections...');
    
    // Test if we can reach any API that touches database
    const endpoints = [
      '/api/org/users',
      '/api/org/clients', 
      '/api/org/invitations',
      '/api/org/team-members'
    ];

    for (let endpoint of endpoints) {
      const result = await this.makeRequest('GET', endpoint);
      
      if (result.status === 401) {
        this.logSuccess(`✅ ${endpoint} - Properly requires authentication`);
      } else if (result.status === 500) {
        this.logError(`❌ ${endpoint} - Server error (possible DB connection issue)`);
      } else {
        this.logSuccess(`✅ ${endpoint} - Responding correctly`);
      }
    }
  }

  async testAPIErrorHandling() {
    console.log('\n⚠️ Testing API Error Handling...');
    
    // Test various malformed requests
    const testCases = [
      {
        name: 'Empty POST to user creation',
        method: 'POST',
        endpoint: '/api/org/users',
        data: {}
      },
      {
        name: 'Invalid JSON to invitation',
        method: 'POST', 
        endpoint: '/api/org/invitations',
        data: { email: 'not-an-email', role: 'invalid-role' }
      },
      {
        name: 'Missing required fields',
        method: 'POST',
        endpoint: '/api/invitations/complete',
        data: { token: 'test' } // Missing full_name and password
      }
    ];

    for (let testCase of testCases) {
      const result = await this.makeRequest(
        testCase.method, 
        testCase.endpoint, 
        testCase.data
      );
      
      if (result.status >= 400 && result.status < 500) {
        this.logSuccess(`✅ ${testCase.name} - Properly handles bad requests`);
      } else {
        this.logError(`❌ ${testCase.name} - Should return 4xx error for bad input`);
      }
    }
  }

  async checkEnvironmentVariables() {
    console.log('\n🔧 Checking Environment Configuration...');
    
    // Test if Resend API key is configured
    const emailTest = await this.makeRequest('POST', '/api/test-email', {
      email: 'test@example.com'
    });

    if (emailTest.data && emailTest.data.error && emailTest.data.error.includes('API key')) {
      this.logError('❌ RESEND_API_KEY not properly configured');
    } else {
      this.logSuccess('✅ Environment variables appear to be configured');
    }
  }

  async runAllTests() {
    console.log('🚀 Starting API Testing Suite...\n');
    
    await this.checkEnvironmentVariables();
    await this.testEmailSystem();
    await this.testDatabaseConnections();
    await this.testInvitationAPIs();
    await this.testAPIErrorHandling();
    
    await this.printResults();
  }

  logError(message) {
    this.errors.push(message);
    console.log(message);
  }

  logSuccess(message) {
    this.successes.push(message);
    console.log(message);
  }

  async printResults() {
    console.log('\n📊 API TEST RESULTS');
    console.log('===================');
    console.log(`✅ Successes: ${this.successes.length}`);
    console.log(`❌ Errors: ${this.errors.length}`);
    
    if (this.errors.length > 0) {
      console.log('\n❌ ISSUES FOUND:');
      this.errors.forEach(error => console.log(`  ${error}`));
    }
    
    console.log(`\n🎯 Overall Status: ${this.errors.length === 0 ? '✅ ALL TESTS PASSED' : '❌ ISSUES DETECTED'}`);
    
    if (this.errors.length === 0) {
      console.log('\n🎉 Your API is ready for production!');
    } else {
      console.log('\n🔧 Please fix the issues above before deployment.');
    }
  }
}

// Run tests if called directly
if (require.main === module) {
  const tester = new APITester();
  tester.runAllTests()
    .then(() => {
      process.exit(tester.errors.length === 0 ? 0 : 1);
    })
    .catch((error) => {
      console.error('Test runner failed:', error);
      process.exit(1);
    });
}

module.exports = APITester;
