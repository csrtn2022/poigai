import './build-assessment.mjs';
import './build-districts.mjs';
import './build-knowledge.mjs';
import {cp,mkdir,rm} from 'node:fs/promises';
await rm('dist',{recursive:true,force:true});
await mkdir('dist');
for(const file of ['index.html','site-chrome.css','site-chrome.js','styles.css','theme.css','script.js','activity.js','activity.css','enquiry.js','robots.txt','sitemap.xml','assets','how-it-works','legal','workspace','data-explorer','impact-partners','site-map','account','admin','projects','funders','trust','partners','donors.css','knowledge']) await cp(file,`dist/${file}`,{recursive:true});

// Apply common site navigation and footer enhancements to every built HTML page.
import {readdir,readFile,writeFile} from 'node:fs/promises';
import {join} from 'node:path';
async function enhance(folder){for(const entry of await readdir(folder,{withFileTypes:true})){const path=join(folder,entry.name);if(entry.isDirectory()){await enhance(path);continue;}if(!entry.name.endsWith('.html'))continue;const current=await readFile(path,'utf8');if(!current.includes('</head>')||current.includes('/site-chrome.js'))continue;const extra='<link rel="stylesheet" href="/site-chrome.css?v=20261016-mobile-nav-v6"><script src="/site-chrome.js?v=20261016-mobile-nav-v6" defer></script>';await writeFile(path,current.replace('</head>',extra+'</head>'));}}
await enhance('dist');
