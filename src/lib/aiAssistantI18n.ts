/**
 * AI Fault Assistant Multi-Language Support
 * Provides comprehensive translations for AI Assistant UI, status cards,
 * fault diagnostics, repair procedures, and 4-agent explanations.
 */

import type { LangCode } from "@/lib/i18n";
import type { FaultDiagnosis, RepairOption, FaultExplanation } from "@/lib/types";

export interface AssistantLabels {
  title: string;
  history: string;
  diagnose: string;
  rerunDiagnosis: string;
  back: string;
  runningLangGraph: string;
  runningDiagnosisText: string;
  agentAlpha: string;
  agentBeta: string;
  agentGamma: string;
  agentDelta: string;
  howWeDiagnosed: string;
  runDiagnosisBtn: string;
  operatingAdvisory: string;
  repairProcedure: string;
  inventoryCheck: string;
  criticality: string;
  artifacts: string;
  action: string;
  downtime: string;
  intermediate: string;
  permanent: string;
  part: string;
  tools: string;
  inWarehouse: string;
  notInWarehouse: string;
  pickFromStores: string;
  orderFromListings: string;
  emailSent: string;
  emailSentDesc: string;
  crmTicket: string;
  crmTicketDesc: string;
  low: string;
  severe: string;
  actNow: string;
  left: string;
  horizon14d: string;
  retryDiagnosis: string;
  serviceAlert: string;
  noSpare: string;
  noStock: string;
  pieces: string;
  piece: string;
  inBin: string;
}

