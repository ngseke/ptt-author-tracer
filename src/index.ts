import axios from 'axios'
import cheerio from 'cheerio'
import notifier from 'node-notifier'
import chalk from 'chalk'

import env from './modules/env'
import log from './modules/log'
import Article from './interfaces/Article'

const { authorId, delay } = env()

const baseUrl = 'https://www.pttweb.cc/'

const fetchHtml = async (url: string | URL) =>
  (await axios.get(String(url))).data

const task = async () => {
  const list: { [url: string]: Article } = {}
  let hasInit = false

  while ('𝑃𝑇𝑇') {
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
          printArticle(article, true)
          sendNotification(article)
        } else {
          printArticle(article)
        }
      }
    })
    if (!hasInit) log(`\n👀 ${chalk.italic.green(`以上是 ${authorId} 目前最新的 10 篇文章，正在持續監視\n⏰ 每 ${delay} 秒自動再次爬取...\n`)}`)
    hasInit = true

    await new Promise((resolve) => setTimeout(resolve, delay * 1000))
  }
}

const printArticle = (article: Article, isNew = false) => {
  if (isNew) {
    log([
      '🔔  新文章！',
      `🟢  ${chalk.green.bold(article.title)}`,
      `    ${chalk.italic(article.time)}`,
      `    ${chalk.italic(article.url)}`,
    ])
  } else {
    log([
      `🔘  ${chalk.bold(article.title)}`,
      `    ${chalk.italic(article.time)}`,
      `    ${chalk.italic(article.url)}`,
    ])
  }
}

/**
 * 顯示系統原生通知
 */
const sendNotification = (article: Article) => {
  notifier.notify({
    title: article.title,
    message: article.time,
    open: article.url,
  })
}

task()
