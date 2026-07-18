   import fs from 'fs/promises';                                                                                            
   import path from 'path';                                                                                                 
   import OpenAI from 'openai';                                                                                             
                                                                                                                            
   const OPENAI_API_KEY = process.env.OPENAI_API_KEY;                                                                       
   const TARGET_LOCALE = 'en-US';                                                                                           
                                                                                                                            
   if (!OPENAI_API_KEY) {                                                                                                   
     console.error("Error: Please set your OPENAI_API_KEY environment variable.");                                          
     process.exit(1);                                                                                                       
   }                                                                                                                        
                                                                                                                            
   const openai = new OpenAI({ apiKey: OPENAI_API_KEY });                                                                   
                                                                                                                            
   async function translateText(text, type) {                                                                               
     let systemPrompt = `You are a professional translator. Translate the following ${type} from Chinese to English (US).`; 
     if (type === 'JSON') {                                                                                                 
       systemPrompt += " IMPORTANT: This is a JSON file. You MUST ONLY translate the values of the keys. Do NOT change any  
 key names, do NOT remove any keys, and keep the original JSON structure perfectly intact.";                                
     } else if (type === 'Markdown') {                                                                                      
       systemPrompt += " IMPORTANT: This is a Markdown file with YAML frontmatter (content between --- blocks). You MUST    
 preserve all YAML frontmatter exactly as it is, including all keys and special characters. ONLY translate the actual       
 markdown body content below the second triple-dash.";                                                                      
     }                                                                                                                      
                                                                                                                            
     const response = await openai.chat.completions.create({                                                                
       model: 'gpt-4o-mini',                                                                                                
       messages: [                                                                                                          
         { role: 'system', content: systemPrompt },                                                                         
         { role: 'user', content: text }                                                                                    
       ],                                                                                                                   
       temperature: 0,                                                                                                      
     });                                                                                                                    
                                                                                                                            
     return response.choices[0].message.content;                                                                            
   }                                                                                                                        
                                                                                                                            
   async function processFile(filePath, targetDir) {                                                                        
     const ext = path.extname(filePath);                                                                                    
     const content = await fs.readFile(filePath, 'utf8');                                                                   
     let translatedContent = '';                                                                                            
                                                                                                                            
     console.log(`Translating: ${path.relative(process.cwd(), filePath)}...`);                                              
                                                                                                                            
     try {                                                                                                                  
       if (ext === '.json') {                                                                                               
         translatedContent = await translateText(content, 'JSON');                                                          
       } else if (ext === '.md') {                                                                                          
         translatedContent = await translateText(content, 'Markdown');                                                      
       } else {                                                                                                             
         return;                                                                                                            
       }                                                                                                                    
                                                                                                                            
       await fs.mkdir(targetDir, { recursive: true });                                                                      
       const newPath = path.join(targetDir, path.basename(filePath));                                                       
       let cleanedContent = translatedContent.trim();                                                                       
       if (ext === '.json' && cleanedContent.startsWith('```json')) {                                                       
           cleanedContent = cleanedContent.replace(/^```json\n?/, '').replace(/\n?```$/, '');                               
       }                                                                                                                    
                                                                                                                            
       await fs.writeFile(newPath, cleanedContent);                                                                         
       console.log(`  ✅ Saved: ${path.relative(process.cwd(), newPath)}`);                                                 
     } catch (err) {                                                                                                        
       console.error(`  ❌ Error in ${filePath}:`, err.message);                                                            
       if (err.message.includes('429')) console.error("      [HINT] 429 error: Check your API Balance at                    
 https://platform.openai.com/settings/organization/billing");                                                               
     }                                                                                                                      
   }                                                                                                                        
                                                                                                                            
   async function walkAndTranslate(currentPath, baseDir, targetBase) {                                                      
     const entries = await fs.readdir(currentPath, { withFileTypes: true });                                                
     for (const entry of entries) {                                                                                         
       const fullPath = path.join(currentPath, entry.name);                                                                 
       const relativeFromBase = path.relative(baseDir, fullPath);                                                           
       const destination = path.join(targetBase, relativeFromBase);                                                         
                                                                                                                            
       if (entry.isDirectory()) {                                                                                           
         await walkAndTranslate(fullPath, baseDir, targetBase);                                                             
       } else {                                                                                                             
         const ext = path.extname(fullPath);                                                                                
         if (ext === '.json' || ext === '.md') {                                                                            
             await processFile(fullPath, path.dirname(destination));                                                        
         }                                                                                                                  
       }                                                                                                                    
     }                                                                                                                      
   }                                                                                                                        
                                                                                                                            
   async function main() {                                                                                                  
     const startTime = Date.now();                                                                                          
     console.log(`🚀 Starting translation to ${TARGET_LOCALE}...`);                                                         
     console.log(`Using model: gpt-4o-mini\n`);                                                                             
                                                                                                                            
     const settingsDir = path.join(process.cwd(), 'src/data/settings');                                                     
     const targetSettingsDir = path.join(process.cwd(), `src/data/settings/${TARGET_LOCALE}`);                              
     const contentDir = path.join(process.cwd(), 'src/content');                                                            
     const targetContentDir = path.join(process.cwd(), `src/content/${TARGET_LOCALE}`);                                     
                                                                                                                            
     console.log('--- [1/2] Translating Settings ---');                                                                     
     await walkAndTranslate(settingsDir, settingsDir, targetSettingsDir);                                                   
     console.log('\n--- [2/2] Translating Content ---');                                                                    
     await walkAndTranslate(contentDir, contentDir, targetContentDir);                                                      
                                                                                                                            
     const duration = (Date.now() - startTime) / 1000;                                                                      
     console.log(`\n✨ DONE! Total time: ${duration}s`);                                                                    
   }                                                                                                                        
                                                                                                                            
   main();
