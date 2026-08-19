// Read in template.js
const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');

let template = fs.readFileSync(path.join(__dirname, 'template.html'), 'utf8');
let file_pack = JSON.parse(fs.readFileSync(path.join(root, 'file_pack.json'), 'utf8'));

// Replace placeholders in template.js with actual values

// HTML
// frontend/body.html replace {{body_main.html}}
let body_main = fs.readFileSync(path.join(root, 'frontend', 'body.html'), 'utf8');
template = template.replace('{{body_main.html}}', body_main);

// Scripts

// JS Scripts
let scripts = [];
if (file_pack[0] && file_pack[0].in) {

    for (let script_path of file_pack[0].in) {
        let path = './../' + script_path;

        // let content = fs.readFileSync(path, 'utf8');
		// if (content.indexOf('?.') !== -1 || content.indexOf('??') !== -1) {
        //     let message = `Script ${script_path} uses optional chaining (?.) or nullish coalescing (??), which is not supported in this build process.`;
        //     message += `\nPlease either remove this or pack the scripts using a build tool that supports these features (e.g., Webpack, Babel).`;
        //     throw new Error(message);
        // }

        // Remove resources/projects/markup/ from the path for the script tag
        path = path.replace('resources/projects/markup/', '');

        scripts.push(`<script src="${path}"></script>`);
    }

}

const scripts_html = scripts.join('\n');
template = template.replace('||body_scripts||', scripts_html);

// CSS Styles
let styles = [];
if (file_pack[1] && file_pack[1].in) {
    for (let style_path of file_pack[1].in) {
        let path = './../' + style_path;
        path = path.replace('resources/projects/markup/', '');
        styles.push(`<link rel="stylesheet" href="${path}">`);
    }
}

const styles_html = styles.join('\n');
template = template.replace('||head_styles||', styles_html);

// Open it in the browser
const open = require('open');
const output_path = path.join(__dirname, 'index.html');
fs.writeFileSync(output_path, template, 'utf8');
open(output_path);