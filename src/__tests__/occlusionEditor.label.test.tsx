import { describe, it, expect } from 'vitest'
import { render, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import OcclusionEditor from '@/ui/components/Occlusion/OcclusionEditor'

describe('OcclusionEditor label editing', () => {
  it('edits label on double click + enter', async () => {
    const regions = [{ id:'occ_1', x:0.1, y:0.1, width:0.2, height:0.2 }]
    let current = regions
    const user = userEvent.setup()
    const { getByText, getByRole } = render(<OcclusionEditor regions={current} onChange={r=> current=r} height={160} />)
    const badge = getByText('1')
    await user.dblClick(badge.parentElement!)
    const input = getByRole('textbox') as HTMLInputElement
    await user.clear(input)
    await user.type(input, 'Foie')
    await user.keyboard('{Enter}')
    await waitFor(()=> { expect((current[0] as any).label).toBe('Foie') })
  })
})
