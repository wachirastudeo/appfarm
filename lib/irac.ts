import groups from "./irac-data.json"

// Factual classification snapshot: https://irac-online.org/mode-of-action/
// Retrieved 2026-09-06; IRAC MoA classification v11.5 (February 2026).
export const IRAC_SOURCE = "https://irac-online.org/mode-of-action/"
export const IRAC_MIXTURES_SOURCE = "https://irac-online.org/documents/irac-mixture-statement/"
export const iracGroups = groups.map(group => ({ ...group, code: group.code.toUpperCase(), mainGroup: group.mainGroup.toUpperCase() }))
const thaiNames: Record<string, string> = {
  Abamectin: "อะบาเมกติน อะบาเม็กติน", "Emamectin benzoate": "อีมาเมกตินเบนโซเอต อีมาเม็กติน", Imidacloprid: "อิมิดาโคลพริด", Thiamethoxam: "ไทอะมีทอกแซม", Dinotefuran: "ไดโนทีฟูแรน", Acetamiprid: "อะซีทามิพริด", Spinetoram: "สไปนีโทแรม", Spinosad: "สไปโนแซด", Chlorantraniliprole: "คลอแรนทรานิลิโพรล", Cyantraniliprole: "ไซแอนทรานิลิโพรล", Fipronil: "ฟิโพรนิล", Buprofezin: "บูโพรเฟซิน", Pyriproxyfen: "ไพริพรอกซิเฟน", Indoxacarb: "อินดอกซาคาร์บ", Chlorfenapyr: "คลอร์ฟีนาเพอร์", Pymetrozine: "ไพมีโทรซีน", Spiromesifen: "สไปโรมีซิเฟน", Spirotetramat: "สไปโรเตตระแมท", Carbaryl: "คาร์บาริล", Carbosulfan: "คาร์โบซัลแฟน", Methomyl: "เมโทมิล", Cypermethrin: "ไซเพอร์เมทริน", Deltamethrin: "เดลทาเมทริน", "lambda-Cyhalothrin": "แลมบ์ดาไซฮาโลทริน", Sulfoxaflor: "ซัลฟอกซาฟลอร์", Flupyradifurone: "ฟลูไพราไดฟูโรน", Propargite: "โพรพาร์ไกต์", Amitraz: "อะมิทราซ", Azadirachtin: "อะซาดิแรคติน สะเดา", Pyridaben: "ไพริดาเบน", Tebufenpyrad: "ทีบูเฟนไพแรด", Cyflumetofen: "ไซฟลูมีโทเฟน", Lufenuron: "ลูเฟนนูรอน", Flubendiamide: "ฟลูเบนไดอะไมด์", Clothianidin: "โคลไทอะนิดิน",
}
export const iracActives = iracGroups.flatMap(group => group.actives.map(name => ({
  id: `${group.code}:${name}`, name, thai: thaiNames[name] ?? "", code: group.code, mainGroup: group.mainGroup, family: group.family, mechanism: group.mechanism,
})))
export type IracActive = (typeof iracActives)[number]

export function assessIrac(selected: IracActive[], previousGroups: string[]) {
  const known = selected.filter(item => /^\d+$/.test(item.mainGroup))
  return {
    duplicateGroups: [...new Set(known.filter((item, index) => known.findIndex(other => other.mainGroup === item.mainGroup) !== index).map(item => item.mainGroup))],
    repeatedGroups: [...new Set(known.filter(item => previousGroups.includes(item.mainGroup)).map(item => item.mainGroup))],
    unknown: selected.some(item => !/^\d+$/.test(item.mainGroup)),
  }
}

export function labelAmount(rate: number, basis: number, water: number): number | null {
  if (![rate, basis, water].every(value => Number.isFinite(value) && value > 0)) return null
  const amount = rate * water / basis
  return Number.isFinite(amount) ? amount : null
}
