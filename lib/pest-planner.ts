import { iracActives, type IracActive } from "./irac"

export interface PestTreatment {
  name: string
  thai: string
  formulation: string
  ratePer20L?: number
  unit?: "ซีซี" | "กรัม"
  actionType?: "ดูดซึม" | "สัมผัสตาย" | "แทรกซึม" | "ยับยั้งการลอกคราบ"
  highlight?: string
  source: string
}

export interface OrchardPest {
  id: string
  name: string
  hint: string
  targetParts: string[]
  symptoms: string
  beforeSpraying: string
  source: string
  treatments: PestTreatment[]
}

export interface CompatibleFungicide {
  id: string
  name: string
  thai: string
  targetDisease: string
  formulation: string
  ratePer20L: number
  unit: "ซีซี" | "กรัม"
  fracGroup: string
  compatibility: "compatible" | "caution" | "prohibited"
  notes: string
}

export interface IncompatibilityRule {
  id: string
  title: string
  dangerText: string
  guidance: string
  level: "danger" | "warning"
}

// Crop-specific extension guidance
const thripsSource = "https://doaenews.doae.go.th/archives/21295"
const psyllidSource = "https://chumphon.doae.go.th/blog/2026/08/19/เพลี้ยไก่แจ้ทุเรียน/"
const mealybugSource = "https://doaenews.doae.go.th/archives/22721"
const seedBorerSource = "https://doaenews.doae.go.th/archives/26446"
const miteSource = "https://doaenews.doae.go.th/archives/21295"
const caterpillarSource = "https://doaenews.doae.go.th/archives/26446"

