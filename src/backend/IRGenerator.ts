import { AstNode, EofNode, ExitStatement, ProgramNode } from "../frontend/abstractSyntaxTree";

export class IRGenerator {
    instructions: string[];
    constructor() {
        this.instructions = [];
    }

    addInstruction(instruction: string) {
        this.instructions.push(instruction);
    }

    getInstructions(): string[] {
        return this.instructions;
    }

    getInstructionAtIndex(index: number): string | null {
        if (index < 0 || index >= this.instructions.length) {
            return null;
        }
        return this.instructions[index];
    }

    clearInstructions() {
        this.instructions = [];
    }

    generateIrFromAst(ast: AstNode) {
        var current = ast;
        console.log("Generating IR for node type:",typeof ast, ast);
        if(ast instanceof ProgramNode)
        {
            for(let node of ast.body)
            {
                this.generateIrFromAst(node);
            }
        }
        else if(ast instanceof ExitStatement)
        {
            var val = ast?.body?.[0];
            this.addInstruction(`EXIT ${val?.value}`);
            
        }
       else if(ast instanceof EofNode)
       {
        return;
       }

    }
}