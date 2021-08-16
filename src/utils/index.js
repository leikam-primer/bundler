const { NODE_WINDOW_TYPE } = require("../constants");

const isNode = () => typeof window === NODE_WINDOW_TYPE;

module.exports = {
  isNode,
};
