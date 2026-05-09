export function evaluateDPA(data: any) {
  const { income, isFthb, creditScore, zipCode } = data;
  const numIncome = Number(income) || 0;
  
  const programs = [];

  // Helper to parse credit score
  const numCreditScore = Number(creditScore) || 0;
  const has620 = numCreditScore >= 620;
  const has640 = numCreditScore >= 640;
  const isNYC = zipCode && ["10001", "10451", "11201", "11101", "10301"].includes(zipCode);
  const isNassau = zipCode === "11501";
  const isSuffolk = zipCode === "11701";
  const isRochester = zipCode === "14601";

  // NY-001 SONYMA DPAL
  let status001 = "FAIL";
  let reason001 = "";
  if (isFthb && has620) {
    if (data.homebuyerEducation === "completed") {
      status001 = "PASS";
      reason001 = "Meets FTHB and 620 credit floor. Education requirement satisfied.";
    } else {
      status001 = "VERIFY";
      reason001 = data.homebuyerEducation === "in_progress"
        ? "Meets FTHB and 620 credit floor. Broker to confirm education completion."
        : "Meets FTHB and 620 credit floor. Certificate required before closing.";
    }
  } else {
    status001 = "FAIL";
    reason001 = "Fails FTHB or 620 credit floor.";
  }

  programs.push({ 
    id: "NY-001", 
    name: "SONYMA DPAL", 
    status: status001,
    reasoning: reason001,
    subtitle: "Forgivable loan · statewide · 0% interest · forgiven after 10 years",
    tags: ["SONYMA 1st required", "620 floor", "County AMI"],
    benefit: {
      label: "$15k",
      description: "3% of purchase price or $3,000 (whichever is greater), capped at $15,000. Forgiven after 10 years of owner occupancy. Partial repayment if sold within 10 years (1/120 per month remaining)."
    },
    blocks: [
      { type: "HARD STOP", label: "LOAN TYPE", text: "Must be paired with a SONYMA first mortgage. Cannot layer onto FHA, conventional, or any non-SONYMA primary loan. If the broker's lender doesn't offer SONYMA products, this program is unavailable regardless of all other criteria." },
      { type: "HARD STOP", label: "CREDIT SCORE", text: "620 minimum, hard encoded. No compensating factors accepted. Sub-620 is a simultaneous instant FAIL across all 5 SONYMA programs. No exceptions for income, assets, or occupancy history." },
      { type: "THRESHOLD", label: "INCOME", text: "County-specific AMI tables. Varies by county AND household size. NYC limit ≠ Nassau limit ≠ Rochester limit. Must pull the correct county row — using the wrong table produces a wrong result." },
      { type: "HARD STOP", label: "EXISTING PROPERTY OWNERSHIP", text: "Cannot currently own and retain a vacation home or investment property. Even if FTHB status clears via a Target Area exception, retaining another residential property is a separate and independent disqualifier." },
      { type: "THRESHOLD", label: "MINIMUM OWN FUNDS", text: "Borrower must contribute at least 1% of purchase price from own funds (3% for co-ops and 3-4 family). DPAL cannot cover the full down payment. Zero liquid assets = FAIL." },
      { type: "DOCUMENTATION", label: "HOMEBUYER EDUCATION", text: "8-hour homebuyer education certificate required. Missing at intake = VERIFY, not FAIL — fixable before closing. Pool insurance approval also required from SONYMA's insurer." }
    ]
  });

  // NY-002 SONYMA DPAL Plus
  let status002 = "FAIL";
  let reason002 = "";
  if (isFthb && has620 && numIncome <= 80000) {
    if (data.dpalPlusAtd === "yes") {
      status002 = "VERIFY";
      reason002 = "Meets baseline criteria. Verify ATD pairing funding availability.";
    } else {
      status002 = "FAIL";
      reason002 = "Must be paired with Achieving the Dream (NY-004).";
    }
  } else {
    status002 = "FAIL";
    reason002 = "Fails FTHB, credit floor, or tight 60% AMI cap.";
  }

  programs.push({ 
    id: "NY-002", 
    name: "SONYMA DPAL Plus", 
    status: status002,
    reasoning: reason002,
    subtitle: "Enhanced forgivable loan · statewide · limited funding rounds",
    tags: ["≤60% AMI only", "ATD pairing required", "Currently closed"],
    benefit: {
      label: "Up to $30k",
      description: "Double the standard DPAL. Forgiven after 10 years. Only available to borrowers ≤60% AMI using Achieving the Dream as their first mortgage."
    },
    blocks: [
      { type: "THRESHOLD", label: "TIGHTEST INCOME CAP IN PILOT", text: "Income must be ≤60% AMI. This is the most restrictive income cap in the entire 12-program set. A borrower who qualifies for DPAL (≤80% AMI) will not qualify for DPAL Plus if they are above 60%. At 61% AMI — instant FAIL on this program specifically." },
      { type: "HARD STOP", label: "LOAN PAIRING", text: "Must be used exclusively with SONYMA Achieving the Dream (NY-004). Cannot layer onto SONYMA Low Interest Rate or any other first mortgage. If the borrower doesn't qualify for ATD, DPAL Plus is also unavailable — the two are inseparable." },
      { type: "HARD STOP", label: "CREDIT SCORE", text: "620 minimum. SONYMA-wide hard floor. No exceptions regardless of income level or assets." },
      { type: "FUNDING", label: "CURRENTLY SUSPENDED", text: "Reservations currently closed as of early 2026. Even a PASS on all criteria is worthless when the program is suspended. Always verify funding status before presenting DPAL Plus to any borrower. This is the highest funding-risk program in the pilot." }
    ]
  });

  // NY-004 SONYMA Achieving the Dream
  let status004 = "FAIL";
  let reason004 = "";
  if (isFthb && has620 && numIncome <= 90000) {
    if (data.sonymaLender === "yes") {
      status004 = "PASS";
      reason004 = "Meets criteria. Proceed with SONYMA participating lender.";
    } else if (data.sonymaLender === "not_yet") {
      status004 = "VERIFY";
      reason004 = "Broker must connect borrower with a SONYMA participating lender.";
    } else {
      status004 = "FAIL";
      reason004 = "Cannot proceed without a SONYMA participating lender.";
    }
  } else {
    status004 = "FAIL";
    reason004 = "Fails FTHB, credit floor, or income cap.";
  }

  programs.push({
    id: "NY-004",
    name: "SONYMA Achieving the Dream",
    status: status004,
    reasoning: reason004,
    subtitle: "Below-market first mortgage · statewide · gateway for DPAL Plus",
    tags: ["≤80% AMI", "620 floor", "FTHB required"],
    benefit: {
      label: "Rate benefit",
      description: "Lowest SONYMA interest rate. Required pairing program for DPAL Plus. DPAL layering available on top."
    },
    blocks: [
      { type: "THRESHOLD", label: "INCOME", text: "Must be ≤80% AMI for county and household size. This is SONYMA's deepest discount rate program. Over 80% AMI = FAIL on ATD specifically, though borrower may still qualify for SONYMA Low Interest Rate program at a higher income ceiling." },
      { type: "HARD STOP", label: "CREDIT SCORE", text: "620 minimum. No exceptions. No compensating factors. Applies to average score if co-borrower." },
      { type: "POPULATION", label: "FTHB", text: "First-time homebuyer required (no primary residence owned in prior 3 years). Waived only for eligible veterans and for purchases in federally designated Target Areas." },
      { type: "HARD STOP", label: "EXISTING PROPERTY OWNERSHIP", text: "Cannot currently own and retain a vacation or investment property even when purchasing in a Target Area. Separate from FTHB status — two distinct disqualifiers." },
      { type: "THRESHOLD", label: "MINIMUM OWN FUNDS", text: "Min 1% of purchase price from borrower's own funds (3% for co-ops). Cannot be entirely gifted." },
      { type: "DOCUMENTATION", label: "HOMEBUYER EDUCATION", text: "Homebuyer education required. Pool insurance approval from SONYMA's mortgage pool insurer required separately from primary lender underwriting." }
    ]
  });

  // NY-007 SONYMA Graduate to Homeownership
  let status007 = "FAIL";
  let reason007 = "";
  if (has620) {
    if (data.gradYear === "before_2021" || data.gradYear === "none") {
      status007 = "FAIL";
      reason007 = "Exceeds 48-month window or no degree. Hard population gate.";
    } else if (data.gradYear === "2021") {
      status007 = "VERIFY";
      reason007 = "Borderline — broker must confirm exact date vs. application date.";
    } else {
      status007 = "PASS";
      reason007 = "Within 48-month window. Population eligibility confirmed.";
    }
  } else {
    status007 = "FAIL";
    reason007 = "Fails 620 credit floor.";
  }

  programs.push({
    id: "NY-007",
    name: "SONYMA Graduate to Homeownership",
    status: status007,
    reasoning: reason007,
    subtitle: "First mortgage + DPA bonus · statewide · NY graduates only",
    tags: ["NY grad ≤48 months", "620 floor", "County AMI"],
    benefit: {
      label: "Rate + DPA",
      description: "Below-market interest rate plus enhanced DPA bonus for qualifying recent graduates. Only program with a time-since-graduation eligibility gate."
    },
    blocks: [
      { type: "HARD STOP", label: "GRADUATION RECENCY", text: "Borrower must have graduated from a NY State college or university within the past 48 months. No degree, or graduated more than 4 years ago = instant FAIL. This is the unique population gate that no other program in the pilot shares." },
      { type: "HARD STOP", label: "SCHOOL MUST BE NY STATE", text: "Must be a New York State institution. A borrower who graduated from a college in New Jersey or Connecticut does not qualify even if they now live and are buying in New York." },
      { type: "HARD STOP", label: "CREDIT SCORE", text: "620 minimum. SONYMA-wide hard floor. No exceptions." },
      { type: "THRESHOLD", label: "INCOME", text: "County-specific income limits. Same SONYMA table structure as DPAL — check by county and household size." },
      { type: "HARD STOP", label: "LOAN TYPE", text: "Must use a SONYMA first mortgage. Non-SONYMA primary loan = program unavailable." },
      { type: "DOCUMENTATION", label: "DOCUMENTATION", text: "Diploma or official transcript proving graduation from NY institution within 48 months required. Missing = VERIFY. Cannot clear the population gate without this document." }
    ]
  });

  // NY-008 SONYMA Homes for Veterans
  let status008 = "FAIL";
  let reason008 = "";
  if (data.isVeteran === "yes") {
    if (has620) {
      status008 = "VERIFY";
      reason008 = "Meets credit floor. Broker must verify DD-214 for honorable discharge.";
    } else {
      status008 = "FAIL";
      reason008 = "Is a veteran, but fails 620 credit floor.";
    }
  } else {
    status008 = "FAIL";
    reason008 = "Absolute hard-stop. Non-veteran — program inaccessible.";
  }

  programs.push({
    id: "NY-008",
    name: "SONYMA Homes for Veterans",
    status: status008,
    reasoning: reason008,
    subtitle: "First mortgage + DPA bonus · statewide · veterans only",
    tags: ["Veterans only", "620 floor", "County AMI"],
    benefit: {
      label: "Rate + DPA",
      description: "Below-market rate plus enhanced DPA. Only program in the pilot where the FTHB requirement is completely waived for the qualifying population."
    },
    blocks: [
      { type: "HARD STOP", label: "POPULATION (ABSOLUTE, NO EXCEPTIONS)", text: "Borrower must be a US military veteran or active duty service member. Non-veteran = instant FAIL. No workarounds, no partial credit, no co-borrower exceptions. This is the hardest population gate in the entire pilot." },
      { type: "HARD STOP", label: "CREDIT SCORE", text: "620 minimum. No exceptions even for veterans. Military service does not waive the credit floor." },
      { type: "POPULATION", label: "FTHB WAIVED", text: "This is the one program in the pilot where the FTHB requirement is fully waived for the qualifying population. A veteran who previously owned a home still qualifies — important for older veterans re-entering the market after service." },
      { type: "THRESHOLD", label: "INCOME", text: "County-specific income limits apply even for veterans. Being a veteran does not waive the income cap. Must still clear the county AMI table." },
      { type: "HARD STOP", label: "LOAN TYPE", text: "Must use SONYMA first mortgage. Note: veterans may separately qualify for VA loans — SONYMA Homes for Veterans and a VA loan are entirely different products with different structures." },
      { type: "DOCUMENTATION", label: "DOCUMENTATION", text: "Military service documentation (DD-214 or equivalent) required to verify veteran status. Missing = VERIFY. The population gate cannot be cleared without verified service documentation." }
    ]
  });

  // NY-009 FHLBNY Homebuyer Dream Program
  let status009 = "FAIL";
  let reason009 = "";
  if (numIncome <= 100000) {
    if (data.hasContract === "yes") {
      status009 = "PASS";
      reason009 = "Income and contract requirements satisfied. Proceed to funding reservation.";
    } else if (data.hasContract === "negotiation") {
      status009 = "VERIFY";
      reason009 = "Meets income cap. Finalize contract before attempting reservation.";
    } else {
      status009 = "FAIL";
      reason009 = "Meets income cap, but lacks purchase contract. FHLBNY requires a signed contract.";
    }
  } else {
    status009 = "FAIL";
    reason009 = "Fails 80% AMI household income cap.";
  }

  programs.push({ 
    id: "NY-009", 
    name: "FHLBNY Homebuyer Dream Program", 
    status: status009,
    reasoning: reason009,
    subtitle: "Non-repayable grant · statewide · annual funding rounds",
    tags: ["≤80% AMI household", "First-come-first-served", "Counseling cert required"],
    benefit: {
      label: "Up to $30k",
      description: "Non-repayable grant. No monthly payments. 5-year retention period (prorated repayment if sold earlier). Can be stacked with HDP Wealth Builder for up to $60k combined."
    },
    blocks: [
      { type: "THRESHOLD", label: "HOUSEHOLD INCOME (ALL MEMBERS 18+)", text: "Total household income ≤80% AMI including ALL members aged 18+. This is household income, not borrower income. A non-borrowing adult in the home earning $30k can push the household over the limit even if the borrower individually qualifies. Most common failure mode on this program." },
      { type: "FUNDING", label: "ANNUAL ROUND, DEPLETES FAST", text: "Annual round, first-come-first-served, member-allotted. 2026 round opened February 9. A PASS on every criterion is worthless if the round closes. Funds are allotted per member institution — a borrower's lender may have exhausted their allotment even while other members still have funds." },
      { type: "HARD STOP", label: "EXECUTED PURCHASE CONTRACT REQUIRED FIRST", text: "Grant cannot be reserved without a fully executed purchase and sales contract. This creates a critical timing window — funds can run out between the date a borrower starts looking and the date they have a signed contract." },
      { type: "THRESHOLD", label: "MINIMUM EQUITY CONTRIBUTION", text: "Borrower must contribute a minimum $1,000 of own funds. Grant cannot cover 100% of costs. Less than $1,000 liquid = FAIL." },
      { type: "HARD STOP", label: "FHLBNY MEMBER LENDER REQUIRED", text: "Must originate through an FHLBNY member institution. Not all lenders are members. If the borrower's preferred lender is not a member = FAIL. Broker must verify lender membership before presenting this program." },
      { type: "DOCUMENTATION", label: "DOCUMENTATION", text: "Completed homeownership counseling certificate required before submission. Cannot submit grant application without it." }
    ]
  });

  // NY-010 FHLBNY HDP Plus
  let status010 = "FAIL";
  let reason010 = "";
  if (numIncome > 100000 && numIncome <= 150000) {
    if (data.hdpPlusPayStubs === "yes") {
      status010 = "PASS";
      reason010 = "Documentation ready. Broker confirms AMI band and proceeds.";
    } else {
      status010 = "VERIFY";
      reason010 = "Provisional income band met. Broker must collect recent pay stubs to confirm.";
    }
  } else {
    status010 = "FAIL";
    reason010 = "Fails double-sided income band (>80% and ≤120% AMI). Both floor and ceiling must be confirmed.";
  }

  programs.push({ 
    id: "NY-010", 
    name: "FHLBNY HDP Plus", 
    status: status010,
    reasoning: reason010,
    subtitle: "Non-repayable grant · NY and NJ only · moderate income tier",
    tags: ["80-120% AMI band", "NY/NJ district only", "Annual rounds"],
    benefit: {
      label: "Up to $30k",
      description: "For moderate-income borrowers who earn too much for standard HDP. The only pilot program designed specifically for the 80–120% AMI band."
    },
    blocks: [
      { type: "THRESHOLD", label: "DOUBLE-SIDED INCOME BAND (UNIQUE IN PILOT)", text: "Income must be OVER 80% AMI but NOT exceed 120% AMI. This is the only program in the pilot with both an income floor and an income ceiling. Under 80% AMI = FAIL (use standard HDP instead). Over 120% AMI = FAIL. A borrower earning too little is also disqualified." },
      { type: "GEOGRAPHIC", label: "FHLBNY DISTRICT BOUNDARY", text: "Only available within the FHLBNY district — New York and New Jersey. Property outside the district = N/A. Puerto Rico and USVI have different income thresholds." },
      { type: "FUNDING", label: "MEMBER ENROLLMENT REQUIRED", text: "Annual round, first-come-first-served. Critically, not all FHLBNY members choose to offer HDP Plus. Must verify the borrower's lender has specifically enrolled in HDP Plus — not just HDP." },
      { type: "HARD STOP", label: "EXECUTED CONTRACT REQUIRED FIRST", text: "Cannot reserve without a signed purchase and sales contract. Same timing vulnerability as HDP — funds may be depleted before the borrower is under contract." },
      { type: "DOCUMENTATION", label: "DOCUMENTATION", text: "Homeownership counseling certificate required. Same documentation stack as standard HDP. $1,000 minimum equity contribution required." }
    ]
  });

  // NY-011 FHLBNY HDP Wealth Builder
  let status011 = "FAIL";
  let reason011 = "";
  if (numIncome <= 100000) {
    if (data.stackingHdp === "yes") {
      status011 = "PASS";
      reason011 = "Meets income cap and layering intention confirmed. Proceed with double reservation.";
    } else {
      status011 = "VERIFY";
      reason011 = "Meets income cap. Broker to clarify if borrower intends to stack with NY-009.";
    }
  } else {
    status011 = "FAIL";
    reason011 = "Fails 80% AMI household income cap required for foundation grant.";
  }

  programs.push({ 
    id: "NY-011", 
    name: "FHLBNY HDP Wealth Builder", 
    status: status011,
    reasoning: reason011,
    subtitle: "Stackable grant · statewide · wealth gap focus",
    tags: ["≤80% AMI household", "Must reside in district", "Stack timing risk"],
    benefit: {
      label: "Up to $30k",
      description: "Stackable on top of HDP for up to $60,000 in combined grants. Most powerful stacking combination in the pilot. Both grants require separate reservations secured simultaneously."
    },
    blocks: [
      { type: "HARD STOP", label: "CURRENT RESIDENCY IN DISTRICT", text: "Borrower must currently reside within the FHLBNY district. Designed for people already living in NY or NJ who are purchasing. Relocating from outside the district to purchase = FAIL even if the property is in New York." },
      { type: "THRESHOLD", label: "HOUSEHOLD INCOME", text: "≤80% AMI using total household income including all members 18+. Same household income definition as HDP — a non-borrowing adult's income counts toward the limit." },
      { type: "FUNDING", label: "DOUBLE STACK TIMING RISK", text: "Annual allotment per member, first-come-first-served. When stacked with HDP for up to $60,000 combined, both reservations must be secured simultaneously — two funding availability risks instead of one. Both require a signed purchase contract before reservation." },
      { type: "HARD STOP", label: "EXECUTED CONTRACT REQUIRED FIRST", text: "Cannot reserve without a signed purchase contract. Same constraint as HDP and HDP Plus." },
      { type: "POPULATION", label: "WEALTH GAP TARGETING", text: "Designed for households with historically challenged credit or housing market access. Not a hard numerical gate — assessed at lender and FHLBNY review level. Treat as VERIFY until lender confirms eligibility at submission." },
      { type: "DOCUMENTATION", label: "DOCUMENTATION", text: "Homeownership counseling certificate required. $1,000 minimum equity contribution same as HDP." }
    ]
  });

  // NY-012 NYC HomeFirst DPA
  let status012 = "FAIL";
  let reason012 = "";
  if (isNYC && numIncome <= 100000 && isFthb) {
    if (data.ownedWithin100Miles === "yes") {
      status012 = "FAIL";
      reason012 = "Hard disqualifier. 100-mile ownership rule violated.";
    } else {
      status012 = "PASS";
      reason012 = "Meets NYC geography, 80% AMI cap, and 100-mile rule. Proceed.";
    }
  } else {
    status012 = "FAIL";
    reason012 = "Fails 5 boroughs geography, 80% AMI cap, or FTHB requirement.";
  }

  programs.push({ 
    id: "NY-012", 
    name: "NYC HomeFirst DPA", 
    status: status012,
    reasoning: reason012,
    subtitle: "Forgivable loan · 5 boroughs only · largest single DPA in pilot",
    tags: ["5 boroughs only", "No mortgage brokers", "≤80% AMI household", "HPD counseling only"],
    benefit: {
      label: "Up to $100k",
      description: "Largest single DPA in the pilot. 20% of purchase price or $100k (whichever is less). Forgiven after 10 years for loans under $40k, 15 years for loans over $40k."
    },
    blocks: [
      { type: "GEOGRAPHIC", label: "5 BOROUGHS ABSOLUTE BOUNDARY", text: "Property must be in Brooklyn, Queens, Manhattan, Bronx, or Staten Island only. Nassau, Westchester, Long Island, New Jersey — all N/A. The most absolute geographic boundary in the pilot. No exceptions for proximity to city boundaries." },
      { type: "HARD STOP", label: "MORTGAGE BROKERS EXPLICITLY EXCLUDED", text: "Mortgage brokers are explicitly NOT permitted to originate the primary loan. The only program in the pilot with this restriction. Borrowers must work directly with an HPD-approved direct lender. Mortgage Quest brokers must refer to an approved lender — they cannot originate this loan themselves." },
      { type: "THRESHOLD", label: "HOUSEHOLD INCOME", text: "≤80% AMI using total household income. NYC 4-person 80% AMI ≈ $101,680. Non-borrowing household adults count. Income definition includes all sources — wages, pension, child support, investment income." },
      { type: "THRESHOLD", label: "MINIMUM OWN FUNDS (3%)", text: "Must contribute minimum 3% of purchase price from own funds. Higher than SONYMA's 1%. The 3% must come from the borrower's own verified savings. Zero cash = FAIL." },
      { type: "HARD STOP", label: "100-MILE PROPERTY OWNERSHIP RULE", text: "Cannot own or lease any other residential property within 100 miles of NYC. Not just primary residence — any residential property within a 100-mile radius. A weekend cabin in the Catskills or Poconos could disqualify. Broader than standard FTHB rules." },
      { type: "HARD STOP", label: "PROPERTY HQS INSPECTION", text: "Property must pass Housing Quality Standards inspection before purchase. A property that fails HQS = FAIL for this program regardless of borrower qualifications. Property condition is a separate disqualifier from borrower characteristics — the only program in the pilot with a property condition hard stop." },
      { type: "DOCUMENTATION", label: "HPD-SPECIFIC COUNSELING", text: "Must complete homebuyer education through an HPD-approved counseling agency specifically. A HUD-approved course from a non-HPD agency does not satisfy this requirement. HPD agency list is available on nyc.gov." },
      { type: "THRESHOLD", label: "DTI CAP", text: "Monthly DTI may not exceed 55%. More generous than standard underwriting but it is a stated hard cap. Over 55% DTI = FAIL on this program." }
    ]
  });

  // NY-013 Nassau County HOME DPA
  programs.push({ 
    id: "NY-013", 
    name: "Nassau County HOME DPA", 
    status: (isNassau && numIncome <= 110000) ? "VERIFY" : "FAIL",
    reasoning: (isNassau && numIncome <= 110000) ? "Meets Nassau County geography and 80% AMI cap. Verify municipality limits." : "Fails Nassau County geography or 80% AMI cap.",
    subtitle: "Forgivable loan · Nassau County only · single-family only",
    tags: ["Nassau County only", "≤80% AMI Nassau", "Single-family only", "$5k own funds min"],
    benefit: {
      label: "Up to $50k",
      description: "Significantly higher cap than most pilot programs. Forgivable loan. Nassau County single-family only. Administered through LIHP."
    },
    blocks: [
      { type: "GEOGRAPHIC", label: "NASSAU COUNTY BOUNDARY", text: "Property must be in Nassau County. Not Greater Long Island, not Suffolk County — Nassau County specifically. ZIP code lookup required. Some ZIP codes straddle county lines. Use the county boundary, not the mailing address." },
      { type: "HARD STOP", label: "PROPERTY TYPE", text: "Single-family homes only. Condominiums, co-ops, townhouses, and multi-family properties are not eligible. A borrower purchasing a Nassau condo = instant FAIL on this program regardless of all other qualifications. Property type check must come first." },
      { type: "THRESHOLD", label: "INCOME", text: "≤80% AMI using Nassau County tables. Nassau County AMI differs from NYC AMI. Nassau 4-person 80% AMI is higher than NYC. Must use the Nassau-specific table not the NYC table." },
      { type: "THRESHOLD", label: "MINIMUM OWN FUNDS ($5,000)", text: "Minimum $5,000 from borrower's own funds. Highest minimum cash requirement in the pilot. If borrower cannot independently source $5,000 = FAIL. This is 5× SONYMA's 1% floor on a $400k purchase." },
      { type: "HARD STOP", label: "EXCLUDED MUNICIPALITIES", text: "Certain municipalities within Nassau County are excluded from the program. Being in Nassau County is necessary but not sufficient — the specific address must clear the excluded-municipality list. VERIFY on this until address is confirmed against the exclusion list." },
      { type: "DOCUMENTATION", label: "DOCUMENTATION", text: "Homebuyer education certificate required. Application processed through Long Island Housing Partnership (LIHP) as agent for Nassau County — not submitted directly to the county." }
    ]
  });

  // NY-015 Suffolk County HOME DPA
  programs.push({ 
    id: "NY-015", 
    name: "Suffolk County HOME DPA", 
    status: (isSuffolk && numIncome <= 110000) ? "VERIFY" : "FAIL",
    reasoning: (isSuffolk && numIncome <= 110000) ? "Meets Suffolk County geography and 80% AMI cap. Verify deadline." : "Fails Suffolk County geography or 80% AMI cap.",
    subtitle: "Zero-interest deferred loan · Suffolk County only · deadline-based",
    tags: ["Suffolk County only", "≤80% AMI Suffolk", "Hard application deadline"],
    benefit: {
      label: "Up to $30k",
      description: "Zero-interest deferred loan. Forgiven after 10 years. Identical AMI structure to Nassau but different county tables, different application process, and a hard annual deadline."
    },
    blocks: [
      { type: "GEOGRAPHIC", label: "SUFFOLK COUNTY BOUNDARY", text: "Property must be in Suffolk County. Nassau County = FAIL (use NY-013 instead). Same geographic precision required — some addresses near the Nassau/Suffolk county line need verification. ZIP code alone is not sufficient." },
      { type: "THRESHOLD", label: "INCOME", text: "≤80% AMI using Suffolk County tables. Suffolk County AMI differs from Nassau AMI — must use the correct table. Total household income including all members 18+." },
      { type: "FUNDING", label: "HARD APPLICATION DEADLINE", text: "Suffolk County processes applications in order received by a specific annual deadline. The 2025 round had an April 1 postmark deadline. Missing the deadline = exclusion from that round entirely. Always verify the current deadline before presenting this program." },
      { type: "HARD STOP", label: "NO CURE FOR INCOMPLETE APPLICATION", text: "Incomplete applications are explicitly not considered and there is no opportunity to supplement after submission. This is the only program in the pilot with a stated no-cure policy. A single missing document at submission = automatic rejection for that round. Documentation must be 100% complete at submission." },
      { type: "DOCUMENTATION", label: "COMPLETE PACKAGE AT SUBMISSION", text: "Full documentation package required at application including income documentation for all household members 18+, homebuyer education certificate, and purchase contract. No second chances if anything is missing." }
    ]
  });

  // NY-021 City of Rochester HPAP
  let status021 = "FAIL";
  let reason021 = "";
  if (isRochester && numIncome <= 125000 && has640) {
    if (data.counselingBeforeOffer === "already_made_offer") {
      status021 = "FAIL";
      reason021 = "Sequence violated — borrower disqualified. Counseling must precede offer.";
    } else if (data.counselingBeforeOffer === "yes") {
      status021 = "PASS";
      reason021 = "Sequence requirement satisfied. Application may proceed.";
    } else {
      status021 = "VERIFY";
      reason021 = "Counseling must occur before any offer. Broker to arrange session first.";
    }
  } else {
    status021 = "FAIL";
    reason021 = "Fails Rochester city limits, 120% AMI cap, or 640 credit floor.";
  }

  programs.push({ 
    id: "NY-021", 
    name: "City of Rochester HPAP", 
    status: status021,
    reasoning: reason021,
    subtitle: "Closing cost grant · Rochester city limits only · highest income ceiling",
    tags: ["City limits only", "≤120% AMI", "640 floor", "Counseling before offer"],
    benefit: {
      label: "Up to $8k",
      description: "Smallest dollar amount in the pilot but highest income ceiling. Compatible with most other grant programs including FHLBNY HDP and SONYMA. Closing cost grant only."
    },
    blocks: [
      { type: "GEOGRAPHIC", label: "ROCHESTER CITY LIMITS (NOT METRO)", text: "Property must be within the city limits of Rochester, New York — not Monroe County, not the Rochester metro area. A property in Brighton, Pittsford, Greece, or any other suburban municipality does not qualify even if the mailing address says 'Rochester.' City limits boundary only." },
      { type: "HARD STOP", label: "COUNSELING BEFORE PURCHASE OFFER", text: "Borrower must submit a Homebuyer Services application and obtain eligibility paperwork through a virtual counselor meeting BEFORE executing a purchase offer. The only program in the pilot with this sequence requirement. If the borrower signs a contract before completing this step = program disqualification. Order of operations matters." },
      { type: "HARD STOP", label: "640 CREDIT FLOOR (HIGHEST IN PILOT)", text: "640 minimum credit score — 20 points above SONYMA's floor. A borrower with a 625–639 credit score gets a PASS on all five SONYMA programs but a hard FAIL on Rochester HPAP. The most commonly missed criterion gap in the entire pilot." },
      { type: "THRESHOLD", label: "INCOME (MOST GENEROUS IN PILOT)", text: "≤120% AMI — the highest income ceiling in the pilot. Rochester 4-person median income ≈ $103,900, so 120% ≈ $124,680. Many borrowers who FAIL income tests on NYC and FHLBNY programs may PASS here. Useful for borderline income borrowers purchasing in Rochester." },
      { type: "THRESHOLD", label: "MINIMUM OWN FUNDS", text: "Must contribute $1,500 of own funds toward the purchase. Low threshold but stated — zero liquid assets = FAIL." },
      { type: "DOCUMENTATION", label: "PRE AND POST TRAINING", text: "Must attend both pre-purchase AND post-purchase homebuyer training. Multi-family buyers also need Operating Rental Property training. Pre-purchase certification must be in place before submitting the offer — not after." }
    ]
  });

  return programs;
}
