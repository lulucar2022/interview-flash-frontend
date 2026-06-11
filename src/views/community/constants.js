/**
 * Community module shared constants
 */

export const CARD_GRADIENTS = [
  'linear-gradient(135deg, #99c1de 0%, #bcd4e6 100%)',
  'linear-gradient(135deg, #fde2e4 0%, #fad2e1 100%)',
  'linear-gradient(135deg, #c5dedd 0%, #dbe7e4 100%)',
  'linear-gradient(135deg, #eddcd2 0%, #fde2e4 100%)',
  'linear-gradient(135deg, #fad2e1 0%, #bcd4e6 100%)',
  'linear-gradient(135deg, #dbe7e4 0%, #d6e2e9 100%)',
]

export const getGradientById = (id) => CARD_GRADIENTS[id % CARD_GRADIENTS.length]
