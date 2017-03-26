#!/usr/bin/env node
/* Copyright 2016 Mozilla Foundation
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

var fs = require('fs');
var path = require('path');
var wasmparser = require('./dist/WasmParser.js');
var wasmdis = require('./dist/WasmDis.js');

const testFolder = './test/core';
let failCount = 0;
let passCount = 0;

var update = process.argv[2] == "update";

let files = fs.readdirSync(testFolder);
files.forEach(file => {
  file = path.join(testFolder, file);
  if (path.extname(file) === ".wasm") {
    console.log(`Testing ${file}`);
    let dis = new wasmdis.WasmDisassembler();
    let data = new Uint8Array(fs.readFileSync(file));
    let parser = new wasmparser.BinaryReader(data);
    parser.setData(data.buffer, 0, data.length);
    let out = dis.disassemble(parser);
    let outFile = path.join(path.dirname(file), path.basename(file, ".wasm") + ".wasm.out");
    if (update) {
      fs.writeFileSync(outFile, out, 'utf8');
    } else {
      let outFileData = fs.readFileSync(outFile, 'utf8');
      if (out != outFileData) {
        failCount++;
      } else {
        passCount++;
      }
    }
  }
});

process.exit(failCount);
