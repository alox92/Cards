// Simple image compression (canvas downscale + quality) to limit data URL size
export async function compressImageToDataUrl(file: File, maxWidth=1400, maxHeight=1400, quality=0.82): Promise<string> {
  const bitmap = await createImageBitmap(file)
  let { width, height } = bitmap
  const scale = Math.min(1, maxWidth/width, maxHeight/height)
  if(scale < 1){ width = Math.round(width*scale); height = Math.round(height*scale) }
  const canvas = document.createElement('canvas')
  canvas.width = width; canvas.height = height
  const ctx = canvas.getContext('2d')!
  ctx.drawImage(bitmap,0,0,width,height)
  let dataUrl = ''
  try { dataUrl = canvas.toDataURL('image/webp', quality) } catch { /* ignore */ }
  if(!dataUrl || dataUrl.length > 2_000_000) { // if still big, try jpeg
    dataUrl = canvas.toDataURL('image/jpeg', quality)
  }
  return dataUrl
}

export function estimateDataUrlSize(dataUrl: string): number {
  const base64 = dataUrl.split(',')[1] || ''
  return Math.round((base64.length * 3) / 4)
}
