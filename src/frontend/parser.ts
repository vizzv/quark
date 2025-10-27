import { stat } from "fs";
import { AstTreeNode, ProgramNode, ASTNodeType, BoolLiteral, TextLiteral, NumberLiteral, VariableDeclaration, IfExpression, LogicalExpression, EofNode, ExitStatement, VariableReassignment, BinaryExpression, IdentifierNode } from "./abstractSyntaxTree";
import { Operators, Token, TOKEN_TYPE } from "./token";
import { SymbolTable } from "./symbolTable";

export class Parser {
    private tokens: Token[] = [];
    private basicTypes: Map<string, string> = new Map([
        ['number', 'number'],
        ['text', 'text'],
        ['bool', 'bool'],
        ['NumberLiteral', 'number'],
        ['TextLiteral', 'text'],
        ['BoolLiteral', 'bool']
    ]);
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
        console.log("in parseLiteral",currentToken);

        if (currentToken.type === TOKEN_TYPE.BOOL) {   //console.log("in parseLiteral bool");
            if (!["true", "false"].includes(currentToken.value?.toLowerCase() ?? "")) {
                throw new Error(`Expected Bool but got ${currentToken.value} `);
            }
            let currentValue = currentToken.value?.toLowerCase() === "true";
            var BoolNode = new BoolLiteral(this.id(), currentValue);
            return BoolNode;
        }
        else if (currentToken.type === TOKEN_TYPE.TEXT) {
            var TextNode = new TextLiteral(this.id(), currentToken.value ?? "");
            return TextNode;
        }
        else if (currentToken.type === TOKEN_TYPE.NUMBER) {
            let currentValue = currentToken.value ?? "";
            const floatRegex = /^(?:\d+\.\d*|\d*\.\d+|\d+)$/;
            const intRegex = /^\d+$/
            if (intRegex.test(currentValue)) {
                var NumberNode = new NumberLiteral(this.id(), Number.parseInt(currentValue));
                return NumberNode;
            }
            else if (floatRegex.test(currentValue)) {
                var NumberNode = new NumberLiteral(this.id(), Number.parseFloat(currentValue))
                return NumberNode;
            }
            else {
                throw new Error(`Invalid number ${currentValue} encounters at line ${currentToken.line} col ${currentToken.col}`)
            }
        }
        throw new Error(`Unsupported literal type: ${currentToken.type} at line ${currentToken.line} col ${currentToken.col}`);
    }
    private getType(node: AstTreeNode): string | null {
        console.log("Getting type of node:", node);
        switch (node.type) {
            case "BoolLiteral":
                return "bool";
            case "NumberLiteral":
                return "number";
            case "TextLiteral":
                return "text";
            case "identifier":
                return SymbolTable.getEntry(node.value)?.type || null; 
            case "IfExpression": {
                const thenTypes = node.thenBranch.map((n: AstTreeNode) => this.getType(n));
                const elseTypes = node.elseBranch?.map((n: AstTreeNode) => this.getType(n)) ?? [];
                const allTypes = new Set([...thenTypes, ...elseTypes]);
                if (allTypes.size === 1) return [...allTypes][0];
                throw new Error(`Mismatched return types in if-expression`);
            }
            case "BinaryExpression" : {
                console.log("BinaryExpression node:", node);
                const leftType = this.getType(node.left) || SymbolTable.getEntry(node.left as string)?.type;
                const rightType = this.getType(node.right);
                console.log("BinaryExpression types:", leftType, rightType);
                if (leftType !== rightType && this.basicTypes.get(leftType as string) !== this.basicTypes.get(rightType as string)) {
                    throw new Error(`Type mismatch in binary expression: ${leftType} ${node.operator} ${rightType}`);
                }
                
                return leftType as string;
            }
            case "VariableReassignment": {
                return node.value?.type;
            }
            case "ReturnStatement":
                return this.getType(node.value as BoolLiteral);
            default:
                return null;
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

        if (value instanceof BoolLiteral) {
            //console.log("in parseVariableDeclaration bool",value,identifier);
            var newVariable = new VariableDeclaration("", "bool", identifier.value as string);
            newVariable.body = [value]
            SymbolTable.addEntry(identifier.value as string, "bool");
            return newVariable;
        }
        else if (value instanceof NumberLiteral) {
            var newVariable = new VariableDeclaration("", "number", identifier.value as string);
            newVariable.body = [value]
            SymbolTable.addEntry(identifier.value as string, "number");
            return newVariable;
        }
        else if (value instanceof TextLiteral) {
            var newVariable = new VariableDeclaration("", "text", identifier.value as string);
            newVariable.body = [value]
            SymbolTable.addEntry(identifier.value as string, "text");
            return newVariable;
        }
        else {
            throw new Error(`INvalid variable declaration at line ${keyword.line} col ${keyword.col}, Invalid value is assigned or resulting expression is of different type`)
        }
    }

    private parseVariableReassignment(): AstTreeNode | null {

        const currentToken = this.advance();
        this.expect(TOKEN_TYPE.OPERATOR, '=');
        var val: AstTreeNode | null = this.parseExpression();
        //console.log("Parsed value for assignment:", val?.value);
        return new VariableReassignment("", currentToken.value as string, val as AstTreeNode);
    }

    private parseExpression(): AstTreeNode | null {
        const currentToken = this.peek();
        //console.log("currentToken",currentToken.type,currentToken.value,currentToken.col,currentToken.line);
        if (currentToken.type === TOKEN_TYPE.KEYWORD) {
            switch (currentToken.value) {
                case 'number':
                case 'text':
                case 'bool':
                case 'char':
                    return this.parseVariableDeclaration();
                default:
                    throw new Error(`Unexpected Keyword is encountered ${currentToken.value}`);
            }
        }
        else if ([TOKEN_TYPE.BOOL, TOKEN_TYPE.CHAR, TOKEN_TYPE.TEXT, TOKEN_TYPE.NUMBER].includes(currentToken.type)) {
            return this.parseLiteral();
        }
        else if (currentToken.type === TOKEN_TYPE.EOF) {
            this.advance();
            return null;
        }
        else if (currentToken.type === TOKEN_TYPE.IDENTIFIER) {
            var nxtToken: Token = this.tokens[this.index + 1];
            var newValue: AstTreeNode | null =  null;
            if (nxtToken.type === "operator" && Object.values(Operators).includes(nxtToken.value as string))
            {
                console.log("identifier:", currentToken,nxtToken);
                switch (nxtToken.value) {
                    case Operators.ASSIGN:
                        SymbolTable.hasEntry(currentToken.value as string) || (() => { throw new Error(`Variable ${currentToken.value} not declared before assignment at line ${currentToken.line} col ${currentToken.col}`) })();
                        newValue = this.parseVariableReassignment();
                        break;
                    case Operators.MINUSEQL:
                        SymbolTable.hasEntry(currentToken.value as string) || (() => { throw new Error(`Variable ${currentToken.value} not declared before assignment at line ${currentToken.line} col ${currentToken.col}`) })();
                        this.advance();
                        this.expect(TOKEN_TYPE.OPERATOR, '-=')
                        console.log("peek", this.peek());
                        var rhs = this.parseExpression();
                        console.log("RHS of -= :", rhs);
                        newValue = new BinaryExpression(currentToken,Operators.MINUS, rhs);
                        break;
                    case Operators.PLUSEQL:
                        SymbolTable.hasEntry(currentToken.value as string) || (() => { throw new Error(`Variable ${currentToken.value} not declared before assignment at line ${currentToken.line} col ${currentToken.col}`) })();
                        this.advance();
                        this.expect(TOKEN_TYPE.OPERATOR, '+=')
                        console.log("peek", this.peek());
                        var rhs = this.parseExpression();
                        console.log("RHS of += :", rhs);
                        newValue = new BinaryExpression(currentToken,Operators.PLUS, rhs);
                        break;
                    case Operators.DIVEQL:
                        SymbolTable.hasEntry(currentToken.value as string) || (() => { throw new Error(`Variable ${currentToken.value} not declared before assignment at line ${currentToken.line} col ${currentToken.col}`) })();
                        this.advance();
                        this.expect(TOKEN_TYPE.OPERATOR, '/=')
                        console.log("peek", this.peek());
                        var rhs = this.parseExpression();
                        console.log("RHS of /= :", rhs);
                        newValue = new BinaryExpression(currentToken,Operators.DIV, rhs);
                        break;
                    case Operators.MULEQL:
                        SymbolTable.hasEntry(currentToken.value as string) || (() => { throw new Error(`Variable ${currentToken.value} not declared before assignment at line ${currentToken.line} col ${currentToken.col}`) })();
                        this.advance();
                        this.expect(TOKEN_TYPE.OPERATOR, '*=')
                        console.log("peek", this.peek());
                        var rhs = this.parseExpression();
                        console.log("RHS of *= :", rhs);
                        newValue = new BinaryExpression(currentToken,Operators.MUL, rhs);
                        break;
                    default:
                        throw new Error(`Unsupported operator ${nxtToken.value} for reassignment at line ${nxtToken.line} col ${nxtToken.col}`);
                }
            }
            else if( nxtToken.type === TOKEN_TYPE.PUNCTUATION && nxtToken.value === ';')
            {
                SymbolTable.hasEntry(currentToken.value as string) || (() => { throw new Error(`Variable ${currentToken.value} not declared before usage at line ${currentToken.line} col ${currentToken.col}`) })();
                this.advance();
                return new IdentifierNode(currentToken.value as string, "");
            }
            console.log("New Value for reassignment:", newValue,currentToken);
            var leftType = (SymbolTable.getEntry(currentToken.value as string))?.type 
            console.log("Left Type:", leftType);
            console.log("Right Type:", newValue as AstTreeNode);

            var rightType = this.getType(newValue as AstTreeNode);
            console.log("Right Type:", rightType);

            console.log("Reassignment types:", leftType, rightType);

            if (leftType !== rightType && this.basicTypes.get(leftType as string) !== this.basicTypes.get(rightType as string)) {
                throw new Error(`Type mismatch in reassignment: ${leftType} = ${rightType} at line ${currentToken.line} col ${currentToken.col}`);
            }

            this.expect(TOKEN_TYPE.PUNCTUATION, ';');
            return newValue as AstTreeNode | null;;
        }
        else {
            throw new Error(`Unexpected Expression ${currentToken.type} ${currentToken.value} arrived at line ${currentToken.line} col ${currentToken.col}`)
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
            var statement = this.parseExpression();
            if (statement) {
                programNode.body.push(statement)
            }
        }
        return programNode
    }
}
