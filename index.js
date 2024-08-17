#!/usr/bin/env node

import { Command } from 'commander';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { runSuiteQL } from './lib/Suitetalkcli.js';
import { parse } from 'json2csv';
import Chart from 'cli-chart';
import inquirer from 'inquirer';
import chalk from 'chalk';
import Table from 'cli-table3';
import { homedir } from 'os';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const CONFIG_PATH = path.join(__dirname, 'config.json');
const HISTORY_DIR = path.join(homedir(), '.suiteql-cli');
const HISTORY_FILE = path.join(HISTORY_DIR, 'query_history.json');
const templates = {
  listEntities: 'SELECT * FROM entity',
  countTransactions: 'SELECT COUNT(*) FROM transaction',
};

const saveQueryToHistory = (query) => {
  if (!fs.existsSync(HISTORY_DIR)) {
    fs.mkdirSync(HISTORY_DIR, { recursive: true });
  }

  let history = [];
  if (fs.existsSync(HISTORY_FILE)) {
    history = JSON.parse(fs.readFileSync(HISTORY_FILE, 'utf8'));
  }
  history.push({ query, timestamp: new Date().toISOString() });
  fs.writeFileSync(HISTORY_FILE, JSON.stringify(history, null, 2));
};

const getQueryHistory = () => {
  if (fs.existsSync(HISTORY_FILE)) {
    return JSON.parse(fs.readFileSync(HISTORY_FILE, 'utf8'));
  }
  return [];
};

const getQueryTemplate = (name) => templates[name];

const highlightSQL = (query) => {
  return query
    .replace(/(SELECT|FROM|WHERE|GROUP BY|ORDER BY|COUNT|AS)/gi, chalk.blue('$1'))
    .replace(/(\*|,)/g, chalk.green('$1'))
    .replace(/([0-9]+)/g, chalk.red('$1'));
};

const loadConfig = () => {
  if (fs.existsSync(CONFIG_PATH)) {
    console.log('Loading configuration from:', CONFIG_PATH);
    const config = JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf8'));
    console.log('Loaded configuration:', config);
    return config;
  } else {
    console.error('Please run "suiteql-cli configure or suiteql configure" to set up your authentication keys.');
    process.exit(1);
  }
};

const displayTable = (data) => {
  if (data.length === 0) {
    console.log(chalk.yellow('No results found.'));
    return;
  }

  const table = new Table({
    head: Object.keys(data[0]).map((key) => chalk.cyan(key)),
    colWidths: Object.keys(data[0]).map(() => 20),
    wordWrap: true,
  });

  data.forEach((row) => {
    table.push(Object.values(row));
  });

  console.log(table.toString());
};

const program = new Command();

program
  .version('1.0.2')
  .description('CLI tool to run SuiteQL queries using SuiteTalk');


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
    console.log('Saving configuration to:', CONFIG_PATH);
    console.log('Configuration data:', answers);
    fs.writeFileSync(CONFIG_PATH, JSON.stringify(answers, null, 2));
    console.log('Configuration saved.');
  });


program
  .command('run')
  .description('Run SuiteQL query')
  .option('-q, --query <query>', 'SuiteQL query to run')
  .option('-o, --output <file>', 'Output file to export data')
  .option('-g, --graph', 'Display query results as a graph')
  .action(async (cmd) => {
    const options = cmd;
    const config = loadConfig();

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
      saveQueryToHistory(options.query);
      console.log('Query:', highlightSQL(options.query));
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
          displayTable(result.items);
        }
      } catch (error) {
        console.error('Error:', error.message);
      }
    } else {
      console.error('Please provide a SuiteQL query using the -q or --query option.');
    }
  });

program
  .command('history')
  .description('Show query history')
  .action(() => {
    const history = getQueryHistory();
    history.forEach((entry, index) => {
      console.log(`${index + 1}. ${entry.query} [${entry.timestamp}]`);
    });
  });

program
  .command('template')
  .description('Run a predefined query template')
  .option('-t, --template <template>', 'Template name')
  .action((cmd) => {
    const template = getQueryTemplate(cmd.template);
    const config = loadConfig();
    if (template) {
      runSuiteQL(template, config).then((result) => {
        displayTable(result.items);
      }).catch((error) => {
        console.error('Error:', error.message);
      });
    } else {
      console.error('Template not found');
    }
  });

program.parse(process.argv);
