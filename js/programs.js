/**
 * programs.js
 * Loads program data from the scraper output (programs.json)
 * and exposes the matching function.
 *
 * In production: fetch('/programs.json') from Cloudflare Pages
 * In development: uses inline fallback data
 */

let PROGRAMS = [];

async function loadPrograms() {
  try {
    const res = await fetch('programs.json');
    if (!res.ok) throw new Error('not found');
    PROGRAMS = await res.json();
    console.log(`Loaded ${PROGRAMS.length} programs from programs.json`);
  } catch (e) {
    console.warn('programs.json not found — using fallback data');
    PROGRAMS = FALLBACK_PROGRAMS;
  }
}

function matchPrograms(gpa, ielts) {
  const strong   = [];
  const good     = [];
  const possible = [];

  PROGRAMS.forEach(p => {
    const gpaOk      = gpa   >= p.Min_GPA;
    const ieltsOk    = ielts >= p.Min_IELTS;
    const gpaClose   = gpa   >= p.Min_GPA   - 0.2;
    const ieltsClose = ielts >= p.Min_IELTS - 0.3;

    if (gpaOk && ieltsOk)                                   strong.push(p);
    else if ((gpaOk && ieltsClose) || (gpaClose && ieltsOk)) good.push(p);
    else if (gpaClose && ieltsClose)                         possible.push(p);
  });

  // Sort each tier by tuition ascending (most affordable first)
  const sort = arr => arr.sort((a,b) => (a.Tuition_CAD||0) - (b.Tuition_CAD||0));
  return { strong: sort(strong), good: sort(good), possible: sort(possible) };
}

// ── Fallback programs (used if programs.json not deployed yet) ────
const FALLBACK_PROGRAMS = [
  { University:"University of Toronto",           Program_Name:"Master of Science in Computer Science",  City:"Toronto",   Province:"ON", Min_GPA:3.5, Min_IELTS:6.5, Tuition_CAD:28000, App_Fee_CAD:125, Duration:"2 years",   Program_Type:"Coursework", Co_Op:false, Intakes:"Sep 2025, Jan 2026", Program_URL:"https://adsimmigration.com/contact?program=uoft-msc-cs" },
  { University:"University of British Columbia",  Program_Name:"Master of Business Administration",       City:"Vancouver", Province:"BC", Min_GPA:3.3, Min_IELTS:7.0, Tuition_CAD:45000, App_Fee_CAD:168, Duration:"15 months", Program_Type:"Coursework", Co_Op:false, Intakes:"Sep 2025",           Program_URL:"https://adsimmigration.com/contact?program=ubc-mba" },
  { University:"McMaster University",             Program_Name:"Master of Health Administration",         City:"Hamilton",  Province:"ON", Min_GPA:3.0, Min_IELTS:6.5, Tuition_CAD:22000, App_Fee_CAD:110, Duration:"2 years",   Program_Type:"Coursework", Co_Op:false, Intakes:"Sep 2025",           Program_URL:"https://adsimmigration.com/contact?program=mcmaster-mha" },
  { University:"University of Waterloo",          Program_Name:"Master of Engineering",                   City:"Waterloo",  Province:"ON", Min_GPA:3.5, Min_IELTS:7.0, Tuition_CAD:18500, App_Fee_CAD:150, Duration:"1 year",    Program_Type:"Coursework", Co_Op:true,  Intakes:"Sep 2025, Jan 2026", Program_URL:"https://adsimmigration.com/contact?program=waterloo-meng" },
  { University:"Toronto Metropolitan University", Program_Name:"Master of Business Administration",       City:"Toronto",   Province:"ON", Min_GPA:2.85,Min_IELTS:6.5, Tuition_CAD:28000, App_Fee_CAD:110, Duration:"2 years",   Program_Type:"Coursework", Co_Op:false, Intakes:"Sep 2025, Jan 2026", Program_URL:"https://adsimmigration.com/contact?program=tmu-mba" },
  { University:"University of Alberta",           Program_Name:"Master of Science in Data Science",       City:"Edmonton",  Province:"AB", Min_GPA:3.2, Min_IELTS:6.5, Tuition_CAD:15000, App_Fee_CAD:125, Duration:"2 years",   Program_Type:"Thesis",     Co_Op:false, Intakes:"Sep 2025",           Program_URL:"https://adsimmigration.com/contact?program=ualberta-msc-ds" },
  { University:"McGill University",               Program_Name:"Master of Science in Finance",            City:"Montreal",  Province:"QC", Min_GPA:3.4, Min_IELTS:7.0, Tuition_CAD:20000, App_Fee_CAD:119, Duration:"1 year",    Program_Type:"Coursework", Co_Op:false, Intakes:"Sep 2025",           Program_URL:"https://adsimmigration.com/contact?program=mcgill-msc-finance" },
  { University:"Concordia University",            Program_Name:"Master of Business Administration",       City:"Montreal",  Province:"QC", Min_GPA:2.5, Min_IELTS:6.0, Tuition_CAD:24000, App_Fee_CAD:90,  Duration:"2 years",   Program_Type:"Coursework", Co_Op:false, Intakes:"Sep 2025, Jan 2026", Program_URL:"https://adsimmigration.com/contact?program=concordia-mba" },
  { University:"Simon Fraser University",         Program_Name:"Master of Science in Engineering",        City:"Burnaby",   Province:"BC", Min_GPA:3.0, Min_IELTS:6.5, Tuition_CAD:14000, App_Fee_CAD:100, Duration:"2 years",   Program_Type:"Thesis",     Co_Op:false, Intakes:"Sep 2025, Jan 2026", Program_URL:"https://adsimmigration.com/contact?program=sfu-msc-eng" },
  { University:"University of Manitoba",          Program_Name:"Master of Science in Computer Science",   City:"Winnipeg",  Province:"MB", Min_GPA:2.75,Min_IELTS:6.0, Tuition_CAD:8000,  App_Fee_CAD:100, Duration:"2 years",   Program_Type:"Thesis",     Co_Op:false, Intakes:"Sep 2025, Jan 2026", Program_URL:"https://adsimmigration.com/contact?program=umanitoba-msc-cs" },
];
