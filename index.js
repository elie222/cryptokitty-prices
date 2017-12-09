import cheerio from 'cheerio'
import axios from 'axios'
import moment from 'moment'
import _ from 'lodash'
import Web3 from 'web3'

// create an instance of web3 using the HTTP provider.
// NOTE in mist web3 is already available, so check first if it's available before instantiating
// const web3 = new Web3(new Web3.providers.HttpProvider("http://localhost:8545"));
var web3 = new Web3(Web3.givenProvider || 'http://localhost:8545')

export const getKitties = () => {
  const offset = 0
  const limit = 100 // max 100
  // const type = 'sire'
  const type = 'sale'
  const status = 'open'
  // const sorting = 'cheap';
  // const orderBy = 'current_price';
  // const orderDirection = 'asc';
  // const search = '%20gen:19%20gen:18%20gen:20'; // what is this?
  // const generation = '5'; // only works with /kittie endpoint

  let url
  let field

  // if (generation) {
  //   field = 'kitties'
  //   url = `https://api.cryptokitties.co/${field}?offset=${offset}&limit=${limit}&generation=${generation}`
  // } else {
  field = 'auctions'
  url =
    `https://api.cryptokitties.co/${field}` +
    `?offset=${offset}&limit=${limit}&type=${type}&status=${status}`
  // + `&sorting=${sorting}&orderBy=${orderBy}&orderDirection=${orderDirection}`
  // }

  // const url = `https://api.cryptokitties.co/auctions?type=sale&limit=2&sorting=cheap&orderBy=current_price&orderDirection=asc&sorting=cheap&status=open&search=%20gen:19%20gen:18%20gen:20`

  console.log(url)

  return axios
    .get(url)
    .then(response => parseKitties(response, field))
    .catch(error => {
      console.error('Error:')
      console.error(error)
    })
}

const fromWei = price => web3.utils.fromWei(price, 'ether')

const sortAuctions = auctions => {
  return _.sortBy(auctions, auction => {
    const ethPrice = parseFloat(fromWei(auction.current_price))

    return ethPrice
  })
}

const parseKitties = ({ data }, field) => {
  // console.log(response.data)

  const { total, offset, limit, auctions } = data
  const items = data[field]

  // change this to the highest generation kitties you're interested in purchasing
  const MAX_GENERATION = 5
  const filteredAuctions = _.filter(items, item => item.kitty.generation <= MAX_GENERATION)
  const sortedAuctions = sortAuctions(filteredAuctions)

  const cheapestKitty = sortedAuctions[0]
  const priciestKitty = sortedAuctions[sortedAuctions.length - 1]

  const groupedAuctions = _.groupBy(sortedAuctions, auction => auction.kitty.generation)

  if (true) {
    _.each(groupedAuctions, (auctions, key) => {
      const { average, cheapest, cheapestUrl /*, priciest*/ } = getStats(auctions)

      console.log(`====== GENERATION ${key} ======`)
      console.log(`Count: ${auctions.length}`)
      console.log(`Average: ${average}`)
      console.log(`Cheapest: ${cheapest}`)
      console.log(`Cheapest URL: ${cheapestUrl}`)
      // console.log(`Priciest: ${priciest}`)
      console.log('')
    })
  }

  printKitty(cheapestKitty)
}

const getKittyUrl = kitty => `https://www.cryptokitties.co/kitty/${kitty.id}`

const printKitty = auction => {
  const { kitty, current_price } = auction

  console.log('======KITTY')
  console.log('price:', fromWei(current_price))
  console.log('gen:', kitty.generation)
  console.log('cooldown:', kitty.status.cooldown_index)
  // console.log('is_gestating:', kitty.status.is_gestating)
  // console.log('is_ready:', kitty.status.is_ready)
  console.log('url:', getKittyUrl(kitty))
  console.log('')
}

const getStats = auctions => {
  auctions = sortAuctions(auctions)

  const count = auctions.length
  const sum = _.sumBy(auctions, a => parseFloat(fromWei(a.current_price)))

  const average = sum / count
  const cheapest = fromWei(auctions[0].current_price)
  const cheapestUrl = getKittyUrl(auctions[0].kitty)
  const priciest = fromWei(auctions[auctions.length - 1].current_price)

  return {
    average,
    cheapest,
    priciest,
    cheapestUrl,
  }
}

console.log('RUNNING GET KITTIES')

getKitties()

setInterval(() => {
  console.log('RUNNING GET KITTIES')

  getKitties()
}, 30 * 1000)
