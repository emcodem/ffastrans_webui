"use strict";

var fsp = require("mz/fs");

module.exports = {

  /** Read in the last `n` lines of a file
  * @param  {string}  file (direct or relative path to file.)
  * @param  {int}     maxLine max number of lines to read in.
  * @return {promise} new Promise, resolved with lines or rejected with error.
  */

	read: function read(filePath, maxLine) {
		return new Promise(function (resolve, reject) {
			var self = {
				stat: null,
				file: null
			};

			fsp.exists(filePath).then(function (exists) {
				if (!exists) {
					throw new Error("File does not exist");
				}
			}).then(function () {
				var promises = [];

				promises.push(fsp.stat(filePath).then(function (stat) {
					return self.stat = stat;
				}));

				promises.push(fsp.open(filePath, "r").then(function (file) {
					return self.file = file;
				}));

				return promises;
			}).then(function (promises) {
				Promise.all(promises).then(function () {
					var chars = 0;
					var lineCount = 0;
					var lines = "";
					var newLineCharacters = ["\n", "\r"];

					var do_while_loop = function do_while_loop() {
						if (lines.length > self.stat.size) {
							lines = lines.substring(lines.length - self.stat.size);
						}

						if (lines.length >= self.stat.size || lineCount >= maxLine) {
							var pos =  newLineCharacters.indexOf(lines.substring(0, 1));
							if (pos >= 0) {
								lines = lines.substring(1);
							}		
							fsp.close(self.file);
							return resolve(lines);
						}

						fsp.read(self.file, new Buffer(1), 0, 1, self.stat.size - 1 - chars).then(function (bytesReadAndBuffer) {
							var nextCharacter = String.fromCharCode(bytesReadAndBuffer[1][0]);
							lines = nextCharacter + lines;
							var pos =  newLineCharacters.indexOf(nextCharacter);
							if (pos >= 0 && lines.length > 1) {
								lineCount++;
							}
							chars++;
							do_while_loop();
						});
					};
					do_while_loop();
				});
			}).catch(function (reason) {
				if (self.file !== null) {
					fsp.close(self.file);
				}
				return reject(reason);
			});
		});
	}
};