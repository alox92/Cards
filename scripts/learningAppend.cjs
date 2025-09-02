#!/usr/bin/env node
/**
 * Append snapshot learning metrics to learning-history.json (Phase 5).
 * Intended to be invoked after a test or perf run (CI or local).
 */
import fs from 'fs'
const FILE = 'learning-history.json'
function read(file){ try { return JSON.parse(fs.readFileSync(file,'utf-8')) } catch { return [] } }
function write(file,data){ fs.writeFileSync(file, JSON.stringify(data,null,2)) }
function main(){
  const history = read(FILE)
  const now = Date.now()
  // Minimal placeholder metrics; in a full environment we could query a persisted profile.
  let profile = null
  try {
    const raw = fs.readFileSync('public/profile-export.json','utf-8')
    profile = JSON.parse(raw)
  } catch {}
  const accuracy = profile?.performance?.overallAccuracy ?? null
  const mastery = profile?.performance?.masteryLevel ?? null
  history.push({ ts: now, accuracy, mastery })
  // Trim
  while(history.length > 500) history.shift()
  write(FILE, history)
  console.log('[learningAppend] snapshot appended', { accuracy, mastery })
}
main()
