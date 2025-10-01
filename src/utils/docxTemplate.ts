// Génération d'un modèle DOCX pour l'import de decks
// Table 3 colonnes: Front | Back | Tags (optionnel)
// Utilise la librairie "docx" (génération côté client)

export async function downloadDocxDeckTemplate() {
  const { Document, Packer, Paragraph, Table, TableRow, TableCell, WidthType, TextRun, HeadingLevel, AlignmentType, BorderStyle } = await import('docx')

  const title = new Paragraph({
    text: 'Modèle Deck – Cards',
    heading: HeadingLevel.HEADING_1,
    alignment: AlignmentType.CENTER,
  })

  const subtitle = new Paragraph({
    children: [
      new TextRun({ text: 'Instructions:', bold: true }),
    ],
  })

  const instructions = [
    '- Remplissez la table ci-dessous. Une ligne = une carte.',
    '- Front = Recto (question) · Back = Verso (réponse).',
    '- Tags: séparés par "," ou ";" (optionnel).',
    '- Vous pouvez utiliser du texte riche (gras, italique, couleur).',
    '- Les images insérées seront importées (selon prise en charge du DOCX).',
  ].map(line => new Paragraph({ text: line }))

  const headerRow = new TableRow({
    children: [
      new TableCell({ children: [ new Paragraph({ children: [ new TextRun({ text: 'Front', bold: true }) ] }) ] }),
      new TableCell({ children: [ new Paragraph({ children: [ new TextRun({ text: 'Back', bold: true }) ] }) ] }),
      new TableCell({ children: [ new Paragraph({ children: [ new TextRun({ text: 'Tags', bold: true }) ] }) ] }),
    ],
    tableHeader: true,
  })

  const exampleRow = new TableRow({
    children: [
      new TableCell({ children: [ new Paragraph('Qu’est-ce que la PWA ?') ] }),
      new TableCell({ children: [ new Paragraph('Application Web Progressive (offline, installable, rapide).') ] }),
      new TableCell({ children: [ new Paragraph('web,offline,pwa') ] }),
    ],
  })

  const table = new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: [headerRow, exampleRow],
    borders: {
      top: { style: BorderStyle.SINGLE, size: 2, color: '999999' },
      bottom: { style: BorderStyle.SINGLE, size: 2, color: '999999' },
      left: { style: BorderStyle.SINGLE, size: 2, color: '999999' },
      right: { style: BorderStyle.SINGLE, size: 2, color: '999999' },
      insideHorizontal: { style: BorderStyle.SINGLE, size: 1, color: 'CCCCCC' },
      insideVertical: { style: BorderStyle.SINGLE, size: 1, color: 'CCCCCC' },
    },
  })

  const doc = new Document({
    sections: [
      {
        children: [title, subtitle, ...instructions, new Paragraph(''), table],
      },
    ],
  })

  const blob = await Packer.toBlob(doc)
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = 'modele-deck-cards.docx'
  a.click()
  setTimeout(() => URL.revokeObjectURL(url), 10_000)
}
