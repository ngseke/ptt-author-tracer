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

  while ('๐๐๐') {
    const html = await fetchHtml(new URL(`/user/${authorId}?t=article`, baseUrl))
    const $ = cheerio.load(html)
    const $items = $('.thread-item')

    const articles = $items.map((_, $el) => {
      const $item = $($el)
      return {
        title: $item.find('.thread-title').text(),
        author: $item.find('.thread-list-author').text()
          .match(/ไฝ่: (.+) - ็ผ่กจๆผ/)?.[1],
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
    if (!hasInit) log(`\n๐ ${chalk.italic.green(`ไปฅไธๆฏ ${authorId} ็ฎๅๆๆฐ็ 10 ็ฏๆ็ซ ๏ผๆญฃๅจๆ็บ็ฃ่ฆ\nโฐ ๆฏ ${delay} ็ง่ชๅๅๆฌก็ฌๅ...\n`)}`)
    hasInit = true

    await new Promise((resolve) => setTimeout(resolve, delay * 1000))
  }
}

const printArticle = (article: Article, isNew = false) => {
  if (isNew) {
    log([
      '๐  ๆฐๆ็ซ ๏ผ',
      `๐ข  ${chalk.green.bold(article.title)}`,
      `    ${chalk.italic(article.time)}`,
      `    ${chalk.italic(article.url)}`,
    ])
  } else {
    log([
      `๐  ${chalk.bold(article.title)}`,
      `    ${chalk.italic(article.time)}`,
      `    ${chalk.italic(article.url)}`,
    ])
  }
}

/**
 * ้กฏ็คบ็ณป็ตฑๅ็้็ฅ
 */
const sendNotification = (article: Article) => {
  notifier.notify({
    title: article.title,
    message: article.time,
    open: article.url,
  })
}

task()