export const orchardPests: OrchardPest[] = [
  {
    id: "thrips",
    name: "เพลี้ยไฟ",
    hint: "ยอดอ่อน • ดอก • ผลอ่อน",
    targetParts: ["ยอดอ่อน", "ตาดอก", "ผลอ่อน"],
    symptoms: "แมลงตัวเล็กเรียวยาว สีเหลือง-น้ำตาล ใบอ่อนหงิกงอ ขอบใบม้วน ปลายใบไหม้ กลีบดอกแห้ง ผลอ่อนมีขี้กลากสีเทา",
    beforeSpraying: "สำรวจตรวจนับช่วงแดดจัดและอากาศแล้ง ถ้าพบน้อยให้ใช้น้ำฉีดพ่นเพิ่มความชื้น หรือตัดแต่งกิ่งโปร่งก่อนพิจารณาสารเคมี",
    source: thripsSource,
    treatments: [
      { name: "Spinetoram", thai: "สไปนีโทแรม", formulation: "12% SC", ratePer20L: 10, unit: "ซีซี", actionType: "สัมผัสตาย", highlight: "ออกฤทธิ์เร็ว น็อกเพลี้ยไฟไว ปลอดภัยต่อพืช", source: thripsSource },
      { name: "Imidacloprid", thai: "อิมิดาโคลพริด", formulation: "10% SL", ratePer20L: 15, unit: "ซีซี", actionType: "ดูดซึม", highlight: "ดูดซึมแทรกซึมเข้ายอดอ่อน คุมได้นาน", source: thripsSource },
      { name: "Fipronil", thai: "ฟิโพรนิล", formulation: "5% SC", ratePer20L: 20, unit: "ซีซี", actionType: "สัมผัสตาย", highlight: "กินตายสัมผัสตาย ขยายขอบเขตกำจัดหนอนร่วมด้วย", source: thripsSource },
      { name: "Chlorfenapyr", thai: "คลอร์ฟีนาเพอร์", formulation: "10% SC", ratePer20L: 20, unit: "ซีซี", actionType: "แทรกซึม", highlight: "เหมาะกับเพลี้ยไฟดื้อยา จัดการไรแดงร่วมได้", source: thripsSource },
      { name: "Abamectin", thai: "อะบาเมกติน", formulation: "1.8% EC", ratePer20L: 20, unit: "ซีซี", actionType: "แทรกซึม", highlight: "แทรกซึมเนื้อเยื่อใบ น็อกเพลี้ยและไร", source: thripsSource },
    ],
  },
  {
    id: "psyllid",
    name: "เพลี้ยไก่แจ้",
    hint: "ใบอ่อน • ปุยขาวคล้ายหางกระรอก",
    targetParts: ["ยอดอ่อน", "ใบอ่อน"],
    symptoms: "ตัวอ่อนมีปุยขาวเกาะท้ายลำตัว ดูดกินน้ำเลี้ยงยอดอ่อน ทำให้ใบอ่อนหงิกงอ แห้งเป็นสีน้ำตาล ใบร่วงเหลือก้าน",
    beforeSpraying: "เน้นสำรวจช่วงแตกใบอ่อน (หางปลาทู) อนุรักษ์แมลงช้างปีกใสและแตนเบียน พ่นเมื่อพบการทำลายเกิน 5% ของยอด",
    source: psyllidSource,
    treatments: [
      { name: "Dinotefuran", thai: "ไดโนทีฟูแรน", formulation: "10% WP", ratePer20L: 15, unit: "กรัม", actionType: "ดูดซึม", highlight: "ดูดซึมเร็ว น็อกเพลี้ยไก่แจ้ตายไว", source: psyllidSource },
      { name: "Thiamethoxam", thai: "ไทอะมีทอกแซม", formulation: "25% WG", ratePer20L: 5, unit: "กรัม", actionType: "ดูดซึม", highlight: "ปกป้องยอดอ่อนรุ่นใหม่ที่ผลิออกมาได้ดี", source: psyllidSource },
      { name: "Imidacloprid", thai: "อิมิดาโคลพริด", formulation: "70% WG", ratePer20L: 10, unit: "กรัม", actionType: "ดูดซึม", highlight: "คุมนาน เหมาะฉีดช่วงหางปลาทู", source: psyllidSource },
      { name: "lambda-Cyhalothrin", thai: "แลมบ์ดา-ไซฮาโลทริน", formulation: "2.5% EC", ratePer20L: 25, unit: "ซีซี", actionType: "สัมผัสตาย", highlight: "สัมผัสตายน็อกเร็วเมื่อพบตัวบินเกาะยอด", source: psyllidSource },
      { name: "Clothianidin", thai: "โคลไทอะนิดิน", formulation: "16% SG", ratePer20L: 10, unit: "กรัม", actionType: "ดูดซึม", highlight: "ดูดซึมละลายน้ำดี คุมนาน", source: psyllidSource },
    ],
  },
  {
    id: "spider-mite",
    name: "ไรแดงแอฟริกัน",
    hint: "ใบแก่กร้าน • สีสนิม • แดดแล้ง",
    targetParts: ["ใบแก่", "ใบเพสลาด"],
    symptoms: "ดูดกินน้ำเลี้ยงหน้าใบ ทำให้ใบซีด จุดประขาวเหลือง ใบกร้านคล้ายสีสนิม หลุดร่วงเมื่อระบาดหนัก สวนโทรม",
    beforeSpraying: "สังเกตช่วงอากาศแห้งแล้งฝนทิ้งช่วง ฉีดพ่นน้ำล้างใบช่วยลดประชากรไรแดงได้มากก่อนพิจารณาสารเคมี",
    source: miteSource,
    treatments: [
      { name: "Pyridaben", thai: "ไพริดาเบน", formulation: "20% WP", ratePer20L: 15, unit: "กรัม", actionType: "สัมผัสตาย", highlight: "น็อกตัวอ่อนและตัวแก่รวดเร็ว", source: miteSource },
      { name: "Cyflumetofen", thai: "ไซฟลูมีโทเฟน", formulation: "20% SC", ratePer20L: 15, unit: "ซีซี", actionType: "สัมผัสตาย", highlight: "ออกฤทธิ์จำเพาะต่อไร ปลอดภัยต่อแมลงดี", source: miteSource },
      { name: "Tebufenpyrad", thai: "ทีบูเฟนไพแรด", formulation: "20% WP", ratePer20L: 12, unit: "กรัม", actionType: "สัมผัสตาย", highlight: "น็อกไวและมีฤทธิ์ตกค้างคุมนาน", source: miteSource },
      { name: "Spiromesifen", thai: "สไปโรมีซิเฟน", formulation: "24% SC", ratePer20L: 10, unit: "ซีซี", actionType: "ยับยั้งการลอกคราบ", highlight: "คุมไข่และตัวอ่อน หยุดการแพร่พันธุ์", source: miteSource },
      { name: "Propargite", thai: "โพรพาร์ไกต์", formulation: "57% EC", ratePer20L: 30, unit: "ซีซี", actionType: "สัมผัสตาย", highlight: "ไอระเหยและสัมผัสตาย คุมไรดื้อยา", source: miteSource },
    ],
  },
  {
    id: "fruit-borer",
    name: "หนอนเจาะผลและเมล็ด",
    hint: "ผลทุเรียน • รูเจาะ • ขี้หนอน",
    targetParts: ["ผลอ่อน", "ผลแก่", "เมล็ด"],
    symptoms: "มีรูเจาะที่เปลือกผล พบขี้หนอนสีน้ำตาลติดอยู่ภายนอก หรือเจาะลึกเข้าไปกัดกินเนื้อและเมล็ดทุเรียนเน่าเสียหาย",
    beforeSpraying: "ตัดแต่งผลชิดกันไม่ให้หนอนซ่อนตัว ติดกับดักฟีโรโมนล่อผีเสื้อกลางคืน ห่อผลทุเรียนเมื่อผลอายุ 60 วัน",
    source: seedBorerSource,
    treatments: [
      { name: "Chlorantraniliprole", thai: "คลอแรนทรานิลิโพรล", formulation: "5% SC", ratePer20L: 15, unit: "ซีซี", actionType: "แทรกซึม", highlight: "คุมไข่และตัวหนอนได้นาน ปลอดภัยต่อผลอ่อน", source: seedBorerSource },
      { name: "Emamectin benzoate", thai: "อีมาเมกตินเบนโซเอต", formulation: "5% WG", ratePer20L: 10, unit: "กรัม", actionType: "แทรกซึม", highlight: "หนอนกินหยุดกินทันที สัมผัสและกินตาย", source: seedBorerSource },
      { name: "Lufenuron", thai: "ลูเฟนนูรอน", formulation: "5% EC", ratePer20L: 15, unit: "ซีซี", actionType: "ยับยั้งการลอกคราบ", highlight: "ยับยั้งสร้างเปลือกไคติน ไข่ฝ่อ หนอนไม่ลอกคราบ", source: seedBorerSource },
      { name: "Deltamethrin", thai: "เดลทาเมทริน", formulation: "3% EC", ratePer20L: 15, unit: "ซีซี", actionType: "สัมผัสตาย", highlight: "น็อกตัวเต็มวัยผีเสื้อกลางคืนช่วงบินวางไข่", source: seedBorerSource },
      { name: "Carbaryl", thai: "คาร์บาริล", formulation: "85% WP", ratePer20L: 40, unit: "กรัม", actionType: "สัมผัสตาย", highlight: "สัมผัสตายและกินตาย คุมแมลงปีกแข็งร่วมได้", source: seedBorerSource },
    ],
  },
  {
    id: "mealybug",
    name: "เพลี้ยแป้งและเพลี้ยหอย",
    hint: "ผงขาว • ขุยเกาะกิ่งผล • ราดำ",
    targetParts: ["ขั้วผล", "ร่องหนาม", "กิ่งก้าน"],
    symptoms: "กลุ่มขุยแป้งสีขาวหรือเกล็ดหอยเกาะตามขั้วผล ร่องหนาม ขับถ่ายมูลหวานทำให้เกิดราดำ ผลผิวลายตกเกรด",
    beforeSpraying: "กำจัดมดดำที่เป็นพาหะขนเพลี้ย ตัดแต่งกิ่งให้โปร่ง พ่นน้ำแรงดันสูงล้างคราบก่อนพ่นสารเฉพาะจุด",
    source: mealybugSource,
    treatments: [
      { name: "Buprofezin", thai: "บูโพรเฟซิน", formulation: "25% WP", ratePer20L: 25, unit: "กรัม", actionType: "ยับยั้งการลอกคราบ", highlight: "คุมไข่และตัวอ่อนเพลี้ยหอย/แป้งได้ดีเยี่ยม", source: mealybugSource },
      { name: "Spirotetramat", thai: "สไปโรเตตระแมท", formulation: "24% SC", ratePer20L: 10, unit: "ซีซี", actionType: "ดูดซึม", highlight: "ดูดซึม 2 ทิศทาง ซึมถึงซอกหนามและใต้เปลือก", source: mealybugSource },
      { name: "Dinotefuran", thai: "ไดโนทีฟูแรน", formulation: "10% WP", ratePer20L: 15, unit: "กรัม", actionType: "ดูดซึม", highlight: "น็อกตัวเต็มวัยและดูดซึมกำจัดตัวดูดกิน", source: seedBorerSource },
      { name: "Carbaryl", thai: "คาร์บาริล", formulation: "85% WP", ratePer20L: 40, unit: "กรัม", actionType: "สัมผัสตาย", highlight: "กำจัดเพลี้ยและมดพาหะพร้อมกัน", source: mealybugSource },
    ],
  },
  {
    id: "leaf-caterpillar",
    name: "หนอนกินใบและหนอนหน้าแมว",
    hint: "ใบแหว่ง • ใบพรุน • ตัวหนอนขน",
    targetParts: ["ใบอ่อน", "ใบเพสลาด", "ใบแก่"],
    symptoms: "กัดกินใบอ่อนและใบเพสลาดจนเหลือแต่เส้นใบ ทำให้ต้นสังเคราะห์แสงไม่ได้ ยอดชะงัก ช่อดอกร่วง",
    beforeSpraying: "จับตัวหนอนทำลายตอนเช้า สำรวจไข่ใต้ใบ อนุรักษ์ต่อ แตนเบียน และนกกินหนอน",
    source: caterpillarSource,
    treatments: [
      { name: "Flubendiamide", thai: "ฟลูเบนไดอะไมด์", formulation: "20% WG", ratePer20L: 6, unit: "กรัม", actionType: "แทรกซึม", highlight: "หนอนหยุดกินทันที สลายกล้ามเนื้อหนอน คุมนาน", source: caterpillarSource },
      { name: "Chlorantraniliprole", thai: "คลอแรนทรานิลิโพรล", formulation: "5% SC", ratePer20L: 15, unit: "ซีซี", actionType: "แทรกซึม", highlight: "กำจัดหนอนผีเสื้อทุกระยะ ปลอดภัยสูง", source: caterpillarSource },
      { name: "Indoxacarb", thai: "อินดอกซาคาร์บ", formulation: "15% SC", ratePer20L: 15, unit: "ซีซี", actionType: "สัมผัสตาย", highlight: "กินตายและสัมผัสตาย หนอนตัวใหญ่ตายไว", source: caterpillarSource },
      { name: "Emamectin benzoate", thai: "อีมาเมกตินเบนโซเอต", formulation: "5% WG", ratePer20L: 10, unit: "กรัม", actionType: "แทรกซึม", highlight: "ซึมลึกใต้ใบ หนอนกัดกินแล้วหยุดทำลาย", source: caterpillarSource },
    ],
  },
]

