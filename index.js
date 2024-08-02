#!/usr/bin/env node

const { Command } = require('commander');
const fs = require('fs');
const { runSuiteQL } = require('./lib/Suitetalkcli');
const { parse } = require('json2csv');
const Chart = require('cli-chart');

const program = new Command();

program
  .version('1.0.0')
  .description('CLI tool to run SuiteQL queries using SuiteTalk')
  .option('-q, --query <query>', 'SuiteQL query to run')
  .option('-o, --output <file>', 'Output file to export data')
  .option('-g, --graph', 'Display query results as a graph');

program.parse(process.argv);

const options = program.opts();

const displayChart = (data) => {
  const chart = new Chart({
    xlabel: 'X-axis',
    ylabel: 'Y-axis',
    direction: 'y',
    width: 80,
    height: 20,
    lmargin: 10,
    step: 4,
  });

  data.forEach((item) => {
    chart.addBar(item.value, item.label);
  });

  chart.draw();
};

if (options.query) {
  runSuiteQL(options.query)
    .then((result) => {
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
        const data = result.items.map(item => ({ label: item.email, value: item.count }));
        displayChart(data);
      } else {
        console.log('Query Result:', JSON.stringify(result, null, 2));
      }
    })
    .catch((error) => {
      console.error('Error:', error.message);
    });
} else {
  console.error('Please provide a SuiteQL query using the -q or --query option.');
}
