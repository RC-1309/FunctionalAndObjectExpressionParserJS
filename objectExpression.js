function CustomError(name, message) {
    this.message = message;
    this.name = name;
}
CustomError.prototype = Object.create(Error.prototype);

function IncorrectConstError(message) {
    CustomError.call(this, "IncorrectConstError", message);
}

function Const(value) {
    if (Number.isNaN(value)) {
        throw new IncorrectConstError("Incorrect const: " + value);
    }
    this.value = value;
    this.evaluate = () => this.value;
    this.toString = () => String(this.value);
    this.prefix = () => String(this.value);
    this.postfix = () => String(this.value);
    this.diff = () => zero;
}

function IncorrectVariableError(message) {
    CustomError.call(this, "IncorrectVariableError", message);
}

const variables = new Map([
    ["x", 0],
    ["y", 1],
    ["z", 2]
]);
function IncorrectNumberOfExpressionError(message) {
    CustomError.call(this, "IncorrectNumberOfExpressionError", message);
}

function Variable(value) {
    if (!variables.has(value)) {
        throw new IncorrectVariableError("Incorrect variable: " + value);
    }
    this.value = value;
    this.evaluate = (...args) => args[variables.get(this.value)];
    this.toString = () => this.value;
    this.prefix = () => this.value;
    this.postfix = () => this.value;
    this.diff = (variable) => variable === this.value ? one : zero;
}

function IllegalArgumentError(message) {
    CustomError.call(this, "IllegalArgumentError", message);
}

let operations;
function Operation(operation, calc, dif, numberOfArgs, ...expressions) {
    this.expressions = expressions;
    this.getOperation = () => operation;
    this.numberOfArgs = () => numberOfArgs;
    this.calculate = calc;
    this.diff = dif;
    this.toString = function() {
        return `${[...this.expressions].join(" ")} ${this.getOperation()}`;
    }
    this.prefix = function() {
        return `(${this.getOperation()} ${[...this.expressions].map((a) => a.prefix()).join(" ")})`;
    }
    this.postfix = function() {
        return `(${[...this.expressions].map((a) => a.postfix()).join(" ")} ${this.getOperation()})`;
    }
    this.evaluate = function(x, y, z) {
        return this.calculate(...this.expressions.map((a) => a.evaluate(x, y, z)));
    }
    this.checkArgs = function (pos) {
        if (this.numberOfArgs() !== this.expressions.length) {
            throw new IncorrectNumberOfExpressionError(makeMessage("Incorrect number of expression in " + this.getOperation() +
                ", expected: " + this.numberOfArgs() + ", actual: " + this.expressions.length, pos));
        }
        for (let arg of this.expressions) {
            if (operations.has(arg)) {
                throw new IllegalArgumentError(makeMessage("Illegal argument error: " + arg, pos));
            }
        }
    }
}

function Add(...expressions) {
    Operation.call(this, "+", (left, right) => left + right,
        (variable) => new Add(this.expressions[0].diff(variable), this.expressions[1].diff(variable)), 2, ...expressions);
}

function Subtract(...expressions) {
    Operation.call(this, "-", (left, right) => left - right,
        (variable) => new Subtract(this.expressions[0].diff(variable), this.expressions[1].diff(variable)), 2, ...expressions);
}

function Multiply(...expressions) {
    Operation.call(this, "*", (left, right) => left * right,
        (variable) => new Add(new Multiply(this.expressions[0].diff(variable), this.expressions[1]),
            new Multiply(this.expressions[0], this.expressions[1].diff(variable))), 2, ...expressions);
}

function Divide(...expressions) {
    Operation.call(this, "/", (left, right) => left / right,
        (variable) => new Divide(new Subtract(new Multiply(this.expressions[0].diff(variable), this.expressions[1]),
                new Multiply(this.expressions[0], this.expressions[1].diff(variable))),
            new Multiply(this.expressions[1], this.expressions[1])), 2, ...expressions);
}

function Negate(...expressions) {
    Operation.call(this, "negate", (expr) => -expr,
        (variable) => new Negate(this.expressions[0].diff(variable)), 1, ...expressions);
}

const sumOfTheInverse = (...args) => [...args].reduce((init, cur) => init + 1 / cur, 0);
const zero = new Const(0);
const one = new Const(1);
const two = new Const(2);

function SumRecN(...expressions) {
    Operation.call(this, "sumrec" + expressions.length,
        (...args) => sumOfTheInverse(...args),
        (variable) => [...expressions].reduce((init, cur) =>
            new Add(init, new Divide(one, cur).diff(variable)), zero), expressions.length, ...expressions);
}

const Sumrec2 = SumRecN;
const Sumrec3 = SumRecN;
const Sumrec4 = SumRecN;
const Sumrec5 = SumRecN;

