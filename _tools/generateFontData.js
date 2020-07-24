// Copyright 2019 Google LLC

// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at

// 	https://www.apache.org/licenses/LICENSE-2.0

// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

const fs = require("fs");
const util = require("util");
const path = require("path");
const {
	parseFontFile,
	buildStylesheet,
	buildFontJs
} = require("specimen-skeleton-support");

const srcDirectory = path.resolve(__dirname, "../", "src");
const fontsDirectory = path.resolve(srcDirectory, "fonts");
const dataDirectory = path.resolve(srcDirectory, "_data");
const fontsStylesheetPath = path.resolve(srcDirectory, "css", "font.css");
const fontJsPath = path.resolve(srcDirectory, "js", "font.js");

const assert = (condition, message) => {
	if (!condition) {
		throw new Error(message);
	}
};

const _writeFile = util.promisify(fs.writeFile);
const writeFile = (path, contents) => {
	console.info("Writing", path);
	return _writeFile(path, contents);
};

const writeDataFile = async (filename, data) => {
	const dataFilePath = path.join(dataDirectory, filename);
	const fileContents = JSON.stringify(data, null, 4);

	return writeFile(dataFilePath, fileContents);
};

const writeDataFiles = async fontData => {
	const promises = Object.entries(fontData).map(([type, data]) => {
		return writeDataFile(`${type}.json`, data);
	});

	return Promise.all(promises);
};

const writeStylesheet = async (fontData, fontFilePath) => {
	const fontUrl = path.relative(
		path.dirname(fontsStylesheetPath),
		fontFilePath
	);
	const stylesheet = buildStylesheet(fontData, fontUrl).toString();
	return writeFile(fontsStylesheetPath, stylesheet);
};

const writeFontJs = async fontData => {
	const js = buildFontJs(fontData);
	return writeFile(fontJsPath, js);
};

const findFirstFontFile = async directory => {
	const fontFiles = (await util.promisify(fs.readdir)(directory)).filter(
		f => path.extname(f) == ".woff2"
	);

	assert(
		fontFiles.length > 0,
		`No font file found. Place your font in ${path.relative(
			process.cwd(),
			directory
		)}.`
	);

	assert(
		fontFiles.length == 1,
		"Multiple font files found. Please specify the path to your font file explicitly."
	);

	return path.resolve(fontsDirectory, fontFiles[0]);
};

const main = async () => {
	const fontFilePath =
		process.argv[2] || (await findFirstFontFile(fontsDirectory));
	const fontData = await parseFontFile(fontFilePath);

	await Promise.all([
		writeDataFiles(fontData.data),
		writeStylesheet(fontData, fontFilePath),
		writeFontJs(fontData)
	]);
};

main().catch(e => {
	process.exitCode = 1;
	console.error("Failed to generate font data.", e);
});
