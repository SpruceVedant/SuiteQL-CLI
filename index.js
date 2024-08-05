#!/usr/bin/env node

import { Command } from 'commander';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { runSuiteQL } from './lib/Suitetalkcli.js';
import { parse } from 'json2csv';
import Chart from 'cli-chart';
import inquirer from 'inquirer';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const CONFIG_PATH = path.join(__dirname, 'config.json');

const program = new Command();

program
  .version('1.0.0')
  .description('CLI tool to run SuiteQL queries using SuiteTalk');

// Command to configure authentication keys
program
  .command('configure')
  .description('Configure authentication keys')
  .action(async () => {
    const answers = await inquirer.prompt([
      { type: 'input', name: 'ACCOUNT_ID', message: 'Enter your NetSuite Account ID:' },
      { type: 'input', name: 'CONSUMER_KEY', message: 'Enter your NetSuite Consumer Key:' },
      { type: 'input', name: 'CONSUMER_SECRET', message: 'Enter your NetSuite Consumer Secret:' },
      { type: 'input', name: 'TOKEN_ID', message: 'Enter your NetSuite Token ID:' },
      { type: 'input', name: 'TOKEN_SECRET', message: 'Enter your NetSuite Token Secret:' }
    ]);
    console.log('Saving configuration to:', CONFIG_PATH); // Debug print
    console.log('Configuration data:', answers); // Debug print
    fs.writeFileSync(CONFIG_PATH, JSON.stringify(answers, null, 2));
    console.log('Configuration saved.');
  });

// Command to run SuiteQL queries
program
  .command('run')
  .description('Run SuiteQL query')
  .option('-q, --query <query>', 'SuiteQL query to run')
  .option('-o, --output <file>', 'Output file to export data')
  .option('-g, --graph', 'Display query results as a graph')
  .action(async (cmd) => {
    const options = cmd;
    let config;
    if (fs.existsSync(CONFIG_PATH)) {
      console.log('Loading configuration from:', CONFIG_PATH); // Debug print
      config = JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf8'));
      console.log('Loaded configuration:', config); // Debug print
    } else {
      console.error('Please run "suiteql-cli configure" to set up your authentication keys.');
      process.exit(1);
    }

    const displayChart = (data) => {
      const chart = new Chart({
        xlabel: 'Email',
        ylabel: 'Count',
        direction: 'y',
        width: 80,
        height: 20,
        lmargin: 10,
        step: 4,
      });

      data.forEach((item) => {
        chart.addBar(item.count, item.email);
      });

      chart.draw();
    };

    if (options.query) {
      try {
        const result = await runSuiteQL(options.query, config);
        if (options.output) {
          const fileType = options.output.split('.').pop();
          let dataToWrite;

          if (fileType === 'csv') {
            dataToWrite = parse(result.items);
          } else if (fileType === 'json') {
            dataToWrite = JSON.stringify(result, null, 2);
          } else {
            console.error('Unsupported file type. Please use .csv or .json');
            return;
          }

          fs.writeFileSync(options.output, dataToWrite);
          console.log(`Data exported to ${options.output}`);
        } else if (options.graph) {
          const data = result.items.map(item => ({ email: item.email, count: item.count }));
          displayChart(data);
        } else {
          console.log('Query Result:', JSON.stringify(result, null, 2));
        }
      } catch (error) {
        console.error('Error:', error.message);
      }
    } else {
      console.error('Please provide a SuiteQL query using the -q or --query option.');
    }
  });

program.parse(process.argv);
