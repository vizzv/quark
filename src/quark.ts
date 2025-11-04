import { readFileSync } from 'fs';
import { Tokenizer } from './frontend/Tokenizer';
import { Parser } from './frontend/parser';
import { MSILGenerator } from './backend/generator';
import fs from "fs"
import chalk from 'chalk';
import { printAstTree, toDot } from './frontend/abstractSyntaxTree';
// Read command-line arguments
const args = process.argv.slice(2);
if (args.length < 1) {
  console.error('Usage: node main.js <file.qrk>');
  process.exit(1);
}
var registereSize = 4;
const arch = process.arch;
if (arch === "x64" || arch === "arm64") {
  registereSize = 8;
}


const filePath = args[0];
let code: string;

try {
  code = readFileSync(filePath, 'utf-8');
} catch (err: any) {
  console.error(`Failed to read file '${filePath}':`, err.message);
  process.exit(1);
}

// Create tokenizer and get tokens
try {
  const tokenizer = new Tokenizer(code);
  const tokens = tokenizer.tokenize();

  console.log("Tokens:", tokens);

  const parser = new Parser(tokens);
  const ast = parser.parse();

  console.log("AST:", JSON.stringify(ast, null, 2));

  const generator = new MSILGenerator();
  const asmCode = generator.generate(ast);

  console.log("Generated Assembly Code:\n", chalk.blueBright(asmCode));
  fs.writeFileSync(filePath.split(".").reverse()[1].replace("/", "") + ".il", asmCode, "utf-8");
}
catch (err: any) {
  const stack = err.stack?.split('\n') || [];
  const callerLine = stack[1] || ''; // first line after message
  const match = callerLine.match(/at\s+(.*)\s+\((.*):(\d+):(\d+)\)/) || callerLine.match(/at\s+(.*):(\d+):(\d+)/);

  let functionName = 'unknown';
  let file = 'unknown';
  let line = 'unknown';
  let column = 'unknown';

  if (match) {
    if (match.length === 5) {
      functionName = match[1];
      file = match[2];
      line = match[3];
      column = match[4];
    } else if (match.length === 4) {
      file = match[1];
      line = match[2];
      column = match[3];
    }
  }

  console.error(
    chalk.red.bold(`Error during compilation: ${err.message}`)
  );
  console.error(
    chalk.yellow(`↳ in ${functionName} (${file}:${line}:${column})`)
  );
  process.exit(1);
}
