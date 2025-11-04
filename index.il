.assembly ToyProgram {}
.method static void main() cil managed
{
  .entrypoint
  .locals init (
    [0] int32 age,
    [1] int32 maxAge
  )
  .maxstack 8
    ldc.i4.s 7
    stloc.0
    ldc.i4.s 8
    stloc.1
    ldc.i4.s 25
    ldc.i4.s 2
    ldc.i4.s 42
    ldc.i4.s 6
    div
    sub
    mul
    ldc.i4.s 18
    add
    stloc.0
     ldloc.0
call void [System.Console]System.Console::WriteLine(int32)
  ret
}
