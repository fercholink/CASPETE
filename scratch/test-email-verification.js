const fetch = require('node-fetch'); // wait, let's use dynamic import or standard global fetch if node version supports it, or use standard http module to avoid extra dependencies.
// Let's use the standard http/https module so it works out of the box in Node.js without any npm installations.

const http = require('http');

function post(url, data) {
  return new Promise((resolve, reject) => {
    const parsedUrl = new URL(url);
    const postData = JSON.stringify(data);
    const options = {
      hostname: parsedUrl.hostname,
      port: parsedUrl.port,
      path: parsedUrl.pathname,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
      }
    };

    const req = http.request(options, (res) => {
      let body = '';
      res.setEncoding('utf8');
      res.on('data', (chunk) => body += chunk);
      res.on('end', () => {
        resolve({
          status: res.statusCode,
          headers: res.headers,
          data: body ? JSON.parse(body) : null
        });
      });
    });

    req.on('error', (e) => reject(e));
    req.write(postData);
    req.end();
  });
}

async function runTest() {
  console.log('--- STARTING EMAIL VERIFICATION FLOW TEST ---');
  const email = `parent_${Date.now()}@test.com`;
  const password = 'Password123!';
  const full_name = 'Test Parent';
  const phone = '3123456789';

  console.log(`\n1. Registering user with email: ${email}`);
  const registerPayload = {
    email,
    password,
    full_name,
    phone,
    role: 'PARENT',
    consent_general: true,
    consent_sensitive: true,
    consent_legal_rep: true
  };

  const regResponse = await post('http://localhost:3001/api/auth/register', registerPayload);
  console.log('Register Response Status:', regResponse.status);
  console.log('Register Response Data:', JSON.stringify(regResponse.data, null, 2));

  if (regResponse.status !== 201) {
    console.error('Registration failed!');
    process.exit(1);
  }

  console.log('\n2. Attempting to login with unverified email...');
  const loginPayload = { email, password };
  const loginResponse1 = await post('http://localhost:3001/api/auth/login', loginPayload);
  console.log('Login Response Status:', loginResponse1.status);
  console.log('Login Response Data:', JSON.stringify(loginResponse1.data, null, 2));

  if (loginResponse1.status === 401 && loginResponse1.data.message.includes('verificado')) {
    console.log('SUCCESS: Login blocked for unverified email as expected.');
  } else {
    console.error('FAIL: Login should have been blocked with 401 and verification message.');
    process.exit(1);
  }

  console.log('\n3. Fetching recent verification link from terminal logs...');
  // Instead of parsing logs immediately, let's request a token resend or search the DB for the token to simulate verification.
  // Wait, let's search the database via Prisma client! We can write a script that queries the database to find the user's verification token, then uses it to verify the email.
  console.log('We will query the database directly to get the token.');
}

runTest().catch(console.error);
