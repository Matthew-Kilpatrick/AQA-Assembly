var editor = ace.edit("editor");
editor.setTheme("ace/theme/monokai");
var Range = ace.require('ace/range').Range;
from = 0;
to = 0;
var AUTOSTEP_INTERVAL;
var ASSEMBLY = [];
var INDEX = PREV_INDEX = 0;
var REGISTERS = {0:0, 1:0, 2:0, 3:0, 4:0, 5:0, 6:0, 7:0, 8:0, 9:0, 10:0, 11:0, 12:0};
var MEMORY = {};
var CMP = {'EQ': false, 'NE': false, 'LT': false, 'GT': false};
var PREV_REGISTERS = {};
var PREV_MEMORY = {};
var PREV_HIGHLIGHT = -1;
var PREV_CMP = {};
// Return all lines of editor with whitespace removed
function parseEditor() {
  var linesClean = []
  var lines = editor.getValue().split('\n');
  for (var i = 0; i < lines.length; i++) {
    linesClean.push(lines[i].trim());
  }
  ASSEMBLY = linesClean;
  return linesClean;
}
// Parse a provided operand (determine if it represents a register or decimal value, and return the register content / this value)
function parseOperand(operand) {
  if (operand[0].toUpperCase() === 'R') {
    return REGISTERS[parseRegister(operand)];
  } else if (operand[0] === '#') {
    var int = parseInt(operand.slice(1));
    if (!isNaN(int)) {
      return int;
    } else {
      throw "Invalid operand - value must be an integer";
    }
  } else {
    throw "Invalid operand - must be register (R) or value (#)";
  }
}
// Parse a line, splitting it into its OPCODE and OPERAND
function parseLine(line) {
  var opcode = line.split(' ')[0];
  var operands = line.split(' ').slice(1).join('').split(';')[0].split(','); // split to opcode & operand, ignoring comments
  return [opcode, operands];
}
// Parse register - check if valid (starts with R), and return stripped version or exeception
function parseRegister(register) {
  if (register[0].toUpperCase() === 'R') {
    var registerNumber = register.slice(1);
    if (parseInt(registerNumber) >= 0 && parseInt(registerNumber) <= 12) {
      return registerNumber;
    }
  }
  throw "Invalid register syntax";
}
// Parse label line - find index of label to jump to
function parseLabelLine(label) {
  for (var i = 0; i < ASSEMBLY.length; i++) {
    if (ASSEMBLY[i] == label + ':') {
      return i;
    }
  }
  return -1;
}
// Parse memory - check if memory location valid
function parseMemory(memory) {
  if (!isNaN(parseInt(memory))) {
    return parseInt(memory);
  }
  throw "Memory location is not an integer value";
}
// LDR OPCODE processing
function opLDR(args) {
  if (args.length == 2) {
    var register = parseRegister(args[0]);
    var memory = parseMemory(args[1]);
    REGISTERS[register] = MEMORY[memory];
  } else {
    throw "LDR expects 2 parameters, " + args.length + " provided";
  }
}
// STR OPCODE processing
function opSTR(args) {
  if (args.length == 2) {
    var register = parseRegister(args[0]);
    var memory = parseMemory(args[1]);
    MEMORY[memory] = REGISTERS[register];
  } else {
    throw "STR expects 2 parameters, " + args.length + " provided";
  }
}
// ADD OPCODE processing
function opADD(args) {
  if (args.length == 3) {
    var register1 = parseRegister(args[0]);
    var register2 = parseRegister(args[1]);
    var operand = parseOperand(args[2]);
    REGISTERS[register1] = REGISTERS[register2] + operand;
  } else {
    throw "ADD expects 3 parameters, " + args.length + " provided";
  }
}
// SUB OPCODE processing
function opSUB(args) {
  if (args.length == 3) {
    var register1 = parseRegister(args[0]);
    var register2 = parseRegister(args[1]);
    var operand = parseOperand(args[2]);
    REGISTERS[register1] = REGISTERS[register2] - operand;
  } else {
    throw "SUB expects 3 parameters, " + args.length + " provided";
  }
}
// MOV OPCODE processing
function opMOV(args) {
  if (args.length == 2) {
    var register = parseRegister(args[0]);
    var operand = parseOperand(args[1]);
    REGISTERS[register] = operand;
  } else {
    throw "MOV expects 2 parameters, " + args.length + " provided";
  }
}
// CMP OPCODE processing
function opCMP(args) {
  if (args.length == 2) {
    var register = parseRegister(args[0]);
    var operand = parseOperand(args[1]);
    CMP['EQ'] = false;
    CMP['NE'] = false;
    CMP['GT'] = false;
    CMP['LT'] = false;
    if (REGISTERS[register] == operand) {
      CMP['EQ'] = true;
    } else if (REGISTERS[register] > operand) {
      CMP['GT'] = true;
      CMP['NE'] = true;
    } else if (REGISTERS[register] < operand) {
      CMP['LT'] = true;
      CMP['NE'] = true;
    }
  } else {
    throw "CMP expects 2 parameters, " + args.length + " provided";
  }
}
// B OPCODE processing
// AND OPCODE processing
function opAND(args) {
  if (args.length == 3) {
    var register1 = parseRegister(args[0]);
    var register2 = parseRegister(args[1]);
    var operand = parseOperand(args[2]);
    REGISTERS[register1] = REGISTERS[register2] & operand;
  } else {
    throw "AND expects 3 parameters, " + args.length + " provided";
  }
}
// ORR OPCODE processing
function opORR(args) {
  if (args.length == 3) {
    var register1 = parseRegister(args[0]);
    var register2 = parseRegister(args[1]);
    var operand = parseOperand(args[2]);
    REGISTERS[register1] = REGISTERS[register2] | operand;
  } else {
    throw "ORR expects 3 parameters, " + args.length + " provided";
  }
}
// EOR OPCODE processing
function opEOR(args) {
  if (args.length == 3) {
    var register1 = parseRegister(args[0]);
    var register2 = parseRegister(args[1]);
    var operand = parseOperand(args[2]);
    REGISTERS[register1] = REGISTERS[register2] ^ operand;
  } else {
    throw "EOR expects 3 parameters, " + args.length + " provided";
  }
}
// MVN OPCODE processing
function opMVN(args) {
  if (args.length == 2) {
    var register = parseRegister(args[0]);
    var operand = parseOperand(args[1]);
    REGISTERS[register] = ~ operand;
  } else {
    throw "MVN expects 2 parameters, " + args.length + " provided";
  }
}
// LSL OPCODE processing
function opLSL(args) {
  if (args.length == 3) {
    var register1 = parseRegister(args[0]);
    var register2 = parseRegister(args[1]);
    var operand = parseOperand(args[2]);
    REGISTERS[register1] = REGISTERS[register2] << operand;
  } else {
    throw "LSL expects 3 parameters, " + args.length + " provided";
  }
}
// LSR OPCODE processing
function opLSR(args) {
  if (args.length == 3) {
    var register1 = parseRegister(args[0]);
    var register2 = parseRegister(args[1]);
    var operand = parseOperand(args[2]);
    REGISTERS[register1] = REGISTERS[register2] >>> operand;
  } else {
    throw "LSR expects 3 parameters, " + args.length + " provided";
  }
}
// BRANCH OPCODE processing
function opBRANCH(opcode, args) {
  var branchTo = parseLabelLine(args[0]);
  var condition = opcode.slice(1);
  if (condition == '') {
    return branchTo;
  } else if (CMP[condition]) {
    return branchTo;
  }
  return -1;
}
// Autostep function - complete running of program with delays of param delay ms (default 1 sec)
function autoStep(delay=500) {
  var delay = parseInt(delay);
  if (isNaN(delay)) {
    delay = 750;
  }
  AUTOSTEP_INTERVAL = setInterval(autoStepRun, delay);
}
function autoStepRun() {
  if (!stepForward()) {
    clearInterval(AUTOSTEP_INTERVAL);
  }
}
// Step forward function - apply next to run operation
function stepForward() {
  parseEditor();
  editor.session.removeMarker(PREV_HIGHLIGHT);
  if (INDEX >= 0 && INDEX < ASSEMBLY.length) {
    PREV_HIGHLIGHT = editor.session.addMarker(new Range(INDEX, 0, INDEX, 1), "highlightLine", "fullLine");
    var nextIndex = INDEX + 1;
    var line = parseLine(ASSEMBLY[INDEX]);
    var opcode = line[0].toUpperCase();
    var operands = line[1];
    try {
      if (opcode == 'LDR') {
        opLDR(operands);
      } else if (opcode == 'STR') {
        opSTR(operands);
      } else if (opcode == 'ADD') {
        opADD(operands);
      } else if (opcode == 'SUB') {
        opSUB(operands);
      } else if (opcode == 'MOV') {
        opMOV(operands);
      } else if (opcode == 'CMP') {
        opCMP(operands);
        // update comparison table
      } else if (opcode == 'AND') {
        opAND(operands);
      } else if (opcode == 'ORR') {
        opORR(operands);
      } else if (opcode == 'EOR') {
        opEOR(operands);
      } else if (opcode == 'MVN') {
        opMVN(operands);
      } else if (opcode == 'LSL') {
        opLSL(operands);
      } else if (opcode == 'LSR') {
        opLSR(operands);
      } else if (opcode == 'HALT') {
        nextIndex = -1;
      } else if (opcode[0] == 'B') { //branch
        var branchTo = opBRANCH(opcode, operands);
        if (branchTo != -1) {
          nextIndex = branchTo;
        }
      }
    } catch (exception) {
      $('#errors').append('<div class="alert alert-danger alert-dismissible fade show" role="alert">Error on line ' + (INDEX + 1) + ': ' + exception + '<button type="button" class="close" data-dismiss="alert" aria-label="Close"><span aria-hidden="true">&times;</span></button></div>');
    }
    // check for changes in registers / memory & highlight
    updateRegisterTable();
    updateMemoryTable();
    updateComparisonTable();
    // overwrite prev status vals with current
    PREV_INDEX = INDEX;
    INDEX = nextIndex;
    Object.assign(PREV_REGISTERS, REGISTERS);
    Object.assign(PREV_MEMORY, MEMORY);
    Object.assign(PREV_CMP, CMP);
    return true;
  }
  return false;
}
// Update registers table
function updateRegisterTable(noColour) {
  for (var i = 0; i <= 12; i++) {
    if (REGISTERS[i] != PREV_REGISTERS[i]) {
      $('#reg' + i + ' td:first').html(REGISTERS[i]);
      $('#reg' + i + ' td:last').html(dec2bin(REGISTERS[i]));
      if (noColour) {
        $('#reg' + i).css('background-color', 'white');
      } else {
        $('#reg' + i).css('background-color', '#72e109');
      }
    } else {
      $('#reg' + i).css('background-color', 'white');
    }
  }
}
// Update memory table
function updateMemoryTable(noColour) {
  $('#memTable').html(''); // empty table
  for (var loc in MEMORY) {
    if (MEMORY[loc] != PREV_MEMORY[loc]) {
      $('#memTable').append('<tr style="background-color:#72e109"><th scope="row">' + loc + '</th><td class="text-right">' + MEMORY[loc] + '</td><td class="text-right">' + dec2bin(MEMORY[loc]) + '</td></tr>');
    } else {
      $('#memTable').append('<tr><th scope="row">' + loc + '</th><td class="text-right">' + MEMORY[loc] + '</td><td class="text-right">' + dec2bin(MEMORY[loc]) + '</td></tr>');
    }
  }
}
// Update comparison table
function updateComparisonTable(noColour) {
  var cmps = ['EQ', 'NE', 'LT', 'GT'];
  for (var i = 0; i < cmps.length; i++) {
    if (CMP[cmps[i]] != PREV_CMP[cmps[i]] && !noColour) {
      $('#cmp' + cmps[i]).css('background-color', '#72e109');
    } else {
      $('#cmp' + cmps[i]).css('background-color', 'white');
    }
    if (CMP[cmps[i]]) {
      $('#cmp' + cmps[i] + ' td:first').html('True');
    } else {
      $('#cmp' + cmps[i] + ' td:first').html('False');
    }
  }
}
// Reset function - clear registers and memory, go to start of code
function reset() {
  clearInterval(AUTOSTEP_INTERVAL);
  INDEX = 0;
  REGISTERS = {0:0, 1:0, 2:0, 3:0, 4:0, 5:0, 6:0, 7:0, 8:0, 9:0, 10:0, 11:0, 12:0};
  PREV_REGISTERS = {}
  MEMORY = {};
  PREV_MEMORY = {}
  CMP = {'EQ': false, 'NE': false, 'LT': false, 'GT': false};
  editor.session.removeMarker(PREV_HIGHLIGHT);
  PREV_HIGHLIGHT = -1;
  updateRegisterTable(true);
  updateMemoryTable(true);
  updateComparisonTable(true);
  Object.assign(PREV_REGISTERS, REGISTERS);
  Object.assign(PREV_MEMORY, MEMORY);
  Object.assign(PREV_CMP, CMP);
}
// Decimal to binary converter - https://stackoverflow.com/questions/9939760/how-do-i-convert-an-integer-to-binary-in-javascript
function dec2bin(dec){
  return (dec >>> 0).toString(2);
}
// Example load function
function loadExample(example) {
  $.get('examples/' + example + '.txt', function(data) {
    editor.setValue(data, -1);
  });
}
// Populate tables on document load
$(document).ready(function() {
  updateRegisterTable(true);
  updateMemoryTable(true);
  updateComparisonTable(true);
  Object.assign(PREV_REGISTERS, REGISTERS);
  Object.assign(PREV_MEMORY, MEMORY);
  Object.assign(PREV_CMP, CMP);
});
// Append a new location / value input field pair to modal body
function addMemoryItemCell() {
  $('#populateMemTable').append(
    '<tr>\
    <td><input class="form-control" type="number" name="memoryLoc[]"></td>\
    <td><input class="form-control" type="number" name="memoryVal[]"></td>\
    <td>\
    </td>'
  );
}
// Parse input fields from populate memory modal, update memory & memory table content
function parseMemoryPopulateForm() {
  var cellLoc = $("input[name='memoryLoc[]']").map(function(){return $(this).val();}).get();
  var cellVal = $("input[name='memoryVal[]']").map(function(){return $(this).val();}).get();
  var cellCount = cellLoc.length;
  var cellArray = {};
  for (i=0; i < cellCount; i++) {
    cellArray[parseInt(cellLoc[i])] = parseInt(cellVal[i]);
  }
  Object.assign(MEMORY, data);
  updateMemoryTable();
}
