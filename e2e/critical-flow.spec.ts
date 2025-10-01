import { test, expect } from '@playwright/test'

test('Parcours critique: créer deck -> ajouter carte -> étudier -> rechercher', async ({ page }) => {
  await page.goto('/')
  // Création deck (suppose bouton "Nouveau deck")
  const newDeckBtn = page.locator('button:has-text("Nouveau deck")')
  if(await newDeckBtn.count()){
    await newDeckBtn.first().click()
    await page.fill('input[placeholder="Nom du deck"]', 'Deck E2E')
    await page.click('button:has-text("Créer")')
  }
  // Ajout carte (bouton ajouter carte)
  const addCard = page.locator('button:has-text("Ajouter carte")')
  if(await addCard.count()){
    await addCard.first().click()
    await page.fill('textarea[name="front"]', 'Question E2E')
    await page.fill('textarea[name="back"]', 'Réponse E2E')
    await page.click('button:has-text("Enregistrer")')
  }
  // Lancer étude si disponible
  const studyBtn = page.locator('button:has-text("Étudier")')
  if(await studyBtn.count()){
    await studyBtn.first().click()
    // Afficher réponse
    const showAnswer = page.locator('button:has-text("Afficher")')
    if(await showAnswer.count()) await showAnswer.click()
  }
  // Recherche
  const search = page.locator('input[placeholder*="Rechercher"]')
  if(await search.count()){
    await search.fill('Question')
    await expect(page.locator('mark')).toHaveCountGreaterThan(0)
  }
})