export const ASSISTANT_LABELS: Record<LangCode, AssistantLabels> = {
  en: {
    title: "AI Assistant",
    history: "Diagnosis History",
    diagnose: "Diagnose",
    rerunDiagnosis: "Re-run 4-Agent LangGraph Diagnosis",
    back: "Back",
    runningLangGraph: "Running LangGraph",
    runningDiagnosisText: "Running 4-agent supervisory diagnosis on real-time telemetry…",
    agentAlpha: "Agent Alpha: Sensor cable & NAMUR loop verification",
    agentBeta: "Agent Beta: Power quality & thermal de-weathering",
    agentGamma: "Agent Gamma: ISO-13379 Prognostics & RUL",
    agentDelta: "Agent Delta: Prescriptive CMMS dispatch",
    howWeDiagnosed: "How we diagnosed",
    runDiagnosisBtn: "Run diagnosis",
    operatingAdvisory: "Operating Advisory",
    repairProcedure: "Repair procedure",
    inventoryCheck: "Inventory check",
    criticality: "Criticality",
    artifacts: "Artifacts",
    action: "Immediate Action / Triage",
    downtime: "Estimated Downtime",
    intermediate: "Intermediate",
    permanent: "Permanent",
    part: "Part",
    tools: "Tools",
    inWarehouse: "In warehouse",
    notInWarehouse: "Not in warehouse",
    pickFromStores: "pick from stores.",
    orderFromListings: "Order from the listings below.",
    emailSent: "An email has been sent",
    emailSentDesc: "The OEM inventory check went out.",
    crmTicket: "CRM ticket",
    crmTicketDesc: "Work order opened for maintenance tracking.",
    low: "Low",
    severe: "Severe",
    actNow: "Act now",
    left: "left",
    horizon14d: "14 d horizon",
    retryDiagnosis: "Retry Diagnosis",
    serviceAlert: "Diagnosis Service Alert",
    noSpare: "No spare to order",
    noStock: "No stock on the shelf.",
    pieces: "pieces",
    piece: "piece",
    inBin: "in",
  },
  hi: {
    title: "AI सहायक",
    history: "निदान इतिहास",
    diagnose: "निदान करें",
    rerunDiagnosis: "4-एजेंट लैंगग्राफ निदान पुनः चलाएं",
    back: "वापस",
    runningLangGraph: "लैंगग्राफ चल रहा है",
    runningDiagnosisText: "रीयल-टाइम टेलीमेट्री पर 4-एजेंट पर्यवेक्षी निदान चल रहा है…",
    agentAlpha: "एजेंट अल्फा: सेंसर केबल और NAMUR लूप सत्यापन",
    agentBeta: "एजेंट बीटा: पावर गुणवत्ता और थर्मल विश्लेषण",
    agentGamma: "एजेंट गामा: ISO-13379 पूर्वानुमान और RUL",
    agentDelta: "एजेंट डेल्टा: निर्देशात्मक CMMS प्रेषण",
    howWeDiagnosed: "हमने कैसे निदान किया",
    runDiagnosisBtn: "निदान चलाएं",
    operatingAdvisory: "परिचालन सलाह",
    repairProcedure: "मरम्मत प्रक्रिया",
    inventoryCheck: "इन्वेंट्री जांच",
    criticality: "गंभीरता",
    artifacts: "दोष प्रमाण",
    action: "तात्कालिक कार्रवाई / ट्राइएज",
    downtime: "अनुमानित डाउनटाइम",
    intermediate: "मध्यवर्ती",
    permanent: "स्थायी",
    part: "पुर्जा",
    tools: "उपकरण",
    inWarehouse: "गोदाम में उपलब्ध",
    notInWarehouse: "गोदाम में उपलब्ध नहीं",
    pickFromStores: "स्टोर से निकालें।",
    orderFromListings: "नीचे दी गई सूची से ऑर्डर करें।",
    emailSent: "ईमेल भेज दिया गया है",
    emailSentDesc: "OEM इन्वेंट्री जांच ईमेल भेजा गया।",
    crmTicket: "CRM टिकट",
    crmTicketDesc: "रखरखाव ट्रैकिंग के लिए वर्क ऑर्डर खोला गया।",
    low: "कम",
    severe: "अत्यधिक गंभीर",
    actNow: "तुरंत कार्रवाई करें",
    left: "शेष",
    horizon14d: "14 दिन का क्षितिज",
    retryDiagnosis: "निदान पुनः प्रयास करें",
    serviceAlert: "निदान सेवा चेतावनी",
    noSpare: "ऑर्डर करने के लिए कोई स्पेयर पार्ट नहीं",
    noStock: "शेल्फ पर कोई स्टॉक नहीं है।",
    pieces: "पीस",
    piece: "पीस",
    inBin: "बिन में",
  },
  ta: {
    title: "AI உதவியாளர்",
    history: "பரிசோதனை வரலாறு",
    diagnose: "பரிசோதி",
    rerunDiagnosis: "4-முகவர் LangGraph பரிசோதனையை மீண்டும் இயக்கு",
    back: "பின்னால்",
    runningLangGraph: "LangGraph இயங்குகிறது",
    runningDiagnosisText: "நிகழ்நேர டெலிமெட்ரியில் 4-முகவர் மேற்பார்வை பரிசோதனை இயங்குகிறது…",
    agentAlpha: "முகவர் ஆல்பா: சென்சார் கேபிள் மற்றும் NAMUR லூப் சரிபார்ப்பு",
    agentBeta: "முகவர் பீட்டா: மின் தரம் மற்றும் வெப்ப ஆய்வு",
    agentGamma: "முகவர் காமா: ISO-13379 முன்கணிப்பு & RUL",
    agentDelta: "முகவர் டெல்டா: CMMS பணி ஒதுக்கீடு",
    howWeDiagnosed: "நாங்கள் எவ்வாறு பரிசோதித்தோம்",
    runDiagnosisBtn: "பரிசோதனையை இயக்கு",
    operatingAdvisory: "செயல்பாட்டு ஆலோசனை",
    repairProcedure: "பழுதுபார்க்கும் நடைமுறை",
    inventoryCheck: "இருப்பு சரிபார்ப்பு",
    criticality: "முக்கியத்துவம்",
    artifacts: "ஆதாரங்கள்",
    action: "உடனடி நடவடிக்கை / ட்ரையேஜ்",
    downtime: "மதிப்பிடப்பட்ட பணிநிறுத்த நேரம்",
    intermediate: "இடைக்கால",
    permanent: "நிலையான",
    part: "பாகம்",
    tools: "கருவிகள்",
    inWarehouse: "கிடங்கில் உள்ளது",
    notInWarehouse: "கிடங்கில் இல்லை",
    pickFromStores: "இருப்பிலிருந்து எடுக்கவும்.",
    orderFromListings: "கீழே உள்ள பட்டியலிலிருந்து ஆர்டர் செய்யவும்.",
    emailSent: "மின்னஞ்சல் அனுப்பப்பட்டது",
    emailSentDesc: "OEM இருப்பு சரிபார்ப்பு அனுப்பப்பட்டது.",
    crmTicket: "CRM டிக்கெட்",
    crmTicketDesc: "பராமரிப்பு கண்காணிப்புக்காக பணி ஆணை திறக்கப்பட்டது.",
    low: "குறைவு",
    severe: "தீவிரமானது",
    actNow: "உடனே செயல்படுங்கள்",
    left: "மீதம்",
    horizon14d: "14 நாட்கள் எல்லை",
    retryDiagnosis: "மீண்டும் முயற்சிக்கவும்",
    serviceAlert: "பரிசோதனை சேவை எச்சரிக்கை",
    noSpare: "ஆர்டர் செய்ய உதிரிபாகம் இல்லை",
    noStock: "இருப்பில் எதுவும் இல்லை.",
    pieces: "எண்ணிக்கை",
    piece: "எண்ணிக்கை",
    inBin: "பின்",
  },
  te: {
    title: "AI సహాయకుడు",
    history: "రోగ నిర్ధారణ చరిత్ర",
    diagnose: "నిర్ధారించు",
    rerunDiagnosis: "4-ఏజెంట్ రోగ నిర్ధారణ మళ్లీ అమలు చేయండి",
    back: "వెనుకకు",
    runningLangGraph: "LangGraph నడుస్తోంది",
    runningDiagnosisText: "రియల్-టైమ్ టెలిమెట్రీపై 4-ఏజెంట్ పర్యవేక్షణ నడుస్తోంది…",
    agentAlpha: "ఏజెంట్ ఆల్ఫా: సెన్సార్ కేబుల్ ధృవీకరణ",
    agentBeta: "ఏజెంట్ బీటా: పవర్ నాణ్యత విశ్లేషణ",
    agentGamma: "ఏజెంట్ గామా: ISO-13379 అంచనా & RUL",
    agentDelta: "ఏజెంట్ డెల్టా: CMMS పంపిణీ",
    howWeDiagnosed: "మేము ఎలా నిర్ధారించాము",
    runDiagnosisBtn: "నిర్ధారణ ప్రారంభించు",
    operatingAdvisory: "కార్యాచరణ సలహా",
    repairProcedure: "మరమ్మతు విధానం",
    inventoryCheck: "జాబితా తనిఖీ",
    criticality: "తీవ్రత",
    artifacts: "ఆధారాలు",
    action: "తక్షణ చర్య",
    downtime: "డౌన్‌టైమ్ అంచనా",
    intermediate: "మధ్యంతర",
    permanent: "శాశ్వత",
    part: "భాగం",
    tools: "పరికరాలు",
    inWarehouse: "గిడ్డంగిలో ఉంది",
    notInWarehouse: "గిడ్డంగిలో లేదు",
    pickFromStores: "స్టోర్స్ నుండి తీసుకోండి.",
    orderFromListings: "కింది జాబితా నుండి ఆర్డర్ చేయండి.",
    emailSent: "ఇమెయిల్ పంపబడింది",
    emailSentDesc: "OEM జాబితా తనిఖీ పంపబడింది.",
    crmTicket: "CRM టికెట్",
    crmTicketDesc: "వర్క్ ఆర్డర్ తెరవబడింది.",
    low: "తక్కువ",
    severe: "తీవ్రమైన",
    actNow: "ఇప్పుడే చర్య తీసుకోండి",
    left: "మిగిలి ఉంది",
    horizon14d: "14 రోజుల పరిమితి",
    retryDiagnosis: "మళ్లీ ప్రయత్నించండి",
    serviceAlert: "నిర్ధారణ హెచ్చరిక",
    noSpare: "స్పేర్ పార్ట్ అవసరం లేదు",
    noStock: "స్టాక్ లేదు.",
    pieces: "ముక్కలు",
    piece: "ముక్క",
    inBin: "బిన్‌లో",
  },
  bn: {
    title: "AI সহকারী",
    history: "রোগ নির্ণয়ের ইতিহাস",
    diagnose: "নির্ণয় করুন",
    rerunDiagnosis: "৪-এজেন্ট ডায়াগনসিস পুনরায় চালান",
    back: "ফিরে যান",
    runningLangGraph: "ল্যাংগ্রাফ চলছে",
    runningDiagnosisText: "রিয়েল-টাইম টেলিমেট্রিতে ৪-এজেন্ট ডায়াগনসিস চলছে…",
    agentAlpha: "এজেন্ট আলফা: সেন্সর কেবল যাচাইকরণ",
    agentBeta: "এজেন্ট বিটা: শক্তি গুণমান বিশ্লেষণ",
    agentGamma: "এজেন্ট গামা: ISO-13379 পূর্বাভাস এবং RUL",
    agentDelta: "এজেন্ট ডেল্টা: CMMS প্রেরণ",
    howWeDiagnosed: "আমরা কীভাবে নির্ণয় করেছি",
    runDiagnosisBtn: "নির্ণয় চালান",
    operatingAdvisory: "অপারেটিং পরামর্শ",
    repairProcedure: "মেরামত প্রক্রিয়া",
    inventoryCheck: "ইনভেন্টরি চেক",
    criticality: "গুরুত্ব",
    artifacts: "প্রমাণ",
    action: "তাৎক্ষণিক পদক্ষেপ",
    downtime: "আনুমানিক ডাউনটাইম",
    intermediate: "মধ্যবর্তী",
    permanent: "স্থায়ী",
    part: "অংশ",
    tools: "সরঞ্জাম",
    inWarehouse: "গুদামে উপলব্ধ",
    notInWarehouse: "গুদামে নেই",
    pickFromStores: "স্টোর থেকে নিন।",
    orderFromListings: "নিচের তালিকা থেকে অর্ডার করুন।",
    emailSent: "ইমেল পাঠানো হয়েছে",
    emailSentDesc: "OEM ইনভেন্টরি যাচাইকরণ পাঠানো হয়েছে।",
    crmTicket: "CRM টিকিট",
    crmTicketDesc: "ওয়ার্ক অর্ডার খোলা হয়েছে।",
    low: "কম",
    severe: "মারাত্মক",
    actNow: "এখনই কাজ করুন",
    left: "বাকি",
    horizon14d: "১৪ দিনের সময়সীমা",
    retryDiagnosis: "আবার চেষ্টা করুন",
    serviceAlert: "পরিষেবা সতর্কতা",
    noSpare: "কোন অতিরিক্ত অংশ নেই",
    noStock: "স্টক নেই।",
    pieces: "পিস",
    piece: "পিস",
    inBin: "বিনে",
  },
  mr: {
    title: "AI सहाय्यक",
    history: "निदान इतिहास",
    diagnose: "निदान करा",
    rerunDiagnosis: "४-एजंट निदान पुन्हा चालवा",
    back: "मागे",
    runningLangGraph: "LangGraph चालू आहे",
    runningDiagnosisText: "रिअल-टाइम टेलिमेट्रीवर ४-एजंट पर्यवेक्षी निदान सुरू आहे…",
    agentAlpha: "एजंट अल्फा: सेन्सर केबल पडताळणी",
    agentBeta: "एजंट बीटा: ऊर्जा गुणवत्ता विश्लेषण",
    agentGamma: "एजंट गॅमा: ISO-13379 अंदाज आणि RUL",
    agentDelta: "एजंट डेल्टा: CMMS प्रेषण",
    howWeDiagnosed: "आम्ही कसे निदान केले",
    runDiagnosisBtn: "निदान सुरू करा",
    operatingAdvisory: "ऑपरेटिंग सल्ला",
    repairProcedure: "दुरुस्ती प्रक्रिया",
    inventoryCheck: "इन्व्हेंटरी तपासणी",
    criticality: "तीव्रता",
    artifacts: "दोष पुरावे",
    action: "तात्काळ कारवाई",
    downtime: "अंदाजे डाउनटाइम",
    intermediate: "मध्यवर्ती",
    permanent: "कायमस्वरूपी",
    part: "भाग",
    tools: "साधने",
    inWarehouse: "गोदामात उपलब्ध",
    notInWarehouse: "गोदामात उपलब्ध नाही",
    pickFromStores: "स्टोअरमधून घ्या.",
    orderFromListings: "खालील यादीवरून ऑर्डर करा.",
    emailSent: "ईमेल पाठवला आहे",
    emailSentDesc: "OEM इन्व्हेंटरी ईमेल पाठवला.",
    crmTicket: "CRM तिकीट",
    crmTicketDesc: "वर्क ऑर्डर उघडली आहे.",
    low: "कमी",
    severe: "अत्यंत गंभीर",
    actNow: "त्वरित कारवाई करा",
    left: "शिल्लक",
    horizon14d: "१४ दिवसांची मर्यादा",
    retryDiagnosis: "पुन्हा प्रयत्न करा",
    serviceAlert: "निदान सेवा इशारा",
    noSpare: "स्पेअर पार्ट उपलब्ध नाही",
    noStock: "स्टॉक उपलब्ध नाही.",
    pieces: "नग",
    piece: "नग",
    inBin: "बिनमध्ये",
  },
  gu: {
    title: "AI સહાયક",
    history: "નિદાન ઇતિહાસ",
    diagnose: "નિદાન કરો",
    rerunDiagnosis: "4-એજન્ટ નિદાન ફરી ચલાવો",
    back: "પાછળ",
    runningLangGraph: "LangGraph ચાલી રહ્યું છે",
    runningDiagnosisText: "રીઅલ-ટાઇમ ટેલિમેટ્રી પર 4-એજન્ટ નિરીક્ષણ ચાલી રહ્યું છે…",
    agentAlpha: "એજન્ટ આલ્ફા: સેન્સર કેબલ ચકાસણી",
    agentBeta: "એજન્ટ બીટા: પાવર ગુણવત્તા વિશ્લેષણ",
    agentGamma: "એજન્ટ ગામા: ISO-13379 પૂર્વાનુમાન અને RUL",
    agentDelta: "એજન્ટ ડેલ્ટા: CMMS કાર્ય આદેશ",
    howWeDiagnosed: "અમે કેવી રીતે નિદાન કર્યું",
    runDiagnosisBtn: "નિદાન ચલાવો",
    operatingAdvisory: "ઓપરેટિંગ સલાહ",
    repairProcedure: "સમારકામ પ્રક્રિયા",
    inventoryCheck: "ઇન્વેન્ટરી ચકાસણી",
    criticality: "તીવ્રતા",
    artifacts: "પુરાવા",
    action: "તાત્કાલિક પગલાં",
    downtime: "અંદાજિત ડાઉનટાઇમ",
    intermediate: "મધ્યવર્તી",
    permanent: "કાયમી",
    part: "ભાગ",
    tools: "સાધનો",
    inWarehouse: "ગોદામમાં ઉપલબ્ધ",
    notInWarehouse: "ગોદામમાં ઉપલબ્ધ નથી",
    pickFromStores: "સ્ટોરમાંથી પસંદ કરો.",
    orderFromListings: "નીચેની યાદીમાંથી ઓર્ડર કરો.",
    emailSent: "ઇમેઇલ મોકલ્યો છે",
    emailSentDesc: "OEM ઇન્વેન્ટરી ઇમેઇલ મોકલાયો.",
    crmTicket: "CRM ટિકિટ",
    crmTicketDesc: "વર્ક ઓર્ડર બનાવ્યો છે.",
    low: "ઓછી",
    severe: "અત્યંત ગંભીર",
    actNow: "હમણાં જ પગલાં લો",
    left: "બાકી",
    horizon14d: "14 દિવસની મર્યાદા",
    retryDiagnosis: "ફરી પ્રયાસ કરો",
    serviceAlert: "નિદાન ચેતવણી",
    noSpare: "સ્પેરપાર્ટની જરૂર નથી",
    noStock: "શેલ્ફ પર કોઈ સ્ટોક નથી.",
    pieces: "પીસ",
    piece: "પીસ",
    inBin: "બિનમાં",
  },
  de: {
    title: "KI-Assistent",
    history: "Diagnoseverlauf",
    diagnose: "Diagnostizieren",
    rerunDiagnosis: "4-Agenten LangGraph Diagnose erneut ausführen",
    back: "Zurück",
    runningLangGraph: "LangGraph läuft",
    runningDiagnosisText: "4-Agenten-Überwachungsdiagnose auf Echtzeit-Telemetrie läuft…",
    agentAlpha: "Agent Alpha: Sensorkabel & NAMUR-Schleifenprüfung",
    agentBeta: "Agent Beta: Netzqualität & thermische Entwitterung",
    agentGamma: "Agent Gamma: ISO-13379 Prognose & RUL",
    agentDelta: "Agent Delta: Präskriptive CMMS-Meldung",
    howWeDiagnosed: "Wie wir diagnostiziert haben",
    runDiagnosisBtn: "Diagnose ausführen",
    operatingAdvisory: "Betriebsempfehlung",
    repairProcedure: "Reparaturverfahren",
    inventoryCheck: "Bestandsprüfung",
    criticality: "Kritikalität",
    artifacts: "Beweise",
    action: "Sofortige Maßnahme / Triage",
    downtime: "Geschätzte Ausfallzeit",
    intermediate: "Vorläufig",
    permanent: "Dauerhaft",
    part: "Teil",
    tools: "Werkzeuge",
    inWarehouse: "Im Lager vorhanden",
    notInWarehouse: "Nicht im Lager",
    pickFromStores: "Aus Lager entnehmen.",
    orderFromListings: "Aus der Liste unten bestellen.",
    emailSent: "Eine E-Mail wurde gesendet",
    emailSentDesc: "OEM-Bestandsanfrage wurde versendet.",
    crmTicket: "CRM-Ticket",
    crmTicketDesc: "Arbeitsauftrag im Wartungssystem erfasst.",
    low: "Niedrig",
    severe: "Schwerwiegend",
    actNow: "Jetzt handeln",
    left: "übrig",
    horizon14d: "14-Tage-Horizont",
    retryDiagnosis: "Diagnose wiederholen",
    serviceAlert: "Diagnosedienst-Warnung",
    noSpare: "Kein Ersatzteil erforderlich",
    noStock: "Kein Bestand im Regal.",
    pieces: "Stück",
    piece: "Stück",
    inBin: "in",
  },
  fr: {
    title: "Assistant IA",
    history: "Historique des diagnostics",
    diagnose: "Diagnostiquer",
    rerunDiagnosis: "Relancer le diagnostic LangGraph à 4 agents",
    back: "Retour",
    runningLangGraph: "LangGraph en cours",
    runningDiagnosisText: "Diagnostic de supervision à 4 agents sur télémétrie temps réel…",
    agentAlpha: "Agent Alpha: Câble capteur & boucle NAMUR",
    agentBeta: "Agent Bêta: Qualité de l'énergie & dé-météorisation",
    agentGamma: "Agent Gamma: Pronostic ISO-13379 & RUL",
    agentDelta: "Agent Delta: Envoi d'ordre CMMS",
    howWeDiagnosed: "Comment nous avons diagnostiqué",
    runDiagnosisBtn: "Lancer le diagnostic",
    operatingAdvisory: "Avis opérationnel",
    repairProcedure: "Procédure de réparation",
    inventoryCheck: "Vérification des stocks",
    criticality: "Criticité",
    artifacts: "Artefacts",
    action: "Action immédiate / Triage",
    downtime: "Temps d'arrêt estimé",
    intermediate: "Intermédiaire",
    permanent: "Permanent",
    part: "Pièce",
    tools: "Outils",
    inWarehouse: "En stock",
    notInWarehouse: "Rupture de stock",
    pickFromStores: "Prélever dans le stock.",
    orderFromListings: "Commander via les offres ci-dessous.",
    emailSent: "Un e-mail a été envoyé",
    emailSentDesc: "La vérification du stock OEM a été envoyée.",
    crmTicket: "Ticket CRM",
    crmTicketDesc: "Ordre de travail ouvert dans la GMAO.",
    low: "Faible",
    severe: "Sévère",
    actNow: "Agir maintenant",
    left: "restant",
    horizon14d: "Horizon 14 j",
    retryDiagnosis: "Réessayer le diagnostic",
    serviceAlert: "Alerte de diagnostic",
    noSpare: "Aucune pièce à commander",
    noStock: "Aucun stock en rayon.",
    pieces: "pièces",
    piece: "pièce",
    inBin: "dans",
  },
  es: {
    title: "Asistente IA",
    history: "Historial de diagnósticos",
    diagnose: "Diagnosticar",
    rerunDiagnosis: "Reejecutar diagnóstico LangGraph de 4 agentes",
    back: "Atrás",
    runningLangGraph: "Ejecutando LangGraph",
    runningDiagnosisText: "Ejecutando diagnóstico supervisor de 4 agentes en telemetría en tiempo real…",
    agentAlpha: "Agente Alfa: Cable de sensor y bucle NAMUR",
    agentBeta: "Agente Beta: Calidad de energía y análisis térmico",
    agentGamma: "Agente Gamma: Pronóstico ISO-13379 y RUL",
    agentDelta: "Agente Delta: Despacho CMMS prescriptivo",
    howWeDiagnosed: "Cómo diagnosticamos",
    runDiagnosisBtn: "Ejecutar diagnóstico",
    operatingAdvisory: "Aviso de operación",
    repairProcedure: "Procedimiento de reparación",
    inventoryCheck: "Control de inventario",
    criticality: "Criticidad",
    artifacts: "Artefactos",
    action: "Acción inmediata / Triaje",
    downtime: "Tiempo de inactividad estimado",
    intermediate: "Intermedio",
    permanent: "Permanente",
    part: "Pieza",
    tools: "Herramientas",
    inWarehouse: "En almacén",
    notInWarehouse: "No disponible en almacén",
    pickFromStores: "Recoger del almacén.",
    orderFromListings: "Pedir de los proveedores siguientes.",
    emailSent: "Se ha enviado un correo electrónico",
    emailSentDesc: "Se envió consulta de stock al OEM.",
    crmTicket: "Ticket CRM",
    crmTicketDesc: "Orden de trabajo abierta en el sistema.",
    low: "Bajo",
    severe: "Grave",
    actNow: "Actuar ahora",
    left: "restante",
    horizon14d: "Horizonte de 14 d",
    retryDiagnosis: "Reintentar diagnóstico",
    serviceAlert: "Alerta del servicio de diagnóstico",
    noSpare: "No se requiere repuesto mecánico",
    noStock: "Sin stock en estantería.",
    pieces: "piezas",
    piece: "pieza",
    inBin: "en",
  },
  it: {
    title: "Assistente IA",
    history: "Cronologia diagnosi",
    diagnose: "Diagnostica",
    rerunDiagnosis: "Riesegui diagnosi LangGraph a 4 agenti",
    back: "Indietro",
    runningLangGraph: "LangGraph in esecuzione",
    runningDiagnosisText: "Esecuzione diagnosi a 4 agenti su telemetria in tempo reale…",
    agentAlpha: "Agente Alfa: Cavo sensore & loop NAMUR",
    agentBeta: "Agente Beta: Qualità alimentazione & meteo",
    agentGamma: "Agente Gamma: Prognostica ISO-13379 & RUL",
    agentDelta: "Agente Delta: Invio ordine CMMS",
    howWeDiagnosed: "Come abbiamo diagnosticato",
    runDiagnosisBtn: "Esegui diagnosi",
    operatingAdvisory: "Avviso operativo",
    repairProcedure: "Procedura di riparazione",
    inventoryCheck: "Verifica inventario",
    criticality: "Criticità",
    artifacts: "Evidenze",
    action: "Azione immediata / Triage",
    downtime: "Tempo di fermo stimato",
    intermediate: "Intermedio",
    permanent: "Permanente",
    part: "Componente",
    tools: "Strumenti",
    inWarehouse: "In magazzino",
    notInWarehouse: "Non in magazzino",
    pickFromStores: "Prelevare dal magazzino.",
    orderFromListings: "Ordinare dai fornitori sotto.",
    emailSent: "Un'email è stata inviata",
    emailSentDesc: "Richiesta stock OEM inviata.",
    crmTicket: "Ticket CRM",
    crmTicketDesc: "Ordine di lavoro aperto.",
    low: "Basso",
    severe: "Grave",
    actNow: "Agisci ora",
    left: "rimasti",
    horizon14d: "Orizzonte 14 gg",
    retryDiagnosis: "Riprova diagnosi",
    serviceAlert: "Avviso servizio diagnosi",
    noSpare: "Nessun ricambio da ordinare",
    noStock: "Nessuna scorta a scaffale.",
    pieces: "pezzi",
    piece: "pezzo",
    inBin: "in",
  },
  pt: {
    title: "Assistente IA",
    history: "Histórico de diagnósticos",
    diagnose: "Diagnosticar",
    rerunDiagnosis: "Reexecutar diagnóstico LangGraph de 4 agentes",
    back: "Voltar",
    runningLangGraph: "LangGraph em execução",
    runningDiagnosisText: "Executando diagnóstico de supervisão de 4 agentes em tempo real…",
    agentAlpha: "Agente Alfa: Cabo do sensor e loop NAMUR",
    agentBeta: "Agente Beta: Qualidade da energia e análise térmica",
    agentGamma: "Agente Gamma: Prognóstico ISO-13379 e RUL",
    agentDelta: "Agente Delta: Despacho CMMS prescritivo",
    howWeDiagnosed: "Como diagnosticamos",
    runDiagnosisBtn: "Executar diagnóstico",
    operatingAdvisory: "Aviso operacional",
    repairProcedure: "Procedimento de reparo",
    inventoryCheck: "Verificação de estoque",
    criticality: "Criticidade",
    artifacts: "Evidências",
    action: "Ação imediata / Triagem",
    downtime: "Tempo de inatividade estimado",
    intermediate: "Intermediário",
    permanent: "Permanente",
    part: "Peça",
    tools: "Ferramentas",
    inWarehouse: "No estoque",
    notInWarehouse: "Sem estoque",
    pickFromStores: "Retirar do almoxarifado.",
    orderFromListings: "Pedir dos fornecedores abaixo.",
    emailSent: "Um e-mail foi enviado",
    emailSentDesc: "A consulta ao fabricante foi enviada.",
    crmTicket: "Ticket CRM",
    crmTicketDesc: "Ordem de serviço aberta.",
    low: "Baixo",
    severe: "Grave",
    actNow: "Aja agora",
    left: "restantes",
    horizon14d: "Horizonte de 14 d",
    retryDiagnosis: "Tentar diagnóstico novamente",
    serviceAlert: "Alerta do serviço de diagnóstico",
    noSpare: "Nenhum sobressalente necessário",
    noStock: "Sem estoque na prateleira.",
    pieces: "peças",
    piece: "peça",
    inBin: "em",
  },
  nl: {
    title: "AI Assistent",
    history: "Diagnosegeschiedenis",
    diagnose: "Diagnosticeer",
    rerunDiagnosis: "Voer 4-agent LangGraph diagnose opnieuw uit",
    back: "Terug",
    runningLangGraph: "LangGraph actief",
    runningDiagnosisText: "4-agent supervisiediagnose op live telemetrie…",
    agentAlpha: "Agent Alpha: Sensorkabel & NAMUR-luscontrole",
    agentBeta: "Agent Beta: Stroomkwaliteit & thermische analyse",
    agentGamma: "Agent Gamma: ISO-13379 prognose & RUL",
    agentDelta: "Agent Delta: Voorschrijvend CMMS werkorder",
    howWeDiagnosed: "Hoe we hebben gediagnosticeerd",
    runDiagnosisBtn: "Start diagnose",
    operatingAdvisory: "Operationeel advies",
    repairProcedure: "Reparatieprocedure",
    inventoryCheck: "Voorraadcontrole",
    criticality: "Kriticiteit",
    artifacts: "Bewijs",
    action: "Onmiddellijke actie / Triage",
    downtime: "Geschatte uitvaltijd",
    intermediate: "Tijdelijk",
    permanent: "Permanent",
    part: "Onderdeel",
    tools: "Gereedschap",
    inWarehouse: "Op voorraad",
    notInWarehouse: "Niet op voorraad",
    pickFromStores: "Ophalen uit magazijn.",
    orderFromListings: "Bestel via onderstaande leveranciers.",
    emailSent: "Een e-mail is verzonden",
    emailSentDesc: "OEM voorraadcheck is verstuurd.",
    crmTicket: "CRM ticket",
    crmTicketDesc: "Werkorder aangemaakt in onderhoudssysteem.",
    low: "Laag",
    severe: "Ernstig",
    actNow: "Handel nu",
    left: "over",
    horizon14d: "14 d horizon",
    retryDiagnosis: "Diagnose opnieuw proberen",
    serviceAlert: "Diagnosedienst waarschuwing",
    noSpare: "Geen vervangend onderdeel nodig",
    noStock: "Geen voorraad op de plank.",
    pieces: "stuks",
    piece: "stuk",
    inBin: "in",
  },
  pl: {
    title: "Asystent AI",
    history: "Historia diagnoz",
    diagnose: "Diagnozuj",
    rerunDiagnosis: "Uruchom ponownie diagnozę LangGraph 4 agentów",
    back: "Wstecz",
    runningLangGraph: "LangGraph działa",
    runningDiagnosisText: "Uruchamianie diagnozy 4 agentów na telemetrii w czasie rzeczywistym…",
    agentAlpha: "Agent Alfa: Kabel czujnika i pętla NAMUR",
    agentBeta: "Agent Beta: Jakość zasilania i analiza termiczna",
    agentGamma: "Agent Gamma: Prognoza ISO-13379 i RUL",
    agentDelta: "Agent Delta: Dyspozycja zlecenia CMMS",
    howWeDiagnosed: "Jak zdiagnozowaliśmy",
    runDiagnosisBtn: "Uruchom diagnozę",
    operatingAdvisory: "Zalecenie operacyjne",
    repairProcedure: "Procedura naprawy",
    inventoryCheck: "Sprawdzenie magazynu",
    criticality: "Krytyczność",
    artifacts: "Dowody",
    action: "Działanie natychmiastowe / Triaż",
    downtime: "Szacowany czas przestoju",
    intermediate: "Tymczasowa",
    permanent: "Trwała",
    part: "Część",
    tools: "Narzędzia",
    inWarehouse: "W magazynie",
    notInWarehouse: "Brak w magazynie",
    pickFromStores: "Pobierz z magazynu.",
    orderFromListings: "Zamów z poniższych ofert.",
    emailSent: "Wysłano wiadomość e-mail",
    emailSentDesc: "Zapytanie do producenta OEM zostało wysłane.",
    crmTicket: "Zgłoszenie CRM",
    crmTicketDesc: "Zlecenie otwarte w systemie.",
    low: "Niska",
    severe: "Poważna",
    actNow: "Działaj teraz",
    left: "pozostało",
    horizon14d: "Horyzont 14 dni",
    retryDiagnosis: "Ponów diagnozę",
    serviceAlert: "Ostrzeżenie usługi diagnostycznej",
    noSpare: "Brak części do zamówienia",
    noStock: "Brak zapasów na półce.",
    pieces: "szt.",
    piece: "szt.",
    inBin: "w",
  },
};