// Top Compatible Fungicides for tank-mixing in Thai durian orchards
export const compatibleFungicides: CompatibleFungicide[] = [
  {
    id: "azoxystrobin",
    name: "Azoxystrobin",
    thai: "อะซอกซีสโตรบิน",
    targetDisease: "โรคราใบติด, แอนแทรคโนสใบและผล",
    formulation: "25% SC",
    ratePer20L: 10,
    unit: "ซีซี",
    fracGroup: "FRAC 11",
    compatibility: "compatible",
    notes: "ผสมกับสารกำจัดแมลงส่วนใหญ่ได้ดีมาก แนะนำพ่นช่วงใบอ่อนหรือผลอ่อน",
  },
  {
    id: "difenoconazole",
    name: "Difenoconazole",
    thai: "ไดฟีโนโคนาโซล",
    targetDisease: "โรคแอนแทรคโนส, ราดำ, จุดใบสนิม",
    formulation: "25% EC",
    ratePer20L: 10,
    unit: "ซีซี",
    fracGroup: "FRAC 3",
    compatibility: "compatible",
    notes: "แทรกซึมเข้าเนื้อเยื่อพืชดีเยี่ยม ผสมร่วมกับยาฆ่าแมลงสูตร SC/WP ได้ปลอดภัย",
  },
  {
    id: "mancozeb",
    name: "Mancozeb",
    thai: "แมนโคเซบ",
    targetDisease: "โรคใบจุด, ราใบติด, แอนแทรคโนส",
    formulation: "80% WP",
    ratePer20L: 40,
    unit: "กรัม",
    fracGroup: "FRAC M03",
    compatibility: "compatible",
    notes: "ยาเคลือบใบสัมผัส ละลายน้ำคนให้เข้ากันก่อนเทสารชนิดอื่น ห้ามผสมสารด่างจัด",
  },
  {
    id: "propineb",
    name: "Propineb",
    thai: "โพรพิเนบ",
    targetDisease: "โรคใบจุดสีน้ำตาล, แอนแทรคโนส, เสริมธาตุสังกะสี",
    formulation: "70% WP",
    ratePer20L: 30,
    unit: "กรัม",
    fracGroup: "FRAC M03",
    compatibility: "compatible",
    notes: "ช่วยเคลือบใบและให้ธาตุสังกะสีทำให้ใบเขียวเข้ม ผสมกับยาฆ่าแมลงได้กว้างขวาง",
  },
  {
    id: "metalaxyl",
    name: "Metalaxyl",
    thai: "เมทาแลกซิล",
    targetDisease: "โรครากเน่าโคนเน่า, ไฟทอปธอราผล",
    formulation: "35% WP",
    ratePer20L: 30,
    unit: "กรัม",
    fracGroup: "FRAC 4",
    compatibility: "compatible",
    notes: "ดูดซึมดี ผสมพ่นทรงพุ่มหรือทาแผลร่วมกับสารฆ่าแมลงได้",
  },
]

