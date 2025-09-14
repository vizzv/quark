import {AstTreeNode} from "../frontend/abstractSyntaxTree"

export class Generator {
	platform = process.platform;
	registerSize:number;
	constructor(_registerSize:number=4) {
		this.registerSize = _registerSize;
	}
	 generate=(tree:AstTreeNode):string=>
	{
		var instructions:string = ""

		var currentNode:AstTreeNode|null=tree;
		var endOfInstructions:string="";
		    if (process.platform === "linux") {
      endOfInstructions += "    mov rax, 60\n"; // syscall: exit
      endOfInstructions += "    xor rdi, rdi\n"; // status = 0
      endOfInstructions += "    syscall\n";
    } else if (process.platform === "win32") {
      endOfInstructions += "    ret\n"; // until you add ExitProcess
    }
		if(currentNode.type === "Program")
		{
			   if (this.platform === "win32") instructions += "format PE console\n";
			   if(this.platform === "linux") instructions += "format ELF64 executable\n";
			   if(this.platform === "darwin") instructions += "format MACHO64 x86-64\n";

				//instructions += "segment readable writeable\n\n";
				instructions += "entry start\n\n";
				if(this.platform === "win32") instructions += "section '.text' code readable executable\n\n";
				//if(this.platform === "linux") instructions += "section '.text' executable\n\n";
				instructions += "start:\n";
					}
		else if(currentNode.type === "VariableDeclaration"){
			//TODO : SUPPORT FOR VARIABE DECLARATION

			instructions += `    ; Variable Declaration of type ${currentNode.varType} with identifier ${currentNode.identifier}\n`;
		}
		else{
			instructions += `    ; Unhandled node type: ${currentNode.type}\n`;
		}
		if(!tree.body || tree.body.length===0)
		{
			return instructions;
		}
		for(var i=0;i<tree.body.length;i++)
		{
			currentNode=tree.body[i];
			instructions += this.generate(currentNode as AstTreeNode);
		}
		if(tree.type==="Program")
		{
			instructions += endOfInstructions;
		}
		return instructions;
	}
}
