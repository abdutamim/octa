import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

const OLD_THEME_HEXES = [
  '#100910', '#110a10', '#160d15', '#1a0d18', '#1b0e19', '#1b121c', '#241120', '#261522', '#271625',
  '#2d7045', '#3c202f', '#48203f', '#4a2536', '#4c1537', '#4d2c3b', '#5b1b42', '#5b3547', '#61203c',
  '#655462', '#694556', '#6b5a64', '#6d3c52', '#6d5663', '#755467', '#755e69', '#786873', '#7b3151',
  '#7c6973', '#7d1f43', '#7f6d77', '#806976', '#846d77', '#87bd91', '#8a5a22', '#8d7d87', '#8e2349',
  '#8f536e', '#927f8a', '#a63a62', '#a8798d', '#a89aa8', '#a8c8a5', '#a98c98', '#aabfa5', '#ae9aa4',
  '#b3718b', '#b98298', '#bca9ca', '#bd6b8a', '#bf7e99', '#c18f72', '#c18fa3', '#c18fd0', '#c28da2',
  '#c6ad94', '#cdbba5', '#d3acb3', '#d5b87d', '#d67382', '#d7c297', '#d7c7b3', '#d8c5a3', '#d9b7c7',
  '#d9c8af', '#dccbb6', '#dfaf83', '#dfc28d', '#e0a06c', '#e0b96c', '#e1a1b4', '#e2a1a5', '#e2cda7',
  '#e4b1be', '#efe1cf', '#f0dfbc', '#f1a8d4', '#f1e5d7', '#f4ead9', '#f5e8cf', '#f6c0d7', '#f6ebd4',
  '#f8f0e3', '#faf4e9', '#fff3e1', '#fff9ee', '#fffaf1'
] as const

describe('Octa Code visual identity', () => {
  it('removes the previous burgundy, plum, and cream palette from styles.css', () => {
    const styles = readFileSync(resolve(process.cwd(), 'src/styles.css'), 'utf8').toLowerCase()
    for (const hex of OLD_THEME_HEXES) expect(styles).not.toContain(hex)
  })
})