// Strict Incompatibility & Warning Rules
export const tankMixRules: IncompatibilityRule[] = [
  {
    id: "copper-prohibition",
    title: "สารประกอบทองแดง (Copper Fungicides)",
    dangerText: "ห้ามผสมคอปเปอร์ไฮดรอกไซด์ / คอปเปอร์ออกซีคลอไรด์ กับยาฆ่าแมลงกลุ่มออร์กาโนฟอสเฟตหรือคาร์บาเมต และปุ๋ยทางใบ",
    guidance: "คอปเปอร์มีฤทธิ์เป็นด่างสูงและทำปฏิกิริยาตกตะกอน ทำให้สารฆ่าแมลงเสื่อมฤทธิ์ทันที และอาจเกิดพิษใบไหม้ ให้พ่นแยกเดี่ยวห่างกันอย่างน้อย 5-7 วัน",
    level: "danger",
  },
  {
    id: "sulfur-oil-prohibition",
    title: "กำมะถัน (Sulfur) กับ น้ำมันปิโตรเลียม / ไวท์ออยล์",
    dangerText: "ห้ามผสมกำมะถันกับไวท์ออยล์ หรือสารที่มีสูตรน้ำมันเข้มข้นเด็ดขาด",
    guidance: "การเจอกันของกำมะถันและน้ำมันจะทำลายชั้นไขบนใบพืช ก่อให้เกิดใบไหม้และผลลายรุนแรง ต้องเว้นระยะพ่นห่างกันอย่างน้อย 14-21 วัน",
    level: "danger",
  },
  {
    id: "multiple-ec-caution",
    title: "การผสมสูตร EC (น้ำมัน) ซ้ำซ้อนช่วงอากาศร้อน",
    dangerText: "หลีกเลี่ยงการผสมสารสูตร EC เกิน 2 ชนิดในถังเดียวช่วงแดดจัดเกิน 35°C",
    guidance: "ตัวทำละลายน้ำมันเข้มข้นสะสมร่วมกับความร้อนสูงจะทำให้ยอดอ่อนหงิกไหม้และผิวผลอ่อนลายด้าน ให้เปลี่ยนเป็นสูตร SC/WG หรือพ่นตอนแดดร่มลมสงบ",
    level: "warning",
  },
  {
    id: "fosetyl-acidity",
    title: "ฟอสอีทิล-อะลูมิเนียม (Fosetyl-Al)",
    dangerText: "ห้ามผสมกับคอปเปอร์ และห้ามผสมกับปุ๋ยทางใบที่มีไนโตรเจนสูง",
    guidance: "เนื่องจากมีสภาพความเป็นกรดรุนแรง หากผสมกับสารที่เป็นด่างจะจับตัวเป็นก้อนอุดตันหัวฉีดทันที",
    level: "warning",
  },
]

