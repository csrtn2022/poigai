import './build-assessment.mjs';
import './build-districts.mjs';
import './build-knowledge.mjs';
import {cp,mkdir,rm} from 'node:fs/promises';
await rm('dist',{recursive:true,force:true});
await mkdir('dist');
for(const file of ['index.html','styles.css','theme.css','script.js','enquiry.js','robots.txt','sitemap.xml','assets','account','admin','projects','funders','trust','partners','donors.css','knowledge']) await cp(file,`dist/${file}`,{recursive:true});
