const https = require('https');

// Read Firebase Web API Key from env
const apiKey = "AIzaSyA-HI7LoH6V52ztM0JdYOfdwM6jE1wL8Ws"; // From .env.local

const postData = JSON.stringify({
  email: 'docenciainformatica2025@gmail.com',
  password: 'Tony@6532',
  returnSecureToken: true
});

const options = {
  hostname: 'identitytoolkit.googleapis.com',
  port: 443,
  path: `/v1/accounts:signInWithPassword?key=${apiKey}`,
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': postData.length
  }
};

const req = https.request(options, (res) => {
  console.log('STATUS:', res.statusCode);
  let body = '';
  res.on('data', (d) => body += d);
  res.on('end', () => {
    try {
      const parsed = JSON.parse(body);
      if (res.statusCode === 200) {
        console.log('SUCCESS: Authenticated successfully! User UID:', parsed.localId);
        console.log('EMAIL:', parsed.email);
        console.log('EXPIRES IN:', parsed.expiresIn, 'seconds');
      } else {
        console.error('FAILED: Authentication failed!', parsed.error);
      }
    } catch (e) {
      console.error('Error parsing response:', e);
    }
  });
});

req.on('error', (e) => {
  console.error('Request Error:', e);
});

req.write(postData);
req.end();
