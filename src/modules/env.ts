require('dotenv').config()

/**
 * 取得環境變數
 */
export default function env () {
  const { AUTHOR_ID, DELAY } = process.env

  if (!AUTHOR_ID) throw new Error('請設定 `env.AUTHOR_ID`')
  if (!DELAY) throw new Error('請設定 `env.DELAY`')

  return {
    authorId: AUTHOR_ID,
    delay: Number(DELAY) || 60,
  }
}
