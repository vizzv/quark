import { TOKEN_TYPE, TokenType } from "./token";

export type ASTNodeType =
    | 'Program'
    | 'VariableDeclaration'
    | 'ArithmeticExpression'
    | 'RelationalExpression'
    | 'LogicalExpression'
    | 'BitwiseExpression' 
    | 'AssigmentExpression'
    | 'SpecialAssignmentExpression'
    | 'NumberLiteral'
    | 'StringLiteral'
    | 'BoolLiteral'

export interface AstNode {
    type: ASTNodeType;
    id: string;
    [key: string]: any;
}



    export class AstTreeNode implements AstNode {
    [key: string]: any;
    type: ASTNodeType;
    id: string;
    constructor(type: ASTNodeType, id: string, extraProps: { [key: string]: any } = {}) {
        this.type = type;
        this.id = id;
        Object.assign(this, extraProps);
    }

}

export class ProgramNode extends AstTreeNode {
    body: AstTreeNode[]
    constructor() {
        super('Program', 'program');
        this.body = [];
    }

}



export class LogicalExpression extends AstTreeNode {
    constructor(id:string) {
        super('LogicalExpression',id);
    }
}
export class ArithmeticExpression extends AstTreeNode {
    value:number
    constructor(id:string,value:number) {
        
        super('ArithmeticExpression',id);
        this.value = value;
    }
}
export class RelationalExpression extends AstTreeNode {
    value:boolean
    constructor(id:string,value:boolean) {
        
        super('RelationalExpression',id);
        this.value = value;
    }
}
export class BitwiseExpression extends AstTreeNode {
    value:any
    constructor(id:string,value:any) {
        
        super('BitwiseExpression',id);
        this.value = value;
    }
}

export class AssigmentExpression extends AstTreeNode {
    value:any
    constructor(id:string,value:any) {
        
        super('AssigmentExpression',id);
        this.value = value;
    }
}

export class SpecialAssignmentExpression extends AstTreeNode {
    value:any
    constructor(id:string,value:any) {
        
        super('SpecialAssignmentExpression',id);
        this.value = value;
    }
}

export class NumberLiteral extends AstTreeNode {

    value:number
    constructor(id:string,value:number) {
        
        super('NumberLiteral',id);
        this.value = value;
    }
}

export class TextLiteral extends AstTreeNode {
    value:string
    constructor(id:string,value:string) {
        
        super('StringLiteral',id);
        this.value = value;
    }
}

export class BoolLiteral extends AstTreeNode {

    value:boolean
    constructor(id:string,value:boolean) {
        
        super('ArithmeticExpression',id);
        this.value = value;
    }
}

export class VariableDeclaration extends AstTreeNode
{

    constructor(id:string,variableType:'text'|'number'|'bool'|'char') {
        
        super('VariableDeclaration',id);
        this.variableType = variableType;
    }
}
