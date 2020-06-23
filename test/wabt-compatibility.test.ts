/* Copyright 2016 Mozilla Foundation
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import { readFileSync } from "fs";
import { WasmDisassembler } from "../src/WasmDis";
import { BinaryReader } from "../src/WasmParser";
import { getWasmFixtures } from "./utils";
const { parseWat } = require("wabt")();

const WABT_FEATURES = {
  bulk_memory: true,
  reference_types: true,
  sign_extension: true,
  simd: true,
  sat_float_to_int: true,
  tail_call: true,
  threads: true,
};

describe("Disassembling", () => {
  describe.each(getWasmFixtures())("%s", (fileName, filePath) => {
    test("generates wabt compatible text", () => {
      // TODO(bmeurer): We need to update wabt here.
      if (fileName === "atomic.1.wasm" || fileName === "threads.0.wasm") return;
      const data = new Uint8Array(readFileSync(filePath));
      const dis = new WasmDisassembler();
      const parser = new BinaryReader();
      parser.setData(data.buffer, 0, data.length);
      const text = dis.disassemble(parser);
      expect(parseWat(fileName, text, WABT_FEATURES)).toBeDefined();
    });
  });
});
