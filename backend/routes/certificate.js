const express = require('express');
const db = require('../db');
const router = express.Router();
const puppeteer = require('puppeteer-core');

const EDGE_PATH = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';

// ─────────────────────────────────────────────
//  Level Helper
// ─────────────────────────────────────────────
function getCertLevel(total) {
    if (total >= 10) return { level: 'hero',   label: 'Blood Donation Hero Award',              minDonations: 10, nextAt: null };
    if (total >= 6)  return { level: 'gold',   label: 'Gold Blood Donor Certificate',            minDonations: 6,  nextAt: 10  };
    if (total >= 4)  return { level: 'elite',  label: 'Elite Blood Donor Certificate',           minDonations: 4,  nextAt: 6   };
    if (total >= 2)  return { level: 'normal', label: 'Blood Donation Appreciation Certificate', minDonations: 2,  nextAt: 4   };
    return null;
}

// ─────────────────────────────────────────────
//  Shared SVG corner ornament
// ─────────────────────────────────────────────
function cornerSVG(accent) {
    return `<svg viewBox="0 0 160 160" xmlns="http://www.w3.org/2000/svg">
        <path d="M10,10 L150,10 M10,10 L10,150" stroke="${accent}" stroke-width="2.5" fill="none"/>
        <path d="M22,22 L130,22 M22,22 L22,130" stroke="${accent}" stroke-width="1" fill="none" stroke-dasharray="4,4"/>
        <circle cx="10" cy="10" r="5" fill="${accent}"/>
        <circle cx="130" cy="22" r="3" fill="${accent}"/>
        <circle cx="22" cy="130" r="3" fill="${accent}"/>
        <path d="M32,32 Q82,32 82,82 Q82,32 132,32" stroke="${accent}" stroke-width="1.5" fill="none"/>
    </svg>`;
}