function HMeanN(...expressions) {
    Operation.call(this, "hmean" + expressions.length,
        (...args) => expressions.length / sumOfTheInverse(...args),
        (variable) => new Divide(new Const(expressions.length), new SumRecN(...expressions)).diff(variable),
        expressions.length, ...expressions);
}

const HMean2 = HMeanN;
const HMean3 = HMeanN;
const HMean4 = HMeanN;
const HMean5 = HMeanN;

const sumOfTheSquare = (...args) => [...args].reduce((init, cur) => init + cur * cur, 0) / args.length;

function Meansq(...expressions) {
    Operation.call(this, "meansq", (...args) => sumOfTheSquare(...args),
        (variable) => new Divide([...expressions].reduce((init, cur) =>
            new Add(init, new Multiply(cur, cur)), zero), new Const(expressions.length)).diff(variable),
        expressions.length, ...expressions);
}

function RMS(...expressions) {
    Operation.call(this, "rms", (...args) =>  Math.sqrt(sumOfTheSquare(...args)),
        (variable) => new Multiply(new Divide(new Const(1), new Multiply(two,
            this)), new Meansq(...expressions).diff(variable)), expressions.length, ...expressions);
}

operations = new Map([
    ["+", [Add, 2]],
    ["-", [Subtract, 2]],
    ["*", [Multiply, 2]],
    ["/", [Divide, 2]],
    ["negate", [Negate, 1]],
    ["sumrec", [SumRecN, 5]],
    ["hmean", [HMeanN, 5]],
    ["meansq", [Meansq, 4]],
    ["rms", [RMS, 4]]
]);

const unusualOperation = new Map([
    ["sumrec", SumRecN],
    ["hmean", HMeanN]
])
const check = (symbol) => operations.has(symbol) || unusualOperation.has(symbol.slice(0, -1));
const get = (symbol) => {
    if (operations.has(symbol)) {
        return operations.get(symbol);
    }
    return [unusualOperation.get(symbol.slice(0, -1)), Number(symbol.at(-1))];
}

function parse(line) {
    let answer = [];
    for (const symbol of line.trim().split(/\s+/)) {
        if (check(symbol)) {
            let op = get(symbol);
            answer.push(new op[0](...answer.splice(-op[1])));
        } else if (symbol === 'x' || symbol === 'y' || symbol === 'z') {
            answer.push(new Variable(symbol));
        } else {
            answer.push(new Const(Number(symbol)));
        }
    }
    return answer[0];
}

function IncorrectOperationError(message) {
    CustomError.call(this, "IncorrectOperationError", message);
}

function IncorrectNumberOfBracketError(message) {
    CustomError.call(this, "IncorrectNumberOfBracketError", message);
}

const types = new Map([
    ["prefix", 0],
    ["postfix", -1]
])

function makeMessage(message, pos) {
    return "Pos: " + pos + ". " + message;
}

function parseWithBracket(type, line) {
    let pos = types.get(type);
    const answer = [];
    const array = line.split(/(\()|(\))|\s+/).filter(Boolean);
    if (array.length === 0) {
        throw new IncorrectNumberOfExpressionError("Empty input");
    }
    let posToken = 0;
    for (const symbol of array) {
        if (symbol === '(' || operations.has(symbol)) {
            answer.push(symbol);
        } else if (symbol === ')') {
            let expression = [];
            while (answer.length > 0 && answer.at(-1) !== '(') {
                expression.unshift(answer.pop());
            }
            if (answer.length === 0) {
                throw new IncorrectNumberOfBracketError(makeMessage("Cannot find open bracket", posToken));
            }
            if (expression.length === 0) {
                throw new IncorrectNumberOfExpressionError(makeMessage("Incorrect number of expressions", posToken));
            }
            let op = expression.splice(pos, 1);
            if (operations.has(...op)) {
                op = operations.get(...op);
                answer.pop();
                let operation = new op[0](...expression);
                operation.checkArgs(posToken);
                answer.push(operation);
            } else {
                throw new IncorrectOperationError(makeMessage("Incorrect operation: " + op, posToken));
            }
        } else if (variables.has(symbol)) {
            answer.push(new Variable(symbol));
        } else if (!Number.isNaN(Number(symbol))) {
            answer.push(new Const(Number(symbol)));
        } else {
            throw new IncorrectOperationError(makeMessage("Incorrect operation: " + symbol, posToken));
        }
        posToken++;
    }
    if (answer[0] === '(') {
        throw new IncorrectNumberOfBracketError(makeMessage("Missing ')'", posToken));
    }
    if (answer.length !== 1) {
        throw new IncorrectNumberOfExpressionError("Excessive info, found extra expression");
    }
    return answer[0];
}

function parsePrefix(line) {
    return parseWithBracket("prefix", line);
}

function parsePostfix(line) {
    return parseWithBracket("postfix", line);
}
