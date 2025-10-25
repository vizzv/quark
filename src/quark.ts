import { readFileSync } from 'fs';
import { Tokenizer } from './frontend/Tokenizer';
import { Parser } from './frontend/parser';
import  {MSILGenerator} from './backend/generator';
import fs from "fs"
// Read command-line arguments
const args = process.argv.slice(2);
if (args.length < 1) {
  console.error('Usage: node main.js <file.qrk>');
  process.exit(1);
}
var registereSize = 4;
const arch = process.arch;
if(arch === "x64" || arch === "arm64")
{
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
const tokenizer = new Tokenizer(code);
const tokens = tokenizer.tokenize();

console.log("Tokens:", tokens);

const parser = new Parser(tokens);
const ast = parser.parse();

const generator = new MSILGenerator();
const asmCode = generator.generate(ast);

console.log("Generated Assembly Code:\n", asmCode);
fs.writeFileSync(filePath.split(".").reverse()[1].replace("/","")+".il", asmCode, "utf-8");
