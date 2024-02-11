const fs = require('fs');
const path = require('path');
const makeDir = require('make-dir');
const { promisify } = require('util');
const _template = require('lodash.template');
const writeFileAtomic = require('write-file-atomic');

const readFile = promisify(fs.readFile);

const capitalizeFilename = filepath => {
	const name = path.basename(filepath, path.extname(filepath));
	return name.charAt(0).toUpperCase() + name.substring(1);
};

const defaultOptions = {
	dependencies() {
		return [];
	},
	destination: 'umd',
	exports(filepath) {
		return capitalizeFilename(filepath);
	},
	namespace(filepath) {
		return capitalizeFilename(filepath);
	},
	template: path.join(__dirname, 'templates', 'returnExports.js')
};

const buildFileTemplateData = (filepath, options) => {
	const amd = [];
	const cjs = [];
	const global = [];
	const param = [];
	const requires = [];
	const dependencies = options.dependencies();
	const commaPrefix = items => items.map(value => `, ${value}`).join('');

	dependencies.forEach(d => {
		let dep = d;

		if (typeof d === 'string') {
			dep = {
				amd: d,
				cjs: d,
				global: d,
				param: d
			};
		}
		amd.push(`'${dep.amd || d.name}'`);
		cjs.push(`require('${dep.cjs || d.name}')`);
		global.push(`root.${dep.global || d.name}`);
		param.push(dep.param || d.name);
		requires.push(`${dep.param || d.name}=require('${dep.cjs || d.name}')`);
	});

	return {
		dependencies,
		exports: options.exports(filepath),
		namespace: options.namespace(filepath),
		// Adds resolved dependencies for each environment into the template data
		amd: `[${amd.join(', ')}]`,
		cjs: cjs.join(', '),
		commaCjs: commaPrefix(cjs),
		global: global.join(', '),
		commaGlobal: commaPrefix(global),
		param: param.join(', '),
		commaParam: commaPrefix(param)
		// =======================================================================
	};
};

module.exports = async (src, opts) => {
	const options = { ...defaultOptions, ...opts };

	let text = '';

	if (options.templateName) {
		text = options.templateName;
		if (text === 'amdNodeWeb') {
			text = 'returnExports';
		}
		text = path.join(__dirname, 'templates', `${text}.js`);
		text = await readFile(text);
	} else if (options.templateSource) {
		text = options.templateSource;
	} else {
		text = await readFile(options.template);
	}

	const compiled = _template(text);
	const data = buildFileTemplateData(src, options);
	const fileContent = await readFile(src, 'utf8');
	const umdFile = path.join(options.destination, src);

	data.contents = fileContent;

	const output = compiled(data);

	await makeDir(path.dirname(umdFile));
	await writeFileAtomic(umdFile, output);
};

module.exports.sync = (src, opts) => {
	const options = { ...defaultOptions, ...opts };

	let text = '';

	if (options.templateName) {
		text = options.templateName;
		if (text === 'amdNodeWeb') {
			text = 'returnExports';
		}
		text = path.join(__dirname, 'templates', `${text}.js`);
		text = fs.readFileSync(text);
	} else if (options.templateSource) {
		text = options.templateSource;
	} else {
		text = fs.readFileSync(options.template);
	}

	const compiled = _template(text);
	const data = buildFileTemplateData(src, options);
	const fileContent = fs.readFileSync(src, 'utf8');
	const umdFile = path.join(options.destination, src);

	data.contents = fileContent;

	const output = compiled(data);

	makeDir.sync(path.dirname(umdFile));
	fs.writeFileSync(umdFile, output);
};
