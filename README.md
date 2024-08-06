# SuiteQL CLI

SuiteQL CLI is a command-line tool for running SuiteQL queries using NetSuite's SuiteTalk API. This tool helps you execute queries, manage configurations, and visualize query results efficiently.

## Features

- Run SuiteQL queries
- Configure authentication keys
- Display query results in a table
- Export query results to CSV or JSON
- View query history
- Use predefined query templates
- Visualize query results as graphs

## Installation

To install the SuiteQL CLI tool, run:

```bash
npm install -g suiteql
```

## Configuration

Before running any queries, you need to configure your authentication keys. Run the following command and follow the prompts to enter your NetSuite account details:
```bash
suiteql configure
```

This command will prompt you to enter your NetSuite Account ID, Consumer Key, Consumer Secret, Token ID, and Token Secret. The configuration will be saved for future use.

## Usage
### Running Queries
To run a SuiteQL query, use the run command with the -q option:
 ```bash
   suiteql run -q "SELECT * FROM entity"
```

You can also export the query results to a file using the -o option:

```bash
suiteql run -q "SELECT * FROM entity" -o results.csv
```

To visualize query results as a graph, use the -g option:

```bash
suiteql run -q "SELECT email, COUNT(*) as count FROM transaction GROUP BY email" -g
```

#### Query History
To view the history of previously run queries, use the history command:

``` bash
suiteql history
```

#### Query Templates
To run a predefined query template, use the template command with the -t option:

```bash
suiteql template -t listEntities
```