// ─────────────────────────────────────────────
//  NORMAL Certificate (2+ donations) — Classic Red
// ─────────────────────────────────────────────
function buildNormalCert(d, today) {
    return `<!DOCTYPE html><html><head><meta charset="UTF-8">
<style>
  @import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@400;700;900&family=Lato:wght@300;400;700&display=swap');
  *{margin:0;padding:0;box-sizing:border-box}
  body{width:1122px;height:794px;background:linear-gradient(135deg,#8b0000 0%,#c0392b 45%,#922b21 70%,#7b241c 100%);
       font-family:'Lato',sans-serif;position:relative;overflow:hidden;display:flex;align-items:center;justify-content:center}
  .corner{position:absolute;width:155px;height:155px}
  .corner svg{width:100%;height:100%}
  .corner-tl{top:0;left:0} .corner-tr{top:0;right:0;transform:scaleX(-1)}
  .corner-bl{bottom:0;left:0;transform:scaleY(-1)} .corner-br{bottom:0;right:0;transform:scale(-1,-1)}
  .bline{position:absolute;height:2px;left:115px;right:115px;
         background:linear-gradient(90deg,transparent,#cd7f32,#b87333,#cd7f32,transparent)}
  .bline.t{top:115px} .bline.b{bottom:115px}
  .bline-v{position:absolute;width:2px;top:115px;bottom:115px;
           background:linear-gradient(180deg,transparent,#cd7f32,#b87333,#cd7f32,transparent)}
  .bline-v.l{left:115px} .bline-v.r{right:115px}
  .content{position:relative;z-index:10;text-align:center;padding:18px 40px;width:860px}
  .seal{width:80px;height:80px;background:radial-gradient(circle,#fff3e0,#cd7f32);border-radius:50%;
        border:4px solid #b87333;display:flex;align-items:center;justify-content:center;
        margin:0 auto 12px;font-size:38px;box-shadow:0 0 18px rgba(205,127,50,0.7)}
  .level-badge{display:inline-block;background:rgba(0,0,0,0.25);border:1px solid rgba(205,127,50,0.5);
               border-radius:20px;padding:4px 18px;font-size:11px;letter-spacing:3px;
               color:#cd7f32;text-transform:uppercase;margin-bottom:8px}
  .org{font-family:'Cinzel',serif;font-size:12px;letter-spacing:5px;color:#cd7f32;text-transform:uppercase;margin-bottom:5px}
  .title{font-family:'Cinzel',serif;font-size:34px;font-weight:900;color:#fff8f0;
         text-shadow:2px 2px 8px rgba(0,0,0,0.5);letter-spacing:2px;line-height:1.1;margin-bottom:6px}
  .divider{display:flex;align-items:center;justify-content:center;gap:10px;margin:8px 0}
  .divider .ln{flex:1;height:1px;background:linear-gradient(90deg,transparent,#cd7f32,transparent);max-width:170px}
  .divider .dm{color:#cd7f32;font-size:14px}
  .sub{font-size:13px;letter-spacing:3px;color:rgba(255,248,240,0.75);text-transform:uppercase;margin-bottom:5px}
  .name{font-family:'Cinzel',serif;font-size:40px;font-weight:700;color:#cd7f32;
        text-shadow:0 2px 10px rgba(0,0,0,0.4);letter-spacing:2px;margin-bottom:8px;
        border-bottom:1px solid rgba(205,127,50,0.5);padding-bottom:6px}
  .body{font-size:14px;color:rgba(255,248,240,0.88);line-height:1.65;margin:8px 0;max-width:680px;margin-left:auto;margin-right:auto}
  .grid{display:grid;grid-template-columns:repeat(5,1fr);gap:10px;margin:12px 0;
        background:rgba(0,0,0,0.2);border:1px solid rgba(205,127,50,0.35);border-radius:8px;padding:12px 16px}
  .gi .gl{font-size:8.5px;letter-spacing:2px;color:#cd7f32;text-transform:uppercase;margin-bottom:3px}
  .gi .gv{font-size:13px;font-weight:700;color:#fff}
  .sigs{display:flex;justify-content:space-between;align-items:flex-end;margin-top:14px;padding:0 20px}
  .sb{text-align:center;min-width:140px}
  .sn{font-size:14px;color:#cd7f32;font-family:'Cinzel',serif;margin-bottom:3px}
  .sl{border-top:1px solid rgba(205,127,50,0.6);padding-top:5px;font-size:10px;letter-spacing:1px;
      color:rgba(255,248,240,0.65);text-transform:uppercase}
  .bg-c{position:absolute;border-radius:50%;border:1px solid rgba(205,127,50,0.07);pointer-events:none}
</style></head><body>
<div class="bg-c" style="width:550px;height:550px;top:50%;left:50%;transform:translate(-50%,-50%)"></div>
<div class="bg-c" style="width:750px;height:750px;top:50%;left:50%;transform:translate(-50%,-50%)"></div>
<div class="corner corner-tl">${cornerSVG('#b87333')}</div>
<div class="corner corner-tr">${cornerSVG('#b87333')}</div>
<div class="corner corner-bl">${cornerSVG('#b87333')}</div>
<div class="corner corner-br">${cornerSVG('#b87333')}</div>
<div class="bline t"></div><div class="bline b"></div>
<div class="bline-v l"></div><div class="bline-v r"></div>
<div class="content">
  <div class="seal">🩸</div>
  <div class="level-badge">● Appreciation Award</div>
  <div class="org">Blood Donor Management System</div>
  <div class="title">CERTIFICATE OF APPRECIATION</div>
  <div class="divider"><div class="ln"></div><div class="dm">◆ ◆ ◆</div><div class="ln"></div></div>
  <div class="sub">This certificate is proudly presented to</div>
  <div class="name">${d.full_name}</div>
  <div class="body">In heartfelt recognition of your compassionate dedication to donating blood and saving precious lives. Your generous act brings hope to those in need and makes you a true hero of humanity.</div>
  <div class="grid">
    <div class="gi"><div class="gl">Blood Group</div><div class="gv">${d.blood_group}</div></div>
    <div class="gi"><div class="gl">Donations</div><div class="gv">${d.totalDonations}</div></div>
    <div class="gi"><div class="gl">Level</div><div class="gv">Appreciation</div></div>
    <div class="gi"><div class="gl">Last Hospital</div><div class="gv" style="font-size:11px">${d.lastHospital}</div></div>
    <div class="gi"><div class="gl">Issue Date</div><div class="gv" style="font-size:11px">${today}</div></div>
  </div>
  <div class="sigs">
    <div class="sb"><div class="sn">BDMS</div><div class="sl">System Authority</div></div>
    <div style="text-align:center"><div style="font-size:28px;color:rgba(205,127,50,0.4)">❤</div>
      <div style="font-size:9px;letter-spacing:2px;color:rgba(255,248,240,0.45);text-transform:uppercase">Thank You for Saving Lives</div></div>
    <div class="sb"><div class="sn">${d.full_name.split(' ')[0]}</div><div class="sl">Donor Signature</div></div>
  </div>
</div></body></html>`;
}

