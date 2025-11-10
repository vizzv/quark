import { TOKEN_TYPE, TokenType } from "./token";

export type ASTNodeType =
    | 'Program'
    | 'VariableDeclaration'
    | 'VariableReassignment'
    | 'identifier'
    | 'ArithmeticExpression'
    | 'RelationalExpression'
    | 'IfExpression'
    | 'LogicalExpression'
    | 'BitwiseExpression'
    | 'AssigmentExpression'
    | 'UnaryExpression'
    | 'BinaryExpression'
    | 'SpecialAssignmentExpression'
    | 'NumberLiteral'
    | 'TextLiteral'
    | 'BoolLiteral'
    | 'ReturnStatement'
    | 'ExitStatement'
    | 'EOF'

export interface AstNode {
    type: ASTNodeType;
    id: string;
    body?: AstNode[];
    [key: string]: any;
}



export class AstTreeNode implements AstNode {
    [key: string]: any;
    type: ASTNodeType;
    id: string;
    body?: AstTreeNode[];
    constructor(type: ASTNodeType, id: string, extraProps: { [key: string]: any } = {}) {
        this.type = type;
        this.id = id;
        Object.assign(this, extraProps);
    }

}

export class IdentifierNode extends AstTreeNode {
    constructor(value: string, id: string) {
        super('identifier', id);
        this.value = value;
    }
}

export class ProgramNode extends AstTreeNode {
    body: AstTreeNode[]
    constructor() {
        super('Program', 'program');
        this.body = [];
    }

}

export class EofNode extends AstTreeNode {
    constructor() {
        super('EOF', 'eof');
    }
}

export class LogicalExpression extends AstTreeNode {
    constructor(id: string) {
        super('LogicalExpression', id);
    }
}
export class UnaryExpression extends AstTreeNode {
    operator: string;
    argument: AstTreeNode;
    prefix: boolean;

    constructor(operator: string, argument: AstTreeNode, prefix: boolean, id: string = 'unaryExpr') {
        super('UnaryExpression', id);
        this.operator = operator;
        this.argument = argument;
        this.prefix = prefix;
    }
}

export class BinaryExpression extends AstTreeNode {
    left: any
    operator: string
    right: any
    constructor(left: any, operator: string, right: any,id: string='binaryExpr') {

        super('BinaryExpression', id);
        this.left = left;
        this.operator = operator;
        this.right = right;
    }
}

export class AssigmentExpression extends AstTreeNode {
    value: any
    constructor(id: string, value: any) {

        super('AssigmentExpression', id);
        this.value = value;
    }
}

export class SpecialAssignmentExpression extends AstTreeNode {
    value: any
    constructor(id: string, value: any) {

        super('SpecialAssignmentExpression', id);
        this.value = value;
    }
}

export class NumberLiteral extends AstTreeNode {

    value: number
    constructor(id: string, value: number) {

        super('NumberLiteral', id);
        this.value = value;
    }
}

export class TextLiteral extends AstTreeNode {
    value: string
    constructor(id: string, value: string) {

        super('TextLiteral', id);
        this.value = value;
    }
}

export class BoolLiteral extends AstTreeNode {

    value: boolean
    constructor(id: string, value: boolean) {

        super('BoolLiteral', id);
        this.value = value;
    }
}

export class VariableDeclaration extends AstTreeNode {

    constructor(id: string, variableType: 'text' | 'number' | 'bool' | 'char', identifier: string) {

        super('VariableDeclaration', id);
        this.variableType = variableType;
        this.identifier = identifier;
    }
}

export class VariableReassignment extends AstTreeNode {

    constructor(id: string, identifier: string, value: AstTreeNode) {

        super('VariableReassignment', id);
        this.identifier = identifier;
        this.value = value;
    }
}

export class IfExpression extends AstTreeNode {
    elseBranch: AstTreeNode[] | null
    ifCondition: LogicalExpression
    constructor(id: string, ifCondition: LogicalExpression, thenBlock: AstTreeNode[], elseBlock: AstTreeNode[] | null) {
        super('IfExpression', id);
        this.body = [];
        this.ifCondition = ifCondition;
        this.elseBranch = elseBlock;
        this.thenBranch = thenBlock;
    }
}

export class ExitStatement extends AstTreeNode {
    constructor(id: string, statementValue: AstTreeNode) {
        super('ExitStatement', id);
        this.body = [statementValue];
    }
}


export function printAstTree(node: AstTreeNode, indent = ''): void {
    console.log(`${indent}${node.type}${node.name ? ` (${node.name})` : ''}`);

    if (node instanceof IfExpression) {
        console.log(`${indent}  ├─ Condition:`);
        printAstTree(node.ifCondition, indent + '  │   ');
        console.log(`${indent}  ├─ Then:`);
        node.body?.forEach(child => printAstTree(child, indent + '  │   '));
        if (node.elseBlock) {
            console.log(`${indent}  └─ Else:`);
            node.elseBlock.forEach((child: AstTreeNode) => printAstTree(child as AstTreeNode, indent + '      '));
        }
    } else if (node.body && Array.isArray(node.body)) {
        node.body.forEach(child => printAstTree(child, indent + '  '));
    }
}

export function toDot(node: AstTreeNode, parentId?: string, lines: string[] = []): string[] {
    const currentId = node.id;
    lines.push(`${currentId} [label="${node.type}${node.name ? `\\n${node.name}` : ''}"];`);
    if (parentId) {
        lines.push(`${parentId} -> ${currentId};`);
    }

    if (node instanceof IfExpression) {
        toDot(node.ifCondition, currentId, lines);
        node.body?.forEach(child => toDot(child, currentId, lines));
        node.elseBlock?.forEach((child: AstTreeNode) => toDot(child, currentId, lines));
    } else if (node.body) {
        node.body.forEach(child => toDot(child, currentId, lines));
    }

    return lines;
}
