import express from "express";
import { GoogleGenAI, Type } from "@google/genai";
import path from "path";
import { fileURLToPath } from "url";
const app=express(),__dirname=path.dirname(fileURLToPath(import.meta.url));
app.use(express.json({limit:"50kb"}));app.use(express.static(path.join(__dirname,"public")));
app.get("/health",(_q,r)=>r.json({ok:true,aiConfigured:Boolean(process.env.GEMINI_API_KEY),provider:"gemini"}));
app.post("/api/estimate",async(req,res)=>{
 try{
  if(!process.env.GEMINI_API_KEY)return res.status(503).json({error:"La clé Gemini n’est pas configurée."});
  const {text,meal,diet}=req.body||{};if(!text?.trim())return res.status(400).json({error:"Description manquante."});
  const ai=new GoogleGenAI({apiKey:process.env.GEMINI_API_KEY});
  const response=await ai.models.generateContent({
   model:process.env.GEMINI_MODEL||"gemini-2.5-flash",
   contents:`Analyse uniquement les aliments mentionnés dans ce journal alimentaire.
Estime pour chaque élément: calories, protéines en g, lipides en g, glucides en g.
Si l'utilisateur donne une valeur exacte, conserve-la.
Si quantité/marque manque, utilise une portion courante et précise brièvement l'hypothèse.
N'ajoute aucun aliment absent. Ne modifie pas les estimations pour faire artificiellement correspondre le régime choisi.
Le profil alimentaire "${diet||"non précisé"}" sert seulement de contexte.
Repas: ${meal||"non précisé"}
Texte: ${text.trim()}`,
   config:{responseMimeType:"application/json",responseSchema:{type:Type.OBJECT,properties:{items:{type:Type.ARRAY,items:{type:Type.OBJECT,properties:{name:{type:Type.STRING},calories:{type:Type.NUMBER},protein_g:{type:Type.NUMBER},fat_g:{type:Type.NUMBER},carbs_g:{type:Type.NUMBER},note:{type:Type.STRING}},required:["name","calories","protein_g","fat_g","carbs_g","note"]}}},required:["items"]}}
  });
  const p=JSON.parse(response.text||"{}");if(!Array.isArray(p.items))return res.status(502).json({error:"Réponse IA invalide."});
  res.json({items:p.items.slice(0,30).map(x=>({name:String(x.name||"Aliment").slice(0,120),calories:Math.max(0,+x.calories||0),protein_g:Math.max(0,+x.protein_g||0),fat_g:Math.max(0,+x.fat_g||0),carbs_g:Math.max(0,+x.carbs_g||0),note:String(x.note||"").slice(0,250)}))});
 }catch(e){console.error(e);const m=String(e?.message||"");if(m.includes("429")||m.toLowerCase().includes("quota"))return res.status(429).json({error:"Limite gratuite Gemini atteinte. Réessaie plus tard."});res.status(500).json({error:"Impossible d’estimer pour le moment."})}
});
app.listen(Number(process.env.PORT||10000),"0.0.0.0",()=>console.log("CaloriPulse prêt"));