// ─────────────────────────────────────────────
//  ELITE Certificate (4+ donations) — Red + Silver
// ─────────────────────────────────────────────
function buildEliteCert(d, today) {
    return `<!DOCTYPE html><html><head><meta charset="UTF-8">
<style>
  @import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@400;700;900&family=Lato:wght@300;400;700&display=swap');
  *{margin:0;padding:0;box-sizing:border-box}
  body{width:1122px;height:794px;
       background:linear-gradient(135deg,#6b0000 0%,#9b1a1a 30%,#7f1d1d 60%,#1c1c2e 100%);
       font-family:'Lato',sans-serif;position:relative;overflow:hidden;display:flex;align-items:center;justify-content:center}
  .corner{position:absolute;width:155px;height:155px}
  .corner svg{width:100%;height:100%}
  .corner-tl{top:0;left:0} .corner-tr{top:0;right:0;transform:scaleX(-1)}
  .corner-bl{bottom:0;left:0;transform:scaleY(-1)} .corner-br{bottom:0;right:0;transform:scale(-1,-1)}
  .bline{position:absolute;height:2px;left:115px;right:115px;
         background:linear-gradient(90deg,transparent,#c0c0c0,#e8e8e8,#c0c0c0,transparent)}
  .bline.t{top:115px} .bline.b{bottom:115px}
  .bline-v{position:absolute;width:2px;top:115px;bottom:115px;
           background:linear-gradient(180deg,transparent,#c0c0c0,#e8e8e8,#c0c0c0,transparent)}
  .bline-v.l{left:115px} .bline-v.r{right:115px}
  .content{position:relative;z-index:10;text-align:center;padding:16px 40px;width:860px}
  .seal{width:88px;height:88px;
        background:radial-gradient(circle,#ffffff,#c0c0c0,#a8a9ad);
        border-radius:50%;border:4px solid #c0c0c0;display:flex;align-items:center;justify-content:center;
        margin:0 auto 10px;font-size:42px;
        box-shadow:0 0 22px rgba(192,192,192,0.8),0 0 50px rgba(192,192,192,0.3)}
  .level-badge{display:inline-block;background:linear-gradient(90deg,rgba(192,192,192,0.15),rgba(232,232,232,0.25),rgba(192,192,192,0.15));
               border:1px solid rgba(192,192,192,0.6);border-radius:20px;padding:4px 20px;
               font-size:11px;letter-spacing:3px;color:#e8e8e8;text-transform:uppercase;margin-bottom:8px}
  .org{font-family:'Cinzel',serif;font-size:12px;letter-spacing:5px;color:#c0c0c0;text-transform:uppercase;margin-bottom:5px}
  .title{font-family:'Cinzel',serif;font-size:34px;font-weight:900;color:#ffffff;
         text-shadow:2px 2px 8px rgba(0,0,0,0.6),0 0 25px rgba(192,192,192,0.4);letter-spacing:2px;line-height:1.1;margin-bottom:6px}
  .divider{display:flex;align-items:center;justify-content:center;gap:10px;margin:7px 0}
  .divider .ln{flex:1;height:1px;background:linear-gradient(90deg,transparent,#c0c0c0,transparent);max-width:170px}
  .divider .dm{color:#c0c0c0;font-size:14px}
  .sub{font-size:13px;letter-spacing:3px;color:rgba(255,255,255,0.7);text-transform:uppercase;margin-bottom:5px}
  .name{font-family:'Cinzel',serif;font-size:40px;font-weight:700;color:#e8e8e8;
        text-shadow:0 0 20px rgba(192,192,192,0.6),0 2px 10px rgba(0,0,0,0.5);letter-spacing:2px;margin-bottom:8px;
        border-bottom:1px solid rgba(192,192,192,0.5);padding-bottom:6px}
  .body{font-size:14px;color:rgba(255,255,255,0.85);line-height:1.65;margin:7px 0;max-width:680px;margin-left:auto;margin-right:auto}
  .grid{display:grid;grid-template-columns:repeat(5,1fr);gap:10px;margin:11px 0;
        background:rgba(0,0,0,0.3);border:1px solid rgba(192,192,192,0.35);border-radius:8px;padding:12px 16px}
  .gi .gl{font-size:8.5px;letter-spacing:2px;color:#c0c0c0;text-transform:uppercase;margin-bottom:3px}
  .gi .gv{font-size:13px;font-weight:700;color:#fff}
  .sigs{display:flex;justify-content:space-between;align-items:flex-end;margin-top:13px;padding:0 20px}
  .sb{text-align:center;min-width:140px}
  .sn{font-size:14px;color:#c0c0c0;font-family:'Cinzel',serif;margin-bottom:3px}
  .sl{border-top:1px solid rgba(192,192,192,0.6);padding-top:5px;font-size:10px;letter-spacing:1px;
      color:rgba(255,255,255,0.55);text-transform:uppercase}
  .bg-c{position:absolute;border-radius:50%;border:1px solid rgba(192,192,192,0.07);pointer-events:none}
  .shimmer-bar{position:absolute;top:0;left:-50%;width:30%;height:100%;
               background:linear-gradient(90deg,transparent,rgba(255,255,255,0.03),transparent);pointer-events:none}
</style></head><body>
<div class="bg-c" style="width:550px;height:550px;top:50%;left:50%;transform:translate(-50%,-50%)"></div>
<div class="bg-c" style="width:750px;height:750px;top:50%;left:50%;transform:translate(-50%,-50%)"></div>
<div class="shimmer-bar"></div>
<div class="corner corner-tl">${cornerSVG('#c0c0c0')}</div>
<div class="corner corner-tr">${cornerSVG('#c0c0c0')}</div>
<div class="corner corner-bl">${cornerSVG('#c0c0c0')}</div>
<div class="corner corner-br">${cornerSVG('#c0c0c0')}</div>
<div class="bline t"></div><div class="bline b"></div>
<div class="bline-v l"></div><div class="bline-v r"></div>
<div class="content">
  <div class="seal">🥈</div>
  <div class="level-badge">★ Elite Donor Award</div>
  <div class="org">Blood Donor Management System</div>
  <div class="title">ELITE BLOOD DONOR CERTIFICATE</div>
  <div class="divider"><div class="ln"></div><div class="dm">◆ ◆ ◆</div><div class="ln"></div></div>
  <div class="sub">This elite certificate is proudly presented to</div>
  <div class="name">${d.full_name}</div>
  <div class="body">Your unwavering commitment to saving lives through repeated blood donation sets you apart as an Elite donor. Four or more acts of giving have placed you among the exceptional few who champion the cause of life.</div>
  <div class="grid">
    <div class="gi"><div class="gl">Blood Group</div><div class="gv">${d.blood_group}</div></div>
    <div class="gi"><div class="gl">Donations</div><div class="gv">${d.totalDonations}</div></div>
    <div class="gi"><div class="gl">Level</div><div class="gv">Elite</div></div>
    <div class="gi"><div class="gl">Last Hospital</div><div class="gv" style="font-size:11px">${d.lastHospital}</div></div>
    <div class="gi"><div class="gl">Issue Date</div><div class="gv" style="font-size:11px">${today}</div></div>
  </div>
  <div class="sigs">
    <div class="sb"><div class="sn">BDMS</div><div class="sl">System Authority</div></div>
    <div style="text-align:center"><div style="font-size:28px;color:rgba(192,192,192,0.5)">★</div>
      <div style="font-size:9px;letter-spacing:2px;color:rgba(255,255,255,0.4);text-transform:uppercase">Elite Blood Donor</div></div>
    <div class="sb"><div class="sn">${d.full_name.split(' ')[0]}</div><div class="sl">Donor Signature</div></div>
  </div>
</div></body></html>`;
}

