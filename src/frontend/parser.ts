import { stat } from "fs";
import { AstTreeNode, ProgramNode, ASTNodeType, BoolLiteral, TextLiteral, NumberLiteral, VariableDeclaration, IfExpression, LogicalExpression, EofNode } from "./abstractSyntaxTree";
import { Token, TOKEN_TYPE } from "./token";

export class Parser {
    private tokens: Token[] = [];
    private index: number = 0;
    constructor(tokens: Token[] = []) {
        this.tokens = tokens;
        this.index = 0;
    }
    private isAtEnd(): boolean {
        return this.index >= this.tokens.length;
    }

    private peek(offset = 0): Token {
        return this.tokens[this.index + offset] || '\0';
    }
    private advance(): Token {
        return this.tokens[this.index++];
    }
    private expect(type: string, value?: string): Token {
        const token = this.advance();
        if (token.type !== type || (value && token.value !== value)) {
            throw new Error(`Expected ${type} '${value}', but got ${token.type} '${token.value}'`);
        }
        return token;
    }

    private parseLiteral(): AstTreeNode {
        var currentToken = this.advance();
        if (currentToken.type === TOKEN_TYPE.BOOL) {
            if (!["true", "false"].includes(currentToken.value?.toLowerCase() ?? "")) {
                throw new Error(`Expected Bool but got ${currentToken.value} `);
            }
            let currentValue = currentToken.value?.toLowerCase() === "true";
            return new BoolLiteral(this.id(), currentValue);
        }
        else if (currentToken.type === TOKEN_TYPE.TEXT) {
            return new TextLiteral(this.id(), currentToken.value ?? "");
        }
        else if (currentToken.type === TOKEN_TYPE.NUMBER) {
            let currentValue = currentToken.value ?? "";
            const floatRegex = /^(?:\d+\.\d*|\d*\.\d+|\d+)$/;
            const intRegex = /^\d+$/
            if (intRegex.test(currentValue)) {
                return new NumberLiteral(this.id(), Number.parseInt(currentValue))
            }
            else if (floatRegex.test(currentValue)) {
                return new NumberLiteral(this.id(), Number.parseFloat(currentValue))
            }
            else {
                throw new Error(`Invalid number ${currentValue} encounters at line ${currentToken.line} col ${currentToken.col}`)
            }
        }
        throw new Error(`Unsupported literal type: ${currentToken.type} at line ${currentToken.line} col ${currentToken.col}`);
    }
    private getType(node: AstTreeNode): string {

        switch (node.type) {
            case "BoolLiteral":
                return "bool";
            case "NumberLiteral":
                return "number";
            case "TextLiteral":
                return "text";
            case "IfExpression": {
                const thenTypes = node.thenBranch.map((n: AstTreeNode) => this.getType(n));
                const elseTypes = node.elseBranch?.map((n: AstTreeNode) => this.getType(n)) ?? [];
                const allTypes = new Set([...thenTypes, ...elseTypes]);
                if (allTypes.size === 1) return [...allTypes][0];
                throw new Error(`Mismatched return types in if-expression`);
            }
            case "ReturnStatement":
                return this.getType(node.value as BoolLiteral);
            default:
                throw new Error(`Cannot determine type of node type: ${node.type}`);
        }
    }


