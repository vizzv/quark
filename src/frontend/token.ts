export const TOKEN_TYPE = {
    'KEYWORD': 'keyword',
    'IDENTIFIER': 'identifier',
    'NUMBER': 'number',
    'TEXT': 'text',
    'BOOL': 'bool',
    'CHAR': 'char',
    'OPERATOR': 'operator',
    'PUNCTUATION': 'punctuation',
    'NEWLINE': 'newline',
    'COMMENT': 'comment',
    'WHITESPACE': 'whitespace',
    'EOF': 'eof',
}
export type TokenType = typeof TOKEN_TYPE[keyof typeof TOKEN_TYPE];

export interface Token {
    type: TokenType;
    value?: string;
    line: number;
    col: number;
}
export type quarkType = 
    | 'text'
    | 'number'
    | 'boolean'
    | 'char'


export class TokenFactory {
    static createKeyword(value: string, line: number, col: number): Token {
        return { type: 'keyword', value, line, col };
    }

    static createIdentifier(value: string, line: number, col: number): Token {
        return { type: 'identifier', value, line, col };
    }

    static createNumber(value: string, line: number, col: number): Token {
        return { type: 'number', value, line, col };
    }

    static createText(value: string, line: number, col: number): Token {
        return { type: 'text', value, line, col };
    }

    static createBool(value: string, line: number, col: number): Token {
        return { type: 'bool', value, line, col };
    }

    static createOperator(value: string, line: number, col: number): Token {
        return { type: 'operator', value, line, col };
    }

    static createPunctuation(value: string, line: number, col: number): Token {
        return { type: 'punctuation', value, line, col };
    }

    static createNewline(line: number, col: number): Token {
        return { type: 'newline', line, col };
    }

    static createComment(value: string, line: number, col: number): Token {
        return { type: 'comment', value, line, col };
    }

    static createWhitespace(line: number, col: number): Token {
        return { type: 'whitespace', line, col };
    }
    static createSemiColon(line: number, col: number): Token {
        return { type: 'punctuation', value: ';', line, col };
    }
    static createEqual(line: number, col: number): Token {
        return { type: 'operator', value: '=', line, col };
    }
    static createEqualEqual(line: number, col: number): Token {
        return { type: 'operator', value: '==', line, col };
    }
    static createNotEqual(line: number, col: number): Token {
        return { type: 'operator', value: '!=', line, col };
    }
    static createLessThan(line: number, col: number): Token {
        return { type: 'operator', value: '<', line, col };
    }
    static createLessThanOrEqual(line: number, col: number): Token {
        return { type: 'operator', value: '<=', line, col };
    }
    static createGreaterThan(line: number, col: number): Token {
        return { type: 'operator', value: '>', line, col };
    }
    static createGreaterThanOrEqual(line: number, col: number): Token {
        return { type: 'operator', value: '>=', line, col };
    }
    static createPlus(line: number, col: number): Token {
        return { type: 'operator', value: '+', line, col };
    }
    static createMinus(line: number, col: number): Token {
        return { type: 'operator', value: '-', line, col };
    }
    static createMultiply(line: number, col: number): Token {
        return { type: 'operator', value: '*', line, col };
    }
    static createDivide(line: number, col: number): Token {
        return { type: 'operator', value: '/', line, col };
    }
    static createAnd(line: number, col: number): Token {
        return { type: 'operator', value: '&&', line, col };
    }
    static createOr(line: number, col: number): Token {
        return { type: 'operator', value: '||', line, col };
    }
    static createNot(line: number, col: number): Token {
        return { type: 'operator', value: '!', line, col };
    }
    static createAssignment(line: number, col: number): Token {
        return { type: 'operator', value: '=', line, col };
    }
    static createComma(line: number, col: number): Token {
        return { type: 'punctuation', value: ',', line, col };
    }
    static createColon(line: number, col: number): Token {
        return { type: 'punctuation', value: ':', line, col };
    }
    static createExit(line: number, col: number): Token {
        return { type: 'keyword', value: 'exit', line, col };
    }
    static createEOF(line: number, col: number): Token {
        return { type: 'eof', line, col,value:'eof' };
    }
}