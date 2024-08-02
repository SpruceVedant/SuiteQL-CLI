#!/usr/bin/env node

const { Command } = require('commander');
const { runSuiteQL } = require('./lib/suitetalk');
const chalk = require('chalk');

const program = new Command();

program
  .version('1.0.0')
  .description('CLI tool to run SuiteQL queries using SuiteTalk')
  .option('-q, --query <query>', 'SuiteQL query to run');

program.parse(process.argv);

const options = program.opts();

const printResult = (result) => {
  console.log(chalk.green('Query Result:'));
  console.log(chalk.blue(JSON.stringify(result, null, 2)));
};

if (options.query) {
  runSuiteQL(options.query)
    .then((result) => {
      printResult(result);
    })
    .catch((error) => {
      console.error(chalk.red('Error:', error.message));
    });
} else {
  console.error(chalk.yellow('Please provide a SuiteQL query using the -q or --query option.'));
}


// #!/usr/bin/env node

// const { Command } = require('commander');
// const fs = require('fs');
// const { runSuiteQL } = require('./lib/Suitetalkcli');
// const { parse } = require('json2csv');

// const program = new Command();

// program
//   .version('1.0.0')
//   .description('CLI tool to run SuiteQL queries using SuiteTalk')
//   .option('-q, --query <query>', 'SuiteQL query to run')
//   .option('-o, --output <file>', 'Output file to export data');

// program.parse(process.argv);

// const options = program.opts();

// if (options.query) {
//   runSuiteQL(options.query)
//     .then((result) => {
//       if (options.output) {
//         const fileType = options.output.split('.').pop();
//         let dataToWrite;

//         if (fileType === 'csv') {
//           dataToWrite = parse(result.items); 
//         } else if (fileType === 'json') {
//           dataToWrite = JSON.stringify(result, null, 2);
//         } else {
//           console.error('Unsupported file type. Please use .csv or .json');
//           return;
//         }

//         fs.writeFileSync(options.output, dataToWrite);
//         console.log(`Data exported to ${options.output}`);
//       } else {
//         console.log('Query Result:', JSON.stringify(result, null, 2));
//       }
//     })
//     .catch((error) => {
//       console.error('Error:', error.message);
//     });
// } else {
//   console.error('Please provide a SuiteQL query using the -q or --query option.');
// }
