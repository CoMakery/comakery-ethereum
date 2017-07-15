import '../../testHelper'
import {expect} from 'chai'
import {d} from 'lightsaber'
import nock from 'nock'

const Token = require('../../lib/token')

describe('Token', () => {
  describe('.uploadSource', () => {
    beforeEach(() => {
      nock.cleanAll()
      nock.disableNetConnect()
    })
    it('should upload contract to ether camp', (done) => {
      const contractAddress = Token.deployContract().replace(/^0x/, '')
      const scope = nock('https://not-really.ether.camp')
      .post(`/api/v1/accounts/${contractAddress}/contract`)
      .reply(200, {success: true})

      Token.uploadSource(contractAddress, () => {
        expect(scope.isDone()).to.equal(true)
        done()
      })
    })
  })
})