// Standard WALES Mixing Order Guide
export const tankMixingOrder = [
  {
    step: 1,
    code: "W",
    name: "Wettable Powder / WG",
    thai: "สารผงละลายน้ำ / เม็ดกระจายน้ำ",
    detail: "เติมน้ำครึ่งถังแล้วเปิดระบบกวน นำสารผงละลายในน้ำภาชนะเล็กก่อนเทลงถังใหญ่เสมอ",
    examples: "แมนโคเซบ WP, ไดโนทีฟูแรน WP, ไทอะมีทอกแซม WG",
  },
  {
    step: 2,
    code: "A",
    name: "Agitate",
    thai: "กวนให้เข้ากันอย่างทั่วถึง",
    detail: "กวนหรือหมุนเวียนน้ำในถังอย่างน้อย 2-3 นาทีเพื่อให้สารผงกระจายตัวเต็มที่ ไม่นอนก้น",
    examples: "เปิดปั๊มหมุนเวียนน้ำในถัง 200 หรือ 1,000 ลิตร",
  },
  {
    step: 3,
    code: "L",
    name: "Liquid Flowable / SC",
    thai: "สารแขวนลอยเข้มข้น / ของเหลวข้น",
    detail: "เขย่าขวดก่อนเท สารกลุ่มนี้จะผสมเข้ากับน้ำได้ดีหลังจากสารผงกระจายตัวแล้ว",
    examples: "สไปนีโทแรม SC, อะซอกซีสโตรบิน SC, ฟลูเบนไดอะไมด์ SC",
  },
  {
    step: 4,
    code: "E",
    name: "Emulsifiable Concentrate / EC",
    thai: "สารสูตรน้ำมัน / อิมัลชันเข้มข้น",
    detail: "เทสารสูตรน้ำมันลงตามหลังสารแขวนลอย น้ำในถังจะกลายเป็นสีขาวน้ำนมอย่างสม่ำเสมอ",
    examples: "ไซเพอร์เมทริน EC, โพรพาร์ไกต์ EC, ไดฟีโนโคนาโซล EC",
  },
  {
    step: 5,
    code: "S",
    name: "Soluble Liquid & Surfactant",
    thai: "สารละลายน้ำใส และสารจับใบ",
    detail: "เติมน้ำให้เต็มถังตามปริมาตรที่ต้องการ แล้วใส่สารจับใบเป็นลำดับสุดท้ายสุดเพื่อป้องกันฟองล้น",
    examples: "อิมิดาโคลพริด SL, สารเสริมประสิทธิภาพ / สารจับใบซิลิโคน",
  },
]