export function getAssistantLabels(lang: LangCode): AssistantLabels {
  return ASSISTANT_LABELS[lang] ?? ASSISTANT_LABELS.en;
}

/* ─────────────────────────────────────────────────────────────────────────────
 * NOMINAL & IDLE STATE LOCALIZATION
 * ───────────────────────────────────────────────────────────────────────────── */

export function getNormalDiagnosis(lang: LangCode, machineId: string = "machine"): FaultDiagnosis {
  const translations: Record<LangCode, { headline: string; summary: string; actions: string[] }> = {
    en: {
      headline: "All monitored parameters normal",
      summary: "All sensor readings and physical parameters are within normal operating thresholds. No active alert breaches detected across the 4-agent supervisory pipeline.",
      actions: [
        "Continue 24/7 continuous autonomous telemetry monitoring.",
        "Maintain standard lubrication schedule according to OEM guidelines.",
      ],
    },
    hi: {
      headline: "सभी निगरानी किए गए पैरामीटर सामान्य हैं",
      summary: "सभी सेंसर रीडिंग और भौतिक पैरामीटर सामान्य ऑपरेटिंग सीमा के भीतर हैं। 4-एजेंट पर्यवेक्षी पाइपलाइन में कोई सक्रिय अलर्ट उल्लंघन नहीं पाया गया।",
      actions: [
        "24/7 निरंतर स्वायत्त टेलीमेट्री निगरानी जारी रखें।",
        "OEM दिशानिर्देशों के अनुसार मानक स्नेहन (लुब्रिकेशन) अनुसूची बनाए रखें।",
      ],
    },
    ta: {
      headline: "அனைத்து அளவீடுகளும் இயல்பாக உள்ளன",
      summary: "அனைத்து சென்சார் அளவீடுகளும் இயல்பான வரம்பிற்குள் உள்ளன. 4-முகவர் அமைப்பில் எந்த எச்சரிக்கைகளும் கண்டறியப்படவில்லை.",
      actions: [
        "24/7 தொடர்ச்சியான தானியங்கி கண்காணிப்பைத் தொடரவும்.",
        "OEM வழிகாட்டுதல்களின்படி வழக்கமான உயவு அட்டவணையைப் பராமரிக்கவும்.",
      ],
    },
    te: {
      headline: "అన్ని పారామితులు సాధారణంగా ఉన్నాయి",
      summary: "అన్ని సెన్సార్ రీడింగ్‌లు సాధారణ పరిధిలో ఉన్నాయి. ఎటువంటి లోపాలు కనుగొనబడలేదు.",
      actions: [
        "24/7 నిరంతర టెలిమెట్రీ పర్యవేక్షణను కొనసాగించండి.",
        "OEM మార్గదర్శకాల ప్రకారం సరళత షెడ్యూల్‌ను నిర్వహించండి.",
      ],
    },
    bn: {
      headline: "সমস্ত পরামিতি স্বাভাবিক রয়েছে",
      summary: "সমস্ত সেন্সর রিডিং স্বাভাবিক সীমার মধ্যে রয়েছে। কোনও সক্রিয় ত্রুটি ধরা পড়েনি।",
      actions: [
        "২৪/৭ অবিচ্ছিন্ন স্বায়ত্তশাসিত নজরদারি চালিয়ে যান।",
        "OEM নির্দেশিকা অনুযায়ী নিয়মিত তৈলাক্তকরণ বজায় রাখুন।",
      ],
    },
    mr: {
      headline: "सर्व निरीक्षण केलेले मापदंड सामान्य आहेत",
      summary: "सर्व सेन्सर वाचन आणि मापदंड सामान्य मर्यादेत आहेत. कोणतीही चेतावणी आढळली नाही.",
      actions: [
        "२४/७ अखंडित स्वयंचलित टेलिमेट्री देखरेख सुरू ठेवा.",
        "OEM मार्गदर्शक तत्त्वांनुसार स्नेहन वेळापत्रक राखणे.",
      ],
    },
    gu: {
      headline: "બધા નિરીક્ષણ કરેલા પરિમાણો સામાન્ય છે",
      summary: "બધા સેન્સર રીડિંગ્સ સામાન્ય મર્યાદામાં છે. કોઈ સક્રિય ચેતવણી મળી નથી.",
      actions: [
        "24/7 સતત સ્વાયત્ત ટેલિમેટ્રી મોનિટરિંગ ચાલુ રાખો.",
        "OEM માર્ગદર્શિકા અનુસાર સ્નેહન શેડ્યૂલ જાળવો.",
      ],
    },
    de: {
      headline: "Alle überwachten Parameter im Normalbereich",
      summary: "Alle Sensorwerte und Betriebsparameter liegen innerhalb der zulässigen Schwellenwerte. Keine aktiven Anomalien in der 4-Agenten-Pipeline.",
      actions: [
        "24/7 autonome Telemetrieüberwachung fortsetzen.",
        "Standard-Schmierplan gemäß OEM-Richtlinien einhalten.",
      ],
    },
    fr: {
      headline: "Tous les paramètres surveillés sont normaux",
      summary: "Toutes les valeurs des capteurs se situent dans les tolérances normales. Aucune anomalie détectée par les 4 agents.",
      actions: [
        "Poursuivre la surveillance télémétrique autonome 24h/24, 7j/7.",
        "Respecter le calendrier de lubrification standard du fabricant.",
      ],
    },
    es: {
      headline: "Todos los parámetros monitorizados están normales",
      summary: "Todas las lecturas de sensores y parámetros físicos están dentro de los límites operativos normales.",
      actions: [
        "Continuar con la monitorización continua 24/7 de telemetría.",
        "Mantener el programa estándar de lubricación según el OEM.",
      ],
    },
    it: {
      headline: "Tutti i parametri monitorati sono normali",
      summary: "Tutti i valori dei sensori rientrano nelle soglie operative nominali. Nessun allarme rilevato.",
      actions: [
        "Continuare il monitoraggio continuo 24/7 della telemetria.",
        "Mantenere il programma di lubrificazione standard OEM.",
      ],
    },
    pt: {
      headline: "Todos os parâmetros monitorados estão normais",
      summary: "Todas as leituras dos sensores e parâmetros físicos estão dentro dos limites normais de operação.",
      actions: [
        "Continuar monitoramento contínuo autônomo 24/7.",
        "Manter cronograma padrão de lubrificação de acordo com o fabricante.",
      ],
    },
    nl: {
      headline: "Alle bewaakte parameters normaal",
      summary: "Alle sensorwaarden en fysieke parameters vallen binnen de normale drempelwaarden.",
      actions: [
        "Ga door met 24/7 continue autonome telemetriebewaking.",
        "Houd het standaardsmeerschema aan volgens de OEM-richtlijnen.",
      ],
    },
    pl: {
      headline: "Wszystkie monitorowane parametry w normie",
      summary: "Wszystkie odczyty czujników mieszczą się w standardowych granicach roboczych.",
      actions: [
        "Kontynuuj ciągły monitoring telemetryczny 24/7.",
        "Utrzymuj standardowy harmonogram smarowania zgodnie z zaleceniami producenta.",
      ],
    },
  };

  const tr = translations[lang] ?? translations.en;
  return {
    machineId,
    archetype: "NORMAL",
    generatedAt: Date.now(),
    headline: tr.headline,
    severity: "good",
    summary: tr.summary,
    recommendedActions: tr.actions,
  };
}

