/**
 * grunt-uncss
 * https://github.com/uncss/grunt-uncss
 *
 * Copyright (c) 2018 Addy Osmani
 * Licensed under the MIT license.
 */

'use strict';

const uncss = require('uncss');
const chalk = require('chalk');
const maxmin = require('maxmin');

module.exports = function (grunt) {
    grunt.registerMultiTask('uncss', 'Remove unused CSS', function () {
        const done = this.async();
        const options = this.options({
            report: 'min',
            logUnused: false
        });

        // grunt.log.writeln(JSON.stringify(this));
        // grunt.log.writeln(JSON.stringify(this.files));

        this.files.forEach(file => {

            file.orig.src.forEach((url)=>{
                if (!file.src.includes(url)) {
                    file.src.push(url);
                }
            });

            const src = file.src.filter(filepath => {
                if (/^https?:\/\//.test(filepath)) {
                    // This is a remote file: leave it in src array for uncss to handle.
                    return true;
                }

                if (!grunt.file.exists(filepath)) {
                    // Warn on and remove invalid local source files (if nonull was set).
                    grunt.log.warn(`Source file ${chalk.cyan(filepath)} not found.`);
                    return false;
                }

                return true;
            });

            if (src.length === 0 && file.src.length === 0) {
                grunt.fail.warn(`Destination (${file.dest}) not written because src files were empty.`);
            }

            try {
                uncss(src, options, (error, output, report) => {

                    if (error) {
                        throw error;
                    }

                    if (options.logUnused === true) {
                        const unusedSelectors = report.selectors.unused;
                        grunt.log.writeln(JSON.stringify(unusedSelectors, null, 2));
                        grunt.log.writeln(`Total unused selectors: ${unusedSelectors.length}`);
                    }

                    if (typeof file.dest === 'undefined') {
                        grunt.log.error('`options.dest` file path was not provided. ' +
                            'Therefore, resulting css file will not be output.');
                    } else {
                        grunt.file.write(file.dest, output);
                        grunt.log.writeln(`File ${chalk.cyan(file.dest)} created: ${maxmin(report.original, output, options.report === 'gzip')}`);
                    }

                    if (typeof options.reportFile !== 'undefined' && options.reportFile.length > 0) {
                        grunt.file.write(options.reportFile, JSON.stringify(report));
                    }

                    done();
                });
            } catch (error) {
                const err = new Error('Uncss failed.');

                if (error.msg) {
                    err.message += `, ${error.msg}.`;
                }

                err.origError = error;
                grunt.log.warn(`Uncssing source "${src}" failed.`);
                grunt.fail.warn(err);
            }
        });
    });
};
