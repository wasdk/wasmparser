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

import {
  BinaryReader, BinaryReaderState, SectionCode, IExportEntry, 
  ExternalKind, IFunctionType, IFunctionEntry, IFunctionInformation,
  IImportEntry, IOperatorInformation, Type, OperatorCode, Int64 
} from 'WasmParser';

function binToString(b: Uint8Array) : string {
  // FIXME utf-8
  return String.fromCharCode.apply(null, b);
}

function typeToString(type: number) : string {
  switch (type) {
    case Type.i32: return 'i32';
    case Type.i64: return 'i64';
    case Type.f32: return 'f32';
    case Type.f64: return 'f64';
    default: throw new Error('Unexpected type');
  }
}

export class WasmDisassembler {
  private _buffer: Array<string>;
  private _types: Array<IFunctionType>;
  private _funcIndex: number;
  private _funcTypes: Array<number>;
  private _importCount: number;
  private _indent: string; 

  constructor() {
    this._buffer = [];
    this._types = [];
    this._funcIndex = 0;
    this._funcTypes = [];
    this._importCount = 0;
    this._indent = null;
  }

  private printType(typeIndex: number) : string {
    var type = this._types[typeIndex];
    if (type.form !== Type.func)
      throw new Error('NYI other function form');
    return `(func${this.printFuncType(type, false)})`;
  }

  private printFuncType(type: IFunctionType, printVars: boolean) : string {
    var result = [];
    if (printVars) {
      for (var i = 0; i < type.params.length; i++)
        result.push(` (param $var${i} ${typeToString(type.params[i])})`);
    } else if (type.params.length > 0) {
      result.push(' (params');
      for (var i = 0; i < type.params.length; i++)
        result.push(' ', typeToString(type.params[i]));
      result.push(')');
    }
    for (var i = 0; i < type.returns.length; i++) {
      result.push(` (return ${typeToString(type.returns[i])})`);
    }
    return result.join('');
  }

  private increaseIndent() : void {
    this._indent += '  ';
  }

  private decreaseIndent() : void {
    this._indent = this._indent.slice(0, -2);
  }

  public disassemble(reader: BinaryReader) : string {
    while (true) {
      if (!reader.read())
        return null;
      switch (reader.state) {
        case BinaryReaderState.END_WASM:
          this._buffer.push(')\n');
          return this._buffer.join('');
        case BinaryReaderState.ERROR:
          throw reader.error;
        case BinaryReaderState.BEGIN_WASM:
          this._buffer.push('(module\n');
          break;
        case BinaryReaderState.END_SECTION:
          break;
        case BinaryReaderState.BEGIN_SECTION:
          switch (reader.currentSection.id) {
            case SectionCode.Type:
            case SectionCode.Import:
            case SectionCode.Export:
            case SectionCode.Function:
            case SectionCode.Code:
              break; // reading known section;
            default:
              reader.skipSection();
              break;
          }
          break;
        case BinaryReaderState.EXPORT_SECTION_ENTRY:
          var exportInfo = <IExportEntry>reader.result;
          switch (exportInfo.kind) {
            case ExternalKind.Function:
              this._buffer.push(`  (export "${binToString(exportInfo.field)}" $func${exportInfo.index})\n`);
              break;
            case ExternalKind.Memory:
              this._buffer.push(`  (export "memory" memory)\n`);
              break;
            default:
              throw new Error('Unsupported export');
          }
          break;
        case BinaryReaderState.IMPORT_SECTION_ENTRY:
          var importInfo = <IImportEntry>reader.result;
          if (importInfo.kind != ExternalKind.Function)
            throw new Error('NYI other import types');
          this._importCount++;
          break;
        case BinaryReaderState.TYPE_SECTION_ENTRY:
          var funcType = <IFunctionType>reader.result;
          var typeIndex = this._types.length;
          this._types.push(funcType);
          this._buffer.push(`  (type $type${typeIndex} ${this.printType(typeIndex)})\n`);
          break;
        case BinaryReaderState.FUNCTION_SECTION_ENTRY:
          this._funcTypes.push((<IFunctionEntry>reader.result).typeIndex);
          break;    
        case BinaryReaderState.BEGIN_FUNCTION_BODY:
          var func = reader.currentFunction;
          var type = this._types[this._funcTypes[this._funcIndex]];
          var printIndex = this._funcIndex + this._importCount;
          this._buffer.push(`  (func $func${printIndex}${this.printFuncType(type, true)}\n`);
          var localIndex = type.params.length;
          for (var l of func.locals) {
            for (var i = 0; i < l.count; i++) {
              this._buffer.push(`    (local $var${localIndex++})\n`);  
            }
          }
          this._funcIndex++;
          this._indent = '    ';
          break;
        case BinaryReaderState.CODE_OPERATOR:
          var operator = <IOperatorInformation>reader.result;
          switch (operator.code) {
            case OperatorCode.end:
            case OperatorCode.else:
              this.decreaseIndent();
              break;
          }
          var str = OperatorCode[operator.code].replace(/^([if](32|64))_/, "$1.").replace(/_([if](32|64))$/, "\/$1");
          this._buffer.push(this._indent, str);
          if (operator.localIndex !== undefined) {
            this._buffer.push(` $var${operator.localIndex}`);
          }
          if (operator.funcIndex !== undefined) {
            this._buffer.push(` $func${operator.funcIndex}`);
          }
          if (operator.brDepth !== undefined) {
            this._buffer.push(` ${operator.brDepth}`);
          }
          if (operator.literal !== undefined) {
            switch (operator.code) {
              case OperatorCode.i32_const:  
              case OperatorCode.f32_const:  
              case OperatorCode.f64_const:
                this._buffer.push(` ${(<number>operator.literal).toString()}`);
                break;  
              case OperatorCode.i64_const:
                this._buffer.push(` ${(<Int64>operator.literal).toDouble()}`);
                break;  
            }
          }
          // TODO brTable, globalIndex, memory
          this._buffer.push('\n');
          switch (operator.code) {
            case OperatorCode.if:
            case OperatorCode.block:
            case OperatorCode.loop:
            case OperatorCode.else:
              this.increaseIndent();
              break;
          }
          break; 
        case BinaryReaderState.END_FUNCTION_BODY:
          this._buffer.push(`  )\n`);
          break;
        
        default:
          throw new Error(`Expectected state: ${reader.state}`);
      }
    } 
  }
}