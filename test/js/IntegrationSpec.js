import './testHelper'
import {keys} from 'lodash'
import chai, {expect} from 'chai'
import chaiHttp from 'chai-http'
import {d} from 'lightsaber'

const server = require('../../lib/server')
const Token = require('../../lib/token')

chai.use(chaiHttp)

describe('POST /project', () => {
  it('should return a contract address', (done) => {
    chai
    .request(server)
    .post('/project')
    .send({ maxSupply: 101 })
    .then(function (res) {
      expect(res).to.have.status(200)
      const {body} = res
      expect(keys(body)).to.deep.equal(['contractAddress'])
      const {contractAddress} = body
      expect(contractAddress).to.match(/^0x[0-9a-f]{40}$/)
      const tokenContract = Token.loadContract(contractAddress)
      return tokenContract.maxSupply.call()
    }).then((maxSupply) => {
      expect(maxSupply.toNumber()).to.eq(101)
    }).then(done).catch(done)
  })

  it('should fail if no maxSupply sent', (done) => {
    chai
    .request(server)
    .post('/project')
    .send({})
    .catch(function (res) {
      expect(res).to.have.status(500)
      const {response: {text}} = res
      expect(text).to.match(/maxSupply/)
    }).then(done).catch(done)
  })
})

describe('POST /token_issue', () => {
  it('should return a transaction address', (done) => {
    const contractAddress = Token.deployContract()
    const recipient = '0x2b5ad5c4795c026514f8317c7a215e218dccd6cf'  // pubkey of private key 0x0000000000000000000000000000000000000000000000000000000000000002
    chai
    .request(server)
    .post('/token_issue')
    .send({ contractAddress, recipient, amount: 111 })
    .then(function (res) {
      expect(res).to.have.status(200)
      const {body} = res
      expect(keys(body)).to.deep.equal(['transactionId'])
      expect(body.transactionId).to.match(/^0x[0-9a-f]{64}$/)
    }).then(done).catch(done)
  })
})

/* Declare global variables for eslint to ignore: */
/* global describe */
/* global it */
