.assembly ToyProgram {}
.method static void main() cil managed
{
  .entrypoint
  .locals init (
    [0] int32 age,
    [1] bool isMature,
    [2] string xyz
  )
  .maxstack 8
    ldc.i4.s 22
    stloc.0
    ldc.i4.1
    stloc.1
    ldstr "lol"
    stloc.2
    ldloc.0
    call void [System.Console]System.Console::WriteLine(int32)

    ldloc.1
    call void [System.Console]System.Console::WriteLine(bool)
    ldloc.2
    call void [System.Console]System.Console::WriteLine(string)
  ret
}
