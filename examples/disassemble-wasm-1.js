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

// Demo of streaming of the data: it pushes data byte-by-byte to the buffer
// (which is feed to the BinaryReader) and WasmDisassembler attempts to pull
// all available entries from the imcomplete data.
// See also ../disassemble-wasm.js file.

var wasmparser = require('../dist/WasmParser.js');
var wasmdis = require('../dist/WasmDis.js');
var fs = require('fs');

var wasmPath = process.argv[2];
var data = new Uint8Array(fs.readFileSync(wasmPath));

var parser = new wasmparser.BinaryReader();
var dis = new wasmdis.WasmDisassembler();

// Buffer to hold pending data.
var buffer = new Uint8Array(1);
var ensureBufferSize = function (size) {
};
var pendingSize = 0;
for (var i = 0; i < data.length;i++) {
  var nextByte = data[i];
  var bufferSize = pendingSize + 1;
  // Ensure we can fit the next byte.
  if (buffer.byteLength < bufferSize) {
    var newBuffer = new Uint8Array(bufferSize);
    newBuffer.set(buffer);
    buffer = newBuffer;
  }
  // Moving single byte from the input data
  buffer[pendingSize] = nextByte;

  // Setting parser buffer and signaling it's not complete.
  parser.setData(buffer.buffer, 0, bufferSize, false);

  // The disassemble will attemp to fetch the data as much as possible.
  var result = dis.disassemble(parser);
  // The result is null here.

  if (parser.position == 0) {
    // Parser did not consume anything.
    pendingSize = bufferSize;
    continue;
  }
  // Shift the data to the beginning of the buffer.
  var pending = parser.data.subarray(parser.position, parser.length);
  pendingSize = pending.length;
  buffer.set(pending);
}
// Last chunk.
parser.setData(buffer.buffer, 0, pendingSize, true);

// Print the result and stats.
console.log(dis.disassemble(parser));
console.log('Max buffer used: ' + buffer.length);