// ─────────────────────────────────────────────
//  GOLD Certificate (6+ donations) — Red + Gold
// ─────────────────────────────────────────────
function buildGoldCert(d, today) {
    return `<!DOCTYPE html><html><head><meta charset="UTF-8">
<style>
  @import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@400;700;900&family=Lato:wght@300;400;700&display=swap');
  *{margin:0;padding:0;box-sizing:border-box}
  body{width:1122px;height:794px;
       background:linear-gradient(135deg,#7a0000 0%,#b91c1c 35%,#78350f 70%,#451a03 100%);
       font-family:'Lato',sans-serif;position:relative;overflow:hidden;display:flex;align-items:center;justify-content:center}
  .corner{position:absolute;width:160px;height:160px}
  .corner svg{width:100%;height:100%}
  .corner-tl{top:0;left:0} .corner-tr{top:0;right:0;transform:scaleX(-1)}
  .corner-bl{bottom:0;left:0;transform:scaleY(-1)} .corner-br{bottom:0;right:0;transform:scale(-1,-1)}
  .bline{position:absolute;height:3px;left:118px;right:118px;
         background:linear-gradient(90deg,transparent,#f0c040,#ffd700,#f0c040,transparent)}
  .bline.t{top:118px} .bline.b{bottom:118px}
  .bline-v{position:absolute;width:3px;top:118px;bottom:118px;
           background:linear-gradient(180deg,transparent,#f0c040,#ffd700,#f0c040,transparent)}
  .bline-v.l{left:118px} .bline-v.r{right:118px}
  .glow-bar{position:absolute;height:2px;left:122px;right:122px;opacity:0.4;
            background:linear-gradient(90deg,transparent,#ffd700,transparent)}
  .glow-bar.t{top:122px} .glow-bar.b{bottom:122px}
  .content{position:relative;z-index:10;text-align:center;padding:16px 40px;width:860px}
  .seal{width:92px;height:92px;
        background:radial-gradient(circle,#fffde7,#f0c040,#d4af37);
        border-radius:50%;border:5px solid #f0c040;display:flex;align-items:center;justify-content:center;
        margin:0 auto 10px;font-size:44px;
        box-shadow:0 0 30px rgba(255,215,0,0.9),0 0 60px rgba(255,215,0,0.4)}
  .level-badge{display:inline-block;
               background:linear-gradient(90deg,rgba(240,192,64,0.2),rgba(255,215,0,0.35),rgba(240,192,64,0.2));
               border:1px solid rgba(255,215,0,0.7);border-radius:20px;padding:4px 20px;
               font-size:11px;letter-spacing:4px;color:#ffd700;text-transform:uppercase;margin-bottom:8px;
               box-shadow:0 0 10px rgba(255,215,0,0.3)}
  .org{font-family:'Cinzel',serif;font-size:12px;letter-spacing:5px;color:#f0c040;text-transform:uppercase;margin-bottom:5px}
  .title{font-family:'Cinzel',serif;font-size:36px;font-weight:900;
         color:transparent;background:linear-gradient(180deg,#fff9c4,#f0c040,#d4af37);
         -webkit-background-clip:text;background-clip:text;
         text-shadow:none;filter:drop-shadow(0 2px 6px rgba(0,0,0,0.5));
         letter-spacing:2px;line-height:1.1;margin-bottom:6px}
  .divider{display:flex;align-items:center;justify-content:center;gap:10px;margin:7px 0}
  .divider .ln{flex:1;height:2px;background:linear-gradient(90deg,transparent,#f0c040,#ffd700,transparent);max-width:170px}
  .divider .dm{color:#ffd700;font-size:16px}
  .sub{font-size:13px;letter-spacing:3px;color:rgba(255,249,196,0.8);text-transform:uppercase;margin-bottom:5px}
  .name{font-family:'Cinzel',serif;font-size:42px;font-weight:700;
        color:transparent;background:linear-gradient(180deg,#fffde7,#f0c040,#b8860b);
        -webkit-background-clip:text;background-clip:text;
        filter:drop-shadow(0 0 15px rgba(255,215,0,0.6));
        letter-spacing:2px;margin-bottom:8px;border-bottom:2px solid rgba(255,215,0,0.55);padding-bottom:6px}
  .body{font-size:14px;color:rgba(255,249,196,0.9);line-height:1.65;margin:7px 0;max-width:680px;margin-left:auto;margin-right:auto}
  .grid{display:grid;grid-template-columns:repeat(5,1fr);gap:10px;margin:11px 0;
        background:rgba(0,0,0,0.25);border:1px solid rgba(240,192,64,0.45);border-radius:8px;padding:12px 16px;
        box-shadow:inset 0 0 20px rgba(255,215,0,0.05)}
  .gi .gl{font-size:8.5px;letter-spacing:2px;color:#f0c040;text-transform:uppercase;margin-bottom:3px}
  .gi .gv{font-size:13px;font-weight:700;color:#fff}
  .sigs{display:flex;justify-content:space-between;align-items:flex-end;margin-top:13px;padding:0 20px}
  .sb{text-align:center;min-width:140px}
  .sn{font-size:14px;color:#f0c040;font-family:'Cinzel',serif;margin-bottom:3px}
  .sl{border-top:1px solid rgba(240,192,64,0.7);padding-top:5px;font-size:10px;letter-spacing:1px;
      color:rgba(255,249,196,0.6);text-transform:uppercase}
  .bg-c{position:absolute;border-radius:50%;border:1px solid rgba(255,215,0,0.07);pointer-events:none}
</style></head><body>
<div class="bg-c" style="width:560px;height:560px;top:50%;left:50%;transform:translate(-50%,-50%)"></div>
<div class="bg-c" style="width:760px;height:760px;top:50%;left:50%;transform:translate(-50%,-50%)"></div>
<div class="corner corner-tl">${cornerSVG('#f0c040')}</div>
<div class="corner corner-tr">${cornerSVG('#f0c040')}</div>
<div class="corner corner-bl">${cornerSVG('#f0c040')}</div>
<div class="corner corner-br">${cornerSVG('#f0c040')}</div>
<div class="bline t"></div><div class="bline b"></div>
<div class="bline-v l"></div><div class="bline-v r"></div>
<div class="glow-bar t"></div><div class="glow-bar b"></div>
<div class="content">
  <div class="seal">🥇</div>
  <div class="level-badge">✦ Gold Donor Award ✦</div>
  <div class="org">Blood Donor Management System</div>
  <div class="title">GOLD BLOOD DONOR CERTIFICATE</div>
  <div class="divider"><div class="ln"></div><div class="dm">❖ ❖ ❖</div><div class="ln"></div></div>
  <div class="sub">This prestigious gold certificate is presented to</div>
  <div class="name">${d.full_name}</div>
  <div class="body">Six or more life-saving donations have elevated you to Gold status. Your extraordinary generosity has created a golden legacy of hope and healing. You are a guardian of life, a champion of humanity.</div>
  <div class="grid">
    <div class="gi"><div class="gl">Blood Group</div><div class="gv">${d.blood_group}</div></div>
    <div class="gi"><div class="gl">Donations</div><div class="gv">${d.totalDonations}</div></div>
    <div class="gi"><div class="gl">Level</div><div class="gv" style="color:#ffd700">Gold ✦</div></div>
    <div class="gi"><div class="gl">Last Hospital</div><div class="gv" style="font-size:11px">${d.lastHospital}</div></div>
    <div class="gi"><div class="gl">Issue Date</div><div class="gv" style="font-size:11px">${today}</div></div>
  </div>
  <div class="sigs">
    <div class="sb"><div class="sn">BDMS</div><div class="sl">System Authority</div></div>
    <div style="text-align:center"><div style="font-size:28px;color:rgba(240,192,64,0.6)">✦</div>
      <div style="font-size:9px;letter-spacing:2px;color:rgba(255,249,196,0.5);text-transform:uppercase">Gold Level Donor</div></div>
    <div class="sb"><div class="sn">${d.full_name.split(' ')[0]}</div><div class="sl">Donor Signature</div></div>
  </div>
</div></body></html>`;
}

