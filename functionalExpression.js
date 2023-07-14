const operation = f => (...arr) => (x, y, z) => f(...arr.map(a => a(x, y, z)));
const add = operation((a, b) => a + b);
const subtract = operation((a, b) => a - b);
const multiply = operation((a, b) => a * b);
const divide = operation((a, b) => a / b);
const argMin3 = operation((...args) => args.indexOf(Math.min(...args)));
const argMin5 = argMin3;
const argMax3 = operation((...args) => args.indexOf(Math.max(...args)));
const argMax5 = argMax3;
const negate = operation((a) => -a);
const cnst = a => () => a;
const one = cnst(1);
const two = cnst(2);
const pair = (operation, numberOfExpressions) => (pos) => pos === 0 ? operation : numberOfExpressions;

const variables = new Map([
    ["x", 0],
    ["y", 1],
    ["z", 2]
]);
const variable = a => (...args) => args[variables.get(a)];

const numbers = new Map([
    ["one", one],
    ["two", two]
]);

const operations = new Map([
    ["+", pair(add, 2)],
    ["-", pair(subtract, 2)],
    ["*", pair(multiply, 2)],
    ["/", pair(divide, 2)],
    ["negate", pair(negate, 1)],
    ["argMin5", pair(argMin5, 5)],
    ["argMin3", pair(argMin3, 3)],
    ["argMax5", pair(argMax5, 5)],
    ["argMax3", pair(argMax3, 3)]
]);

function parse(line) {
    let answer = [];
    for (const symbol of line.trim().split(/\s+/)) {
        if (operations.has(symbol)) {
            let op = operations.get(symbol);
            answer.push(op(0)(...answer.splice(-op(1))));
        } else if (numbers.has(symbol)) {
            answer.push(numbers.get(symbol));
        } else if (variables.has(symbol)) {
            answer.push(variable(symbol));
        } else {
            answer.push(cnst(Number(symbol)));
        }
    }
    return answer[0];
}
