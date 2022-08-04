const fs = require('fs')
require('dotenv').config()

const { chromium } = require('playwright')

const sleep = time => {
  return new Promise(resolve => setTimeout(resolve, time * 1000))
}

async function main() {
  const browser = await chromium.launch({ headless: false })
  const context = await browser.newContext()
  const page = await context.newPage()

  let linkedins = fs.readFileSync('./links.txt', 'utf8').split('\r\n')

  let people = []

  await page.goto('https://www.linkedin.com/login/pt')
  await page.locator('#username').fill(process.env.EMAIL)
  await page.locator('#password').fill(process.env.PASSWORD)
  await page.locator('button[type="submit"]').click()

  let person
  for (let i = 0; i < linkedins.length; i++) {
    person = linkedins[i]
    const obj = {}

    await page.goto(person)

    // name
    obj.name = await page.locator('h1.text-heading-xlarge').textContent()

    obj.roles = []
    // company and role
    const rolesElements = await page.locator(
      '#experience ~ div li .t-bold span:nth-child(1)'
    )
    for (const el of await rolesElements.elementHandles()) {
      let text = await el.textContent()
      obj.roles.push(text.trim())
    }

    people.push(obj)
  }

  await browser.close()

  const header = Object.keys(people[0])

  const csv = [
    header.join(','),
    ...people.map(row =>
      header.map(fieldName => JSON.stringify(row[fieldName], '')).join(',')
    )
  ].join('\r\n')

  fs.writeFileSync('./data.csv', csv)
}

main()
