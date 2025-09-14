import { AstTreeNode, ProgramNode,ASTNodeType, BoolLiteral, TextLiteral, NumberLiteral, VariableDeclaration } from "./abstractSyntaxTree";
import { Token, TOKEN_TYPE } from "./token";

export class Parser {
    private tokens: Token[] = [];
    private index:number =0;
    constructor(tokens: Token[] = []) {
        this.tokens = tokens;
        this.index = 0;
    }
    private isAtEnd():boolean
    {
        return this.index>=this.tokens.length;
    }

    private peek(offset=0) :Token
    {
        return this.tokens[this.index + offset] || '\0';
    }
    private advance() :Token
    {
        return  this.tokens[this.index++];
    }
    private expect(type: string, value?: string): Token {
    const token = this.advance();
    if (token.type !== type || (value && token.value !== value)) {
        throw new Error(`Expected ${type} '${value}', but got ${token.type} '${token.value}'`);
    }
    return token;
    }

    private parseLiteral():AstTreeNode
    {
        var currentToken = this.advance();
        if(currentToken.type === TOKEN_TYPE.BOOL)
        {
            if(!["true","false"].includes(currentToken.value?.toLowerCase()??""))
            {
                throw new Error(`Expected Bool but got ${currentToken.value} `);
            }
            let currentValue = currentToken.value?.toLowerCase() === "true";
            return new BoolLiteral(this.id(), currentValue);
        }
        else if(currentToken.type === TOKEN_TYPE.TEXT)
        {
            return new TextLiteral(this.id(), currentToken.value ?? "");
        }
        else if(currentToken.type === TOKEN_TYPE.NUMBER)
        {
            let currentValue = currentToken.value??"";
            const floatRegex = /^(?:\d+\.\d*|\d*\.\d+|\d+)$/;
            const intRegex = /^\d+$/
            if(intRegex.test(currentValue))
            {
                return new NumberLiteral(this.id(),Number.parseInt(currentValue))
            }
            else if(floatRegex.test(currentValue))
            {
                return new NumberLiteral(this.id(),Number.parseFloat(currentValue))
            }
            else {
                throw new Error(`Invalid number ${currentValue} encounters at line ${currentToken.line} col ${currentToken.col}`)
            }
        }
        throw new Error(`Unsupported literal type: ${currentToken.type} at line ${currentToken.line} col ${currentToken.col}`);
    }

    private parseVariableDeclaration():AstTreeNode
    {
        const keyword = this.advance();
        const identifier = this.advance();
        if(identifier.type !== TOKEN_TYPE.IDENTIFIER)
        {
            throw new Error(`Expected identifier after ${keyword.value} at line ${identifier.line} col ${identifier.col} identifier: ${identifier}`);
        }
        this.expect(TOKEN_TYPE.OPERATOR,'=');
        const value = this.parseExpression();
        this.expect(TOKEN_TYPE.PUNCTUATION,';');
        if(value instanceof BoolLiteral )
        {
            return new VariableDeclaration("","bool")
        }
        else if(value instanceof NumberLiteral)
        {   
            return new VariableDeclaration("","number")
        }
        else if(value instanceof TextLiteral)
        {
            return new VariableDeclaration("",'text')
        }
        else{
            throw new Error(`INvalid variable declaration at line ${keyword.line} col ${keyword.col}, Invalid value is assigned or resulting expression is of different type`)
        }
        
    }

    private parseExpression(): AstTreeNode | null
    {
        const currentToken = this.peek();
        //console.log("currentToken",currentToken.value,currentToken.col,currentToken.line);
        if(currentToken.type===TOKEN_TYPE.KEYWORD)
        {
            switch(currentToken.value)
            {
                case 'number':
                case 'text':
                case 'bool':
                case 'char':
                    return this.parseVariableDeclaration();
            }
        }
        else if([TOKEN_TYPE.BOOL,TOKEN_TYPE.CHAR,TOKEN_TYPE.TEXT,TOKEN_TYPE.NUMBER].includes(currentToken.type))
        {
            return this.parseLiteral();
        }
        else{
            throw new Error(`Unexpected Expression ${currentToken.type}  arrived at line ${currentToken.line} col ${currentToken.col}`)
        }
        return null;
    }
    private id():string
    {
        const randomArray = [
            ...'abcdefrstngh2lmQR7HIJKLMNOPuvwxyz',
            ...'ABCDijkVWXYZ',
            ...'01EFSTUopqG345689'
        ];
        var uniq_id = "";
        for(var i=0;i<16;i++)
        {
            uniq_id += randomArray[(Math.floor(Math.random()*895655) ) % randomArray.length];
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
            this.advance();
        }
        return programNode
    }
}
