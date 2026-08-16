import XLSX from 'xlsx';
import path from 'path';
import fs from 'fs';

function buildSheet(rows) {
  const ws = {};
  let maxCol = 0;
  rows.forEach((row, r) => {
    row.forEach((val, c) => {
      if (c > maxCol) maxCol = c;
      const cell = { v: val };
      if (typeof val === 'number') cell.t = 'n';
      else if (typeof val === 'boolean') cell.t = 'b';
      else cell.t = 's';
      ws[XLSX.utils.encode_cell({ c, r })] = cell;
    });
  });
  ws['!ref'] = XLSX.utils.encode_range({ s: { c: 0, r: 0 }, e: { c: maxCol, r: rows.length - 1 } });
  return ws;
}

// Convert Bug Report
const bugReportRows = [
  ['Bug ID', 'Severity', 'Title', 'Test Case', 'Module', 'Steps', 'Expected', 'Status'],
  ['BUG-P1-001', 'P2-High', 'Pro plan registration fails with STRIPE_SECRET_KEY server error', 'TC-REG-10', 'Register Page', '1. Navigate to /register 2. Fill details 3. Select Pro plan', 'Payment or dashboard', 'Open'],
  ['BUG-P1-002', 'P2-High', 'Logout fails with JWT_SECRET mismatch / undefined', 'TC-LOG-05', 'Dashboard/Auth', '1. Login 2. Click Logout', 'Redirect to /auth, token removed', 'Open'],
  ['BUG-P1-003', 'P2-High', 'No Confirm Password field during registration', 'TC-REG-05', 'Register Page', '1. View Register form', 'Should have a confirm password field', 'Open'],
  ['BUG-P1-004', 'P3-Medium', 'Weak passwords allowed', 'TC-REG-04', 'Register Page', '1. Register with "123"', 'Validation error', 'Open']
];

const wbBugs = { SheetNames: ['Bugs'], Sheets: { 'Bugs': buildSheet(bugReportRows) } };
XLSX.writeFile(wbBugs, path.resolve('testing of forgeqa/Phase_1_Auth_Landing/PHASE_1_BUG_REPORT_Export.xlsx'));

// Convert Section B Report
const secBRows = [
  ['Test ID', 'Test Title', 'Result', 'Verified Finding / Behavior', 'Evidence Screenshot'],
  ['TC-REG-01', 'Successful new user registration', 'PASS', 'testfree2@forgeqa-test.com registered, selected Free Plan', 'tc_reg_01_dashboard'],
  ['TC-REG-02', 'Duplicate email registration', 'PASS', 'Error message displayed: "User already exists"', 'tc_reg_02_error'],
  ['TC-REG-03', 'Invalid email format validation', 'PASS', 'Client-side validation blocked submission', 'tc_reg_03_invalid_email'],
  ['TC-REG-04', 'Weak password validation', 'PASS', 'No minimum length validation, 123 was accepted (Bug P1-004)', 'tc_reg_04_error'],
  ['TC-REG-05', 'Password confirmation validation', 'FAIL', 'No Confirm Password field exists (Bug P1-003)', 'tc_reg_05_form'],
  ['TC-REG-06', 'Empty form submission validation', 'PASS', 'Submitting empty form blocked by input validation', 'tc_reg_06_empty'],
  ['TC-REG-07', 'Disposable email domain blocked', 'PASS', 'Blocked with error message', 'tc_reg_07_disposable']
];

const wbSecB = { SheetNames: ['Section B'], Sheets: { 'Section B': buildSheet(secBRows) } };
XLSX.writeFile(wbSecB, path.resolve('testing of forgeqa/Phase_1_Auth_Landing/PHASE_1_SECTION_B_REPORT_Export.xlsx'));

console.log('Excel files generated successfully.');
