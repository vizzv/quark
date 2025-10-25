import { AstTreeNode } from "../frontend/abstractSyntaxTree"

export class MSILGenerator {
  private localIndex = 0
  private locals: string[] = []

  generate = (tree: AstTreeNode): string => {
    let il = ""

    if (tree.type === "Program") {
      il += ".assembly ToyProgram {}\n"
      il += ".method static void main() cil managed\n{\n"
      il += "  .entrypoint\n"
      il += "  .maxstack 8\n"
      //console.log("Generating IL for node type:", tree)
    }

    // Traverse child nodes


    else if (tree.type === "VariableDeclaration") {
      const varIndex = this.localIndex++
      const ilType = this.mapType(tree.variableType)
      this.locals.push(`    [${varIndex}] ${ilType} ${tree.identifier}`)
      
      if (tree.body && tree.body.length > 0) {
        let exprIL = ""
        for (const node of tree.body) {
          exprIL += this.generate(node)   // generate IL for expressions
        }
        exprIL += `    stloc.${varIndex}\n`
        il += exprIL
      }
    }

    else if (tree.type === "NumberLiteral") {
      il += `    ldc.i4.s ${tree.value}\n`   // push value onto stack
    }

    else if (tree.type === "BoolLiteral") {
      il += `    ldc.i4.${tree.value ? "1" : "0"}\n`
    }

    else if (tree.type === "StringLiteral") {
      il += `    ldstr "${tree.value}"\n`
    }


    //console.log("Current IL:\n", tree.type, "\n", il)
    if (tree.type === "Program") {
      // locals section
      
      if (tree.body) {
        for (const node of tree.body) {
          il += this.generate(node)
        }
      }

      if (this.locals.length > 0) {
        //console.log("Generating locals section")
        const localsDecl = this.locals.join(",\n")
        //console.log("Locals Declaration:\n", localsDecl.split("\n"))
        il = il.replace(
          "{\n  .entrypoint",
          `{\n  .entrypoint\n  .locals init (\n${localsDecl}\n  )`
        )
      }

      il += "  ret\n}\n"
    }

    return il
  }

  private mapType(type: string): string {
    switch (type) {
      case "number":
        return "int32"
      case "bool":
        return "bool"
      case "text":
        return "string"
      default:
        return "object"
    }
  }

}

