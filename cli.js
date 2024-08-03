#!/usr/bin/env node

const { Command } = require('commander');
const axios = require('axios');
const OAuth = require('oauth-1.0a');
const crypto = require('crypto');
const program = new Command();


const consumerKey = '';
const consumerSecret = '';
const token = '';
const tokenSecret = '';

const accountId = 'TD2929968';
const restletUrl = 'https://account_id.restlets.api.netsuite.com/app/site/hosting/restlet.nl?script=810&deploy=1';

const oauth = OAuth({
    consumer: { key: consumerKey, secret: consumerSecret },
    signature_method: 'HMAC-SHA256',
    hash_function(base_string, key) {
        return crypto.createHmac('sha256', key).update(base_string).digest('base64');
    }
});

async function runSuiteQL(query) {
    const request_data = {
        url: restletUrl,
        method: 'POST',
        data: { sql: query }
    };

    const token_data = {
        key: token,
        secret: tokenSecret
    };

    const oauthHeaders = oauth.toHeader(oauth.authorize(request_data, token_data));

   
    console.log('Request Data:', request_data);
    console.log('OAuth Headers:', oauthHeaders);

    try {
        const response = await axios({
            url: request_data.url,
            method: request_data.method,
            headers: {
                ...oauthHeaders,
                'Content-Type': 'application/json',
                'Authorization': `${oauthHeaders.Authorization}, realm="TD2929968"`
            },
            data: request_data.data
        });

        console.log('Data fetched successfully:', JSON.stringify(response.data, null, 2));
    } catch (error) {
        
        console.error('Error fetching data:', error.response ? error.response.data : error.message);
        if (error.response) {
            console.error('Response Headers:', error.response.headers);
            console.error('Response Data:', error.response.data);
        }
    }
}

program
    .version('1.0.0')
    .description('CLI tool to run SuiteQL queries')
    .argument('<sql>', 'SuiteQL query to execute')
    .action((sql) => {
        runSuiteQL(sql);
    });

program.parse(process.argv);