// ─────────────────────────────────────────────
//  HERO Certificate (10+ donations) — Premium Dark + Crown
// ─────────────────────────────────────────────
function buildHeroCert(d, today) {
    return `<!DOCTYPE html><html><head><meta charset="UTF-8">
<style>
  @import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@400;700;900&family=Lato:wght@300;400;700&display=swap');
  *{margin:0;padding:0;box-sizing:border-box}
  body{width:1122px;height:794px;
       background:linear-gradient(135deg,#0d0d0d 0%,#1a0000 25%,#4a0404 50%,#1a0000 75%,#0d0d0d 100%);
       font-family:'Lato',sans-serif;position:relative;overflow:hidden;display:flex;align-items:center;justify-content:center}
  .corner{position:absolute;width:165px;height:165px}
  .corner svg{width:100%;height:100%}
  .corner-tl{top:0;left:0} .corner-tr{top:0;right:0;transform:scaleX(-1)}
  .corner-bl{bottom:0;left:0;transform:scaleY(-1)} .corner-br{bottom:0;right:0;transform:scale(-1,-1)}
  .outer-frame{position:absolute;top:12px;left:12px;right:12px;bottom:12px;
               border:2px solid rgba(255,215,0,0.6);border-radius:4px;
               box-shadow:0 0 20px rgba(255,215,0,0.15),inset 0 0 20px rgba(255,215,0,0.05)}
  .inner-frame{position:absolute;top:22px;left:22px;right:22px;bottom:22px;
               border:1px solid rgba(255,215,0,0.25);border-radius:2px}
  .bline{position:absolute;height:3px;left:0;right:0;
         background:linear-gradient(90deg,transparent 5%,#ffd700 30%,#b8860b 50%,#ffd700 70%,transparent 95%)}
  .bline.t{top:40px} .bline.b{bottom:40px}
  .radiance{position:absolute;border-radius:50%;
            background:radial-gradient(circle,rgba(180,0,0,0.25) 0%,transparent 70%);
            width:700px;height:700px;top:50%;left:50%;transform:translate(-50%,-50%);pointer-events:none}
  .content{position:relative;z-index:10;text-align:center;padding:14px 50px;width:900px}
  .crown-wrap{position:relative;display:inline-block;margin-bottom:8px}
  .seal{width:96px;height:96px;
        background:radial-gradient(circle,#fff9c4 0%,#ffd700 40%,#b8860b 80%,#8b6914 100%);
        border-radius:50%;border:5px solid #ffd700;display:flex;align-items:center;justify-content:center;
        margin:0 auto;font-size:46px;
        box-shadow:0 0 40px rgba(255,215,0,1),0 0 80px rgba(255,215,0,0.5),0 0 120px rgba(255,100,0,0.3)}
  .hero-ring{position:absolute;top:-8px;left:-8px;right:-8px;bottom:-8px;
             border-radius:50%;border:2px solid rgba(255,215,0,0.5);}
  .hero-ring2{position:absolute;top:-16px;left:-16px;right:-16px;bottom:-16px;
              border-radius:50%;border:1px solid rgba(255,215,0,0.25);}
  .level-badge{display:inline-block;
               background:linear-gradient(90deg,rgba(255,215,0,0.1),rgba(255,100,0,0.2),rgba(255,215,0,0.1));
               border:1px solid rgba(255,215,0,0.8);border-radius:20px;padding:5px 24px;
               font-size:11px;letter-spacing:4px;color:#ffd700;text-transform:uppercase;margin-bottom:7px;
               box-shadow:0 0 15px rgba(255,215,0,0.4)}
  .org{font-family:'Cinzel',serif;font-size:11px;letter-spacing:6px;color:rgba(255,215,0,0.7);text-transform:uppercase;margin-bottom:4px}
  .title{font-family:'Cinzel',serif;font-size:34px;font-weight:900;
         color:transparent;
         background:linear-gradient(180deg,#ffffff 0%,#ffd700 40%,#b8860b 70%,#ffd700 100%);
         -webkit-background-clip:text;background-clip:text;
         filter:drop-shadow(0 0 12px rgba(255,215,0,0.7));
         letter-spacing:2px;line-height:1.1;margin-bottom:5px}
  .divider{display:flex;align-items:center;justify-content:center;gap:10px;margin:6px 0}
  .divider .ln{flex:1;height:1px;background:linear-gradient(90deg,transparent,#ffd700,#ff6400,#ffd700,transparent);max-width:180px}
  .divider .dm{color:#ffd700;font-size:16px;text-shadow:0 0 8px rgba(255,215,0,0.7)}
  .sub{font-size:12px;letter-spacing:4px;color:rgba(255,215,0,0.7);text-transform:uppercase;margin-bottom:5px}
  .name{font-family:'Cinzel',serif;font-size:40px;font-weight:900;
        color:transparent;background:linear-gradient(180deg,#ffffff,#ffd700,#ff8c00);
        -webkit-background-clip:text;background-clip:text;
        filter:drop-shadow(0 0 20px rgba(255,215,0,0.8));
        letter-spacing:2px;margin-bottom:7px;padding-bottom:6px;
        border-bottom:2px solid rgba(255,215,0,0.6)}
  .body{font-size:13.5px;color:rgba(255,240,180,0.9);line-height:1.6;margin:6px 0;max-width:700px;margin-left:auto;margin-right:auto}
  .grid{display:grid;grid-template-columns:repeat(5,1fr);gap:10px;margin:10px 0;
        background:rgba(0,0,0,0.4);border:1px solid rgba(255,215,0,0.5);border-radius:8px;padding:11px 16px;
        box-shadow:inset 0 0 30px rgba(255,215,0,0.07),0 0 15px rgba(255,215,0,0.15)}
  .gi .gl{font-size:8px;letter-spacing:2px;color:#ffd700;text-transform:uppercase;margin-bottom:3px}
  .gi .gv{font-size:13px;font-weight:700;color:#fff}
  .sigs{display:flex;justify-content:space-between;align-items:flex-end;margin-top:12px;padding:0 20px}
  .sb{text-align:center;min-width:140px}
  .sn{font-size:14px;color:#ffd700;font-family:'Cinzel',serif;margin-bottom:3px;
      text-shadow:0 0 8px rgba(255,215,0,0.5)}
  .sl{border-top:1px solid rgba(255,215,0,0.5);padding-top:5px;font-size:10px;letter-spacing:1px;
      color:rgba(255,240,180,0.55);text-transform:uppercase}
</style></head><body>
<div class="radiance"></div>
<div class="outer-frame"></div>
<div class="inner-frame"></div>
<div class="bline t"></div><div class="bline b"></div>
<div class="corner corner-tl">${cornerSVG('#ffd700')}</div>
<div class="corner corner-tr">${cornerSVG('#ffd700')}</div>
<div class="corner corner-bl">${cornerSVG('#ffd700')}</div>
<div class="corner corner-br">${cornerSVG('#ffd700')}</div>
<div class="content">
  <div class="crown-wrap">
    <div class="seal">👑</div>
    <div class="hero-ring"></div>
    <div class="hero-ring2"></div>
  </div>
  <div class="level-badge">♛ BLOOD DONATION HERO ♛</div>
  <div class="org">Blood Donor Management System — Supreme Honor</div>
  <div class="title">BLOOD DONATION HERO AWARD</div>
  <div class="divider"><div class="ln"></div><div class="dm">★ ★ ★</div><div class="ln"></div></div>
  <div class="sub">With the highest honor, this award is bestowed upon</div>
  <div class="name">${d.full_name}</div>
  <div class="body">Ten or more acts of life-giving blood donation have crowned you a true Hero. Your unmatched dedication transcends generosity — you are a guardian of humanity, a legend in the sacred service of saving lives.</div>
  <div class="grid">
    <div class="gi"><div class="gl">Blood Group</div><div class="gv">${d.blood_group}</div></div>
    <div class="gi"><div class="gl">Donations</div><div class="gv" style="color:#ffd700;font-size:18px;font-weight:900">${d.totalDonations}</div></div>
    <div class="gi"><div class="gl">Honor Level</div><div class="gv" style="color:#ffd700">Hero ♛</div></div>
    <div class="gi"><div class="gl">Last Hospital</div><div class="gv" style="font-size:11px">${d.lastHospital}</div></div>
    <div class="gi"><div class="gl">Issue Date</div><div class="gv" style="font-size:11px">${today}</div></div>
  </div>
  <div class="sigs">
    <div class="sb"><div class="sn">BDMS</div><div class="sl">Supreme Authority</div></div>
    <div style="text-align:center">
      <div style="font-size:24px;color:rgba(255,215,0,0.7);text-shadow:0 0 10px rgba(255,215,0,0.5)">♛</div>
      <div style="font-size:9px;letter-spacing:2px;color:rgba(255,240,180,0.45);text-transform:uppercase">Blood Donation Hero</div>
    </div>
    <div class="sb"><div class="sn">${d.full_name.split(' ')[0]}</div><div class="sl">Hero's Signature</div></div>
  </div>
</div></body></html>`;
}

