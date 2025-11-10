import { AstTreeNode, ProgramNode, ASTNodeType, BoolLiteral, TextLiteral, NumberLiteral, VariableDeclaration, IfExpression, LogicalExpression, EofNode, ExitStatement, VariableReassignment, BinaryExpression, IdentifierNode, UnaryExpression } from "./abstractSyntaxTree";
import { Operators, Token, TOKEN_TYPE } from "./token";
import { SymbolTable } from "./symbolTable";
import chalk from "chalk";
import { getAssociativity, getPrecedence } from "./precedence";
import { error } from "console";

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
        else {
            console.log("Unsupported literal type:", currentToken, this.tokens.splice(this.index));
            throw new Error(`Unsupported literal type: ${currentToken.type} at line ${currentToken.line} col ${currentToken.col}`);
        }
    }
    private getType(node: AstTreeNode): string | null {
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
            case "BinaryExpression": {
                //console.log("BinaryExpression node:", node);
                const leftType = this.getType(node.left) || SymbolTable.getEntry(node.left as string)?.type;
                const rightType = this.getType(node.right);
                //console.log("BinaryExpression types:", leftType, rightType);
                if (leftType !== rightType && this.basicTypes.get(leftType as string) !== this.basicTypes.get(rightType as string)) {
                    throw new Error(`Type mismatch in binary expression: ${leftType} ${node.operator} ${rightType}`);
                }
                //console.log("BinaryExpression resulting type:", leftType,rightType);
                return leftType as string;
            }
            case "VariableReassignment": {
                return node.value?.type;
            }
            case "ReturnStatement":
                return this.getType(node.value as BoolLiteral);
            case "UnaryExpression":
                return this.getType(node.argument)
            default:
                console.log("in default case  get",node.type);
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
        else if (value instanceof BinaryExpression) {
            var leftNode = value.left;
            var rightNode = value.right;
            console.log("Binary Expression in variable declaration:", this.getType(leftNode), this.getType(rightNode));
            if (this.getType(leftNode) !== this.getType(rightNode)) {
                throw new Error(`Type mismatch in binary expression for variable declaration at line ${keyword.line} col ${keyword.col}`);
            }
            var lftType: "number" | "text" | "bool" = this.getType(leftNode) as "number" | "text" | "bool";
            var newVariable = new VariableDeclaration("", lftType, identifier.value as string);
            newVariable.body = [value]
            SymbolTable.addEntry(identifier.value as string, lftType);
            return newVariable;
        }
        else {
            //console.log("Invalid variable declaration value:", value);
            throw new Error(`INvalid variable declaration at line ${keyword.line} col ${keyword.col}, Invalid value is assigned or resulting expression is of different type`)
        }
    }
    private parseBinaryExpression(minPrecedence: number = 0): AstTreeNode | null {
        // Parse the left operand
        let currentToken = this.peek();
        let leftNode: AstTreeNode | null = null;

        if (currentToken.type === TOKEN_TYPE.OPERATOR && (currentToken.value === '++' || currentToken.value === '--')) {
            const operator = currentToken.value;
            this.advance(); // consume ++ or --
            const argument = this.parseBinaryExpression(10) as AstTreeNode; // high precedence
            return new UnaryExpression(operator, argument, true, this.id()); // prefix
        }
        else if (currentToken.type === TOKEN_TYPE.PUNCTUATION && currentToken.value === '(') {
            this.advance(); // consume '('
            leftNode = this.parseBinaryExpression(0); // parse inside parentheses
            const next = this.peek();
            if (next.type !== TOKEN_TYPE.PUNCTUATION || next.value !== ')') {
                throw new Error(`Expected ')' after expression at line ${next.line}, col ${next.col}`);
            }
            this.advance(); // consume ')'
        }
        else if ([TOKEN_TYPE.BOOL, TOKEN_TYPE.CHAR, TOKEN_TYPE.TEXT, TOKEN_TYPE.NUMBER].includes(currentToken.type)) {
            leftNode = this.parseLiteral();
        }
        else if (currentToken.type === TOKEN_TYPE.IDENTIFIER) {
            SymbolTable.hasEntry(currentToken.value as string) ||
                (() => { throw new Error(`Variable ${currentToken.value} not declared before usage at line ${currentToken.line} col ${currentToken.col}`) })();
            this.advance(); // consume identifier
            leftNode = new IdentifierNode(currentToken.value as string, this.id());
        }

        while (!this.isAtEnd()) {
            const operatorToken = this.peek();
            if (operatorToken.type !== TOKEN_TYPE.OPERATOR) break;

            const precedence = getPrecedence(operatorToken.value!);
            if (precedence < minPrecedence) break;

            this.advance();

            const nextMinPrec = getAssociativity(operatorToken.value!) === 'right' ? precedence : precedence + 1;
            const rightNode = this.parseBinaryExpression(nextMinPrec);

            leftNode = new BinaryExpression(leftNode!, operatorToken.value!, rightNode!, this.id());
        }

        return leftNode;
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
        else if (currentToken.type === TOKEN_TYPE.PUNCTUATION && currentToken.value === '(') {
            // Handle grouped or parenthesized expressions
            const exprNode = this.parseBinaryExpression();
            return exprNode;
        }

        else if ([TOKEN_TYPE.BOOL, TOKEN_TYPE.CHAR, TOKEN_TYPE.TEXT, TOKEN_TYPE.NUMBER].includes(currentToken.type)) {
            var nxtToken = this.peek(1);
            var opratorArray = Object.values(Operators);
            if (nxtToken.type === TOKEN_TYPE.OPERATOR && opratorArray.includes(nxtToken.value as string)) {
                var nnode = this.parseBinaryExpression();
                //this.index = this.index - 1;
                return nnode;
            }
            return this.parseLiteral();
        }
        else if (currentToken.type === TOKEN_TYPE.EOF) {
            this.advance();
            return null;
        }
        else if (currentToken.type === TOKEN_TYPE.IDENTIFIER) {
            var nxtToken: Token = this.tokens[this.index + 1];
            var newValue: AstTreeNode | null = null;
            if (nxtToken.type === "operator" && Object.values(Operators).includes(nxtToken.value as string)) {
                //console.log("identifier:", currentToken, nxtToken);
                switch (nxtToken.value) {
                    case Operators.ASSIGN:
                        SymbolTable.hasEntry(currentToken.value as string) || (() => { throw new Error(`Variable ${currentToken.value} not declared before assignment at line ${currentToken.line} col ${currentToken.col}`) })();
                        newValue = this.parseVariableReassignment();
                        break;
                    case Operators.MINUSEQL:
                        SymbolTable.hasEntry(currentToken.value as string) || (() => { throw new Error(`Variable ${currentToken.value} not declared before assignment at line ${currentToken.line} col ${currentToken.col}`) })();
                        this.advance();
                        this.expect(TOKEN_TYPE.OPERATOR, '-=')
                        var rhs = this.parseExpression();
                        newValue = new BinaryExpression(currentToken, Operators.MINUS, rhs);
                        break;
                    case Operators.PLUSEQL:
                        SymbolTable.hasEntry(currentToken.value as string) || (() => { throw new Error(`Variable ${currentToken.value} not declared before assignment at line ${currentToken.line} col ${currentToken.col}`) })();
                        this.advance();
                        this.expect(TOKEN_TYPE.OPERATOR, '+=')
                        var rhs = this.parseExpression();
                        newValue = new BinaryExpression(currentToken, Operators.PLUS, rhs);
                        break;
                    case Operators.DIVEQL:
                        SymbolTable.hasEntry(currentToken.value as string) || (() => { throw new Error(`Variable ${currentToken.value} not declared before assignment at line ${currentToken.line} col ${currentToken.col}`) })();
                        this.advance();
                        this.expect(TOKEN_TYPE.OPERATOR, '/=')
                        var rhs = this.parseExpression();
                        newValue = new BinaryExpression(currentToken, Operators.DIV, rhs);
                        break;
                    case Operators.MULEQL:
                        SymbolTable.hasEntry(currentToken.value as string) || (() => { throw new Error(`Variable ${currentToken.value} not declared before assignment at line ${currentToken.line} col ${currentToken.col}`) })();
                        this.advance();
                        this.expect(TOKEN_TYPE.OPERATOR, '*=')
                        var rhs = this.parseExpression();
                        newValue = new BinaryExpression(currentToken, Operators.MUL, rhs);
                        break;
                    case Operators.PLUS:
                        this.advance();
                        this.expect(TOKEN_TYPE.OPERATOR, '+')
                        var rhs = this.parseExpression();
                        newValue = new BinaryExpression(currentToken, Operators.PLUS, rhs);
                        this.index = this.index;
                        return newValue as AstTreeNode | null;
                    case Operators.MINUS:
                        this.advance();
                        this.expect(TOKEN_TYPE.OPERATOR, '-')
                        var rhs = this.parseExpression();
                        newValue = new BinaryExpression(currentToken, Operators.MINUS, rhs);
                        this.index = this.index;
                        return newValue as AstTreeNode | null;
                    case Operators.DIV:
                        this.advance();
                        this.expect(TOKEN_TYPE.OPERATOR, '/')
                        var rhs = this.parseExpression();
                        newValue = new BinaryExpression(currentToken, Operators.DIV, rhs);
                        this.index = this.index;
                        return newValue as AstTreeNode | null;
                    case Operators.MUL:
                        this.advance();
                        this.expect(TOKEN_TYPE.OPERATOR, '*')
                        var rhs = this.parseExpression();
                        newValue = new BinaryExpression(currentToken, Operators.MUL, rhs);
                        this.index = this.index;
                        return newValue as AstTreeNode | null;
                    case Operators.INCREMENT:
                        SymbolTable.hasEntry(currentToken.value as string) || (() => { throw new Error(`Variable ${currentToken.value} not declared before assignment at line ${currentToken.line} col ${currentToken.col}`) })();
                        this.advance();
                        this.expect(TOKEN_TYPE.OPERATOR,"++");
                        return new UnaryExpression(Operators.INCREMENT,new IdentifierNode(currentToken.value!,this.id()),false,this.id());
                    case Operators.DEECREMENT:
                        SymbolTable.hasEntry(currentToken.value as string) || (() => { throw new Error(`Variable ${currentToken.value} not declared before assignment at line ${currentToken.line} col ${currentToken.col}`) })();
                        this.advance();
                        this.expect(TOKEN_TYPE.OPERATOR,"--");
                        return new UnaryExpression(Operators.DEECREMENT,new IdentifierNode(currentToken.value!,this.id()),false,this.id());
                    
                    default:
                        throw new Error(`Unsupported operator ${nxtToken.value} for reassignment at line ${nxtToken.line} col ${nxtToken.col}`);
                }
            }

            var leftType = (SymbolTable.getEntry(currentToken.value as string))?.type
            var rightType = this.getType(newValue as AstTreeNode);
            if (rightType == "BinaryExpression") {
                rightType = this.getType(newValue?.value);
            }
            if( rightType == "UnaryExpression")
            {
                rightType = this.getType(newValue?.value.argument);
            }

            if (leftType !== rightType && this.basicTypes.get(leftType as string) !== this.basicTypes.get(rightType as string)) {
                throw new Error(`Type mismatch in reassignment: ${leftType} = ${rightType} at line ${currentToken.line} col ${currentToken.col}`);
            }
            this.expect(TOKEN_TYPE.PUNCTUATION, ';');
            return newValue as AstTreeNode | null;
        }
        else if(currentToken.type ===  TOKEN_TYPE.OPERATOR &&  (currentToken.value === Operators.INCREMENT ||  currentToken.value === Operators.DEECREMENT))
        {
            this.expect(TOKEN_TYPE.OPERATOR,currentToken.value);
                       var nextToken = this.peek();
                        if(nextToken.type === TOKEN_TYPE.IDENTIFIER)
                        {
                            this.advance()
                           return new UnaryExpression(currentToken.value,new IdentifierNode(nextToken.value!,this.id()),true,this.id());
                        }
                        else{
                            throw new Error(`Unsupported Uniary Operation ${nextToken.value} for reassignment at line ${nextToken.line} col ${nextToken.col}`);
                        }
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
