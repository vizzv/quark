type SymbolTableEntryType = "number" | "text" | "bool";

interface SymbolTableEntry {
  name: string;
  type: SymbolTableEntryType;
}

export class SymbolTable {
  private static table: Map<string, SymbolTableEntry> = new Map<string, SymbolTableEntry>();

  constructor() {
    SymbolTable.table = new Map<string, SymbolTableEntry>();
  }

  static addEntry(name: string, type: SymbolTableEntryType): void {
    if (SymbolTable.table.has(name)) {
      throw new Error(`Symbol ${name} already exists in the symbol table.`);
    }
    SymbolTable.table.set(name, { name, type });
  }

  static getEntry(name: string): SymbolTableEntry | undefined {
    return SymbolTable.table.get(name);
  }

  static hasEntry(name: string): boolean {
    return SymbolTable.table.has(name);
  }
  static editEntry(name: string, newType: SymbolTableEntryType): void {
    if (!SymbolTable.table.has(name)) {
      throw new Error(`Symbol ${name} does not exist in the symbol table.`);
    }
    SymbolTable.table.set(name, { name, type: newType });
  }
  static removeEntry(name: string): void {
    if (!SymbolTable.table.has(name)) {
      throw new Error(`Symbol ${name} does not exist in the symbol table.`);
    }
    SymbolTable.table.delete(name);
  }
}