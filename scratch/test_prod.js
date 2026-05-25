const https = require('https');
https.get('https://teacher-classroom-suite.vercel.app', (res) => {
  let data = '';
  res.on('data', (c) => data += c);
  res.on('end', () => {
    const title = data.match(/<title>([^<]+)<\/title>/i);
    console.log(`STATUS: ${res.statusCode} | TITLE: ${title ? title[1] : 'NONE'} | INCLUDES_BRAND: ${data.includes('EduManager IETABA')}`);
  });
});
