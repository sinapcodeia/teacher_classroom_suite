const https = require('https');

const apiKey = "AIzaSyA-HI7LoH6V52ztM0JdYOfdwM6jE1wL8Ws";
const projectId = "teacherclassroomsuite";

// Step 1: Authenticate
const postData = JSON.stringify({
  email: 'docenciainformatica2025@gmail.com',
  password: 'Tony@6532',
  returnSecureToken: true
});

const authOptions = {
  hostname: 'identitytoolkit.googleapis.com',
  port: 443,
  path: `/v1/accounts:signInWithPassword?key=${apiKey}`,
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': postData.length
  }
};

const authReq = https.request(authOptions, (res) => {
  let body = '';
  res.on('data', (d) => body += d);
  res.on('end', () => {
    if (res.statusCode !== 200) {
      console.error('Auth failed!', body);
      return;
    }
    const authData = JSON.parse(body);
    const idToken = authData.idToken;
    const uid = authData.localId;

    // Step 2: Query Firestore with Auth Header
    const dbUrl = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/users/${uid}`;
    const dbOptions = {
      headers: {
        'Authorization': `Bearer ${idToken}`
      }
    };

    https.get(dbUrl, dbOptions, (dbRes) => {
      let dbBody = '';
      dbRes.on('data', (d) => dbBody += d);
      dbRes.on('end', () => {
        if (dbRes.statusCode !== 200) {
          console.error('Firestore get failed!', dbRes.statusCode, dbBody);
          return;
        }
        const profile = JSON.parse(dbBody);
        const fields = profile.fields;
        console.log('=== REAL-TIME FIRESTORE AUDIT (AUTHENTICATED) ===');
        console.log('Status Code:', dbRes.statusCode);
        console.log('UID:', uid);
        console.log('Email:', fields.email ? fields.email.stringValue : 'NONE');
        console.log('Role:', fields.role ? fields.role.stringValue : 'NONE');
        console.log('Profile Status:', fields.status ? fields.status.stringValue : 'NONE');
        console.log('Accepted Terms:', fields.acceptedTerms ? fields.acceptedTerms.booleanValue : 'false');
        console.log('Created At:', fields.createdAt ? fields.createdAt.stringValue : 'NONE');
        console.log('Last Login:', fields.lastLogin ? fields.lastLogin.stringValue : 'NONE');
      });
    });
  });
});

authReq.write(postData);
authReq.end();