export function getIdleDiagnosis(lang: LangCode, machineId: string, zeroFields: string[]): FaultDiagnosis {
  const fields = zeroFields.join(", ") || "telemetry";
  const translations: Record<LangCode, { headline: string; summary: string; actions: string[] }> = {
    en: {
      headline: "Motor appears to be off",
      summary: `${fields} is reading zero right now. That usually means the motor simply isn't running — not a fault. If it should be running, check the current/power sensor wiring instead.`,
      actions: [
        "Confirm the motor is actually stopped before troubleshooting sensors.",
        "If it should be running, check the phase-current and power-meter wiring/connections.",
      ],
    },
    hi: {
      headline: "मोटर बंद प्रतीत हो रही है",
      summary: `${fields} वर्तमान में शून्य रीडिंग दिखा रहा है। इसका सामान्यतः अर्थ है कि मोटर चल नहीं रही है — यह कोई खराबी नहीं है। यदि इसे चलना चाहिए, तो करंट/पावर सेंसर वायरिंग की जांच करें।`,
      actions: [
        "सेंसर की जांच करने से पहले पुष्टि करें कि मोटर वास्तव में बंद है।",
        "यदि इसे चलना चाहिए, तो फेज़-करंट और पावर-मीटर वायरिंग/कनेक्शन की जांच करें।",
      ],
    },
    ta: {
      headline: "மோட்டார் இயங்கவில்லை போல் தெரிகிறது",
      summary: `${fields} தற்போது பூஜ்ஜியத்தைக் காட்டுகிறது. இதன் பொருள் மோட்டார் இயங்கவில்லை — இது கோளாறு அல்ல.`,
      actions: [
        "சென்சார்களை சரிசெய்வதற்கு முன் மோட்டார் நிறுத்தப்பட்டுள்ளதா என்பதை உறுதிப்படுத்தவும்.",
        "மோட்டார் இயங்க வேண்டியிருந்தால், வயரிங் இணைப்புகளைச் சரிபார்க்கவும்.",
      ],
    },
    te: {
      headline: "మోటారు ఆపివేయబడినట్లు కనిపిస్తోంది",
      summary: `${fields} ప్రస్తుతం సున్నాగా ఉంది. సాధారణంగా మోటారు నడవడం లేదని దీని అర్థం.`,
      actions: [
        "సెన్సార్లను పరిశీలించే ముందు మోటార్ ఆగిపోయిందని నిర్ధారించుకోండి.",
        "నడుస్తూ ఉండవలసి వస్తే, వైరింగ్ తనిఖీ చేయండి.",
      ],
    },
    bn: {
      headline: "মোটরটি বন্ধ বলে মনে হচ্ছে",
      summary: `${fields} বর্তমানে শূন্য দেখাচ্ছে। এর অর্থ মোটর চলছে না — এটি কোনও ত্রুটি নয়।`,
      actions: [
        "সেন্সর অনুসন্ধানের আগে মোটরটি সত্যিই বন্ধ কিনা তা নিশ্চিত করুন।",
        "যদি এটি চলার কথা থাকে তবে তারের সংযোগগুলি পরীক্ষা করুন।",
      ],
    },
    mr: {
      headline: "मोटर बंद असल्याचे दिसते",
      summary: `${fields} सध्या शून्य वाचन दाखवत आहे. याचा अर्थ मोटर चालू नाही — हा दोष नाही.`,
      actions: [
        "सेन्सरची तपासणी करण्यापूर्वी मोटर खरोखर बंद असल्याची खात्री करा.",
        "मोटर चालू असणे आवश्यक असल्यास, वायरिंग कनेक्शन तपासा.",
      ],
    },
    gu: {
      headline: "મોટર બંધ લાગે છે",
      summary: `${fields} હાલમાં શૂન્ય દર્શાવે છે. આનો સામાન્ય રીતે અર્થ એ થાય છે કે મોટર ચાલી રહી નથી — કોઈ ખામી નથી.`,
      actions: [
        "સેન્સર ચકાસતા પહેલાં ખાતરી કરો કે મોટર બંધ છે.",
        "જો તે ચાલુ હોવી જોઈએ, તો વાયરિંગ જોડાણો તપાસો.",
      ],
    },
    de: {
      headline: "Motor scheint abgeschaltet zu sein",
      summary: `${fields} zeigt derzeit Null an. Das bedeutet in der Regel, dass die Maschine nicht in Betrieb ist — kein Defekt.`,
      actions: [
        "Vor der Fehlersuche an Sensoren sicherstellen, dass der Motor stillsteht.",
        "Sollte er laufen, Stromwandler- und Leistungsmesserkabel prüfen.",
      ],
    },
    fr: {
      headline: "Le moteur semble être à l'arrêt",
      summary: `${fields} indique zéro actuellement. Cela signifie généralement que le moteur ne tourne pas — ce n'est pas un défaut.`,
      actions: [
        "Confirmer l'arrêt effectif du moteur avant de dépanner les capteurs.",
        "S'il doit fonctionner, vérifier le câblage du courant de phase et du wattmètre.",
      ],
    },
    es: {
      headline: "El motor parece estar apagado",
      summary: `${fields} marca cero en este momento. Esto generalmente significa que el motor no está en marcha, no una avería.`,
      actions: [
        "Confirmar que el motor esté detenido antes de revisar sensores.",
        "Si debería estar en marcha, comprobar el cableado de corriente de fase y potencia.",
      ],
    },
    it: {
      headline: "Il motore sembra essere spento",
      summary: `${fields} mostra zero. Di solito indica semplicemente che il motore non è in funzione — non un guasto.`,
      actions: [
        "Verificare che il motore sia effettivamente fermo prima di intervenire sui sensori.",
        "Se dovrebbe essere avviato, controllare i collegamenti dei sensori di corrente e potenza.",
      ],
    },
    pt: {
      headline: "O motor parece estar desligado",
      summary: `${fields} está marcando zero. Isso geralmente significa que o motor não está operando — não é uma falha.`,
      actions: [
        "Confirme que o motor está realmente parado antes de verificar os sensores.",
        "Se deveria estar funcionando, verifique a fiação dos sensores de corrente e medidor de potência.",
      ],
    },
    nl: {
      headline: "Motor lijkt uitgeschakeld te zijn",
      summary: `${fields} geeft nul aan. Dit betekent meestal dat de motor simpelweg niet draait — geen storing.`,
      actions: [
        "Bevestig dat de motor stilstaat alvorens sensoren te controleren.",
        "Als de motor zou moeten draaien, controleer dan de stroom- en vermogensbedrading.",
      ],
    },
    pl: {
      headline: "Silnik wydaje się być wyłączony",
      summary: `${fields} wskazuje obecnie zero. Zazwyczaj oznacza to, że silnik po prostu nie pracuje — to nie usterka.`,
      actions: [
        "Upewnij się, że silnik rzeczywiście stoi przed diagnozowaniem czujników.",
        "Jeśli powinien pracować, sprawdź okablowanie przekładników prądowych i miernika mocy.",
      ],
    },
  };

  const tr = translations[lang] ?? translations.en;
  return {
    machineId,
    archetype: "IDLE",
    generatedAt: Date.now(),
    headline: tr.headline,
    severity: "good",
    summary: tr.summary,
    recommendedActions: tr.actions,
  };
}

