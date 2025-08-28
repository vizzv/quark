export class Runner
{
    instructions:string[];
    constructor(insturction:string[])
    {
        this.instructions = insturction;
    }
    run()
    {
        for(let inst of this.instructions)
        {
            const parts = inst.split(' ');
            const command = parts[0];
            switch(command)
            {
                case 'EXIT':
                    const code = parts[1] || '0';
                    process.exit(parseInt(code));
                    break;
                default:
                    console.log(`Unknown instruction: ${inst}`);
            }
        }
    }
}