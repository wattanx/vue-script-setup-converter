import { it } from "vitest";
import { convertSrc } from "./converter";
import optionsApi from "../assets/template/composition-api.txt?raw";

it("converter", () => {
  const output = convertSrc(optionsApi);
  console.log(output);
});