/* ─────────────────────────────────────────────────────────────────────────────
 * DYNAMIC DIAGNOSIS TRANSLATION (Headline, Summary, Explanations, Repairs)
 * ───────────────────────────────────────────────────────────────────────────── */

interface ScenarioTranslation {
  headline: string;
  summary: string;
  recommendedActions: string[];
  whatIsIt: string;
  whyShowing?: string;
  notThis?: string;
  sparePart?: string;
  rootCause: string;
  riskImpact: string;
  repairOptions?: {
    title: string;
    category: "Immediate Triage" | "Precision Repair" | "Parts & CMMS";
    steps: string[];
    partsOrTools?: string;
    estDowntime?: string;
  }[];
}

const SCENARIO_TRANSLATIONS: Record<string, Partial<Record<LangCode, ScenarioTranslation>>> = {
  // 1. CABLE CUT / SENSOR FAULT
  cable_cut: {
    hi: {
      headline: "सेंसर लूप डिस्कनेक्ट — हार्डवेयर केबल दोष",
      summary: "1 सेंसर चैनल पर सिग्नल हानि का पता चला। एक्सेलेरोमीटर 0.0 mm/s पढ़ रहा है जबकि मोटर अभी भी करंट खींच रही है — यह सेंसर का दोष है, मशीन का स्वास्थ्य नहीं। 4-एजेंट सुरक्षा नियमों के अनुसार RUL पाइपलाइन रोक दी गई है।",
      recommendedActions: [
        "एक्सेलेरोमीटर सेंसर केबल और ट्रांसड्यूसर कनेक्शन का भौतिक निरीक्षण करें।",
        "मल्टीमीटर से NAMUR NE43 4–20 mA लूप करंट को मापें और सत्यापित करें।",
      ],
      whatIsIt: "सेंसर केबल डिस्कनेक्ट। 3-अक्षीय एक्सेलेरोमीटर 0.0 mm/s पढ़ रहा है जबकि मोटर चालू है — यह एक खराब सेंसर है, स्वस्थ मशीन नहीं।",
      whyShowing: "एजेंट अल्फा ने RUL रोक दिया: कंपन शून्य पर अटक गया है जबकि फेज़ करंट / लोड सक्रिय हैं।",
      notThis: "0.0 mm/s को स्वस्थ मशीन या जाम मोटर न समझें।",
      sparePart: "कोई मशीन स्पेयर पार्ट नहीं — पहले सेंसर लीड की जांच करें।",
      rootCause: "NAMUR NE43 अनुरूप 4-20 mA सिग्नल लूप में खुला सर्किट, क्षतिग्रस्त शील्डेड RG-58 केबल, या ढीला BNC कनेक्टर।",
      riskImpact: "सेंसर लाइन में खराबी के कारण वास्तविक कंपन बढ़ने पर अलार्म ट्रिगर नहीं हो पाएगा, जिससे अनपेक्षित विफलता का जोखिम है।",
      repairOptions: [
        {
          title: "फ़ील्ड में केबल और कनेक्टर की त्वरित जांच",
          category: "Immediate Triage",
          steps: [
            "सेंसर हेड और जंक्शन बॉक्स पर BNC / M12 कनेक्टर के ढीलेपन की जांच करें।",
            "एक्सेलेरोमीटर बेस माउंटिंग का निरीक्षण करें — स्टड टाइट होना चाहिए (2.5 Nm)।",
            "मल्टीमीटर से लूप करंट मापें (< 3.6 mA या > 21 mA ओपन/शॉर्ट सर्किट दर्शाता है)।",
          ],
          partsOrTools: "डिजिटल मल्टीमीटर, BNC रिंच",
          estDowntime: "15 मिनट (मशीन बंद करने की आवश्यकता नहीं)",
        },
        {
          title: "शील्डेड ट्रांसड्यूसर केबल और सेंसर बदलना",
          category: "Precision Repair",
          steps: [
            "खराब RG-58 केबल को अलग करें और नया लो-नॉइज़ शील्डेड केबल बिछाएं।",
            "आवश्यकता पड़ने पर रिज़र्व एक्सेलेरोमीटर (BIN: SENS-E14) लगाएं।",
            "DAQ गेटवे पर सिग्नल सत्यापित करें।",
          ],
          partsOrTools: "रिज़र्व एक्सेलेरोमीटर (Bin: SENS-E14), RG-58 केबल",
          estDowntime: "45 मिनट",
        },
      ],
    },
    ta: {
      headline: "சென்சார் துண்டிப்பு — வன்பொருள் கேபிள் பிழை",
      summary: "சென்சார் சிக்னல் இழப்பு கண்டறியப்பட்டது. மோட்டார் ஓடும்போது முடுக்கமானி 0.0 mm/s ஐக் காட்டுகிறது — இது பழுதடைந்த சென்சார். RUL தற்காலிகமாக நிறுத்தப்பட்டுள்ளது.",
      recommendedActions: [
        "முடுக்கமானி சென்சார் கேபிள் இணைப்பை ஆய்வு செய்யவும்.",
        "மல்டிமீட்டரைக் கொண்டு NAMUR NE43 4–20 mA லூப் மின்னோட்டத்தை சரிபார்க்கவும்.",
      ],
      whatIsIt: "சென்சார் கேபிள் துண்டிக்கப்பட்டுள்ளது. மோட்டார் ஓடும்போது அதிர்வு பூஜ்ஜியமாகக் காட்டுகிறது.",
      whyShowing: "முகவர் ஆல்பா தற்காலிகமாக RUL கணக்கீட்டை நிறுத்தியுள்ளார்.",
      notThis: "0.0 mm/s ஐ ஆரோக்கியமான இயந்திரம் என்று தவறாகக் கருத வேண்டாம்.",
      sparePart: "சென்சார் வயரிங்கை சரிபார்க்கவும்.",
      rootCause: "4-20 mA லூப்பில் ஓபன் சர்க்யூட் அல்லது கேபிள் சேதம்.",
      riskImpact: "சென்சார் செயலிழப்பால் அதிர்வு அதிகரிப்பை கண்காணிக்க முடியாது.",
      repairOptions: [
        {
          title: "கேபிள் மற்றும் இணைப்பிகளை ஆய்வு செய்யவும்",
          category: "Immediate Triage",
          steps: [
            "BNC / M12 இணைப்பிகளை சரிபார்க்கவும்.",
            "மல்டிமீட்டரைக் கொண்டு லூப் மின்னோட்டத்தை அளவிடவும்.",
          ],
          partsOrTools: "டிஜிட்டல் மல்டிமீட்டர்",
          estDowntime: "15 நிமிடங்கள்",
        },
      ],
    },
  },

  // 2. MISALIGNMENT (MF002)
  misalignment: {
    hi: {
      headline: "शाफ्ट कोणीय एवं समानांतर कपलिंग मिसअलाइनमेंट (2X हार्मोनिक)",
      summary: "शाफ्ट कपलिंग मिसअलाइनमेंट का पता चला। ड्राइविंग मोटर शाफ्ट और कंप्रेसर शाफ्ट की केंद्र रेखाएं संरेखित नहीं हैं, जिससे 2X घूर्णन हार्मोनिक कंपन स्पाइक्स (6.2 mm/s) उत्पन्न हो रहे हैं।",
      recommendedActions: [
        "फ़ील्ड ट्राइएज: कपलिंग स्पाइडर/इलास्टोमर का निरीक्षण करें; लेजर अलाइनमेंट से पहले फीलर गेज से सॉफ्ट-फुट की जांच करें।",
        "लेजर शाफ्ट अलाइनमेंट टूल से कोणीयता < 0.05 mm/100mm तक ठीक करें।",
      ],
      whatIsIt: "शाफ्ट एंगुलर और पैरेलल कपलिंग मिसअलाइनमेंट। ड्राइविंग मोटर और ड्रिवन कंप्रेसर शाफ्ट संरेखित नहीं हैं, जिससे 2X रोटेशनल हार्मोनिक कंपन बढ़ गया है।",
      whyShowing: "एजेंट गामा ने 2X रनिंग स्पीड हार्मोनिक और बढ़े हुए कंपन आयाम से मिसअलाइनमेंट की पहचान की।",
      notThis: "यह कपलिंग / शिम का काम है, बेयरिंग (SKF 6208) बदलने की आवश्यकता नहीं है।",
      sparePart: "Lovejoy L-100 SOX इलास्टोमर + मोटर-फुट स्टेनलेस स्टील शिम (COUPLING-L100)।",
      rootCause: "मोटर और कंप्रेसर के बीच थर्मल विस्तार का अंतर, ढीले फाउंडेशन बोल्ट ('सॉफ्ट फुट'), या फ्लेक्सिबल कपलिंग इंसर्ट का घिस जाना।",
      riskImpact: "मोटर बेयरिंग और शाफ्ट पर चक्रीय तनाव और थकान। इससे सील रिसाव और ~20 दिनों के भीतर बेयरिंग फेलियर हो सकता है।",
      repairOptions: [
        {
          title: "तत्काल फ़ील्ड ट्राइएज एवं सॉफ्ट फुट निरीक्षण",
          category: "Immediate Triage",
          steps: [
            "कपलिंग गार्ड हटाएं और काले रबर के कणों या फटे हुए इलास्टोमर की जांच करें।",
            "मोटर होल्ड-डाउन बोल्ट ढीले होने की जांच करें: एक-एक बोल्ट ढीला करके फीलर गेज से जांचें।",
            "यदि किसी पैर पर 0.05 mm से अधिक गैप हो, तो अलाइनमेंट से पहले सॉफ्ट फुट को ठीक करें।",
          ],
          partsOrTools: "टॉर्क रिंच, फीलर गेज सेट, कपलिंग निरीक्षण लाइट",
          estDowntime: "30 मिनट (बिना मशीन रोके)",
        },
        {
          title: "सटीक 4-पॉइंट लेजर शाफ्ट अलाइनमेंट",
          category: "Precision Repair",
          steps: [
            "मोटर और कंप्रेसर शाफ्ट पर डुअल-लेजर अलाइनमेंट हेड लगाएं।",
            "क्षैतिज और ऊर्ध्वाधर ऑफसेट मापने के लिए शाफ्ट को 90° या 180° घुमाएं।",
            "मोटर पैरों के नीचे स्टेनलेस स्टील शिम जोड़कर कोणीयता < 0.05 mm/100mm और समानांतर ऑफसेट < 0.05 mm पर लाएं।",
            "बोल्ट को 125 Nm टॉर्क पर कसें और अंतिम सत्यापन जांच करें।",
          ],
          partsOrTools: "लेजर अलाइनमेंट किट (TKSA 41), प्री-कट स्टेनलेस स्टील शिम",
          estDowntime: "योजनाबद्ध शटडाउन के दौरान 2 घंटे",
        },
      ],
    },
    ta: {
      headline: "ஷாஃப்ட் கோண மற்றும் இணை மிஸ்அலைன்மென்ட் (2X ஹார்மோனிக்)",
      summary: "ஷாஃப்ட் இணைப்பில் தவறான சீரமைப்பு கண்டறியப்பட்டது. மோட்டார் மற்றும் கம்ப்ரசர் ஷாஃப்ட் மையக்கோடுகள் சரியாக அமையவில்லை, இதனால் 2X அதிர்வு அதிகரித்துள்ளது.",
      recommendedActions: [
        "கப்ளிங் ரப்பர் தேய்மானத்தை ஆய்வு செய்யவும்.",
        "லேசர் அலைன்மென்ட் கருவியைப் பயன்படுத்தி சீரமைக்கவும்.",
      ],
      whatIsIt: "மோட்டார் மற்றும் கம்ப்ரசர் ஷாஃப்ட் சீரமைப்பில் விலகல் ஏற்பட்டுள்ளது.",
      whyShowing: "2X சுழற்சி வேகத்தில் அதிர்வு அதிகரித்ததை முகவர் காமா கண்டறிந்தார்.",
      notThis: "இது கப்ளிங் / ஷிம் வேலை, பேரிங்கை மாற்ற வேண்டியதில்லை.",
      sparePart: "Lovejoy L-100 SOX எலாஸ்டோமர் + மோட்டார்-ஃபுட் ஷிம்கள்.",
      rootCause: "அடித்தள போல்ட் தளர்வு ('சாஃப்ட் ஃபுட்') அல்லது கப்ளிங் தேய்மானம்.",
      riskImpact: "பேரிங் மற்றும் ஷாஃப்ட்டில் அதிக அழுத்தம் ஏற்பட்டு 20 நாட்களில் முறிவு ஏற்படலாம்.",
      repairOptions: [
        {
          title: "உடனடி கள ஆய்வு மற்றும் சாஃப்ட் ஃபுட் சரிபார்ப்பு",
          category: "Immediate Triage",
          steps: [
            "கப்ளிங் கார்டை அகற்றி ரப்பர் துகள்களைப் பார்க்கவும்.",
            "ஃபீலர் கேஜ் மூலம் கால்களின் சமநிலையை சரிபார்க்கவும்.",
          ],
          partsOrTools: "டார்க் ரெஞ்ச், ஃபீலர் கேஜ்",
          estDowntime: "30 நிமிடங்கள்",
        },
      ],
    },
  },

  // 3. BEARING BPFI / BPFO
  bearing_bpfi: {
    hi: {
      headline: "बेयरिंग इनर रेस स्पैलिंग दोष (BPFI 5.43X)",
      summary: "मोटर बेयरिंग SKF 6208 के इनर रेसवे पर थकान के कारण माइक्रो-स्पैलिंग दोष का पता चला। यह 5.43× शाफ्ट गति पर शॉक पल्स और बढ़ा हुआ तापमान (74°C) उत्पन्न कर रहा है। RUL तेजी से कम हो रही है।",
      recommendedActions: [
        "फ़ील्ड ट्राइएज: ड्राइव-एंड हाउसिंग पर 15 ग्राम SKF LGHP 2 पॉलीयूरिया ग्रीस इंजेक्ट करें।",
        "यदि तापमान 65°C से अधिक बना रहता है, तो योजनाबद्ध शटडाउन का इंतजार न करें; बेयरिंग बदलने का शेड्यूल बनाएं।",
      ],
      whatIsIt: "बेयरिंग बॉल पास फ्रीक्वेंसी इनर रेस (BPFI) दोष। इनर रेसवे पर धातु की थकान और गड्ढे (स्पैलिंग) बन रहे हैं।",
      whyShowing: "उच्च-आवृत्ति डिमॉड्यूलेशन और स्पेक्ट्रम में 5.43X हार्मोनिक पीक की पुष्टि हुई।",
      notThis: "केवल बाहरी सफाई से यह ठीक नहीं होगा — आंतरिक धातु क्षति हो चुकी है।",
      sparePart: "SKF 6208 C3 डीप ग्रूव बॉल बेयरिंग (BEARING-SKF6208)।",
      rootCause: "स्नेहन (ग्रीस) की कमी, विद्युत डिस्चार्ज करंट (EDM फ्लूटिंग), या अत्यधिक रेडियल भार।",
      riskImpact: "इनर रेसवे का टूटना, अत्यधिक कंपन और मोटर शाफ्ट सीज होने का गंभीर जोखिम।",
      repairOptions: [
        {
          title: "उच्च-तापमान ग्रीसिंग एवं थर्मल मॉनिटरिंग",
          category: "Immediate Triage",
          steps: [
            "ड्राइव-एंड बेयरing निप्पल पर 15 ग्राम SKF LGHP 2 ग्रीस डालें।",
            "इन्फ्रारेड पायरोमीटर से प्रति 30 मिनट में हाउसिंग तापमान रिकॉर्ड करें।",
          ],
          partsOrTools: "SKF ग्रीस गन, SKF LGHP 2 ग्रीस, इन्फ्रारेड थर्मामीटर",
          estDowntime: "10 मिनट",
        },
        {
          title: "ड्राइव-एंड बेयरिंग बदलना (SKF 6208 C3)",
          category: "Precision Repair",
          steps: [
            "मोटर को अलग करें और इंडक्शन हीटर का उपयोग करके पुराना बेयरिंग निकालें।",
            "नया SKF 6208 C3 बेयरिंग 110°C पर गर्म करके शाफ्ट पर फिट करें।",
            "शाफ्ट ग्राउंडिंग रिंग (AEGIS) स्थापित करें ताकि करंट डिस्चार्ज रुक सके।",
          ],
          partsOrTools: "SKF 6208 C3 बेयरिंग, इंडक्शन हीटर, बेयरिंग पुलर",
          estDowntime: "4 घंटे",
        },
      ],
    },
    ta: {
      headline: "பேரிங் உள் ரேஸ் பழுது (BPFI 5.43X)",
      summary: "SKF 6208 பேரிங்கின் உள் பகுதியில் தேய்மானம் மற்றும் விரிசல் கண்டறியப்பட்டது. வெப்பநிலை 74°C ஆக உயர்ந்துள்ளது.",
      recommendedActions: [
        "15 கிராம் SKF LGHP 2 கிரீஸ் இடவும்.",
        "வெப்பநிலை குறைந்தபாடில்லை என்றால் புதிய பேரிங்கை மாற்றவும்.",
      ],
      whatIsIt: "பேரிங் உள் வளையத்தில் உலோகம் உரிந்து போதல் (BPFI).",
      whyShowing: "முகவர் காமா உயர் அதிர்வெண் அலைவரிசையில் பேரிங் பழுதை உறுதிப்படுத்தினார்.",
      notThis: "இது சாதாரண அதிர்வு அல்ல — பேரிங் மாற்றப்பட வேண்டும்.",
      sparePart: "SKF 6208 C3 பேரிங்.",
      rootCause: "கிரீஸ் பற்றாக்குறை அல்லது மின் கசிவு.",
      riskImpact: "பேரிங் முற்றிலும் செயலிழந்து மோட்டார் முடங்கும் அபாயம்.",
      repairOptions: [
        {
          title: "கிரீஸ் இடுதல் மற்றும் கண்காணிப்பு",
          category: "Immediate Triage",
          steps: ["15g SKF LGHP 2 கிரீஸ் இடவும்.", "வெப்பநிலையைக் கண்காணிக்கவும்."],
          partsOrTools: "கிரீஸ் கன், SKF LGHP 2",
          estDowntime: "10 நிமிடங்கள்",
        },
      ],
    },
  },

  // 4. VOLTAGE UNBALANCE (EF001)
  voltage_unbalance: {
    hi: {
      headline: "गंभीर 3-फेज़ वोल्टेज असंतुलन (VUF 4.8%)",
      summary: "गंभीर वोल्टेज असंतुलन का पता चला। असमान लाइन वोल्टेज (V_R=432V, V_Y=368V, V_B=401V) नेगेटिव-सीक्वेंस चुंबकीय क्षेत्र उत्पन्न कर रहे हैं, जो मोटर घूर्णन का विरोध कर रहे हैं और वाइंडिंग को गर्म कर रहे हैं।",
      recommendedActions: [
        "फ़ील्ड ट्राइएज: MCC फीडर लग्स का IR-स्कैन करें (>15°C हॉट स्पॉट की जांच करें); वाइंडिंग जलने से पहले ढीले कनेक्शन कसें।",
        "PFC कैपेसिटर बैंक की धारिता और फ़्यूज़ की जांच करें।",
      ],
      whatIsIt: "3-फेज़ वोल्टेज असंतुलन (VUF 4.8%)। असमान वोल्टेज नेगेटिव-सीक्वेंस टॉर्क और मोटर वाइंडिंग में अत्यधिक गर्मी पैदा कर रहा है।",
      whyShowing: "एजेंट बीटा ने VUF 4.8% (मानक सीमा 2.0% से ऊपर) और फेज़ करंट असंतुलन दर्ज किया।",
      notThis: "कोई यांत्रिक स्पेयर पार्ट नहीं — इनकमिंग सप्लाई / MCC ठीक करें, मोटर को न खोलें।",
      sparePart: "कोई यांत्रिक स्पेयर नहीं — बेयरिंग (SKF 6208) ऑर्डर न करें।",
      rootCause: "MCC फीडर बसबार पर उच्च-प्रतिरोध ढीला कनेक्शन, या स्थानीय पावर फैक्टर करेक्शन (PFC) बैंक में खराब संधारित्र।",
      riskImpact: "मोटर वाइंडिंग का तापमान तेजी से बढ़ना; प्रत्येक 10°C अतिरिक्त गर्मी वाइंडिंग इन्सुलेशन जीवन को आधा कर देती है।",
      repairOptions: [
        {
          title: "MCC थर्मल स्कैन एवं टर्मिनल री-टॉर्किंग",
          category: "Immediate Triage",
          steps: [
            "MCC स्टार्टर पैनल पर सभी 3 फेज़ बसबार टर्मिनलों का थर्मल इमेजिंग कैमरा से निरीक्षण करें।",
            "ढीले या गर्म टर्मिनलों को विनिर्देश टॉर्क (45 Nm) पर पुनः कसें।",
          ],
          partsOrTools: "थर्मल कैमरा (FLIR E6), इंसुलेटेड टॉर्क रिंच",
          estDowntime: "20 मिनट",
        },
        {
          title: "PFC कैपेसिटर बैंक निरीक्षण एवं प्रतिस्थापन",
          category: "Precision Repair",
          steps: [
            "PFC बैंक के प्रत्येक संधारित्र की धारिता (Capacitance) मापें।",
            "खराब 25kVAR कैपेसिटर मॉड्यूल को बदलें।",
            "वोल्टेज असंतुलन < 1.5% होने की पुष्टि करें।",
          ],
          partsOrTools: "कैपेसिटेंस मीटर, 25kVAR PFC कैपेसिटर मॉड्यूल",
          estDowntime: "2 घंटे",
        },
      ],
    },
    ta: {
      headline: "தீவிர 3-பேஸ் மின்னழுத்த சமநிலையின்மை (VUF 4.8%)",
      summary: "மின்னழுத்தத்தில் அதிக சமநிலையின்மை கண்டறியப்பட்டது (VUF 4.8%). இது மோட்டார் முறுக்குவிசையை பாதித்து அதிக வெப்பத்தை உருவாக்குகிறது.",
      recommendedActions: [
        "MCC பேனல் டெர்மினல்களை தெர்மல் கேமரா மூலம் ஸ்கேன் செய்யவும்.",
        "தளர்வான இணைப்புகளை உடனே இறுக்கவும்.",
      ],
      whatIsIt: "3-பேஸ் மின்னழுத்தம் சமமாக இல்லை, இதனால் மோட்டார் சூடாகிறது.",
      whyShowing: "முகவர் பீட்டா மின்னழுத்த சமநிலையின்மையை உறுதிப்படுத்தியுள்ளார்.",
      notThis: "இது இயந்திர கோளாறு அல்ல — மின் பேனலை சரிபார்க்கவும்.",
      sparePart: "இயந்திர உதிரிபாகம் தேவையில்லை.",
      rootCause: "மின் இணைப்பில் தளர்வு அல்லது PFC கெபாசிட்டர் பழுது.",
      riskImpact: "மோட்டார் வைண்டிங் இன்சுலேஷன் எரிந்து போகும் ஆபத்து.",
      repairOptions: [
        {
          title: "MCC டெர்மினல் சரிபார்ப்பு",
          category: "Immediate Triage",
          steps: ["டெர்மினல்களை தெர்மல் கேமரா கொண்டு பார்க்கவும்.", "இணைப்புகளை இறுக்கவும்."],
          partsOrTools: "தெர்மல் கேமரா",
          estDowntime: "20 நிமிடங்கள்",
        },
      ],
    },
  },

  // 5. PROCESS LEAK (PF001)
  leak: {
    hi: {
      headline: "कंप्रेस्ड एयर डिस्चार्ज लीक का पता चला (PF001)",
      summary: "डिस्चार्ज सर्किट से कंप्रेस्ड एयर का रिसाव हो रहा है — फिटिंग्स, ड्रेन ट्रैप, कूलर जॉइंट्स या सोलेनॉइड वाल्व। यह पाइपिंग / प्रोसेस लीक है, मोटर बेयरिंग का दोष नहीं।",
      recommendedActions: [
        "अल्ट्रासोनिक लीक डिटेक्टर के साथ डिस्चार्ज लाइन का निरीक्षण करें; यूनियन, ड्रेन ट्रैप और सेफ्टी वाल्व की साबुन के पानी से जांच करें।",
        "इसे बेयरिंग विफलता न समझें — हवा लीक होने पर भी कंपन पूरी तरह सामान्य रह सकता है।",
      ],
      whatIsIt: "डिस्चार्ज सर्किट से कंप्रेस्ड एयर लीक हो रही है। यह पाइपिंग का रिसाव है, मोटर बेयरिंग का नहीं।",
      whyShowing: "गेटवे ने PF* लीक कोड प्रकाशित किया या डिस्चार्ज प्रेशर में गिरावट दर्ज की गई।",
      notThis: "सामान्य कंपन होने का मतलब यह नहीं कि रिसाव नहीं है। लीक से हवा और ऊर्जा बर्बाद होती है।",
      sparePart: "एयर-सर्किट फिटिंग / सील किट (AIR-LEAK-KIT) — बेयरिंग नहीं।",
      rootCause: "पाइपिंग जोड़ों, क्विक-कनेक्ट फिटिंग्स या स्वचालित ड्रेन वाल्व पर सील का घिस जाना।",
      riskImpact: "कंप्रेसर लगातार अनलोडेड चलने से अत्यधिक ऊर्जा खपत और दबाव में कमी।",
      repairOptions: [
        {
          title: "अल्ट्रासोनिक लीक डिटेक्शन और सीलिंग",
          category: "Immediate Triage",
          steps: [
            "अल्ट्रासोनिक लीक डिटेक्टर लेकर पूरी लाइन का दौरा करें।",
            "जोड़ों पर सोप स्प्रे लगाकर बुलबुलों की जांच करें।",
            "ढीली फिटिंग्स को कसें या क्षतिग्रस्त सील बदलें।",
          ],
          partsOrTools: "अल्ट्रासोनिक लीक डिटेक्टर, सोप स्प्रे, प्रेशर गेज",
          estDowntime: "30–60 मिनट",
        },
      ],
    },
    ta: {
      headline: "அழுத்தப்பட்ட காற்று கசிவு கண்டறியப்பட்டது (PF001)",
      summary: "வெளியேற்ற குழாய்களில் காற்று கசிவு உள்ளது — இது குழாய் கசிவு, மோட்டார் பேரிங் பழுது அல்ல.",
      recommendedActions: [
        "அல்ட்ராசோனிக் லீக் டிடெக்டர் மூலம் கசிவை கண்டறியவும்.",
        "இணைப்புகளை இறுக்கவும் அல்லது சீல்களை மாற்றவும்.",
      ],
      whatIsIt: "கம்ப்ரசர் குழாயில் காற்று கசிவு ஏற்படுகிறது.",
      whyShowing: "PF* லீக் குறியீடு அல்லது அழுத்தம் குறைவு காரணமாக காட்டப்படுகிறது.",
      notThis: "இது பேரிங் பிரச்சனை அல்ல — மோட்டாரை பிரிக்க வேண்டாம்.",
      sparePart: "ஏர்-லீக் கிட் (சீல்கள் / ஃபிட்டிங்குகள்).",
      rootCause: "குழாய் இணைப்புகள் தளர்வு அல்லது சீல் தேய்மானம்.",
      riskImpact: "அதிக மின் நுகர்வு மற்றும் உற்பத்தி இழப்பு.",
      repairOptions: [
        {
          title: "கசிவை கண்டறிந்து சீல் செய்தல்",
          category: "Immediate Triage",
          steps: ["அல்ட்ராசோனிக் கருவி மூலம் கசியும் இடத்தை கண்டறியவும்.", "சீல்களை மாற்றவும்."],
          partsOrTools: "அல்ட்ராசோனிக் டிடெக்டர், சோப் ஸ்ப்ரே",
          estDowntime: "30–60 நிமிடங்கள்",
        },
      ],
    },
  },
};