export function getPestTreatments(pestId: string) {
  const pest = orchardPests.find(item => item.id === pestId)
  return (pest?.treatments ?? []).flatMap(treatment => {
    const active = iracActives.find(item => item.name === treatment.name)
    return active ? [{ ...treatment, active }] : []
  })
}

export type PairStatus = "same-active" | "same-group" | "unknown" | "unverified"

export function assessPestPair(primary: IracActive, partner: IracActive): PairStatus {
  if (primary.id === partner.id) return "same-active"
  if (!/^\d+$/.test(primary.mainGroup) || !/^\d+$/.test(partner.mainGroup)) return "unknown"
  if (primary.mainGroup === partner.mainGroup) return "same-group"
  return "unverified"
}

export const documentedPremixes = [
  {
    pestId: "psyllid",
    actives: ["Thiamethoxam", "lambda-Cyhalothrin"],
    label: "ไทอะมีทอกแซม + แลมบ์ดา-ไซฮาโลทริน",
    formulation: "14.1% / 10.6% ZC",
    source: psyllidSource,
  },
]

export function getPestPartners(pestId: string, primaryName: string) {
  const treatments = getPestTreatments(pestId)
  const primary = treatments.find(item => item.name === primaryName)
  if (!primary) return []
  return treatments
    .filter(item => item.name !== primaryName)
    .map(item => ({
      ...item,
      status: assessPestPair(primary.active, item.active),
    }))
}

export function calculateTankDose(ratePer20L: number, tankLiters: number): number {
  if (ratePer20L <= 0 || tankLiters <= 0) return 0
  return (ratePer20L * tankLiters) / 20
}

