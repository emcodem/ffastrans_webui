module.exports = function (grunt) {
	'use strict';

	require('load-grunt-tasks')(grunt);

	grunt.initConfig({
		babel: {
			options: {
				sourceMap: false
			},
			es2015: {
				files: {
					'./lib/safe.js': './lib/safe.modern.js'
				},
				options: {
					presets: [
						["env", {
							loose: true,
							modules: false,
							forceAllTransforms: true
						}]
					]
				}
			},
			minify: {
				files: {
					'./lib/safe.min.js': './lib/safe.js',
					'./lib/safe.modern.min.js': './lib/safe.modern.js'
				},
				options: {
					presets: [
						["minify", {}]
					]
				}
			}
		},
		body: {}
	});

	grunt.registerTask('body', function () {
		const body = grunt.file.read('./source/body.js');

		grunt.file.write('./lib/safe.modern.js', body);
		grunt.log.writeln('✓ '.green + './lib/safe.modern.js');
	});

	grunt.registerTask('umd', function () {
		const es6 = grunt.file.read('./lib/safe.modern.js'),
			es2015 = grunt.file.read('./lib/safe.js'),
			umd = grunt.file.read('./source/index.js');

		grunt.file.write('./lib/safe.modern.js', umd.replace(`/* body */`, es6));
		grunt.log.writeln('✓ '.green + './lib/safe.modern.js');
		grunt.file.write('./lib/safe.js', umd.replace(`/* body */`, es2015));
		grunt.log.writeln('✓ '.green + './lib/safe.js');
	});

	grunt.registerTask('default', ['body', 'babel:es2015', 'umd', 'babel:minify']);
};