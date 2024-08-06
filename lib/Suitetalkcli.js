import axios from 'axios';
import crypto from 'crypto';

const generateOAuthSignature = (method, url, params, consumerSecret, tokenSecret) => {
  const sortedParams = Object.keys(params).sort().map(key => `${key}=${encodeURIComponent(params[key])}`).join('&');
  const baseString = method.toUpperCase() + '&' + encodeURIComponent(url) + '&' + encodeURIComponent(sortedParams);
  const signingKey = encodeURIComponent(consumerSecret) + '&' + encodeURIComponent(tokenSecret);
  return crypto.createHmac('sha256', signingKey).update(baseString).digest('base64');
};

export const runSuiteQL = async (query, config) => {
  const { ACCOUNT_ID, CONSUMER_KEY, CONSUMER_SECRET, TOKEN_ID, TOKEN_SECRET } = config;
  const url = 'https://' + ACCOUNT_ID.toLowerCase() + '.suitetalk.api.netsuite.com/services/rest/query/v1/suiteql';
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

  const signature = generateOAuthSignature(method, url, params, CONSUMER_SECRET, TOKEN_SECRET);
  params.oauth_signature = signature;

  const authHeader = 'OAuth realm="' + ACCOUNT_ID + '",oauth_consumer_key="' + CONSUMER_KEY + '",oauth_token="' + TOKEN_ID + '",oauth_signature_method="HMAC-SHA256",oauth_timestamp="' + timestamp + '",oauth_nonce="' + nonce + '",oauth_version="1.0",oauth_signature="' + encodeURIComponent(signature) + '"';

  // Debugging statements
  console.log('URL:', url);
  console.log('Auth Header:', authHeader);
  console.log('Generated Signature:', signature);

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
    console.error('Error running SuiteQL query:', error.response ? error.response.data : error.message);
    throw error;
  }
};
