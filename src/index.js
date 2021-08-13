const { conditionalOutput } = require("./output");
const { foo } = require("./foo");
const { HELLO, WORLD } = require("./constants");

conditionalOutput(`${HELLO} ${WORLD}`);