// ─────────────────────────────────────────────
//  Route: GET /api/certificate/:userId/eligible
// ─────────────────────────────────────────────
router.get('/:userId/eligible', async (req, res) => {
    const { userId } = req.params;
    try {
        const [donorRows] = await db.execute('SELECT donor_id FROM donors WHERE user_id = ?', [userId]);
        if (donorRows.length === 0) return res.json({ eligible: false, totalDonations: 0, level: null });

        const [donations] = await db.execute('SELECT COUNT(*) as cnt FROM donations WHERE donor_id = ?', [donorRows[0].donor_id]);
        const total = donations[0].cnt;
        const levelInfo = getCertLevel(total);
        res.json({
            eligible: !!levelInfo,
            totalDonations: total,
            level: levelInfo
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ─────────────────────────────────────────────
//  Route: GET /api/certificate/:userId (or /api/certificate/:userId/cert.pdf)
router.get('/:userId/:filename?', async (req, res) => {
    const { userId } = req.params;
    try {
        const [donorRows] = await db.execute(
            'SELECT d.*, u.email FROM donors d JOIN users u ON d.user_id = u.id WHERE d.user_id = ?', [userId]
        );
        if (donorRows.length === 0) return res.status(404).json({ error: 'Donor profile not found.' });
        const donor = donorRows[0];

        const [donations] = await db.execute('SELECT * FROM donations WHERE donor_id = ? ORDER BY donation_date DESC', [donor.donor_id]);
        const totalDonations = donations.length;

        const levelInfo = getCertLevel(totalDonations);
        if (!levelInfo) {
            return res.status(403).json({
                error: 'Certificate not yet earned. Donate at least 2 times to receive your certificate.',
                totalDonations
            });
        }

        const today = new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' });
        const donorData = {
            full_name: donor.full_name,
            blood_group: donor.blood_group,
            totalDonations,
            lastHospital: donations[0]?.hospital_name || 'General Hospital'
        };

        // Choose template by level
        let html;
        if      (levelInfo.level === 'hero')   html = buildHeroCert(donorData, today);
        else if (levelInfo.level === 'gold')   html = buildGoldCert(donorData, today);
        else if (levelInfo.level === 'elite')  html = buildEliteCert(donorData, today);
        else                                    html = buildNormalCert(donorData, today);

        let browser;
        const isProduction = process.env.NODE_ENV === 'production';
 
        try {
            if (isProduction) {
                // Production: Use @sparticuz/chromium for Render/Linux
                const chromium = require('@sparticuz/chromium');
                browser = await puppeteer.launch({
                    args: chromium.args,
                    defaultViewport: chromium.defaultViewport,
                    executablePath: await chromium.executablePath(),
                    headless: chromium.headless,
                    ignoreHTTPSErrors: true,
                });
            } else {
                // Local: Find Edge or Chrome
                const fs = require('fs');
                const paths = [
                    EDGE_PATH,
                    'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe',
                    'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
                    'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'
                ];
                let foundPath = paths.find(p => fs.existsSync(p));
 
                browser = await puppeteer.launch({
                    executablePath: foundPath || undefined,
                    headless: true,
                    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage']
                });
            }
 
            const page = await browser.newPage();
            await page.setViewport({ width: 1122, height: 794 });
            
            console.log('Generating PDF for:', donor.full_name);
            
            // Use 'domcontentloaded' for speed and reliability in slow network conditions
            await page.setContent(html, { 
                waitUntil: 'domcontentloaded', 
                timeout: 30000 
            });

            // Small delay to allow fonts and layout to settle
            await new Promise(r => setTimeout(r, 2000));

            const pdfBuffer = await page.pdf({
                width: '1122px', 
                height: '794px',
                printBackground: true,
                margin: { top: 0, right: 0, bottom: 0, left: 0 }
            });
            
            await browser.close();
            browser = null; // Mark as closed
            console.log('PDF Generated successfully, size:', pdfBuffer.length);

            const levelLabel = levelInfo.level.charAt(0).toUpperCase() + levelInfo.level.slice(1);
            const filename = `BDMS_${levelLabel}_Certificate_${donor.full_name.replace(/\s+/g, '_')}.pdf`;
            
            // Explicitly set headers for maximum compatibility
            res.setHeader('Content-Type', 'application/pdf');
            res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
            res.setHeader('Content-Length', pdfBuffer.length);
            
            res.send(pdfBuffer);
 
        } catch (browserErr) {
            if (browser) await browser.close();
            throw browserErr;
        }

    } catch (err) {
        console.error('Certificate error:', err);
        res.status(500).json({ error: 'Failed to generate certificate: ' + err.message });
    }
});

module.exports = router;
