const precedence : Map<string, number> = new Map<string, number>(
    [["/", 4],
    ["*",4],
    ["-",3],
    ["+",3],
    ]
);

const associativity : Map<string, string> = new Map<string, string>(
    [["/", "Left"],
    ["*", "Left"],
    ["-", "Left"],
    ["+", "Left"],
    ]
);

export const getPrecedence = (op: string) : number => {
    return precedence.get(op) ?? 0;
}

export const getAssociativity = (op: string) : string => {
    return associativity.get(op) ?? "Left";
}
