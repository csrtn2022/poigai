import {cp,mkdir,rm} from 'node:fs/promises';
await rm('dist',{recursive:true,force:true});
await mkdir('dist');
for(const file of ['index.html','styles.css','theme.css','script.js','enquiry.js','robots.txt','sitemap.xml','assets','account','projects','funders','trust','partners','donors.css']) await cp(file,`dist/${file}`,{recursive:true});
