import { stat } from "fs";
import { AstTreeNode, ProgramNode, ASTNodeType, BoolLiteral, TextLiteral, NumberLiteral, VariableDeclaration, IfExpression, LogicalExpression, EofNode, ExitStatement } from "./abstractSyntaxTree";
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
        if(currentToken.type === TOKEN_TYPE.BOOL)
        {   //console.log("in parseLiteral bool");
            if(!["true","false"].includes(currentToken.value?.toLowerCase()??""))
            {
                throw new Error(`Expected Bool but got ${currentToken.value} `);
            }
            let currentValue = currentToken.value?.toLowerCase() === "true";
	    var BoolNode = new BoolLiteral(this.id(), currentValue);
            return BoolNode;
        }
        else if(currentToken.type === TOKEN_TYPE.TEXT)
        {
	    var TextNode = new TextLiteral(this.id(), currentToken.value ?? "");
            return TextNode;
        }
        else if (currentToken.type === TOKEN_TYPE.NUMBER) {
            let currentValue = currentToken.value ?? "";
            const floatRegex = /^(?:\d+\.\d*|\d*\.\d+|\d+)$/;
            const intRegex = /^\d+$/
            if(intRegex.test(currentValue))
            {
		var NumberNode = new NumberLiteral(this.id(),Number.parseInt(currentValue));
		return NumberNode;
            }
            else if(floatRegex.test(currentValue))
            {
		var NumberNode = new NumberLiteral(this.id(),Number.parseFloat(currentValue)) 
		return NumberNode;
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

        this.expect(TOKEN_TYPE.PUNCTUATION,';');
        if(value instanceof BoolLiteral )
        {
            //console.log("in parseVariableDeclaration bool",value,identifier);
	    var newVariable = new VariableDeclaration("","bool",identifier.value as string);
	    newVariable.body = [value]
	    return newVariable;
        }
        else if(value instanceof NumberLiteral)
        {
	    var newVariable = new VariableDeclaration("","number",identifier.value as string);
	    newVariable.body = [value]
	    return newVariable;
        }
        else if(value instanceof TextLiteral)
        {
	    var newVariable = new VariableDeclaration("","text",identifier.value as string);
	    newVariable.body = [value]
	    return newVariable;
        }
        else{
            throw new Error(`INvalid variable declaration at line ${keyword.line} col ${keyword.col}, Invalid value is assigned or resulting expression is of different type`)
        }
    }

    private parseExpression(): AstTreeNode | null {
        const currentToken = this.peek();
        //console.log("currentToken",currentToken.type,currentToken.value,currentToken.col,currentToken.line);
        if(currentToken.type===TOKEN_TYPE.KEYWORD)
        {
            switch(currentToken.value)
            {
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
	else if(currentToken.type===TOKEN_TYPE.EOF)
	{
	 this.advance();
	 return null;
	}
        else{
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
        var programNode = new ProgramNode ();
        while(!this.isAtEnd())
        {
            var statement = this.parseExpression();
            if(statement){
                programNode.body.push(statement)
            }
        }
        return programNode
    }
}
