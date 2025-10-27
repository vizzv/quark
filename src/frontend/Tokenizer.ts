import { TokenType, Token, TokenFactory } from './token'

const keywords = new Set([
    'var', 'const',
    'number', 'text', 'bool', 'char',
    'if', 'else',
    'for', 'while',
    'switch', 'case', 'default', 'continue', 'break',
    'function', 'class', 'new', 'this',
    'absorb', 'radiate', 'null',
    'void', 'return',
    'exit'
]);

const operators = new Set([
    '+', '-', '*', '/', '%',
    '^', '&', '|', '~', '!',
    '==', '!=', '=', '>=', '<=', '<', '>',
    '+=', '-=', '*=', '/=', '%=',
    '^=', '&=', '|=', '~=',
    '&&', '||', '??', '?.',
    '.', ':',
    '->',
    '++', '--']);
const punctuation = new Set(['(', ')', '{', '}', '[', ']', ';', ',', '?']);


export class Tokenizer {
    private input: string;
    private position: number = 0;
    private line: number = 0;
    private col: number = 0;
    private tokens: Token[] = [];

    constructor(input: string) {
        this.input = input;
    }

    peek(offset = 0): string {
        return this.input[this.position + offset] || '\0';
    }

    advance(): string {
        const char = this.input[this.position++];
        if (char === '\n') {
            this.line++;
            this.col = 1;
        } else {
            this.col++;
        }
        return char;
    }

    isAtEnd(): boolean {
        return this.position >= this.input.length;
    }
    isWhitespace(char: string): boolean {
        return /\s/.test(char);
    }
    isNewLine(char: string): boolean {
        return char === '\n' || char === '\r';
    }
    isDigit(char: string): boolean {
        return /\d/.test(char);
    }
    isAlpha(char: string): boolean {
        return /[a-zA-Z_]/.test(char);
    }
    isAlphanumeric(char: string): boolean {
        return /[a-zA-Z0-9_]/.test(char);
    }
    isKeyword(word: string): boolean {
        return keywords.has(word);
    }
    isOperator(char: string): boolean {
        return operators.has(char);
    }
    isPunctuation(char: string): boolean {
        return punctuation.has(char);
    }
    isSemiColon(char: string): boolean {
        return char === ';';
    }
    isEqual(char: string): boolean {
        return char === '=';
    }
    isDoubleQuote(char: string): boolean {
        return char === '"';
    }
    isSingleQuote(char: string): boolean {
        return char === "'";
    }
    isBoolean(char: string): boolean {
        return /^(true|false)$/i.test(char);
    }

    addToken(type: TokenType, value: string) {
        this.tokens.push({ type, value, line: this.line, col: this.col });
    }

