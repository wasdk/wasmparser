/* Copyright 2020 Google LLC
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
import { getWasmFixtures } from "./utils";
import { WasmDisassembler } from "../src/WasmDis";
import { BinaryReader } from "../src/WasmParser";

function disassemble(data: Uint8Array): string {
  const dis = new WasmDisassembler();
  const parser = new BinaryReader();
  parser.setData(data.buffer, 0, data.length);
  return dis.disassemble(parser);
}

function disassembleInChunks(data: Uint8Array, chunkSize: number): string {
  const dis = new WasmDisassembler();
  const parser = new BinaryReader();

  // Buffer to hold pending data.
  var lines = [];
  var buffer = new Uint8Array(chunkSize);
  var pendingSize = 0;
  var offsetInModule = 0;
  for (var i = 0; i < data.length; ) {
    if (chunkSize > data.length - i) {
      chunkSize = data.length - i;
    }
    var bufferSize = pendingSize + chunkSize;
    if (buffer.byteLength < bufferSize) {
      var newBuffer = new Uint8Array(bufferSize);
      newBuffer.set(buffer);
      buffer = newBuffer;
    }
    while (pendingSize < bufferSize) {
      buffer[pendingSize++] = data[i++];
    }

    // Setting parser buffer and signaling it's not complete.
    var done = i == data.length;
    parser.setData(buffer.buffer, 0, bufferSize, done);

    // The disassemble will attemp to fetch the data as much as possible.
    var finished = dis.disassembleChunk(parser, offsetInModule);
    expect(finished).toBe(done);

    var result = dis.getResult();
    for (const line of result.lines) {
      lines.push(line);
    }

    if (parser.position == 0) {
      // Parser did not consume anything.
      pendingSize = bufferSize;
      continue;
    }
    // Shift the data to the beginning of the buffer.
    var pending = parser.data.subarray(parser.position, parser.length);
    pendingSize = pending.length;
    buffer.set(pending);
    offsetInModule += parser.position;
  }

  lines.push("");
  return lines.join("\n");
}

const CHUNK_SIZES = [1, 5];

describe("Disassembling", () => {
  describe.each(getWasmFixtures())("%s", (fileName, filePath) => {
    test.each(CHUNK_SIZES)(
      "in chunks of %i bytes generates expected output",
      (chunkSize) => {
        const data = new Uint8Array(readFileSync(filePath));
        const fullText = disassemble(data);
        const text = disassembleInChunks(data, chunkSize);
        expect(text).toBe(fullText);
      }
    );
  });
});
