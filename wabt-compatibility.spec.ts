/* Copyright 2016 Mozilla Foundation
 * Copyright 2019 Google LLC
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

import { readdirSync, readFileSync } from "fs";
import { extname, join } from "path";
const { parseWat } = require("wabt")();

const TEST_FOLDER = "./test";

const INCOMPATIBLE_FILE_NAMES = [
  "atomic.1.wasm.out",
  "spec.wasm.out",
  "threads.0.wasm.out",
];

// This dict is used to select corresponding feature flags for corresponding files.
const FEATURE_FLAGS_FOR_FILES = {
  "return_call_indirect.wast.0.wasm.out": {
    tail_call: true,
  },
  "return_call_indirect.wast.1.wasm.out": {
    tail_call: true,
  },
  "return_call_indirect.wast.2.wasm.out": {
    tail_call: true,
  },
  "return_call.wast.0.wasm.out": {
    tail_call: true,
  },
  "return_call.wast.1.wasm.out": {
    tail_call: true,
  },
  "conversion_sat.wasm.out": {
    sat_float_to_int: true,
  },
  "ref_types.0.wasm.out": {
    reference_types: true,
  },
  "simd.wasm.out": {
    simd: true,
  },
  "memory_bulk.0.wasm.out": {
    bulk_memory: true,
  },
};

// Run wabt over .out files.
readdirSync(TEST_FOLDER)
  .filter(
    (fileName) =>
      extname(fileName) === ".out" &&
      INCOMPATIBLE_FILE_NAMES.indexOf(fileName) === -1
  )
  .forEach((fileName) => {
    test(`wabt ${fileName}`, () => {
      const filePath = join(TEST_FOLDER, fileName);
      const data = new Uint8Array(readFileSync(filePath));
      // Always turn on 'threads' flag.
      const feature = { threads: true, ...FEATURE_FLAGS_FOR_FILES[fileName] };
      expect(parseWat(fileName, data, feature)).toBeDefined();
    });
  });
