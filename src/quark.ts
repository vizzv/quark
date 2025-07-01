import { readFileSync } from 'fs';
import { Tokenizer } from './frontend/Tokenizer';
import { Parser } from './frontend/parser';
import { printAstTree, toDot } from './frontend/abstractSyntaxTree';


// Read command-line arguments
const args = process.argv.slice(2);
if (args.length < 1) {
  console.error('Usage: node main.js <file.qrk>');
  process.exit(1);
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
const tokenizer = new Tokenizer(code);
const tokens = tokenizer.tokenize();
console.log(tokens);
const parser = new Parser(tokens);
const ast = parser.parse();
debugger;
const dot = `digraph AST {\n${toDot(ast).join('\n')}\n}`;

printAstTree(ast)