import OpenAI from "openai";
export default async function handler(req,res){
 if(req.method!=="POST") return res.status(405).json({error:"POST only"});
 try{
  if(!process.env.OPENAI_API_KEY) return res.status(500).json({error:"OPENAI_API_KEY is not configured"});
  const {image}=req.body||{};
  if(!image||!image.startsWith("data:image/")) return res.status(400).json({error:"Chart image is required"});
  const client=new OpenAI({apiKey:process.env.OPENAI_API_KEY});
  const prompt=`Analyze only what is visible in this trading chart screenshot. Do not guarantee profit. Return ONLY JSON with keys: market,timeframe,trend,signal,confidence,support,resistance,expiry,reasons,risk. signal must be CALL / UP, PUT / DOWN, or NO TRADE. confidence is 0-100. If unclear, use NO TRADE and low confidence.`;
  const r=await client.responses.create({model:"gpt-5.6",input:[{role:"user",content:[{type:"input_text",text:prompt},{type:"input_image",image_url:image}]}]});
  const raw=r.output_text.trim().replace(/^```json\s*/i,"").replace(/```$/i,"").trim();
  return res.status(200).json(JSON.parse(raw));
 }catch(e){return res.status(500).json({error:e?.message||"Analysis failed"})}
}