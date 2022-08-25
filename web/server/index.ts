// @ts-ignore
import babel = require("@babel/register");
({
  presets: ["@babel/preset-env"],
  ignore: ["node_modules"],
});

export default require("./server");
