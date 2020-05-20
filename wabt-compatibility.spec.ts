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

import { readdirSync, readFileSync }  from 'fs';
import { extname, join } from 'path';
const { parseWat } = require("wabt")();

const TEST_FOLDER = "./test";

const INCOMPATIBLE_FILE_NAMES = [
  "atomic.0.wasm.out",
  "conversion_sat.wasm.out",
  "memory_bulk.0.wasm.out",
  "ref_types.0.wasm.out",
  "return_call_indirect.wast.0.wasm.out",
  "return_call_indirect.wast.1.wasm.out",
  "return_call_indirect.wast.2.wasm.out",
  "return_call.wast.0.wasm.out",
  "return_call.wast.1.wasm.out",
  "simd.wasm.out",
  "spec.wasm.out",
  "threads.0.wasm.out",
];

// This dict is used to select corresponding feature flags for corresponding files.
const FEATURE_FLAGS_FOR_FILES = {
  'atomic.1.wasm.out': {
    'threads': true,
  },
};

// Run wabt over .out files.
readdirSync(TEST_FOLDER)
  .filter(fileName => extname(fileName) === ".out" && INCOMPATIBLE_FILE_NAMES.indexOf(fileName) === -1)
  .forEach(fileName => {
    test(`wabt ${fileName}`, () => {
      const filePath = join(TEST_FOLDER, fileName);
      let data = new Uint8Array(readFileSync(filePath));
      const feature = FEATURE_FLAGS_FOR_FILES[fileName] || {};
      expect(parseWat(fileName, data, feature)).toBeDefined();
    });
  });


