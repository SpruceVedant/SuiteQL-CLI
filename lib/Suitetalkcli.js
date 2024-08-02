const axios = require('axios');
const crypto = require('crypto');


const ACCOUNT_ID = '';
const CONSUMER_KEY = '';
const CONSUMER_SECRET = '';
const TOKEN_ID = '';
const TOKEN_SECRET = '';

const generateOAuthSignature = (method, url, params, consumerSecret, tokenSecret) => {
  const sortedParams = Object.keys(params).sort().map(key => `${key}=${encodeURIComponent(params[key])}`).join('&');
  const baseString = `${method}&${encodeURIComponent(url)}&${encodeURIComponent(sortedParams)}`;
  const signingKey = `${encodeURIComponent(consumerSecret)}&${encodeURIComponent(tokenSecret)}`;
  return crypto.createHmac('sha256', signingKey).update(baseString).digest('base64');
};

const runSuiteQL = async (query) => {
  const url = 'https://td2929968.suitetalk.api.netsuite.com/services/rest/query/v1/suiteql';
  const method = 'POST';
  const nonce = crypto.randomBytes(16).toString('hex');
  const timestamp = Math.floor(Date.now() / 1000);
  const params = {
    oauth_consumer_key: CONSUMER_KEY,
    oauth_token: TOKEN_ID,
    oauth_signature_method: 'HMAC-SHA256',
    oauth_timestamp: timestamp,
    oauth_nonce: nonce,
    oauth_version: '1.0'
  };

  params.oauth_signature = generateOAuthSignature(method, url, params, CONSUMER_SECRET, TOKEN_SECRET);

  const authHeader = `OAuth realm="${ACCOUNT_ID}",oauth_consumer_key="${CONSUMER_KEY}",oauth_token="${TOKEN_ID}",oauth_signature_method="HMAC-SHA256",oauth_timestamp="${timestamp}",oauth_nonce="${nonce}",oauth_version="1.0",oauth_signature="${encodeURIComponent(params.oauth_signature)}"`;

  try {
    const response = await axios.post(url, { q: query }, {
      headers: {
        'Content-Type': 'application/json',
        'prefer': 'transient',
        'Authorization': authHeader
      }
    });

    return response.data;
  } catch (error) {
    console.error('Error running SuiteQL query:', error);
    throw error;
  }
};

module.exports = { runSuiteQL };
