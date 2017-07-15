import '../../testHelper'
import {keys} from 'lodash'
import chai, {expect} from 'chai'
import chaiHttp from 'chai-http'
import {d, type} from 'lightsaber'
import sinon from 'sinon'

const DynamicToken = artifacts.require("DynamicToken.sol")
const server = require('../../lib/server').app
const Token = require('../../lib/token')

chai.use(chaiHttp)

describe('API', function() {
  this.timeout(30e3)

  beforeEach('', () => {
    process.env.API_KEY_WHITELIST = 'aaa,bbb'
  })

  describe('POST /project', () => {
    it('should return a contract address', (done) => {
      let token = sinon.mock(Token)
      token.expects('uploadSource').once()

      chai
      .request(server)
      .post('/project')
      .send({ maxSupply: 101, apiKey: 'aaa' })
      .then((res) => {
        expect(res).to.have.status(200)
        const {body} = res
        expect(keys(body)).to.deep.equal(['contractAddress'])
        const {contractAddress} = body

        expect(contractAddress).to.match(/^0x[0-9a-f]{40}$/)
        const tokenContract = Token.loadContract(contractAddress)
        return tokenContract.maxSupply.call()
      }).then((maxSupply) => {
        expect(maxSupply.toNumber()).to.eq(101)
        token.verify()
        token.restore()
        return
      }).then(done).catch(done)
    })

    it('should fail if no maxSupply sent', (done) => {
      chai
      .request(server)
      .post('/project')
      .send({ apiKey: 'aaa' })
      .then(() => {
        throw new Error('expected server 500 error, but none was thrown')
      }).catch((error) => {
        expect(type(error.response)).to.equal('object', error.message)
        expect(error.response.status).to.equal(500)
        expect(error.response.text).to.match(/maxSupply required but not found/)
      })
      .then(done)
      .catch(done)
    })

    it('should return 403 if security token not in whitelist', (done) => {
      chai
      .request(server)
      .post('/project')
      .send({ maxSupply: 101, apiKey: 'not a key in our whitelist' })
      .then(() => {
        throw new Error('expected server 403 error, but none was thrown')
      }).catch((error) => {
        expect(type(error.response)).to.equal('object', error.message)
        expect(error.response.status).to.equal(403)
        expect(error.response.text).to.match(/API key not found/)
        return
      })
      .then(done).catch(done)
    })
  })

  describe('POST /token_issue', () => {
    it('should return a transaction address', (done) => {
      const contractAddress = Token.deployContract()
      const recipient = '0x2b5ad5c4795c026514f8317c7a215e218dccd6cf'  // pubkey of private key 0x0000000000000000000000000000000000000000000000000000000000000002
      chai
      .request(server)
      .post('/token_issue')
      .send({ contractAddress, recipient, amount: 111, apiKey: 'aaa', proofId: 'proof1' })
      .then((res) => {
        expect(res).to.have.status(200)
        const {body} = res
        expect(keys(body)).to.deep.equal(['transactionId'])
        expect(body.transactionId).to.match(/^0x[0-9a-f]{64}$/)

        const tokenContract = Token.loadContract(contractAddress)
        return tokenContract.balanceOf.call(recipient)
      }).then((balanceOf) => {
        expect(balanceOf.toNumber()).to.eq(111)
        return
      }).then(done).catch(done)
    })

    it('should fail if missing params', (done) => {
      const contractAddress = Token.deployContract()
      const recipient = '0x2b5ad5c4795c026514f8317c7a215e218dccd6cf'  // pubkey of private key 0x0000000000000000000000000000000000000000000000000000000000000002
      chai
      .request(server)
      .post('/token_issue')
      .send({ contractAddress, recipient, apiKey: 'aaa' })
      .then(() => {
        throw new Error('hey no error was thrown and I thought it would be')
      })
      .catch((res) => {
        expect(res).to.have.status(500)
        const {response: {text}} = res
        expect(text).to.match(/amount.*is not a positive integer/)
      }).then(() => {
        const tokenContract = Token.loadContract(contractAddress)
        return tokenContract.balanceOf.call(recipient)
      }).then((balanceOf) => {
        expect(balanceOf.toNumber()).to.eq(0)
        return
      }).then(done).catch(done)
    })
  })
})
