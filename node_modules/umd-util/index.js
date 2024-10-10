const fs = require('fs');
const path = require('path');
const makeDir = require('make-dir');
const umdify = require('umd');

module.exports = (moduleName, fileDir, filePath, commonJS) => {
	try {
		const dir = fileDir || 'umd';
		const umdFilePath = path.join(dir, filePath);
		const fileContent = fs.readFileSync(filePath, 'utf8');
		makeDir.sync(path.dirname(umdFilePath));
		fs.writeFileSync(umdFilePath, umdify(moduleName, fileContent, commonJS));
	} catch (error) {
		throw new Error(error);
	}
};
