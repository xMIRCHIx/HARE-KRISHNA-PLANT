export type Language = 'en' | 'hi';

export interface Translations {
  sidebar: {
    dashboard: string;
    dashboardSub: string;
    dailyEntry: string;
    dailyEntrySub: string;
    ledger: string;
    ledgerSub: string;
    sales: string;
    salesSub: string;
    expenses: string;
    expensesSub: string;
    guide: string;
    guideSub: string;
    settings: string;
    settingsSub: string;
    cloudStatus: string;
    ownerRole: string;
    menuHeader: string;
  };
  guide: {
    badge: string;
    title: string;
    subtitle: string;
    targetCostLabel: string;
    targetCostSub: string;
    sellingPriceLabel: string;
    sellingPriceSub: string;
    workerPayoffLabel: string;
    workerPayoffSub: string;
    netMarginLabel: string;
    netMarginSub: string;
    sqlTitle: string;
    sqlDesc: string;
    copySqlBtn: string;
    copiedSqlBtn: string;
    sqlStepsTitle: string;
    sqlStep1: string;
    sqlStep2: string;
    sqlStep3: string;
    sec1Title: string;
    sec1Desc: string;
    sec1Card1Title: string;
    sec1Card1Desc: string;
    sec1Card2Title: string;
    sec1Card2Desc: string;
    sec2Title: string;
    sec2Desc: string;
    thComponent: string;
    thFormula: string;
    thSample: string;
    rowCement: string;
    rowCementFormula: string;
    rowDust: string;
    rowDustFormula: string;
    rowRaakh: string;
    rowRaakhFormula: string;
    rowWorker: string;
    rowWorkerFormula: string;
    rowTotalCost: string;
    rowTotalFormula: string;
    rowProfit: string;
    rowProfitFormula: string;
    sec3Title: string;
    sec3Desc: string;
    sec4Title: string;
    step1Title: string;
    step1Desc: string;
    step2Title: string;
    step2Desc: string;
    step3Title: string;
    step3Desc: string;
  };
}

