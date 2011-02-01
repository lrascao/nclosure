#!node

/**
 * @fileoverview Copyright 2011 Guido Tapia (guido@tapia.com.au).
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

var ng = require('goog').goog.init();

goog.provide('node.goog.googtest');

goog.require('goog.array');
goog.require('goog.testing.TestCase');
goog.require('goog.testing.jsunit');

goog.testing.jsunit['AUTO_RUN_ONLOAD'] = false;



/**
 * The node.goog.googtest class runs all tests (files case insensitive
 * named *test*) in a directory.
 *
 * @constructor
 */
node.goog.googtest = function() {

  var dir = process.argv[2];
  if (!dir) {
    throw new Error('No directory specified.  USAGE: googtest <dirname>');
  }
  ng.loadDependenciesFile(dir, 'deps.js');
  ng.loadAdditionalSettingsFile(dir);
  ng.setOnTestComplete(this.createTestCompletedHandler_());
  goog.testing.TestCase.prototype.isInsideMultiTestRunner = function() {
    return true;
  }
  /**
   * All test files found in the specified directory.
   *
   * @private
   * @type {Array.<string>}
   */
  this.tests_ = this.getAllTestsInCurrentDirectory_();

  /**
   * All the results, populated as tests complete.
   *
   * @private
   * @type {Array.<goog.testing.TestCase>}
   */
  this.results_ = [];

  var that = this;
  ng.onTestsReady = function() {
    that.runNextTest_();
  };
};


/**
 * Runs the next test ibn the tests queue.
 *
 * @private
 */
node.goog.googtest.prototype.runNextTest_ = function() {
  if (this.tests_.length === 0) {
    this.displayResults_();
  } else {
    var file = this.tests_.pop();
    this.runTest_(file);
  }
};


/**
 * Prints the results from each test case to the console.
 *
 * @private
 */
node.goog.googtest.prototype.displayResults_ = function() {
  console.log('\n\nRESULTS\n=======');
  goog.array.forEach(this.results_, function(tc) {
    console.log(tc.getReport(false));
  });
};


/**
 * @private
 * @return {Array.<string>} All tests files in this directory.
 */
node.goog.googtest.prototype.getAllTestsInCurrentDirectory_ = function() {
  var tests = [];

  return goog.array.filter(
      require('fs').readdirSync(process.argv[2]), function(f) {
        return f.toLowerCase().indexOf('test') >= 0;
      });
};


/**
 * @private
 * @param {string} testFile The test file to run.
 */
node.goog.googtest.prototype.runTest_ = function(testFile) {
  var script_ = process.binding('evals').Script;
  var code = require('fs').readFileSync(process.argv[2] + testFile, 'utf-8').
      replace(/^#!node/, '');
  script_.runInThisContext.call(global, code, testFile);

  var tr = global['G_testRunner'];

  var test = new goog.testing.TestCase(testFile);
  test.autoDiscoverTests();
  tr.initialize(test);
  tr.execute();
};


/**
 * @private
 * @this {goog.testing.TestRunner}
 * @return {function():undefined} The on complete handler.
 */
node.goog.googtest.prototype.createTestCompletedHandler_ = function() {
  var that = this;
  return function() {
    that.results_.push(this.testCase);
    that.runNextTest_();
  };
};

new node.goog.googtest();