/**
 * Detects which scenario a diagnosis corresponds to.
 */
function identifyScenario(d: FaultDiagnosis): string {
  const code = String(
    d.pipelineDetails?.defect_localization?.defect_code ||
    d.pipelineDetails?.defect_localization?.defectCode ||
    d.archetype ||
    ""
  ).toUpperCase();
  const text = `${d.headline} ${d.summary} ${d.faultExplanation?.whatIsIt || ""}`.toLowerCase();

  if (text.includes("cable") || text.includes("disconnect") || code === "SENSOR" || code === "HARDWARE_CABLE_FAULT") {
    return "cable_cut";
  }
  if (text.includes("misalignment") || code === "MF002") {
    return "misalignment";
  }
  if (text.includes("bpfi") || text.includes("bpfo") || text.includes("bearing") || code === "BPFI" || code === "BPFO") {
    return "bearing_bpfi";
  }
  if (text.includes("voltage") || text.includes("unbalance") || code === "EF001") {
    return "voltage_unbalance";
  }
  if (text.includes("leak") || code === "PF001") {
    return "leak";
  }
  return "generic";
}

/**
 * Translates a FaultDiagnosis object into the requested target language.
 * Falls back to the original English if the translation is unavailable.
 */
export function translateDiagnosis(diagnosis: FaultDiagnosis, lang: LangCode): FaultDiagnosis {
  if (lang === "en" || !diagnosis) {
    return diagnosis;
  }

  // Handle nominal & idle archetypes directly
  const arch = String(diagnosis.archetype || "").toUpperCase();
  if (arch === "NORMAL" || (diagnosis.severity === "good" && !diagnosis.summary.includes("zero"))) {
    return getNormalDiagnosis(lang, diagnosis.machineId);
  }
  if (arch === "IDLE" || diagnosis.headline.toLowerCase().includes("off")) {
    return getIdleDiagnosis(lang, diagnosis.machineId, ["phase_current"]);
  }

  // Identify scenario
  const scenario = identifyScenario(diagnosis);
  const scTranslations = SCENARIO_TRANSLATIONS[scenario]?.[lang];
  if (!scTranslations) {
    return diagnosis; // return as-is if no localized texts exist for this scenario
  }

  // Clone and enrich with localized texts
  const clone: FaultDiagnosis = {
    ...diagnosis,
    headline: scTranslations.headline || diagnosis.headline,
    summary: scTranslations.summary || diagnosis.summary,
    recommendedActions: scTranslations.recommendedActions && scTranslations.recommendedActions.length > 0
      ? scTranslations.recommendedActions
      : diagnosis.recommendedActions,
  };

  if (diagnosis.faultExplanation) {
    clone.faultExplanation = {
      ...diagnosis.faultExplanation,
      whatIsIt: scTranslations.whatIsIt || diagnosis.faultExplanation.whatIsIt,
      whyShowing: scTranslations.whyShowing || diagnosis.faultExplanation.whyShowing,
      notThis: scTranslations.notThis || diagnosis.faultExplanation.notThis,
      sparePart: scTranslations.sparePart || diagnosis.faultExplanation.sparePart,
      rootCause: scTranslations.rootCause || diagnosis.faultExplanation.rootCause,
      riskImpact: scTranslations.riskImpact || diagnosis.faultExplanation.riskImpact,
    };
  }

  if (scTranslations.repairOptions && scTranslations.repairOptions.length > 0) {
    clone.repairOptions = scTranslations.repairOptions.map((opt, i) => {
      const orig = diagnosis.repairOptions?.[i];
      return {
        title: opt.title,
        category: opt.category,
        urgency: orig?.urgency ?? (opt.category === "Immediate Triage" ? "Immediate" : "Scheduled"),
        steps: opt.steps,
        partsOrTools: opt.partsOrTools || orig?.partsOrTools,
        estDowntime: opt.estDowntime || orig?.estDowntime,
        part: orig?.part,
      };
    });
  }

  return clone;
}