    private parseVariableDeclaration(): AstTreeNode {
        const keyword = this.advance();
        const identifier = this.advance();
        if (identifier.type !== TOKEN_TYPE.IDENTIFIER) {
            throw new Error(`Expected identifier after ${keyword.value} at line ${identifier.line} col ${identifier.col} identifier: ${identifier}`);
        }
        this.expect(TOKEN_TYPE.OPERATOR, '=');
        const value = this.parseExpression();
        this.expect(TOKEN_TYPE.PUNCTUATION, ';');
        const expectedType = keyword.value ?? "";
        const actualType = this.getType(value as AstTreeNode);

        if (expectedType !== actualType) {
            throw new Error(
                `Type mismatch in variable declaration: expected ${expectedType}, got ${actualType}`
            );
        }

        const varDeclare = new VariableDeclaration(expectedType, expectedType as "text" | "number" | "bool" | "char");
        varDeclare.name = identifier.value;
        varDeclare.body = [value as AstTreeNode];
        return varDeclare;


        // if (value instanceof BoolLiteral) {

        //     const varDeclare = new VariableDeclaration(keyword.value ?? "", "bool");
        //     varDeclare.name = identifier.value;
        //     varDeclare.body = [] as AstTreeNode[];
        //     varDeclare.body.push(value)
        //     return varDeclare;
        // }
        // else if (value instanceof NumberLiteral) {
        //     const varDeclare = new VariableDeclaration(keyword.value ?? "", "number")
        //     varDeclare.name = identifier.value;
        //     varDeclare.body = [] as AstTreeNode[];
        //     varDeclare.body.push(value)
        //     return varDeclare;
        // }
        // else if (value instanceof TextLiteral) {
        //     const varDeclare = new VariableDeclaration(keyword.value ?? "", "text")
        //     varDeclare.name = identifier.value;
        //     varDeclare.body = [] as AstTreeNode[];
        //     varDeclare.body.push(value)
        //     return varDeclare;
        // }
        // else {
        //     throw new Error(`Invalid variable declaration ${keyword.value} at line ${keyword.line} col ${keyword.col}, Invalid value is assigned or resulting expression is of different type`)
        // }

    }
    private parseIfExpression(): AstTreeNode | null {
        this.expect(TOKEN_TYPE.KEYWORD, 'if');
        this.expect(TOKEN_TYPE.PUNCTUATION, '(');
        const condition = this.parseExpression();
        this.expect(TOKEN_TYPE.PUNCTUATION, ')');
        this.expect(TOKEN_TYPE.PUNCTUATION, '{');

        const thenBranch: AstTreeNode[] = [];
        while (this.peek().value !== '}') {
            try {
                var xyz = this.parseExpression();
                thenBranch.push(xyz as AstTreeNode);
            } catch (err) {
                console.error("Error in if-then branch:", err);
                this.advance(); // Advance to avoid infinite loop
            }
        }
        this.expect(TOKEN_TYPE.PUNCTUATION, '}');
        let elseBranch: AstTreeNode[] | undefined;
        if (this.peek().type === TOKEN_TYPE.KEYWORD && this.peek().value === 'else') {
            this.advance();
            this.expect(TOKEN_TYPE.PUNCTUATION, '{');
            elseBranch = [];

            while (this.peek().value !== '}') {
                elseBranch?.push(this.parseExpression() as AstTreeNode);
            }
            this.expect(TOKEN_TYPE.PUNCTUATION, '}');
        }

        return new IfExpression(this.id(), condition as AstTreeNode, thenBranch, elseBranch as AstTreeNode[])
    }
    private parsePrimary(): AstTreeNode {
        const token = this.peek();

        if ([TOKEN_TYPE.NUMBER, TOKEN_TYPE.BOOL, TOKEN_TYPE.TEXT].includes(token.type)) {
            return this.parseLiteral();
        }

        if (token.type === TOKEN_TYPE.IDENTIFIER) {
            const idToken = this.advance();
            return {
                id: this.id(),
                type: "identifier",
                name: idToken.value
            };
        }
        throw new Error(`Unexpected token '${token.value}' at line ${token.line}`);
    }
    private parseReturnStatement(): AstTreeNode {
        const returnToken = this.advance();
        const value = this.parseExpression();
        this.expect(TOKEN_TYPE.PUNCTUATION, ';');

        return {
            id: this.id(),
            type: 'ReturnStatement',
            value
        };
    }


    private parseComparison(): AstTreeNode {
        let left = this.parsePrimary();
        while (
            this.peek().type === TOKEN_TYPE.OPERATOR &&
            ['=', '!', '>=', '<=', '>', '<'].includes(this.peek().value ?? "")
        ) {

            var operator = this.advance().value ?? "";
            const right = this.parsePrimary();

            left = {
                id: this.id(),
                type: "LogicalExpression",
                operator,
                left,
                right
            };
        }

        return left;
    }


    private parseExpression(): AstTreeNode | null {
        const currentToken = this.peek();
        if (currentToken.type === TOKEN_TYPE.KEYWORD) {
            switch (currentToken.value) {
                case 'number':
                case 'text':
                case 'bool':
                case 'char':
                    return this.parseVariableDeclaration();
                case 'if':
                    return this.parseIfExpression();
                case 'return':
                    return this.parseReturnStatement();
                case 'true':
                case 'false':
                    return this.parsePrimary();
                default:
                    throw new Error(`Unexpected Keyword is encountered ${currentToken.value}`);
            }
        }
        else if ([TOKEN_TYPE.BOOL, TOKEN_TYPE.CHAR, TOKEN_TYPE.TEXT, TOKEN_TYPE.NUMBER].includes(currentToken.type)) {
            return this.parseLiteral();
        }
        else if (currentToken.type === TOKEN_TYPE.IDENTIFIER) {
            return this.parseComparison();
        }
        else if (currentToken.type === "eof") {
            return new EofNode();
        }

        else {
            throw new Error(`Unexpected Expression ${currentToken.type + ' ' + currentToken.value} arrived at line ${currentToken.line} col ${currentToken.col}`)
        }
    }
    private id(): string {
        const randomArray = [
            ...'abcfrstngh2lmQR7HIJKLMNOPuvwxyz',
            ...'ABCDijk68VWXYZ',
            ...'01EFSTUopqG34de59'
        ];
        var uniq_id = "";
        for (var i = 0; i < 16; i++) {
            uniq_id += randomArray[(Math.floor(Math.random() * 895655)) % randomArray.length];
        }
        return uniq_id;
    }

    parse(): ProgramNode {
        var programNode = new ProgramNode();
        while (!this.isAtEnd()) {
            try {
                var statement = this.parseExpression();
                if (statement) {
                    programNode.body.push(statement);
                    if(statement.type==='EOF')
                    {
                        break;
                    }
                }
                else{
                    console.log("me nalla hu")
                }

            } catch (err) {
                console.error(err)
                this.advance();
            }
        }
        return programNode
    }
}
