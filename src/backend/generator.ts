import chalk from "chalk"
import { ASTNodeType, AstTreeNode } from "../frontend/abstractSyntaxTree"

export class MSILGenerator {
  private localIndex = 0
  private locals: string[] = []

  generate = (tree: AstTreeNode): string => {
    //console.log("Generating IL for node type:", tree.type)
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
    else if (tree.type === "identifier") {
      const varName = tree.value as string
      const varIndex = this.locals.findIndex(local => local.endsWith(` ${varName}`))
      if (varIndex === -1) {
        throw new Error(`Variable ${varName} not found for usage.`)
      }
      il += `    ldloc.${varIndex}\n`  // load variable onto stack
    }
    else if (tree.type === "VariableReassignment") {
      const varName = tree.identifier
      const varIndex = this.locals.findIndex(local => local.endsWith(` ${varName}`))
      if (varIndex === -1) {
        throw new Error(`Variable ${varName} not found for reassignment.`)
      }

      if (tree.value) {
        let exprIL = this.generate(tree.value)   // generate IL for the new value
        il += exprIL
        il += `    stloc.${varIndex}\n`  // store the new value in the variable
      }
    }
    else if (tree.type === "BinaryExpression") {
      if (tree.left) {
        il += this.generate(tree.left)
      }
      if (tree.right) {
        il += this.generate(tree.right)
      }
      if (tree.operator === "+") {
        il += `    add\n`
      } else if (tree.operator === "-") {
        il += `    sub\n`
      } else if (tree.operator === "*") {
        il += `    mul\n`
      } else if (tree.operator === "/") {
        il += `    div\n`
      }

      // if(tree.left.type as ASTNodeType === "identifier") {
      //   const varName = tree.left.value as string
      //   const varIndex = this.locals.findIndex(local => local.endsWith(` ${varName}`))
      //   if (varIndex === -1) {
      //     console.log(tree)
      //     throw new Error(`Variable ${varName} not found for usage.`)
      //   }
      //   il += `    stloc.${varIndex}\n`  // load variable onto stack
      // }


    }

    else if (tree.type === "NumberLiteral") {
      il += `    ldc.i4.s ${tree.value}\n`   // push value onto stack
    }

    else if (tree.type === "BoolLiteral") {
      il += `    ldc.i4.${tree.value ? "1" : "0"}\n`
    }

    else if (tree.type === "TextLiteral") {
      il += `    ldstr "${tree.value}"\n`
    }
    else {
      throw new Error(`Unhandled AST node type in IL generation: ${tree.type}`);
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

      il += "     ldloc.0\ncall void [System.Console]System.Console::WriteLine(int32)\n  ret\n}\n"
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