export const translations: Record<Language, Translations> = {
  en: {
    sidebar: {
      dashboard: 'Dashboard',
      dashboardSub: 'Live Overview',
      dailyEntry: 'Daily Entry',
      dailyEntrySub: 'Production & Materials',
      ledger: 'Production Ledger',
      ledgerSub: 'History & Accounts',
      sales: 'Sales & Receivables',
      salesSub: 'Customer Orders & Dues',
      expenses: 'Overhead Expenses',
      expensesSub: 'Fuel, Power & Repairs',
      guide: 'How It Works',
      guideSub: 'System Guide & Formulas',
      settings: 'Plant Settings',
      settingsSub: 'Ratios, Rates & Database',
      cloudStatus: 'Supabase Cloud',
      ownerRole: 'Plant Owner • Admin',
      menuHeader: 'Operations Menu'
    },
    guide: {
      badge: 'System Documentation & Guide',
      title: 'Hare Krishna Bricks — How It Works',
      subtitle: 'Complete guide to production logging, daily dynamic unit costing, labor payoff, and database setup.',
      targetCostLabel: '1. TARGET COST',
      targetCostSub: 'Benchmark cost to manufacture 1 brick',
      sellingPriceLabel: '2. SELLING PRICE',
      sellingPriceSub: 'Current market selling rate per brick',
      workerPayoffLabel: '3. WORKER PAYOFF',
      workerPayoffSub: 'Piece-rate labor paid per brick produced',
      netMarginLabel: '4. NET MARGIN',
      netMarginSub: 'Average ~12.5% net profit margin per brick',
      sqlTitle: 'Supabase Database Table Queries (SQL Schema)',
      sqlDesc: 'Run this SQL script in your Supabase project to automatically initialize all required database tables.',
      copySqlBtn: 'Copy SQL Query',
      copiedSqlBtn: 'Copied SQL to Clipboard!',
      sqlStepsTitle: '3-Step Setup Instructions:',
      sqlStep1: 'Open your Supabase SQL Editor: ',
      sqlStep2: 'Click the "Copy SQL Query" button above to copy the schema to your clipboard.',
      sqlStep3: 'Paste the query into the Supabase SQL Editor and click the green "Run" button. All tables and policies will be created immediately.',
      sec1Title: '1. Morning Estimated Target vs. Evening Output',
      sec1Desc: 'In fly ash brick plants, tracking material yield is critical to prevent hopper leakage, batch inconsistencies, or handling breakage:',
      sec1Card1Title: '• Morning Estimated Target:',
      sec1Card1Desc: 'When the supervisor schedules 70 cement bags, stone dust, and fly ash, the system calculates the theoretical yield (e.g. 70 bags × 120 bricks/bag = 8,400 bricks).',
      sec1Card2Title: '• Evening Actual Tally & Reconciliation:',
      sec1Card2Desc: 'At shift end, actual finished bricks from machine stroke counters or yard stack tallies are entered (e.g. 8,100 bricks). If 300 bricks are missing, the system flags a Variance to check for green brick damage or hopper jams.',
      sec2Title: '2. Dynamic Single Brick Manufacturing Cost Formula',
      sec2Desc: 'Cost per brick is never assumed to be static. Fluctuating cement, dust, and fly ash purchase rates are calculated fresh every single day:',
      thComponent: 'Cost Component',
      thFormula: 'Calculation Method',
      thSample: 'Sample Cost / Brick',
      rowCement: '1. Cement',
      rowCementFormula: '(Bags Used × Day Rate) ÷ Total Bricks Produced',
      rowDust: '2. Stone Dust',
      rowDustFormula: '(Trucks Used × Truck Rate) ÷ Total Bricks Produced',
      rowRaakh: '3. Fly Ash / Raakh',
      rowRaakhFormula: '(Qty Used × Delivered Rate) ÷ Total Bricks Produced',
      rowWorker: '4. Worker Labor Payoff',
      rowWorkerFormula: 'Fixed Piece-Rate Payoff per Brick',
      rowTotalCost: 'Total Manufacturing Cost',
      rowTotalFormula: 'Materials + Worker Labor (₹0.60) + Overheads',
      rowProfit: 'Realized Net Profit',
      rowProfitFormula: '₹4.00 (Sale Price) − Total Cost per Brick',
      sec3Title: '3. What Triggers the RED Loss Alert?',
      sec3Desc: 'If raw material consumption spikes, machine downtime wastes wet mix, or material purchase rates rise such that 1 brick costs more than ₹4.00 to make (e.g. ₹4.15/brick), the system instantly highlights that day in bright RED with a LOSS WARNING banner so the owner can investigate immediately.',
      sec4Title: '4. Fast 3-Minute Daily Plant Routine',
      step1Title: 'STEP 1: OPEN DAILY ENTRY',
      step1Desc: 'At the end of the day, navigate to the Daily Entry tab. Enter the total brick count produced (single count or per shift/batch).',
      step2Title: 'STEP 2: ENTER MATERIALS USED',
      step2Desc: 'Input actual cement bags, dust trucks, and fly ash tons used today. The right panel instantly displays live cost-per-brick and margin.',
      step3Title: 'STEP 3: LOG SALES & SAVE',
      step3Desc: 'Enter dispatches/sales count and sale rate. Click "Save Entry" — stock, worker wages, and ledger are updated simultaneously.'
    }
  },
  hi: {
    sidebar: {
      dashboard: 'Dashboard',
      dashboardSub: 'लाइव अवलोकन',
      dailyEntry: 'Daily Entry',
      dailyEntrySub: 'दैनिक उत्पादन व सामग्री',
      ledger: 'Production Ledger',
      ledgerSub: 'खाता व इतिहास',
      sales: 'बिक्री व उधारी (खाता)',
      salesSub: 'ग्राहक लेजर व बकाया',
      expenses: 'Overhead Expenses',
      expensesSub: 'डीजल, बिजली, रखरखाव',
      guide: 'How It Works (गाइड)',
      guideSub: 'सिस्टम कैसे काम करेगा',
      settings: 'Plant Settings',
      settingsSub: 'अनुपात, दर व डेटाबेस',
      cloudStatus: 'Supabase Cloud',
      ownerRole: 'Plant Owner • Admin',
      menuHeader: 'ऑपरेशन्स मेन्यू'
    },
    guide: {
      badge: 'सिस्टम डॉक्यूमेंटेशन व गाइड',
      title: 'Hare Krishna Bricks — सिस्टम कैसे काम करता है?',
      subtitle: 'ईंट उत्पादन, दैनिक लागत गणना (Dynamic Costing), लेबर पे-ऑफ और Supabase डेटाबेस सेटअप की पूरी जानकारी।',
      targetCostLabel: '1. टारगेट लागत (TARGET COST)',
      targetCostSub: 'औसत प्रति ईंट बनाने का खर्च',
      sellingPriceLabel: '2. बिक्री दर (SELLING PRICE)',
      sellingPriceSub: 'बाज़ार में प्रति ईंट की बिक्री कीमत',
      workerPayoffLabel: '3. लेबर पे-ऑफ (WORKER PAYOFF)',
      workerPayoffSub: 'मजदूरों को प्रति ईंट दी जाने वाली मजदूरी',
      netMarginLabel: '4. शुद्ध मुनाफा (NET MARGIN)',
      netMarginSub: 'लगभग 12.5% प्रति ईंट शुद्ध मार्जिन',
      sqlTitle: 'Supabase डेटाबेस टेबल क्वेरी (SQL Database Setup)',
      sqlDesc: 'यह SQL कोड आपको अपने Supabase Dashboard में डालना है ताकि आपकी टेबल्स बन जाएँ।',
      copySqlBtn: 'Copy SQL Query',
      copiedSqlBtn: 'SQL कॉपी हो गया! (Copied)',
      sqlStepsTitle: 'क्वेरी चलाने का 3-स्टेप आसान तरीका:',
      sqlStep1: 'अपने Supabase प्रोजेक्ट का SQL Editor खोलें: ',
      sqlStep2: 'ऊपर दिए गए "Copy SQL Query" बटन पर क्लिक करके पूरा कोड कॉपी करें।',
      sqlStep3: 'वहाँ खाली बॉक्स में Paste करें और हरे रंग का "Run" बटन दबाएँ। आपकी सारी टेबल्स तुरंत बन जाएँगी!',
      sec1Title: '1. सुबह का अनुमान और शाम की गिनती (Morning Target vs Evening Output)',
      sec1Desc: 'फ्लाई ऐश ब्रिक प्लांट में सबसे बड़ी समस्या यह होती है कि "जितना कच्चा माल डाला, क्या उतनी ईंटें बनीं?":',
      sec1Card1Title: '• सुबह का अनुमान (Morning Estimated Target):',
      sec1Card1Desc: 'जैसे ही मुंशी ने 70 बोरी सीमेंट, डस्ट गाड़ी और राख का बैच डाला, सिस्टम तुरंत बता देता है कि आज कम से कम 8,400 ईंटें बननी चाहिए (70 × 120 ईंट/बोरी अनुपात)।',
      sec1Card2Title: '• शाम की गिनती और मिलान (Evening Actual Tally):',
      sec1Card2Desc: 'शाम को मशीन के स्ट्रोक काउंटर या यार्ड में लगी चटकियों से असली गिनती भरी जाती है (जैसे 8,100 ईंटें)। अगर 300 ईंटें कम बनीं, तो सिस्टम तुरंत Variance Alert दिखाता है ताकि पता चल सके कि हॉपर में माल फंसा या कच्ची ईंटें टूटीं।',
      sec2Title: '2. एक ईंट की असली लागत कैसे निकलती है? (Dynamic Costing Formula)',
      sec2Desc: 'ईंट की लागत कभी भी फिक्स ₹3.50 नहीं रहती। सीमेंट का भाव ₹380 से ₹400 हो सकता है, डस्ट गाड़ी कभी महंगी आती है। इसलिए हमारा सिस्टम हर रोज़ का असली भाव जोड़कर प्रति ईंट लागत निकालता है:',
      thComponent: 'लागत का हिस्सा (Component)',
      thFormula: 'हिसाब का तरीका (Formula)',
      thSample: 'उदाहरण (Sample Cost / Brick)',
      rowCement: '1. सीमेंट (Cement)',
      rowCementFormula: '(बोरी संख्या × बोरी का आज का रेट) ÷ कुल बनी ईंटें',
      rowDust: '2. स्टोन डस्ट (Stone Dust)',
      rowDustFormula: '(गाड़ी संख्या × गाड़ी का रेट) ÷ कुल बनी ईंटें',
      rowRaakh: '3. राख / फ्लाई ऐश (Fly Ash)',
      rowRaakhFormula: '(राख की मात्रा × टन रेट) ÷ कुल बनी ईंटें',
      rowWorker: '4. मजदूर लेबर पे-ऑफ (Worker Labor)',
      rowWorkerFormula: 'तय मजदूरी दर (Fixed Payoff Rate)',
      rowTotalCost: 'कुल दैनिक लागत (Total Daily Cost)',
      rowTotalFormula: 'कच्चा माल + मजदूर (0.60) + ओवरहेड',
      rowProfit: 'बिक्री और शुद्ध मुनाफा (Profit)',
      rowProfitFormula: '₹4.00 (बिक्री रेट) − लागत प्रति ईंट',
      sec3Title: '3. लाल रंग की चेतावनी (Loss Alert) कब आती है?',
      sec3Desc: 'अगर किसी दिन सीमेंट बहुत ज्यादा लग गया, मशीन खराब होने से माल बर्बाद हुआ, और एक ईंट बनाने का कुल खर्च ₹4.00 बिक्री भाव से ऊपर (जैसे ₹4.15) चला गया — तो सिस्टम उस दिन को तुरंत RED BADGE (LOSS ALERT) से हाइलाइट कर देता है।',
      sec4Title: '4. प्लांट पर रोज़ाना काम कैसे करें? (Daily 3-Minute Routine)',
      step1Title: 'कदम 1: DAILY ENTRY खोलें',
      step1Desc: 'शाम को "Daily Entry" टैब में जाएँ। आज कितनी ईंटें बनीं वह संख्या दर्ज करें (सिंगल या शिफ्ट अनुसार)।',
      step2Title: 'कदम 2: कच्चा माल डालें',
      step2Desc: 'आज जितनी सीमेंट की बोरियां, डस्ट गाड़ी और राख लगी, वह भरें। दाईं ओर तुरंत एक ईंट का भाव और मुनाफा दिख जाएगा।',
      step3Title: 'कदम 3: बिक्री व सेव करें',
      step3Desc: 'आज जितनी ईंटें बिकीं और भाव दर्ज करके "Save Entry" दबाएँ। आपका स्टॉक, लेबर हिसाब और लेजर अपडेट हो जाएगा!'
    }
  }
};
