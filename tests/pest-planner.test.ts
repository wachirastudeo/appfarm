import assert from "node:assert/strict"
import test from "node:test"
import { iracActives, assessIrac } from "../lib/irac"
import { assessPestPair, documentedPremixes, getPestPartners, getPestTreatments, orchardPests, calculateTankDose } from "../lib/pest-planner"

const active = (name: string) => {
  const found = iracActives.find(item => item.name === name)
  assert.ok(found, `Missing IRAC active: ${name}`)
  return found
}

test("every pest treatment resolves to IRAC and has a crop guidance source", () => {
  for (const pest of orchardPests) {
    assert.equal(getPestTreatments(pest.id).length, pest.treatments.length)
    assert.equal(new Set(pest.treatments.map(item => item.name)).size, pest.treatments.length)
    for (const item of getPestTreatments(pest.id)) {
      assert.ok(item.formulation)
      assert.ok(new URL(item.source).hostname.endsWith("doae.go.th"))
    }
  }
})
test("thrips shows only curated durian treatments, not the full IRAC catalog", () => {
  assert.deepEqual(getPestTreatments("thrips").map(item => item.name), [
    "Spinetoram",
    "Imidacloprid",
    "Fipronil",
    "Chlorfenapyr",
    "Abamectin",
  ])
})
test("unknown pests and stale primary selections cannot produce suggestions", () => {
  assert.deepEqual(getPestTreatments("unknown"), [])
  assert.deepEqual(getPestPartners("unknown", "Imidacloprid"), [])
  assert.deepEqual(getPestPartners("thrips", "Thiamethoxam"), [])
})
test("partners exclude the primary and stay within the selected pest", () => {
  for (const pest of orchardPests) {
    for (const primary of pest.treatments) {
      for (const partner of getPestPartners(pest.id, primary.name)) {
        assert.notEqual(partner.name, primary.name)
        assert.ok(pest.treatments.some(item => item.name === partner.name))
      }
    }
  }
})
test("different groups never imply tank compatibility", () => {
  assert.equal(assessPestPair(active("Imidacloprid"), active("Fipronil")), "unverified")
  assert.equal(getPestPartners("thrips", "Imidacloprid")[0].status, "unverified")
})
test("same active, main group and subgroup overlap are identified", () => {
  assert.equal(assessPestPair(active("Imidacloprid"), active("Imidacloprid")), "same-active")
  assert.equal(assessPestPair(active("Imidacloprid"), active("Thiamethoxam")), "same-group")
  assert.equal(assessPestPair(active("Imidacloprid"), active("Sulfoxaflor")), "same-group")
})
test("unknown mode of action cannot be classed as a different known group", () => {
  const unknown = iracActives.find(item => item.mainGroup === "UN")
  assert.ok(unknown)
  assert.equal(assessPestPair(unknown, active("Imidacloprid")), "unknown")
})
test("premix evidence is crop/pest/formulation specific, never a tank mix approval", () => {
  assert.equal(documentedPremixes.some(item => item.pestId === "thrips"), false)
  for (const premix of documentedPremixes) {
    const treatments = getPestTreatments(premix.pestId)
    assert.equal(premix.formulation, "14.1% / 10.6% ZC")
    assert.ok(premix.actives.every(name => treatments.some(item => item.name === name)))
    assert.equal(assessPestPair(active(premix.actives[0]), active(premix.actives[1])), "unverified")
  }
})
test("advanced inspection receives both compounds and detects previous groups", () => {
  const primary = getPestTreatments("thrips").find(item => item.name === "Imidacloprid")!
  const partner = getPestPartners("thrips", primary.name).find(item => item.name === "Fipronil")!
  assert.deepEqual(assessIrac([primary.active, partner.active], ["4", "2"]).repeatedGroups, ["4", "2"])
})
test("calculateTankDose calculates correct proportional doses for tanks", () => {
  assert.equal(calculateTankDose(15, 20), 15)
  assert.equal(calculateTankDose(15, 200), 150)
  assert.equal(calculateTankDose(15, 1000), 750)
  assert.equal(calculateTankDose(0, 200), 0)
})
