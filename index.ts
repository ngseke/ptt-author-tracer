import axios from 'axios'
import cheerio from 'cheerio'
import notifier from 'node-notifier'
import chalk from 'chalk'

const { log } = console

require('dotenv').config()

const { authorId, delay } = (() => {
  const { AUTHOR_ID, DELAY } = process.env
  if (!AUTHOR_ID) throw new Error('請設定 `env.AUTHOR_ID`')
  if (!DELAY) throw new Error('請設定 `env.DELAY`')
  return {
    authorId: AUTHOR_ID,
    delay: Number(DELAY),
  }
})()

const baseUrl = 'https://www.pttweb.cc/'

type Article = { title: string, author: string, time: string, url: string }

const fetchHtml = async (url: string | URL) =>
  (await axios.get(String(url))).data

const task = async () => {
  const list: { [url: string]: Article } = {}
  let hasInit = false

  while (1) {
    const html = await fetchHtml(new URL(`/user/${authorId}?t=article`, baseUrl))
    const $ = cheerio.load(html)
    const $items = $('.thread-item')

    const articles = $items.map((_, $el) => {
      const $item = $($el)
      return {
        title: $item.find('.thread-title').text(),
        author: $item.find('.thread-list-author').text()
          .match(/作者: (.+) - 發表於/)?.[1],
        time: $item.find('.thread-posttime').text(),
        url: String(new URL($item.find('a').attr('href') as string, baseUrl)),
      } as Article
    }).toArray() as unknown as Article[]

    articles.reverse().forEach(article => {
      if (!list[article.url]) {
        list[article.url] = article

        if (hasInit) {
          notifier.notify({ title: article.title, message: article.time })
          log('🔔  新文章！')
          log(`🟢  ${chalk.green.bold(article.title)}  \n    ${chalk.italic(article.time)}`)
          log('')
        } else {
          log(`🔘  ${chalk.bold(article.title)}  \n    ${chalk.italic(article.time)}`)
        }
      }
    })
    if (!hasInit) log(`\n👀 ${chalk.italic.green(`以上是 ${authorId} 目前最新的 10 篇文章，正在持續監視\n⏰ 每 ${delay} 秒自動再次爬取...\n`)}`)
    hasInit = true

    await new Promise((resolve) => setTimeout(resolve, delay * 1000))
  }
}

task()