    tokenize(): Token[] {
        this.col = 1; // Reset column for the first token
        this.line = 1; // Reset line for the first token
        this.position = 0; // Reset position for the first token
        while (!this.isAtEnd()) {
            let char = this.peek();
            if (this.isAlpha(char)) {
                var word = char;
                this.advance();
                while (this.isAlphanumeric(this.peek())) {
                    word += this.advance();
                }
                if (word.toLowerCase() === 'exit') {
                    this.tokens.push(TokenFactory.createExit(this.line, this.col));
                    continue;
                }
                if (["true", "false"].includes(word.toLowerCase())) {
                    this.tokens.push(TokenFactory.createBool(word.toLowerCase(), this.line, this.col));
                }

                else if (this.isKeyword(word)) {
                    this.tokens.push(TokenFactory.createKeyword(word, this.line, this.col));
                }
                else if (this.isBoolean(word)) {
                    this.tokens.push(TokenFactory.createBool(word, this.line, this.col));
                }
                else {
                    this.tokens.push(TokenFactory.createIdentifier(word, this.line, this.col));
                }
                continue;
            }
            else if (this.isDigit(char)) {
                var number = char;
                var isFloat = false;
                this.advance();
                while (this.isDigit(this.peek())) {
                    number += this.advance();
                }
                if (this.peek() === '.' && !isFloat) {
                    isFloat = true;
                    number += this.advance();
                    while (this.isDigit(this.peek())) {
                        number += this.advance();
                    }
                }
                if (this.peek() === '.' && isFloat) {
                    throw new Error(`Number cannot have multiple decimal points, Found extra decimal point at line ${this.line}, column ${this.col}`);
                }
                if (this.isAlpha(this.peek())) {
                    throw new Error(`Invalid number format, Found unexpected character '${this.peek()}' after number at line ${this.line}, column ${this.col}`);
                }
                else {

                }
                this.tokens.push(TokenFactory.createNumber(number, this.line, this.col));
                continue;
            }
            else if (this.isEqual(char)) {
                if (this.peek(1) === '=') {
                    this.tokens.push(TokenFactory.createEqualEqual(this.line, this.col));
                    this.advance(); // Consume the second '='
                } else {
                    this.tokens.push(TokenFactory.createEqual(this.line, this.col));
                    this.advance(); // Consume the '='
                }
            }
            else if (this.isDoubleQuote(char)) {
                let text = '';
                this.advance(); // Consume the opening quote
                while (!this.isAtEnd() && !this.isDoubleQuote(this.peek())) {
                    text += this.advance();
                }
                //this.advance();
                this.tokens.push(TokenFactory.createText(text, this.line, this.col));
                this.isSemiColon(this.peek()) && this.advance(); // Consume the closing quote
            }
            else if (this.isWhitespace(char)) {
                this.advance();
                continue;
            }
            else if (char === '\n') {
                this.advance();
                continue;
            }
            else if (this.isSemiColon(char)) {
                this.tokens.push(TokenFactory.createSemiColon(this.line, this.col));
            }
            else if (char === '<') {
                if (this.peek(1) === '=') {
                    this.tokens.push(TokenFactory.createLessThanOrEqual(this.line, this.col))
                    this.advance()
                }
                else {
                    this.tokens.push(TokenFactory.createLessThan(this.line, this.col))
                }
            }
            else if (char === '>') {
                if (this.peek(1) === '=') {
                    this.tokens.push(TokenFactory.createGreaterThanOrEqual(this.line, this.col))
                    this.advance()
                }
                else {
                    this.tokens.push(TokenFactory.createGreaterThan(this.line, this.col))
                }
            }
            else if (char === '/' && this.peek(1) !== '=') {
                this.advance(); // Consume the '/'
                if (this.peek() === '/') {
                    this.advance(); // Consume the second '/'
                    while (!this.isAtEnd() && this.peek() !== '\n') {
                        this.advance();
                    }
                }
                else if (this.peek() === '*') {
                    this.advance();
                    let comment = '';
                    var isCommentEnd = false;
                    while (!this.isAtEnd()) {
                        if (this.peek() === '*' && this.peek(1) === '/') {
                            this.advance();
                            this.advance();
                            isCommentEnd = true;
                            break;
                        }
                        this.advance();
                    }
                    if (!isCommentEnd) {
                        throw new Error(`Unterminated comment at line ${this.line}, column ${this.col}`);
                    }
                }
                else {
                    this.tokens.push(TokenFactory.createOperator('/', this.line, this.col));
                }
            }
            else if (char === '(') {
                this.tokens.push(TokenFactory.createPunctuation('(', this.line, this.col));

            }
            else if (char === ')') {
                this.tokens.push(TokenFactory.createPunctuation(')', this.line, this.col));

            }
            else if (char === '{') {
                this.tokens.push(TokenFactory.createPunctuation('{', this.line, this.col));

            }
            else if (char === '}') {
                this.tokens.push(TokenFactory.createPunctuation('}', this.line, this.col));

            }
            else if (char === '[') {
                this.tokens.push(TokenFactory.createPunctuation('[', this.line, this.col));

            }
            else if (char === ']') {
                this.tokens.push(TokenFactory.createPunctuation(']', this.line, this.col));

            }
            else if (char === '.') {
                this.tokens.push(TokenFactory.createOperator('.', this.line, this.col));
            }
            else if (char === '+') {
                if (this.peek(1) === '+') {
                    this.tokens.push(TokenFactory.createOperator('++', this.line, this.col));
                    this.advance(); // Consume the second '+'
                }
                else if (this.peek(1) === '=') {
                    this.tokens.push(TokenFactory.createOperator('+=', this.line, this.col));
                    this.advance(); // Consume the '='
                }
                else {
                    this.tokens.push(TokenFactory.createOperator('+', this.line, this.col));
                }
            }
            else if (char === '-') {
                if (this.peek(1) === '-') {
                    this.tokens.push(TokenFactory.createOperator('--', this.line, this.col));
                    this.advance(); // Consume the second '-'
                }
                else if (this.peek(1) === '=') {
                    this.tokens.push(TokenFactory.createOperator('-=', this.line, this.col));
                    this.advance(); // Consume the '='
                }
                else if (this.peek(1) === '>') {
                    this.tokens.push(TokenFactory.createOperator('->', this.line, this.col));
                    this.advance(); // Consume the '>'
                }

                else {
                    this.tokens.push(TokenFactory.createOperator('-', this.line, this.col));
                }
            }
            else if (char === '*') {
                if (this.peek(1) === '=') {
                    this.tokens.push(TokenFactory.createOperator('*=', this.line, this.col));
                    this.advance(); // Consume the '='
                }
                else {
                    this.tokens.push(TokenFactory.createOperator('*', this.line, this.col));
                }
            }
            else if (char === '/') {
                if (this.peek(1) === '=') {
                    this.tokens.push(TokenFactory.createOperator('/=', this.line, this.col));
                    this.advance(); // Consume the '='
                }
                else {
                    this.tokens.push(TokenFactory.createOperator('/', this.line, this.col));
                }
            }
            else if (char === '%') {
                if (this.peek(1) === '=') {
                    this.tokens.push(TokenFactory.createOperator('%=', this.line, this.col));
                    this.advance(); // Consume the '='
                }
                else {
                    this.tokens.push(TokenFactory.createOperator('%', this.line, this.col));
                }
            }
            else if (char === '^') {
                if (this.peek(1) === '=') {
                    this.tokens.push(TokenFactory.createOperator('^=', this.line, this.col));
                    this.advance(); // Consume the '='
                }
                else {
                    this.tokens.push(TokenFactory.createOperator('^', this.line, this.col));
                }
            }
            else if (char === '&') {
                if (this.peek(1) === '&') {
                    this.tokens.push(TokenFactory.createOperator('&&', this.line, this.col));
                    this.advance(); // Consume the second '&'
                } else if (this.peek(1) === '=') {
                    this.tokens.push(TokenFactory.createOperator('&=', this.line, this.col));
                    this.advance(); // Consume the '='
                } else {
                    this.tokens.push(TokenFactory.createOperator('&', this.line, this.col));
                }
            }
            else if (char === '|') {
                if (this.peek(1) === '|') {
                    this.tokens.push(TokenFactory.createOperator('||', this.line, this.col));
                    this.advance(); // Consume the second '|'
                } else if (this.peek(1) === '=') {
                    this.tokens.push(TokenFactory.createOperator('|=', this.line, this.col));
                    this.advance(); // Consume the '='
                } else {
                    this.tokens.push(TokenFactory.createOperator('|', this.line, this.col));
                }
            }
            else if (char === '?') {
                if (this.peek(1) === '.') {
                    this.tokens.push(TokenFactory.createOperator('?.', this.line, this.col));
                    this.advance(); // Consume the '.'
                } else if (this.peek(1) === '?') {
                    this.tokens.push(TokenFactory.createOperator('??', this.line, this.col));
                    this.advance(); // Consume the second '?'
                } else {
                    this.tokens.push(TokenFactory.createOperator('?', this.line, this.col));
                }
            }
            else {
                console.log(`Parsed Tokens Till now: ${JSON.stringify(this.tokens, null, 2)}`);
                throw new Error(`Unexpected character '${char}' at line ${this.line}, column ${this.col}`);
            }
            this.advance();
        }
        this.tokens.push(TokenFactory.createEOF(this.line, this.col));
        return this.tokens;
    }
}
