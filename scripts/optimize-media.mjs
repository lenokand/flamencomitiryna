import fs from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';
import { spawnSync } from 'node:child_process';
import ffmpeg from 'ffmpeg-static';
const source = process.argv[2] || 'media-source';
const out = 'public/media';
await fs.mkdir(out, { recursive: true });
const hero = path.join(source, 'hero.png');
await sharp(path.join(source, 'portrait.png')).resize(900).webp({quality:85}).toFile(`${out}/iryna-portrait.webp`);
for (const [name,width] of [['iryna-hero',1000],['iryna-hero-small',520]]) {
 await sharp(hero).resize({width,withoutEnlargement:true}).webp({quality:85,alphaQuality:95}).toFile(`${out}/${name}.webp`);
}
await sharp(hero).resize({height:600}).extend({left:400,right:400,top:15,bottom:15,background:'#181918'}).flatten({background:'#181918'}).resize(1200,630,{fit:'cover'}).jpeg({quality:85}).toFile(`${out}/social.jpg`);
for(let i=1;i<=3;i++){
 const input=path.join(source, `video-${i}.mp4`);
 const args=['-y','-i',input,'-vf',"scale=w='min(1280,iw)':h='min(1280,ih)':force_original_aspect_ratio=decrease:force_divisible_by=2",'-c:v','libx264','-crf','25','-preset','medium','-pix_fmt','yuv420p','-c:a','aac','-b:a','96k','-movflags','+faststart',`${out}/video-${i}.mp4`];
 const result=spawnSync(ffmpeg,args,{encoding:'utf8'});if(result.status!==0)throw new Error(result.stderr || String(result.error));
 const poster=spawnSync(ffmpeg,['-y','-ss','1','-i',input,'-frames:v','1','-vf','scale=640:-2','-q:v','3',`${out}/video-${i}.jpg`],{encoding:'utf8'});if(poster.status!==0)throw new Error(poster.stderr);
 console.log(`Optimized video ${i}`);
}
